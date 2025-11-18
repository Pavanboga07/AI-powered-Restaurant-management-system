"""
Seed script to populate the database with dummy data for testing
"""
from datetime import datetime, timedelta
import random
from app.database import SessionLocal, engine, Base
from app.models import (
    User, UserRole, MenuItem, Table, TableStatus, Order, OrderStatus,
    OrderItem, Reservation, ReservationStatus, Bill, PaymentMethod,
    PaymentStatus, Coupon, CouponType, Review, ReviewStatus, Shift,
    InventoryItem, Supplier, Customer
)
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def create_dummy_data():
    """Create comprehensive dummy data for all tables"""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        print("🌱 Starting to seed dummy data...")
        
        # 1. Create Menu Items (30 items across categories)
        print("📋 Creating menu items...")
        menu_categories = {
            "Appetizers": [
                ("Spring Rolls", "Crispy vegetable spring rolls with sweet chili sauce", 8.99, True),
                ("Chicken Wings", "Spicy buffalo wings with ranch dressing", 12.99, True),
                ("Bruschetta", "Toasted bread with tomatoes, garlic, and basil", 9.99, True),
                ("Mozzarella Sticks", "Golden fried mozzarella with marinara sauce", 10.99, True),
                ("Calamari", "Crispy fried calamari rings with lemon aioli", 13.99, True),
            ],
            "Main Course": [
                ("Grilled Salmon", "Fresh Atlantic salmon with lemon butter sauce", 24.99, True),
                ("Beef Steak", "Prime ribeye steak with garlic mashed potatoes", 32.99, True),
                ("Chicken Alfredo", "Creamy pasta with grilled chicken breast", 18.99, True),
                ("Vegetable Curry", "Mixed vegetables in aromatic curry sauce", 15.99, True),
                ("Fish and Chips", "Crispy battered fish with french fries", 16.99, True),
                ("Lamb Chops", "Grilled lamb chops with rosemary jus", 28.99, True),
                ("Mushroom Risotto", "Creamy arborio rice with wild mushrooms", 17.99, True),
                ("BBQ Ribs", "Slow-cooked pork ribs with BBQ sauce", 22.99, True),
            ],
            "Desserts": [
                ("Chocolate Lava Cake", "Warm chocolate cake with vanilla ice cream", 8.99, True),
                ("Tiramisu", "Classic Italian coffee-flavored dessert", 7.99, True),
                ("Cheesecake", "New York style cheesecake with berry compote", 9.99, True),
                ("Ice Cream Sundae", "Three scoops with toppings and whipped cream", 6.99, True),
                ("Apple Pie", "Homemade apple pie with cinnamon", 7.99, True),
            ],
            "Beverages": [
                ("Fresh Orange Juice", "Freshly squeezed orange juice", 4.99, True),
                ("Iced Coffee", "Cold brew coffee with ice", 3.99, True),
                ("Mango Smoothie", "Fresh mango blended with yogurt", 5.99, True),
                ("Green Tea", "Premium Japanese green tea", 2.99, True),
                ("Coca Cola", "Classic Coca Cola", 2.49, True),
                ("Mineral Water", "Still or sparkling water", 1.99, True),
            ],
            "Salads": [
                ("Caesar Salad", "Romaine lettuce with Caesar dressing", 10.99, True),
                ("Greek Salad", "Fresh vegetables with feta cheese", 11.99, True),
                ("Garden Salad", "Mixed greens with house dressing", 8.99, True),
            ],
            "Soups": [
                ("Tomato Soup", "Creamy tomato soup with basil", 6.99, True),
                ("Chicken Noodle Soup", "Homemade chicken soup with noodles", 7.99, True),
                ("Mushroom Soup", "Creamy wild mushroom soup", 7.99, True),
            ]
        }
        
        menu_items = []
        for category, items in menu_categories.items():
            for name, desc, price, available in items:
                item = MenuItem(
                    name=name,
                    description=desc,
                    price=price,
                    category=category,
                    is_available=available,
                    image_url=f"/images/{name.lower().replace(' ', '_')}.jpg"
                )
                menu_items.append(item)
                db.add(item)
        
        db.commit()
        print(f"✅ Created {len(menu_items)} menu items")        # 2. Create Tables (20 tables)
        print("🪑 Creating tables...")
        tables = []
        for i in range(1, 21):
            capacity = random.choice([2, 4, 4, 6, 8])  # More 4-seaters
            table = Table(
                table_number=i,
                capacity=capacity,
                status=random.choice([TableStatus.available, TableStatus.available, TableStatus.occupied])
            )
            tables.append(table)
            db.add(table)
        
        db.commit()
        print(f"✅ Created {len(tables)} tables")
        
        # 3. Get existing users (created by seed_users.py)
        users = db.query(User).all()
        admin_user = db.query(User).filter(User.role == UserRole.admin).first()
        staff_users = db.query(User).filter(User.role == UserRole.staff).all()
        
        # 4. Create Customers with profiles
        print("👥 Creating customers...")
        customer_names = [
            ("John Doe", "john.doe@email.com", "+1234567890"),
            ("Jane Smith", "jane.smith@email.com", "+1234567891"),
            ("Bob Johnson", "bob.j@email.com", "+1234567892"),
            ("Alice Brown", "alice.brown@email.com", "+1234567893"),
            ("Charlie Davis", "charlie.d@email.com", "+1234567894"),
            ("Emma Wilson", "emma.w@email.com", "+1234567895"),
            ("David Lee", "david.lee@email.com", "+1234567896"),
            ("Sarah Miller", "sarah.m@email.com", "+1234567897"),
            ("Michael Chen", "michael.c@email.com", "+1234567898"),
            ("Lisa Anderson", "lisa.a@email.com", "+1234567899"),
        ]
        
        customers = []
        for name, email, phone in customer_names:
            # Create user account for customer
            username = email.split('@')[0]
            user = User(
                username=username,
                email=email,
                hashed_password=hash_password("customer123"),
                full_name=name,
                role=UserRole.customer,  # Using customer role
                is_active=True
            )
            db.add(user)
            db.flush()  # Get user ID
            
            # Create customer profile (Customer model only has user_id, phone, address)
            customer = Customer(
                user_id=user.id,
                phone=phone,
                address=f"{name.split()[0]}'s Address"  # Simple address based on first name
            )
            db.add(customer)
            customers.append(customer)
        
        db.commit()
        print(f"✅ Created {len(customers)} customers")
        
        # 5. Create Coupons (10 coupons)
        print("🎟️  Creating coupons...")
        coupons_data = [
            ("WELCOME10", "percentage", 10, 20, None, datetime.now(), datetime.now() + timedelta(days=90)),
            ("SAVE20", "percentage", 20, 50, 15, datetime.now(), datetime.now() + timedelta(days=60)),
            ("FLAT50", "fixed", 50, 100, 50, datetime.now(), datetime.now() + timedelta(days=30)),
            ("DINNER15", "percentage", 15, 30, None, datetime.now(), datetime.now() + timedelta(days=45)),
            ("LUNCH10", "fixed", 10, 25, None, datetime.now(), datetime.now() + timedelta(days=60)),
            ("VIP25", "percentage", 25, 75, 20, datetime.now(), datetime.now() + timedelta(days=120)),
            ("NEWUSER", "percentage", 15, 0, None, datetime.now(), datetime.now() + timedelta(days=365)),
            ("WEEKEND", "fixed", 30, 60, 30, datetime.now(), datetime.now() + timedelta(days=30)),
            ("FAMILY20", "percentage", 20, 100, 25, datetime.now(), datetime.now() + timedelta(days=60)),
            ("SPECIAL", "fixed", 25, 50, None, datetime.now(), datetime.now() + timedelta(days=15)),
        ]
        
        coupons = []
        for code, c_type, discount, min_order, max_disc, valid_from, valid_to in coupons_data:
            coupon = Coupon(
                code=code,
                type=CouponType.percentage if c_type == "percentage" else CouponType.fixed,
                value=discount,
                min_order_value=min_order,
                max_discount=max_disc,
                expiry_date=valid_to,
                max_uses=100,
                active=True
            )
            coupons.append(coupon)
            db.add(coupon)
        
        db.commit()
        print(f"✅ Created {len(coupons)} coupons")
        
        # 6. Create Orders with OrderItems (30 orders over the past 30 days)
        print("🛒 Creating orders...")
        orders = []
        for i in range(30):
            days_ago = random.randint(0, 30)
            order_date = datetime.now() - timedelta(days=days_ago, hours=random.randint(0, 23), minutes=random.randint(0, 59))
            
            # Select random items for the order
            num_items = random.randint(2, 6)
            selected_items = random.sample(menu_items, num_items)
            
            order = Order(
                table_id=random.choice(tables).id,
                customer_id=random.choice(customers).id if random.random() > 0.3 else None,
                status=random.choice([OrderStatus.completed, OrderStatus.completed, OrderStatus.completed, OrderStatus.served]),
                special_notes=random.choice(["No onions", "Extra spicy", "Well done", None, None, None]),
                created_at=order_date,
                created_by=admin_user.id if admin_user else users[0].id
            )
            db.add(order)
            db.flush()  # Get order ID
            
            # Add order items
            for item in selected_items:
                quantity = random.randint(1, 3)
                order_item = OrderItem(
                    order_id=order.id,
                    menu_item_id=item.id,
                    quantity=quantity,
                    price=item.price,
                    special_instructions=None
                )
                db.add(order_item)
            
            orders.append(order)
        
        db.commit()
        print(f"✅ Created {len(orders)} orders")
        
        # 7. Create Bills for completed orders
        print("💰 Creating bills...")
        bills = []
        for order in orders:
            if order.status in [OrderStatus.completed, OrderStatus.served]:
                # Calculate order total
                order_items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
                subtotal = sum(item.price * item.quantity for item in order_items)
                tax = subtotal * 0.08  # 8% tax
                
                # Random coupon application
                coupon_id = random.choice([None, None, None, random.choice(coupons).id])
                discount = 0
                if coupon_id:
                    coupon = db.query(Coupon).get(coupon_id)
                    if coupon and coupon.type == CouponType.percentage:
                        discount = (subtotal * coupon.value / 100)
                        if coupon.max_discount:
                            discount = min(discount, coupon.max_discount)
                    elif coupon:
                        discount = coupon.value
                
                total = subtotal + tax - discount
                
                bill = Bill(
                    order_id=order.id,
                    subtotal=subtotal,
                    tax=tax,
                    discount=discount,
                    total=total,
                    payment_method=random.choice([PaymentMethod.cash, PaymentMethod.card, PaymentMethod.upi]),
                    payment_status=PaymentStatus.paid,
                    coupon_id=coupon_id
                )
                bills.append(bill)
                db.add(bill)
        
        db.commit()
        print(f"✅ Created {len(bills)} bills")
        
        # 8. Create Reservations (20 reservations - past, today, and future)
        print("📅 Creating reservations...")
        reservations = []
        for i in range(20):
            days_offset = random.randint(-15, 30)  # Past 15 days to future 30 days
            reservation_date = datetime.now() + timedelta(days=days_offset)
            reservation_time = reservation_date.replace(
                hour=random.randint(11, 21),
                minute=random.choice([0, 15, 30, 45])
            )
            
            if days_offset < 0:
                status = random.choice([ReservationStatus.completed, ReservationStatus.completed, ReservationStatus.no_show])
            elif days_offset == 0:
                status = random.choice([ReservationStatus.confirmed, ReservationStatus.seated])
            else:
                status = ReservationStatus.confirmed
            
            customer = random.choice(customers)
            reservation = Reservation(
                user_id=customer.user_id,
                table_id=random.choice(tables).id,
                customer_name=customer.user.full_name,
                customer_phone=customer.phone,
                guests=random.randint(2, 8),
                reservation_date=reservation_time,
                time_slot=reservation_time.strftime("%H:%M"),
                status=status,
                special_requests=random.choice(["Window seat", "Birthday celebration", "Quiet area", None, None])
            )
            reservations.append(reservation)
            db.add(reservation)
        
        db.commit()
        print(f"✅ Created {len(reservations)} reservations")
        
        # 9. Create Reviews (25 reviews)
        print("⭐ Creating reviews...")
        reviews = []
        for i in range(25):
            days_ago = random.randint(1, 60)
            review_date = datetime.now() - timedelta(days=days_ago)
            
            rating = random.choices([1, 2, 3, 4, 5], weights=[2, 3, 10, 25, 60])[0]  # More high ratings
            
            comments = {
                5: ["Excellent food and service!", "Best restaurant in town!", "Will definitely come back!", "Amazing experience!"],
                4: ["Very good, small room for improvement", "Great food, good service", "Enjoyed our meal", "Nice atmosphere"],
                3: ["Average experience", "Food was okay", "Service could be better", "Nothing special"],
                2: ["Not impressed", "Food was cold", "Long wait time", "Disappointed"],
                1: ["Terrible experience", "Never coming back", "Worst service ever", "Awful food"]
            }
            
            customer = random.choice(customers)
            review = Review(
                customer_id=customer.id,
                user_id=customer.user_id,
                menu_item_id=random.choice(menu_items).id,
                rating=rating,
                comment=random.choice(comments[rating]),
                status=ReviewStatus.approved if random.random() > 0.1 else ReviewStatus.pending,
                helpful_count=random.randint(0, 20),
                created_at=review_date
            )
            reviews.append(review)
            db.add(review)
        
        db.commit()
        print(f"✅ Created {len(reviews)} reviews")
        
        # Note: Skipping inventory items, suppliers, and shifts for now
        # These can be added later with correct field mappings
        
        print("✅ Dummy data seeding completed successfully!")
        print("\nSummary:")
        print(f"  - {len(menu_items)} menu items")
        print(f"  - {len(tables)} tables") 
        print(f"  - {len(customers)} customers")
        print(f"  - {len(coupons)} coupons")
        print(f"  - {len(orders)} orders")
        print(f"  - {len(bills)} bills")
        print(f"  - {len(reservations)} reservations")
        print(f"  - {len(reviews)} reviews")
        return
        
        # 10. Create Inventory Items (50 items) - COMMENTED OUT
        print("📦 Creating inventory items...")
        inventory_items_data = [
            # Produce
            ("Tomatoes", "Vegetables", "kg", 50, 10, 100, 5.50),
            ("Lettuce", "Vegetables", "kg", 30, 5, 60, 3.25),
            ("Onions", "Vegetables", "kg", 40, 10, 80, 2.75),
            ("Potatoes", "Vegetables", "kg", 100, 20, 150, 1.50),
            ("Carrots", "Vegetables", "kg", 35, 8, 70, 2.25),
            ("Bell Peppers", "Vegetables", "kg", 25, 5, 50, 4.50),
            ("Mushrooms", "Vegetables", "kg", 15, 3, 30, 8.75),
            ("Garlic", "Vegetables", "kg", 10, 2, 20, 6.50),
            ("Basil", "Herbs", "bunch", 20, 5, 40, 2.50),
            ("Parsley", "Herbs", "bunch", 15, 3, 30, 2.25),
            # Proteins
            ("Chicken Breast", "Meat", "kg", 60, 15, 100, 12.50),
            ("Beef Ribeye", "Meat", "kg", 40, 10, 70, 35.00),
            ("Salmon Fillet", "Seafood", "kg", 30, 8, 50, 28.00),
            ("Lamb Chops", "Meat", "kg", 25, 5, 40, 32.00),
            ("Pork Ribs", "Meat", "kg", 35, 10, 60, 15.50),
            ("Calamari", "Seafood", "kg", 20, 5, 35, 18.75),
            ("Shrimp", "Seafood", "kg", 25, 8, 45, 22.50),
            # Dairy
            ("Milk", "Dairy", "liters", 40, 10, 80, 3.50),
            ("Cheese", "Dairy", "kg", 25, 5, 50, 18.50),
            ("Butter", "Dairy", "kg", 20, 5, 40, 12.75),
            ("Cream", "Dairy", "liters", 15, 3, 30, 8.25),
            ("Mozzarella", "Dairy", "kg", 20, 5, 40, 16.50),
            # Pantry
            ("Olive Oil", "Oils", "liters", 30, 5, 50, 15.50),
            ("Rice", "Grains", "kg", 80, 20, 150, 3.25),
            ("Pasta", "Grains", "kg", 60, 15, 100, 4.50),
            ("Flour", "Baking", "kg", 50, 10, 100, 2.75),
            ("Sugar", "Baking", "kg", 40, 10, 80, 2.50),
            ("Salt", "Spices", "kg", 30, 5, 60, 1.25),
            ("Black Pepper", "Spices", "kg", 10, 2, 20, 25.00),
            ("Coffee Beans", "Beverages", "kg", 25, 5, 50, 28.50),
            ("Tea Leaves", "Beverages", "kg", 20, 5, 40, 18.75),
            # Beverages
            ("Orange Juice", "Beverages", "liters", 40, 10, 80, 6.50),
            ("Coca Cola", "Beverages", "liters", 60, 15, 100, 2.25),
            ("Mineral Water", "Beverages", "liters", 100, 20, 150, 0.75),
            # Frozen
            ("Ice Cream", "Frozen", "liters", 30, 5, 60, 12.50),
            ("French Fries", "Frozen", "kg", 40, 10, 80, 4.75),
        ]
        
        inventory_items = []
        for name, category, unit, current_stock, reorder_point, max_stock, unit_cost in inventory_items_data:
            item = InventoryItem(
                name=name,
                category=category,
                unit=unit,
                current_stock=current_stock,
                reorder_point=reorder_point,
                max_stock=max_stock,
                unit_cost=unit_cost
            )
            inventory_items.append(item)
            db.add(item)
        
        db.commit()
        print(f"✅ Created {len(inventory_items)} inventory items")
        
        # 11. Create Suppliers (10 suppliers)
        print("🚚 Creating suppliers...")
        suppliers_data = [
            ("Fresh Farms Co.", "John Smith", "john@freshfarms.com", "+1234567800", "123 Farm Road", "Produce and vegetables"),
            ("Prime Meats Inc.", "Sarah Johnson", "sarah@primemeats.com", "+1234567801", "456 Butcher Lane", "Quality meats"),
            ("Ocean Harvest", "Mike Chen", "mike@oceanharvest.com", "+1234567802", "789 Harbor St", "Fresh seafood"),
            ("Dairy Delights", "Emma Wilson", "emma@dairydelights.com", "+1234567803", "321 Milk Way", "Dairy products"),
            ("Pantry Essentials", "David Lee", "david@pantry.com", "+1234567804", "654 Supply Ave", "Dry goods and pantry"),
            ("Beverage Distributors", "Lisa Brown", "lisa@beverages.com", "+1234567805", "987 Drink Blvd", "Beverages and drinks"),
            ("Spice World", "Tom Anderson", "tom@spiceworld.com", "+1234567806", "147 Flavor St", "Spices and seasonings"),
            ("Frozen Foods Ltd", "Amy Martinez", "amy@frozenfoods.com", "+1234567807", "258 Cold Lane", "Frozen items"),
            ("Organic Produce", "Chris Davis", "chris@organic.com", "+1234567808", "369 Green Way", "Organic vegetables"),
            ("Bakery Supplies", "Jennifer White", "jen@bakerysupply.com", "+1234567809", "741 Flour Ave", "Baking supplies"),
        ]
        
        suppliers = []
        for name, contact, email, phone, address, notes in suppliers_data:
            supplier = Supplier(
                name=name,
                contact_person=contact,
                email=email,
                phone=phone,
                address=address,
                notes=notes
            )
            suppliers.append(supplier)
            db.add(supplier)
        
        db.commit()
        print(f"✅ Created {len(suppliers)} suppliers")
        
        # 12. Create Shifts for the week (staff scheduling)
        print("📋 Creating shifts...")
        shifts = []
        if staff_users:
            for days_ahead in range(7):  # Next 7 days
                shift_date = datetime.now() + timedelta(days=days_ahead)
                
                # Morning shift
                morning_start = shift_date.replace(hour=8, minute=0, second=0)
                morning_end = shift_date.replace(hour=16, minute=0, second=0)
                morning_shift = Shift(
                    employee_id=random.choice(staff_users).id,
                    shift_date=shift_date.date(),
                    start_time=morning_start.time(),
                    end_time=morning_end.time(),
                    role="Server"
                )
                shifts.append(morning_shift)
                db.add(morning_shift)
                
                # Evening shift
                evening_start = shift_date.replace(hour=16, minute=0, second=0)
                evening_end = shift_date.replace(hour=23, minute=0, second=0)
                evening_shift = Shift(
                    employee_id=random.choice(staff_users).id,
                    shift_date=shift_date.date(),
                    start_time=evening_start.time(),
                    end_time=evening_end.time(),
                    role="Server"
                )
                shifts.append(evening_shift)
                db.add(evening_shift)
        
        db.commit()
        print(f"✅ Created {len(shifts)} shifts")
        
        print("\n" + "="*60)
        print("🎉 DUMMY DATA SEEDING COMPLETED!")
        print("="*60)
        print(f"📊 Summary:")
        print(f"   • Menu Items: {len(menu_items)}")
        print(f"   • Tables: {len(tables)}")
        print(f"   • Customers: {len(customers)}")
        print(f"   • Orders: {len(orders)}")
        print(f"   • Bills: {len(bills)}")
        print(f"   • Reservations: {len(reservations)}")
        print(f"   • Reviews: {len(reviews)}")
        print(f"   • Coupons: {len(coupons)}")
        print(f"   • Inventory Items: {len(inventory_items)}")
        print(f"   • Suppliers: {len(suppliers)}")
        print(f"   • Shifts: {len(shifts)}")
        print("="*60)
        
    except Exception as e:
        print(f"❌ Error creating dummy data: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_dummy_data()
