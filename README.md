# NYC Desi Dance Scheduler

This is a community-driven dance class discovery site built to make it easier to find dance classes in one place, without chasing flyers across Instagram.

👉 **Live site:** https://nycdanceschedule.netlify.app/

## 🛠️ Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Website Hosting:** Netlify/Cloudflare Pages
- **Email Function:** Vercel Serverless Functions
- **Email Service:** Gmail API with OAuth 2.0
- **Database:** Local Storage (with optional Firebase integration)

## 🔗 Project Links

- **Website:** https://nycdanceschedule.netlify.app/
- **Gmail Function:** https://gmail-function.vercel.app/api/send-email
- **Future Enhancements:** https://docs.google.com/document/d/1GdUbWA3djJzRnSZrwildGV30sO5lCvPLlkHVyKiRXCo/edit?tab=t.0

## 🚀 Quick Start

1. **For Local Development:**
   ```bash
   git clone [your-repo-url]
   open index.html  # or serve with any local server
   ```

2. **For Email Functionality:**
   - The suggestion form is already connected to the deployed Gmail function
   - No additional setup needed for basic usage!

## 🔧 Advanced Setup

### Gmail API Integration (For Developers)

The email functionality uses Gmail API with OAuth 2.0 for secure, reliable email sending.

**Architecture:**
- **Website:** Deployed on Netlify/Cloudflare (static files)
- **Email Function:** Deployed on Vercel (serverless function)
- **Gmail API:** Handles email sending with proper authentication

**Setup Steps:**
1. Follow `GMAIL_API_SETUP.md` for detailed Gmail API configuration
2. Use `oauth-setup.js` to generate OAuth tokens
3. Deploy the function to Vercel with your credentials

**Files:**
- `oauth-setup.js` - Helper script for OAuth token generation
- `GMAIL_API_SETUP.md` - Complete setup instructions

## ✨ Features

- 📅 **Interactive Calendar** - Click any day to add a class
- 🎭 **Dance Style Colors** - Each dance style gets a unique color
- 👩‍🏫 **Teacher Filtering** - Filter classes by instructor
- 📱 **Mobile Responsive** - Works great on all devices
- 💾 **Local Storage** - Saves your schedule locally
- 💌 **Suggestion Form** - Send feedback via secure Gmail API
- 🎨 **Custom Styles** - Add your own dance styles with auto-assigned colors
- 🔒 **Secure Email** - Backend endpoint keeps credentials safe

## 📧 Email Architecture

**Why This Approach?**
- ✅ **No API keys in frontend** - Keeps credentials secure
- ✅ **High email limits** - Gmail API provides generous quotas
- ✅ **No user authentication** - Users don't need Gmail accounts
- ✅ **Reliable delivery** - Direct Gmail API integration
- ✅ **Serverless scaling** - Vercel handles traffic spikes

**How It Works:**
1. User submits suggestion on website
2. Frontend calls Vercel function endpoint
3. Vercel function uses Gmail API to send email
4. Emails arrive instantly in your inbox

## 🏗️ Project Structure

```
├── index.html              # Main website
├── styles.css             # Styling
├── script.js              # Frontend logic
├── oauth-setup.js         # OAuth token generator
├── GMAIL_API_SETUP.md     # Setup instructions
├── package.json           # Dependencies
└── gmail-function/        # Separate email function
    ├── api/
    │   └── send-email.js  # Vercel serverless function
    └── package.json       # Function dependencies
```

## 🚀 Deployment

**Website (Netlify/Cloudflare):**
- Deploy `index.html`, `styles.css`, `script.js`
- Automatic deployments from Git

**Email Function (Vercel):**
- Deploy the `gmail-function/` directory separately
- Environment: Production function at dedicated URL

## 🤝 Contributing

This is a community project! Feel free to:
- Report bugs or suggest features
- Submit pull requests  
- Use the suggestion form in the app

## 💡 Future Ideas

- Firebase integration for cloud sync
- User accounts and personal schedules
- Class reminders and notifications
- Integration with dance studio websites

Built with love for the dance community ❤️
