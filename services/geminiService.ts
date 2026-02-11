
import { GoogleGenAI, Type } from "@google/genai";

export interface TableData {
  rows: any[][];
  headers: string[];
  sheetName: string;
}

export interface OcrBlock {
  text: string;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] in 0-1000 scale
}

const tableResponseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      sheetName: { 
        type: Type.STRING,
        description: "A descriptive name for the spreadsheet tab"
      },
      headers: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "The column headers"
      },
      rows: {
        type: Type.ARRAY,
        items: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Cell values"
        },
        description: "Data rows"
      }
    },
    required: ["sheetName", "headers", "rows"]
  }
};

const ocrResponseSchema = {
  type: Type.OBJECT,
  properties: {
    blocks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          box_2d: {
            type: Type.ARRAY,
            items: { type: Type.NUMBER },
            description: "Bounding box [ymin, xmin, ymax, xmax]"
          }
        },
        required: ["text", "box_2d"]
      }
    }
  },
  required: ["blocks"]
};

const parseGeminiJson = (text: string): any => {
  if (!text) return null;
  try {
    // Attempt direct parse
    return JSON.parse(text);
  } catch (e) {
    // Strip markdown blocks if present
    const cleaned = text.replace(/```json\n?|```/g, '').trim();
    try {
      return JSON.parse(cleaned);
    } catch (e2) {
      console.error("Critical JSON Parse Error:", text);
      // Fallback for partial or malformed JSON
      const jsonMatch = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e3) {
          throw new Error("The AI response was malformed. Please try again.");
        }
      }
      throw new Error("Invalid AI data format.");
    }
  }
};

export const performOcr = async (pages: { data: string, mimeType: string }[]): Promise<OcrBlock[][]> => {
  if (!process.env.API_KEY) throw new Error("API_KEY missing.");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Use Flash for maximum speed in OCR tasks
  const results: OcrBlock[][] = [];

  // Process pages in small batches to avoid hitting payload limits while maintaining speed
  for (const page of pages) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: page.data.includes(',') ? page.data.split(',')[1] : page.data,
              mimeType: page.mimeType
            }
          },
          { text: "Extract all visible text from this image with bounding boxes." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: ocrResponseSchema
      }
    });
    
    const parsed = parseGeminiJson(response.text || "{}");
    results.push(parsed.blocks || []);
  }

  return results;
};

export const extractAndAnalyzeDocument = async (pages: { data: string, mimeType: string }[], usePro = false): Promise<TableData[]> => {
  if (!process.env.API_KEY) throw new Error("AI extraction requires a valid API_KEY.");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const imageParts = pages.map(page => ({
    inlineData: {
      data: page.data.includes(',') ? page.data.split(',')[1] : page.data,
      mimeType: page.mimeType
    }
  }));

  try {
    const response = await ai.models.generateContent({
      // Flash for speed, Pro for complex table logic if requested
      model: usePro ? "gemini-3-pro-preview" : "gemini-3-flash-preview",
      contents: {
        parts: [
          ...imageParts,
          {
            text: `Extract structured tables from these images.
            1. Summarize content in 'Document Summary'.
            2. Map all tables precisely.
            3. Ensure numerical precision.`
          }
        ]
      },
      config: {
        systemInstruction: "You are a professional data extraction engine. Output clean, structured JSON only.",
        responseMimeType: "application/json",
        responseSchema: tableResponseSchema
      }
    });

    return parseGeminiJson(response.text || "[]") as TableData[];
  } catch (e: any) {
    console.error("Gemini API Error:", e);
    throw new Error(`Analysis failed: ${e.message || "Network error"}`);
  }
};
