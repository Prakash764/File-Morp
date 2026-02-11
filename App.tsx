
import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  FileText, 
  Image as ImageIcon, 
  Minimize2, 
  ArrowLeft,
  Settings,
  Github,
  TableProperties,
  ExternalLink
} from 'lucide-react';
import { ToolType, ToolConfig } from './types';
import Dashboard from './components/Dashboard';
import ToolView from './components/ToolView';
import Header from './components/Header';

const TOOLS: ToolConfig[] = [
  {
    id: ToolType.PDF_TO_EXCEL,
    title: "PDF to Excel",
    description: "Extract tables from PDF pages into editable spreadsheets using AI analysis.",
    icon: <FileSpreadsheet className="w-8 h-8" />,
    color: "from-blue-500 to-cyan-400"
  },
  {
    id: ToolType.IMAGE_TO_EXCEL,
    title: "Image to Excel",
    description: "Scan photos of documents or tables and convert them into spreadsheets.",
    icon: <TableProperties className="w-8 h-8" />,
    color: "from-yellow-500 to-amber-400"
  },
  {
    id: ToolType.EXCEL_TO_PDF,
    title: "Excel to PDF",
    description: "Render spreadsheet data into professional, clean PDF layouts.",
    icon: <FileText className="w-8 h-8" />,
    color: "from-green-500 to-emerald-400"
  },
  {
    id: ToolType.IMAGE_TO_PDF,
    title: "Image to PDF",
    description: "Convert single or multiple photos into a high-quality PDF document.",
    icon: <ImageIcon className="w-8 h-8" />,
    color: "from-purple-500 to-pink-400"
  },
  {
    id: ToolType.COMPRESS_PDF,
    title: "Compress PDF",
    description: "Reduce file size while maintaining readability and document integrity.",
    icon: <Minimize2 className="w-8 h-8" />,
    color: "from-orange-500 to-red-400"
  }
];

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolType | null>(null);

  const selectedTool = activeTool ? TOOLS.find(t => t.id === activeTool) : null;

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300 bg-slate-950">
      <Header 
        onHome={() => setActiveTool(null)} 
        isSubPage={!!activeTool} 
      />

      <main className="flex-grow container mx-auto px-4 py-8">
        {!activeTool ? (
          <Dashboard tools={TOOLS} onSelectTool={setActiveTool} />
        ) : (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6">
              <button 
                onClick={() => setActiveTool(null)}
                className="flex items-center space-x-2 text-slate-400 hover:text-indigo-400 transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="font-semibold">Return to Dashboard</span>
              </button>
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-600 uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Production Ready</span>
              </div>
            </div>
            
            {selectedTool && (
              <ToolView tool={selectedTool} />
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-900 py-8 mt-12 bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          <div className="flex flex-col items-center md:items-start space-y-1">
            <div className="text-slate-300 text-sm font-bold flex items-center space-x-2">
              <span>© 2024 FileMorph</span>
              <span className="text-slate-700">•</span>
              <span className="text-indigo-400 text-xs px-2 py-0.5 bg-indigo-500/10 rounded-md">v1.0.0 Stable</span>
            </div>
            <p className="text-slate-600 text-[11px] font-medium tracking-wide">
              Secure document intelligence powered by Gemini 3 Pro
            </p>
          </div>
          
          <div className="flex items-center space-x-8">
            <a href="#" className="flex items-center space-x-2 text-slate-500 hover:text-white transition-colors text-sm font-medium">
              <Github className="w-4 h-4" />
              <span>Open Source</span>
            </a>
            <a href="#" className="flex items-center space-x-2 text-slate-500 hover:text-white transition-colors text-sm font-medium">
              <ExternalLink className="w-4 h-4" />
              <span>Documentation</span>
            </a>
            <button className="p-2 text-slate-500 hover:text-indigo-400 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
