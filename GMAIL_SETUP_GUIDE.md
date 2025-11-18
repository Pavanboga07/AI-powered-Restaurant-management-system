# 📧 Gmail Setup Guide for Email System

## 🎯 Overview
This guide will help you set up Gmail to send emails from your restaurant application.

## ⚠️ Important Notes
- **DO NOT use your regular Gmail password** - it won't work!
- You need to create an **App Password** - a special 16-character password
- App Passwords require **2-Factor Authentication (2FA)** to be enabled

---

## 📋 Step-by-Step Setup

### Step 1: Enable 2-Factor Authentication (2FA)

1. **Go to Google Account Security**
   - Visit: https://myaccount.google.com/security
   - Or: Google Account → Security tab

2. **Enable 2-Step Verification**
   - Scroll to "How you sign in to Google"
   - Click on "2-Step Verification"
   - Click "Get Started"
   - Follow the prompts to set up (usually requires phone number)

3. **Verify it's enabled**
   - You should see "2-Step Verification: ON"

---

### Step 2: Generate App Password

1. **Go to App Passwords page**
   - Visit: https://myaccount.google.com/apppasswords
   - Or: Google Account → Security → 2-Step Verification → App passwords

2. **Create new App Password**
   - Click "Select app" dropdown → Choose "Mail"
   - Click "Select device" dropdown → Choose "Windows Computer"
   - Click "Generate"

3. **Copy the 16-character password**
   - You'll see something like: `abcd efgh ijkl mnop`
   - **IMPORTANT:** Copy this password immediately!
   - You won't be able to see it again
   - It will look like: `abcdefghijklmnop` (remove spaces)

---

### Step 3: Update .env File

1. **Open file**: `backend/.env`

2. **Update these values**:
   ```env
   MAIL_USERNAME=your-email@gmail.com
   MAIL_PASSWORD=abcdefghijklmnop
   MAIL_FROM=your-email@gmail.com
   MAIL_PORT=587
   MAIL_SERVER=smtp.gmail.com
   ```

3. **Example** (with real values):
   ```env
   MAIL_USERNAME=restaurant.zbc@gmail.com
   MAIL_PASSWORD=qwer1234asdf5678
   MAIL_FROM=restaurant.zbc@gmail.com
   MAIL_PORT=587
   MAIL_SERVER=smtp.gmail.com
   ```

4. **Save the file**

---

### Step 4: Test the Email System

1. **Update test recipient email**
   - Open: `backend/test_email_system.py`
   - Replace all `test@example.com` with YOUR email
   - Use the same Gmail or any other email you can check

2. **Run the test script**
   ```powershell
   cd backend
   python test_email_system.py
   ```

3. **Check your inbox**
   - You should receive 6 test emails
   - Check spam folder if not in inbox
   - First few emails might go to spam (normal)

---

## ✅ Verification Checklist

After running tests, verify:

- [ ] Emails received in inbox/spam
- [ ] All 6 email types sent successfully
- [ ] Formatting looks professional
- [ ] Images and colors display correctly
- [ ] Links/buttons work properly
- [ ] Mobile responsive (check on phone)
- [ ] Order details show correctly
- [ ] Promotional content renders well

---

## 🐛 Troubleshooting

### Error: "535 Authentication Failed"
**Problem:** Wrong credentials or not using app password

**Solutions:**
- Make sure you're using App Password, not regular password
- Check 2FA is enabled
- Regenerate app password if needed
- Remove any spaces from app password

---

### Error: "Connection timeout"
**Problem:** Network/firewall blocking SMTP

**Solutions:**
- Check firewall settings
- Disable antivirus temporarily to test
- Try different network (mobile hotspot)
- Verify port 587 is not blocked

---

### Emails going to spam
**Problem:** New sender, no email reputation yet

**Solutions:**
- **This is normal!** First few emails often go to spam
- Mark as "Not Spam" in Gmail
- After 10-20 emails, should improve
- Consider using professional email service (SendGrid, AWS SES) for production

---

### Error: "Template not found"
**Problem:** Email template files not found

**Solutions:**
- Check `backend/app/templates/email/` folder exists
- Verify all 7 template files are present
- Check file paths in email_service.py

---

### Emails not rendering properly
**Problem:** HTML/CSS issues in email client

**Solutions:**
- Email clients have limited CSS support
- Templates already use inline styles (should work)
- Test in multiple email clients (Gmail, Outlook, Yahoo)
- Use online tools like Litmus or Email on Acid

---

## 🔒 Security Best Practices

### ✅ DO:
- Use App Passwords (not regular password)
- Keep .env file private (never commit to Git)
- Enable 2FA on Gmail account
- Use environment variables for credentials
- Rotate app passwords periodically

### ❌ DON'T:
- Don't share app passwords
- Don't commit .env to version control
- Don't use regular Gmail password
- Don't hardcode credentials in code
- Don't disable 2FA

---

## 🚀 Production Recommendations

For production use, consider:

### 1. **Professional Email Service**
   - **SendGrid** (free tier: 100 emails/day)
   - **AWS SES** (very cheap, need AWS account)
   - **Mailgun** (5,000 emails/month free)
   
   **Why?**
   - Better deliverability
   - Email analytics
   - No Gmail sending limits
   - Professional reputation

### 2. **Gmail Sending Limits**
   - **Free Gmail**: 500 emails/day
   - **Google Workspace**: 2,000 emails/day
   - Exceeding = account suspended temporarily

### 3. **Update SMTP Settings** (for other services)
   
   **SendGrid:**
   ```env
   MAIL_USERNAME=apikey
   MAIL_PASSWORD=your-sendgrid-api-key
   MAIL_FROM=verified-sender@yourdomain.com
   MAIL_PORT=587
   MAIL_SERVER=smtp.sendgrid.net
   ```
   
   **AWS SES:**
   ```env
   MAIL_USERNAME=your-smtp-username
   MAIL_PASSWORD=your-smtp-password
   MAIL_FROM=verified@yourdomain.com
   MAIL_PORT=587
   MAIL_SERVER=email-smtp.region.amazonaws.com
   ```

---

## 📊 Testing Results

After running `test_email_system.py`, you should see:

```
==================================================
🧪 EMAIL SYSTEM TEST SUITE
==================================================

✅ Email configured: restaurant.zbc@gmail.com
📧 Test emails will be sent to: your-email@gmail.com

📧 Testing Welcome Email...
--------------------------------------------------
✅ Welcome email sent successfully!

📧 Testing Order Confirmation Email...
--------------------------------------------------
✅ Order confirmation email sent successfully!

📧 Testing Order Status Update Email...
--------------------------------------------------
✅ Status update email sent successfully!

📧 Testing Promotional Email...
--------------------------------------------------
✅ Promotional email sent successfully!

📧 Testing Low Stock Alert Email...
--------------------------------------------------
✅ Low stock alert sent successfully!

📧 Testing Reservation Confirmation Email...
--------------------------------------------------
✅ Reservation confirmation sent successfully!

==================================================
📊 TEST SUMMARY
==================================================

✅ Successful: 6/6
❌ Failed: 0/6

🎉 All tests passed! Email system is working perfectly!

📧 Check your inbox (and spam folder) for test emails
```

---

## 🎯 Next Steps

Once email testing is successful:

1. **Test via API endpoints**
   - Start the backend server
   - Create a test order → Should send confirmation email
   - Update order status → Should send status update email

2. **Test via UI (Campaign Manager)**
   - Navigate to Manager → Campaigns
   - Create promotional email campaign
   - Send to yourself
   - Verify delivery and formatting

3. **Optional: Setup SMS with Twilio**
   - Follow similar process for SMS notifications
   - Requires Twilio account (free trial available)

4. **Move to Phase 4**
   - Enhanced user features
   - Customer profiles
   - Loyalty programs
   - Advanced analytics

---

## 📞 Need Help?

### Common Questions

**Q: Can I use Yahoo/Outlook instead of Gmail?**
A: Yes! Just update SMTP settings:
- Yahoo: smtp.mail.yahoo.com:587
- Outlook: smtp-mail.outlook.com:587
- Also need app password for these

**Q: How many emails can I send per day?**
A: Gmail free = 500/day, Google Workspace = 2,000/day

**Q: Will customers see my Gmail address?**
A: Yes, in "From" field. For professional use, get custom domain email

**Q: Can I customize email templates?**
A: Yes! Edit HTML files in `backend/app/templates/email/`

**Q: How to add company logo?**
A: Upload logo online, add URL to template's image_url parameter

---

## ✅ Quick Start (TL;DR)

1. Enable 2FA: https://myaccount.google.com/security
2. Get App Password: https://myaccount.google.com/apppasswords
3. Update `backend/.env` with email and 16-char password
4. Run: `cd backend && python test_email_system.py`
5. Check your inbox/spam for 6 test emails
6. Done! 🎉

---

**Last Updated:** January 2025  
**System Version:** Phase 3 Complete  
**Support:** Check documentation or create GitHub issue
