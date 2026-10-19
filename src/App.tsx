import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Video, 
  FileText, 
  Users, 
  Send, 
  Search, 
  GraduationCap, 
  BookOpen, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  FolderOpen,
  X,
  Phone,
  KeyRound,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { Course, CourseDetailResponse, LectureVideo, LecturePdf, TreeNode, ActiveVideoState } from './types';
import { Navbar } from './components/Navbar';
import { CourseCard } from './components/CourseCard';
import { CourseDetailView } from './components/CourseDetailView';
import { SavedBatchesView } from './components/SavedBatchesView';
import { TelegramModal } from './components/TelegramModal';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { PdfModal } from './components/PdfModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { BottomNavigationBar, BottomNavTabId } from './components/BottomNavigationBar';
import { StoreModal } from './components/StoreModal';
import { TestsModal } from './components/TestsModal';
import { TestRunnerModal } from './components/TestRunnerModal';
import { LiveClassesSection } from './components/LiveClassesSection';
import { StreamPlayerModal, LiveStreamData } from './components/StreamPlayerModal';
import { Footer } from './components/Footer';
import { extractCleanVideoId, getTargetBoardIframeSrc } from './utils/videoHelper';

export default function App() {
  // Courses catalog state
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState<boolean>(true);

  // User Authentication & OTP login modal state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('gb_study_auth') === 'true';
    } catch {
      return false;
    }
  });
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [phone, setPhone] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [authStep, setAuthStep] = useState<'phone' | 'otp' | 'success'>('phone');
  const [authError, setAuthError] = useState<string>('');
  const [timer, setTimer] = useState<number>(30);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<{ phone: string; name: string } | null>(() => {
    try {
      const stored = localStorage.getItem('gb_study_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Countdown timer for OTP
  useEffect(() => {
    let interval: any;
    if (showLoginModal && authStep === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [showLoginModal, authStep, timer]);

  // Handle Send OTP
  const handleSendOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setAuthError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setAuthError('');
    setAuthStep('otp');
    setOtp('');
    setTimer(30);
    setCanResend(false);
  };

  // Handle Verify & Login Button (Entering ANY 6-digit number logs the user in)
  const handleVerifyOtp = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    const cleanOtp = otp.trim();
    if (cleanOtp.length === 6) {
      setIsAuthenticated(true);
      const cleanPhone = phone.replace(/\D/g, '') || '9876543210';
      const user = { phone: cleanPhone, name: `Student (${cleanPhone.slice(-4)})` };
      setCurrentUser(user);
      try {
        localStorage.setItem('gb_study_auth', 'true');
        localStorage.setItem('gb_study_user', JSON.stringify(user));
      } catch {}
      setAuthStep('success');
      setAuthError('');
      setShowLoginModal(false);
    } else {
      setAuthError('Please enter a valid 6-digit OTP.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setPhone('');
    setOtp('');
    setAuthStep('phone');
    try {
      localStorage.removeItem('gb_study_auth');
      localStorage.removeItem('gb_study_user');
    } catch {}
  };

  // Active view: 'home' | 'course' | 'saved'
  const [view, setView] = useState<'home' | 'course' | 'saved'>('home');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Course detail & folder tree data
  const [courseDetail, setCourseDetail] = useState<CourseDetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  // Saved / Bookmarked courses in localStorage
  const [savedCourses, setSavedCourses] = useState<Course[]>(() => {
    try {
      const stored = localStorage.getItem('gb_study_saved');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Last visited course for "Continue Learning"
  const [lastCourse, setLastCourse] = useState<Course | null>(() => {
    try {
      const stored = localStorage.getItem('gb_study_last_course');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Selected Category filter
  const [category, setCategory] = useState<string>('all');
  const [homeSearchQuery, setHomeSearchQuery] = useState<string>('');

  // Modals
  const [showTelegramModal, setShowTelegramModal] = useState<boolean>(true);
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [showStoreModal, setShowStoreModal] = useState<boolean>(false);
  const [showTestsModal, setShowTestsModal] = useState<boolean>(false);
  const [activeBottomTab, setActiveBottomTab] = useState<BottomNavTabId>('home');
  const [enrollToast, setEnrollToast] = useState<{ message: string; course: Course } | null>(null);

  // Video Player state
  const [activeVideo, setActiveVideo] = useState<ActiveVideoState | null>(null);
  const [showVideoModal, setShowVideoModal] = useState<boolean>(false);

  // PDF Notes Viewer state
  const [activePdf, setActivePdf] = useState<{
    title: string;
    courseTitle?: string;
    chapterTitle?: string;
    index?: number;
    url?: string;
    categoryId?: string;
    courseId?: string;
  } | null>(null);

  // Real Test runner state
  const [activeTest, setActiveTest] = useState<{
    id: string;
    title: string;
    totalQuestions?: number;
    totalTimeMinutes?: number;
  } | null>(null);

  // TargetBoard Live Stream player state
  const [activeStream, setActiveStream] = useState<LiveStreamData | null>(null);

  // 1. Fetch initial course catalog
  useEffect(() => {
    async function loadCourses() {
      try {
        setLoadingCourses(true);
        // Try internal API first, then static json fallback
        let data: Course[] = [];
        try {
          const res = await fetch('/api/courses');
          if (res.ok) {
            const json = await res.json();
            data = json.courses || [];
          }
        } catch {
          // fallback
        }

        if (!data || data.length === 0) {
          const staticRes = await fetch('/data/courses_list.json');
          if (staticRes.ok) {
            data = await staticRes.json();
          }
        }

        setCourses(data);
      } catch (err) {
        console.error('Error fetching courses list:', err);
      } finally {
        setLoadingCourses(false);
      }
    }

    loadCourses();
  }, []);

  // Automatically extract 'v' parameter from URL query (e.g. /?v=... or /dashboard/video?v=...)
  useEffect(() => {
    try {
      const cleanV = extractCleanVideoId(window.location.search, true);
      if (cleanV) {
        const streamUrl = getTargetBoardIframeSrc(cleanV);
        setActiveVideo({
          assetId: cleanV,
          title: 'GB STUDY Lecture Stream',
          courseTitle: 'Direct Video Stream',
          loading: false,
          videoUrl: streamUrl,
          embedUrl: streamUrl
        });
        setShowVideoModal(true);

        // Fetch official title/url from api if available
        fetch(`/api/video?asset=${encodeURIComponent(cleanV)}`)
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data && data.video_url) {
              const cleanFetchedUrl = getTargetBoardIframeSrc(extractCleanVideoId(data.video_url, false) || cleanV);
              setActiveVideo(prev => {
                if (!prev) return prev;
                return {
                  ...prev,
                  videoUrl: cleanFetchedUrl || data.video_url,
                  embedUrl: cleanFetchedUrl || data.video_url,
                  title: data.title || prev.title
                };
              });
            }
          })
          .catch(() => {});
      }
    } catch (e) {
      console.warn('URL video query extraction error:', e);
    }
  }, []);

  // Keyboard shortcut Ctrl+K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowSearchModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Save/Enroll courses to localStorage and My Course
  const handleToggleSave = (course: Course) => {
    setSavedCourses(prev => {
      const exists = prev.some(c => c.id === course.id);
      let updated: Course[];
      if (exists) {
        updated = prev.filter(c => c.id !== course.id);
        setEnrollToast({
          message: `Removed "${course.name}" from My Course`,
          course
        });
      } else {
        updated = [...prev, course];
        setEnrollToast({
          message: `🎉 Successfully Enrolled in "${course.name}"! Added to My Course.`,
          course
        });
      }
      try {
        localStorage.setItem('gb_study_saved', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setTimeout(() => {
      setEnrollToast(null);
    }, 4000);
  };

  const handleClearSaved = () => {
    setSavedCourses([]);
    try {
      localStorage.removeItem('gb_study_saved');
    } catch {}
  };

  // Open a course
  const handleOpenCourse = async (course: Course) => {
    setSelectedCourse(course);
    setView('course');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Store in continue learning
    setLastCourse(course);
    try {
      localStorage.setItem('gb_study_last_course', JSON.stringify(course));
    } catch {}

    // Fetch course details
    try {
      setLoadingDetail(true);
      let detail: CourseDetailResponse | null = null;

      try {
        const res = await fetch(`/api/course/${course.id}`);
        if (res.ok) {
          detail = await res.json();
        }
      } catch {}

      if (!detail) {
        const staticRes = await fetch(`/data/courses/${course.id}.json`);
        if (staticRes.ok) {
          detail = await staticRes.json();
        }
      }

      setCourseDetail(detail);
    } catch (err) {
      console.error('Failed to load course details:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Flat list of videos in current course for next/prev playlist navigation
  const allCourseVideos = React.useMemo(() => {
    if (!courseDetail || !courseDetail.tree) return [];
    const list: Array<{ video: LectureVideo; chapterTitle: string; index: number }> = [];
    let count = 0;
    function traverse(nodes: TreeNode[], parentName = '') {
      for (const node of nodes) {
        const chapter = parentName ? `${parentName} > ${node.name}` : node.name;
        if (node.videos && node.videos.length > 0) {
          for (const v of node.videos) {
            count++;
            list.push({ video: v, chapterTitle: chapter, index: count });
          }
        }
        if (node.children && node.children.length > 0) {
          traverse(node.children, chapter);
        }
      }
    }
    traverse(courseDetail.tree);
    return list;
  }, [courseDetail]);

  const currentVideoIndex = activeVideo
    ? allCourseVideos.findIndex(item => item.video.asset === activeVideo.assetId)
    : -1;

  const hasPrev = currentVideoIndex > 0;
  const hasNext = currentVideoIndex >= 0 && currentVideoIndex < allCourseVideos.length - 1;

  // Play video lecture exactly like previous website (Instant new tab with loader + in-page player sync)
  const handlePlayVideo = async (video: LectureVideo, chapterTitle: string, index: number) => {
    const courseTitle = selectedCourse ? `${selectedCourse.name} • ${chapterTitle}` : chapterTitle;

    // Safely extract JUST the clean video ID string from video.asset or video object
    const cleanAssetId = extractCleanVideoId(video.asset || video, true);
    const standardStreamUrl = getTargetBoardIframeSrc(cleanAssetId, video.title);

    // Open video tab immediately on user click to prevent browser popup blockers (exact previous website system)
    const win = window.open('', '_blank');
    if (win) {
      try {
        win.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>${video.title || 'GB STUDY Lecture Stream'}</title>
              <style>
                body { margin: 0; background: #0c0910; color: #fff; font-family: system-ui, -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; }
                .spinner { width: 44px; height: 44px; border: 4px solid rgba(255,255,255,0.1); border-top-color: #ff2b85; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 20px; }
                @keyframes spin { to { transform: rotate(360deg); } }
                h2 { font-size: 20px; font-weight: 800; margin: 0 0 10px; background: linear-gradient(135deg, #ff2b85, #f43f5e); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                p { font-size: 13px; color: #fce7f3; font-family: monospace; max-width: 400px; line-height: 1.5; }
              </style>
            </head>
            <body>
              <div class="spinner"></div>
              <h2>GB STUDY Official Stream</h2>
              <p>Opening lecture: ${video.title || 'Video Lecture'}...</p>
            </body>
          </html>
        `);
      } catch (err) {}
    }

    // Set active video on page with stream ready
    setActiveVideo({
      assetId: cleanAssetId,
      title: video.title,
      courseTitle,
      index,
      loading: false,
      videoUrl: standardStreamUrl,
      embedUrl: standardStreamUrl
    });

    // Immediately redirect the opened tab to the stream URL without waiting for network API
    if (standardStreamUrl && win && !win.closed) {
      win.location.href = standardStreamUrl;
    }

    // Optional background sync with API proxy if running
    try {
      if (cleanAssetId) {
        const res = await fetch(`/api/video?asset=${encodeURIComponent(cleanAssetId)}&title=${encodeURIComponent(video.title)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.video_url) {
            const apiResolvedUrl = getTargetBoardIframeSrc(extractCleanVideoId(data.video_url, false) || cleanAssetId, video.title) || data.video_url;
            setActiveVideo(prev => prev ? { ...prev, videoUrl: apiResolvedUrl, embedUrl: apiResolvedUrl } : null);
            if (win && !win.closed && win.location.href.includes('about:blank')) {
              win.location.href = apiResolvedUrl;
            }
          }
        }
      }
    } catch {}
  };

  const handlePrevLecture = () => {
    if (hasPrev) {
      const prev = allCourseVideos[currentVideoIndex - 1];
      handlePlayVideo(prev.video, prev.chapterTitle, prev.index);
    }
  };

  const handleNextLecture = () => {
    if (hasNext) {
      const next = allCourseVideos[currentVideoIndex + 1];
      handlePlayVideo(next.video, next.chapterTitle, next.index);
    }
  };

  // View PDF Notes
  const handleViewPdf = (pdf: LecturePdf, chapterTitle: string, index: number, categoryId?: string) => {
    setActivePdf({
      title: pdf.title,
      courseTitle: selectedCourse?.name,
      chapterTitle,
      index,
      url: pdf.url,
      categoryId: categoryId || pdf.categoryId,
      courseId: pdf.courseId || selectedCourse?.id
    });
  };

  // Filter courses by category & query
  const filteredCourses = courses.filter(c => {
    // Category match
    let matchCat = true;
    if (category === '10th') {
      matchCat = (c.group && c.group.includes('10th')) || c.name.toLowerCase().includes('10th') || c.name.includes('मैट्रिक');
    } else if (category === '11th') {
      matchCat = (c.group && c.group.includes('11th')) || c.name.toLowerCase().includes('11th');
    } else if (category === '12th') {
      matchCat = (c.group && c.group.includes('12th')) || c.name.toLowerCase().includes('12th');
    } else if (category === 'polytechnic') {
      matchCat = c.name.toLowerCase().includes('polytechnic') || c.name.toLowerCase().includes('cuet');
    }

    // Search query match
    let matchQuery = true;
    if (homeSearchQuery.trim()) {
      const q = homeSearchQuery.trim().toLowerCase();
      matchQuery = c.name.toLowerCase().includes(q) || Boolean(c.group && c.group.toLowerCase().includes(q));
    }

    return Boolean(matchCat && matchQuery);
  });

  return (
    <div className="min-h-screen bg-[#0c0910] text-[#fce7f3] flex flex-col selection:bg-pink-500 selection:text-white">
      {/* Telegram Popup (Shown on open) */}
      <TelegramModal
        isOpen={showTelegramModal}
        onClose={() => setShowTelegramModal(false)}
        telegramUrl="https://t.me/GBFreestudy"
      />

      {/* Video Streaming Modal */}
      <VideoPlayerModal
        isOpen={Boolean(activeVideo && showVideoModal)}
        onClose={() => {
          setShowVideoModal(false);
          setActiveVideo(null);
          if (typeof window !== 'undefined' && window.location.search.includes('v=')) {
            const url = new URL(window.location.href);
            url.searchParams.delete('v');
            window.history.replaceState({}, '', url.pathname + (url.search || ''));
          }
        }}
        assetId={activeVideo?.assetId || ''}
        videoTitle={activeVideo?.title || ''}
        embedUrl={activeVideo?.embedUrl}
        videoUrl={activeVideo?.videoUrl}
        loading={activeVideo?.loading}
        courseTitle={activeVideo?.courseTitle}
        lectureNumber={activeVideo?.index}
        onNextLecture={handleNextLecture}
        onPrevLecture={handlePrevLecture}
        hasNext={hasNext}
        hasPrev={hasPrev}
      />

      {/* PDF Notes Modal */}
      <PdfModal
        isOpen={Boolean(activePdf)}
        onClose={() => setActivePdf(null)}
        title={activePdf?.title || ''}
        courseTitle={activePdf?.courseTitle}
        chapterTitle={activePdf?.chapterTitle}
        pdfIndex={activePdf?.index}
        categoryId={activePdf?.categoryId}
        courseId={activePdf?.courseId}
        pdfUrl={activePdf?.url}
      />

      {/* Global Search Modal (Ctrl+K or Header search) */}
      <GlobalSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        courses={courses}
        onSelectCourse={handleOpenCourse}
        onPlayLecture={(course, lec, idx) => {
          handleOpenCourse(course);
          handlePlayVideo({ title: lec.title, asset: lec.asset || '' }, 'Searched Lecture', idx);
        }}
        onViewPdfNote={(course, pdf, idx) => {
          setSelectedCourse(course);
          setActivePdf({
            title: pdf.title,
            courseTitle: course.name,
            index: idx,
            courseId: course.id,
            url: pdf.url
          });
        }}
      />

      {/* Student Login & OTP Modal */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowLoginModal(false)}
        >
          <div
            className="relative w-full max-w-md bg-[#120818] rounded-3xl border-2 border-pink-500/40 shadow-2xl shadow-pink-600/30 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative px-6 pt-6 pb-4 bg-gradient-to-b from-pink-950/60 to-transparent border-b border-pink-500/20">
              <button
                onClick={() => setShowLoginModal(false)}
                className="absolute top-5 right-5 p-1.5 rounded-xl bg-pink-950/60 hover:bg-pink-900 text-pink-300 hover:text-white border border-pink-500/30 transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-pink-600/40">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-pink-400">
                      GB STUDY ACCOUNT
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                  </div>
                  <h3 className="text-lg font-black text-white font-heading">
                    {currentUser && isAuthenticated ? 'Student Profile' : authStep === 'otp' ? 'Verify OTP' : 'Student Login / Signup'}
                  </h3>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5">
              {currentUser && isAuthenticated && authStep !== 'phone' && authStep !== 'otp' ? (
                /* Authenticated State */
                <div className="text-center space-y-4 py-2">
                  <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Logged in Successfully!</h4>
                    <p className="text-xs text-pink-300/80 mt-1">
                      Mobile Number: <span className="font-mono text-white font-semibold">+91 {currentUser.phone}</span>
                    </p>
                    <p className="text-[11px] text-pink-400/70 mt-1">
                      Full access to all 29+ free batches, notes, and lectures.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-center gap-3">
                    <button
                      onClick={() => setShowLoginModal(false)}
                      className="btn-pink-gradient py-2.5 px-6 rounded-xl font-bold text-xs sm:text-sm text-white shadow-md shadow-pink-600/30 cursor-pointer"
                    >
                      Continue Learning
                    </button>
                    <button
                      onClick={handleLogout}
                      className="py-2.5 px-4 rounded-xl font-semibold text-xs text-pink-400 hover:text-white bg-pink-950/40 hover:bg-pink-900 border border-pink-500/30 transition cursor-pointer"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : authStep === 'phone' ? (
                /* Step 1: Phone */
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <p className="text-xs text-pink-200/80 leading-relaxed">
                    Enter your mobile number to verify and sync your saved batches, notes, and study progress across devices.
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-pink-300 mb-1.5">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-pink-400 font-semibold text-xs">
                        <Phone className="w-4 h-4" />
                        <span>+91</span>
                      </div>
                      <input
                        type="tel"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 10-digit number"
                        className="w-full pl-16 pr-4 py-3 rounded-2xl bg-pink-950/30 border border-pink-500/40 text-white placeholder-pink-400/40 text-sm font-medium focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400/50 tracking-wider"
                        autoFocus
                      />
                    </div>
                  </div>

                  {authError && (
                    <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs">
                      {authError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={phone.replace(/\D/g, '').length < 10}
                    className="w-full btn-pink-gradient py-3 px-5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg shadow-pink-600/30 hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
                  >
                    <span>Send OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="pt-2 text-center text-[11px] text-pink-400/60">
                    <span>By continuing, you agree to GB STUDY's Free Education Terms.</span>
                  </div>
                </form>
              ) : (
                /* Step 2: OTP Verification */
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-pink-200/80">
                    <span>OTP sent to <b className="text-white font-mono">+91 {phone}</b></span>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthStep('phone');
                        setAuthError('');
                      }}
                      className="text-pink-400 hover:text-pink-300 font-semibold underline cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-pink-300 mb-1.5">
                      Verification Code (OTP)
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-pink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="Enter 6-digit OTP"
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-pink-950/30 border border-pink-500/40 text-white placeholder-pink-400/40 text-sm font-mono tracking-widest text-center focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400/50"
                        autoFocus
                      />
                    </div>
                    <p className="text-[11px] text-pink-400/70 mt-1.5 text-center">
                      Enter any 6-digit code (e.g. 123456) to verify immediately
                    </p>
                  </div>

                  {authError && (
                    <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs">
                      {authError}
                    </div>
                  )}

                  {/* Verify & Login Button */}
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={otp.trim().length !== 6}
                    className="w-full btn-pink-gradient py-3 px-5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg shadow-pink-600/30 hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify & Login</span>
                  </button>

                  {/* Resend OTP */}
                  <div className="flex items-center justify-between text-xs text-pink-300/80 pt-1">
                    <span>Didn't receive code?</span>
                    {canResend ? (
                      <button
                        type="button"
                        onClick={() => {
                          setCanResend(false);
                          setTimer(30);
                          setOtp('');
                        }}
                        className="text-pink-400 hover:text-white font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Resend OTP</span>
                      </button>
                    ) : (
                      <span className="text-pink-400/60 font-mono">
                        Resend in {timer}s
                      </span>
                    )}
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        onSearchClick={() => setShowSearchModal(true)}
        onHomeClick={() => {
          setView('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSavedClick={() => {
          setView('saved');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onTelegramClick={() => setShowTelegramModal(true)}
        onLoginClick={() => setShowLoginModal(true)}
        currentUser={currentUser}
        savedCount={savedCourses.length}
        currentView={view}
        courseName={selectedCourse?.name}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-28 sm:pb-32">
        {/* VIEW 1: HOME CATALOG */}
        {view === 'home' && (
          <div className="space-y-10">
            {/* Hero Section */}
            <section className="relative overflow-hidden pt-6 pb-10 sm:pt-14 sm:pb-16 px-4 sm:px-6 lg:px-8 text-center max-w-6xl mx-auto">
              {/* Glowing pink ambient blurs */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-pink-600/15 rounded-full blur-3xl pointer-events-none" />

              {/* Tag pill */}
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-pink-950/60 border border-pink-500/40 text-pink-300 text-[11px] sm:text-sm font-bold uppercase tracking-wider mb-5 sm:mb-6 shadow-lg shadow-pink-600/10">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-400" />
                <span>GB STUDY Official Free Learning Cloud</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-2xl xs:text-3xl sm:text-5xl lg:text-6xl font-black text-white font-heading tracking-tight leading-[1.18] mb-4 sm:mb-5">
                Learn Anywhere with{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 glow-text-pink">
                  GB STUDY Free Batches
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-xs sm:text-base lg:text-lg text-pink-200/80 max-w-3xl mx-auto mb-6 sm:mb-8 leading-relaxed">
                Full syllabus video lectures, official faculty panel notes, chapterwise tests, and revision PDFs. Complete coverage for Matric 10th, Inter 11th & 12th Science & Arts, and Polytechnic.
              </p>

              {/* Quick Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md mx-auto mb-8 sm:mb-10">
                <a
                  href="#batches-catalog"
                  className="w-full sm:w-auto btn-pink-gradient py-3 px-6 sm:px-7 rounded-2xl font-black text-sm sm:text-base text-white flex items-center justify-center gap-2 shadow-xl shadow-pink-600/30 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Let's Study (Browse 29 Batches)</span>
                </a>

                <button
                  onClick={() => setShowTelegramModal(true)}
                  className="w-full sm:w-auto py-3 px-5 sm:px-6 rounded-2xl font-bold text-sm text-pink-300 hover:text-white bg-pink-950/50 hover:bg-pink-900/60 border border-pink-500/30 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Send className="w-4 h-4 text-pink-400" />
                  <span>Join Telegram Channel</span>
                </button>
              </div>

              {/* Key Platform Stats in Glowing Pink Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 max-w-4xl mx-auto">
                <div className="p-3 sm:p-4 rounded-2xl bg-pink-950/25 border border-pink-500/20 backdrop-blur-sm">
                  <div className="text-2xl sm:text-3xl font-black text-pink-400 font-heading">29+</div>
                  <div className="text-[11px] sm:text-xs text-pink-300/70 font-semibold mt-1">Free Batches</div>
                </div>
                <div className="p-3 sm:p-4 rounded-2xl bg-pink-950/25 border border-pink-500/20 backdrop-blur-sm">
                  <div className="text-2xl sm:text-3xl font-black text-pink-400 font-heading">12,000+</div>
                  <div className="text-[11px] sm:text-xs text-pink-300/70 font-semibold mt-1">Recorded Lectures</div>
                </div>
                <div className="p-3 sm:p-4 rounded-2xl bg-pink-950/25 border border-pink-500/20 backdrop-blur-sm">
                  <div className="text-2xl sm:text-3xl font-black text-pink-400 font-heading">10,000+</div>
                  <div className="text-[11px] sm:text-xs text-pink-300/70 font-semibold mt-1">Panel Notes</div>
                </div>
                <div className="p-3 sm:p-4 rounded-2xl bg-pink-950/25 border border-pink-500/20 backdrop-blur-sm">
                  <div className="text-2xl sm:text-3xl font-black text-pink-400 font-heading">100%</div>
                  <div className="text-[11px] sm:text-xs text-pink-300/70 font-semibold mt-1">Free • No Login</div>
                </div>
              </div>
            </section>

            {/* TargetBoard Style Quick Action Cards (All Courses | Live Class | Notes) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-xl mx-auto">
                {/* 1. All Courses */}
                <div
                  onClick={() => {
                    const el = document.getElementById('batches-catalog');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#160c1d] border border-pink-500/25 hover:border-pink-500/60 shadow-lg shadow-black/50 hover:shadow-pink-600/20 transition-all duration-200 cursor-pointer flex flex-col items-center text-center group active:scale-95"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-pink-950/80 to-purple-950/80 border border-pink-500/30 flex items-center justify-center text-pink-300 group-hover:scale-110 group-hover:bg-pink-600 group-hover:text-white transition shadow-md mb-2 sm:mb-2.5">
                    <BookOpen className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <span className="text-xs sm:text-sm font-black text-white group-hover:text-pink-300 transition tracking-tight">
                    All Courses
                  </span>
                  <span className="text-[10px] text-pink-400/70 font-semibold mt-0.5 hidden xs:inline">
                    29 Batches
                  </span>
                </div>

                {/* 2. Live Class (Matches enrolled batch live lectures!) */}
                <div
                  onClick={() => {
                    const el = document.getElementById('live-classes-section');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#160c1d] border border-rose-500/35 hover:border-rose-500/70 shadow-lg shadow-black/50 hover:shadow-rose-600/30 transition-all duration-200 cursor-pointer flex flex-col items-center text-center group active:scale-95 relative"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-rose-950/80 to-red-950/80 border border-rose-500/40 flex items-center justify-center text-rose-400 group-hover:scale-110 group-hover:bg-rose-600 group-hover:text-white transition shadow-md mb-2 sm:mb-2.5 relative">
                    <Video className="w-6 h-6 sm:w-7 sm:h-7" />
                    {/* Blinking Live Dot */}
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 ring-2 ring-[#160c1d]"></span>
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-black text-white group-hover:text-rose-300 transition tracking-tight">
                    Live Class
                  </span>
                  <span className="text-[10px] text-rose-400/80 font-semibold mt-0.5 hidden xs:inline">
                    Enrolled Batch
                  </span>
                </div>

                {/* 3. Notes */}
                <div
                  onClick={() => setShowSearchModal(true)}
                  className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#160c1d] border border-teal-500/25 hover:border-teal-500/60 shadow-lg shadow-black/50 hover:shadow-teal-600/20 transition-all duration-200 cursor-pointer flex flex-col items-center text-center group active:scale-95"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-teal-950/80 to-emerald-950/80 border border-teal-500/30 flex items-center justify-center text-teal-300 group-hover:scale-110 group-hover:bg-teal-600 group-hover:text-white transition shadow-md mb-2 sm:mb-2.5">
                    <FileText className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <span className="text-xs sm:text-sm font-black text-white group-hover:text-teal-300 transition tracking-tight">
                    Notes
                  </span>
                  <span className="text-[10px] text-teal-400/70 font-semibold mt-0.5 hidden xs:inline">
                    Panel PDFs
                  </span>
                </div>
              </div>
            </div>

            {/* REAL LIVE CLASSES SECTION (TargetBoard style Live Now & Upcoming for student enrolled batch!) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <LiveClassesSection
                courses={courses}
                savedCourses={savedCourses}
                onJoinStream={(stream) => {
                  setActiveStream({
                    _id: stream._id,
                    title: stream.title,
                    assetId: stream.assetId || '',
                    subject: stream.subject,
                    teacherName: stream.teacherName,
                    teacherImage: stream.teacherImage,
                    courseTitle: stream.courseTitle,
                    viewers: stream.viewers,
                    isLive: stream.isLive
                  });
                }}
                onOpenCourse={handleOpenCourse}
                onToggleEnroll={handleToggleSave}
              />
            </div>

            {/* Continue Learning Strip (if last visited course exists) */}
            {lastCourse && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-pink-950/60 via-pink-900/30 to-pink-950/60 border border-pink-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-pink-600 text-white shrink-0 shadow-md shadow-pink-600/30">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400">
                        Continue Where You Left Off
                      </span>
                      <h4 className="text-sm sm:text-base font-bold text-white font-heading">
                        {lastCourse.name}
                      </h4>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenCourse(lastCourse)}
                    className="w-full sm:w-auto btn-pink-gradient py-2.5 px-5 rounded-xl text-xs sm:text-sm font-bold text-white flex items-center justify-center gap-1.5 shrink-0 shadow-md shadow-pink-600/30 cursor-pointer"
                  >
                    <span>Resume Studying</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Batches Catalog Section */}
            <section id="batches-catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              {/* Category Filter Pills & Search */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 pb-2 border-b border-pink-500/20">
                {/* Category Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none w-full min-w-0 flex-nowrap">
                  {[
                    { id: 'all', label: 'All Batches', count: courses.length },
                    { id: '12th', label: 'Class 12th', count: courses.filter(c => (c.group && c.group.includes('12th')) || c.name.includes('12th')).length },
                    { id: '10th', label: 'Class 10th', count: courses.filter(c => (c.group && c.group.includes('10th')) || c.name.includes('10th') || c.name.includes('मैट्रिक')).length },
                    { id: '11th', label: 'Class 11th', count: courses.filter(c => (c.group && c.group.includes('11th')) || c.name.includes('11th')).length },
                    { id: 'polytechnic', label: 'Polytechnic & CUET', count: courses.filter(c => c.name.toLowerCase().includes('polytechnic') || c.name.toLowerCase().includes('cuet')).length },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setCategory(tab.id)}
                      className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer shrink-0 active:scale-95 ${
                        category === tab.id
                          ? 'btn-pink-gradient text-white shadow-md shadow-pink-600/30'
                          : 'bg-pink-950/40 hover:bg-pink-900/60 text-pink-300 border border-pink-500/25'
                      }`}
                    >
                      {tab.label} <span className="opacity-70 text-[11px]">({tab.count})</span>
                    </button>
                  ))}
                </div>

                {/* Inline Search Bar */}
                <div className="relative w-full md:w-80 shrink-0">
                  <Search className="w-4 h-4 text-pink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={homeSearchQuery}
                    onChange={(e) => setHomeSearchQuery(e.target.value)}
                    placeholder="Search 29+ batches..."
                    className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-pink-950/35 border border-pink-500/30 text-white placeholder-pink-400/50 text-xs sm:text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400/40"
                  />
                  {homeSearchQuery && (
                    <button
                      onClick={() => setHomeSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-pink-400 hover:text-white text-xs p-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Courses Grid: Mobile 1 col (full width, large), Tablet 2 col, Laptop 3 col, Desktop 4 col */}
              {loadingCourses ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="glass-card rounded-2xl sm:rounded-3xl h-80 sm:h-96 animate-pulse bg-pink-950/20 border border-pink-500/20" />
                  ))}
                </div>
              ) : filteredCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                  {filteredCourses.map(course => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      onSelect={handleOpenCourse}
                      isSaved={savedCourses.some(sc => sc.id === course.id)}
                      onToggleSave={handleToggleSave}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-8 sm:p-12 text-center rounded-3xl glass-card border border-pink-500/20 max-w-md mx-auto space-y-3">
                  <Search className="w-10 h-10 text-pink-400 mx-auto" />
                  <h4 className="font-bold text-white text-base">No batches found</h4>
                  <p className="text-xs text-pink-300/70">
                    Try searching for another keyword like "10th", "12th Science", "Urdu", or "Polytechnic".
                  </p>
                  <button
                    onClick={() => {
                      setCategory('all');
                      setHomeSearchQuery('');
                    }}
                    className="btn-pink-gradient py-2.5 px-5 rounded-xl text-xs font-bold text-white cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </section>
          </div>
        )}

        {/* VIEW 2: COURSE DETAIL VIEW */}
        {view === 'course' && selectedCourse && (
          <CourseDetailView
            course={selectedCourse}
            detailData={courseDetail}
            loading={loadingDetail}
            onBack={() => {
              setView('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            isSaved={savedCourses.some(sc => sc.id === selectedCourse.id)}
            onToggleSave={handleToggleSave}
            onPlayVideo={handlePlayVideo}
            onViewPdf={handleViewPdf}
            onJoinTelegram={() => setShowTelegramModal(true)}
            activeVideo={activeVideo}
            onCloseActiveVideo={() => setActiveVideo(null)}
            onExpandVideoModal={() => setShowVideoModal(true)}
            onNextLecture={handleNextLecture}
            onPrevLecture={handlePrevLecture}
            hasNext={hasNext}
            hasPrev={hasPrev}
            onStartTest={(t) => {
              setActiveTest({
                id: t._id,
                title: t.name,
                totalQuestions: t.totalQuestions || 50,
                totalTimeMinutes: t.totalTime || 45
              });
            }}
          />
        )}

        {/* VIEW 3: SAVED BATCHES VIEW */}
        {view === 'saved' && (
          <SavedBatchesView
            savedCourses={savedCourses}
            onSelectCourse={handleOpenCourse}
            onToggleSave={handleToggleSave}
            onBack={() => {
              setView('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onClearAll={handleClearSaved}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        onTelegramClick={() => setShowTelegramModal(true)}
        onHomeClick={() => {
          setView('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSavedClick={() => {
          setView('saved');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Toast Notification when student enrolls in a batch */}
      {enrollToast && (
        <div className="fixed bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-2xl bg-[#1b0d26]/95 border border-pink-500/50 shadow-2xl shadow-pink-600/50 text-white text-xs sm:text-sm font-bold flex items-center gap-3 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-200 max-w-[92vw] sm:max-w-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="truncate flex-1">{enrollToast.message}</span>
          <button
            onClick={() => {
              setEnrollToast(null);
              setView('saved');
              setActiveBottomTab('my-course');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-2.5 py-1 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-[11px] font-extrabold uppercase shrink-0 transition cursor-pointer"
          >
            My Course →
          </button>
        </div>
      )}

      {/* Store Modal */}
      <StoreModal
        isOpen={showStoreModal}
        onClose={() => {
          setShowStoreModal(false);
          setActiveBottomTab(view === 'saved' ? 'my-course' : 'home');
        }}
        courses={courses}
        onSelectCourse={handleOpenCourse}
        onJoinTelegram={() => setShowTelegramModal(true)}
      />

      {/* Tests Modal */}
      <TestsModal
        isOpen={showTestsModal}
        onClose={() => {
          setShowTestsModal(false);
          setActiveBottomTab(view === 'saved' ? 'my-course' : 'home');
        }}
        courses={courses}
        savedCourses={savedCourses}
        onSelectCourse={handleOpenCourse}
        onStartRealTest={(test) => {
          setShowTestsModal(false);
          setActiveTest({
            id: test._id,
            title: test.name,
            totalQuestions: test.totalQuestions || 50,
            totalTimeMinutes: test.totalTime || 45
          });
        }}
      />

      {/* Real Test Runner Modal */}
      {activeTest && (
        <TestRunnerModal
          isOpen={Boolean(activeTest)}
          onClose={() => setActiveTest(null)}
          testId={activeTest.id}
          testTitle={activeTest.title}
          totalQuestions={activeTest.totalQuestions}
          totalTimeMinutes={activeTest.totalTimeMinutes}
        />
      )}

      {/* TargetBoard Official Stream Player Modal (With Real Video + Live Chat) */}
      {activeStream && (
        <StreamPlayerModal
          isOpen={Boolean(activeStream)}
          onClose={() => setActiveStream(null)}
          stream={activeStream}
        />
      )}

      {/* Fixed Bottom Navigation Bar (position: fixed, bottom: 0, left: 0, right: 0, z-index: 50) */}
      <BottomNavigationBar
        activeTab={
          showStoreModal
            ? 'store'
            : showTestsModal
            ? 'tests'
            : view === 'saved'
            ? 'my-course'
            : activeBottomTab === 'all-courses'
            ? 'all-courses'
            : 'home'
        }
        onTabChange={(tab) => {
          setActiveBottomTab(tab);
          if (tab === 'home') {
            setShowStoreModal(false);
            setShowTestsModal(false);
            setView('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else if (tab === 'my-course') {
            setShowStoreModal(false);
            setShowTestsModal(false);
            setView('saved');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else if (tab === 'all-courses') {
            setShowStoreModal(false);
            setShowTestsModal(false);
            if (view !== 'home') setView('home');
            setTimeout(() => {
              const el = document.getElementById('batches-catalog');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              } else {
                window.scrollTo({ top: 400, behavior: 'smooth' });
              }
            }, 60);
          } else if (tab === 'store') {
            setShowTestsModal(false);
            setShowStoreModal(true);
          } else if (tab === 'tests') {
            setShowStoreModal(false);
            setShowTestsModal(true);
          }
        }}
        myCourseCount={savedCourses.length}
      />
    </div>
  );
}
