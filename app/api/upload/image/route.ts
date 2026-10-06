// app/api/upload/image/route.ts

import { NextRequest, NextResponse } from 'next/server';

// Placeholder/Mock URL for uploaded files
const MOCK_IMAGE_URL = 'https://picsum.photos/800/600';

export async function POST(request: NextRequest) {
  try {
    // In a real application, you would handle the file upload stream here,
    // save the file to S3/Cloudinary/etc., and generate a real public URL.
    
    // For this prototype, we just count the files and return mock URLs.
    const formData = await request.formData();
    const files = formData.getAll('files'); // 'files' is the key used in the client
    
    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided for upload" }, { status: 400 });
    }
    
    // Return a mock URL for each file (using the same placeholder URL for simplicity)
    const mockUrls = files.map((file, index) => {
      // Simulate checking the file type to determine if it's a GIF
      const isGif = (file as File).type === 'image/gif';
      
      // Use a different mock URL if it's supposed to be a GIF
      const url = isGif 
        ? 'https://media.giphy.com/media/l41JRsHHjCg9W7k0E/giphy.gif' 
        : MOCK_IMAGE_URL;

      return {
        fileName: (file as File).name,
        url: url,
        type: isGif ? 'gif' : 'image',
      };
    });

    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json({ 
      uploadedFiles: mockUrls 
    });

  } catch (error) {
    console.error('File Upload API Error:', error);
    return NextResponse.json({ error: 'Failed to process file upload.' }, { status: 500 });
  }
}