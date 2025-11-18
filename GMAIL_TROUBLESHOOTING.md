# 🔧 Gmail Authentication Troubleshooting

## Error: 535 Username and Password not accepted

This error means Gmail is rejecting the credentials. Let's fix it!

---

## ✅ Step-by-Step Fix

### Step 1: Verify 2-Factor Authentication is ON

1. Go to: https://myaccount.google.com/security
2. Scroll to "How you sign in to Google"
3. Check if "2-Step Verification" shows **ON**
4. If it says **OFF**, click on it and enable it

**Important:** App Passwords ONLY work if 2FA is enabled!

---

### Step 2: Generate a NEW App Password

1. **Go to App Passwords page:**
   - Direct link: https://myaccount.google.com/apppasswords
   - OR: Google Account → Security → 2-Step Verification → App passwords

2. **If you don't see "App passwords" option:**
   - Make sure 2FA is enabled (Step 1)
   - Try accessing the direct link above
   - Sign out and sign back in to Google Account

3. **Create the App Password:**
   - Click "Select app" → Choose **"Mail"**
   - Click "Select device" → Choose **"Other (Custom name)"**
   - Type: **"Restaurant Management System"**
   - Click **"Generate"**

4. **Copy the 16-character password:**
   - It will show like: `abcd efgh ijkl mnop`
   - **Copy it immediately** (you won't see it again)
   - Remove spaces: `abcdefghijklmnop`

---

### Step 3: Update .env File

Replace the MAIL_PASSWORD in your `.env` file with the NEW app password:

```
MAIL_PASSWORD=your-new-16-char-password-here
```

**DO NOT use:**
- ❌ Your regular Gmail password
- ❌ Old/expired app passwords
- ❌ Passwords with spaces

---

## 🔍 Common Issues & Solutions

### Issue 1: "I don't see App Passwords option"
**Solution:**
- Enable 2FA first (it's required)
- Wait 5-10 minutes after enabling 2FA
- Clear browser cache or try incognito mode
- Try this direct link: https://myaccount.google.com/apppasswords

### Issue 2: "App password was working before"
**Solution:**
- App passwords can expire or be revoked
- Generate a fresh new one
- Delete old app passwords from Google Account

### Issue 3: "2FA is enabled but still can't access"
**Solution:**
- Make sure you're signed into the correct Google account
- Some workspace/organization accounts have restrictions
- Try using a personal Gmail account instead

### Issue 4: "Less secure app access"
**Solution:**
- Google removed this option in May 2022
- Must use App Passwords now (with 2FA)
- No workaround - this is required by Google

---

## 🧪 Test After Updating

After you get and set the new app password:

1. Save the `.env` file
2. Run: `python test_email_system.py`
3. Should see: "✅ Email configured"
4. Press Enter to send test emails

---

## 📸 Visual Guide

### Where to find App Passwords:
```
Google Account
  └── Security
       └── 2-Step Verification (must be ON)
            └── App passwords (at the bottom)
                 └── Select app: Mail
                 └── Select device: Other
                 └── Click Generate
```

### The app password format:
```
Shown as:  abcd efgh ijkl mnop
Use as:    abcdefghijklmnop  (no spaces!)
Length:    16 characters
```

---

## 💡 Alternative: Use Gmail OAuth2 (Advanced)

If app passwords don't work (corporate accounts), consider:
- Using SendGrid (100 emails/day free)
- Using AWS SES (very cheap)
- Using Mailgun (5,000 emails/month free)

See GMAIL_SETUP_GUIDE.md for details.

---

## ✅ Verification Checklist

Before trying again, verify:

- [ ] 2FA is enabled on your Gmail account
- [ ] Generated a NEW app password (not using old one)
- [ ] Copied the 16-character password correctly
- [ ] Removed all spaces from the password
- [ ] Updated `.env` file with new password
- [ ] Saved the `.env` file
- [ ] Using the correct Gmail address

---

## 🆘 Still Not Working?

Try this test to isolate the issue:

```powershell
python -c "import smtplib; server = smtplib.SMTP('smtp.gmail.com', 587); server.starttls(); server.login('pavanboga07@gmail.com', 'YOUR_APP_PASSWORD'); print('✅ Login successful!'); server.quit()"
```

Replace `YOUR_APP_PASSWORD` with your actual app password.

If this works → Issue is in the application code
If this fails → Issue is with Gmail credentials

---

**Next Step:** Generate a fresh app password and update the `.env` file, then try again!
