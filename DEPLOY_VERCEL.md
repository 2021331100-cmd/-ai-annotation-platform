# Vercel Deployment Guide

## Overview
This project is configured for deployment on Vercel with both frontend and backend.

## Prerequisites
- GitHub account with repository: https://github.com/2021331100-cmd/-ai-annotation-platform
- Vercel account (sign up at https://vercel.com)
- Production database (PlanetScale, Supabase, or other MySQL provider)

## Step 1: Deploy to Vercel

### A. Import Project
1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select `2021331100-cmd/-ai-annotation-platform`
4. Click "Import"

### B. Configure Project Settings
Leave all settings as default (Vercel will auto-detect from vercel.json):
- **Framework Preset**: Other
- **Root Directory**: `./` (leave as is)
- **Build Command**: Auto-detected from vercel.json
- **Output Directory**: Auto-detected from vercel.json

### C. Environment Variables
Click "Environment Variables" and add the following:

**Required:**
```
DATABASE_URL=mysql+pymysql://username:password@host:port/database_name
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
OPENAI_API_KEY=your-openai-api-key-if-using-ai-features
```

**Optional:**
```
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### D. Deploy
1. Click "Deploy"
2. Wait for build to complete (3-5 minutes)
3. Your app will be available at: `https://your-project.vercel.app`

## Step 2: Database Setup

### Option A: PlanetScale (Recommended - Free Tier)
1. Go to https://planetscale.com
2. Create new database: `ai-annotation-platform`
3. Get connection string from Settings > Passwords
4. Run database schema:
   ```bash
   # Use PlanetScale CLI or web console
   mysql -h host -u user -p database < database_schema.sql
   ```
5. Add `DATABASE_URL` to Vercel environment variables

### Option B: Supabase (Alternative)
1. Go to https://supabase.com
2. Create new project
3. Get PostgreSQL connection string (note: may need to adjust SQLAlchemy models for PostgreSQL)
4. Add `DATABASE_URL` to Vercel environment variables

## Step 3: Frontend API Configuration
The frontend is already configured to use environment variables:
- Development: `http://localhost:8000/api`
- Production: Will use `/api` (same domain on Vercel)

## Step 4: Post-Deployment

### Test Your Deployment
1. Visit your Vercel URL
2. Test sign up and sign in
3. Check API docs at: `https://your-project.vercel.app/api/docs`

### Monitor Logs
- Go to your Vercel project dashboard
- Click "Deployments" > Select latest deployment > "Functions"
- View logs for any errors

### Redeploy
Any push to the `main` branch will automatically trigger a new deployment.

## Troubleshooting

### Database Connection Issues
- Ensure `DATABASE_URL` is correctly formatted
- Check database firewall allows Vercel IPs
- Verify database credentials

### API Routes Not Working
- Check Vercel function logs
- Ensure all dependencies in `requirements.txt`
- Verify `api/index.py` is properly configured

### Frontend Build Errors
- Check Node.js version compatibility (16.x or higher)
- Ensure all npm dependencies are in `package.json`
- Review build logs in Vercel dashboard

### CORS Issues
- Already configured in `vercel.json` headers
- If issues persist, check browser console for specific errors

## Custom Domain (Optional)
1. Go to Project Settings > Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `VITE_API_BASE_URL` if using separate domain

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL connection string | `mysql+pymysql://user:pass@host/db` |
| `JWT_SECRET_KEY` | Secret for JWT tokens | Generate with `openssl rand -hex 32` |
| `OPENAI_API_KEY` | OpenAI API key (optional) | `sk-...` |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry time | `30` |

## Security Checklist
- [ ] Change default `JWT_SECRET_KEY` to a strong random value
- [ ] Use production database (not local XAMPP)
- [ ] Enable HTTPS (automatic on Vercel)
- [ ] Set secure CORS origins if needed
- [ ] Review and limit API rate limits
- [ ] Enable database SSL connections

## Cost Considerations
- **Vercel Free Tier**: 100GB bandwidth/month, unlimited deployments
- **PlanetScale Free Tier**: 5GB storage, 1 billion row reads/month
- **OpenAI API**: Pay-per-use (optional feature)

## Support
- Vercel Docs: https://vercel.com/docs
- FastAPI Docs: https://fastapi.tiangolo.com
- Project Issues: https://github.com/2021331100-cmd/-ai-annotation-platform/issues
