# 🚀 Phase 3 - Quick Start Guide

## ⚡ Get Started in 5 Minutes

### **1. Install Dependencies**
```bash
cd backend
pip install fastapi-mail twilio jinja2
```

### **2. Configure Gmail (Easiest Option)**

1. **Enable 2FA:** https://myaccount.google.com/security
2. **Create App Password:** https://myaccount.google.com/apppasswords
   - Select: Mail + Other
   - Name: "Restaurant System"
   - Copy 16-character password

3. **Update `.env`:**
```env
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=xxxx xxxx xxxx xxxx
MAIL_FROM=your-email@gmail.com
MAIL_PORT=587
MAIL_SERVER=smtp.gmail.com
```

### **3. Test It Works**
```bash
# Start backend
cd backend
uvicorn app.main:app --reload

# In another terminal, start frontend
cd frontend
npm run dev
```

**Test endpoints:**
- Register new user → Check email for welcome message
- Create order → Check email for confirmation
- Navigate to `/manager/campaigns` → Send test campaign

---

## 📧 Send Your First Email Campaign

1. Go to: http://localhost:5173/manager/campaigns
2. Fill in:
   - Subject: "Weekend Special Offer"
   - Title: "🎉 50% Off This Weekend!"
   - Add offer details
3. Select recipients (All/Customers/Specific)
4. Click "Send Email Campaign"
5. Check your inbox!

---

## 📱 SMS Setup (Optional)

1. **Sign up:** https://www.twilio.com/try-twilio
2. **Get credentials from dashboard**
3. **Update `.env`:**
```env
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

---

## ✅ What Happens Automatically

- ✅ **User registers** → Welcome email sent
- ✅ **Order created** → Confirmation email + SMS
- ✅ **Order status changes** → Update email + SMS
- ✅ **Inventory low** → Manager receives alert email

---

## 🎯 API Endpoints (for testing)

```bash
# Send promotional email
POST http://localhost:8000/api/notifications/email/promotional
Authorization: Bearer <manager-token>
Content-Type: application/json

{
  "subject": "Special Offer",
  "title": "Weekend Sale",
  "subtitle": "50% Off Everything",
  "description": "Limited time offer",
  "offer_details": ["50% off pizzas", "Free delivery"],
  "cta_text": "Order Now",
  "recipient_filter": "all"
}

# Send SMS campaign
POST http://localhost:8000/api/notifications/sms/promotional
Authorization: Bearer <manager-token>

{
  "message": "Weekend special: 50% off! Order now.",
  "recipient_filter": "customers"
}

# Get customer list
GET http://localhost:8000/api/notifications/customers
Authorization: Bearer <manager-token>
```

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Emails not sending | Use App Password, not regular password |
| 535 Authentication failed | Enable 2FA first, then create App Password |
| Email in spam | Expected for first few emails, improves over time |
| SMS not working | Check Twilio credits and phone number format |
| Campaign UI not loading | Ensure user is Manager/Admin role |

---

## 📚 Available Templates

1. **order_confirmation.html** - Order receipt with items
2. **order_status_update.html** - Status change notifications
3. **welcome.html** - New user onboarding
4. **reservation_confirmation.html** - Table bookings
5. **promotional.html** - Marketing campaigns
6. **low_stock_alert.html** - Inventory alerts
7. **password_reset.html** - Password recovery

---

## 🎨 Customize Email Templates

Templates location: `backend/app/templates/email/`

Edit any `.html` file to customize:
- Colors: Change hex codes
- Logo: Update image URLs
- Content: Modify text and layout
- Styling: Inline CSS (for email compatibility)

---

## 💡 Pro Tips

1. **Gmail Daily Limit:** 500 emails/day (upgrade to G Suite for 2000/day)
2. **Use SendGrid/AWS SES for production** (higher limits)
3. **Test with your own email first** before sending to customers
4. **Check spam folder** initially
5. **Add unsubscribe links** for promotional emails (GDPR compliance)

---

## 🎓 Learn More

- **FastAPI-Mail Docs:** https://sabuhish.github.io/fastapi-mail/
- **Twilio Docs:** https://www.twilio.com/docs/sms
- **Email Best Practices:** https://www.emailonacid.com/blog/
- **Jinja2 Templates:** https://jinja.palletsprojects.com/

---

**That's it! You're ready to send emails and SMS! 🚀**

For detailed documentation, see: `PHASE_3_SETUP_GUIDE.md`
