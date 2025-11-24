#!/bin/bash
# Quick deployment script for Vercel

echo "🚀 Deploying AI Annotation Platform to Vercel..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null
then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Login to Vercel
echo "📝 Logging in to Vercel..."
vercel login

# Deploy to production
echo "🚢 Deploying to production..."
vercel --prod

echo "✅ Deployment complete!"
echo "🌐 Visit your site at the URL provided above"
