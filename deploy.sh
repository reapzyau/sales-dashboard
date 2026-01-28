#!/bin/bash
set -e

export NETLIFY_AUTH_TOKEN="nfp_dCBAWU2qvfyBfuBjNmeN1d91fzmWoxQSe83c"
SITE_NAME="sales-dashboard-rumble"
REPO_NAME="sales-dashboard"
GITHUB_USER="reapzy"

cd "$(dirname "$0")"

echo "📦 Setting up Git..."
if [ ! -d ".git" ]; then
    git init
    echo "google-calendar-tokens.json" > .gitignore
    echo "node_modules/" >> .gitignore
    echo ".env*" >> .gitignore
    git add .
    git commit -m "Initial commit: Sales Dashboard with Netlify Functions"
fi

echo "🐙 Creating/updating GitHub repo..."
if ! gh repo view "$GITHUB_USER/$REPO_NAME" &>/dev/null; then
    gh repo create "$GITHUB_USER/$REPO_NAME" --public --source=. --remote=origin
    git push -u origin main 2>/dev/null || git push -u origin master
else
    echo "   Repo exists, updating..."
    git remote add origin "https://github.com/$GITHUB_USER/$REPO_NAME.git" 2>/dev/null || true
    git add .
    git commit -m "Update dashboard" 2>/dev/null || echo "   No changes to commit"
    git push 2>/dev/null || echo "   Already up to date"
fi

echo "🔐 Setting up Netlify environment variables..."
# Read Google tokens
TOKENS=$(cat google-calendar-tokens.json | jq -c .)

# Create or update Netlify site
if ! netlify status --site="$SITE_NAME" &>/dev/null; then
    echo "   Creating new Netlify site..."
    netlify sites:create --name="$SITE_NAME" --account-slug="rumble-digital" || true
fi

# Set environment variable
echo "   Setting GOOGLE_TOKENS..."
netlify env:set GOOGLE_TOKENS "$TOKENS" --site="$SITE_NAME" 2>/dev/null || {
    echo "   Note: Environment variable may need manual setup"
}

echo "🚀 Deploying to Netlify..."
netlify deploy --prod --site="$SITE_NAME" --dir=. --json > /tmp/netlify-deploy.json 2>&1 || {
    echo "   Retrying deployment..."
    netlify deploy --prod --site="$SITE_NAME"
}

DEPLOY_URL="https://$SITE_NAME.netlify.app"

echo ""
echo "✅ Deployment complete!"
echo "🔗 Live URL: $DEPLOY_URL"
echo "📁 GitHub: https://github.com/$GITHUB_USER/$REPO_NAME"
echo ""
echo "📝 Note: If the dashboard shows errors, you may need to manually set"
echo "   the GOOGLE_TOKENS environment variable in Netlify dashboard."
