# Quick deployment script for Vercel (Windows)

Write-Host "Deploying AI Annotation Platform to Vercel..." -ForegroundColor Green

# Check if vercel CLI is installed
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
}

# Login to Vercel
Write-Host "Logging in to Vercel..." -ForegroundColor Cyan
vercel login

# Deploy to production
Write-Host "Deploying to production..." -ForegroundColor Cyan
vercel --prod

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Visit your site at the URL provided above" -ForegroundColor Yellow
