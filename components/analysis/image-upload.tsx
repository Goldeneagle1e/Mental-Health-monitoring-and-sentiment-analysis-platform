"use client"

//import type React from "react"
import React, { Dispatch, SetStateAction, useCallback } from 'react';
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { X, Upload } from "lucide-react"

interface ImageUploadProps {
  onImagesSelected: (files: File[]) => void // <-- This is the function name you are using
  disabled?: boolean
}

export default function ImageUpload({ onImagesSelected, disabled }: ImageUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    setError("")
    const newFiles: File[] = []
    const newPreviews: string[] = []

    Array.from(files).forEach((file) => {
      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`Invalid file type: ${file.name}. Allowed: JPEG, PNG, GIF, WebP`)
        return
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setError(`File too large: ${file.name}. Max size: 10MB`)
        return
      }

      newFiles.push(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          newPreviews.push(e.target.result as string)
          if (newPreviews.length === newFiles.length) {
            setPreviews((prev) => [...prev, ...newPreviews])
          }
        }
      }
      reader.readAsDataURL(file)
    })

    if (newFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...newFiles])
      onImagesSelected([...selectedFiles, ...newFiles])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleFileSelect(e.dataTransfer.files)
  }

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    const newPreviews = previews.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)
    setPreviews(newPreviews)
    onImagesSelected(newFiles)
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ALLOWED_TYPES.join(",")}
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={disabled}
          className="hidden"
        />

        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm font-medium mb-1">Drag and drop images here</p>
        <p className="text-xs text-muted-foreground">or click to select files</p>
        <p className="text-xs text-muted-foreground mt-2">Supported: JPEG, PNG, GIF, WebP (Max 10MB each)</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {previews.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-3">Selected Images ({previews.length})</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {previews.map((preview, idx) => (
              <Card key={idx} className="relative overflow-hidden">
                <CardContent className="p-0">
                  <img
                    src={preview || "/placeholder.svg"}
                    alt={`Preview ${idx}`}
                    className="w-full h-32 object-cover"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(idx)}
                    className="absolute top-1 right-1 bg-destructive/80 hover:bg-destructive text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
