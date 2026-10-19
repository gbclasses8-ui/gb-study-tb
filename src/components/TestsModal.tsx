import React, { useState, useEffect } from 'react';
import { X, FileText, CheckCircle2, Clock, Award, Play, Sparkles, RefreshCw, ExternalLink } from 'lucide-react';
import { Course } from '../types';
import { fetchRealTests, RealTestItem } from '../utils/testsHelper';

interface TestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  onSelectCourse: (course: Course) => void;
  onStartRealTest: (test: RealTestItem) => void;
  savedCourses?: Course[];
}

export const TestsModal: React.FC<TestsModalProps> = ({
  isOpen,
  onClose,
  courses,
  onSelectCourse,
  onStartRealTest,
  savedCourses = []
}) => {
  const [realTests, setRealTests] = useState<RealTestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');

  // Target course: prefers student's enrolled batch, else top course
  const defaultCourse = savedCourses[0] || courses[0] || null;

  useEffect(() => {
    if (!isOpen) return;

    const courseIdToFetch = selectedBatchId || defaultCourse?.id;
    if (!courseIdToFetch) return;

    let isMounted = true;
    async function load() {
      setLoading(true);
      try {
        const tests = await fetchRealTests(courseIdToFetch);
        if (isMounted) {
          setRealTests(tests);
          setLoading(false);
        }
      } catch {
        if (isMounted) setLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedBatchId, defaultCourse?.id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-[#13091c] rounded-3xl border border-pink-500/35 shadow-2xl shadow-pink-600/30 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#1a0c24] border-b border-pink-500/20 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-black shadow-lg shadow-emerald-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  REAL BOARD TESTS
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500 text-white animate-pulse">
                  LIVE
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white font-heading mt-0.5">
                Official Examination Test Series
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-pink-950/60 hover:bg-pink-900 text-pink-300 hover:text-white border border-pink-500/30 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-pink-100">
          {/* Batch Selector pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {(savedCourses.length > 0 ? savedCourses : courses.slice(0, 6)).map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedBatchId(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer active:scale-95 ${
                  (selectedBatchId || defaultCourse?.id) === c.id
                    ? 'btn-pink-gradient text-white shadow-sm'
                    : 'bg-pink-950/40 text-pink-300/80 hover:text-white border border-pink-500/20'
                }`}
              >
                {c.name.split('-')[0] || c.name}
              </button>
            ))}
          </div>

          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-pink-950/60 border border-emerald-500/30 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                TargetBoard & State Board Real Examination Question Bank
              </p>
              <p className="text-[11px] text-pink-200/80">
                असली बोर्ड प्रश्नों के साथ ऑनलाइन टेस्ट दें, तुरंत स्कोर व सलूशन प्राप्त करें।
              </p>
            </div>
          </div>

          {/* Test Cards List */}
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2 text-center">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-xs text-pink-300">Loading authentic test series...</p>
            </div>
          ) : realTests.length > 0 ? (
            <div className="space-y-2.5">
              {realTests.map((test) => (
                <div
                  key={test._id}
                  className="p-3.5 sm:p-4 rounded-2xl bg-[#1b0d26]/80 hover:bg-pink-950/60 border border-pink-500/20 hover:border-pink-500/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                        Official Test
                      </span>
                      <span className="text-[11px] text-emerald-400 font-mono">
                        {test.type || 'Mock Test'}
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-pink-300 transition line-clamp-1">
                      {test.name}
                    </h4>
                    <div className="flex items-center gap-3 text-[11px] text-pink-300/80 font-mono">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3 text-emerald-400" />
                        {test.totalQuestions || 50} Questions
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-pink-400" />
                        {test.totalTime || 45} Mins
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      onStartRealTest(test);
                    }}
                    className="btn-pink-gradient py-2 px-4 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 shrink-0 shadow-md shadow-pink-600/30 cursor-pointer self-start sm:self-center active:scale-95 transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Test</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-pink-300/60">
              No tests found for this batch.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#180a22] border-t border-pink-500/20 flex items-center justify-between text-xs text-pink-300/80">
          <span className="text-emerald-400 font-semibold">
            100% Free Online Assessment Engine
          </span>
          <button
            onClick={onClose}
            className="text-pink-300 hover:text-white underline cursor-pointer font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
