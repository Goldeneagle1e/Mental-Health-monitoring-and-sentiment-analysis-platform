# Mental Health Analysis System

An AI-powered early detection system for mental health concerns using multimodal analysis (text, images, and GIFs) from social media platforms.

## Features

- **Dual Analysis Modes**
  - Manual Entry: Analyze text, images, or GIFs directly
  - Real-Time Analysis: Fetch and analyze content from social media (Twitter/X, Reddit, Instagram)

- **Multimodal Analysis**
  - Text analysis using LSTM + BERT models
  - Image analysis for visual indicators
  - GIF frame analysis for motion patterns
  - Combined analysis for comprehensive assessment

- **Mental Health Indicators**
  - Anxiety detection
  - Depression detection
  - Stress level assessment
  - Overall risk classification (Low, Moderate, High)

- **User Features**
  - Secure authentication
  - Analysis history and reports
  - Detailed results with recommendations
  - Data persistence with localStorage

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **ML Models**: LSTM + BERT (ready for integration)
- **Storage**: localStorage (MVP), ready for database integration
- **UI Components**: shadcn/ui

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
\`\`\`bash
git clone <repository-url>
cd mental-health-analysis
\`\`\`

2. Install dependencies
\`\`\`bash
npm install
\`\`\`

3. Run the development server
\`\`\`bash
npm run dev
\`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Manual Text Analysis

1. Login with any email/password
2. Click "New Analysis"
3. Select "Manual Entry" tab
4. Enter text content and optional source
5. Click "Analyze Content"
6. View detailed results with risk assessment

### Image/GIF Analysis

1. Select "Images/GIFs" tab
2. Drag and drop or click to upload images
3. Supported formats: JPEG, PNG, GIF, WebP
4. Click "Analyze Content"
5. View visual indicator analysis

### Combined Analysis

1. Select "Combined" tab
2. Add text context (optional)
3. Upload images/GIFs
4. Click "Analyze Content"
5. Get comprehensive multimodal analysis

### View History

1. Click "Analysis History" on dashboard
2. Browse all previous analyses
3. Click any analysis to view details
4. Delete analyses as needed

## API Endpoints

### Text Analysis
\`\`\`
POST /api/analyze/text
Content-Type: application/json

{
  "content": "text to analyze",
  "source": "optional source"
}
\`\`\`

### Image Analysis
\`\`\`
POST /api/analyze/image
Content-Type: application/json

{
  "imageUrl": "image url",
  "description": "optional description"
}
\`\`\`

### GIF Analysis
\`\`\`
POST /api/analyze/gif
Content-Type: application/json

{
  "gifUrl": "gif url",
  "frameCount": 5
}
\`\`\`

### Combined Analysis
\`\`\`
POST /api/analyze/combined
Content-Type: application/json

{
  "text": "optional text",
  "imageUrls": ["url1", "url2"],
  "gifUrls": ["gif_url"],
  "source": "optional source"
}
\`\`\`

### Image Upload
\`\`\`
POST /api/upload/image
Content-Type: multipart/form-data

files: [File, File, ...]
\`\`\`

## ML Model Integration

The system is designed to integrate with LSTM + BERT models. Replace the mock analysis functions in the following files:

1. **Text Analysis**: `/app/api/analyze/text/route.ts`
   - Replace `analyzeTextWithML()` function
   - Integrate BERT model for semantic analysis
   - Add LSTM for sequence pattern detection

2. **Image Analysis**: `/app/api/analyze/image/route.ts`
   - Replace `analyzeImageWithML()` function
   - Integrate Vision Transformer for image understanding
   - Add object detection for visual indicators

3. **GIF Analysis**: `/app/api/analyze/gif/route.ts`
   - Replace `analyzeGifFrames()` function
   - Implement frame extraction
   - Add motion pattern analysis

4. **Combined Analysis**: `/app/api/analyze/combined/route.ts`
   - Implement multimodal fusion
   - Add cross-modal attention mechanisms

## Social Media Integration

To enable real-time analysis, configure API keys for:

1. **Twitter/X API v2**
   - Add `TWITTER_API_KEY` to environment variables
   - Implement in `/app/api/social-media/fetch/route.ts`

2. **Reddit API**
   - Add `REDDIT_CLIENT_ID` and `REDDIT_CLIENT_SECRET`
   - Implement in `/app/api/social-media/fetch/route.ts`

3. **Instagram Graph API**
   - Add `INSTAGRAM_ACCESS_TOKEN`
   - Implement in `/app/api/social-media/fetch/route.ts`

## Database Integration

Currently uses localStorage for MVP. To integrate a database:

1. Choose a database (Supabase, Neon, MongoDB, etc.)
2. Create tables for:
   - Users
   - Analyses
   - Reports
   - Media files
3. Update API routes to use database queries
4. Implement proper authentication with database

## Environment Variables

Create a `.env.local` file:

\`\`\`
# Social Media APIs (optional)
TWITTER_API_KEY=your_key
REDDIT_CLIENT_ID=your_id
REDDIT_CLIENT_SECRET=your_secret
INSTAGRAM_ACCESS_TOKEN=your_token

# Database (optional)
DATABASE_URL=your_database_url

# ML Model Endpoints (optional)
ML_MODEL_ENDPOINT=your_model_endpoint
\`\`\`

## Testing

### Manual Testing Checklist

- [ ] Login/Signup flow works
- [ ] Text analysis produces results
- [ ] Image upload and preview works
- [ ] GIF analysis completes
- [ ] Combined analysis works
- [ ] Analysis history displays correctly
- [ ] Delete analysis removes from history
- [ ] Results display all metrics correctly
- [ ] Risk levels are calculated properly
- [ ] Recommendations are relevant

### Test Cases

1. **Empty Input**: Should show error message
2. **Large File**: Should reject files > 10MB
3. **Invalid Format**: Should reject non-image files
4. **Multiple Images**: Should handle batch uploads
5. **High Risk Content**: Should show appropriate warnings

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

\`\`\`bash
vercel deploy
\`\`\`

### Docker Deployment

\`\`\`dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

## Project Structure

\`\`\`
├── app/
│   ├── api/
│   │   ├── analyze/
│   │   │   ├── text/route.ts
│   │   │   ├── image/route.ts
│   │   │   ├── gif/route.ts
│   │   │   └── combined/route.ts
│   │   ├── upload/
│   │   │   └── image/route.ts
│   │   └── social-media/
│   │       └── fetch/route.ts
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── auth/
│   │   └── login-page.tsx
│   ├── dashboard/
│   │   └── dashboard.tsx
│   ├── analysis/
│   │   ├── analysis-mode.tsx
│   │   ├── manual-entry-form.tsx
│   │   ├── real-time-analysis.tsx
│   │   ├── analysis-results.tsx
│   │   ├── analysis-history.tsx
│   │   └── image-upload.tsx
│   └── ui/
│       └── [shadcn components]
├── lib/
│   ├── api-client.ts
│   ├── image-utils.ts
│   ├── ml-service.ts
│   └── utils.ts
└── README.md
\`\`\`

## Future Enhancements

- [ ] Real-time social media integration
- [ ] Advanced ML model integration
- [ ] Database persistence
- [ ] User authentication with OAuth
- [ ] Report generation and export
- [ ] Batch analysis
- [ ] API rate limiting
- [ ] Admin dashboard
- [ ] Crisis resource integration
- [ ] Multi-language support

## Important Notes

This system is designed as an early detection tool and should not replace professional mental health evaluation. Always encourage users to seek professional help when needed.

## Support

For issues or questions, please open an issue on GitHub or contact support.

## License

MIT License - see LICENSE file for details
