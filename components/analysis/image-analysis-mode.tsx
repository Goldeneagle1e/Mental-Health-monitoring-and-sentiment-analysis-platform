// components/analysis/image-analysis-mode.tsx

"use client"

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Zap } from "lucide-react";
import ImageUpload from "./image-upload"; 
import AnalysisResults from "./analysis-results"; // Assuming this component exists
import { isGifFile, uploadImages, analyzeImage, analyzeGif } from '@/lib/image-utils'; 
import { AnalysisResult } from '@/lib/api-client'; // The simple ML score interface

// --- FIX 2a: Define the Full Record Structure expected by AnalysisResults ---
// This matches the complex type structure from the previous error message
interface FullAnalysisRecord {
    id: string; 
    content: string; 
    type: string; 
    timestamp: string; 
    // This assumes the API client's AnalysisResult interface (anxiety, depression, etc.)
    results: AnalysisResult; 
}

// Ensure the AnalysisResult structure is defined in api-client.ts or here if necessary
// interface AnalysisResult { anxiety: number, depression: number, stress: number, overall_risk: 'low' | 'moderate' | 'high', indicators: string[], recommendations: string[] }

export default function ImageAnalysisMode() {
  // Renamed to selectedFiles for clarity, but you can use the same name as the setter
  const [selectedMedia, setSelectedMedia] = useState<File[]>([]); 
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisRecord, setAnalysisRecord] = useState<FullAnalysisRecord | null>(null); 

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high": return "border-red-500 bg-red-50 text-red-700";
      case "moderate": return "border-yellow-500 bg-yellow-50 text-yellow-700";
      case "low":
      default: return "border-green-500 bg-green-50 text-green-700";
    }
  }

  const handleAnalyze = async () => {
    if (selectedMedia.length === 0) {
      setError('Please select at least one image or GIF to analyze.');
      return;
    }

    setError('');
    setIsLoading(true);
    setAnalysisRecord(null);

    try {
      // We only analyze the first file for simplicity in this mode
      const filesToUpload = selectedMedia.slice(0, 1);
      const uploadedFiles = await uploadImages(filesToUpload);
      
      if (uploadedFiles.length === 0) {
        throw new Error('No valid files were uploaded.');
      }
      
      const fileToAnalyze = uploadedFiles[0];
      // Since ImageUpload component allows multiple, we still only analyze the first.
      const isGif = fileToAnalyze.type === 'gif' || isGifFile(selectedMedia[0]);
      
      let mlResult: AnalysisResult;
      
      if (isGif) {
        mlResult = await analyzeGif(fileToAnalyze.url, 10); 
      } else {
        mlResult = await analyzeImage(fileToAnalyze.url, fileToAnalyze.fileName);
      }
      
      // Map the MLResult into the FullAnalysisRecord structure
      const record: FullAnalysisRecord = {
          id: `media-${Date.now()}`,
          content: fileToAnalyze.fileName,
          type: isGif ? 'gif' : 'image',
          timestamp: new Date().toISOString(),
          results: mlResult, 
      };

      setAnalysisRecord(record);

    } catch (err: any) {
      console.error('Image Analysis Error:', err);
      setError(err.message || 'Image analysis failed. Check server status and file structure.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewAnalysis = () => {
    setSelectedMedia([]);
    setAnalysisRecord(null);
    setError('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Image/GIF Analysis</CardTitle>
          <CardDescription>Upload an image or GIF for visual and motion-based risk assessment.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* FIX 1: Changed prop name to match ImageUpload.tsx */}
          {/* FIX 2: Removed 'allowMultiple={false}' since it's not a defined prop */}
          <ImageUpload 
            onImagesSelected={setSelectedMedia} 
            disabled={isLoading || selectedMedia.length > 0} // Disable once one file is selected, as we only analyze the first one anyway
          />

          <Button
            onClick={handleAnalyze}
            disabled={isLoading || selectedMedia.length === 0}
            className="w-full"
          >
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</>
            ) : (
              <><Zap className="mr-2 h-4 w-4" /> Analyze Media</>
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results Display */}
      {analysisRecord && (
        <AnalysisResults 
          result={analysisRecord} 
          title="Multimodal Media Analysis Report"
          description="Visual indicators and motion patterns were analyzed for risk assessment."
          riskColorClass={getRiskColor(analysisRecord.results.overall_risk)}
          onNewAnalysis={handleNewAnalysis} // Added onNewAnalysis prop
        />
      )}
    </div>
  );
}