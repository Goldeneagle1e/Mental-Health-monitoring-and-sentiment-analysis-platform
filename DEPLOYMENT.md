# Deployment Guide

## Pre-Deployment Checklist

- [ ] All tests passing
- [ ] No console errors
- [ ] Environment variables configured
- [ ] README updated
- [ ] Code reviewed
- [ ] Performance optimized

## Vercel Deployment

### Step 1: Prepare Repository

\`\`\`bash
git add .
git commit -m "Ready for deployment"
git push origin main
\`\`\`

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Select project settings

### Step 3: Configure Environment Variables

In Vercel Dashboard:

1. Go to Settings → Environment Variables
2. Add required variables:
   - `TWITTER_API_KEY` (if using Twitter integration)
   - `REDDIT_CLIENT_ID` (if using Reddit integration)
   - `INSTAGRAM_ACCESS_TOKEN` (if using Instagram integration)
   - `DATABASE_URL` (if using database)

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Visit your deployment URL

## Docker Deployment

### Build Docker Image

\`\`\`bash
docker build -t mental-health-analysis .
\`\`\`

### Run Container

\`\`\`bash
docker run -p 3000:3000 \
  -e TWITTER_API_KEY=your_key \
  -e REDDIT_CLIENT_ID=your_id \
  mental-health-analysis
\`\`\`

## AWS Deployment

### Using Elastic Beanstalk

\`\`\`bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p node.js-18 mental-health-analysis

# Create environment
eb create production

# Deploy
eb deploy
\`\`\`

## Google Cloud Deployment

### Using Cloud Run

\`\`\`bash
# Build image
gcloud builds submit --tag gcr.io/PROJECT_ID/mental-health-analysis

# Deploy
gcloud run deploy mental-health-analysis \
  --image gcr.io/PROJECT_ID/mental-health-analysis \
  --platform managed \
  --region us-central1
\`\`\`

## Database Migration

### From localStorage to Supabase

1. Create Supabase project
2. Create tables:
   \`\`\`sql
   CREATE TABLE users (
     id UUID PRIMARY KEY,
     email VARCHAR UNIQUE,
     created_at TIMESTAMP
   );

   CREATE TABLE analyses (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES users(id),
     content TEXT,
     type VARCHAR,
     results JSONB,
     created_at TIMESTAMP
   );

   CREATE TABLE media (
     id UUID PRIMARY KEY,
     analysis_id UUID REFERENCES analyses(id),
     url TEXT,
     type VARCHAR,
     created_at TIMESTAMP
   );
   \`\`\`

3. Update API routes to use Supabase client
4. Migrate existing data

## Monitoring

### Set Up Monitoring

1. **Error Tracking**: Sentry
   \`\`\`bash
   npm install @sentry/nextjs
   \`\`\`

2. **Analytics**: Vercel Analytics (included)

3. **Performance**: Web Vitals
   \`\`\`bash
   npm install web-vitals
   \`\`\`

### Health Checks

\`\`\`bash
# Check API health
curl https://your-domain.com/api/health

# Check database connection
curl https://your-domain.com/api/db-health
\`\`\`

## Scaling

### Horizontal Scaling

- Use Vercel's automatic scaling
- Configure concurrency limits
- Set up load balancing

### Vertical Scaling

- Increase server resources
- Optimize database queries
- Implement caching

## Backup Strategy

1. **Database Backups**
   - Daily automated backups
   - 30-day retention
   - Test restore procedures

2. **Code Backups**
   - GitHub repository
   - Multiple branches
   - Release tags

## Rollback Procedure

### Vercel Rollback

1. Go to Deployments
2. Select previous deployment
3. Click "Promote to Production"

### Manual Rollback

\`\`\`bash
git revert <commit-hash>
git push origin main
\`\`\`

## Post-Deployment

- [ ] Verify all features working
- [ ] Check error logs
- [ ] Monitor performance metrics
- [ ] Test user flows
- [ ] Verify email notifications
- [ ] Check API rate limits
