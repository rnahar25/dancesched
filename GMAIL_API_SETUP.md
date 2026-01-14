# Gmail API with OAuth + Refresh Token Integration

This guide shows how to set up **Gmail API with one-time OAuth** - the perfect solution for seamless email notifications!

## Why OAuth + Refresh Token is Perfect?

- ✅ **No user authentication** - Users just submit, no Google login required  
- ✅ **High Gmail API limits** - 1 billion quota units per day
- ✅ **Send-only permissions** - Secure, no read/delete access
- ✅ **One-time setup** - You OAuth once, works forever
- ✅ **Seamless UX** - Users never see permission dialogs
- ✅ **Simpler than service accounts** - No complex delegation needed

---

## Step 1: Create Google Cloud Project & OAuth Client

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**
2. **Click "Select a project" → "New Project"**
3. **Enter project name:** "Dance Schedule Gmail"
4. **Click "Create"**

### Enable Gmail API
1. **Go to "APIs & Services" → "Library"**
2. **Search for "Gmail API"**
3. **Click "Gmail API" → "Enable"**

### Configure OAuth Consent Screen (REQUIRED FIRST!)
1. **Go to "APIs & Services" → "OAuth consent screen"**
2. **Choose user type:**
   - **External** ✅ (Recommended) - Works with personal Gmail accounts 
   - **Internal** (Only if you have Google Workspace domain)
3. **Click "Create"**
4. **Fill in required fields:**
   - **App name:** "Dance Schedule Emailer"
   - **User support email:** Your email address
   - **Developer contact email:** Your email address
5. **Click "Save and Continue"**
6. **Scopes page:** Click "Save and Continue" (no changes needed)
7. **Test users page:** Click "Save and Continue" (no changes needed)  
8. **Summary page:** Click "Back to Dashboard"

### Create OAuth 2.0 Client
1. **Go to "APIs & Services" → "Credentials"**
2. **Click "Create Credentials" → "OAuth client ID"**
3. **Application type:** "Web application"**
4. **Name:** "Dance Schedule Emailer"**
5. **Authorized redirect URIs:** `http://localhost:3000/oauth/callback` (for setup)**
6. **Click "Create"**
7. **Copy Client ID and Client Secret** - you'll need these!

---

## Step 2: One-Time OAuth Setup (You Do This Once)

### Get Your Refresh Token
1. **Run the OAuth flow once** (I'll provide a script)
2. **Authorize send-only Gmail access** for your account
3. **Get refresh token** - this lasts forever!
4. **Store refresh token securely** in your backend

### OAuth Setup Script
```javascript
// oauth-setup.js - Run this once to get your refresh token
const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  'YOUR_CLIENT_ID',
  'YOUR_CLIENT_SECRET',
  'http://localhost:3000/oauth/callback'
);

// Step 1: Get authorization URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline', // Important: gets refresh token
  scope: ['https://www.googleapis.com/auth/gmail.send']
});

console.log('Visit this URL:', authUrl);
// Step 2: After visiting URL and getting code, exchange for tokens
// oauth2Client.getToken(code) // Run this with the code from callback
```

---

## Step 3: Backend Implementation

Your backend stores the refresh token and automatically handles token refresh:
```javascript
// No user authentication needed - backend handles everything!
const refreshToken = 'YOUR_REFRESH_TOKEN_FROM_STEP_2';
```

---

## Step 4: Run OAuth Setup (One Time Only!)

### Detailed Steps:

1. **Save the script:** The `oauth-setup.js` file is already in your project folder

2. **Edit the script:** Open `oauth-setup.js` and replace these lines:
   ```javascript
   const CLIENT_ID = 'your-client-id.apps.googleusercontent.com';
   const CLIENT_SECRET = 'your-client-secret';
   ```
   With your actual values from Google Cloud Console.

3. **Install Node.js dependencies:** Open terminal in your project folder and run:
   ```bash
   npm install googleapis open
   ```

4. **Run the setup script:** In the same terminal, run:
   ```bash
   node oauth-setup.js
   ```

5. **Follow the prompts:**
   - Script will open your browser automatically
   - Sign in with your Gmail account
   - Click "Allow" to authorize Gmail send access
   - Browser will show "Success!" and redirect back
   - Terminal will display your refresh token

6. **Copy the refresh token:** Look for this line in the terminal output:
   ```
   refresh_token: 'your_long_refresh_token_here'
   ```
   Copy that long token string - you'll need it for your backend!

### What Happens During Setup:
1. Script opens browser to Google OAuth
2. You authorize **send-only Gmail access** for your account  
3. Google redirects back with authorization code
4. Script exchanges code for **refresh token** 
5. **Refresh token is yours forever!** ✨

---

## Step 5: Deploy Backend Function  

1. **Update `gmail-backend-example.js`** with your credentials:
   ```javascript
   const OAUTH_CREDENTIALS = {
     client_id: 'your-client-id.apps.googleusercontent.com',
     client_secret: 'your-client-secret', 
     refresh_token: 'your-refresh-token-from-setup' // The magic token!
   };
   ```

2. **Deploy to your preferred platform:**
   - **Vercel:** `vercel deploy`
   - **Netlify Functions:** Copy to `netlify/functions/`
   - **AWS Lambda:** Upload as Lambda function

3. **Update your website** with the endpoint URL in `script.js`

---

## Step 6: Test It!

1. **Visit your website**
2. **Submit a suggestion** - no authentication required!
3. **Check your email** - suggestion arrives instantly
4. **Users never see Google login** - completely seamless!

### Benefits of This Approach:

| Feature | EmailJS | **Gmail API + OAuth** |
|---------|---------|----------------------|
| **User Experience** | Simple | **No authentication needed** |
| **Email Limits** | 200/month | **1 billion quota units/day** |
| **Setup Complexity** | Medium | **One-time OAuth setup** |
| **Permissions** | Third-party | **Your Gmail, send-only** |
| **Reliability** | Good | **Google's Gmail infrastructure** |
| **Cost** | Free tier | **Completely free** |
| **Token Management** | API keys | **Auto-refresh, never expires** |

---

## How It Works After Setup

1. **User submits suggestion** → Frontend sends to your backend
2. **Backend uses refresh token** → Auto-refreshes access tokens  
3. **Gmail API sends email** → Using your authorized Gmail account
4. **User sees "Thank you"** → Completely seamless experience

**No more OAuth flows, no user authentication, emails forever!** 🎉

This is the **perfect solution** - simpler than service accounts, unlimited emails, and zero user friction!
