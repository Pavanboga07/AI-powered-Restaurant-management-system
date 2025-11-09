# Restaurant Management System - Quick Start Guide

## 🚀 Quick Start

### Step 1: Backend Setup

1. Open a terminal in the `backend` folder
2. Create and activate virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\activate
   ```

3. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

4. Setup PostgreSQL database (install PostgreSQL first if needed):
   ```sql
   CREATE DATABASE restaurant_db;
   ```

5. Update the `.env` file with your database password

6. Run the backend:
   ```powershell
   uvicorn app.main:app --reload
   ```

### Step 2: Frontend Setup

1. Open a NEW terminal in the `frontend` folder
2. Install dependencies:
   ```powershell
   npm install
   ```

3. Run the frontend:
   ```powershell
   npm run dev
   ```

### Step 3: Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Step 4: Create Your First User

1. Go to http://localhost:5173/register
2. Create an account with any role (admin recommended for testing)
3. Login and explore the dashboard!

## 📝 Default Test Credentials (After Registration)

Create a user with these details for testing:
- Username: `admin`
- Email: `admin@restaurant.com`
- Password: `admin123`
- Role: `admin`

## 🎯 Next Steps

1. Explore the API documentation at http://localhost:8000/docs
2. Test the authentication flow
3. Create menu items, tables, and reservations
4. Customize the UI colors in `frontend/tailwind.config.js`
5. Add more features as needed!

## 🐛 Troubleshooting

### Backend won't start?
- Make sure PostgreSQL is running
- Check database credentials in `.env`
- Ensure virtual environment is activated

### Frontend won't start?
- Delete `node_modules` and run `npm install` again
- Clear npm cache: `npm cache clean --force`

### Database connection error?
- Verify PostgreSQL service is running
- Check DATABASE_URL in `.env`
- Ensure database `restaurant_db` exists

## 📚 Key Files to Customize

- **Backend**:
  - `backend/app/models.py` - Add/modify database models
  - `backend/app/routers/` - Add new API endpoints
  - `backend/.env` - Configuration

- **Frontend**:
  - `frontend/src/components/` - Add new UI components
  - `frontend/tailwind.config.js` - Customize theme colors
  - `frontend/src/services/api.js` - Add API calls

Enjoy building your restaurant management system! 🍽️
