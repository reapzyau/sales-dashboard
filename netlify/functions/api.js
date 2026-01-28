const https = require('https');
const querystring = require('querystring');
const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Load tokens from environment or file
    const tokenPath = process.env.LAMBDA_TASK_ROOT 
      ? '/tmp/google-calendar-tokens.json'
      : path.join(__dirname, '../../../google-calendar-tokens.json');
    
    let tokens;
    if (process.env.GOOGLE_TOKENS) {
      tokens = JSON.parse(process.env.GOOGLE_TOKENS);
    } else {
      tokens = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
    }

    const SALES_CALENDAR_ID = 'c_866d37efe4c231626dc57c7319fe9a60c28df6a14f96b1f2fc48c7ea02517e9c@group.calendar.google.com';

    // Refresh token
    const accessToken = await refreshToken(tokens);
    
    // Fetch calendar and bookings
    const [calls, bookings] = await Promise.all([
      fetchTodaysCalls(accessToken, SALES_CALENDAR_ID),
      fetchCalendlyBookings(accessToken)
    ]);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        calls,
        bookings,
        lastUpdated: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

function refreshToken(tokens) {
  return new Promise((resolve, reject) => {
    const postData = querystring.stringify({
      client_id: tokens.client_id,
      client_secret: tokens.client_secret,
      refresh_token: tokens.refresh_token,
      grant_type: 'refresh_token'
    });

    const options = {
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const newTokens = JSON.parse(data);
          resolve(newTokens.access_token);
        } else {
          reject(new Error('Token refresh failed'));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function fetchTodaysCalls(accessToken, calendarId) {
  return new Promise((resolve, reject) => {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    
    const encodedCalendarId = encodeURIComponent(calendarId);
    
    const options = {
      hostname: 'www.googleapis.com',
      path: `/calendar/v3/calendars/${encodedCalendarId}/events?timeMin=${now.toISOString()}&timeMax=${endOfDay.toISOString()}&singleEvents=true&orderBy=startTime`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const result = JSON.parse(data);
          const calls = (result.items || [])
            .filter(e => !((e.summary || '').toLowerCase().includes('block')))
            .map(e => ({
              title: e.summary || 'Untitled',
              start: e.start.dateTime || e.start.date,
              location: e.location || null,
              description: e.description || null
            }));
          resolve(calls);
        } else {
          resolve([]);
        }
      });
    });

    req.on('error', () => resolve([]));
    req.end();
  });
}

function fetchCalendlyBookings(accessToken) {
  return new Promise((resolve, reject) => {
    const query = encodeURIComponent('from:notifications@calendly.com');
    
    const options = {
      hostname: 'gmail.googleapis.com',
      path: `/gmail/v1/users/me/messages?q=${query}&maxResults=5`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', async () => {
        if (res.statusCode === 200) {
          const result = JSON.parse(data);
          if (!result.messages || result.messages.length === 0) {
            resolve([]);
            return;
          }
          
          const bookings = await Promise.all(
            result.messages.map(msg => getMessageSummary(accessToken, msg.id))
          );
          
          resolve(bookings.filter(b => b !== null));
        } else {
          resolve([]);
        }
      });
    });

    req.on('error', () => resolve([]));
    req.end();
  });
}

function getMessageSummary(accessToken, messageId) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'gmail.googleapis.com',
      path: `/gmail/v1/users/me/messages/${messageId}?format=metadata`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const msg = JSON.parse(data);
          const headers = msg.payload.headers;
          resolve({
            subject: headers.find(h => h.name === 'Subject')?.value || '',
            date: headers.find(h => h.name === 'Date')?.value || ''
          });
        } else {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.end();
  });
}
