// app/api/analyze/combined/route.ts

import { NextRequest, NextResponse } from "next/server";

const ML_SERVER_BASE_URL = 'http://localhost:8000/api/ml/analyze/combined';

export async function POST(request: NextRequest) {
  try {
    // Get the request body (which should contain text_data and media_data)
    const body = await request.json();
    
    // 1. Forward the combined request to the FastAPI ML server
    const mlResponse = await fetch(ML_SERVER_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body), // Forward the entire combined body
    });

    // 2. Handle non-200 responses from the ML server
    if (!mlResponse.ok) {
      const errorText = await mlResponse.text();
      return new NextResponse(JSON.stringify({ 
        error: `ML Server returned ${mlResponse.status}. Details: ${errorText}` 
      }), {
        status: mlResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Return the ML server's successful JSON response
    const data = await mlResponse.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('API Route Error: Failed to communicate with ML server for combined analysis.', error);
    return new NextResponse(JSON.stringify({ 
        error: 'Combined analysis failed. Ensure the ML server is running at http://localhost:8000' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}