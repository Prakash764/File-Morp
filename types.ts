
import React from 'react';

export enum ToolType {
  PDF_TO_EXCEL = 'pdf-to-excel',
  EXCEL_TO_PDF = 'excel-to-pdf',
  IMAGE_TO_PDF = 'image-to-pdf',
  COMPRESS_PDF = 'compress-pdf',
  IMAGE_TO_EXCEL = 'image-to-excel'
}

export interface ToolConfig {
  id: ToolType;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export interface ConversionState {
  isProcessing: boolean;
  progress: number;
  status: string;
  error: string | null;
  resultUrl: string | null;
  resultFileName: string | null;
  resultSize?: number;
}
