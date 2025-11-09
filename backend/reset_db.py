"""
Reset database script - drops all tables and recreates them
"""
from app.database import engine, Base, SessionLocal
from app import models
from app.utils.security import get_password_hash

def reset_database():
    print("🗑️  Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    
    print("🏗️  Creating all tables...")
    Base.metadata.create_all(bind=engine)
    
    print("👥 Creating default users...")
    db = SessionLocal()
    try:
        users = [
            models.User(
                username="admin",
                email="admin@restaurant.com",
                hashed_password=get_password_hash("admin123"),
                full_name="Admin User",
                role=models.UserRole.admin
            ),
            models.User(
                username="manager",
                email="manager@restaurant.com",
                hashed_password=get_password_hash("manager123"),
                full_name="Manager User",
                role=models.UserRole.manager
            ),
            models.User(
                username="chef",
                email="chef@restaurant.com",
                hashed_password=get_password_hash("chef123"),
                full_name="Chef User",
                role=models.UserRole.chef
            ),
            models.User(
                username="staff",
                email="staff@restaurant.com",
                hashed_password=get_password_hash("staff123"),
                full_name="Staff User",
                role=models.UserRole.staff
            ),
        ]
        
        for user in users:
            db.add(user)
        
        print("🍕 Creating menu items...")
        menu_items = [
            models.MenuItem(name="Margherita Pizza", description="Classic tomato and mozzarella", price=12.99, category="Main Course", diet_type="Veg", is_available=True, preparation_time=15),
            models.MenuItem(name="Caesar Salad", description="Romaine lettuce with Caesar dressing", price=8.99, category="Appetizer", diet_type="Veg", is_available=True, preparation_time=10),
            models.MenuItem(name="Grilled Chicken Burger", description="Juicy grilled chicken with fresh vegetables", price=14.99, category="Main Course", diet_type="Non-Veg", is_available=True, preparation_time=20),
            models.MenuItem(name="Pasta Carbonara", description="Creamy pasta with bacon and parmesan", price=13.99, category="Main Course", diet_type="Non-Veg", is_available=True, preparation_time=18),
            models.MenuItem(name="Grilled Salmon", description="Fresh salmon with lemon butter sauce", price=18.99, category="Main Course", diet_type="Non-Veg", is_available=True, preparation_time=25),
            models.MenuItem(name="Vegetable Stir Fry", description="Fresh seasonal vegetables", price=11.99, category="Main Course", diet_type="Vegan", is_available=True, preparation_time=15),
            models.MenuItem(name="Chocolate Lava Cake", description="Warm chocolate cake with molten center", price=6.99, category="Dessert", diet_type="Veg", is_available=True, preparation_time=12),
            models.MenuItem(name="Tiramisu", description="Classic Italian dessert", price=7.99, category="Dessert", diet_type="Veg", is_available=True, preparation_time=5),
            models.MenuItem(name="Fresh Orange Juice", description="Freshly squeezed orange juice", price=4.99, category="Beverage", diet_type="Vegan", is_available=True, preparation_time=3),
            models.MenuItem(name="Cappuccino", description="Espresso with steamed milk foam", price=3.99, category="Beverage", diet_type="Veg", is_available=True, preparation_time=5),
            models.MenuItem(name="Garlic Bread", description="Toasted bread with garlic butter", price=5.99, category="Appetizer", diet_type="Veg", is_available=True, preparation_time=8),
            models.MenuItem(name="Spring Rolls", description="Crispy vegetable spring rolls", price=6.99, category="Appetizer", diet_type="Vegan", is_available=True, preparation_time=10),
        ]
        
        for item in menu_items:
            db.add(item)
        
        print("🪑 Creating tables...")
        tables = [
            models.Table(table_number=1, capacity=2, status=models.TableStatus.available),
            models.Table(table_number=2, capacity=2, status=models.TableStatus.available),
            models.Table(table_number=3, capacity=4, status=models.TableStatus.available),
            models.Table(table_number=4, capacity=4, status=models.TableStatus.available),
            models.Table(table_number=5, capacity=4, status=models.TableStatus.available),
            models.Table(table_number=6, capacity=6, status=models.TableStatus.available),
            models.Table(table_number=7, capacity=6, status=models.TableStatus.available),
            models.Table(table_number=8, capacity=8, status=models.TableStatus.available),
            models.Table(table_number=9, capacity=4, status=models.TableStatus.available),
            models.Table(table_number=10, capacity=2, status=models.TableStatus.available),
        ]
        
        for table in tables:
            db.add(table)
        
        db.commit()
        print("✅ Database reset and seeded successfully!")
        print("\n🔐 Login credentials:")
        print("  Admin:   admin/admin123")
        print("  Manager: manager/manager123")
        print("  Chef:    chef/chef123")
        print("  Staff:   staff/staff123")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_database()
