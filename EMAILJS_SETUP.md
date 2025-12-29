# EmailJS Setup Guide for Dance Schedule Notifications

This guide will help you set up EmailJS to receive email notifications when classes are added, edited, or deleted from your dance schedule.

## Step 1: Create EmailJS Account

1. Go to [EmailJS.com](https://www.emailjs.com/)
2. Click "Sign Up" and create a free account
3. Verify your email address

## Step 2: Connect Email Service

1. **In EmailJS Dashboard**, click "Email Services"
2. **Click "Add New Service"**
3. **Choose your email provider** (Gmail is recommended)
4. **For Gmail:**
   - Select "Gmail"
   - Click "Connect Account" 
   - Sign in with your Gmail account
   - Allow EmailJS permissions
5. **Note your Service ID** (something like `service_abc123`)

## Step 3: Create Email Template

1. **Click "Email Templates"**
2. **Click "Create New Template"**
3. **Set up the template:**
   ```
   Subject: {{subject}}
   
   To: naharupal@gmail.com
   From: {{from_name}}
   
   Body:
   {{message}}
   ```
4. **Note your Template ID** (something like `template_xyz789`)

## Step 4: Get Your Public Key

1. **Click "Account" in the sidebar**
2. **Copy your Public Key** (something like `user_abcdef123456`)

## Step 5: Update Your Code

Replace the placeholder values in `script.js`:

```javascript
// Find this in setupEmailNotifications():
emailjs.init({
    publicKey: 'YOUR_EMAILJS_PUBLIC_KEY', // Replace with your actual public key
});

// Find this in sendEmailNotification():
await emailjs.send(
    'YOUR_SERVICE_ID', // Replace with your service ID
    'YOUR_TEMPLATE_ID', // Replace with your template ID
    {
        to_email: 'naharupal@gmail.com',
        subject: emailSubject,
        message: emailMessage,
        from_name: 'NYC Desi Dance Schedule'
    }
);
```

**Replace:**
- `YOUR_EMAILJS_PUBLIC_KEY` with your actual public key
- `YOUR_SERVICE_ID` with your service ID  
- `YOUR_TEMPLATE_ID` with your template ID

## Step 6: Test the Setup

1. **Save the changes** to `script.js`
2. **Open your dance schedule app** in the browser
3. **Add a test class** - you should receive an email notification!
4. **Check the browser console** for any error messages

## Example Email You'll Receive

```
Subject: New Dance Class Added: Bollywood Fusion

A new dance class has been added to the schedule:

Class: Bollywood Fusion
Teacher: Rupal Nahar
Date: Wednesday, January 1, 2025
Time: 2:00 PM
Duration: 120 minutes
Style: Bollywood Fusion
Level: Intermediate
Location: Ripley Grier, Studio B
Registration: Venmo @rupalnahar $25

This class has been added to the NYC Desi Dance Workshop Schedule.
```

## Troubleshooting

**No emails arriving?**
- Check your spam/junk folder
- Verify all IDs are correct in the code
- Check browser console for error messages
- Make sure EmailJS service is connected properly

**Error messages in console?**
- Double-check your Public Key, Service ID, and Template ID
- Ensure your email template matches the expected format
- Check that your Gmail account is properly connected

## Free Tier Limits

EmailJS free tier includes:
- 200 emails per month
- Perfect for personal dance schedule notifications!

## Security Note

Your EmailJS credentials are safe to use in client-side code - they're designed for this purpose and have built-in security measures.

---

Once set up, you'll automatically receive emails whenever anyone:
- ✅ **Adds a new class**
- ✅ **Edits an existing class** 
- ✅ **Cancels/deletes a class**

Perfect for staying on top of your dance schedule changes! 🕺💃
