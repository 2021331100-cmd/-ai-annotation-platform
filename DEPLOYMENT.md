# AI Data Annotation Platform - Vercel Deployment Guide

## Prerequisites
1. Install Vercel CLI: `npm install -g vercel`
2. Create a Vercel account at https://vercel.com
3. Have a GitHub account (recommended for continuous deployment)

## Deployment Steps

### Option 1: Deploy via Vercel CLI (Quick)

1. **Login to Vercel**
   ```bash
   vercel login
   ```

2. **Deploy from project root**
   ```bash
   cd "c:\Users\user\Documents\New folder\ai-annotation-platform"
   vercel
   ```

3. **Follow the prompts:**
   - Link to existing project? → No
   - Project name → ai-annotation-platform
   - Directory → ./
   - Override settings? → No

4. **Deploy to production**
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via GitHub + Vercel (Recommended)

1. **Initialize Git repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit for deployment"
   ```

2. **Create GitHub repository**
   - Go to https://github.com/new
   - Create a new repository named "ai-annotation-platform"
   - Don't initialize with README

3. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/ai-annotation-platform.git
   git branch -M main
   git push -u origin main
   ```

4. **Import to Vercel**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Configure project:
     - Framework Preset: Other
     - Root Directory: ./
     - Build Command: `cd frontend && npm install && npm run build`
     - Output Directory: frontend/dist
     - Install Command: `npm install --prefix frontend`

5. **Add Environment Variables in Vercel Dashboard**
   - Go to Project Settings → Environment Variables
   - Add:
     - `DATABASE_URL` = `sqlite:///./annotation_platform.db`
     - `SECRET_KEY` = `your-secure-random-string`
     - `PYTHON_VERSION` = `3.12`

## Important Notes

### Backend Limitations on Vercel
⚠️ **Vercel Serverless Functions have limitations:**
- **No persistent file system** - SQLite database will reset on each deployment
- **10 second timeout** for serverless functions
- **File uploads** may not persist

### Recommended Production Setup
For a production application with database and file uploads, consider:

1. **Backend Hosting Options:**
   - **Railway** (https://railway.app) - Supports persistent storage
   - **Render** (https://render.com) - Free tier with persistent disk
   - **DigitalOcean App Platform**
   - **AWS EC2** or **Google Cloud Run**

2. **Database Options:**
   - **PostgreSQL** (Supabase, Neon, Railway)
   - **MySQL** (PlanetScale, Railway)
   - Replace SQLite in production

3. **File Storage:**
   - **AWS S3**
   - **Cloudinary**
   - **Vercel Blob Storage**

## Alternative: Deploy Frontend Only on Vercel

Deploy only the frontend to Vercel and host backend separately:

1. **Update vercel.json:**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "frontend/package.json",
         "use": "@vercel/static-build",
         "config": {
           "distDir": "dist"
         }
       }
     ]
   }
   ```

2. **Set environment variable:**
   - `VITE_API_BASE_URL` = `https://your-backend-url.com/api`

3. **Deploy backend to Railway/Render**

## Testing Deployment

1. **Check frontend:** https://your-project.vercel.app
2. **Check API:** https://your-project.vercel.app/api/docs
3. **Test features:**
   - User registration
   - Login
   - Dashboard access
   - AI annotation (may have cold start delays)

## Troubleshooting

### Build Failures
- Check build logs in Vercel dashboard
- Ensure all dependencies are in package.json
- Verify Node.js version compatibility

### Database Issues
- For production, migrate to PostgreSQL
- Update DATABASE_URL in environment variables
- Run migrations after deployment

### CORS Errors
- Update ALLOWED_ORIGINS in backend/.env
- Add your Vercel domain to CORS settings

## Post-Deployment Checklist

- [ ] Frontend loads correctly
- [ ] API documentation accessible (/api/docs)
- [ ] User registration works
- [ ] Login authentication works
- [ ] Role-based dashboards display
- [ ] Database persists (if using external DB)
- [ ] File uploads work (if using cloud storage)
- [ ] AI features respond correctly

## Local Development After Deployment

Continue local development with:
```bash
# Backend
cd backend
python -m uvicorn main:app --reload --port 8000

# Frontend
cd frontend
npm run dev
```

## Support

For issues:
- Vercel Docs: https://vercel.com/docs
- FastAPI on Vercel: https://vercel.com/guides/using-fastapi-with-vercel
- GitHub Issues: Create issues in your repository
