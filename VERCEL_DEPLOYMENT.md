# 🎯 Vercel Deployment - Complete Setup

## ✅ What's Been Configured

Your AI Annotation Platform is now ready for Vercel deployment with:

### Files Created/Modified:
1. **`vercel.json`** - Vercel configuration with routes and builds
2. **`.vercelignore`** - Files to exclude from deployment
3. **`.gitignore`** - Git ignore patterns
4. **`requirements.txt`** - Python dependencies (root level)
5. **`api/index.py`** - Vercel serverless handler for FastAPI
6. **`frontend/.env.production`** - Production environment variables
7. **`frontend/.env.development`** - Development environment variables
8. **`deploy.ps1`** - Windows deployment script
9. **`deploy.sh`** - Linux/Mac deployment script
10. **Updated `frontend/src/api.js`** - Dynamic API URL configuration
11. **Updated `frontend/package.json`** - Added vercel-build script

## 🚀 Deploy Steps

### Option 1: Quick Deploy (PowerShell)
```powershell
cd "c:\Users\user\Documents\New folder\ai-annotation-platform"
.\deploy.ps1
```

### Option 2: Manual Vercel CLI
```powershell
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
cd "c:\Users\user\Documents\New folder\ai-annotation-platform"
vercel --prod
```

### Option 3: GitHub + Vercel (Continuous Deployment)

1. **Push to GitHub:**
```powershell
git add .
git commit -m "Ready for Vercel deployment"
git remote add origin https://github.com/YOUR_USERNAME/ai-annotation-platform.git
git push -u origin main
```

2. **Import to Vercel:**
   - Visit: https://vercel.com/new
   - Import your GitHub repository
   - Vercel will auto-detect settings
   - Click "Deploy"

## ⚙️ Environment Variables

After deployment, add these in Vercel Dashboard (Settings → Environment Variables):

### Production Variables:
```
DATABASE_URL=sqlite:///./annotation_platform.db
SECRET_KEY=your-super-secret-key-change-this
ALLOWED_ORIGINS=https://your-app.vercel.app
PYTHON_VERSION=3.12
```

### For Frontend (automatically loaded):
```
VITE_API_BASE_URL=/api
```

## 🧪 Testing Your Deployment

After deployment completes:

1. **Frontend:** `https://your-app.vercel.app`
   - ✅ Homepage loads
   - ✅ Sign up form works
   - ✅ Sign in form works
   
2. **API:** `https://your-app.vercel.app/api/docs`
   - ✅ Swagger docs accessible
   - ✅ Can test endpoints
   
3. **Features to Test:**
   - ✅ User registration
   - ✅ User login
   - ✅ Dashboard navigation
   - ✅ Role-based access (Admin, Manager, Reviewer, Annotator)
   - ✅ AI annotation modal
   - ✅ AI review modal
   - ⚠️ Dataset upload (may have limitations, see below)
   - ⚠️ Task assignment

## ⚠️ Production Considerations

### Current Setup Limitations:

1. **Database (SQLite)**
   - ❌ Will reset on each deployment
   - ❌ Not suitable for production
   - ✅ **Solution:** Migrate to PostgreSQL
     - Recommended: [Supabase](https://supabase.com), [Neon](https://neon.tech), [Railway](https://railway.app)
     - Update `DATABASE_URL` environment variable
     - Update `backend/database.py` if needed

2. **File Uploads**
   - ❌ Won't persist on Vercel serverless
   - ✅ **Solution:** Use cloud storage
     - [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob)
     - [AWS S3](https://aws.amazon.com/s3/)
     - [Cloudinary](https://cloudinary.com)

3. **Serverless Limitations**
   - ⏱️ 10-second timeout for API responses
   - 💤 Cold starts (first request may be slow)
   - 📦 50MB deployment size limit

### Recommended Production Architecture:

```
┌─────────────────┐
│  Vercel         │ ← Frontend (React)
│  (Static Site)  │
└────────┬────────┘
         │
         │ API Calls
         ↓
┌─────────────────┐
│  Railway/Render │ ← Backend (FastAPI)
│  (Always On)    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  PostgreSQL DB  │ ← Database
│  (Persistent)   │
└─────────────────┘
         +
┌─────────────────┐
│  S3/Cloudinary  │ ← File Storage
│  (Cloud)        │
└─────────────────┘
```

## 🔧 Alternative: Hybrid Deployment

Deploy frontend on Vercel, backend elsewhere:

### 1. Deploy Backend to Railway:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### 2. Update Frontend Environment:
In Vercel dashboard, set:
```
VITE_API_BASE_URL=https://your-backend.railway.app/api
```

### 3. Update Backend CORS:
Add Railway/Vercel URL to `ALLOWED_ORIGINS` in backend

## 📊 Monitoring & Analytics

After deployment:
- Enable Vercel Analytics (free)
- Set up error tracking (Sentry)
- Monitor API performance
- Check serverless function logs

## 🎨 Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `ALLOWED_ORIGINS` with new domain

## 🐛 Common Issues & Solutions

### Issue: "Module not found"
**Solution:** Ensure all imports use correct paths, check requirements.txt

### Issue: Database resets
**Solution:** Use PostgreSQL instead of SQLite

### Issue: File uploads don't work
**Solution:** Implement cloud storage (S3, Vercel Blob)

### Issue: CORS errors
**Solution:** Add Vercel domain to `ALLOWED_ORIGINS` in backend

### Issue: Build fails
**Solution:** Check build logs, verify all dependencies are listed

### Issue: API timeout
**Solution:** Optimize slow endpoints or use dedicated backend hosting

## 📱 Mobile Responsiveness

The frontend is responsive, but test on:
- Desktop browsers (Chrome, Firefox, Edge)
- Mobile devices (iOS Safari, Android Chrome)
- Tablets

## 🔐 Security Checklist

Before going live:
- [ ] Change `SECRET_KEY` to secure random string
- [ ] Enable HTTPS only (Vercel does this automatically)
- [ ] Implement rate limiting
- [ ] Add input validation
- [ ] Set up authentication tokens properly
- [ ] Review CORS settings
- [ ] Enable security headers
- [ ] Audit dependencies for vulnerabilities

## 📈 Performance Optimization

- [ ] Enable caching headers
- [ ] Optimize images
- [ ] Minify CSS/JS (Vite does this)
- [ ] Use lazy loading for routes
- [ ] Enable compression
- [ ] Monitor Core Web Vitals

## 🎓 Next Steps

1. **Deploy & Test** - Deploy and verify all features work
2. **Migrate Database** - Set up PostgreSQL for persistence
3. **Add Storage** - Implement cloud file storage
4. **Custom Domain** - Add your domain name
5. **Analytics** - Enable monitoring
6. **CI/CD** - Set up automated deployments via GitHub
7. **Scaling** - Monitor usage and scale as needed

## 📞 Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **FastAPI Docs:** https://fastapi.tiangolo.com
- **React Docs:** https://react.dev
- **Deployment Guide:** See `DEPLOYMENT.md`
- **Quick Start:** See `DEPLOY_QUICK.md`

---

## 🎉 Ready to Deploy!

Everything is configured. Run:

```powershell
.\deploy.ps1
```

Or use Vercel CLI:

```powershell
vercel --prod
```

**Good luck with your deployment! 🚀**
