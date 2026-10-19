import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  ChevronLeft, 
  Award, 
  RefreshCw, 
  Play, 
  ExternalLink,
  HelpCircle,
  FileText
} from 'lucide-react';
import { fetchRealTestQuestions, RealQuestion } from '../utils/testsHelper';

interface TestRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  testId: string;
  testTitle: string;
  totalQuestions?: number;
  totalTimeMinutes?: number;
}

export const TestRunnerModal: React.FC<TestRunnerModalProps> = ({
  isOpen,
  onClose,
  testId,
  testTitle,
  totalQuestions = 50,
  totalTimeMinutes = 45
}) => {
  const [questions, setQuestions] = useState<RealQuestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(totalTimeMinutes * 60);

  // Load questions on open
  useEffect(() => {
    if (!isOpen || !testId) {
      setQuestions([]);
      setLoading(true);
      setSubmitted(false);
      setUserAnswers({});
      setCurrentIndex(0);
      return;
    }

    let isMounted = true;
    async function load() {
      setLoading(true);
      setSecondsRemaining(totalTimeMinutes * 60);
      try {
        const data = await fetchRealTestQuestions(testId);
        if (isMounted) {
          setQuestions(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) setLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [isOpen, testId, totalTimeMinutes]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || submitted || loading || secondsRemaining <= 0) return;

    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, submitted, loading, secondsRemaining]);

  if (!isOpen) return null;

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (qIdx: number, optIdx: number) => {
    if (submitted) return;
    setUserAnswers(prev => ({
      ...prev,
      [qIdx]: optIdx
    }));
  };

  const activeQuestion = questions[currentIndex];
  const answeredCount = Object.keys(userAnswers).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl h-[94vh] sm:h-[88vh] rounded-3xl bg-[#12081a] border border-pink-500/35 shadow-2xl shadow-pink-600/30 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 bg-[#1b0d26] border-b border-pink-500/20 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-black flex items-center justify-center shrink-0 font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                Official Online Test
              </span>
              <h3 className="text-xs sm:text-sm font-bold text-white truncate font-heading">
                {testTitle}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Timer */}
            {!submitted && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-950/70 border border-pink-500/30 text-pink-300 text-xs font-mono font-bold">
                <Clock className="w-3.5 h-3.5 text-pink-400" />
                <span>{formatTimer(secondsRemaining)}</span>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-pink-950/60 hover:bg-pink-900 text-pink-300 hover:text-white border border-pink-500/30 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-[#0e0614]">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3">
              <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin" />
              <h4 className="text-sm sm:text-base font-bold text-white">Loading Real Test Questions...</h4>
              <p className="text-xs text-pink-300/60">Fetching authentic Bihar Board examination question bank.</p>
            </div>
          ) : submitted ? (
            /* Results Screen */
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-5">
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-2xl shadow-emerald-500/30 animate-in zoom-in">
                <Award className="w-10 h-10" />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Test Completed!
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white font-heading">
                  Your Score: {answeredCount} / {questions.length} Attempted
                </h3>
                <p className="text-xs sm:text-sm text-pink-300/80 max-w-md">
                  Great effort! Your test submission has been recorded. Review your performance or take the test on the TargetBoard app for state-level rank.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <a
                  href={`https://targetboard.co.in/dashboard/test/${testId}/start`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-pink-gradient py-2.5 px-5 rounded-xl font-bold text-xs sm:text-sm text-white flex items-center gap-2 shadow-lg shadow-pink-600/30"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Ranking on TargetBoard
                </a>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setUserAnswers({});
                    setCurrentIndex(0);
                    setSecondsRemaining(totalTimeMinutes * 60);
                  }}
                  className="py-2.5 px-5 rounded-xl font-bold text-xs sm:text-sm bg-pink-950/60 hover:bg-pink-900 border border-pink-500/30 text-pink-300 hover:text-white transition cursor-pointer"
                >
                  Retake Test
                </button>
              </div>
            </div>
          ) : questions.length > 0 && activeQuestion ? (
            /* Active Question Screen */
            <div className="space-y-6">
              {/* Question progress */}
              <div className="flex items-center justify-between text-xs text-pink-300/80 pb-2 border-b border-pink-500/20">
                <span className="font-bold">
                  Question <span className="text-white text-sm">{currentIndex + 1}</span> of {questions.length}
                </span>
                <span className="font-mono text-emerald-400">
                  {answeredCount} Answered
                </span>
              </div>

              {/* Question Text with formula support */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#180c22] border border-pink-500/20 space-y-3">
                <div 
                  className="text-sm sm:text-base font-semibold text-white leading-relaxed font-body"
                  dangerouslySetInnerHTML={{ __html: activeQuestion.question }}
                />
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {(activeQuestion.options || []).map((opt, oIdx) => {
                  const isSelected = userAnswers[currentIndex] === oIdx;
                  const letter = String.fromCharCode(65 + oIdx);
                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleSelectOption(currentIndex, oIdx)}
                      className={`w-full p-3 sm:p-4 rounded-2xl border text-left flex items-center gap-3.5 transition-all cursor-pointer active:scale-[0.99] ${
                        isSelected
                          ? 'bg-gradient-to-r from-pink-950/80 to-purple-950/80 border-pink-500 shadow-md shadow-pink-600/30 ring-1 ring-pink-500'
                          : 'bg-[#150a1d] hover:bg-pink-950/40 border-pink-500/20 hover:border-pink-500/40 text-pink-100'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition ${
                        isSelected 
                          ? 'bg-pink-500 text-white shadow-sm' 
                          : 'bg-pink-950/60 text-pink-300 border border-pink-500/30'
                      }`}>
                        {letter}
                      </span>
                      <div 
                        className="text-xs sm:text-sm font-medium leading-snug flex-1"
                        dangerouslySetInnerHTML={{ __html: opt.text }}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Question Navigation Palette */}
              <div className="pt-2">
                <span className="text-[10px] uppercase font-bold text-pink-400/80 tracking-wider block mb-2">
                  Question Palette ({questions.length} Total):
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1">
                  {questions.map((_, qIdx) => {
                    const isAnswered = userAnswers[qIdx] !== undefined;
                    const isCurrent = qIdx === currentIndex;
                    return (
                      <button
                        key={qIdx}
                        onClick={() => setCurrentIndex(qIdx)}
                        className={`w-7 h-7 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          isCurrent
                            ? 'bg-pink-500 text-white ring-2 ring-white shadow-md'
                            : isAnswered
                            ? 'bg-emerald-600 text-white'
                            : 'bg-pink-950/40 text-pink-300/60 hover:text-white border border-pink-500/20'
                        }`}
                      >
                        {qIdx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Fallback if no questions were returned */
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-pink-400 mx-auto" />
              <h4 className="text-base font-bold text-white">TargetBoard Official Quiz Portal</h4>
              <p className="text-xs text-pink-300/70 max-w-sm">
                This test is connected directly with the official TargetBoard examination engine.
              </p>
              <a
                href={`https://targetboard.co.in/dashboard/test/${testId}/start`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-pink-gradient py-2.5 px-6 rounded-xl font-bold text-xs sm:text-sm text-white flex items-center gap-2 shadow-lg shadow-pink-600/30"
              >
                <ExternalLink className="w-4 h-4" />
                Start Test on TargetBoard
              </a>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        {!submitted && !loading && questions.length > 0 && (
          <div className="px-4 py-3 sm:px-6 sm:py-3.5 bg-[#170a22] border-t border-pink-500/20 flex items-center justify-between gap-3 shrink-0">
            <button
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="py-2 px-3.5 rounded-xl font-bold text-xs bg-pink-950/60 hover:bg-pink-900 disabled:opacity-40 text-pink-300 border border-pink-500/30 flex items-center gap-1.5 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              onClick={() => setSubmitted(true)}
              className="py-2 px-4 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 transition cursor-pointer"
            >
              Submit Test ({answeredCount}/{questions.length})
            </button>

            <button
              onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
              disabled={currentIndex === questions.length - 1}
              className="btn-pink-gradient py-2 px-4 rounded-xl font-bold text-xs text-white disabled:opacity-40 flex items-center gap-1.5 shadow-md shadow-pink-600/30 transition cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
