"""
Database Migration Script
Adds new tables for Chef Dashboard Phase 1:
- customers
- favorites  
- messages
- shift_handovers
"""
import sys
from pathlib import Path

# Add backend to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.database import engine, Base
from app.models import (
    User, MenuItem, Order, OrderItem, Table, Reservation, Bill, Coupon, Review, Shift,
    Customer, Favorite, Message, ShiftHandover, ServiceRequest  # New models
)


def create_tables():
    """Create all tables defined in models"""
    print("Creating database tables...")
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ Successfully created all tables!")
        
        # Print created tables
        print("\nTables in database:")
        print("- users")
        print("- menu_items")
        print("- orders")
        print("- order_items")
        print("- tables")
        print("- reservations")
        print("- bills")
        print("- coupons")
        print("- reviews")
        print("- shifts")
        print("- customers (NEW)")
        print("- favorites (NEW)")
        print("- messages (NEW)")
        print("- shift_handovers (NEW)")
        print("- service_requests (NEW - Phase 2)")
        
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        sys.exit(1)


def drop_tables():
    """Drop all tables - USE WITH CAUTION!"""
    confirm = input("⚠️  WARNING: This will DROP ALL TABLES. Type 'YES' to confirm: ")
    if confirm == "YES":
        print("Dropping all tables...")
        Base.metadata.drop_all(bind=engine)
        print("✅ All tables dropped!")
    else:
        print("Aborted.")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Database migration tool')
    parser.add_argument(
        'action',
        choices=['create', 'drop', 'recreate'],
        help='Action to perform: create (add missing tables), drop (remove all), recreate (drop then create)'
    )
    
    args = parser.parse_args()
    
    if args.action == 'create':
        create_tables()
    elif args.action == 'drop':
        drop_tables()
    elif args.action == 'recreate':
        drop_tables()
        create_tables()
