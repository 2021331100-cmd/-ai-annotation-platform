# 🚀 Quick Deploy to Vercel

## Fastest Way to Deploy

Run this command in PowerShell:

```powershell
cd "c:\Users\user\Documents\New folder\ai-annotation-platform"
.\deploy.ps1
```

Or manually:

```powershell
# Install Vercel CLI (if not installed)
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

## What's Configured

✅ Frontend (React + Vite) ready for Vercel
✅ Backend (FastAPI) configured for serverless
✅ Environment variables setup
✅ Build scripts configured
✅ CORS configured
✅ API routes configured

## Post-Deployment

After deployment:
1. Copy your Vercel URL
2. Update CORS in backend if needed
3. Set environment variables in Vercel dashboard

## Important Notes

⚠️ **Database Warning**: SQLite won't persist on Vercel serverless. For production:
- Use PostgreSQL (recommended: Supabase, Neon, Railway)
- Or deploy backend separately to Railway/Render

⚠️ **File Uploads**: Won't persist on Vercel serverless. Use:
- Vercel Blob Storage
- AWS S3
- Cloudinary

## Test Your Deployment

Visit these URLs after deployment:
- Frontend: `https://your-app.vercel.app`
- API Docs: `https://your-app.vercel.app/api/docs`
- Test login and features

## Need Help?

See `DEPLOYMENT.md` for detailed instructions.
