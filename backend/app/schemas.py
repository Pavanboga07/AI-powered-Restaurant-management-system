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
    preferences: Optional[str] = None
    loyalty_points: int = 0

class CustomerUpdate(BaseModel):
    phone: Optional[str] = None
    preferences: Optional[str] = None

class Customer(BaseModel):
    id: int
    user_id: Optional[int] = None
    phone: Optional[str] = None
    preferences: Optional[str] = None
    loyalty_points: int
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
