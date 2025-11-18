from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, Time, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum

class UserRole(str, enum.Enum):
    admin = "admin"
    manager = "manager"
    chef = "chef"
    staff = "staff"
    customer = "customer"

class OrderStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    preparing = "preparing"
    ready = "ready"
    served = "served"
    completed = "completed"
    cancelled = "cancelled"

class TableStatus(str, enum.Enum):
    available = "available"
    occupied = "occupied"
    reserved = "reserved"
    cleaning = "cleaning"
    maintenance = "maintenance"

class ReservationStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    seated = "seated"
    completed = "completed"
    cancelled = "cancelled"
    no_show = "no_show"

class PaymentMethod(str, enum.Enum):
    cash = "cash"
    card = "card"
    upi = "upi"
    online = "online"

class PaymentStatus(str, enum.Enum):
    pending = "pending"
    paid = "paid"
    failed = "failed"
    refunded = "refunded"

class CouponType(str, enum.Enum):
    percentage = "percentage"
    fixed = "fixed"

class ReviewStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class ShiftType(str, enum.Enum):
    morning = "morning"
    afternoon = "afternoon"
    evening = "evening"
    night = "night"

class MessageType(str, enum.Enum):
    info = "info"
    urgent = "urgent"
    request = "request"

class ServiceRequestType(str, enum.Enum):
    assistance = "assistance"  # General help needed
    complaint = "complaint"    # Customer complaint
    special_need = "special_need"  # Dietary restrictions, accessibility
    refill = "refill"          # Water, bread, condiments
    cleaning = "cleaning"      # Spill, cleanliness issue
    other = "other"

class ServiceRequestStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    resolved = "resolved"
    cancelled = "cancelled"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(Enum(UserRole), default=UserRole.staff)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    orders = relationship("Order", back_populates="created_by_user")
    reservations = relationship("Reservation", back_populates="user")
    shifts = relationship("Shift", back_populates="employee")
    customer_profile = relationship("Customer", back_populates="user", uselist=False)
    customer_profile_extended = relationship("CustomerProfile", back_populates="user", uselist=False)  # Phase 4
    sent_messages = relationship("Message", foreign_keys="[Message.sender_id]", back_populates="sender")
    received_messages = relationship("Message", foreign_keys="[Message.recipient_id]", back_populates="recipient")

class MenuItem(Base):
    __tablename__ = "menu_items"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text)
    price = Column(Float, nullable=False)
    category = Column(String, index=True)  # appetizer, main, dessert, beverage
    diet_type = Column(String)  # Veg, Non-Veg, Vegan
    image_url = Column(String)
    is_available = Column(Boolean, default=True)
    preparation_time = Column(Integer)  # in minutes
    cook_time = Column(Integer)  # in minutes
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    order_items = relationship("OrderItem", back_populates="menu_item")
    reviews = relationship("Review", back_populates="menu_item")
    favorites = relationship("Favorite", back_populates="menu_item")

class Table(Base):
    __tablename__ = "tables"
    
    id = Column(Integer, primary_key=True, index=True)
    table_number = Column(Integer, unique=True, nullable=False, index=True)
    capacity = Column(Integer, nullable=False)
    status = Column(Enum(TableStatus), default=TableStatus.available)
    location = Column(String)  # indoor, outdoor, window, etc.
    cleaning_started_at = Column(DateTime(timezone=True), nullable=True)  # When cleaning started
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    orders = relationship("Order", back_populates="table")
    reservations = relationship("Reservation", back_populates="table")
    service_requests = relationship("ServiceRequest", back_populates="table")

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    table_id = Column(Integer, ForeignKey("tables.id"))
    customer_id = Column(Integer, ForeignKey("customers.id"), index=True, nullable=True)
    customer_name = Column(String)
    customer_phone = Column(String)
    created_by = Column(Integer, ForeignKey("users.id"))
    status = Column(Enum(OrderStatus), default=OrderStatus.pending)
    total_amount = Column(Float, default=0.0)
    special_notes = Column(Text)
    notes = Column(Text)  # Kept for backward compatibility
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    
    # Phase 5: KDS Fields
    kitchen_status = Column(String(50), default="pending")
    kitchen_received_at = Column(DateTime(timezone=True))
    all_items_ready_at = Column(DateTime(timezone=True))
    bumped_at = Column(DateTime(timezone=True))
    
    # Relationships
    table = relationship("Table", back_populates="orders")
    created_by_user = relationship("User", back_populates="orders")
    order_items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    customer = relationship("Customer", back_populates="orders")
    bill = relationship("Bill", back_populates="order", uselist=False)

class OrderItem(Base):
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    price = Column(Float, nullable=False)
    special_instructions = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Phase 5: KDS Fields
    station_id = Column(Integer, ForeignKey("kitchen_stations.id"))
    priority = Column(Integer, default=0)  # Higher number = higher priority
    prep_status = Column(String(50), default="pending")
    prep_start_time = Column(DateTime(timezone=True))
    prep_end_time = Column(DateTime(timezone=True))
    assigned_chef_id = Column(Integer, ForeignKey("users.id"))
    preparation_notes = Column(Text)
    estimated_prep_time = Column(Integer)  # in minutes
    
    # Relationships
    order = relationship("Order", back_populates="order_items")
    menu_item = relationship("MenuItem", back_populates="order_items")
    station = relationship("KitchenStation", back_populates="order_items")
    assigned_chef = relationship("User", foreign_keys=[assigned_chef_id])

class Reservation(Base):
    __tablename__ = "reservations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    table_id = Column(Integer, ForeignKey("tables.id"))
    customer_name = Column(String, nullable=False)  # Changed from guest_name for consistency
    customer_email = Column(String)
    customer_phone = Column(String, nullable=False)
    reservation_date = Column(DateTime(timezone=True), nullable=False, index=True)
    time_slot = Column(String)  # e.g., "14:00", "19:30"
    duration = Column(Integer, default=90)  # in minutes
    guests = Column(Integer, nullable=False)  # party_size renamed for clarity
    special_requests = Column(Text)
    status = Column(Enum(ReservationStatus), default=ReservationStatus.pending, index=True)
    recurring_reservation_id = Column(Integer, ForeignKey("recurring_reservations.id"))  # Phase 4
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    confirmed_at = Column(DateTime(timezone=True))
    seated_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    
    # Relationships
    user = relationship("User", back_populates="reservations")
    table = relationship("Table", back_populates="reservations")
    recurring_pattern = relationship("RecurringReservation", back_populates="generated_reservations")  # Phase 4

class Bill(Base):
    __tablename__ = "bills"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, unique=True)
    subtotal = Column(Float, nullable=False)
    tax = Column(Float, default=0.0)  # Tax amount
    tax_percentage = Column(Float, default=5.0)  # Tax percentage (default 5%)
    discount = Column(Float, default=0.0)  # Discount amount
    coupon_id = Column(Integer, ForeignKey("coupons.id"))
    total = Column(Float, nullable=False)
    payment_method = Column(Enum(PaymentMethod))
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.pending, index=True)
    split_count = Column(Integer, default=1)  # Number of splits (1 = no split)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    paid_at = Column(DateTime(timezone=True))
    
    # Relationships
    order = relationship("Order", back_populates="bill")
    coupon = relationship("Coupon", back_populates="bills")

class Coupon(Base):
    __tablename__ = "coupons"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False, index=True)
    description = Column(Text)
    type = Column(Enum(CouponType), nullable=False)  # percentage or fixed
    value = Column(Float, nullable=False)  # Percentage (e.g., 10 for 10%) or Fixed amount
    min_order_value = Column(Float, default=0.0)  # Minimum order value required
    max_discount = Column(Float)  # Maximum discount cap for percentage coupons
    max_uses = Column(Integer)  # Maximum total uses (null = unlimited)
    current_uses = Column(Integer, default=0)  # Current usage count
    expiry_date = Column(DateTime(timezone=True))
    active = Column(Boolean, default=True, index=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    bills = relationship("Bill", back_populates="coupon")

class Review(Base):
    __tablename__ = "reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    customer_id = Column(Integer, ForeignKey("customers.id"), index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))  # Phase 4: Link to order
    customer_name = Column(String)  # For anonymous reviews
    rating = Column(Integer, nullable=False)  # 1-5 stars
    title = Column(String)
    comment = Column(Text)
    photos = Column(Text)  # Phase 4: JSON array of photo URLs
    is_verified_purchase = Column(Boolean, default=False)  # Phase 4
    status = Column(Enum(ReviewStatus), default=ReviewStatus.pending, index=True)
    helpful_count = Column(Integer, default=0)
    moderated_by = Column(Integer, ForeignKey("users.id"))
    moderated_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    menu_item = relationship("MenuItem", back_populates="reviews")
    user = relationship("User", foreign_keys=[user_id])
    customer = relationship("Customer", back_populates="reviews")
    order = relationship("Order")  # Phase 4
    moderator = relationship("User", foreign_keys=[moderated_by])

class Shift(Base):
    __tablename__ = "shifts"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    shift_type = Column(Enum(ShiftType), nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    employee = relationship("User", back_populates="shifts")

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    phone = Column(String)
    address = Column(Text)
    total_orders = Column(Integer, default=0)
    total_spent = Column(Float, default=0.0)
    loyalty_points = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="customer_profile")
    orders = relationship("Order", back_populates="customer")
    reviews = relationship("Review", back_populates="customer")
    favorites = relationship("Favorite", back_populates="customer")

class Favorite(Base):
    __tablename__ = "favorites"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False, index=True)
    added_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    customer = relationship("Customer", back_populates="favorites")
    menu_item = relationship("MenuItem", back_populates="favorites")

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    recipient_id = Column(Integer, ForeignKey("users.id"), index=True)
    recipient_role = Column(Enum(UserRole))  # For broadcasting to all users of a role
    message = Column(Text, nullable=False)
    type = Column(Enum(MessageType), default=MessageType.info)
    is_read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    read_at = Column(DateTime(timezone=True))
    
    # Relationships
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    recipient = relationship("User", foreign_keys=[recipient_id], back_populates="received_messages")

class ShiftHandover(Base):
    __tablename__ = "shift_handovers"
    
    id = Column(Integer, primary_key=True, index=True)
    chef_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    shift_date = Column(Date, nullable=False, index=True)
    shift_type = Column(Enum(ShiftType), nullable=False)
    prep_work_completed = Column(Text)
    low_stock_items = Column(Text)  # JSON array stored as text
    pending_tasks = Column(Text)
    incidents = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    chef = relationship("User")

class ServiceRequest(Base):
    __tablename__ = "service_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    table_id = Column(Integer, ForeignKey("tables.id"), nullable=False, index=True)
    staff_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)  # Assigned staff member
    request_type = Column(Enum(ServiceRequestType), nullable=False)
    description = Column(Text)
    priority = Column(String, default="normal")  # low, normal, high
    status = Column(Enum(ServiceRequestStatus), default=ServiceRequestStatus.pending)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text)  # Staff notes
    
    # Relationships
    table = relationship("Table", back_populates="service_requests")
    staff = relationship("User", foreign_keys=[staff_id])


# ==================== INVENTORY MODELS (Phase 2) ====================

class Supplier(Base):
    __tablename__ = "suppliers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    contact_person = Column(String(100))
    email = Column(String(100))
    phone = Column(String(20))
    address = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    inventory_items = relationship("InventoryItem", back_populates="supplier")
    purchase_orders = relationship("PurchaseOrder", back_populates="supplier")


class InventoryItem(Base):
    __tablename__ = "inventory_items"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    category = Column(String(50), index=True)  # Raw Material, Packaging, Beverages, etc.
    unit = Column(String(20))  # kg, liter, piece, box, etc.
    current_quantity = Column(Float, default=0)
    min_quantity = Column(Float, default=0)  # Reorder point
    max_quantity = Column(Float)
    unit_cost = Column(Float)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    location = Column(String(100))  # Storage location
    is_active = Column(Boolean, default=True)
    last_restocked = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    supplier = relationship("Supplier", back_populates="inventory_items")
    transactions = relationship("InventoryTransaction", back_populates="inventory_item")
    recipes = relationship("MenuItemRecipe", back_populates="inventory_item")
    purchase_order_items = relationship("PurchaseOrderItem", back_populates="inventory_item")


class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    inventory_item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False, index=True)
    transaction_type = Column(String(20), index=True)  # purchase, usage, wastage, adjustment
    quantity = Column(Float, nullable=False)  # Positive for add, negative for deduct
    unit_cost = Column(Float)
    reference_type = Column(String(20))  # order, purchase, adjustment
    reference_id = Column(Integer)  # Order ID, Purchase ID, etc.
    notes = Column(Text)
    performed_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    inventory_item = relationship("InventoryItem", back_populates="transactions")
    user = relationship("User")


class MenuItemRecipe(Base):
    __tablename__ = "menu_item_recipes"
    
    id = Column(Integer, primary_key=True, index=True)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False)
    inventory_item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    quantity_required = Column(Float, nullable=False)  # Quantity per serving
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    menu_item = relationship("MenuItem")
    inventory_item = relationship("InventoryItem", back_populates="recipes")


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    
    id = Column(Integer, primary_key=True, index=True)
    po_number = Column(String(50), unique=True, nullable=False, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    status = Column(String(20), default="pending")  # pending, confirmed, received, cancelled
    order_date = Column(DateTime(timezone=True), server_default=func.now())
    expected_delivery = Column(DateTime(timezone=True))
    actual_delivery = Column(DateTime(timezone=True))
    total_cost = Column(Float)
    notes = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    supplier = relationship("Supplier", back_populates="purchase_orders")
    items = relationship("PurchaseOrderItem", back_populates="purchase_order", cascade="all, delete-orphan")
    creator = relationship("User")


class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=False)
    inventory_item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    unit_cost = Column(Float, nullable=False)
    received_quantity = Column(Float, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    purchase_order = relationship("PurchaseOrder", back_populates="items")
    inventory_item = relationship("InventoryItem", back_populates="purchase_order_items")


# ==================== PHASE 4: ENHANCED USER FEATURES ====================

class CustomerProfile(Base):
    """Extended customer profile with preferences and saved addresses"""
    __tablename__ = "customer_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    date_of_birth = Column(Date)
    phone_verified = Column(Boolean, default=False)
    email_verified = Column(Boolean, default=False)
    dietary_preferences = Column(Text)  # JSON string: ["vegetarian", "gluten-free", etc.]
    allergies = Column(Text)  # JSON string: ["nuts", "dairy", etc.]
    favorite_items = Column(Text)  # JSON string of menu_item_ids
    preferred_payment_method = Column(String(20))
    default_address_id = Column(Integer, ForeignKey("customer_addresses.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="customer_profile_extended")
    addresses = relationship("CustomerAddress", back_populates="customer", foreign_keys="CustomerAddress.customer_id")
    loyalty_account = relationship("LoyaltyAccount", back_populates="customer", uselist=False)


class CustomerAddress(Base):
    """Saved delivery addresses"""
    __tablename__ = "customer_addresses"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customer_profiles.id"), nullable=False)
    label = Column(String(50))  # Home, Office, etc.
    address_line1 = Column(String(255), nullable=False)
    address_line2 = Column(String(255))
    city = Column(String(100), nullable=False)
    state = Column(String(100))
    postal_code = Column(String(20))
    country = Column(String(100), default="India")
    delivery_instructions = Column(Text)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    customer = relationship("CustomerProfile", back_populates="addresses", foreign_keys=[customer_id])


class LoyaltyAccount(Base):
    """Customer loyalty points and tier system"""
    __tablename__ = "loyalty_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customer_profiles.id"), unique=True, nullable=False)
    points_balance = Column(Integer, default=0)
    lifetime_points = Column(Integer, default=0)  # Total points ever earned
    tier_level = Column(String(20), default="bronze")  # bronze, silver, gold, platinum
    tier_valid_until = Column(DateTime(timezone=True))
    total_spent = Column(Float, default=0.0)
    total_orders = Column(Integer, default=0)
    referral_code = Column(String(20), unique=True)
    referred_by = Column(Integer, ForeignKey("loyalty_accounts.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    customer = relationship("CustomerProfile", back_populates="loyalty_account")
    transactions = relationship("LoyaltyTransaction", back_populates="loyalty_account")
    referrals = relationship("LoyaltyAccount", backref="referrer", remote_side=[id])


class LoyaltyTransaction(Base):
    """Points earning and redemption history"""
    __tablename__ = "loyalty_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    loyalty_account_id = Column(Integer, ForeignKey("loyalty_accounts.id"), nullable=False)
    transaction_type = Column(String(20))  # earn, redeem, expire, bonus, referral
    points_change = Column(Integer, nullable=False)  # Positive for earn, negative for redeem
    reference_type = Column(String(20))  # order, referral, bonus, manual
    reference_id = Column(Integer)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    loyalty_account = relationship("LoyaltyAccount", back_populates="transactions")


class RecurringReservation(Base):
    """Recurring reservation patterns (weekly, monthly, etc.)"""
    __tablename__ = "recurring_reservations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    pattern_type = Column(String(20), nullable=False)  # weekly, biweekly, monthly
    day_of_week = Column(Integer)  # 0=Monday, 6=Sunday
    time = Column(Time, nullable=False)
    guests = Column(Integer, nullable=False)
    special_requests = Column(Text)
    is_active = Column(Boolean, default=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date)  # Optional end date
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User")
    generated_reservations = relationship("Reservation", back_populates="recurring_pattern")


# Update existing User model to add relationship
# Note: Add this to the User class if it doesn't exist
# customer_profile = relationship("CustomerProfile", back_populates="user", uselist=False)


# ==================== PHASE 5: KITCHEN DISPLAY SYSTEM ====================

class PrepStatus(str, enum.Enum):
    """Order item preparation status for KDS"""
    pending = "pending"
    assigned = "assigned"
    preparing = "preparing"
    ready = "ready"
    served = "served"
    cancelled = "cancelled"


class StationType(str, enum.Enum):
    """Kitchen station types"""
    grill = "grill"
    fry = "fry"
    saute = "saute"
    cold = "cold"
    beverage = "beverage"
    expeditor = "expeditor"
    pastry = "pastry"
    other = "other"


class KitchenStatus(str, enum.Enum):
    """Overall kitchen status for orders"""
    pending = "pending"
    received = "received"
    in_progress = "in_progress"
    all_ready = "all_ready"
    bumped = "bumped"


class KitchenStation(Base):
    """Kitchen stations for KDS"""
    __tablename__ = "kitchen_stations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text)
    station_type = Column(Enum(StationType), nullable=False)
    is_active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)
    max_concurrent_orders = Column(Integer, default=10)
    average_prep_time = Column(Integer)  # in minutes
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    order_items = relationship("OrderItem", back_populates="station")
    assignments = relationship("StationAssignment", back_populates="station")
    performance_logs = relationship("KitchenPerformanceLog", back_populates="station")
    display_settings = relationship("TicketDisplaySettings", back_populates="station", uselist=False)


class StationAssignment(Base):
    """Chef assignments to kitchen stations"""
    __tablename__ = "station_assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    chef_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    station_id = Column(Integer, ForeignKey("kitchen_stations.id"), nullable=False)
    shift_start = Column(DateTime(timezone=True), nullable=False)
    shift_end = Column(DateTime(timezone=True))
    is_primary = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    chef = relationship("User")
    station = relationship("KitchenStation", back_populates="assignments")


class KitchenPerformanceLog(Base):
    """Performance tracking for kitchen operations"""
    __tablename__ = "kitchen_performance_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("kitchen_stations.id"), nullable=False)
    order_item_id = Column(Integer, ForeignKey("order_items.id"), nullable=False)
    action = Column(String(50), nullable=False)  # started, completed, delayed, bumped
    chef_id = Column(Integer, ForeignKey("users.id"))
    duration_seconds = Column(Integer)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    station = relationship("KitchenStation", back_populates="performance_logs")
    order_item = relationship("OrderItem")
    chef = relationship("User")


class TicketDisplaySettings(Base):
    """Display preferences for KDS screens per station"""
    __tablename__ = "ticket_display_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("kitchen_stations.id"), unique=True)
    font_size = Column(String(20), default="medium")  # small, medium, large
    show_customer_names = Column(Boolean, default=True)
    show_ticket_times = Column(Boolean, default=True)
    show_special_requests = Column(Boolean, default=True)
    auto_bump_completed = Column(Boolean, default=False)
    bump_delay_seconds = Column(Integer, default=0)
    alert_threshold_minutes = Column(Integer, default=15)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    station = relationship("KitchenStation", back_populates="display_settings")
