import React from 'react';
import { Video, FileText, Users, Heart, Sparkles, Folder, BookOpen, CheckCircle2 } from 'lucide-react';
import { Course } from '../types';

interface CourseCardProps {
  course: Course;
  onSelect: (course: Course) => void;
  isSaved: boolean;
  onToggleSave: (course: Course) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onSelect,
  isSaved,
  onToggleSave
}) => {
  // Format numbers nicely (e.g. 25.8k)
  const formatCount = (num?: number) => {
    if (!num) return '0';
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return num.toLocaleString();
  };

  const thumbnail = course.thumbnail || 'https://i.ibb.co/0R7qc34v/1093.jpg';

  return (
    <div className="w-full glass-card rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col group relative border border-pink-500/25 hover:border-pink-500/60 transition-all duration-300 shadow-xl shadow-black/40">
      {/* Top Media / Thumbnail */}
      <div 
        onClick={() => onSelect(course)}
        className="relative aspect-[16/9] w-full overflow-hidden bg-pink-950/40 select-none cursor-pointer"
      >
        <img
          src={thumbnail}
          alt={course.name}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://i.ibb.co/0R7qc34v/1093.jpg';
          }}
        />

        {/* Gradient Scrim Overlay for Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#140a1c] via-black/25 to-transparent pointer-events-none" />

        {/* Batch Class Pill badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/75 backdrop-blur-md border border-pink-500/40 text-[11px] sm:text-xs font-bold text-pink-200 uppercase tracking-wide shadow-md">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span>{course.group || 'Batch'}</span>
        </div>

        {/* Save Bookmark Heart Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave(course);
          }}
          className={`absolute top-3 right-3 w-10 h-10 rounded-xl backdrop-blur-md border transition flex items-center justify-center cursor-pointer shadow-md active:scale-95 ${
            isSaved
              ? 'bg-pink-600 text-white border-pink-400 shadow-pink-500/40'
              : 'bg-black/70 text-white/90 border-white/20 hover:bg-pink-950/90 hover:text-pink-300'
          }`}
          title={isSaved ? 'Remove from Saved' : 'Save Batch'}
          aria-label={isSaved ? 'Remove from Saved' : 'Save Batch'}
        >
          <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isSaved ? 'fill-white' : ''}`} />
        </button>

        {/* Active Enrollments Pill */}
        {course.enrollments ? (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs font-semibold text-pink-200 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-xl border border-pink-500/30 shadow-md">
            <Users className="w-3.5 h-3.5 text-pink-400" />
            <span>{formatCount(course.enrollments)} enrolled</span>
          </div>
        ) : null}
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 lg:p-6 flex-1 flex flex-col justify-between">
        <div>
          <h3 
            onClick={() => onSelect(course)}
            className="text-base sm:text-lg md:text-xl font-bold text-white font-heading hover:text-pink-300 cursor-pointer line-clamp-2 transition-colors mb-3.5 leading-snug"
          >
            {course.name}
          </h3>

          {/* Quick Metrics Bar: Videos, Notes, Folders */}
          <div className="grid grid-cols-3 gap-2 py-3 px-3 rounded-2xl bg-pink-950/35 border border-pink-500/20 text-center mb-4">
            <div className="flex flex-col items-center justify-center">
              <span className="text-sm sm:text-base font-black text-pink-300 font-heading">
                {course.total_videos || 0}
              </span>
              <span className="text-[10px] sm:text-[11px] text-pink-300/70 flex items-center justify-center gap-1 uppercase tracking-wider font-semibold mt-0.5">
                <Video className="w-3 h-3 text-pink-400" /> Videos
              </span>
            </div>
            <div className="flex flex-col items-center justify-center border-x border-pink-500/20">
              <span className="text-sm sm:text-base font-black text-pink-300 font-heading">
                {course.total_pdfs || 0}
              </span>
              <span className="text-[10px] sm:text-[11px] text-pink-300/70 flex items-center justify-center gap-1 uppercase tracking-wider font-semibold mt-0.5">
                <FileText className="w-3 h-3 text-pink-400" /> Notes
              </span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="text-sm sm:text-base font-black text-pink-300 font-heading">
                {course.total_folders || 0}
              </span>
              <span className="text-[10px] sm:text-[11px] text-pink-300/70 flex items-center justify-center gap-1 uppercase tracking-wider font-semibold mt-0.5">
                <Folder className="w-3 h-3 text-pink-400" /> Folders
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: 1. Study & 2. Enroll */}
        <div className="pt-2 grid grid-cols-2 gap-2 sm:gap-3">
          {/* Button 1: Study */}
          <button
            onClick={() => onSelect(course)}
            className="w-full min-h-[44px] sm:min-h-[48px] bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black py-2.5 px-3 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 active:scale-95 transition cursor-pointer"
            title="Start Studying"
          >
            <BookOpen className="w-4 h-4 text-black" />
            <span>Study</span>
          </button>

          {/* Button 2: Enroll / Enrolled */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(course);
            }}
            className={`w-full min-h-[44px] sm:min-h-[48px] py-2.5 px-3 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer ${
              isSaved
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 shadow-md shadow-emerald-500/20'
                : 'btn-pink-gradient text-white shadow-lg shadow-pink-600/35 hover:scale-[1.01]'
            }`}
            title={isSaved ? 'Enrolled in My Course' : 'Enroll in this batch'}
          >
            {isSaved ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Enrolled ✓</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Enroll</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
