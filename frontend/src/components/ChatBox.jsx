import { useState, useEffect, useRef } from "react";
import {
  User,
  Bot,
  Send,
  Loader2,
  MessageSquare,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { useTypingEffect } from "../useTypingEffect";

function MessageBubble({ msg, isLast }) {
  const isAi = msg.role === "ai";
  // Detect professional system notices from the backend
  const isSystemNotice =
    msg.content.includes("SYSTEM NOTICE") ||
    msg.content.includes("TECHNICAL ERROR");

  const text =
    isAi && isLast && !isSystemNotice
      ? useTypingEffect(msg.content)
      : msg.content;

  return (
    <div
      className={`flex gap-4 mb-6 ${
        isAi ? "justify-start" : "justify-end"
      } animate-in fade-in slide-in-from-bottom-2`}
    >
      {isAi && (
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
            isSystemNotice
              ? "bg-red-600 shadow-red-100"
              : "bg-indigo-600 shadow-indigo-100"
          }`}
        >
          {isSystemNotice ? (
            <AlertCircle size={20} className="text-white" />
          ) : (
            <Bot size={20} className="text-white" />
          )}
        </div>
      )}
      <div
        className={`max-w-[85%] p-4 rounded-[1.5rem] text-[15px] leading-relaxed shadow-sm border transition-colors duration-500 ${
          isAi
            ? isSystemNotice
              ? "bg-red-50 border-red-200 text-red-800 rounded-tl-none font-medium"
              : "bg-white border-slate-100 text-slate-700 rounded-tl-none"
            : "bg-indigo-600 border-indigo-500 text-white rounded-tr-none shadow-indigo-100"
        }`}
      >
        {isSystemNotice && (
          <div className="flex items-center gap-1.5 mb-1 text-[10px] font-black uppercase tracking-widest text-red-600">
            System Alert
          </div>
        )}
        {text}
      </div>
      {!isAi && (
        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
          <User size={20} className="text-slate-600" />
        </div>
      )}
    </div>
  );
}

export default function ChatBox({ history, onAsk, isTyping, active, title }) {
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [history, isTyping]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || !active) return;
    onAsk(input);
    setInput("");
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-xl h-full flex flex-col overflow-hidden transition-all duration-500">
      {/* 1. CHAT HEADER */}
      <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
            <MessageSquare size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
              AI Assistant
            </h3>
            <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest flex items-center gap-1">
              <ShieldCheck size={10} /> Knowledge Context Active
            </p>
          </div>
        </div>
        {active && (
          <div className="hidden xl:block px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-400 truncate max-w-[150px]">
            {title || "Article Loaded"}
          </div>
        )}
      </div>

      {/* 2. MESSAGES AREA */}
      <div
        ref={scrollRef}
        className="flex-grow p-8 overflow-y-auto no-scrollbar bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px]"
      >
        {!history.length && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 animate-in fade-in duration-700">
            <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center border border-slate-100 shadow-inner">
              <Bot size={32} className="text-slate-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-500">
                Assistant Ready
              </p>
              <p className="text-xs">
                Ask anything about the summary on the left.
              </p>
            </div>
          </div>
        )}

        {history.map((msg, idx) => (
          <MessageBubble
            key={idx}
            msg={msg}
            isLast={idx === history.length - 1}
          />
        ))}

        {isTyping && (
          <div className="flex gap-3 mb-6 items-center text-indigo-500 animate-pulse ml-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Loader2 size={14} className="animate-spin" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              Processing...
            </span>
          </div>
        )}
      </div>

      {/* 3. INPUT AREA */}
      <form
        onSubmit={handleSubmit}
        className="p-6 bg-white border-t border-slate-100"
      >
        <div className="relative flex items-center group">
          <input
            disabled={!active || isTyping}
            className="w-full pl-6 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all outline-none text-[15px] disabled:opacity-50 placeholder:text-slate-400"
            placeholder={
              active ? "Ask a follow-up..." : "Select an article first"
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-2 p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all active:scale-95 shadow-lg shadow-indigo-200"
          >
            {isTyping ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-3 font-medium uppercase tracking-widest">
          Contextual RAG Engine v1.0
        </p>
      </form>
    </div>
  );
}
