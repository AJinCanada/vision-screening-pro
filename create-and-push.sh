#!/bin/bash

# Script to create GitHub repository and push code
# This requires GitHub CLI (gh) or manual repository creation

REPO_NAME="vision-screening-pro"
USERNAME="alisabam"

echo "🚀 Creating repository and pushing code..."
echo ""

# Check if gh CLI is available
if command -v gh &> /dev/null; then
    echo "✅ GitHub CLI found. Creating repository..."
    gh repo create $REPO_NAME --public --source=. --remote=origin --push
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Repository created and code pushed!"
        echo "🌐 Enable GitHub Pages:"
        echo "   https://github.com/$USERNAME/$REPO_NAME/settings/pages"
        exit 0
    fi
fi

# If gh CLI is not available, provide instructions
echo "⚠️  GitHub CLI not found. Please create the repository manually:"
echo ""
echo "1. Go to: https://github.com/new"
echo "2. Repository name: $REPO_NAME"
echo "3. Make it Public"
echo "4. DO NOT initialize with README, .gitignore, or license"
echo "5. Click 'Create repository'"
echo ""
echo "Then run: git push -u origin main"
echo ""

