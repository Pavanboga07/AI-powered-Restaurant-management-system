from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio
from .database import engine, Base
from .routers import auth, menu, orders, tables, reservations, billing, coupons, reviews, analytics, qr, shifts, chef, staff, customer, inventory, customer_profile, loyalty, recurring_reservations, kds, analytics_ml
# from .routers import notifications  # Phase 3 - Email/SMS Skipped
from .websocket import socket_app, sio

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Restaurant Management System API",
    description="A comprehensive restaurant management system with authentication, menu, orders, tables, and reservations",
    version="1.0.0"
)

# CORS Configuration
origins = [
    "http://localhost:5173",  # Vite default port
    "http://localhost:3000",  # React default port
    "http://localhost:8080",
    "http://192.168.1.2:5173",  # Network access for mobile devices
    "*",  # Allow all origins for development
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(menu.router)
app.include_router(orders.router)
app.include_router(tables.router)
app.include_router(reservations.router)
app.include_router(billing.router)
app.include_router(coupons.router)
app.include_router(reviews.router)
app.include_router(analytics.router)
app.include_router(qr.router)
app.include_router(shifts.router)
app.include_router(chef.router)
app.include_router(staff.router)
app.include_router(customer.router)
app.include_router(inventory.router)
# app.include_router(notifications.router)  # Phase 3 - Email/SMS Skipped
# Phase 4: Enhanced User Features
app.include_router(customer_profile.router)
app.include_router(loyalty.router)
app.include_router(recurring_reservations.router)

# Phase 5: Kitchen Display System
app.include_router(kds.router)

# Phase 6: AI/ML Analytics
app.include_router(analytics_ml.router)

@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Restaurant Management System API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

# Wrap FastAPI app with Socket.IO
# Socket.IO will handle /socket.io paths, FastAPI handles everything else
combined_asgi_app = socketio.ASGIApp(sio, other_asgi_app=app, socketio_path='socket.io')

# Export combined app for uvicorn
app = combined_asgi_app
