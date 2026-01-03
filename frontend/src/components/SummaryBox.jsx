import { useState } from "react";
import {
  FileText,
  Cpu,
  ListTree,
  Lightbulb,
  Info,
  CheckCircle2,
  Bookmark,
  ArrowRight,
  Copy,
  Check,
  Globe,
} from "lucide-react";

export default function SummaryBox({ summary }) {
  const [copied, setCopied] = useState(false);

  if (!summary) return null;

  let data;
  try {
    data = typeof summary === "string" ? JSON.parse(summary) : summary;
  } catch (e) {
    return (
      <div className="p-8 bg-red-50 text-red-600 rounded-3xl border border-red-100 flex items-center gap-4">
        <Info size={24} />
        <span className="font-bold">Invalid Data Format: Parsing Failed</span>
      </div>
    );
  }

  const cleanTitle =
    data.title?.split(" ").slice(0, 4).join(" ") || "Article Summary";

  const handleCopy = () => {
    const textToCopy = `${data.title}\n\n${data.executive_summary}\n\nTL;DR: ${data.tldr}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-24 pb-32 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      {/* 1. HERO SECTION */}
      <div className="text-center pt-6 relative">
        <button
          onClick={handleCopy}
          className="absolute right-0 top-0 flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm"
        >
          {copied ? (
            <Check size={14} className="text-green-500" />
          ) : (
            <Copy size={14} />
          )}
          {copied ? "Copied" : "Copy Summary"}
        </button>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-[0.3em] mb-8">
          <Bookmark size={14} fill="currentColor" /> Comprehensive Analysis
        </div>
        <h1 className="text-8xl font-black text-slate-900 mb-8 tracking-tighter leading-none">
          {cleanTitle}
        </h1>
        <div className="h-2.5 w-40 bg-indigo-600 mx-auto rounded-full shadow-lg shadow-indigo-200"></div>
      </div>

      {/* 2. EXECUTIVE OVERVIEW (Indigo) */}
      <section className="bg-[#f0f4ff] rounded-[4rem] p-16 border border-indigo-100 shadow-sm relative group overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
          <Globe size={200} />
        </div>
        <h2 className="text-4xl font-black text-indigo-900 mb-8 flex items-center gap-4">
          <FileText size={32} className="text-indigo-600" /> Executive Overview
        </h2>
        <div className="text-slate-700 text-2xl leading-[1.6] font-serif italic space-y-6 relative z-10">
          {data.executive_summary}
        </div>
      </section>

      {/* 3. TECHNICAL STACK (Purple) */}
      <section className="bg-[#f8f7ff] rounded-[4rem] p-16 border border-purple-100">
        <div className="text-center mb-16">
          <h2 className="text-sm font-black text-purple-400 uppercase tracking-[0.5em] mb-4">
            Architecture
          </h2>
          <h3 className="text-5xl font-black text-slate-900">
            Core Components
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {(data.technical_stack || []).map((item, i) => (
            <div
              key={i}
              className="group p-12 bg-white border border-slate-200/60 rounded-[3rem] shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
            >
              <div className="w-20 h-20 bg-purple-600 rounded-[1.5rem] flex items-center justify-center text-white mb-8 shadow-xl shadow-purple-200 group-hover:rotate-3 transition-transform">
                <Cpu size={40} />
              </div>
              <h4 className="font-black text-slate-900 text-3xl mb-4 leading-tight truncate">
                {item.component}
              </h4>
              <p className="text-xl text-slate-500 leading-relaxed">
                {item.role}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. DEEP DIVE (Blue) */}
      <section className="space-y-16">
        <div className="flex items-center gap-8 px-6">
          <h2 className="text-5xl font-black text-slate-900 tracking-tight">
            Technical Breakdown
          </h2>
          <div className="h-1.5 flex-grow bg-blue-100 rounded-full"></div>
          <ListTree className="text-blue-600" size={48} />
        </div>

        <div className="space-y-12">
          {(data.detailed_breakdown || []).map((section, i) => (
            <div
              key={i}
              className="bg-white p-14 rounded-[4rem] border border-slate-200 shadow-sm hover:border-blue-300 transition-colors group"
            >
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-3xl font-black text-slate-800 bg-blue-50 px-8 py-3 rounded-2xl border border-blue-100">
                  {section.section_title}
                </h3>
                <ArrowRight
                  className="text-slate-200 group-hover:text-blue-500 transition-all"
                  size={32}
                />
              </div>
              <p className="text-slate-600 leading-[1.7] mb-12 text-2xl font-medium">
                {section.content}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(section.bullets || []).map((bullet, j) => (
                  <div
                    key={j}
                    className="flex items-start gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100 text-lg text-slate-600 font-bold hover:bg-white hover:shadow-lg transition-all"
                  >
                    <CheckCircle2
                      size={24}
                      className="text-emerald-500 mt-1 shrink-0"
                    />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. PRACTICAL APPLICATIONS (Amber) */}
      <section className="bg-[#fff9f0] rounded-[4rem] p-20 border border-amber-100">
        <h2 className="text-4xl font-black text-amber-900 mb-12 flex items-center gap-5">
          <div className="p-4 bg-amber-500 rounded-2xl text-white shadow-xl shadow-amber-200">
            <Lightbulb size={32} fill="currentColor" />
          </div>
          Real-World Applications
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {(data.use_cases || []).map((use, i) => (
            <div
              key={i}
              className="flex items-center gap-6 p-8 bg-white/90 backdrop-blur-sm rounded-[2.5rem] border border-amber-200 shadow-sm transition-transform hover:scale-[1.03]"
            >
              <div className="h-4 w-4 rounded-full bg-amber-500 shrink-0 shadow-[0_0:15px_rgba(245,158,11,0.6)]"></div>
              <span className="text-amber-950 font-black text-xl leading-snug">
                {use}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 6. SYNOPSIS (Midnight) */}
      <div className="bg-slate-950 rounded-[5rem] p-20 text-white relative shadow-2xl overflow-hidden group">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent)]"></div>
        <div className="relative z-10 flex flex-col items-center text-center space-y-10">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-indigo-500/20 rounded-[1.5rem] flex items-center justify-center backdrop-blur-md border border-white/10">
              <Info size={32} className="text-indigo-400" />
            </div>
            <span className="text-base font-black uppercase tracking-[0.6em] text-indigo-400">
              Final Synthesis
            </span>
          </div>
          <p className="text-4xl text-slate-200 leading-[1.4] font-medium max-w-5xl tracking-tight">
            {data.tldr}
          </p>
        </div>
      </div>
    </div>
  );
}
