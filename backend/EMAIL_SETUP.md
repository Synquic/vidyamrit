# Email Configuration Guide - Nodemailer with Gmail

This guide will help you configure Nodemailer to send emails using Gmail SMTP.

## Prerequisites

- A Gmail account
- 2-Step Verification enabled on your Gmail account

## Step 1: Enable 2-Step Verification

1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification**
3. Follow the prompts to enable 2-Step Verification if not already enabled

## Step 2: Generate App Password

1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification**
3. Scroll down and click on **App passwords** (you may need to search for it)
4. Select **Mail** as the app type
5. Select **Other (Custom name)** as the device type
6. Enter a name like "Vidyamrit Backend" and click **Generate**
7. **Copy the 16-character password** that appears (you won't see it again!)

## Step 3: Configure Environment Variables

Add the following environment variables to your `.env` file in the `backend` directory:

```env
# Gmail Configuration for Nodemailer
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-16-character-app-password
```

**Important Notes:**
- `EMAIL_USER` should be your full Gmail address (e.g., `yourname@gmail.com`)
- `EMAIL_APP_PASSWORD` should be the 16-character app password generated in Step 2
- **DO NOT** use your regular Gmail password - it won't work!
- **DO NOT** commit your `.env` file to version control

## Step 4: Verify Configuration

1. Make sure your `.env` file is in the `backend` directory
2. Restart your backend server
3. Try creating a volunteer account and sending credentials via email
4. Check the server logs for any email-related errors

## Troubleshooting

### Error: "EAUTH" (Authentication Failed)
- Verify that `EMAIL_USER` is your full Gmail address
- Verify that `EMAIL_APP_PASSWORD` is the correct 16-character app password (no spaces)
- Make sure 2-Step Verification is enabled on your Gmail account
- Try generating a new app password

### Error: "ECONNECTION" (Connection Failed)
- Check your internet connection
- Verify Gmail SMTP servers are accessible
- Check firewall settings

### Email Not Received
- Check spam/junk folder
- Verify recipient email addresses are correct
- Check server logs for detailed error messages
- Verify the email was actually sent (check logs for "Email sent successfully")

## Security Best Practices

1. **Never commit `.env` file** to version control
2. **Use App Passwords** instead of your regular Gmail password
3. **Rotate App Passwords** periodically for security
4. **Restrict access** to the `.env` file (file permissions)
5. **Use environment-specific configurations** for development/production

## Production Considerations

For production environments, consider:
- Using a dedicated email service (SendGrid, AWS SES, etc.)
- Setting up email templates
- Implementing email queuing for high volume
- Adding email delivery tracking
- Setting up bounce/complaint handling

## Testing Email Configuration

You can test the email configuration by:
1. Creating a volunteer account
2. Clicking "Send by Email" in the credentials dialog
3. Entering a test email address
4. Checking if the email is received

## Support

If you encounter issues:
1. Check the server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test with a simple email first
4. Verify Gmail account settings and app password

