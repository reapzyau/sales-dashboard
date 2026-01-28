# 📊 Sales Dashboard - Netlify Deployment

Live web dashboard showing today's sales calls and recent Calendly bookings.

## Features

- 📞 Today's calendar calls (filtered, no BLOCK events)
- 🗓️ Recent Calendly booking notifications
- 🔄 Auto-refreshes every 30 seconds
- 📱 Mobile-friendly responsive design
- 🔒 Serverless backend (Netlify Functions)

## 🔐 Security Features (NEW!)

- ✅ Password-protected access
- ✅ Audit logging (all access tracked)
- ✅ No plain-text credentials (environment variables only)
- ✅ Session tokens with 24-hour expiry
- ✅ HTTPS encryption
- ✅ SHA-256 password hashing

## Environment Variables Required

Set these in Netlify dashboard (Site Settings → Environment Variables):

```
GOOGLE_CLIENT_ID=<your-google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<your-google-oauth-client-secret>
GOOGLE_REFRESH_TOKEN=<your-google-oauth-refresh-token>
SALES_CALENDAR_ID=<your-calendar-id>
DASHBOARD_PASSWORD_HASH=<sha256-hash-of-your-password>
```

## 🔑 Setup Dashboard Password

**Quick setup:**
```bash
./setup-password.sh
```

**Manual setup:**
```bash
# Generate password hash
echo -n "YourPassword123" | sha256sum

# Set in Netlify
netlify env:set DASHBOARD_PASSWORD_HASH "<your-hash>"

# Redeploy
netlify deploy --prod --dir=.
```

## Local Development

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Run locally
netlify dev
```

Visit: http://localhost:8888

## Deployment

Already deployed via the automated workflow! 🚀

## Tech Stack

- Pure HTML/CSS/JS (no frameworks)
- Netlify Functions (Node.js serverless)
- Google Calendar API
- Gmail API (for Calendly notifications)

---

Built with ❤️ by Jarvis
