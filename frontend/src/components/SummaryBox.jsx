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
} from "lucide-react";

export default function SummaryBox({ summary }) {
  const [copied, setCopied] = useState(false);

  if (!summary) return null;

  let data;
  try {
    data = typeof summary === "string" ? JSON.parse(summary) : summary;
  } catch (e) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-2xl">
        Parsing Error
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(`${data.title}\n${data.tldr}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700 no-scrollbar">
      {/* 1. HERO SECTION */}
      <div className="text-center pt-4 relative">
        <button
          onClick={handleCopy}
          className="absolute right-0 top-0 p-2 text-slate-400 hover:text-indigo-600 transition-colors"
        >
          {copied ? (
            <Check size={20} className="text-green-500" />
          ) : (
            <Copy size={20} />
          )}
        </button>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-widest mb-4">
          <Bookmark size={12} fill="currentColor" /> Knowledge Brief
        </div>
        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight uppercase">
          {data.title}
        </h1>
        <div className="h-1 w-20 bg-indigo-600 mx-auto rounded-full"></div>
      </div>

      {/* 2. EXECUTIVE OVERVIEW */}
      <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
          <FileText size={20} className="text-indigo-600" /> Overview
        </h2>
        <div className="text-slate-600 text-lg leading-relaxed whitespace-pre-line">
          {data.executive_summary}
        </div>
      </section>

      {/* 3. TECHNICAL STACK (Conditional Rendering) */}
      {data.technical_stack && data.technical_stack.length > 0 && (
        <section className="bg-slate-50 rounded-3xl p-8 border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
            <Cpu size={20} className="text-purple-600" /> Technical Architecture
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.technical_stack.map((item, i) => (
              <div
                key={i}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm"
              >
                <h4 className="font-bold text-indigo-600 text-sm mb-1">
                  {item.component}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {item.role}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. DEEP DIVE */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
          <ListTree size={20} className="text-blue-600" /> Insights & Analysis
        </h2>
        <div className="grid grid-cols-1 gap-6">
          {(data.detailed_breakdown || []).map((section, i) => (
            <div
              key={i}
              className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm group"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 text-lg">
                  {section.section_title}
                </h3>
                <ArrowRight
                  className="text-slate-200 group-hover:text-blue-500 transition-all"
                  size={20}
                />
              </div>
              <p className="text-slate-600 leading-relaxed mb-6 text-base">
                {section.content}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(section.bullets || []).map((bullet, j) => (
                  <div
                    key={j}
                    className="flex items-start gap-2 text-sm text-slate-500"
                  >
                    <CheckCircle2
                      size={16}
                      className="text-emerald-500 mt-0.5 shrink-0"
                    />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. PRACTICAL APPLICATIONS (Conditional Rendering) */}
      {data.use_cases && data.use_cases.length > 0 && (
        <section className="bg-amber-50/50 rounded-3xl p-8 border border-amber-100">
          <h2 className="text-xl font-bold text-amber-900 mb-6 flex items-center gap-3">
            <Lightbulb size={24} className="text-amber-500" /> Use Cases
          </h2>
          <div className="flex flex-wrap gap-3">
            {data.use_cases.map((use, i) => (
              <div
                key={i}
                className="px-4 py-2 bg-white border border-amber-200 rounded-xl text-amber-900 text-sm font-medium shadow-sm"
              >
                {use}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. SYNOPSIS */}
      <div className="bg-slate-900 rounded-3xl p-10 text-white text-center relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-4 block">
            Final Synthesis
          </span>
          <p className="text-xl text-slate-200 leading-relaxed">{data.tldr}</p>
        </div>
      </div>
    </div>
  );
}
