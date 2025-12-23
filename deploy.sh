#!/bin/bash

# GitHub Pages Deployment Script
# This script helps deploy the vision education demo to GitHub Pages

REPO_NAME="vision-screening-pro"
GITHUB_USERNAME=""  # Replace with your GitHub username

echo "🚀 Vision Education Demo - GitHub Pages Deployment"
echo "=================================================="
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not initialized. Run: git init"
    exit 1
fi

# Check if files are committed
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Staging and committing files..."
    git add index.html styles.css script.js
    git commit -m "Add vision education demo: Readthechart & Ccolor"
fi

# Set branch to main
git branch -M main

# Check if remote exists
if ! git remote get-url origin &>/dev/null; then
    if [ -z "$GITHUB_USERNAME" ]; then
        echo "⚠️  Please set your GitHub username in this script (GITHUB_USERNAME variable)"
        echo ""
        echo "Or run these commands manually:"
        echo "  git remote add origin https://github.com/YOUR_USERNAME/$REPO_NAME.git"
        echo "  git push -u origin main"
        echo ""
        echo "Then enable GitHub Pages:"
        echo "  1. Go to https://github.com/YOUR_USERNAME/$REPO_NAME"
        echo "  2. Settings → Pages"
        echo "  3. Source: main branch"
        echo "  4. Save"
        exit 1
    else
        echo "🔗 Setting up remote repository..."
        git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
    fi
fi

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "📋 Next steps to enable GitHub Pages:"
    echo "  1. Visit: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
    echo "  2. Go to Settings → Pages"
    echo "  3. Under 'Source', select 'main' branch"
    echo "  4. Click 'Save'"
    echo "  5. Your site will be live at: https://$GITHUB_USERNAME.github.io/$REPO_NAME/"
else
    echo ""
    echo "❌ Push failed. You may need to:"
    echo "  1. Create the repository on GitHub first: https://github.com/new"
    echo "  2. Name it: $REPO_NAME"
    echo "  3. Run this script again"
fi


