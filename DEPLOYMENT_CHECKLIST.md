# Pre-Deployment Checklist

## ✅ Completed Setup

- [x] Created `vercel.json` configuration
- [x] Created `.vercelignore` file
- [x] Created `.gitignore` file
- [x] Added environment variable files
- [x] Updated API to use environment variables
- [x] Created `requirements.txt` for Python dependencies
- [x] Created API handler for Vercel serverless
- [x] Added build script to package.json
- [x] Initialized Git repository
- [x] Created deployment scripts (deploy.ps1, deploy.sh)

## 📋 Before You Deploy

### 1. Install Vercel CLI
```powershell
npm install -g vercel
```

### 2. Test Local Build
```powershell
cd frontend
npm run build
```

### 3. Review Environment Variables
Check that these are set:
- `VITE_API_BASE_URL` (frontend)
- `DATABASE_URL` (backend)
- `SECRET_KEY` (backend)

### 4. Commit Your Code
```powershell
git add .
git commit -m "Prepare for Vercel deployment"
```

## 🚀 Deploy Now

### Quick Deploy (Recommended)
```powershell
cd "c:\Users\user\Documents\New folder\ai-annotation-platform"
.\deploy.ps1
```

### Manual Deploy
```powershell
vercel login
vercel --prod
```

## 📝 After Deployment

### 1. Set Environment Variables in Vercel Dashboard
Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

Add:
- `DATABASE_URL` = `sqlite:///./annotation_platform.db` (temporary)
- `SECRET_KEY` = (generate a secure random string)
- `ALLOWED_ORIGINS` = `https://your-app.vercel.app`

### 2. Test Your Deployment

- [ ] Frontend loads: `https://your-app.vercel.app`
- [ ] API docs accessible: `https://your-app.vercel.app/api/docs`
- [ ] Can register new user
- [ ] Can login
- [ ] Dashboards load correctly
- [ ] API responses work

### 3. Important Production Considerations

⚠️ **Current Limitations:**
- SQLite database will reset on each deployment
- File uploads won't persist (serverless)
- May have cold start delays

🔧 **For Production Use:**

1. **Database**: Switch to PostgreSQL
   - Recommended: Supabase, Neon, or Railway
   - Update `DATABASE_URL` environment variable
   - Update `backend/database.py` connection string

2. **File Storage**: Use cloud storage
   - Vercel Blob: https://vercel.com/docs/storage/vercel-blob
   - AWS S3
   - Cloudinary

3. **Backend Hosting**: Consider dedicated hosting
   - Railway: https://railway.app
   - Render: https://render.com
   - Deploy frontend on Vercel, backend elsewhere

## 🐛 Troubleshooting

### Build Fails
- Check Vercel build logs
- Ensure all dependencies are in package.json and requirements.txt
- Verify Node and Python versions

### Database Issues
- SQLite won't work long-term on Vercel
- Switch to PostgreSQL for production
- Or deploy backend separately

### CORS Errors
- Add your Vercel domain to ALLOWED_ORIGINS
- Check CORS middleware in backend/main.py
- Verify API_BASE_URL in frontend

### 404 Errors
- Check vercel.json routes configuration
- Ensure frontend/dist directory exists after build
- Verify API handler at api/index.py

## 📚 Resources

- Vercel Docs: https://vercel.com/docs
- FastAPI Deployment: https://fastapi.tiangolo.com/deployment/
- React Deployment: https://vitejs.dev/guide/static-deploy.html

## ✨ Next Steps

1. Deploy and test
2. Set up custom domain (optional)
3. Configure production database
4. Set up file storage
5. Enable analytics
6. Set up monitoring

---

**Ready to deploy?** Run: `.\deploy.ps1`
