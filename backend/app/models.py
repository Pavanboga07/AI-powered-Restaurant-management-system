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
    
    # Relationships
    order = relationship("Order", back_populates="order_items")
    menu_item = relationship("MenuItem", back_populates="order_items")

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
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    confirmed_at = Column(DateTime(timezone=True))
    seated_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    
    # Relationships
    user = relationship("User", back_populates="reservations")
    table = relationship("Table", back_populates="reservations")

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
    customer_name = Column(String)  # For anonymous reviews
    rating = Column(Integer, nullable=False)  # 1-5 stars
    title = Column(String)
    comment = Column(Text)
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
