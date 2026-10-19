import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Folder, 
  ChevronRight, 
  Video, 
  FileText, 
  Play, 
  Heart, 
  Send, 
  Users, 
  Search,
  BookOpen,
  FolderOpen,
  X,
  ChevronLeft,
  CheckCircle2,
  Volume2,
  Maximize2,
  ExternalLink,
  Award,
  Sparkles,
  ClipboardList
} from 'lucide-react';
import { Course, CourseDetailResponse, TreeNode, LectureVideo, LecturePdf, ActiveVideoState } from '../types';
import { extractCleanVideoId, getTargetBoardIframeSrc } from '../utils/videoHelper';
import { fetchCategoryPdfs } from '../utils/notesHelper';
import { fetchRealTests, RealTestItem } from '../utils/testsHelper';

interface CourseDetailViewProps {
  course: Course;
  detailData: CourseDetailResponse | null;
  loading: boolean;
  onBack: () => void;
  isSaved: boolean;
  onToggleSave: (course: Course) => void;
  onPlayVideo: (video: LectureVideo, chapterTitle: string, index: number) => void;
  onViewPdf: (pdf: LecturePdf, chapterTitle: string, index: number, categoryId?: string) => void;
  onJoinTelegram: () => void;
  onStartTest?: (test: { _id: string; name: string; totalQuestions?: number; totalTime?: number }) => void;
  activeVideo?: ActiveVideoState | null;
  onCloseActiveVideo?: () => void;
  onExpandVideoModal?: () => void;
  onNextLecture?: () => void;
  onPrevLecture?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export const CourseDetailView: React.FC<CourseDetailViewProps> = ({
  course,
  detailData,
  loading,
  onBack,
  isSaved,
  onToggleSave,
  onPlayVideo,
  onViewPdf,
  onJoinTelegram,
  onStartTest,
  activeVideo,
  onCloseActiveVideo,
  onExpandVideoModal,
  onNextLecture,
  onPrevLecture,
  hasNext,
  hasPrev
}) => {
  // Navigation stack for drill-down navigation (like official TargetBoard app in video)
  const [navStack, setNavStack] = useState<TreeNode[]>([]);
  // Current folder in view (or root if stack is empty)
  const currentNode = navStack.length > 0 ? navStack[navStack.length - 1] : null;

  // Content Tab: 'videos' | 'pdfs' | 'tests'
  const [contentTab, setContentTab] = useState<'videos' | 'pdfs' | 'tests'>('videos');
  // Local search filter inside current course
  const [localSearch, setLocalSearch] = useState<string>('');
  const [chapterTests, setChapterTests] = useState<RealTestItem[]>([]);

  useEffect(() => {
    if (contentTab === 'tests' && course?.id) {
      fetchRealTests(course.id, currentNode?.id).then(t => {
        if (t && t.length > 0) setChapterTests(t);
      }).catch(() => {});
    }
  }, [contentTab, course?.id, currentNode?.id]);

  const cleanInlineVideoId = extractCleanVideoId(
    activeVideo?.assetId || activeVideo?.videoUrl || activeVideo?.embedUrl,
    true
  );

  const hasValidInlineId = Boolean(cleanInlineVideoId && typeof cleanInlineVideoId === 'string' && cleanInlineVideoId.trim().length > 0);
  const inlinePlayerSrc = hasValidInlineId ? getTargetBoardIframeSrc(cleanInlineVideoId, activeVideo?.title) : '';

  // Auto-scroll to video player when lecture starts
  useEffect(() => {
    if (activeVideo && hasValidInlineId) {
      setTimeout(() => {
        const el = document.getElementById('active-video-player');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 50);
    }
  }, [activeVideo, hasValidInlineId]);

  // Items to display at current level:
  // If at root: top tree folders
  // If inside a folder: currentNode.children
  const currentFolders = currentNode ? (currentNode.children || []) : (detailData?.tree || []);

  // Content inside current folder (videos, pdfs, tests)
  const currentVideos = currentNode?.videos || [];
  const currentPdfs = currentNode?.pdfs || [];
  const currentTests = currentNode?.tests || [];

  const hasContent = currentVideos.length > 0 || currentPdfs.length > 0 || currentTests.length > 0;
  const hasSubfolders = currentFolders.length > 0;

  // When opening a folder with PDFs, pre-fetch real PDF links in background
  const handleOpenFolder = (node: TreeNode) => {
    setNavStack(prev => [...prev, node]);
    setLocalSearch('');
    // Auto-select first available tab if opening content
    if (node.videos && node.videos.length > 0) {
      setContentTab('videos');
    } else if (node.pdfs && node.pdfs.length > 0) {
      setContentTab('pdfs');
    } else if (node.tests && node.tests.length > 0) {
      setContentTab('tests');
    }
    if (node.pdfs && node.pdfs.length > 0) {
      fetchCategoryPdfs(node.id).catch(() => {});
    }
  };

  const handleNavBack = () => {
    if (navStack.length > 0) {
      setNavStack(prev => prev.slice(0, -1));
    } else {
      onBack();
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      setNavStack([]);
    } else {
      setNavStack(prev => prev.slice(0, index + 1));
    }
  };

  const thumbnail = course.thumbnail || 'https://i.ibb.co/0R7qc34v/1093.jpg';

  // Filtered lists for search
  const filteredFolders = currentFolders.filter(f => 
    !localSearch || f.name.toLowerCase().includes(localSearch.toLowerCase())
  );
  const filteredVideos = currentVideos.filter(v => 
    !localSearch || v.title.toLowerCase().includes(localSearch.toLowerCase())
  );
  const filteredPdfs = currentPdfs.filter(p => 
    !localSearch || p.title.toLowerCase().includes(localSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      
      {/* Top Header Bar with Back Button & Title (Matching TargetBoard App Video) */}
      <div className="sticky top-16 z-30 -mx-3 sm:-mx-6 lg:-mx-8 px-3 sm:px-6 lg:px-8 py-3 bg-[#110717]/95 backdrop-blur-xl border-b border-pink-500/20 flex items-center justify-between gap-2 shadow-lg">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button
            onClick={handleNavBack}
            className="p-2 sm:p-2.5 rounded-xl bg-pink-950/60 hover:bg-pink-900 text-pink-300 hover:text-white border border-pink-500/30 transition cursor-pointer active:scale-95 shrink-0"
            title="Go Back"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400" />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-lg font-bold text-white font-heading truncate">
              {currentNode ? currentNode.name : course.name}
            </h1>
            <p className="text-[10px] sm:text-xs text-pink-300/70 font-semibold truncate">
              {currentNode ? `${course.name} • Class ${course.group || 'All'}` : `Class ${course.group || 'All'} • Verified Curriculum`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Enroll / Save button */}
          <button
            onClick={() => onToggleSave(course)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
              isSaved
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'btn-pink-gradient text-white shadow-md shadow-pink-600/30'
            }`}
          >
            {isSaved ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Enrolled</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Enroll</span>
              </>
            )}
          </button>

          <button
            onClick={onJoinTelegram}
            className="p-2 rounded-xl bg-pink-950/60 hover:bg-pink-900 text-pink-300 hover:text-white border border-pink-500/30 transition cursor-pointer active:scale-95"
            title="Telegram Study Group"
          >
            <Send className="w-4 h-4 text-pink-400" />
          </button>
        </div>
      </div>

      {/* Breadcrumb Navigation Trail */}
      {navStack.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-pink-300/80 overflow-x-auto py-1 scrollbar-none">
          <button
            onClick={() => handleBreadcrumbClick(-1)}
            className="text-pink-400 hover:text-white underline font-bold shrink-0 cursor-pointer"
          >
            All Subjects
          </button>
          {navStack.map((step, idx) => (
            <React.Fragment key={step.id}>
              <ChevronRight className="w-3.5 h-3.5 text-pink-500/50 shrink-0" />
              <button
                onClick={() => handleBreadcrumbClick(idx)}
                className={`truncate max-w-[140px] sm:max-w-[200px] cursor-pointer ${
                  idx === navStack.length - 1 ? 'text-white font-bold' : 'text-pink-300/70 hover:text-white'
                }`}
              >
                {step.name}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Course Banner Card (Shown only on root level when not playing video) */}
      {navStack.length === 0 && !activeVideo && (
        <div className="p-4 sm:p-6 rounded-3xl glass-card border border-pink-500/25 relative overflow-hidden flex flex-col md:flex-row items-center gap-5">
          <div className="relative w-full md:w-64 aspect-video rounded-2xl overflow-hidden shrink-0 border border-pink-500/30">
            <img 
              src={thumbnail} 
              alt={course.name} 
              className="w-full h-full object-cover" 
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://i.ibb.co/0R7qc34v/1093.jpg'; }}
            />
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-black/80 text-pink-300 border border-pink-500/30">
              100% FREE BATCH
            </div>
          </div>

          <div className="flex-1 space-y-2 text-center md:text-left">
            <span className="text-xs font-bold text-pink-400 uppercase tracking-wider">
              Class {course.group || 'Board'} Batch 2026-27
            </span>
            <h2 className="text-lg sm:text-2xl font-black text-white font-heading">
              {course.name}
            </h2>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-pink-200/80 pt-1">
              <span className="px-2.5 py-1 rounded-xl bg-pink-950/60 border border-pink-500/20 flex items-center gap-1.5 font-mono">
                <Video className="w-3.5 h-3.5 text-pink-400" />
                {course.total_videos || 0} Videos
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-pink-950/60 border border-pink-500/20 flex items-center gap-1.5 font-mono">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                {course.total_pdfs || 0} Notes
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-pink-950/60 border border-pink-500/20 flex items-center gap-1.5 font-mono">
                <Folder className="w-3.5 h-3.5 text-amber-400" />
                {course.total_folders || 0} Folders
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Active Video Player (if a lecture was clicked) */}
      {activeVideo && hasValidInlineId && inlinePlayerSrc && (
        <div id="active-video-player" className="glass-card rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-pink-500 shadow-2xl shadow-pink-600/30 animate-in fade-in slide-in-from-top-4 duration-300 scroll-mt-20">
          <div className="p-3 sm:p-4 bg-[#1b0d26] border-b border-pink-500/25 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-pink-500 text-white flex items-center justify-center shrink-0">
                <Volume2 className="w-4 h-4 animate-pulse" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider block">
                  Lecture #{activeVideo.index || 1} • Now Playing
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-white truncate font-heading">
                  {activeVideo.title}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onExpandVideoModal && (
                <button
                  onClick={onExpandVideoModal}
                  className="p-1.5 rounded-lg bg-pink-950/60 hover:bg-pink-900 text-pink-300 hover:text-white border border-pink-500/30 transition cursor-pointer"
                  title="Expand to Fullscreen Modal"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              )}
              {onCloseActiveVideo && (
                <button
                  onClick={onCloseActiveVideo}
                  className="p-1.5 rounded-lg bg-pink-950/60 hover:bg-pink-900 text-pink-300 hover:text-white border border-pink-500/30 transition cursor-pointer"
                  title="Close player"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Video Iframe Stream */}
          <div className="relative aspect-video w-full bg-black">
            <iframe
              src={inlinePlayerSrc}
              title={activeVideo.title || 'GB STUDY Lecture Stream'}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          {/* Next / Previous Lecture Controls */}
          <div className="p-2.5 sm:p-3 bg-[#160b20] border-t border-pink-500/20 flex items-center justify-between text-xs text-pink-300">
            <div className="flex items-center gap-3">
              {hasPrev && onPrevLecture && (
                <button onClick={onPrevLecture} className="hover:text-white font-bold cursor-pointer">
                  ← Previous Lecture
                </button>
              )}
              {hasNext && onNextLecture && (
                <button onClick={onNextLecture} className="hover:text-white font-bold cursor-pointer">
                  Next Lecture →
                </button>
              )}
            </div>
            <a
              href={inlinePlayerSrc}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white underline font-semibold flex items-center gap-1"
            >
              <span>TargetBoard Stream</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Search Input Filter within Current Course */}
      <div className="relative">
        <Search className="w-4 h-4 text-pink-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder={currentNode ? `Search in ${currentNode.name}...` : `Search all chapters & topics in ${course.name}...`}
          className="w-full bg-[#160c1d] border border-pink-500/25 rounded-2xl py-2.5 pl-10 pr-10 text-xs sm:text-sm text-white placeholder-pink-300/40 focus:outline-none focus:border-pink-500 transition"
        />
        {localSearch && (
          <button
            onClick={() => setLocalSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-pink-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* VIEW LEVEL 1: Subfolders / Subjects / Chapters List */}
      {hasSubfolders && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-pink-300/80 uppercase tracking-wider px-1">
            <span>{currentNode ? 'Folders / Chapters' : 'Subjects & Batches'}</span>
            <span className="font-mono text-pink-400">{filteredFolders.length} Folders</span>
          </div>

          <div className="space-y-2.5">
            {filteredFolders.map((folder) => {
              const totalItems = (folder.children?.length || 0) + (folder.videos?.length || 0) + (folder.pdfs?.length || 0);
              return (
                <div
                  key={folder.id}
                  onClick={() => handleOpenFolder(folder)}
                  className="p-3.5 sm:p-4 rounded-2xl bg-[#160c1d] hover:bg-pink-950/60 border border-pink-500/20 hover:border-pink-500/50 shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 group-hover:bg-amber-500 group-hover:text-black flex items-center justify-center shrink-0 transition-all shadow-sm">
                      <Folder className="w-5 h-5 fill-current" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-sm md:text-base font-bold text-white group-hover:text-pink-300 transition line-clamp-2 font-heading">
                        {folder.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] sm:text-[11px] text-pink-300/60 font-semibold">
                        {folder.children && folder.children.length > 0 && (
                          <span>📁 {folder.children.length} {folder.children.length === 1 ? 'Subject' : 'Topics'}</span>
                        )}
                        {folder.videos && folder.videos.length > 0 && (
                          <span>🎥 {folder.videos.length} Videos</span>
                        )}
                        {folder.pdfs && folder.pdfs.length > 0 && (
                          <span>📄 {folder.pdfs.length} PDFs</span>
                        )}
                        {totalItems === 0 && <span>Curriculum Module</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 text-pink-400 group-hover:translate-x-1 transition-transform">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW LEVEL 2: Dedicated Content Tabs (Video | PDF | Test) Matching Video at 0:39 */}
      {hasContent && (
        <div className="space-y-4 pt-2">
          {/* Top 3 Tabs: Video | PDF | Test */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#13081a] border border-pink-500/25 max-w-md mx-auto shadow-lg">
            <button
              onClick={() => setContentTab('videos')}
              className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 ${
                contentTab === 'videos'
                  ? 'btn-pink-gradient text-white shadow-md shadow-pink-600/30'
                  : 'text-pink-300/70 hover:text-white'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Video ({currentVideos.length})</span>
            </button>

            <button
              onClick={() => setContentTab('pdfs')}
              className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 ${
                contentTab === 'pdfs'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-pink-300/70 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>PDF ({currentPdfs.length})</span>
            </button>

            <button
              onClick={() => setContentTab('tests')}
              className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 ${
                contentTab === 'tests'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-md shadow-amber-500/30'
                  : 'text-pink-300/70 hover:text-white'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Test ({currentTests.length || (currentVideos.length > 0 ? 1 : 0)})</span>
            </button>
          </div>

          {/* TAB 1: VIDEOS LIST (Matching TargetBoard App with Red Play Button) */}
          {contentTab === 'videos' && (
            <div className="space-y-2.5">
              {filteredVideos.length > 0 ? (
                filteredVideos.map((video, vIdx) => {
                  const cleanAsset = extractCleanVideoId(video.asset, false) || video.asset;
                  const isCurrent = Boolean(cleanInlineVideoId && cleanInlineVideoId === cleanAsset);
                  return (
                    <div
                      key={`${video.asset}_${vIdx}`}
                      onClick={() => onPlayVideo({ ...video, asset: cleanAsset }, currentNode?.name || course.name, vIdx + 1)}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 group active:scale-[0.99] ${
                        isCurrent
                          ? 'bg-pink-950/80 border-pink-500 shadow-lg shadow-pink-600/40 ring-1 ring-pink-500'
                          : 'bg-[#160c1d] hover:bg-pink-950/50 border-pink-500/20 hover:border-pink-500/50 shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Red Circular Play Button Icon (Like TargetBoard in Video) */}
                        <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform ${
                          isCurrent
                            ? 'bg-pink-500 text-white shadow-md'
                            : 'bg-rose-500/20 text-rose-400 group-hover:bg-rose-600 group-hover:text-white group-hover:scale-105 border border-rose-500/30'
                        }`}>
                          {isCurrent ? <Volume2 className="w-5 h-5 animate-pulse" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                        </div>

                        <div className="min-w-0">
                          <h4 className={`text-xs sm:text-sm font-bold truncate transition ${
                            isCurrent ? 'text-pink-300' : 'text-white group-hover:text-pink-300'
                          }`}>
                            {video.title}
                          </h4>
                          <span className="text-[10px] text-pink-300/60 font-semibold block mt-0.5">
                            Lecture #{vIdx + 1} • Video
                          </span>
                        </div>
                      </div>

                      <button
                        className={`py-1.5 px-3 sm:px-4 rounded-xl font-bold text-xs shrink-0 flex items-center gap-1 transition ${
                          isCurrent
                            ? 'bg-pink-500 text-white shadow-md'
                            : 'btn-pink-gradient text-white shadow-md shadow-pink-600/30'
                        }`}
                      >
                        <span>{isCurrent ? 'Playing' : 'Play'}</span>
                        <Play className="w-3 h-3 fill-current" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center rounded-2xl bg-[#160c1d] border border-pink-500/20 text-pink-300/70 text-xs">
                  No video lectures found for this chapter.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PDF NOTES LIST (Matching TargetBoard App with Golden Document Icon) */}
          {contentTab === 'pdfs' && (
            <div className="space-y-2.5">
              {filteredPdfs.length > 0 ? (
                filteredPdfs.map((pdf, pIdx) => (
                  <div
                    key={`${pdf.title}_${pIdx}`}
                    onClick={() => onViewPdf({ ...pdf, categoryId: currentNode?.id, courseId: course.id }, currentNode?.name || course.name, pIdx + 1, currentNode?.id)}
                    className="p-3.5 sm:p-4 rounded-2xl bg-[#160c1d] hover:bg-emerald-950/40 border border-emerald-500/20 hover:border-emerald-500/50 shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 group active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Golden/Amber PDF Document Icon (Like TargetBoard in Video) */}
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 group-hover:bg-amber-500 group-hover:text-black flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-sm">
                        <FileText className="w-5 h-5" />
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300 transition truncate">
                          {pdf.title}
                        </h4>
                        <span className="text-[10px] text-emerald-400/80 font-semibold block mt-0.5">
                          PDF Document • Verified Digital Panel Note #{pIdx + 1}
                        </span>
                      </div>
                    </div>

                    <button className="py-1.5 px-3 sm:px-4 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/40 shrink-0 flex items-center gap-1 shadow-md shadow-emerald-600/30">
                      <span>Read Notes</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center rounded-2xl bg-[#160c1d] border border-pink-500/20 text-pink-300/70 text-xs">
                  No PDF notes uploaded for this chapter yet.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TESTS (Matching TargetBoard App with Start Test Button) */}
          {contentTab === 'tests' && (
            <div className="space-y-2.5">
              {chapterTests.length > 0 ? (
                chapterTests.map((t) => (
                  <div 
                    key={t._id}
                    className="p-4 rounded-2xl bg-[#160c1d] border border-pink-500/20 hover:border-pink-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Official Test
                        </span>
                        <span className="text-xs text-pink-300/70 font-mono">
                          {t.type || 'Board Mock Test'}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-pink-300 transition">
                        {t.name}
                      </h4>
                      <div className="flex items-center gap-3 text-[11px] text-pink-300/80 font-mono">
                        <span>{t.totalQuestions || 50} Questions</span>
                        <span>•</span>
                        <span>{t.totalTime || 45} Minutes</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (onStartTest) {
                          onStartTest(t);
                        } else {
                          window.open(`https://targetboard.co.in/dashboard/test/${t._id}/start`, '_blank');
                        }
                      }}
                      className="btn-pink-gradient py-2 px-4 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 shrink-0 shadow-md shadow-pink-600/30 cursor-pointer active:scale-95 transition"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Test →</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-2xl bg-[#160c1d] border border-pink-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Chapter Test
                      </span>
                      <span className="text-xs text-pink-300/70 font-mono">
                        {currentNode?.name || 'Full Chapter'}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white">
                      {currentNode?.name ? `${currentNode.name} ( TEST )` : 'Chapter Practice Test'}
                    </h4>
                    <div className="flex items-center gap-3 text-[11px] text-pink-300/80 font-mono">
                      <span>50 Questions</span>
                      <span>•</span>
                      <span>45 Minutes</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (onStartTest) {
                        onStartTest({
                          _id: currentNode?.id || course.id,
                          name: currentNode?.name ? `${currentNode.name} Test` : 'Chapter Test',
                          totalQuestions: 50,
                          totalTime: 45
                        });
                      } else {
                        onJoinTelegram();
                      }
                    }}
                    className="btn-pink-gradient py-2 px-4 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 shrink-0 shadow-md shadow-pink-600/30 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Test →</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Loading state indicator */}
      {loading && (
        <div className="p-12 text-center text-pink-300/60 text-xs">
          Loading course contents...
        </div>
      )}
    </div>
  );
};
