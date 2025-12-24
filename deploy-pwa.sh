#!/bin/bash
# Vision Screening Pro - PWA Deployment Script

echo "🚀 Deploying Vision Screening Pro as PWA..."

# Step 1: Ensure we're on main branch
git checkout main

# Step 2: Add all changes
git add .

# Step 3: Commit with timestamp
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
git commit -m "Deploy PWA v1.0.0 - $TIMESTAMP

Features:
- Progressive Web App (PWA) support
- Screen brightness detection & wake lock
- Dark adaptation timer for contrast tests
- Device compatibility testing
- Speech recognition for reading tests
- Offline support via service worker
- Install to home screen capability"

# Step 4: Push to GitHub
git push origin main

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your PWA will be live in 2-3 minutes at:"
echo "   https://ajincanada.github.io/vision-screening-pro/"
echo ""
echo "📱 To install on mobile:"
echo "   1. Open in browser"
echo "   2. Tap 'Add to Home Screen' or use install banner"
echo "   3. Done!"
echo ""
echo "📝 To enable GitHub Pages (if not already enabled):"
echo "   1. Go to: https://github.com/AJinCanada/vision-screening-pro/settings/pages"
echo "   2. Source: main branch, / (root)"
echo "   3. Click Save"
echo ""
echo "⏱️  Wait 2-3 minutes for deployment to complete"

