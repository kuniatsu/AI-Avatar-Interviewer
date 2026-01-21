# Deployment Guide

This guide covers deploying the AI Avatar Interviewer to Vercel and setting up monitoring.

## Prerequisites

- Node.js 18+ installed locally
- Vercel account (https://vercel.com)
- GitHub repository connected to Vercel
- Anthropic Claude API key

## Environment Variables

### Required Variables

1. **CLAUDE_API_KEY** - Your Anthropic API key
   - Get from: https://console.anthropic.com/
   - Format: `sk-ant-...`

### Optional Variables

- **NEXT_PUBLIC_MODEL_URL** - URL to 3D VRM model
- **NEXT_PUBLIC_SENTRY_DSN** - Sentry error tracking
- **NEXT_PUBLIC_BUILD_ID** - Build identifier

## Local Development

```bash
# Install dependencies
npm install --legacy-peer-deps

# Create .env.local file
cp .env.example .env.local

# Edit .env.local and add your CLAUDE_API_KEY
nano .env.local

# Run development server
npm run dev

# Open http://localhost:3000
```

## Vercel Deployment

### Option 1: Automatic Deployment (Recommended)

1. Push code to GitHub (main branch)
2. Vercel automatically detects changes
3. Sets up environment variables in Vercel dashboard
4. Builds and deploys automatically

### Option 2: Manual Deployment

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel --prod
   ```

3. Follow prompts to configure environment

### Setting Up Environment Variables

1. Go to Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the following variables:

| Variable | Value | Scope |
|----------|-------|-------|
| CLAUDE_API_KEY | sk-ant-... | Production |
| NEXT_PUBLIC_MODEL_URL | Your model URL | Production |

## CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically:

- Runs on every push to main branch
- Installs dependencies
- Lints code
- Builds the project
- Checks bundle size
- Deploys to Vercel (on main branch only)

### Required Secrets for GitHub Actions

1. `VERCEL_TOKEN` - Vercel authentication token
   - Generate at: https://vercel.com/account/tokens

2. `VERCEL_ORG_ID` - Your Vercel org ID
   - Find in Vercel dashboard URL: `vercel.com/{ORG_ID}`

3. `VERCEL_PROJECT_ID` - Your Vercel project ID
   - Find in project settings

4. `CLAUDE_API_KEY` - Your Claude API key

## Monitoring and Error Tracking

### Sentry Setup (Optional)

1. Create Sentry account: https://sentry.io
2. Create new Next.js project
3. Get your DSN
4. Add to environment variables: `NEXT_PUBLIC_SENTRY_DSN`

### Vercel Analytics

Vercel provides built-in analytics:
- Performance metrics
- Error tracking
- API usage monitoring
- Custom logs

Access in Vercel dashboard → Analytics

## Performance Optimization

The project includes optimizations for production:

- Code splitting (dynamic imports)
- Image optimization (WebP, AVIF)
- No source maps in production
- Compressed responses (gzip)

Check performance:
```bash
# Generate performance report
npm run build
npm run start

# Then use tools like Lighthouse, WebPageTest
```

## Troubleshooting

### Build Fails

1. Check Node version: `node --version` (should be 18+)
2. Clear cache: `npm run build && rm -rf .next`
3. Check environment variables are set
4. Review build logs in Vercel dashboard

### API Errors

1. Verify `CLAUDE_API_KEY` is set correctly
2. Check API quota: https://console.anthropic.com/
3. Review server logs in Vercel dashboard
4. Check network connectivity

### Slow Performance

1. Analyze bundle size: Check `.next` folder
2. Review Core Web Vitals in Vercel Analytics
3. Check image optimization is working
4. Review API response times

## Rollback

To rollback to a previous version:

1. Go to Vercel project → Deployments
2. Find previous successful deployment
3. Click "Promote to Production"

## Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Restrict API key access** - Use scope/permissions
3. **Enable CORS** - Configure in vercel.json
4. **Use HTTPS only** - Vercel enforces this
5. **Monitor access** - Check logs regularly
6. **Rotate keys** - Periodically update API keys

## Support

For issues:

1. Check Vercel documentation: https://vercel.com/docs
2. Review build logs in Vercel dashboard
3. Check GitHub Actions workflow results
4. Visit project repository for issues
