"use server";

import * as mammoth from "mammoth";

import { assertActionRole } from "@/lib/auth/workspace-access";


export async function parseDocumentAction(formData: FormData): Promise<{ text?: string; error?: string }> {
  await assertActionRole("company");

  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { error: "No file provided" };
    }

    // Polyfill DOMMatrix for pdf-parse in Node.js / Next.js server environments
    if (typeof globalThis.DOMMatrix === "undefined") {
      Object.defineProperty(globalThis, "DOMMatrix", {
        configurable: true,
        value: class DOMMatrixPolyfill {},
        writable: true,
      });
    }

    const { default: pdfParse } = await import("pdf-parse/lib/pdf-parse.js");


    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = file.name.toLowerCase();

    let extractedText = "";

    if (fileName.endsWith(".pdf")) {
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text;
    } else if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (fileName.endsWith(".txt") || fileName.endsWith(".md") || fileName.endsWith(".csv") || fileName.endsWith(".json")) {
      extractedText = buffer.toString("utf-8");
    } else {
      return { error: "Unsupported file format. Please upload PDF, DOCX, TXT, or MD." };
    }

    return { text: extractedText.trim() };
  } catch (error: unknown) {
    console.error("Document parsing error:", error);
    return {
      error:
        error instanceof Error ? error.message : "Failed to parse the document",
    };
  }
}
