
import React, { useState, useRef } from 'react';
import { 
  ToolConfig, 
  ToolType, 
  ConversionState 
} from '../types';
import { 
  Upload, 
  X, 
  CheckCircle2, 
  Loader2, 
  Download, 
  AlertCircle,
  FileIcon,
  Zap,
  ShieldCheck,
  RefreshCcw,
  Info,
  Type
} from 'lucide-react';
import { convertFiles } from '../services/conversionService';

interface ToolViewProps {
  tool: ToolConfig;
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const ToolView: React.FC<ToolViewProps> = ({ tool }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [useOcr, setUseOcr] = useState(false);
  const [state, setState] = useState<ConversionState>({
    isProcessing: false,
    progress: 0,
    status: 'idle',
    error: null,
    resultUrl: null,
    resultFileName: null,
    resultSize: 0
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files) as File[];
      
      const isValid = newFiles.every(file => {
        const mimeType = file.type;
        const fileName = file.name.toLowerCase();

        if (tool.id === ToolType.PDF_TO_EXCEL || tool.id === ToolType.COMPRESS_PDF) {
          return mimeType === 'application/pdf' || fileName.endsWith('.pdf');
        }
        if (tool.id === ToolType.EXCEL_TO_PDF) {
          return fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
        }
        if (tool.id === ToolType.IMAGE_TO_EXCEL) {
          const validImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
          const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
          return validImageTypes.includes(mimeType) || validExtensions.some(ext => fileName.endsWith(ext));
        }
        if (tool.id === ToolType.IMAGE_TO_PDF) {
          return mimeType.startsWith('image/');
        }
        return true;
      });

      if (!isValid) {
        setState(prev => ({ ...prev, error: "Unsupported file format for this tool." }));
        return;
      }

      setFiles(newFiles);
      setState(prev => ({ ...prev, error: null, resultUrl: null }));
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    if (files.length <= 1) {
      setState(prev => ({ ...prev, resultUrl: null, error: null }));
    }
  };

  const handleConvert = async () => {
    if (files.length === 0) return;

    setState({
      isProcessing: true,
      progress: 0,
      status: 'Warming up AI engine...',
      error: null,
      resultUrl: null,
      resultFileName: null,
      resultSize: 0
    });

    try {
      const result = await convertFiles(tool.id, files, (progress, status) => {
        setState(prev => ({ ...prev, progress, status }));
      }, { useOcr });

      setState({
        isProcessing: false,
        progress: 100,
        status: 'Workflow Optimized',
        error: null,
        resultUrl: result.url,
        resultFileName: result.fileName,
        resultSize: result.size
      });
    } catch (err: any) {
      setState({
        isProcessing: false,
        progress: 0,
        status: 'failed',
        error: err.message || 'The conversion process was interrupted.',
        resultUrl: null,
        resultFileName: null,
        resultSize: 0
      });
    }
  };

  const isPDF = tool.id === ToolType.PDF_TO_EXCEL || tool.id === ToolType.COMPRESS_PDF;
  const isExcel = tool.id === ToolType.EXCEL_TO_PDF;
  const isImageToPdf = tool.id === ToolType.IMAGE_TO_PDF;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${tool.color} opacity-[0.03] blur-[100px] pointer-events-none`} />

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div className="flex items-center space-x-6">
            <div className={`p-4 rounded-3xl bg-gradient-to-br ${tool.color} text-white shadow-xl shadow-indigo-500/20`}>
              {React.cloneElement(tool.icon as React.ReactElement, { className: "w-10 h-10" })}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-3xl font-black text-white tracking-tight">{tool.title}</h2>
                <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase rounded border border-emerald-500/20">Turbo</div>
              </div>
              <p className="text-slate-400 font-medium">Parallel processing & Gemini Flash enabled</p>
            </div>
          </div>
          {state.resultUrl && (
            <button 
              onClick={() => {
                setFiles([]);
                setState(prev => ({ ...prev, resultUrl: null }));
              }}
              className="flex items-center space-x-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl transition-all border border-slate-700"
            >
              <RefreshCcw className="w-4 h-4" />
              <span className="text-sm font-bold">New Task</span>
            </button>
          )}
        </div>

        {!state.resultUrl && !state.isProcessing && (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="group relative border-2 border-dashed border-slate-700/50 hover:border-indigo-500/50 bg-slate-800/20 rounded-[2rem] p-16 flex flex-col items-center justify-center space-y-6 cursor-pointer transition-all hover:bg-indigo-500/[0.02]"
          >
            <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center text-slate-400 group-hover:text-indigo-400 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-inner">
              <Upload className="w-10 h-10" />
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white mb-2">Deploy Assets</p>
              <p className="text-slate-500 font-medium max-w-xs mx-auto">
                {isPDF ? "Strictly PDF documents supported" : 
                 isExcel ? "Spreadsheets (.xlsx, .xls) only" : 
                 "High-resolution images preferred"}
              </p>
            </div>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple={tool.id === ToolType.IMAGE_TO_PDF || tool.id === ToolType.IMAGE_TO_EXCEL || tool.id === ToolType.COMPRESS_PDF}
              accept={isPDF ? ".pdf" : isExcel ? ".xlsx,.xls" : tool.id === ToolType.IMAGE_TO_EXCEL ? ".jpg,.jpeg,.png,.webp" : "image/*"}
              className="hidden" 
            />
          </div>
        )}

        {isImageToPdf && files.length > 0 && !state.resultUrl && !state.isProcessing && (
          <div className="mt-8 mb-4 p-6 bg-slate-800/30 border border-slate-700/50 rounded-2xl flex items-center justify-between group">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                <Type className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Gemini Flash OCR Layer</p>
                <p className="text-xs text-slate-500 font-medium">Inject searchable text at 10x speed</p>
              </div>
            </div>
            <button 
              onClick={() => setUseOcr(!useOcr)}
              className={`w-14 h-7 rounded-full transition-all duration-300 relative ${useOcr ? 'bg-indigo-600' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-lg ${useOcr ? 'left-8' : 'left-1'}`} />
            </button>
          </div>
        )}

        {files.length > 0 && !state.resultUrl && !state.isProcessing && (
          <div className="mt-8 space-y-4 animate-in fade-in duration-500">
            <div className="flex justify-between items-center px-2">
              <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest">Active Queue</h4>
              <span className="text-xs font-bold text-indigo-400 bg-indigo-400/10 px-3 py-1 rounded-full">
                {files.length} {files.length === 1 ? 'FILE' : 'FILES'}
              </span>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-800/40 p-5 rounded-2xl border border-slate-700/30 group hover:border-slate-600 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                      <FileIcon className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-slate-200 truncate max-w-[200px] md:max-w-md">{file.name}</p>
                      <p className="text-xs text-slate-500 font-mono">{formatBytes(file.size)}</p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                    className="p-2 hover:bg-red-500/10 rounded-xl text-slate-500 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            <button 
              onClick={handleConvert}
              className={`w-full py-5 mt-4 bg-gradient-to-r ${tool.color} text-white font-black text-lg rounded-2xl shadow-2xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-3`}
            >
              <Zap className="w-5 h-5" />
              <span>Launch Transformation</span>
            </button>
          </div>
        )}

        {state.isProcessing && (
          <div className="mt-12 py-12 flex flex-col items-center space-y-10 animate-in zoom-in-95 duration-500">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20 animate-pulse" />
              <div className="relative w-24 h-24 flex items-center justify-center">
                <Loader2 className="w-full h-full text-emerald-500 animate-spin stroke-[3px]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-slate-900 rounded-full border border-slate-700 shadow-xl flex items-center justify-center">
                    <span className="text-xs font-black text-emerald-400">{Math.round(state.progress)}%</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <p className="text-2xl font-black text-white tracking-tight">{state.status}</p>
              <div className="flex items-center justify-center space-x-2">
                <Zap className="w-3 h-3 text-indigo-400 animate-pulse" />
                <p className="text-slate-500 text-sm font-medium">Parallel execution active...</p>
              </div>
            </div>

            <div className="w-full max-w-md bg-slate-800/50 h-2 rounded-full overflow-hidden border border-slate-700/30">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500 ease-out" 
                style={{ width: `${state.progress}%` }}
              />
            </div>
          </div>
        )}

        {state.resultUrl && (
          <div className="mt-12 p-10 rounded-[2rem] bg-emerald-500/[0.03] border border-emerald-500/10 flex flex-col items-center text-center space-y-8 animate-in slide-in-from-bottom-8 duration-700">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center text-emerald-500 shadow-2xl shadow-emerald-500/20 animate-bounce-short">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <div>
              <h3 className="text-3xl font-black text-white mb-2 tracking-tight">Assets Optimized</h3>
              <p className="text-slate-400 font-medium">The high-speed pipeline has finalized your request.</p>
            </div>
            
            <div className="bg-slate-800/40 px-6 py-4 rounded-2xl border border-slate-700/30 flex items-center space-x-4">
              <Info className="w-5 h-5 text-indigo-400" />
              <div className="text-left">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Output Package</p>
                <p className="text-sm font-bold text-slate-200">{state.resultFileName}</p>
                <p className="text-xs font-mono text-emerald-400 font-bold">{formatBytes(state.resultSize || 0)}</p>
              </div>
            </div>

            <a 
              href={state.resultUrl} 
              download={state.resultFileName || 'filemorph-output'}
              className="w-full sm:w-auto px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-lg transition-all shadow-2xl shadow-emerald-600/30 hover:scale-[1.05] flex items-center justify-center space-x-3"
            >
              <Download className="w-6 h-6" />
              <span>Download Final Assets</span>
            </a>
          </div>
        )}

        {state.error && (
          <div className="mt-12 p-8 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start space-x-6 text-red-400 animate-in shake duration-500">
            <AlertCircle className="w-8 h-8 shrink-0 mt-1" />
            <div>
              <p className="text-lg font-black tracking-tight">Operation Failed</p>
              <p className="font-medium opacity-80">{state.error}</p>
              <button 
                onClick={() => setState(prev => ({ ...prev, error: null }))}
                className="mt-4 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-sm font-bold transition-all"
              >
                Reset & Retry
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
        <div className="flex items-center space-x-4 group">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">Encrypted Protocol</p>
            <p className="text-slate-500 text-xs font-medium">Secure local synthesis</p>
          </div>
        </div>
        <div className="flex items-center space-x-4 group">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">Turbo Engine</p>
            <p className="text-slate-500 text-xs font-medium">Parallel processing v2.0</p>
          </div>
        </div>
        <div className="flex items-center space-x-4 group">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">Validated AI</p>
            <p className="text-slate-500 text-xs font-medium">Gemini-Flash powered</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolView;
