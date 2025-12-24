#!/bin/bash

echo "🚀 Deploying Vision Screening Pro to GitHub Pages..."

# Ensure we're on main branch
git checkout main

# Add all changes
git add .

# Commit with timestamp
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
git commit -m "Deploy: Public release - $TIMESTAMP"

# Push to GitHub
git push origin main

echo "✅ Pushed to GitHub!"
echo ""
echo "🌐 Your site will be live in 2-3 minutes at:"
echo "   https://ajincanada.github.io/vision-screening-pro/"
echo ""
echo "📝 To enable GitHub Pages:"
echo "   1. Go to: https://github.com/AJinCanada/vision-screening-pro/settings/pages"
echo "   2. Source: main branch, / (root)"
echo "   3. Click Save"
echo ""
echo "⏱️  Wait 2-3 minutes for deployment to complete"

