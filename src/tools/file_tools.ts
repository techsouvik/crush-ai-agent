import { StructuredTool } from "@langchain/core/tools";
import * as fs from "fs/promises";
import * as path from "path";
import pdfParse from "pdf-parse";
import Tesseract from "tesseract.js";
import { z } from "zod";

export class ExtractTextFromPDFTool extends StructuredTool {
  name = "extract_text_from_pdf";
  description = "Extracts text content from a PDF file given its path";

  schema = z.object({
    filePath: z.string().describe("Absolute or relative path to the PDF file"),
  });

  async _call(inputs: { filePath: string }): Promise<string> {
    const resolvedPath = path.resolve(inputs.filePath);
    const data = await fs.readFile(resolvedPath);
    const pdfData = await pdfParse(data);
    return pdfData.text;
  }
}

export class ExtractTextFromImageTool extends StructuredTool {
  name = "extract_text_from_image";
  description = "Extracts text content from an image file using OCR given its path";

  schema = z.object({
    filePath: z.string().describe("Absolute or relative path to the image file"),
  });

  async _call(inputs: { filePath: string }): Promise<string> {
    const resolvedPath = path.resolve(inputs.filePath);
    const { data } = await Tesseract.recognize(resolvedPath, "eng");
    return data.text;
  }
}
