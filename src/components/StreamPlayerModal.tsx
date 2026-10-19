import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ArrowLeft, 
  Radio, 
  Users, 
  Send, 
  MessageSquare, 
  Maximize2, 
  Minimize2, 
  ExternalLink,
  Sparkles,
  Share2,
  Clock,
  ShieldCheck,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { extractCleanVideoId, getTargetBoardIframeSrc } from '../utils/videoHelper';

export interface LiveStreamData {
  _id: string;
  title: string;
  assetId: string;
  subject?: string;
  teacherName?: string;
  teacherImage?: string;
  courseTitle?: string;
  viewers?: number;
  isLive?: boolean;
  startTime?: string;
  description?: string;
}

interface StreamPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  stream: LiveStreamData | null;
}

interface ChatMessage {
  id: string;
  user: string;
  text: string;
  time: string;
  isMe?: boolean;
  badge?: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  { id: '1', user: 'Aman Kumar', text: 'Namaste Sir! Aaj ka class bahut important hai.', time: 'Just now', badge: '10th Board' },
  { id: '2', user: 'Rohan Sharma', text: 'Sir numerical question number 4 phir se bataiye ga.', time: 'Just now' },
  { id: '3', user: 'Pooja Kumari', text: 'Target Board is best! Sab concept clear ho gaya sir.', time: '1m ago', badge: 'Topper' },
  { id: '4', user: 'Vikash Yadav', text: 'Sir pdf notes panel par kab upload hoga?', time: '1m ago' },
  { id: '5', user: 'Anjali Singh', text: 'Voice and video ekdum clear aa raha hai sir!', time: '2m ago' },
  { id: '6', user: 'Deepak Patel', text: 'Jai Bihar Board! 450+ marks lana hai is baar.', time: '2m ago', badge: 'Active' }
];

export const StreamPlayerModal: React.FC<StreamPlayerModalProps> = ({
  isOpen,
  onClose,
  stream
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState<string>('');
  const [viewersCount, setViewersCount] = useState<number>(stream?.viewers || 1420);
  const [activeTab, setActiveTab] = useState<'chat' | 'details'>('chat');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Auto simulate realistic live chat activity while stream is open
  useEffect(() => {
    if (!isOpen) return;

    setViewersCount(stream?.viewers || Math.floor(1350 + Math.random() * 250));

    const simulatedChat = [
      { user: 'Saurav Kumar', text: 'Sir formula note kar liya maine 👍' },
      { user: 'Kajal Roy', text: 'Physics numerical masterclass sir!' },
      { user: 'Amit Mishra', text: 'Target Board rocks 🔥' },
      { user: 'Nisha Verma', text: 'Next chapter kab start hoga sir?' },
      { user: 'Rajesh Pandit', text: 'Sir objective questions ka mock test bhi dijiye ga.' }
    ];

    let count = 0;
    const interval = setInterval(() => {
      if (count < simulatedChat.length) {
        const item = simulatedChat[count];
        const newMsg: ChatMessage = {
          id: String(Date.now()),
          user: item.user,
          text: item.text,
          time: 'Just now'
        };
        setMessages(prev => [...prev.slice(-40), newMsg]);
        setViewersCount(v => v + Math.floor(Math.random() * 7 - 3));
        count++;
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [isOpen, stream]);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen || !stream) return null;

  const cleanId = extractCleanVideoId(stream.assetId, false) || stream.assetId;
  const playerSrc = cleanId ? getTargetBoardIframeSrc(cleanId, stream.title) : '';

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: String(Date.now()),
      user: 'You',
      text: inputText.trim(),
      time: 'Just now',
      isMe: true,
      badge: 'Student'
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-200">
      <div 
        className={`relative w-full h-full ${
          isFullscreen ? 'p-0' : 'p-2 sm:p-4 md:p-6'
        } flex flex-col justify-between overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Navigation Bar (TargetBoard StreamTopBar Style) */}
        <div className="px-3 py-2.5 sm:px-6 sm:py-3 rounded-2xl bg-[#140a1c] border border-pink-500/25 flex items-center justify-between gap-3 shrink-0 shadow-lg mb-2 sm:mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-pink-950/60 hover:bg-pink-900 text-pink-300 hover:text-white border border-pink-500/30 transition cursor-pointer shrink-0"
              title="Go Back"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-sm shadow-rose-600/40">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  LIVE
                </span>

                <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                  <Users className="w-3 h-3" />
                  <span>{viewersCount.toLocaleString()} watching</span>
                </span>

                {stream.subject && (
                  <span className="hidden sm:inline px-2 py-0.5 rounded text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                    {stream.subject}
                  </span>
                )}
              </div>

              <h2 className="text-xs sm:text-sm md:text-base font-bold text-white font-heading truncate mt-0.5">
                {stream.title}
              </h2>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {playerSrc && (
              <a
                href={playerSrc}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex btn-pink-gradient px-3 py-1.5 rounded-xl text-white text-xs font-bold items-center gap-1.5 shadow-md shadow-pink-600/30 transition hover:scale-105"
                title="Open directly in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Tab</span>
              </a>
            )}

            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-pink-950/60 hover:bg-pink-900 text-pink-300 hover:text-white border border-pink-500/30 transition cursor-pointer"
              title="Share Stream Link"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsFullscreen(prev => !prev)}
              className="p-2 rounded-xl bg-pink-950/60 hover:bg-pink-900 text-pink-300 hover:text-white border border-pink-500/30 transition cursor-pointer"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-pink-950/80 hover:bg-rose-900 text-rose-300 hover:text-white border border-pink-500/40 transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content: Video Stage (Left) + Live Chat / Info (Right) */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 overflow-hidden">
          
          {/* LEFT: Video Stage (TargetBoard VideoStage style) */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col rounded-2xl sm:rounded-3xl bg-[#09040d] border border-pink-500/30 overflow-hidden shadow-2xl relative">
            {playerSrc ? (
              <div className="relative w-full h-full flex-1 bg-black">
                <iframe
                  src={playerSrc}
                  className="absolute inset-0 w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  title={stream.title}
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 bg-[#0e0714]">
                <Radio className="w-12 h-12 text-rose-500 animate-pulse" />
                <h3 className="text-base font-bold text-white font-heading">
                  Preparing TargetBoard Live Stream...
                </h3>
                <p className="text-xs text-pink-300/70 max-w-sm">
                  Connecting to live transmission servers for {stream.courseTitle || 'this enrolled batch'}.
                </p>
              </div>
            )}

            {/* Bottom Stream Status Strip */}
            <div className="px-4 py-2.5 bg-[#120818] border-t border-pink-500/20 flex items-center justify-between gap-3 text-xs shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-semibold text-emerald-400 text-[11px] sm:text-xs">
                  Smooth HD Live Transmission
                </span>
                <span className="hidden sm:inline text-pink-400/50">•</span>
                <span className="hidden sm:inline text-pink-300/80 text-[11px] truncate">
                  {stream.courseTitle || 'Target Board Official Batch'}
                </span>
              </div>

              {stream.teacherName && (
                <div className="text-[11px] font-bold text-pink-200">
                  Educator: <span className="text-pink-400">{stream.teacherName}</span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Live Chat & Classroom Discussion (TargetBoard LiveChat style) */}
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col rounded-2xl sm:rounded-3xl bg-[#140a1b] border border-pink-500/25 overflow-hidden shadow-2xl min-h-[300px] lg:min-h-0">
            {/* Chat Header Tabs */}
            <div className="p-3 bg-[#1b0d25] border-b border-pink-500/20 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1 bg-[#0e0614] p-1 rounded-xl border border-pink-500/20">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'chat'
                      ? 'btn-pink-gradient text-white shadow-sm'
                      : 'text-pink-300/70 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Live Chat</span>
                </button>

                <button
                  onClick={() => setActiveTab('details')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'details'
                      ? 'btn-pink-gradient text-white shadow-sm'
                      : 'text-pink-300/70 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Class Info</span>
                </button>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>ONLINE</span>
              </div>
            </div>

            {/* TAB 1: Real Live Chat Messages */}
            {activeTab === 'chat' ? (
              <div className="flex-1 min-h-0 flex flex-col justify-between">
                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
                  <div className="p-2.5 rounded-xl bg-pink-950/40 border border-pink-500/20 text-center text-[11px] text-pink-300/80">
                    👋 Welcome to TargetBoard Live Classroom! Ask your doubts directly in chat.
                  </div>

                  {messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col text-xs leading-relaxed ${
                        msg.isMe ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`font-bold text-[11px] ${
                          msg.isMe ? 'text-pink-300' : 'text-amber-300'
                        }`}>
                          {msg.user}
                        </span>

                        {msg.badge && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                            {msg.badge}
                          </span>
                        )}

                        <span className="text-[10px] text-pink-400/50 font-mono">
                          {msg.time}
                        </span>
                      </div>

                      <div className={`px-3 py-2 rounded-2xl max-w-[90%] break-words ${
                        msg.isMe 
                          ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-br-none shadow-md shadow-pink-600/20' 
                          : 'bg-[#1b0d25] border border-pink-500/20 text-pink-100 rounded-bl-none'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatBottomRef} />
                </div>

                {/* Input Bar */}
                <form 
                  onSubmit={handleSendMessage} 
                  className="p-2.5 sm:p-3 bg-[#1b0d25] border-t border-pink-500/20 flex items-center gap-2 shrink-0"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Send a doubt or comment to sir..."
                    className="flex-1 px-3 py-2 rounded-xl bg-[#0f0716] border border-pink-500/25 text-white placeholder-pink-300/40 text-xs focus:outline-none focus:border-pink-500"
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-xl btn-pink-gradient text-white shadow-md shadow-pink-600/30 hover:scale-105 active:scale-95 transition cursor-pointer shrink-0"
                    title="Send Message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            ) : (
              /* TAB 2: Class Details */
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400">
                    Live Session Topic
                  </span>
                  <h4 className="text-sm font-bold text-white font-heading">
                    {stream.title}
                  </h4>
                </div>

                <div className="p-3 rounded-2xl bg-[#1c0d28] border border-pink-500/20 space-y-2">
                  <div className="flex items-center justify-between text-pink-300/80">
                    <span>Enrolled Batch:</span>
                    <span className="font-bold text-white text-right truncate max-w-[150px]">
                      {stream.courseTitle || 'Target Board'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-pink-300/80">
                    <span>Subject:</span>
                    <span className="font-bold text-white">{stream.subject || 'All Subjects'}</span>
                  </div>
                  <div className="flex items-center justify-between text-pink-300/80">
                    <span>Status:</span>
                    <span className="font-bold text-rose-400 flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                      Live Transmission
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-300 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    100% Free Live Educational Access
                  </div>
                  <p className="text-[11px] text-pink-300/70 leading-relaxed">
                    All digital panel notes and study materials are available in the Notes section for this chapter.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
