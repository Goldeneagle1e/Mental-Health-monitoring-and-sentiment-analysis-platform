import { type NextRequest, NextResponse } from "next/server";

// Define the URL for your FastAPI ML server
const ML_SERVER_BASE_URL = 'http://localhost:8000/api/ml/analyze/text'

// Interface for the data we send to the ML server
interface MLRequestPayload {
  content: string;
  source?: string;
}

// Interface for the data we expect back from the ML server
interface MLResponsePayload {
    anxiety: number;
    depression: number;
    stress: number;
    overall_risk: "low" | "moderate" | "high";
    indicators: string[];
    recommendations: string[];
}

export async function POST(request: NextRequest) {
  try {
    // 1. Get the JSON body from the Next.js client request
    const body: MLRequestPayload = await request.json();

    if (!body.content || body.content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }
    
    // 2. Forward the request to the FastAPI ML server
    console.log(`Proxying request to ML server: ${ML_SERVER_BASE_URL}`);

    const mlResponse = await fetch(ML_SERVER_BASE_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(body),
    });

    // 3. Handle non-200 responses from the ML server
    if (!mlResponse.ok) {
      const errorText = await mlResponse.text();
      console.error(`ML Server returned an error (${mlResponse.status}):`, errorText);
      return new NextResponse(JSON.stringify({ 
        error: `ML Server returned ${mlResponse.status}. Details: ${errorText}` 
      }), {
        status: mlResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. Return the ML server's successful JSON response back to the Next.js client
    const data: MLResponsePayload = await mlResponse.json();
    return NextResponse.json(data);

  } catch (error: any) {
    // This catches network errors (Connection Refused) and JSON parsing errors
    if (error.code === 'ECONNREFUSED') {
      console.error('Connection refused. Ensure the ML server is running at:', ML_SERVER_BASE_URL);
    } else {
      console.error('Unexpected error occurred:', error);
    }

    return new NextResponse(JSON.stringify({ 
        error: 'Analysis failed. Check your ML server console for errors, or ensure it is running at http://localhost:8000.' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}