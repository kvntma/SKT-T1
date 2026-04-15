import { google } from 'googleapis';
import fs from 'fs/promises';
import path from 'path';

const TOKEN_PATH = path.join(process.cwd(), 'google_tokens.json');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
);

// Define scopes
const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

export function getAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent' // Force to get refresh token
  });
}

export async function handleCallback(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  
  // Save tokens for future use
  await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens));
  return tokens;
}

export async function getCalendarClient() {
  try {
    const tokens = await fs.readFile(TOKEN_PATH, 'utf-8');
    oauth2Client.setCredentials(JSON.parse(tokens));
    
    // Automatically refresh token if it's expired
    oauth2Client.on('tokens', async (newTokens) => {
      try {
        const currentTokens = JSON.parse(await fs.readFile(TOKEN_PATH, 'utf-8'));
        await fs.writeFile(TOKEN_PATH, JSON.stringify({ ...currentTokens, ...newTokens }));
      } catch (err) {
        console.error('Failed to save refreshed tokens:', err);
      }
    });

    return google.calendar({ version: 'v3', auth: oauth2Client });
  } catch (error) {
    throw new Error('Google Calendar not authenticated. Please navigate to /api/auth/google to sign in.');
  }
}

export async function scheduleCalendarEvent(title: string, startTime: Date, endTime: Date, description?: string) {
  const calendar = await getCalendarClient();
  
  const event = {
    summary: title,
    description: description || 'Scheduled via Push To Start Knowledge Architect',
    start: {
      dateTime: startTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event,
  });

  return response.data;
}
