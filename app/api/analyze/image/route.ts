// app/api/analyze/image/route.ts

import { NextRequest, NextResponse } from "next/server";

const ML_SERVER_BASE_URL = 'http://localhost:8000/api/ml/analyze/image';

export async function POST(request: NextRequest) {
  try {
    // 1. Get the request body from the Next.js client
    const body = await request.json();
    
    // Simple validation
    if (!body.imageUrl || body.imageUrl.trim().length === 0) {
      return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
    }

    // 2. Forward the request to the FastAPI ML server
    const mlResponse = await fetch(ML_SERVER_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    // 3. Handle non-200 responses from the ML server
    if (!mlResponse.ok) {
      const errorText = await mlResponse.text();
      return new NextResponse(JSON.stringify({ 
        error: `ML Server returned ${mlResponse.status}. Details: ${errorText}` 
      }), {
        status: mlResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. Return the ML server's successful JSON response
    const data = await mlResponse.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('API Route Error: Failed to communicate with ML server.', error);
    return new NextResponse(JSON.stringify({ 
        error: 'Image analysis failed. Ensure the ML server is running at http://localhost:8000' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}