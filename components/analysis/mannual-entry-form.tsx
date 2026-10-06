// components/analysis/manual-entry-form.tsx

"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import TextAnalysisMode from "./text-analysis-mode";
// --- CRITICAL FIX: Ensure this is a default import ---
import ImageAnalysisMode from "./image-analysis-mode"; 

export default function ManualEntryForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual Content Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text">Text Analysis</TabsTrigger>
            <TabsTrigger value="image">Image/GIF Analysis</TabsTrigger>
          </TabsList>

          <div className="pt-6">
            <TabsContent value="text">
              <TextAnalysisMode />
            </TabsContent>

            <TabsContent value="image">
              <ImageAnalysisMode /> {/* This will now work */}
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}