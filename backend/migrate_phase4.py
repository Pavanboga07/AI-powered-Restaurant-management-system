"""
Phase 4: Enhanced User Features - Database Migration
Add tables for customer profiles, loyalty system, and recurring reservations
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./restaurant.db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def run_migration():
    """Run Phase 4 database migration"""
    db = SessionLocal()
    
    try:
        print("🚀 Starting Phase 4 Migration...")
        
        # 1. Customer Profiles Table
        print("\n📋 Creating customer_profiles table...")
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS customer_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER UNIQUE NOT NULL,
                date_of_birth DATE,
                phone_verified INTEGER DEFAULT 0,
                email_verified INTEGER DEFAULT 0,
                dietary_preferences TEXT,
                allergies TEXT,
                favorite_items TEXT,
                preferred_payment_method VARCHAR(20),
                default_address_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (default_address_id) REFERENCES customer_addresses(id)
            )
        """))
        
        # 2. Customer Addresses Table
        print("📋 Creating customer_addresses table...")
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS customer_addresses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER NOT NULL,
                label VARCHAR(50),
                address_line1 VARCHAR(255) NOT NULL,
                address_line2 VARCHAR(255),
                city VARCHAR(100) NOT NULL,
                state VARCHAR(100),
                postal_code VARCHAR(20),
                country VARCHAR(100) DEFAULT 'India',
                delivery_instructions TEXT,
                is_default INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customer_profiles(id)
            )
        """))
        
        # 3. Loyalty Accounts Table
        print("📋 Creating loyalty_accounts table...")
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS loyalty_accounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER UNIQUE NOT NULL,
                points_balance INTEGER DEFAULT 0,
                lifetime_points INTEGER DEFAULT 0,
                tier_level VARCHAR(20) DEFAULT 'bronze',
                tier_valid_until TIMESTAMP,
                total_spent REAL DEFAULT 0.0,
                total_orders INTEGER DEFAULT 0,
                referral_code VARCHAR(20) UNIQUE,
                referred_by INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customer_profiles(id),
                FOREIGN KEY (referred_by) REFERENCES loyalty_accounts(id)
            )
        """))
        
        # 4. Loyalty Transactions Table
        print("📋 Creating loyalty_transactions table...")
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS loyalty_transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                loyalty_account_id INTEGER NOT NULL,
                transaction_type VARCHAR(20),
                points_change INTEGER NOT NULL,
                reference_type VARCHAR(20),
                reference_id INTEGER,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (loyalty_account_id) REFERENCES loyalty_accounts(id)
            )
        """))
        
        # 5. Recurring Reservations Table
        print("📋 Creating recurring_reservations table...")
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS recurring_reservations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                pattern_type VARCHAR(20) NOT NULL,
                day_of_week INTEGER,
                time TIME NOT NULL,
                guests INTEGER NOT NULL,
                special_requests TEXT,
                is_active INTEGER DEFAULT 1,
                start_date DATE NOT NULL,
                end_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """))
        
        # 6. Add new columns to existing tables
        print("\n🔧 Adding new columns to existing tables...")
        
        # Add columns to reviews table
        try:
            db.execute(text("ALTER TABLE reviews ADD COLUMN order_id INTEGER"))
            print("✅ Added order_id to reviews")
        except Exception as e:
            print(f"⚠️  order_id column may already exist: {str(e)[:50]}")
        
        try:
            db.execute(text("ALTER TABLE reviews ADD COLUMN photos TEXT"))
            print("✅ Added photos to reviews")
        except Exception as e:
            print(f"⚠️  photos column may already exist: {str(e)[:50]}")
        
        try:
            db.execute(text("ALTER TABLE reviews ADD COLUMN is_verified_purchase INTEGER DEFAULT 0"))
            print("✅ Added is_verified_purchase to reviews")
        except Exception as e:
            print(f"⚠️  is_verified_purchase column may already exist: {str(e)[:50]}")
        
        # Add column to reservations table
        try:
            db.execute(text("ALTER TABLE reservations ADD COLUMN recurring_reservation_id INTEGER"))
            print("✅ Added recurring_reservation_id to reservations")
        except Exception as e:
            print(f"⚠️  recurring_reservation_id column may already exist: {str(e)[:50]}")
        
        db.commit()
        print("\n✅ Phase 4 Migration completed successfully!")
        print("\n📊 New Tables Created:")
        print("   - customer_profiles")
        print("   - customer_addresses")
        print("   - loyalty_accounts")
        print("   - loyalty_transactions")
        print("   - recurring_reservations")
        print("\n🔧 Enhanced Existing Tables:")
        print("   - reviews (added order_id, photos, is_verified_purchase)")
        print("   - reservations (added recurring_reservation_id)")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Migration failed: {str(e)}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    run_migration()
