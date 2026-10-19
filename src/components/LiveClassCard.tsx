import React from 'react';
import { Radio, Users, Clock } from 'lucide-react';

export interface LiveClassItem {
  _id: string;
  title: string;
  name?: string;
  subject?: string;
  teacher?: {
    name?: string;
    fullName?: string;
    image?: string;
    profileImage?: string;
  };
  teacherName?: string;
  teacherImage?: string;
  assetId?: string;
  isLive?: boolean;
  status?: string;
  viewers?: number;
  viewerCount?: number;
  startTime?: string;
  scheduledAt?: string;
  courseTitle?: string;
  courseId?: string;
}

interface LiveClassCardProps {
  liveClass: LiveClassItem;
  index: number;
  onJoin: (liveClass: LiveClassItem) => void;
}

export const LiveClassCard: React.FC<LiveClassCardProps> = ({
  liveClass,
  index,
  onJoin
}) => {
  const title = liveClass.title || liveClass.name || 'Live Class';
  const teacherName = liveClass.teacherName || liveClass.teacher?.fullName || liveClass.teacher?.name || 'TargetBoard Faculty';
  const teacherImage = liveClass.teacherImage || liveClass.teacher?.profileImage || liveClass.teacher?.image || 'https://i.ibb.co/0R7qc34v/1093.jpg';
  const subject = liveClass.subject || 'All Subjects';
  const isLive = liveClass.isLive !== false;
  const viewers = liveClass.viewers || liveClass.viewerCount || (1200 + ((index * 137) % 800));
  const rawStartTime = liveClass.startTime || liveClass.scheduledAt;
  const startTime = rawStartTime
    ? new Date(rawStartTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '07:00 PM';

  return (
    <div
      onClick={() => onJoin(liveClass)}
      className="flex cursor-pointer items-start gap-2.5 sm:gap-3 rounded-2xl border border-rose-500/25 bg-[#160c1d] hover:bg-pink-950/60 p-3.5 sm:p-4 shadow-lg hover:shadow-rose-600/25 transition-all hover:border-rose-400 group active:scale-[0.99] relative overflow-hidden"
    >
      {/* Teacher Avatar (TargetBoard circular photo or broadcast icon) */}
      <div className="relative shrink-0">
        <img
          src={teacherImage}
          alt={teacherName}
          className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 border-rose-500/50 object-cover group-hover:scale-105 transition shadow-md"
          onError={(e) => {
            // Fallback to placeholder if image fails
            e.currentTarget.src = 'https://i.ibb.co/0R7qc34v/1093.jpg';
          }}
        />
        {isLive && (
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500 ring-2 ring-[#160c1d]"></span>
          </span>
        )}
      </div>

      {/* Center Details */}
      <div className="min-w-0 flex-1 overflow-hidden">
        {/* Top Badges */}
        <div className="mb-1 flex items-center gap-2 flex-wrap">
          {isLive && (
            <span className="flex items-center gap-1 text-[10px] font-extrabold text-rose-400 uppercase tracking-wide">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" /> LIVE
            </span>
          )}
          {subject && (
            <span className="text-[10px] font-bold text-pink-300/80 bg-pink-500/20 px-2 py-0.5 rounded-full border border-pink-500/30">
              {subject}
            </span>
          )}
          {liveClass.courseTitle && (
            <span className="text-[10px] text-pink-400/70 truncate hidden sm:inline">
              • {liveClass.courseTitle}
            </span>
          )}
        </div>

        {/* Title */}
        <p className="line-clamp-2 text-xs sm:text-sm font-bold leading-snug text-white group-hover:text-pink-300 transition-colors font-heading">
          {title}
        </p>

        {/* Teacher Name */}
        {teacherName && (
          <p className="mt-0.5 text-xs text-pink-300/70 font-medium">
            {teacherName}
          </p>
        )}

        {/* Metrics Row: Start Time & Viewers Count */}
        <div className="mt-2 flex items-center gap-3 text-[11px] text-pink-300/70 font-mono">
          {startTime && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-pink-400" /> {startTime}
            </span>
          )}
          {isLive && viewers > 0 && (
            <span className="flex items-center gap-1 text-amber-400 font-semibold">
              <Users className="w-3 h-3" /> {viewers.toLocaleString()} watching
            </span>
          )}
        </div>
      </div>

      {/* Right Action: Red Rose Join Button (TargetBoard App style) */}
      <button className="flex shrink-0 items-center gap-1 sm:gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 px-3 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-bold text-white shadow-md shadow-rose-600/30 group-hover:scale-105 active:scale-95 transition cursor-pointer self-center">
        <Radio className="w-3.5 h-3.5 animate-pulse" />
        <span>Join</span>
      </button>
    </div>
  );
};
