import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  FileText, 
  CheckCircle2, 
  ExternalLink, 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  Share2, 
  AlertCircle,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { resolveRealPdf, getPdfViewerUrls, CachedPdfItem } from '../utils/notesHelper';

interface PdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  courseTitle?: string;
  chapterTitle?: string;
  pdfIndex?: number;
  categoryId?: string;
  courseId?: string;
  pdfUrl?: string;
}

export const PdfModal: React.FC<PdfModalProps> = ({
  isOpen,
  onClose,
  title,
  courseTitle,
  chapterTitle,
  pdfIndex,
  categoryId,
  courseId,
  pdfUrl: initialPdfUrl
}) => {
  const [resolvedPdf, setResolvedPdf] = useState<CachedPdfItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Dedicated HD Canvas Reader (PDF.js) State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNum, setPageNum] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.25);
  const [rotation, setRotation] = useState<number>(0);
  const [canvasLoading, setCanvasLoading] = useState<boolean>(false);
  const [canvasError, setCanvasError] = useState<string | null>(null);

  // Resolve authentic PDF URL when modal opens
  useEffect(() => {
    if (!isOpen) {
      setResolvedPdf(null);
      setLoading(true);
      setPdfDoc(null);
      setPageNum(1);
      setNumPages(0);
      setCanvasError(null);
      return;
    }

    let isMounted = true;

    async function loadPdf() {
      setLoading(true);

      // If direct PDF URL is already provided
      if (initialPdfUrl && typeof initialPdfUrl === 'string' && initialPdfUrl.startsWith('http')) {
        if (isMounted) {
          setResolvedPdf({
            title: title || 'Lecture PDF Note',
            url: initialPdfUrl,
            fileName: initialPdfUrl.split('/').pop() || 'Note.pdf'
          });
          setLoading(false);
        }
        return;
      }

      // Resolve authentic PDF from category or global cache
      try {
        const found = await resolveRealPdf(categoryId, title, pdfIndex);
        if (isMounted) {
          if (found) {
            setResolvedPdf(found);
          } else {
            setResolvedPdf(null);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Error resolving authentic PDF:', err);
        if (isMounted) {
          setResolvedPdf(null);
          setLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, [isOpen, categoryId, title, pdfIndex, initialPdfUrl]);

  const currentPdfUrl = resolvedPdf?.url || initialPdfUrl || '';
  const effectiveTitle = title || resolvedPdf?.title || 'Lecture PDF Note';

  // Load PDF.js and document into HD Reader
  useEffect(() => {
    if (!isOpen || !currentPdfUrl) return;

    let isCancelled = false;

    async function initPdfJs() {
      setCanvasLoading(true);
      setCanvasError(null);

      try {
        // Ensure PDF.js script is loaded from CDN
        if (!(window as any).pdfjsLib) {
          await new Promise<void>((resolve, reject) => {
            const existingScript = document.getElementById('pdfjs-script');
            if (existingScript) {
              existingScript.addEventListener('load', () => resolve());
              existingScript.addEventListener('error', reject);
              return;
            }
            const script = document.createElement('script');
            script.id = 'pdfjs-script';
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = () => resolve();
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        const pdfjsLib = (window as any).pdfjsLib;
        if (!pdfjsLib) throw new Error('PDF.js library failed to initialize');

        // Configure worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        // Load document (first try direct, fallback to proxy if blocked)
        let docPromise: any = null;
        try {
          const loadingTask = pdfjsLib.getDocument({
            url: currentPdfUrl,
            cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
            cMapPacked: true
          });
          docPromise = await loadingTask.promise;
        } catch (directErr) {
          console.warn('Direct PDF load failed, trying proxy stream:', directErr);
          const proxyUrl = `/api/pdf/proxy?url=${encodeURIComponent(currentPdfUrl)}`;
          const proxyTask = pdfjsLib.getDocument({
            url: proxyUrl,
            cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
            cMapPacked: true
          });
          docPromise = await proxyTask.promise;
        }

        if (isCancelled) return;

        setPdfDoc(docPromise);
        setNumPages(docPromise.numPages);
        setPageNum(1);
        setCanvasLoading(false);
      } catch (err: any) {
        console.error('HD Reader error:', err);
        if (!isCancelled) {
          setCanvasError('Could not load PDF document. You can still download the file or open it directly.');
          setCanvasLoading(false);
        }
      }
    }

    initPdfJs();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, currentPdfUrl]);

  // Render canvas page in High Definition (DPR scaled)
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let renderTask: any = null;

    async function renderPage() {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        const viewport = page.getViewport({ scale, rotation });
        const dpr = window.devicePixelRatio || 1;

        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        context.setTransform(dpr, 0, 0, dpr, 0, 0);

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        renderTask = page.render(renderContext);
        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Page render error:', err);
        }
      }
    }

    renderPage();

    return () => {
      if (renderTask) {
        try { renderTask.cancel(); } catch {}
      }
    };
  }, [pdfDoc, pageNum, scale, rotation]);

  // Keyboard navigation for page flip
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        setPageNum(p => Math.min(numPages || 1, p + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setPageNum(p => Math.max(1, p - 1));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, numPages, onClose]);

  if (!isOpen) return null;

  const handlePrint = () => {
    if (currentPdfUrl) {
      window.open(currentPdfUrl, '_blank');
    } else {
      window.print();
    }
  };

  const handleDownload = () => {
    if (!currentPdfUrl) return;
    const a = document.createElement('a');
    a.href = currentPdfUrl;
    a.download = resolvedPdf?.fileName || `${effectiveTitle.replace(/[^a-zA-Z0-9\s]/g, '_')}.pdf`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    const shareUrl = currentPdfUrl || window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: effectiveTitle,
          text: `Read verified note: ${effectiveTitle} on GB STUDY`,
          url: shareUrl
        });
        return;
      } catch {}
    }
    navigator.clipboard?.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className={`relative w-full ${
          isFullscreen 
            ? 'max-w-none h-full rounded-none' 
            : 'max-w-5xl h-[94vh] sm:h-[90vh] rounded-2xl sm:rounded-3xl'
        } bg-[#120818] border-2 border-pink-500/40 shadow-2xl shadow-pink-600/30 overflow-hidden flex flex-col transition-all duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="px-3 py-2.5 sm:px-6 sm:py-3.5 bg-gradient-to-r from-[#1c0c28] via-[#160a20] to-[#120818] border-b border-pink-500/25 flex items-center justify-between gap-2 sm:gap-4 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase shrink-0">
                {pdfIndex ? `Note #${pdfIndex}` : 'HD Digital Note'}
              </span>
              <span className="text-[11px] sm:text-xs text-pink-300/80 font-semibold truncate">
                {courseTitle || 'GB STUDY Panel'}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white font-heading truncate mt-0.5">
              {effectiveTitle}
            </h3>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Download Button */}
            {currentPdfUrl && (
              <button
                onClick={handleDownload}
                className="btn-pink-gradient px-2.5 sm:px-3.5 py-1.5 rounded-xl font-bold text-xs text-white flex items-center gap-1.5 shadow-md shadow-pink-600/30 hover:scale-[1.02] active:scale-95 transition cursor-pointer"
                title="Download original authentic PDF file"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download PDF</span>
              </button>
            )}

            {/* Direct Open in New Tab */}
            {currentPdfUrl && (
              <button
                onClick={() => window.open(currentPdfUrl, '_blank', 'noopener,noreferrer')}
                className="p-1.5 sm:p-2 rounded-xl bg-pink-950/60 hover:bg-pink-900 text-pink-300 hover:text-white border border-pink-500/30 transition cursor-pointer"
                title="Open raw PDF file in new browser tab"
                aria-label="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            )}

            {/* Print */}
            <button
              onClick={handlePrint}
              className="hidden md:flex p-1.5 sm:p-2 rounded-xl bg-pink-950/60 hover:bg-pink-900 text-pink-300 hover:text-white border border-pink-500/30 transition cursor-pointer"
              title="Print document"
              aria-label="Print"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(prev => !prev)}
              className="p-1.5 sm:p-2 rounded-xl bg-pink-950/60 hover:bg-pink-900 text-pink-300 hover:text-white border border-pink-500/30 transition cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              aria-label="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Modal */}
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl bg-pink-950/80 hover:bg-rose-900 text-rose-300 hover:text-white border border-pink-500/40 transition cursor-pointer ml-1"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dedicated HD Reader Toolbar (Navigation, Zoom & Rotation) */}
        <div className="px-3 py-2 sm:px-6 sm:py-2.5 bg-[#160a20] border-b border-pink-500/20 flex items-center justify-between flex-wrap gap-2 text-xs shrink-0">
          <div className="flex items-center gap-2 text-pink-300/90 font-medium truncate">
            {chapterTitle ? (
              <span className="truncate flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                <span className="truncate">{chapterTitle}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Official HD Panel Notes
              </span>
            )}
          </div>

          {/* HD Reader Interactive Controls */}
          {currentPdfUrl && numPages > 0 && (
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* Page Navigator */}
              <div className="flex items-center gap-1 bg-[#0d0613] p-1 rounded-xl border border-pink-500/25">
                <button
                  disabled={pageNum <= 1}
                  onClick={() => setPageNum(p => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg bg-pink-950/60 hover:bg-pink-900 text-pink-300 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                  title="Previous Page (Left Arrow)"
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="font-mono text-xs text-white font-bold px-2 whitespace-nowrap">
                  {pageNum} / {numPages}
                </span>

                <button
                  disabled={pageNum >= numPages}
                  onClick={() => setPageNum(p => Math.min(numPages, p + 1))}
                  className="p-1.5 rounded-lg bg-pink-950/60 hover:bg-pink-900 text-pink-300 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                  title="Next Page (Right Arrow)"
                  aria-label="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-[#0d0613] p-1 rounded-xl border border-pink-500/25">
                <button
                  onClick={() => setScale(s => Math.max(0.6, s - 0.2))}
                  className="p-1.5 rounded-lg bg-pink-950/60 hover:bg-pink-900 text-pink-300 transition cursor-pointer"
                  title="Zoom Out"
                  aria-label="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setScale(1.25)}
                  className="font-mono text-[11px] text-pink-200 font-bold px-1.5 hover:text-white cursor-pointer"
                  title="Reset Zoom to 100%"
                >
                  {Math.round(scale * 100)}%
                </button>

                <button
                  onClick={() => setScale(s => Math.min(3.0, s + 0.2))}
                  className="p-1.5 rounded-lg bg-pink-950/60 hover:bg-pink-900 text-pink-300 transition cursor-pointer"
                  title="Zoom In"
                  aria-label="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setRotation(r => (r + 90) % 360)}
                  className="p-1.5 rounded-lg bg-pink-950/60 hover:bg-pink-900 text-pink-300 transition cursor-pointer ml-0.5"
                  title="Rotate 90°"
                  aria-label="Rotate Page"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content Body: Pure HD Reader Canvas */}
        <div 
          ref={containerRef}
          className="relative flex-1 bg-[#0b0510] overflow-auto flex flex-col items-center justify-start p-2 sm:p-4"
        >
          {/* Initial URL resolving spinner */}
          {loading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-[#0e0714] text-center space-y-4">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 rounded-full border-4 border-pink-500/20 border-t-pink-500 animate-spin" />
                <div className="absolute inset-2 rounded-full border-2 border-emerald-500/30 border-b-emerald-400 animate-spin" style={{ animationDirection: 'reverse' }} />
                <FileText className="absolute inset-0 m-auto w-6 h-6 text-pink-400 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white font-heading">
                  Loading Real Lecture Note...
                </h4>
                <p className="text-xs text-pink-300/70 max-w-sm">
                  Connecting to TargetBoard Digital Repository & preparing HD Reader.
                </p>
              </div>
            </div>
          )}

          {/* Canvas Rendering Loading Spinner */}
          {!loading && canvasLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0d0612]/90 backdrop-blur-sm">
              <RefreshCw className="w-8 h-8 text-pink-400 animate-spin mb-2" />
              <p className="text-xs text-pink-200 font-semibold">Rendering HD Note Pages...</p>
            </div>
          )}

          {/* Canvas Display */}
          {!loading && currentPdfUrl && !canvasError && (
            <div className="my-auto max-w-full flex items-center justify-center">
              <div className="shadow-2xl rounded-xl overflow-hidden border border-pink-500/30 bg-white">
                <canvas ref={canvasRef} className="block max-w-full h-auto" />
              </div>
            </div>
          )}

          {/* Error State */}
          {!loading && canvasError && (
            <div className="my-auto p-6 sm:p-8 text-center space-y-4 max-w-md">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-white">Could Not Render in HD Reader</h4>
              <p className="text-xs text-pink-300/80 leading-relaxed">
                {canvasError}
              </p>
              {currentPdfUrl && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <a
                    href={currentPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-pink-gradient py-2 px-4 rounded-xl font-bold text-xs text-white flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open in Browser</span>
                  </a>
                  <button
                    onClick={handleDownload}
                    className="py-2 px-4 rounded-xl font-bold text-xs bg-pink-950/60 hover:bg-pink-900 border border-pink-500/30 text-pink-200 flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Fallback when URL was not found */}
          {!loading && !currentPdfUrl && (
            <div className="my-auto p-6 sm:p-10 text-center space-y-6 max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 mx-auto shadow-xl">
                <AlertCircle className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h4 className="text-lg font-bold text-white font-heading">
                  {effectiveTitle}
                </h4>
                <p className="text-xs sm:text-sm text-pink-300/80 leading-relaxed">
                  This note is linked with the official TargetBoard curriculum.
                </p>
              </div>

              {courseId && (
                <a
                  href={`https://targetboard.co.in/dashboard/course/${courseId}/categories${categoryId ? `/${categoryId}` : ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-pink-gradient py-2.5 px-5 rounded-xl font-bold text-xs text-white inline-flex items-center gap-2 shadow-lg"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Chapter in TargetBoard
                </a>
              )}
            </div>
          )}
        </div>

        {/* Footer Info Bar */}
        <div className="px-3 py-2 sm:px-6 sm:py-2.5 bg-[#170a22] border-t border-pink-500/20 flex items-center justify-between flex-wrap gap-2 text-[11px] text-pink-400/80 shrink-0">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              HD Reader Mode Active
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline text-pink-300/70">
              Flip pages with Left/Right arrow keys
            </span>
          </div>

          <div className="flex items-center gap-3">
            {currentPdfUrl && (
              <a
                href={currentPdfUrl}
                download={resolvedPdf?.fileName || 'notes.pdf'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-300 hover:text-white underline font-semibold transition"
              >
                Direct File
              </a>
            )}
            <button
              onClick={handleShare}
              className="text-pink-300 hover:text-white transition flex items-center gap-1 cursor-pointer"
            >
              <Share2 className="w-3 h-3" />
              <span>{copiedLink ? 'Copied!' : 'Share'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
