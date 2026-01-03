import {
  FileText,
  Cpu,
  ListTree,
  Lightbulb,
  Info,
  CheckCircle2,
  Bookmark,
  ArrowRight,
} from "lucide-react";

export default function SummaryBox({ summary }) {
  if (!summary) return null;

  let data;
  try {
    data = typeof summary === "string" ? JSON.parse(summary) : summary;
  } catch (e) {
    return (
      <div className="p-8 bg-red-50 text-red-600 rounded-3xl">
        Data Parse Error
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700 no-scrollbar text-slate-800">
      {/* 1. COMPACT HERO */}
      <div className="text-center pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-widest mb-4">
          <Bookmark size={12} fill="currentColor" /> Research Intelligence
        </div>
        <h1 className="text-4xl font-black tracking-tight uppercase leading-none">
          {data.title || "Article Summary"}
        </h1>
        <div className="h-1 w-16 bg-indigo-600 mx-auto mt-4 rounded-full"></div>
      </div>

      {/* 2. OVERVIEW */}
      <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
          <FileText size={20} className="text-indigo-600" /> Executive Overview
        </h2>
        <p className="text-slate-600 text-lg leading-relaxed whitespace-pre-line font-medium">
          {data.executive_summary}
        </p>
      </section>

      {/* 3. TECHNICAL STACK (Only shows if data exists) */}
      {data.technical_stack && data.technical_stack.length > 0 && (
        <section className="bg-slate-50 border border-slate-200 rounded-3xl p-8">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-700">
            <Cpu size={20} className="text-purple-600" /> Core Architecture
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.technical_stack.map((item, i) => (
              <div
                key={i}
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm transition-transform hover:scale-[1.01]"
              >
                <h4 className="font-bold text-indigo-600 text-sm mb-1">
                  {item.component}
                </h4>
                <p className="text-xs text-slate-500 leading-normal">
                  {item.role}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. MAJOR TOPICS / DETAILED BREAKDOWN (The heart of the page) */}
      <section className="space-y-6">
        <div className="flex items-center gap-4 px-2">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ListTree size={20} className="text-blue-600" /> Full Topic Analysis
          </h2>
          <div className="h-px flex-grow bg-slate-100"></div>
        </div>
        <div className="grid grid-cols-1 gap-6">
          {(data.detailed_breakdown || []).map((section, i) => (
            <div
              key={i}
              className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm transition-all hover:border-blue-400"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center text-[10px]">
                    {i + 1}
                  </span>
                  {section.section_title}
                </h3>
                <ArrowRight className="text-slate-200" size={18} />
              </div>
              <p className="text-slate-600 leading-relaxed mb-6 text-base italic">
                {section.content}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-50 pt-4">
                {(section.bullets || []).map((bullet, j) => (
                  <div
                    key={j}
                    className="flex items-start gap-2 text-sm text-slate-500"
                  >
                    <CheckCircle2
                      size={16}
                      className="text-emerald-500 mt-0.5 shrink-0"
                    />
                    <span className="font-medium">{bullet}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. USE CASES (Only shows if data exists) */}
      {data.use_cases && data.use_cases.length > 0 && (
        <section className="bg-amber-50/30 border border-amber-100 rounded-3xl p-8">
          <h2 className="text-lg font-bold text-amber-900 mb-6 flex items-center gap-2">
            <Lightbulb size={20} className="text-amber-500" /> Practical Context
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.use_cases.map((use, i) => (
              <div
                key={i}
                className="px-4 py-1.5 bg-white border border-amber-100 rounded-xl text-amber-900 text-xs font-bold shadow-sm hover:bg-amber-50 transition-colors cursor-default"
              >
                {use}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. SYNOPSIS */}
      <div className="bg-slate-900 rounded-[2.5rem] p-12 text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform">
          <Info size={120} />
        </div>
        <div className="relative z-10 text-center max-w-3xl mx-auto">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-4 block">
            Final Synthesis
          </span>
          <p className="text-xl text-slate-200 leading-relaxed font-light italic">
            "{data.tldr}"
          </p>
        </div>
      </div>
    </div>
  );
}
