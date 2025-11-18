from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date, time
from .models import UserRole, OrderStatus, TableStatus, ReservationStatus, PaymentMethod, PaymentStatus, CouponType, ReviewStatus, ShiftType

# ============ User Schemas ============
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    role: UserRole = UserRole.staff

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# ============ Auth Schemas ============
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    username: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

# ============ MenuItem Schemas ============
class MenuItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float = Field(gt=0)
    category: str
    diet_type: Optional[str] = None  # Veg, Non-Veg, Vegan
    image_url: Optional[str] = None
    is_available: bool = True
    preparation_time: Optional[int] = None  # in minutes
    cook_time: Optional[int] = None  # in minutes

class MenuItemCreate(MenuItemBase):
    pass

class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    category: Optional[str] = None
    diet_type: Optional[str] = None
    image_url: Optional[str] = None
    is_available: Optional[bool] = None
    preparation_time: Optional[int] = None
    cook_time: Optional[int] = None

class MenuItem(MenuItemBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# ============ Table Schemas ============
class TableBase(BaseModel):
    table_number: int
    capacity: int = Field(gt=0)
    location: Optional[str] = None
    status: TableStatus = TableStatus.available

class TableCreate(TableBase):
    pass

class TableUpdate(BaseModel):
    table_number: Optional[int] = None
    capacity: Optional[int] = Field(None, gt=0)
    location: Optional[str] = None
    status: Optional[TableStatus] = None

class Table(TableBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# ============ OrderItem Schemas ============
class OrderItemBase(BaseModel):
    menu_item_id: int
    quantity: int = Field(gt=0)
    special_instructions: Optional[str] = None

class OrderItemCreate(OrderItemBase):
    pass

class OrderItem(OrderItemBase):
    id: int
    order_id: int
    price: float
    created_at: datetime
    menu_item: Optional[MenuItem] = None
    
    class Config:
        from_attributes = True

# ============ Order Schemas ============
class OrderBase(BaseModel):
    table_id: int
    customer_name: Optional[str] = None
    special_notes: Optional[str] = None

class OrderCreate(OrderBase):
    items: List[OrderItemCreate]

class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    special_notes: Optional[str] = None

class OrderStatusUpdate(BaseModel):
    status: OrderStatus

class Order(OrderBase):
    id: int
    created_by: Optional[int] = None
    status: OrderStatus
    total_amount: float
    created_at: datetime
    updated_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    order_items: List[OrderItem] = []
    table: Optional[Table] = None
    
    class Config:
        from_attributes = True

# ============ Order Stats Schema ============
class OrderStats(BaseModel):
    total_orders: int
    pending_orders: int
    confirmed_orders: int
    preparing_orders: int
    ready_orders: int
    served_orders: int
    completed_orders: int
    cancelled_orders: int
    total_revenue: float
    average_order_value: float

# ============ Billing Stats Schema ============
class PaymentMethodBreakdown(BaseModel):
    cash: int
    card: int
    upi: int
    online: int

class BillingStats(BaseModel):
    total_revenue: float
    total_paid_orders: int
    average_order_value: float
    payment_methods: PaymentMethodBreakdown
    pending_bills: int
    failed_bills: int

# ============ Reservation Schemas ============
class ReservationBase(BaseModel):
    customer_name: str
    customer_email: Optional[EmailStr] = None
    customer_phone: str
    reservation_date: datetime
    time_slot: str  # e.g., "14:00", "19:30"
    duration: int = Field(default=90, gt=0)  # in minutes
    guests: int = Field(gt=0)
    special_requests: Optional[str] = None

class ReservationCreate(ReservationBase):
    table_id: Optional[int] = None

class ReservationUpdate(BaseModel):
    table_id: Optional[int] = None
    customer_name: Optional[str] = None
    customer_email: Optional[EmailStr] = None
    customer_phone: Optional[str] = None
    reservation_date: Optional[datetime] = None
    time_slot: Optional[str] = None
    duration: Optional[int] = Field(None, gt=0)
    guests: Optional[int] = Field(None, gt=0)
    status: Optional[ReservationStatus] = None
    special_requests: Optional[str] = None

class Reservation(ReservationBase):
    id: int
    user_id: Optional[int] = None
    table_id: Optional[int] = None
    status: ReservationStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    confirmed_at: Optional[datetime] = None
    seated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    table: Optional[Table] = None
    
    class Config:
        from_attributes = True

# ============ Availability Schemas ============
class TimeSlotAvailability(BaseModel):
    time_slot: str
    available_tables: int
    total_capacity: int
    is_available: bool

class AvailabilityRequest(BaseModel):
    date: datetime
    guests: int
    duration: int = Field(default=90, gt=0)

class AvailabilityResponse(BaseModel):
    date: datetime
    slots: List[TimeSlotAvailability]

# ============ Bill Schemas ============
class BillBase(BaseModel):
    order_id: int
    tax_percentage: float = Field(default=5.0, ge=0, le=100)
    notes: Optional[str] = None

class BillCreate(BillBase):
    pass

class BillUpdate(BaseModel):
    payment_method: Optional[PaymentMethod] = None
    payment_status: Optional[PaymentStatus] = None
    notes: Optional[str] = None

class ApplyCouponRequest(BaseModel):
    coupon_code: str

class SplitBillRequest(BaseModel):
    split_count: int = Field(gt=0, le=20)

class Bill(BillBase):
    id: int
    subtotal: float
    tax: float
    discount: float
    coupon_id: Optional[int] = None
    total: float
    payment_method: Optional[PaymentMethod] = None
    payment_status: PaymentStatus
    split_count: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class BillWithDetails(Bill):
    order: Optional[Order] = None
    amount_per_person: Optional[float] = None

# ============ Coupon Schemas ============
class CouponBase(BaseModel):
    code: str = Field(min_length=3, max_length=50)
    description: Optional[str] = None
    type: CouponType
    value: float = Field(gt=0)
    min_order_value: float = Field(default=0.0, ge=0)
    max_discount: Optional[float] = Field(None, gt=0)
    max_uses: Optional[int] = Field(None, gt=0)
    expiry_date: Optional[datetime] = None
    active: bool = True

class CouponCreate(CouponBase):
    pass

class CouponUpdate(BaseModel):
    description: Optional[str] = None
    value: Optional[float] = Field(None, gt=0)
    min_order_value: Optional[float] = Field(None, ge=0)
    max_discount: Optional[float] = Field(None, gt=0)
    max_uses: Optional[int] = Field(None, gt=0)
    expiry_date: Optional[datetime] = None
    active: Optional[bool] = None

class Coupon(CouponBase):
    id: int
    current_uses: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class CouponValidationRequest(BaseModel):
    code: str
    order_total: float

class CouponValidationResponse(BaseModel):
    valid: bool
    message: str
    discount_amount: Optional[float] = None
    coupon: Optional[Coupon] = None

class CouponStats(BaseModel):
    total_coupons: int
    active_coupons: int
    total_redemptions: int
    total_discount_given: float

# ============ Review Schemas ============
class ReviewBase(BaseModel):
    menu_item_id: int
    rating: int = Field(ge=1, le=5)
    title: Optional[str] = Field(None, max_length=200)
    comment: Optional[str] = None
    customer_name: Optional[str] = None

class ReviewCreate(ReviewBase):
    pass

class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    title: Optional[str] = Field(None, max_length=200)
    comment: Optional[str] = None

class ReviewModerationUpdate(BaseModel):
    status: ReviewStatus

class Review(ReviewBase):
    id: int
    user_id: Optional[int] = None
    status: ReviewStatus
    helpful_count: int
    moderated_by: Optional[int] = None
    moderated_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    menu_item: Optional[MenuItem] = None
    
    class Config:
        from_attributes = True

class ReviewStats(BaseModel):
    total_reviews: int
    pending_reviews: int
    approved_reviews: int
    rejected_reviews: int
    average_rating: float

class MenuItemRating(BaseModel):
    menu_item_id: int
    average_rating: float
    total_reviews: int
    rating_distribution: dict  # {1: count, 2: count, ...}

# ============ Analytics Schemas ============
class DashboardStats(BaseModel):
    total_revenue: float
    total_orders: int
    average_order_value: float
    revenue_change_percent: float
    orders_change_percent: float
    top_selling_item: Optional[str] = None
    active_tables: int
    pending_orders: int

class RevenueTrendPoint(BaseModel):
    date: str
    revenue: float
    orders_count: int

class RevenueTrend(BaseModel):
    data: List[RevenueTrendPoint]
    total_revenue: float
    total_orders: int
    period: str  # "daily", "weekly", "monthly"

class PopularItem(BaseModel):
    menu_item_id: int
    name: str
    category: str
    total_quantity: int
    total_revenue: float
    order_count: int

class PopularItemsResponse(BaseModel):
    items: List[PopularItem]
    total_items: int

class OrdersByHourPoint(BaseModel):
    hour: int
    order_count: int
    revenue: float

class OrdersByHourResponse(BaseModel):
    data: List[OrdersByHourPoint]
    peak_hour: int
    peak_orders: int

class CategoryPerformance(BaseModel):
    category: str
    total_revenue: float
    total_quantity: int
    order_count: int
    percentage_of_total: float

class CategoryPerformanceResponse(BaseModel):
    categories: List[CategoryPerformance]
    total_revenue: float

class PaymentMethodStats(BaseModel):
    payment_method: str
    count: int
    total_amount: float
    percentage: float

class PaymentMethodsResponse(BaseModel):
    data: List[PaymentMethodStats]
    total_transactions: int

# ============ Advanced Analytics Schemas ============
class StaffPerformance(BaseModel):
    staff_id: int
    staff_name: str
    total_orders: int
    total_revenue: float
    avg_service_time: float

class StaffPerformanceResponse(BaseModel):
    staff: List[StaffPerformance]
    total_staff: int

class TableUtilization(BaseModel):
    table_id: int
    table_number: int
    capacity: int
    total_orders: int
    total_revenue: float
    avg_occupancy_time: float
    utilization_rate: float

class TableUtilizationResponse(BaseModel):
    tables: List[TableUtilization]
    total_tables: int

class TopCustomer(BaseModel):
    customer_name: str
    total_orders: int
    total_spent: float

class CustomerInsightsResponse(BaseModel):
    total_customers: int
    repeat_customers: int
    new_customers: int
    avg_orders_per_customer: float
    retention_rate: float
    top_customers: List[TopCustomer]

class ForecastPoint(BaseModel):
    date: str
    forecasted_revenue: float
    confidence: float

class RevenueForecastResponse(BaseModel):
    forecast: List[ForecastPoint]
    avg_daily_revenue: float
    forecast_days: int

class HourData(BaseModel):
    hour: int
    order_count: int
    revenue: float

class DayPeakHours(BaseModel):
    day_name: str
    hours: List[HourData]
    peak_hour: int
    peak_orders: int

class PeakHoursDetailedResponse(BaseModel):
    days: List[DayPeakHours]

class MenuItemPerformance(BaseModel):
    item_id: int
    name: str
    category: str
    price: float
    total_sold: int
    total_revenue: float
    order_count: int
    avg_quantity_per_order: float
    revenue_percentage: float

class UnderperformingItem(BaseModel):
    item_id: int
    name: str
    category: str

class MenuPerformanceResponse(BaseModel):
    items: List[MenuItemPerformance]
    underperforming_items: List[UnderperformingItem]
    total_items_analyzed: int
    total_revenue: float

# ============ QR Code Schemas ============
class QRCodeData(BaseModel):
    table_id: int
    table_number: int
    url: str
    qr_data: str

class QRCodeBatchRequest(BaseModel):
    table_ids: List[int]

class QRCodeBatchResponse(BaseModel):
    qr_codes: List[QRCodeData]

class QRCheckInRequest(BaseModel):
    customer_name: Optional[str] = None
    guest_count: Optional[int] = 1

class QRCheckInResponse(BaseModel):
    success: bool
    message: str
    table_id: int
    table_number: int

# ============ Shift Schemas ============
class ShiftBase(BaseModel):
    employee_id: int
    date: date
    shift_type: str  # morning, afternoon, evening, night
    start_time: time
    end_time: time

class ShiftCreate(ShiftBase):
    pass

class ShiftUpdate(BaseModel):
    date: Optional[date] = None
    shift_type: Optional[str] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None

class Shift(ShiftBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    employee: Optional[User] = None
    
    class Config:
        from_attributes = True

class ShiftConflict(BaseModel):
    has_conflict: bool
    conflicting_shifts: List[Shift] = []
    message: str

class WeeklySchedule(BaseModel):
    week_start: date
    week_end: date
    shifts: List[Shift]
    employees: List[User]

# ============ Menu Item Toggle Schema ============
class MenuItemToggle(BaseModel):
    is_available: bool

# ============ Message Schemas ============
class MessageCreate(BaseModel):
    recipient_id: Optional[int] = None
    recipient_role: Optional[str] = None
    message: str
    type: str = "info"

class Message(BaseModel):
    id: int
    sender_id: int
    recipient_id: Optional[int] = None
    recipient_role: Optional[str] = None
    message: str
    type: str
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None
    sender: Optional[User] = None
    recipient: Optional[User] = None
    
    class Config:
        from_attributes = True

# ============ Shift Handover Schemas ============
class ShiftHandoverCreate(BaseModel):
    chef_id: Optional[int] = None
    shift_date: date
    shift_type: str
    prep_work_completed: str
    low_stock_items: str
    pending_tasks: str
    incidents: Optional[str] = None

class ShiftHandover(BaseModel):
    id: int
    chef_id: int
    shift_date: date
    shift_type: str
    prep_work_completed: str
    low_stock_items: str
    pending_tasks: str
    incidents: Optional[str] = None
    created_at: datetime
    chef: Optional[User] = None
    
    class Config:
        from_attributes = True

# ============ Service Request Schemas ============
class ServiceRequestCreate(BaseModel):
    table_id: int
    request_type: str
    description: Optional[str] = None
    priority: str = "normal"

class ServiceRequestUpdate(BaseModel):
    staff_id: Optional[int] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class ServiceRequest(BaseModel):
    id: int
    table_id: int
    staff_id: Optional[int] = None
    request_type: str
    description: Optional[str] = None
    priority: str
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    notes: Optional[str] = None
    table: Optional[Table] = None
    staff: Optional[User] = None
    
    class Config:
        from_attributes = True

# ============ Staff Order Stats Schema ============
class StaffOrderStats(BaseModel):
    total_orders: int
    pending_orders: int
    preparing_orders: int
    ready_orders: int
    served_orders: int
    my_tables_orders: int
    average_service_time: float

# ============ Customer Schemas ============
class CustomerCreate(BaseModel):
    user_id: Optional[int] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    loyalty_points: int = 0

class CustomerUpdate(BaseModel):
    phone: Optional[str] = None
    address: Optional[str] = None

class Customer(BaseModel):
    id: int
    user_id: Optional[int] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    total_orders: int = 0
    total_spent: float = 0.0
    loyalty_points: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# ============ Favorite Schemas ============
class FavoriteCreate(BaseModel):
    menu_item_id: int

class Favorite(BaseModel):
    id: int
    customer_id: int
    menu_item_id: int
    created_at: datetime
    menu_item: Optional[MenuItem] = None
    
    class Config:
        from_attributes = True

# ============ Customer Order Schemas ============
class CustomerOrderItemCreate(BaseModel):
    menu_item_id: int
    quantity: int = Field(gt=0)
    special_instructions: Optional[str] = None

class CustomerOrderCreate(BaseModel):
    table_id: Optional[int] = None
    customer_name: Optional[str] = None
    special_notes: Optional[str] = None
    items: List[CustomerOrderItemCreate]


# ==================== INVENTORY SCHEMAS (Phase 2) ====================

# ============ Supplier Schemas ============
class SupplierBase(BaseModel):
    name: str
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    is_active: bool = True

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None

class Supplier(SupplierBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# ============ Inventory Item Schemas ============
class InventoryItemBase(BaseModel):
    name: str
    category: Optional[str] = None
    unit: Optional[str] = None
    current_quantity: float = 0
    min_quantity: float = 0
    max_quantity: Optional[float] = None
    unit_cost: Optional[float] = None
    supplier_id: Optional[int] = None
    location: Optional[str] = None
    is_active: bool = True

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    current_quantity: Optional[float] = None
    min_quantity: Optional[float] = None
    max_quantity: Optional[float] = None
    unit_cost: Optional[float] = None
    supplier_id: Optional[int] = None
    location: Optional[str] = None
    is_active: Optional[bool] = None

class InventoryItem(InventoryItemBase):
    id: int
    last_restocked: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    supplier: Optional[Supplier] = None
    
    class Config:
        from_attributes = True


# ============ Inventory Transaction Schemas ============
class InventoryTransactionBase(BaseModel):
    inventory_item_id: int
    transaction_type: str  # purchase, usage, wastage, adjustment
    quantity: float
    unit_cost: Optional[float] = None
    reference_type: Optional[str] = None  # order, purchase, adjustment
    reference_id: Optional[int] = None
    notes: Optional[str] = None

class InventoryTransactionCreate(InventoryTransactionBase):
    performed_by: Optional[int] = None

class InventoryTransaction(InventoryTransactionBase):
    id: int
    performed_by: Optional[int] = None
    created_at: datetime
    inventory_item: Optional[InventoryItem] = None
    
    class Config:
        from_attributes = True


# ============ Menu Item Recipe Schemas ============
class MenuItemRecipeBase(BaseModel):
    menu_item_id: int
    inventory_item_id: int
    quantity_required: float

class MenuItemRecipeCreate(MenuItemRecipeBase):
    pass

class MenuItemRecipeUpdate(BaseModel):
    quantity_required: Optional[float] = None

class MenuItemRecipe(MenuItemRecipeBase):
    id: int
    created_at: datetime
    menu_item: Optional[MenuItem] = None
    inventory_item: Optional[InventoryItem] = None
    
    class Config:
        from_attributes = True


# ============ Purchase Order Schemas ============
class PurchaseOrderItemBase(BaseModel):
    inventory_item_id: int
    quantity: float
    unit_cost: float

class PurchaseOrderItemCreate(PurchaseOrderItemBase):
    pass

class PurchaseOrderItem(PurchaseOrderItemBase):
    id: int
    purchase_order_id: int
    received_quantity: float = 0
    created_at: datetime
    inventory_item: Optional[InventoryItem] = None
    
    class Config:
        from_attributes = True

class PurchaseOrderBase(BaseModel):
    supplier_id: int
    expected_delivery: Optional[datetime] = None
    notes: Optional[str] = None

class PurchaseOrderCreate(PurchaseOrderBase):
    items: List[PurchaseOrderItemCreate]

class PurchaseOrderUpdate(BaseModel):
    status: Optional[str] = None  # pending, confirmed, received, cancelled
    expected_delivery: Optional[datetime] = None
    actual_delivery: Optional[datetime] = None
    notes: Optional[str] = None

class PurchaseOrder(PurchaseOrderBase):
    id: int
    po_number: str
    status: str
    order_date: datetime
    actual_delivery: Optional[datetime] = None
    total_cost: Optional[float] = None
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    supplier: Optional[Supplier] = None
    items: List[PurchaseOrderItem] = []
    
    class Config:
        from_attributes = True


# ============ Inventory Analytics Schemas ============
class LowStockAlert(BaseModel):
    item_id: int
    item_name: str
    category: str
    current_quantity: float
    min_quantity: float
    unit: str
    status: str  # critical, low, warning

class InventoryStats(BaseModel):
    total_items: int
    total_value: float
    low_stock_count: int
    out_of_stock_count: int
    total_suppliers: int
    pending_purchase_orders: int

# ============ Notification & Campaign Schemas (Phase 3) ============

class EmailCampaign(BaseModel):
    subject: str
    title: str
    subtitle: Optional[str] = None
    description: Optional[str] = None
    offer_details: Optional[List[str]] = []
    cta_text: Optional[str] = "Order Now"
    cta_link: Optional[str] = "http://localhost:5173"
    valid_until: Optional[str] = None
    image_url: Optional[str] = None
    recipient_filter: str = "all"  # all, customers, specific
    recipient_emails: Optional[List[str]] = []

class SMSCampaign(BaseModel):
    message: str
    recipient_filter: str = "all"  # all, customers, specific
    recipient_phones: Optional[List[str]] = []

class CustomerContact(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    
    class Config:
        from_attributes = True


# ============ PHASE 4: Enhanced User Features Schemas ============

# Customer Profile Schemas
class CustomerProfileBase(BaseModel):
    date_of_birth: Optional[date] = None
    dietary_preferences: Optional[str] = None  # JSON string
    allergies: Optional[str] = None  # JSON string
    preferred_payment_method: Optional[str] = None

class CustomerProfileCreate(CustomerProfileBase):
    pass

class CustomerProfileUpdate(CustomerProfileBase):
    phone_verified: Optional[bool] = None
    email_verified: Optional[bool] = None

class CustomerProfile(CustomerProfileBase):
    id: int
    user_id: int
    phone_verified: bool
    email_verified: bool
    favorite_items: Optional[str] = None
    default_address_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Customer Address Schemas
class CustomerAddressBase(BaseModel):
    label: Optional[str] = None
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: str = "India"
    delivery_instructions: Optional[str] = None

class CustomerAddressCreate(CustomerAddressBase):
    is_default: bool = False

class CustomerAddressUpdate(BaseModel):
    label: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    delivery_instructions: Optional[str] = None
    is_default: Optional[bool] = None

class CustomerAddress(CustomerAddressBase):
    id: int
    customer_id: int
    is_default: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Loyalty Account Schemas
class LoyaltyAccountBase(BaseModel):
    points_balance: int = 0
    tier_level: str = "bronze"

class LoyaltyAccount(LoyaltyAccountBase):
    id: int
    customer_id: int
    lifetime_points: int
    tier_valid_until: Optional[datetime] = None
    total_spent: float
    total_orders: int
    referral_code: Optional[str] = None
    referred_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class LoyaltyTransactionBase(BaseModel):
    transaction_type: str  # earn, redeem, expire, bonus, referral
    points_change: int
    description: Optional[str] = None

class LoyaltyTransactionCreate(LoyaltyTransactionBase):
    reference_type: Optional[str] = None
    reference_id: Optional[int] = None

class LoyaltyTransaction(LoyaltyTransactionBase):
    id: int
    loyalty_account_id: int
    reference_type: Optional[str] = None
    reference_id: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class RedeemPointsRequest(BaseModel):
    points: int = Field(gt=0)
    order_id: Optional[int] = None

class TierInfo(BaseModel):
    tier_name: str
    min_points: int
    max_points: Optional[int] = None
    discount_percentage: float
    benefits: List[str]

# Review Schemas
class ReviewBase(BaseModel):
    menu_item_id: int
    rating: int = Field(ge=1, le=5)
    title: Optional[str] = None
    comment: Optional[str] = None

class ReviewCreate(ReviewBase):
    order_id: Optional[int] = None

class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    title: Optional[str] = None
    comment: Optional[str] = None

class ReviewWithPhotos(ReviewBase):
    id: int
    user_id: int
    order_id: Optional[int] = None
    photos: Optional[str] = None
    is_verified_purchase: bool
    helpful_count: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ReviewResponse(BaseModel):
    review: ReviewWithPhotos
    user_name: str
    can_edit: bool = False

# Recurring Reservation Schemas
class RecurringReservationBase(BaseModel):
    pattern_type: str  # weekly, biweekly, monthly
    day_of_week: Optional[int] = Field(None, ge=0, le=6)  # 0=Monday, 6=Sunday
    time: time
    guests: int = Field(gt=0)
    special_requests: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None

class RecurringReservationCreate(RecurringReservationBase):
    pass

class RecurringReservationUpdate(BaseModel):
    pattern_type: Optional[str] = None
    day_of_week: Optional[int] = Field(None, ge=0, le=6)
    time: Optional[time] = None
    guests: Optional[int] = Field(None, gt=0)
    special_requests: Optional[str] = None
    is_active: Optional[bool] = None
    end_date: Optional[date] = None

class RecurringReservation(RecurringReservationBase):
    id: int
    user_id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Complete Profile Response (combines User + CustomerProfile + Loyalty)
class CompleteProfileResponse(BaseModel):
    user: User
    profile: Optional[CustomerProfile] = None
    addresses: List[CustomerAddress] = []
    loyalty: Optional[LoyaltyAccount] = None
    favorites_count: int = 0


# ==================== PHASE 5: KITCHEN DISPLAY SYSTEM SCHEMAS ====================

from .models import PrepStatus, StationType, KitchenStatus

# Kitchen Station Schemas
class KitchenStationBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    station_type: str  # StationType
    is_active: bool = True
    display_order: int = 0
    max_concurrent_orders: int = 10
    average_prep_time: Optional[int] = None  # minutes

class KitchenStationCreate(KitchenStationBase):
    pass

class KitchenStationUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None
    max_concurrent_orders: Optional[int] = None
    average_prep_time: Optional[int] = None

class KitchenStation(KitchenStationBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Station Assignment Schemas
class StationAssignmentBase(BaseModel):
    chef_id: int
    station_id: int
    shift_start: datetime
    shift_end: Optional[datetime] = None
    is_primary: bool = False

class StationAssignmentCreate(StationAssignmentBase):
    pass

class StationAssignment(StationAssignmentBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Order Item KDS Schemas
class OrderItemKDSUpdate(BaseModel):
    station_id: Optional[int] = None
    priority: Optional[int] = None
    prep_status: Optional[str] = None  # PrepStatus
    assigned_chef_id: Optional[int] = None
    preparation_notes: Optional[str] = None
    estimated_prep_time: Optional[int] = None

class OrderItemKDS(BaseModel):
    id: int
    order_id: int
    menu_item_id: int
    menu_item_name: str
    quantity: int
    price: float
    special_instructions: Optional[str] = None
    station_id: Optional[int] = None
    station_name: Optional[str] = None
    priority: int = 0
    prep_status: str = "pending"
    prep_start_time: Optional[datetime] = None
    prep_end_time: Optional[datetime] = None
    assigned_chef_id: Optional[int] = None
    assigned_chef_name: Optional[str] = None
    preparation_notes: Optional[str] = None
    estimated_prep_time: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Order KDS View
class OrderKDS(BaseModel):
    id: int
    table_number: Optional[int] = None
    customer_name: Optional[str] = None
    status: str
    kitchen_status: str = "pending"
    total_amount: float
    special_notes: Optional[str] = None
    created_at: datetime
    kitchen_received_at: Optional[datetime] = None
    all_items_ready_at: Optional[datetime] = None
    order_items: List[OrderItemKDS] = []
    
    class Config:
        from_attributes = True

# Station Performance
class StationPerformance(BaseModel):
    station_id: int
    station_name: str
    active_orders: int
    pending_items: int
    preparing_items: int
    ready_items: int
    avg_prep_time_minutes: Optional[float] = None
    items_completed_today: int
    on_time_percentage: Optional[float] = None

# KDS Dashboard Stats
class KDSDashboardStats(BaseModel):
    total_active_orders: int
    total_pending_items: int
    total_preparing_items: int
    total_ready_items: int
    stations: List[StationPerformance]
    oldest_pending_order: Optional[OrderKDS] = None
    average_ticket_time_minutes: Optional[float] = None

# Display Settings
class TicketDisplaySettingsBase(BaseModel):
    font_size: str = "medium"  # small, medium, large
    show_customer_names: bool = True
    show_ticket_times: bool = True
    show_special_requests: bool = True
    auto_bump_completed: bool = False
    bump_delay_seconds: int = 0
    alert_threshold_minutes: int = 15

class TicketDisplaySettingsUpdate(TicketDisplaySettingsBase):
    pass

class TicketDisplaySettings(TicketDisplaySettingsBase):
    id: int
    station_id: Optional[int] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Performance Log
class PerformanceLogCreate(BaseModel):
    station_id: int
    order_item_id: int
    action: str  # started, completed, delayed, bumped
    chef_id: Optional[int] = None
    duration_seconds: Optional[int] = None
    notes: Optional[str] = None

class PerformanceLog(PerformanceLogCreate):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Bump Order Request
class BumpOrderRequest(BaseModel):
    order_id: int
    station_id: Optional[int] = None  # If provided, only bump items from this station

# Reassign Item Request
class ReassignItemRequest(BaseModel):
    order_item_id: int
    new_station_id: int
    new_chef_id: Optional[int] = None
    reason: Optional[str] = None
