"""
Seed script to populate the database with sample menu items
Run this with: python seed_menu.py
"""
import sys
from pathlib import Path

# Add the backend directory to the path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.database import SessionLocal, engine
from app import models

# Sample menu items
SAMPLE_MENU_ITEMS = [
    {
        "name": "Margherita Pizza",
        "description": "Classic pizza with tomato sauce, mozzarella, and fresh basil",
        "price": 12.99,
        "category": "Main Course",
        "is_available": True,
        "diet_type": "vegetarian"
    },
    {
        "name": "Caesar Salad",
        "description": "Crisp romaine lettuce with Caesar dressing, croutons, and parmesan",
        "price": 8.50,
        "category": "Appetizer",
        "is_available": True,
        "diet_type": "vegetarian"
    },
    {
        "name": "Chicken Burger",
        "description": "Grilled chicken breast with lettuce, tomato, and special sauce",
        "price": 14.50,
        "category": "Main Course",
        "is_available": True,
        "diet_type": "non-vegetarian"
    },
    {
        "name": "Pasta Carbonara",
        "description": "Creamy pasta with bacon, eggs, and parmesan cheese",
        "price": 16.00,
        "category": "Main Course",
        "is_available": True,
        "diet_type": "non-vegetarian"
    },
    {
        "name": "Grilled Salmon",
        "description": "Fresh Atlantic salmon with herbs and lemon butter sauce",
        "price": 22.50,
        "category": "Main Course",
        "is_available": True,
        "diet_type": "non-vegetarian"
    },
    {
        "name": "Vegetable Stir Fry",
        "description": "Mixed vegetables in a savory Asian sauce with jasmine rice",
        "price": 13.50,
        "category": "Main Course",
        "is_available": True,
        "diet_type": "vegan"
    },
    {
        "name": "Tiramisu",
        "description": "Classic Italian dessert with coffee-soaked ladyfingers and mascarpone",
        "price": 6.50,
        "category": "Dessert",
        "is_available": True,
        "diet_type": "vegetarian"
    },
    {
        "name": "Chocolate Lava Cake",
        "description": "Warm chocolate cake with a molten center, served with vanilla ice cream",
        "price": 7.50,
        "category": "Dessert",
        "is_available": True,
        "diet_type": "vegetarian"
    },
    {
        "name": "Lemonade",
        "description": "Freshly squeezed lemonade with mint",
        "price": 3.50,
        "category": "Beverage",
        "is_available": True,
        "diet_type": "vegan"
    },
    {
        "name": "Iced Coffee",
        "description": "Cold brew coffee with milk and ice",
        "price": 4.50,
        "category": "Beverage",
        "is_available": True,
        "diet_type": "vegetarian"
    },
    {
        "name": "French Onion Soup",
        "description": "Classic soup with caramelized onions and melted cheese",
        "price": 7.50,
        "category": "Appetizer",
        "is_available": True,
        "diet_type": "vegetarian"
    },
    {
        "name": "Buffalo Wings",
        "description": "Crispy chicken wings tossed in spicy buffalo sauce",
        "price": 11.50,
        "category": "Appetizer",
        "is_available": True,
        "diet_type": "non-vegetarian"
    },
]

# Sample tables
SAMPLE_TABLES = [
    {"table_number": 1, "capacity": 2, "status": "available"},
    {"table_number": 2, "capacity": 4, "status": "available"},
    {"table_number": 3, "capacity": 4, "status": "available"},
    {"table_number": 4, "capacity": 2, "status": "available"},
    {"table_number": 5, "capacity": 6, "status": "available"},
    {"table_number": 6, "capacity": 4, "status": "available"},
    {"table_number": 7, "capacity": 2, "status": "available"},
    {"table_number": 8, "capacity": 8, "status": "available"},
    {"table_number": 9, "capacity": 4, "status": "available"},
    {"table_number": 10, "capacity": 6, "status": "available"},
]

def seed_database():
    """Seed the database with sample data"""
    db = SessionLocal()
    
    try:
        # Check if menu items already exist
        existing_items = db.query(models.MenuItem).count()
        if existing_items > 0:
            print(f"Database already has {existing_items} menu items.")
            response = input("Do you want to add more items anyway? (yes/no): ")
            if response.lower() not in ['yes', 'y']:
                print("Skipping menu items seeding.")
            else:
                # Add menu items
                for item_data in SAMPLE_MENU_ITEMS:
                    menu_item = models.MenuItem(**item_data)
                    db.add(menu_item)
                db.commit()
                print(f"✅ Added {len(SAMPLE_MENU_ITEMS)} menu items")
        else:
            # Add menu items
            for item_data in SAMPLE_MENU_ITEMS:
                menu_item = models.MenuItem(**item_data)
                db.add(menu_item)
            db.commit()
            print(f"✅ Added {len(SAMPLE_MENU_ITEMS)} menu items")
        
        # Check if tables already exist
        existing_tables = db.query(models.Table).count()
        if existing_tables > 0:
            print(f"Database already has {existing_tables} tables.")
            response = input("Do you want to add more tables anyway? (yes/no): ")
            if response.lower() not in ['yes', 'y']:
                print("Skipping tables seeding.")
                return
        
        # Add tables
        for table_data in SAMPLE_TABLES:
            table = models.Table(**table_data)
            db.add(table)
        
        db.commit()
        print(f"✅ Added {len(SAMPLE_TABLES)} tables")
        
        print("\n🎉 Database seeded successfully!")
        print(f"Total menu items: {db.query(models.MenuItem).count()}")
        print(f"Total tables: {db.query(models.Table).count()}")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🌱 Seeding database with sample data...")
    seed_database()
