#!/bin/bash
# Setup dashboard password securely
# Usage: ./setup-password.sh

set -e

echo "🔐 Sales Dashboard - Password Setup"
echo "===================================="
echo ""

# Prompt for password
read -sp "Enter dashboard password: " PASSWORD
echo ""
read -sp "Confirm password: " PASSWORD_CONFIRM
echo ""

if [ "$PASSWORD" != "$PASSWORD_CONFIRM" ]; then
    echo "❌ Passwords don't match!"
    exit 1
fi

if [ ${#PASSWORD} -lt 8 ]; then
    echo "❌ Password must be at least 8 characters!"
    exit 1
fi

# Generate SHA-256 hash
HASH=$(echo -n "$PASSWORD" | sha256sum | cut -d' ' -f1)

echo ""
echo "✅ Password hash generated!"
echo ""
echo "Your password hash:"
echo "$HASH"
echo ""
echo "Setting up Netlify environment variable..."
echo ""

# Set Netlify environment variable
export NETLIFY_AUTH_TOKEN="nfp_dCBAWU2qvfyBfuBjNmeN1d91fzmWoxQSe83c"
netlify env:set DASHBOARD_PASSWORD_HASH "$HASH"

echo ""
echo "✅ Password configured successfully!"
echo ""
echo "🚀 Deploying updated dashboard..."
netlify deploy --prod --dir=.

echo ""
echo "✅ All done!"
echo ""
echo "📊 Access your dashboard at:"
echo "https://sales-dashboard-rumble.netlify.app"
echo ""
echo "🔑 Use your password to login"
echo ""
