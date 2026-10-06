// components/analysis/text-analysis-mode.tsx (Corrected)

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Zap } from "lucide-react";
import { analyzeText, AnalysisResult } from "@/lib/api-client";
// --- NEW IMPORT ---
import AnalysisResults from "./analysis-results"; 

// Define a structure that mimics the FullAnalysisRecord expected by AnalysisResults
interface TextAnalysisRecord {
    id: string; 
    content: string; 
    type: string; 
    timestamp: string; 
    results: AnalysisResult; 
}

export default function TextAnalysisMode() {
  const [textInput, setTextInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  // Update state to hold the full record
  const [analysisRecord, setAnalysisRecord] = useState<TextAnalysisRecord | null>(null);

  // Function to get the Tailwind class string for the outer risk indicator
  const getRiskColorClass = (risk: 'low' | 'moderate' | 'high'): string => {
    switch (risk) {
      case "high": return "border-destructive"; // Tailwind class (adjust based on your theme)
      case "moderate": return "border-yellow-500";
      case "low":
      default: return "border-green-500";
    }
  }

  const handleAnalyze = async () => {
    // ... (error checking and loading logic remains the same)
    if (textInput.trim().length === 0) {
      setError("Please enter text content to analyze.");
      return;
    }
    setError("");
    setIsLoading(true);
    setAnalysisRecord(null);

    try {
      const result = await analyzeText(textInput, "Manual Text Entry");
      
      // Construct the FullAnalysisRecord object required by AnalysisResults
      const record: TextAnalysisRecord = {
        id: Date.now().toString(), // Simple unique ID
        content: textInput,
        type: "Text",
        timestamp: new Date().toISOString(),
        results: result,
      };
      
      setAnalysisRecord(record);
    } catch (err: any) {
      console.error("Text Analysis Error:", err);
      setError(err.message || "Text analysis failed. Ensure ML server is running.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle reset for new analysis
  const handleNewAnalysis = () => {
    setTextInput("");
    setAnalysisRecord(null);
    setError("");
  };


  return (
    <div className="space-y-6">
      <Card className="p-4 space-y-4">
        <Textarea
          placeholder="Enter text content to analyze..."
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          rows={5}
          disabled={isLoading}
        />
        
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Button
          onClick={handleAnalyze}
          disabled={isLoading || textInput.trim().length === 0}
          className="w-full"
        >
          {isLoading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing Text...</>
          ) : (
            <><Zap className="mr-2 h-4 w-4" /> Analyze Content</>
          )}
        </Button>
      </Card>
      
      {analysisRecord && (
        <AnalysisResults 
          result={analysisRecord} 
          title="Text Content Analysis Report" 
          description={`Input: "${analysisRecord.content.substring(0, 80)}..."`}
          riskColorClass={getRiskColorClass(analysisRecord.results.overall_risk)}
          onNewAnalysis={handleNewAnalysis}
        />
      )}
    </div>
  );
}