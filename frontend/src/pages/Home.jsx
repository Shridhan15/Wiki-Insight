import { useState } from "react";
import { loadArticle, askQuestion } from "../api";
import { Search, Loader2, Sparkles, Globe, RotateCcw } from "lucide-react";
import SummaryBox from "../components/SummaryBox";
import ChatBox from "../components/ChatBox";

export default function Home() {
  const [url, setUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  async function handleLoad() {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const data = await loadArticle(url);
      setSummary(data.summary);
      setChatHistory([]); // Reset chat for new context
    } catch (error) {
      console.error("Error loading article:", error);
      alert("Failed to load article. Please check the URL.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAsk(question) {
    if (!question.trim()) return;

    // Add user message immediately
    const userMsg = { role: "user", content: question };
    setChatHistory((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const data = await askQuestion(question);
      const aiMsg = { role: "ai", content: data.answer };
      setChatHistory((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsTyping(false);
    }
  }

  const resetSession = () => {
    setSummary("");
    setUrl("");
    setChatHistory([]);
  };

  // --- LANDING VIEW (Centered Hero Search) ---
  if (!summary && !loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:30px_30px]">
        <div className="max-w-3xl w-full text-center space-y-10 animate-in fade-in zoom-in duration-700">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 text-sm font-bold tracking-wide animate-pulse">
              <Sparkles size={16} />
              <span>AI-POWERED WIKIPEDIA RAG</span>
            </div>
            <h1 className="text-7xl font-black text-slate-900 tracking-tighter">
              WIKI<span className="text-indigo-600">.RAG</span>
            </h1>
            <p className="text-slate-500 text-xl max-w-xl mx-auto leading-relaxed">
              Input a Wikipedia URL to generate a structured deep-dive and start
              an intelligent conversation with the article's data.
            </p>
          </div>

          <div className="relative group max-w-2xl mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-blue-500 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative flex items-center bg-white rounded-2xl p-3 shadow-2xl border border-slate-100">
              <div className="pl-4 text-slate-400">
                <Globe size={24} />
              </div>
              <input
                type="text"
                className="w-full p-4 bg-transparent outline-none text-slate-700 text-lg font-medium"
                placeholder="Paste Wikipedia URL here..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLoad()}
              />
              <button
                onClick={handleLoad}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-xl font-black transition-all flex items-center gap-2 shadow-lg shadow-indigo-200 active:scale-95"
              >
                EXPLORE <Search size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- DASHBOARD VIEW (Split Screen Research) ---
  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden font-sans text-[16px]">
      {/* Centered Bigger Nav Panel */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200 px-10 py-5 z-20 shadow-sm">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-12 flex-1">
            <h1
              className="text-3xl font-black text-indigo-600 tracking-tighter shrink-0 cursor-pointer"
              onClick={resetSession}
            >
              WIKI.RAG
            </h1>

            {/* Centered Nav Search Bar */}
            <div className="hidden md:flex items-center bg-slate-100 rounded-2xl px-4 py-2 border border-slate-200 w-full max-w-xl group focus-within:bg-white focus-within:ring-2 ring-indigo-500 transition-all">
              <input
                className="bg-transparent flex-grow outline-none text-sm text-slate-700 font-medium px-2"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Change URL..."
              />
              <button
                onClick={handleLoad}
                className="text-slate-400 hover:text-indigo-600 transition-colors"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Search size={18} />
                )}
              </button>
            </div>
          </div>

          <button
            onClick={resetSession}
            className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors ml-4"
          >
            <RotateCcw size={14} /> Reset Session
          </button>
        </div>
      </header>

      <main className="flex-grow flex p-8 gap-8 overflow-hidden max-w-[1900px] mx-auto w-full">
        {loading ? (
          <div className="flex-grow flex flex-col items-center justify-center space-y-6 bg-white rounded-[3rem] border border-slate-200 shadow-sm animate-pulse">
            <div className="relative">
              <div className="w-24 h-24 border-[6px] border-indigo-50 border-t-indigo-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Globe size={32} className="text-indigo-600" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
                Analyzing Content
              </p>
              <p className="text-slate-400 font-medium">
                Extracting facts and building RAG index...
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* LEFT: Summary (Large, No-Scrollbar Container) */}
            <div className="flex-[6.5] bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-y-auto no-scrollbar p-12 transition-all">
              <SummaryBox summary={summary} />
            </div>

            {/* RIGHT: Chat (Modern Chat Interface) */}
            <div className="flex-[3.5] flex flex-col h-full overflow-hidden">
              <ChatBox
                history={chatHistory}
                onAsk={handleAsk}
                isTyping={isTyping}
                active={!!summary}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
