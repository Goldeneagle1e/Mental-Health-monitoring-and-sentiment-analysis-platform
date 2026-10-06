// lib/image-utils.ts

import { AnalysisResult } from "./api-client";

// This interface matches the response structure from /api/upload/image/route.ts
interface UploadResponse {
  fileName: string;
  url: string;
  type: 'image' | 'gif';
}

/**
 * Checks if a File object is a GIF based on its MIME type.
 * This is the function that was missing the export.
 */
export function isGifFile(file: File): boolean {
  return file.type === 'image/gif';
}

/**
 * Handles the multi-part file upload to the Next.js API proxy.
 * @param files The array of File objects selected by the user.
 * @returns A promise that resolves to an array of UploadResponse objects.
 */
export async function uploadImages(files: File[]): Promise<UploadResponse[]> {
  const uploadFormData = new FormData();
  files.forEach(file => {
    uploadFormData.append('files', file); 
  });

  const response = await fetch('/api/upload/image', {
    method: 'POST',
    body: uploadFormData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Image upload failed. Check the /api/upload/image route.');
  }

  // NOTE: Correctly reading 'uploadedFiles' key, fixing previous map error
  const data: { uploadedFiles: UploadResponse[] } = await response.json();
  
  if (!data.uploadedFiles) {
    throw new Error("Server response did not contain 'uploadedFiles'.");
  }

  return data.uploadedFiles;
}

/**
 * Handles the analysis of a single image using its public URL.
 */
export async function analyzeImage(imageUrl: string, fileName: string): Promise<AnalysisResult> {
  const response = await fetch('/api/analyze/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl, source: fileName }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Image analysis failed.');
  }

  return response.json();
}

/**
 * Handles the analysis of a GIF by frame-by-frame processing.
 */
export async function analyzeGif(gifUrl: string, frameCount: number): Promise<AnalysisResult> {
    const response = await fetch('/api/analyze/gif', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gifUrl, frameCount }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'GIF analysis failed.');
    }

    return response.json();
}