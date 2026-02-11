
import { ToolType } from '../types';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import JSZip from 'jszip';
import { extractAndAnalyzeDocument, performOcr, TableData } from './geminiService';

declare const pdfjsLib: any;

interface ConversionResult {
  url: string;
  fileName: string;
  size: number;
}

interface ConversionOptions {
  useOcr?: boolean;
}

const initPdfWorker = () => {
  if (typeof pdfjsLib !== 'undefined' && pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
  }
};

export const convertFiles = async (
  type: ToolType, 
  files: File[], 
  onProgress: (progress: number, status: string) => void,
  options: ConversionOptions = {}
): Promise<ConversionResult> => {
  initPdfWorker();
  
  switch (type) {
    case ToolType.IMAGE_TO_PDF:
      return await convertImagesToPdf(files, onProgress, options.useOcr);
    case ToolType.IMAGE_TO_EXCEL:
      return await convertImagesToExcel(files, onProgress);
    case ToolType.PDF_TO_EXCEL:
      return await convertPdfToExcel(files[0], onProgress);
    case ToolType.EXCEL_TO_PDF:
      return await convertExcelToPdf(files[0], onProgress);
    case ToolType.COMPRESS_PDF:
      return await compressPdf(files, onProgress);
    default:
      throw new Error("Unsupported conversion type");
  }
};

const convertImagesToExcel = async (files: File[], onProgress: (p: number, s: string) => void): Promise<ConversionResult> => {
  onProgress(5, "Preparing high-speed analysis...");
  
  // Parallel load of images
  const imagePromises = files.map(async (file, idx) => {
    const base64Data = await readFileAsBase64(file);
    return { data: base64Data, mimeType: file.type, name: file.name };
  });

  const processedImages = await Promise.all(imagePromises);
  const allTableData: TableData[] = [];

  for (let i = 0; i < processedImages.length; i++) {
    const img = processedImages[i];
    onProgress(10 + (i / processedImages.length * 70), `AI analyzing: ${img.name}...`);
    const results = await extractAndAnalyzeDocument([{ data: img.data, mimeType: img.mimeType }]);
    
    if (results) {
      results.forEach((table) => {
        const uniqueName = `${img.name.split('.')[0].substring(0, 10)}_${table.sheetName}`.substring(0, 31);
        allTableData.push({ ...table, sheetName: uniqueName });
      });
    }
  }

  return generateExcelFile(allTableData, "FileMorph_Analysis.xlsx", onProgress);
};

const convertImagesToPdf = async (files: File[], onProgress: (p: number, s: string) => void, useOcr: boolean = false): Promise<ConversionResult> => {
  onProgress(5, 'Parallelizing asset loading...');
  
  // High-speed parallel loading
  const loadAsset = async (file: File) => {
    const data = await readFileAsBase64(file);
    return new Promise<{data: string, mimeType: string, width: number, height: number}>((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ data, mimeType: file.type, width: img.width, height: img.height });
      img.src = data;
    });
  };

  const processedPages = await Promise.all(files.map(loadAsset));

  let ocrResults: any[][] = [];
  if (useOcr) {
    onProgress(30, 'Gemini executing fast-path OCR...');
    ocrResults = await performOcr(processedPages.map(p => ({ data: p.data, mimeType: p.mimeType })));
  }

  onProgress(60, 'Synthesizing PDF stream...');
  const first = processedPages[0];
  const doc = new jsPDF({
    orientation: first.width > first.height ? 'l' : 'p',
    unit: 'pt',
    format: [first.width, first.height]
  });

  for (let i = 0; i < processedPages.length; i++) {
    const page = processedPages[i];
    const orientation = page.width > page.height ? 'l' : 'p';
    
    if (i > 0) doc.addPage([page.width, page.height], orientation);
    
    doc.addImage(page.data, 'JPEG', 0, 0, page.width, page.height, undefined, 'FAST');

    if (useOcr && ocrResults[i]) {
      doc.setTextColor(0, 0, 0, 0); // Transparent text layer
      ocrResults[i].forEach(block => {
        const [ymin, xmin, ymax, xmax] = block.box_2d;
        const x = (xmin / 1000) * page.width;
        const y = (ymin / 1000) * page.height;
        const h = ((ymax - ymin) / 1000) * page.height;
        doc.setFontSize(h * 0.8);
        doc.text(block.text, x, y + h * 0.8);
      });
    }
    onProgress(60 + (i / processedPages.length * 35), `Finalizing page ${i+1}...`);
  }

  const blob = doc.output('blob');
  return { url: URL.createObjectURL(blob), fileName: `FileMorph_Bundle_${Date.now()}.pdf`, size: blob.size };
};

const convertExcelToPdf = async (file: File, onProgress: (p: number, s: string) => void): Promise<ConversionResult> => {
  onProgress(20, 'Parsing spreadsheet...');
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer);
  const doc = new jsPDF('l', 'mm', 'a4');
  let firstPage = true;

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    if (data.length === 0) continue;
    
    if (!firstPage) doc.addPage();
    firstPage = false;
    
    doc.setFontSize(16);
    doc.text(sheetName, 14, 15);
    
    (doc as any).autoTable({
      head: [data[0]],
      body: data.slice(1),
      startY: 22,
      margin: { top: 25 },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [79, 70, 229], textColor: 255 }
    });
    
    onProgress(30 + (workbook.SheetNames.indexOf(sheetName) / workbook.SheetNames.length * 60), `Formatting: ${sheetName}`);
  }

  const blob = doc.output('blob');
  return { url: URL.createObjectURL(blob), fileName: `${file.name.split('.')[0]}.pdf`, size: blob.size };
};

const convertPdfToExcel = async (file: File, onProgress: (p: number, s: string) => void): Promise<ConversionResult> => {
  onProgress(10, 'Initializing high-fidelity scanner...');
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const maxPages = Math.min(pdf.numPages, 20);
  
  // Parallelize page rendering
  const renderPage = async (num: number) => {
    const page = await pdf.getPage(num);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error("Canvas context missing");
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    await page.render({ canvasContext: context, viewport }).promise;
    const imgData = canvas.toDataURL('image/jpeg', 0.8);
    // Cleanup canvas memory
    canvas.width = 0; canvas.height = 0;
    return { data: imgData, mimeType: 'image/jpeg' };
  };

  const pagePromises = [];
  for (let i = 1; i <= maxPages; i++) {
    pagePromises.push(renderPage(i));
  }

  onProgress(20, `Rendering ${maxPages} pages in parallel...`);
  const pageImages = await Promise.all(pagePromises);

  onProgress(50, 'Gemini performing complex data extraction...');
  // Use Pro for better table logic when converting PDF to Excel specifically
  const tableData = await extractAndAnalyzeDocument(pageImages, true);
  
  return generateExcelFile(tableData, `${file.name.split('.')[0]}_data.xlsx`, onProgress);
};

const compressPdf = async (files: File[], onProgress: (p: number, s: string) => void): Promise<ConversionResult> => {
  const compressSingle = async (file: File, pStart: number, pEnd: number) => {
    const data = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    
    // Parallelize page compression
    const renderComp = async (num: number) => {
      const page = await pdf.getPage(num);
      const viewport = page.getViewport({ scale: 1.2 }); // Optimized scale for compression
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: ctx, viewport }).promise;
      const img = canvas.toDataURL('image/jpeg', 0.4); // Aggressive quality reduction
      const orient = viewport.width > viewport.height ? 'l' : 'p';
      const size = [viewport.width, viewport.height];
      canvas.width = 0; canvas.height = 0;
      return { img, orient, size };
    };

    const compPromises = [];
    for(let i=1; i<=pdf.numPages; i++) compPromises.push(renderComp(i));
    
    const pages = await Promise.all(compPromises);
    const first = pages[0];
    if (!first) throw new Error("Compression failed");

    const doc = new jsPDF({ 
      orientation: first.orient as any, 
      unit: 'pt', 
      format: first.size, 
      compress: true 
    });

    pages.forEach((p, idx) => {
      if (!p) return;
      if (idx > 0) doc.addPage(p.size, p.orient as any);
      doc.addImage(p.img, 'JPEG', 0, 0, p.size[0], p.size[1], undefined, 'FAST');
    });

    return doc.output('blob');
  };

  if (files.length === 1) {
    const blob = await compressSingle(files[0], 10, 95);
    return { url: URL.createObjectURL(blob), fileName: `${files[0].name.split('.')[0]}_optimized.pdf`, size: blob.size };
  }

  const zip = new JSZip();
  onProgress(10, "Batch processing optimized streams...");
  for (let i = 0; i < files.length; i++) {
    const blob = await compressSingle(files[i], 10, 90);
    zip.file(`${files[i].name.split('.')[0]}_lite.pdf`, blob);
    onProgress(10 + (i / files.length * 80), `Compressed: ${files[i].name}`);
  }
  
  const zipBlob = await zip.generateAsync({ type: "blob" });
  return { url: URL.createObjectURL(zipBlob), fileName: `FileMorph_Batch_${Date.now()}.zip`, size: zipBlob.size };
};

const generateExcelFile = (tableData: TableData[], baseName: string, onProgress: (p: number, s: string) => void): ConversionResult => {
  onProgress(90, 'Encoding spreadsheet binary...');
  const wb = XLSX.utils.book_new();
  tableData.forEach((table) => {
    const ws = XLSX.utils.aoa_to_sheet([table.headers, ...table.rows]);
    XLSX.utils.book_append_sheet(wb, ws, table.sheetName);
  });
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  return { url: URL.createObjectURL(blob), fileName: baseName, size: blob.size };
};

const readFileAsBase64 = (file: File): Promise<string> => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(r.result as string);
  r.onerror = rej;
  r.readAsDataURL(file);
});
