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
  const isSystemNotice =
    msg.content.includes("SYSTEM NOTICE") ||
    msg.content.includes("TECHNICAL ERROR");

  const text =
    isAi && isLast && !isSystemNotice
      ? useTypingEffect(msg.content)
      : msg.content;

  return (
    <div
      className={`flex gap-3 mb-4 ${
        isAi ? "justify-start" : "justify-end"
      } animate-in fade-in duration-300`}
    >
      {isAi && (
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-sm transition-transform ${
            isSystemNotice
              ? "bg-red-600 shadow-red-100"
              : "bg-indigo-600 shadow-indigo-100"
          }`}
        >
          {isSystemNotice ? (
            <AlertCircle size={14} className="text-white" />
          ) : (
            <Bot size={14} className="text-white" />
          )}
        </div>
      )}
      <div
        className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-sm border transition-all ${
          isAi
            ? isSystemNotice
              ? "bg-red-50 border-red-100 text-red-900 rounded-tl-none font-medium"
              : "bg-white border-slate-200 text-slate-700 rounded-tl-none shadow-slate-100/50"
            : "bg-indigo-600 border-indigo-500 text-white rounded-tr-none shadow-indigo-100"
        }`}
      >
        {isSystemNotice && (
          <div className="flex items-center gap-1.5 mb-1 text-[9px] font-black uppercase tracking-[0.2em] text-red-600">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
            System Alert
          </div>
        )}
        <div className="whitespace-pre-wrap">{text}</div>
      </div>
      {!isAi && (
        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 shadow-sm">
          <User size={14} className="text-slate-500" />
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
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm h-full flex flex-col overflow-hidden transition-all">
      {/* 1. COMPACT HEADER */}
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white rounded-md shadow-sm text-indigo-600 border border-slate-100">
            <MessageSquare size={16} />
          </div>
          <div>
            <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-tight">
              Research Assistant
            </h3>
            <p className="text-[9px] text-indigo-500 font-bold uppercase tracking-[0.1em] flex items-center gap-1">
              <ShieldCheck size={10} /> Live Context
            </p>
          </div>
        </div>
        {active && (
          <div className="hidden xl:block px-2 py-0.5 bg-indigo-100/50 border border-indigo-100 rounded-md text-[9px] font-bold text-indigo-700 truncate max-w-[120px]">
            {title || "Active Session"}
          </div>
        )}
      </div>

      {/* 2. MESSAGES AREA - Denser Pattern */}
      <div
        ref={scrollRef}
        className="grow p-5 overflow-y-auto no-scrollbar bg-[radial-gradient(#e2e8f0_0.8px,transparent_0.8px)] bg-[size:15px_15px]"
      >
        {!history.length && (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-2 opacity-60">
            <Bot size={24} />
            <p className="text-[10px] font-bold uppercase tracking-widest">
              Awaiting Inquiry
            </p>
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
          <div className="flex gap-2 mb-4 items-center text-indigo-500 animate-pulse ml-2">
            <Loader2 size={12} className="animate-spin" />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em]">
              Processing...
            </span>
          </div>
        )}
      </div>

      {/* 3. INPUT AREA - Slim & Professional */}
      <form
        onSubmit={handleSubmit}
        className="p-4 bg-white border-t border-slate-100"
      >
        <div className="relative flex items-center group w-full">
          <input
            disabled={!active || isTyping}
            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-[13px] text-slate-700 placeholder:text-slate-400 disabled:opacity-50"
            placeholder={active ? "Send a message..." : "Context required"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-1.5 p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:text-slate-300"
          >
            {isTyping ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
        <p className="text-center text-[9px] text-slate-400 mt-3 font-medium uppercase tracking-[0.1em]">
          Llama 3.3 RAG Engine
        </p>
      </form>
    </div>
  );
}
