# ✅ Vercel Deployment Setup - READY TO DEPLOY

## 🎯 All Configuration Files Ready

### ✅ 1. API Requirements (`api/requirements.txt`)
Complete list of Python dependencies including:
- FastAPI & Uvicorn (web framework)
- SQLAlchemy & database drivers (PostgreSQL, MySQL)
- Authentication (passlib, python-jose, bcrypt)
- Cloud Storage (boto3 for AWS S3, Supabase)
- OAuth (authlib for Google/GitHub login)
- OCR (pytesseract, pdf2image, opencv)
- Image processing (Pillow)

### ✅ 2. Vercel Configuration (`vercel.json`)
- Python API build with @vercel/python
- Frontend static build with @vercel/static-build
- API rewrites for `/api/*` routes
- CORS headers configured
- Python 3.12 environment

### ✅ 3. Frontend Environment (`.env.production`)
- API base URL set to `/api` for production

### ✅ 4. Build Ignore (`.vercelignore`)
- Excludes unnecessary files to reduce deployment size

---

## 🚀 DEPLOYMENT STEPS

### Option A: Via Vercel Dashboard (Recommended)

1. **Go to Your Vercel Project**
   - Visit: https://vercel.com/2021331100-cmds-projects/ai-annotation-platform

2. **Commit & Push Latest Changes**
   ```powershell
   git add .
   git commit -m "Complete Vercel deployment configuration"
   git push origin main
   ```

3. **Redeploy from Vercel Dashboard**
   - Click "Redeploy" button
   - OR it will auto-deploy when you push to GitHub

4. **Configure Environment Variables** (IMPORTANT!)
   Go to Project Settings → Environment Variables and add:

   **Required:**
   - `SECRET_KEY` = (generate a secure random string, e.g., use `openssl rand -hex 32`)
   - `DATABASE_URL` = (PostgreSQL connection string - see Database Setup below)

   **Optional (for advanced features):**
   - `AWS_ACCESS_KEY_ID` = (for S3 cloud storage)
   - `AWS_SECRET_ACCESS_KEY` = (for S3 cloud storage)
   - `AWS_S3_BUCKET_NAME` = (your S3 bucket name)
   - `GOOGLE_CLIENT_ID` = (for Google OAuth)
   - `GOOGLE_CLIENT_SECRET` = (for Google OAuth)
   - `GITHUB_CLIENT_ID` = (for GitHub OAuth)
   - `GITHUB_CLIENT_SECRET` = (for GitHub OAuth)
   - `OPENAI_API_KEY` = (for AI-assisted annotation)

---

## 📊 DATABASE SETUP (CRITICAL!)

**⚠️ SQLite won't work on Vercel (serverless environment)**

You need an external database. Choose one:

### Option 1: Vercel Postgres (Easiest)
1. In Vercel Dashboard → Storage → Create Database
2. Choose Postgres
3. Copy the `DATABASE_URL` connection string
4. Add to Environment Variables

### Option 2: Supabase (Free Tier)
1. Go to https://supabase.com
2. Create new project
3. Get connection string from Settings → Database
4. Format: `postgresql://user:password@host:5432/database`
5. Add to Environment Variables as `DATABASE_URL`

### Option 3: Neon (Serverless Postgres)
1. Go to https://neon.tech
2. Create new project
3. Copy connection string
4. Add to Environment Variables

### Option 4: PlanetScale (MySQL)
1. Go to https://planetscale.com
2. Create database
3. Get connection string
4. Add to Environment Variables

---

## 🔑 GENERATING SECRET_KEY

Run this command to generate a secure secret key:

```powershell
# Option 1: Using Python
python -c "import secrets; print(secrets.token_hex(32))"

# Option 2: Random string
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Copy the output and use it as your `SECRET_KEY` environment variable.

---

## 📝 ENVIRONMENT VARIABLES SUMMARY

### Minimum Required (Core Functionality)
```env
SECRET_KEY=<your-generated-secret-key-here>
DATABASE_URL=postgresql://user:password@host:5432/database
```

### Full Featured (All Features Enabled)
```env
# Core
SECRET_KEY=<your-generated-secret-key-here>
DATABASE_URL=postgresql://user:password@host:5432/database

# Cloud Storage (S3)
AWS_ACCESS_KEY_ID=<your-aws-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret>
AWS_S3_BUCKET_NAME=<your-bucket-name>
AWS_REGION=us-east-1

# OAuth (Google)
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>

# OAuth (GitHub)
GITHUB_CLIENT_ID=<your-github-client-id>
GITHUB_CLIENT_SECRET=<your-github-client-secret>

# AI Features (Optional)
OPENAI_API_KEY=<your-openai-key>
```

---

## ✅ PRE-DEPLOYMENT CHECKLIST

- [x] `api/requirements.txt` - Complete with all dependencies
- [x] `vercel.json` - Configured for Python API + React frontend
- [x] `frontend/.env.production` - API URL set to `/api`
- [x] `.vercelignore` - Excludes unnecessary files
- [x] `api/index.py` - Serverless handler exists
- [ ] **SECRET_KEY** environment variable added in Vercel
- [ ] **DATABASE_URL** environment variable added in Vercel
- [ ] Optional API keys configured (if using advanced features)
- [ ] Code committed and pushed to GitHub

---

## 🎉 AFTER DEPLOYMENT

### 1. Check Deployment Status
- Go to Vercel Dashboard → Deployments
- Wait for build to complete (usually 2-5 minutes)

### 2. Test Your Application
- Visit your deployment URL (e.g., https://your-app.vercel.app)
- Try signing up (creates account in your database)
- Test login functionality

### 3. Database Migration
If you need to initialize database tables:
- The app will auto-create tables on first run
- OR you can run migrations manually if needed

### 4. Monitor Logs
- Vercel Dashboard → Functions → View logs
- Check for any runtime errors

---

## 🐛 TROUBLESHOOTING

### Build Fails
- Check deployment logs in Vercel Dashboard
- Verify all dependencies are in `api/requirements.txt`
- Ensure Python version compatibility (3.12)

### API Not Working
- Verify `DATABASE_URL` is set
- Check `SECRET_KEY` is configured
- Review function logs for errors

### CORS Issues
- Already configured in `vercel.json` headers
- If issues persist, check browser console

### Database Connection Fails
- Verify connection string format
- Check database credentials
- Ensure database accepts connections from Vercel IPs

---

## 📞 QUICK DEPLOY COMMAND

```powershell
# Commit all changes
git add .
git commit -m "Complete Vercel deployment configuration"
git push origin main
```

Then go to Vercel Dashboard and click **Redeploy** or wait for auto-deployment.

---

## 🎯 CURRENT STATUS: READY FOR DEPLOYMENT

All configuration files are in place. Just:
1. Push code to GitHub
2. Add environment variables in Vercel
3. Deploy!
