import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Calendar, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  FolderOpen, 
  ChevronRight,
  RefreshCw,
  BookOpen
} from 'lucide-react';
import { Course } from '../types';
import { LiveClassCard, LiveClassItem } from './LiveClassCard';

interface LiveClassesSectionProps {
  courses: Course[];
  savedCourses: Course[];
  onJoinStream: (liveClass: LiveClassItem) => void;
  onOpenCourse: (course: Course) => void;
  onToggleEnroll: (course: Course) => void;
}

export const LiveClassesSection: React.FC<LiveClassesSectionProps> = ({
  courses,
  savedCourses,
  onJoinStream,
  onOpenCourse,
  onToggleEnroll
}) => {
  // Target course: prefers student's enrolled batch, else top course
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [liveStreams, setLiveStreams] = useState<LiveClassItem[]>([]);
  const [upcomingStreams, setUpcomingStreams] = useState<LiveClassItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Active batch object
  const activeBatch: Course | null = 
    (selectedBatchId ? (savedCourses.find(c => c.id === selectedBatchId) || courses.find(c => c.id === selectedBatchId)) : null) ||
    savedCourses[0] ||
    courses[0] ||
    null;

  // Auto-select first enrolled batch if available
  useEffect(() => {
    if (savedCourses.length > 0) {
      if (!selectedBatchId || !savedCourses.some(c => c.id === selectedBatchId)) {
        setSelectedBatchId(savedCourses[0].id);
      }
    } else if (courses.length > 0 && !selectedBatchId) {
      setSelectedBatchId(courses[0].id);
    }
  }, [savedCourses, courses, selectedBatchId]);

  // Load batch curriculum and generate real TargetBoard Live & Upcoming sessions
  useEffect(() => {
    if (!activeBatch?.id) return;

    let isMounted = true;
    setLoading(true);

    async function loadStreams() {
      try {
        const res = await fetch(`/api/course/${activeBatch!.id}`);
        if (!res.ok) {
          if (isMounted) setLoading(false);
          return;
        }
        const data = await res.json();
        const extractedVids: Array<{ title: string; asset: string; chapter: string; path: string }> = [];

        function scan(node: any, trail = '') {
          const curTrail = trail ? `${trail} › ${node.name}` : node.name;
          if (node.videos && Array.isArray(node.videos)) {
            node.videos.forEach((v: any) => {
              if (v && v.asset) {
                extractedVids.push({
                  title: v.title,
                  asset: v.asset,
                  chapter: node.name || 'Chapter Lecture',
                  path: trail
                });
              }
            });
          }
          if (node.children) node.children.forEach((c: any) => scan(c, curTrail));
          if (node.tree) node.tree.forEach((c: any) => scan(c, curTrail));
        }

        scan(data);

        if (isMounted) {
          // Detect subjects and faculty for TargetBoard
          const parseSubject = (txt: string) => {
            const lower = txt.toLowerCase();
            if (lower.includes('physics') || lower.includes('भौतिक')) return { subject: 'Physics', teacher: 'Pankaj Sir' };
            if (lower.includes('chem') || lower.includes('रसायन')) return { subject: 'Chemistry', teacher: 'Pankaj Sir' };
            if (lower.includes('math') || lower.includes('गणित')) return { subject: 'Mathematics', teacher: 'Prince Sir' };
            if (lower.includes('bio') || lower.includes('जीव')) return { subject: 'Biology', teacher: 'Faculty' };
            if (lower.includes('hindi') || lower.includes('हिन्दी')) return { subject: 'Hindi', teacher: 'Prince Sir' };
            if (lower.includes('english') || lower.includes('अंग्रेजी')) return { subject: 'English', teacher: 'Anand Sir' };
            if (lower.includes('urdu') || lower.includes('उर्दू')) return { subject: 'Urdu', teacher: 'Dr. Afzal Sir' };
            if (lower.includes('sanskrit') || lower.includes('संस्कृत')) return { subject: 'Sanskrit', teacher: 'Prince Sir' };
            if (lower.includes('social') || lower.includes('सामाजिक')) return { subject: 'Social Science', teacher: 'Prince Sir' };
            return { subject: 'Board Preparation', teacher: 'TargetBoard Faculty' };
          };

          // Top 2-4 items as LIVE NOW
          const liveItems: LiveClassItem[] = extractedVids.slice(0, 4).map((v, i) => {
            const info = parseSubject(v.title + ' ' + v.chapter + ' ' + v.path);
            return {
              _id: `live_${activeBatch!.id}_${i}`,
              title: v.title,
              subject: info.subject,
              teacherName: info.teacher,
              teacherImage: 'https://i.ibb.co/0R7qc34v/1093.jpg',
              assetId: v.asset,
              isLive: true,
              courseTitle: activeBatch!.name,
              courseId: activeBatch!.id,
              viewers: 1400 + (i * 210) + Math.floor(Math.random() * 50),
              startTime: new Date().toISOString()
            };
          });

          // Next 2-4 items as UPCOMING
          const upcomingItems: LiveClassItem[] = extractedVids.slice(4, 8).map((v, i) => {
            const info = parseSubject(v.title + ' ' + v.chapter + ' ' + v.path);
            const futureTime = new Date(Date.now() + (i + 1) * 3600 * 1000).toISOString();
            return {
              _id: `upcoming_${activeBatch!.id}_${i}`,
              title: v.title,
              subject: info.subject,
              teacherName: info.teacher,
              teacherImage: 'https://i.ibb.co/0R7qc34v/1093.jpg',
              assetId: v.asset,
              isLive: false,
              courseTitle: activeBatch!.name,
              courseId: activeBatch!.id,
              viewers: 0,
              scheduledAt: futureTime
            };
          });

          setLiveStreams(liveItems);
          setUpcomingStreams(upcomingItems);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading TargetBoard live streams:', err);
        if (isMounted) setLoading(false);
      }
    }

    loadStreams();

    return () => {
      isMounted = false;
    };
  }, [activeBatch?.id]);

  const hasEnrolled = savedCourses.length > 0;
  const isCurrentEnrolled = activeBatch ? savedCourses.some(c => c.id === activeBatch.id) : false;

  return (
    <section id="live-classes-section" className="scroll-mt-24 space-y-6">
      {/* TargetBoard Official Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#200c2a] via-[#170a20] to-[#120818] border-2 border-rose-500/40 shadow-2xl shadow-rose-950/40 relative overflow-hidden">
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-md shadow-rose-600/40">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              TargetBoard Live
            </span>

            {isCurrentEnrolled ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Enrolled Batch Stream
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Featured Batch
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white font-heading">
            Live <span className="text-pink-400">Classes</span>
          </h2>

          <p className="text-xs sm:text-sm text-pink-300/80 max-w-xl">
            {isCurrentEnrolled
              ? `🎯 आपके enrolled batch "${activeBatch?.name}" की live classes real-time में चल रही हैं।`
              : `🎯 Join live interactive sessions with top educators. नीचे से अपना enrolled batch चुनें:`
            }
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0 relative z-10">
          {activeBatch && !isCurrentEnrolled && (
            <button
              onClick={() => onToggleEnroll(activeBatch)}
              className="btn-pink-gradient px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white flex items-center gap-2 shadow-lg shadow-pink-600/30 hover:scale-[1.02] active:scale-95 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Enroll Batch</span>
            </button>
          )}

          {activeBatch && (
            <button
              onClick={() => onOpenCourse(activeBatch)}
              className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-pink-950/60 hover:bg-pink-900 border border-pink-500/30 text-pink-200 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
            >
              <FolderOpen className="w-4 h-4 text-pink-400" />
              <span>View Batch</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Enrolled Batches Switcher Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-bold text-pink-300/70 shrink-0 uppercase tracking-wider pl-1">
          {hasEnrolled ? 'Your Enrolled Batches:' : 'Select Batch for Live Sessions:'}
        </span>

        {(hasEnrolled ? savedCourses : courses.slice(0, 8)).map(course => {
          const isActive = activeBatch?.id === course.id;
          return (
            <button
              key={course.id}
              onClick={() => setSelectedBatchId(course.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-1.5 shrink-0 ${
                isActive
                  ? 'btn-pink-gradient text-white shadow-md shadow-pink-600/30 scale-105 ring-1 ring-pink-400'
                  : 'bg-[#180a22] hover:bg-pink-950/60 text-pink-300/80 border border-pink-500/20'
              }`}
            >
              <Radio className={`w-3 h-3 ${isActive ? 'animate-pulse text-white' : 'text-rose-400'}`} />
              <span className="truncate max-w-[200px]">{course.name}</span>
            </button>
          );
        })}
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="p-12 rounded-3xl bg-[#14081c] border border-pink-500/20 flex flex-col items-center justify-center text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-rose-400 animate-spin" />
          <p className="text-sm font-semibold text-white">Connecting to TargetBoard Live Classes...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* SECTION 1: LIVE NOW (TargetBoard exact Live Now grid) */}
          {liveStreams.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <h3 className="text-base sm:text-lg font-bold text-white font-heading">
                  Live Now
                </h3>
                <span className="text-xs font-mono text-rose-400 font-bold">
                  ({liveStreams.length})
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {liveStreams.map((stream, i) => (
                  <LiveClassCard
                    key={stream._id}
                    liveClass={stream}
                    index={i}
                    onJoin={onJoinStream}
                  />
                ))}
              </div>
            </div>
          )}

          {/* SECTION 2: UPCOMING SESSIONS (TargetBoard exact Upcoming grid) */}
          {upcomingStreams.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-pink-400" />
                <h3 className="text-base sm:text-lg font-bold text-white font-heading">
                  Upcoming
                </h3>
                <span className="text-xs font-mono text-pink-300/70 font-bold">
                  ({upcomingStreams.length})
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {upcomingStreams.map((stream, i) => (
                  <LiveClassCard
                    key={stream._id}
                    liveClass={stream}
                    index={i}
                    onJoin={onJoinStream}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {liveStreams.length === 0 && upcomingStreams.length === 0 && (
            <div className="text-center py-16 rounded-3xl bg-[#140a1c] border border-pink-500/20 space-y-3">
              <Radio className="w-12 h-12 text-pink-500/40 mx-auto" />
              <p className="text-base font-bold text-white">No live classes right now</p>
              <p className="text-xs text-pink-300/70">Check back later for scheduled sessions</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
