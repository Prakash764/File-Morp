
import React from 'react';
import { ToolConfig, ToolType } from '../types';
import { ArrowRight, Sparkles, ShieldCheck, Zap } from 'lucide-react';

interface DashboardProps {
  tools: ToolConfig[];
  onSelectTool: (id: ToolType) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ tools, onSelectTool }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 pb-20">
      {/* Hero Section */}
      <div className="text-center mb-16 space-y-6 mt-12 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-4">
          <Sparkles className="w-3 h-3" />
          <span>Next-Gen Document Intelligence</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
          Shape Your <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            Digital Workflow.
          </span>
        </h1>
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-medium">
          The professional toolkit to convert, compress, and analyze documents with high-precision AI. Completely secure, entirely seamless.
        </p>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {tools.map((tool, index) => (
          <div
            key={tool.id}
            onClick={() => onSelectTool(tool.id)}
            className="group relative bg-slate-800/20 backdrop-blur-sm border border-slate-700/50 hover:border-indigo-500/50 rounded-3xl p-8 cursor-pointer transition-all duration-500 hover:shadow-[0_20px_50px_rgba(79,70,229,0.15)] hover:-translate-y-2 animate-in fade-in slide-in-from-bottom-8 fill-mode-both"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-white mb-8 shadow-2xl shadow-black/40 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
              {tool.icon}
            </div>
            
            <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-indigo-300 transition-colors">
              {tool.title}
            </h3>
            
            <p className="text-slate-400 text-base leading-relaxed mb-8 opacity-80 group-hover:opacity-100 transition-opacity">
              {tool.description}
            </p>

            <div className="flex items-center text-indigo-400 font-bold text-sm group-hover:translate-x-2 transition-transform duration-300">
              <span>Initialize Tool</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </div>

            {/* Aesthetic Glow */}
            <div className={`absolute -inset-px bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-[0.05] transition-opacity duration-500 rounded-3xl pointer-events-none`} />
          </div>
        ))}
      </div>

      {/* Feature Highlights */}
      <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="flex flex-col items-center text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h4 className="text-xl font-bold text-white">Private by Design</h4>
          <p className="text-slate-500 text-sm">Most processing happens on-device. Your sensitive data stays within your browser environment.</p>
        </div>
        <div className="flex flex-col items-center text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-700">
          <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Zap className="w-6 h-6" />
          </div>
          <h4 className="text-xl font-bold text-white">Lightning Fast</h4>
          <p className="text-slate-500 text-sm">Optimized WebAssembly and AI acceleration ensure near-instant turnaround for large files.</p>
        </div>
        <div className="flex flex-col items-center text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-900">
          <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <h4 className="text-xl font-bold text-white">AI Enhanced</h4>
          <p className="text-slate-500 text-sm">Gemini-powered table analysis extracts deep meaning from even the most complex documents.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
