// app/api/social-media/fetch/route.ts

import { NextRequest, NextResponse } from "next/server";

// Placeholder for social media content structure
interface SocialMediaContent {
  platform: string;
  username: string;
  liveFetchEnabled?: boolean;
  providerNote?: string;
  posts: Array<{
    id: string;
    content: string; // The text to be sent for analysis
    timestamp: string;
    mediaUrls?: string[];
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const { url, platform, username } = await request.json();

    if (!platform || !username) {
      return NextResponse.json({ error: "Platform and a connected username are required" }, { status: 400 });
    }

    // --- MOCK DATA FOR DEMONSTRATION ---
    // This simulates fetching the user's last 3 posts from a social media API.
    const derivedUsername = username || url?.split("/").pop() || "testuser";

    const mockContent: SocialMediaContent = {
      platform,
      username: derivedUsername,
      posts: [
        {
          id: "p1",
          content: `I've been feeling quite stressed lately because of the pressure to finish my project on time. I really need a break. (${platform} import for @${derivedUsername})`,
          timestamp: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: "p2",
          content: `Enjoying a lovely sunny day with my dog! Simple pleasures make life better. (${platform} import for @${derivedUsername})`,
          timestamp: new Date(Date.now() - 172800000).toISOString(),
        },
        {
          id: "p3",
          content: `My sleep schedule is completely ruined. I feel hopeless and overwhelmed by everything that is happening. (${platform} import for @${derivedUsername})`,
          timestamp: new Date(Date.now() - 259200000).toISOString(),
        },
      ],
      liveFetchEnabled: false,
      providerNote:
        "Provider OAuth/API credentials are not configured yet, so this route is returning demo posts tied to the connected username.",
    };

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    return NextResponse.json(mockContent);

  } catch (error) {
    console.error("Social Media Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch content from the platform." }, { status: 500 });
  }
}
