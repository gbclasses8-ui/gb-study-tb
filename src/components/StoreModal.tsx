import React from 'react';
import { X, Store, Sparkles, CheckCircle2, Send, BookOpen, ShieldCheck, ArrowRight } from 'lucide-react';
import { Course } from '../types';

interface StoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  onSelectCourse: (course: Course) => void;
  onJoinTelegram: () => void;
}

export const StoreModal: React.FC<StoreModalProps> = ({
  isOpen,
  onClose,
  courses,
  onSelectCourse,
  onJoinTelegram
}) => {
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
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-black shadow-lg shadow-orange-500/30">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  GB STUDY STORE
                </span>
                <span className="text-xs text-pink-300/80 font-bold">100% Free Access</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white font-heading mt-0.5">
                Official Batch Store & Study Center
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
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-pink-100">
          {/* Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-950/80 via-purple-950/70 to-pink-950/80 border border-pink-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[11px] font-bold text-pink-400 uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Zero Cost Education Mission
              </span>
              <h4 className="text-base sm:text-lg font-black text-white font-heading">
                All Premium Batches & Notes are 100% FREE!
              </h4>
              <p className="text-xs text-pink-300/80">
                बिहार बोर्ड एवं अन्य राज्य बोर्ड के सभी लाइव क्लासेज, वीडियो लेक्चर्स और डिजिटल पैनल पीडीएफ नोट्स मुफ्त में उपलब्ध हैं।
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                onJoinTelegram();
              }}
              className="btn-pink-gradient py-2 px-4 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shrink-0 shadow-md shadow-pink-600/30 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Join Telegram</span>
            </button>
          </div>

          {/* Featured Courses Grid */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider text-pink-300 flex items-center justify-between">
              <span>Popular Enrolled Batches</span>
              <span className="text-xs text-pink-400 lowercase font-mono">({courses.length} total available)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {courses.slice(0, 6).map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    onClose();
                    onSelectCourse(c);
                  }}
                  className="p-3.5 rounded-2xl bg-[#1a0c24]/80 hover:bg-pink-950/60 border border-pink-500/20 hover:border-pink-500/50 transition cursor-pointer group flex items-start gap-3"
                >
                  <img
                    src={c.thumbnail || 'https://i.ibb.co/0R7qc34v/1093.jpg'}
                    alt={c.name}
                    className="w-14 h-14 rounded-xl object-cover shrink-0 border border-pink-500/30 group-hover:scale-105 transition"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase">
                      Class {c.group || 'All'} • FREE
                    </span>
                    <h5 className="text-xs sm:text-sm font-bold text-white group-hover:text-pink-300 transition line-clamp-2">
                      {c.name}
                    </h5>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-pink-300/70">
                      <span>{c.total_videos || 0} Videos</span>
                      <span>•</span>
                      <span>{c.total_pdfs || 0} PDFs</span>
                    </div>
                  </div>
                  <div className="p-1 rounded-lg bg-pink-500/20 text-pink-300 group-hover:bg-pink-500 group-hover:text-white transition shrink-0 self-center">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#180a22] border-t border-pink-500/20 flex items-center justify-between text-xs text-pink-300/80">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            Verified Educational Cloud
          </span>
          <button
            onClick={onClose}
            className="text-pink-300 hover:text-white underline cursor-pointer font-bold"
          >
            Explore Catalog →
          </button>
        </div>
      </div>
    </div>
  );
};
