"""
CRUD operations for Inventory Management (Phase 2)
"""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_
from typing import List, Optional
from datetime import datetime, timedelta
import asyncio

from ..models import (
    Supplier, InventoryItem, InventoryTransaction, MenuItemRecipe,
    PurchaseOrder, PurchaseOrderItem
)
from ..schemas import (
    SupplierCreate, SupplierUpdate,
    InventoryItemCreate, InventoryItemUpdate,
    InventoryTransactionCreate,
    MenuItemRecipeCreate, MenuItemRecipeUpdate,
    PurchaseOrderCreate, PurchaseOrderUpdate, PurchaseOrderItemCreate
)
from ..websocket import broadcast_inventory_low


# ==================== HELPER FUNCTIONS ====================

async def check_and_alert_low_stock(db_item: InventoryItem):
    """Check if item is low stock and send WebSocket alert"""
    if db_item.current_quantity <= db_item.min_quantity and db_item.is_active:
        # Determine severity
        if db_item.current_quantity == 0:
            severity = "critical"
            status = "out_of_stock"
        elif db_item.current_quantity <= (db_item.min_quantity * 0.5):
            severity = "high"
            status = "critically_low"
        else:
            severity = "warning"
            status = "low_stock"
        
        # Prepare alert data
        alert_data = {
            "item_id": db_item.id,
            "item_name": db_item.name,
            "category": db_item.category,
            "current_quantity": db_item.current_quantity,
            "min_quantity": db_item.min_quantity,
            "unit": db_item.unit,
            "severity": severity,
            "status": status,
            "updated_at": datetime.now().isoformat()
        }
        
        # Send WebSocket alert
        try:
            await broadcast_inventory_low(alert_data)
        except Exception as e:
            print(f"Error sending WebSocket alert: {e}")


# ==================== SUPPLIER CRUD ====================

def create_supplier(db: Session, supplier: SupplierCreate):
    """Create a new supplier"""
    db_supplier = Supplier(**supplier.model_dump())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


def get_supplier(db: Session, supplier_id: int):
    """Get supplier by ID"""
    return db.query(Supplier).filter(Supplier.id == supplier_id).first()


def get_suppliers(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = None
):
    """Get list of suppliers with optional filtering"""
    query = db.query(Supplier)
    
    if is_active is not None:
        query = query.filter(Supplier.is_active == is_active)
    
    return query.offset(skip).limit(limit).all()


def update_supplier(db: Session, supplier_id: int, supplier: SupplierUpdate):
    """Update supplier information"""
    db_supplier = get_supplier(db, supplier_id)
    if not db_supplier:
        return None
    
    update_data = supplier.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_supplier, field, value)
    
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


def delete_supplier(db: Session, supplier_id: int):
    """Soft delete supplier (mark as inactive)"""
    db_supplier = get_supplier(db, supplier_id)
    if db_supplier:
        db_supplier.is_active = False
        db.commit()
        return True
    return False


# ==================== INVENTORY ITEM CRUD ====================

def create_inventory_item(db: Session, item: InventoryItemCreate):
    """Create a new inventory item"""
    db_item = InventoryItem(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


def get_inventory_item(db: Session, item_id: int):
    """Get inventory item by ID with supplier info"""
    return db.query(InventoryItem).options(
        joinedload(InventoryItem.supplier)
    ).filter(InventoryItem.id == item_id).first()


def get_inventory_items(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None
):
    """Get list of inventory items with optional filtering"""
    query = db.query(InventoryItem).options(joinedload(InventoryItem.supplier))
    
    if category:
        query = query.filter(InventoryItem.category == category)
    
    if is_active is not None:
        query = query.filter(InventoryItem.is_active == is_active)
    
    if search:
        query = query.filter(
            or_(
                InventoryItem.name.ilike(f"%{search}%"),
                InventoryItem.location.ilike(f"%{search}%")
            )
        )
    
    return query.offset(skip).limit(limit).all()


def get_low_stock_items(db: Session):
    """Get items with stock below minimum quantity"""
    return db.query(InventoryItem).filter(
        and_(
            InventoryItem.current_quantity <= InventoryItem.min_quantity,
            InventoryItem.is_active == True
        )
    ).all()


def update_inventory_item(db: Session, item_id: int, item: InventoryItemUpdate):
    """Update inventory item information"""
    db_item = get_inventory_item(db, item_id)
    if not db_item:
        return None
    
    update_data = item.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_item, field, value)
    
    db.commit()
    db.refresh(db_item)
    return db_item


def delete_inventory_item(db: Session, item_id: int):
    """Soft delete inventory item (mark as inactive)"""
    db_item = get_inventory_item(db, item_id)
    if db_item:
        db_item.is_active = False
        db.commit()
        return True
    return False


# ==================== INVENTORY TRANSACTION CRUD ====================

def create_inventory_transaction(db: Session, transaction: InventoryTransactionCreate):
    """Create a new inventory transaction and update stock"""
    # Create transaction
    db_transaction = InventoryTransaction(**transaction.model_dump())
    db.add(db_transaction)
    
    # Update inventory item quantity
    db_item = get_inventory_item(db, transaction.inventory_item_id)
    if db_item:
        old_quantity = db_item.current_quantity
        db_item.current_quantity += transaction.quantity
        
        # Update last_restocked if it's a purchase
        if transaction.transaction_type == "purchase":
            db_item.last_restocked = datetime.now()
        
        # Check if stock went below minimum and trigger alert
        if db_item.current_quantity <= db_item.min_quantity and old_quantity > db_item.min_quantity:
            # Stock just went below minimum, trigger alert
            asyncio.create_task(check_and_alert_low_stock(db_item))
    
    db.commit()
    db.refresh(db_transaction)
    return db_transaction


def get_inventory_transaction(db: Session, transaction_id: int):
    """Get inventory transaction by ID"""
    return db.query(InventoryTransaction).options(
        joinedload(InventoryTransaction.inventory_item)
    ).filter(InventoryTransaction.id == transaction_id).first()


def get_inventory_transactions(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    item_id: Optional[int] = None,
    transaction_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
):
    """Get list of inventory transactions with optional filtering"""
    query = db.query(InventoryTransaction).options(
        joinedload(InventoryTransaction.inventory_item)
    )
    
    if item_id:
        query = query.filter(InventoryTransaction.inventory_item_id == item_id)
    
    if transaction_type:
        query = query.filter(InventoryTransaction.transaction_type == transaction_type)
    
    if start_date:
        query = query.filter(InventoryTransaction.created_at >= start_date)
    
    if end_date:
        query = query.filter(InventoryTransaction.created_at <= end_date)
    
    return query.order_by(InventoryTransaction.created_at.desc()).offset(skip).limit(limit).all()


def get_item_transaction_history(db: Session, item_id: int, days: int = 30):
    """Get transaction history for a specific item"""
    start_date = datetime.now() - timedelta(days=days)
    return db.query(InventoryTransaction).filter(
        and_(
            InventoryTransaction.inventory_item_id == item_id,
            InventoryTransaction.created_at >= start_date
        )
    ).order_by(InventoryTransaction.created_at.desc()).all()


# ==================== MENU ITEM RECIPE CRUD ====================

def create_menu_item_recipe(db: Session, recipe: MenuItemRecipeCreate):
    """Create a new menu item recipe (ingredient)"""
    db_recipe = MenuItemRecipe(**recipe.model_dump())
    db.add(db_recipe)
    db.commit()
    db.refresh(db_recipe)
    return db_recipe


def get_menu_item_recipe(db: Session, recipe_id: int):
    """Get menu item recipe by ID"""
    return db.query(MenuItemRecipe).options(
        joinedload(MenuItemRecipe.menu_item),
        joinedload(MenuItemRecipe.inventory_item)
    ).filter(MenuItemRecipe.id == recipe_id).first()


def get_menu_item_recipes(db: Session, menu_item_id: int):
    """Get all recipes (ingredients) for a menu item"""
    return db.query(MenuItemRecipe).options(
        joinedload(MenuItemRecipe.inventory_item)
    ).filter(MenuItemRecipe.menu_item_id == menu_item_id).all()


def get_inventory_item_recipes(db: Session, inventory_item_id: int):
    """Get all menu items that use this inventory item"""
    return db.query(MenuItemRecipe).options(
        joinedload(MenuItemRecipe.menu_item)
    ).filter(MenuItemRecipe.inventory_item_id == inventory_item_id).all()


def update_menu_item_recipe(db: Session, recipe_id: int, recipe: MenuItemRecipeUpdate):
    """Update menu item recipe quantity"""
    db_recipe = get_menu_item_recipe(db, recipe_id)
    if not db_recipe:
        return None
    
    if recipe.quantity_required is not None:
        db_recipe.quantity_required = recipe.quantity_required
    
    db.commit()
    db.refresh(db_recipe)
    return db_recipe


def delete_menu_item_recipe(db: Session, recipe_id: int):
    """Delete menu item recipe"""
    db_recipe = get_menu_item_recipe(db, recipe_id)
    if db_recipe:
        db.delete(db_recipe)
        db.commit()
        return True
    return False


# ==================== PURCHASE ORDER CRUD ====================

def generate_po_number(db: Session):
    """Generate unique purchase order number"""
    # Get the latest PO number
    last_po = db.query(PurchaseOrder).order_by(
        PurchaseOrder.id.desc()
    ).first()
    
    if last_po and last_po.po_number:
        # Extract number and increment
        try:
            last_num = int(last_po.po_number.split('-')[1])
            new_num = last_num + 1
        except:
            new_num = 1
    else:
        new_num = 1
    
    return f"PO-{new_num:06d}"


def create_purchase_order(db: Session, po: PurchaseOrderCreate, created_by: int):
    """Create a new purchase order with items"""
    # Generate PO number
    po_number = generate_po_number(db)
    
    # Calculate total cost
    total_cost = sum(item.quantity * item.unit_cost for item in po.items)
    
    # Create purchase order
    po_data = po.model_dump(exclude={'items'})
    db_po = PurchaseOrder(
        po_number=po_number,
        total_cost=total_cost,
        created_by=created_by,
        **po_data
    )
    db.add(db_po)
    db.flush()  # Get the PO ID
    
    # Create purchase order items
    for item in po.items:
        db_item = PurchaseOrderItem(
            purchase_order_id=db_po.id,
            **item.model_dump()
        )
        db.add(db_item)
    
    db.commit()
    db.refresh(db_po)
    return db_po


def get_purchase_order(db: Session, po_id: int):
    """Get purchase order by ID with all related data"""
    return db.query(PurchaseOrder).options(
        joinedload(PurchaseOrder.supplier),
        joinedload(PurchaseOrder.items).joinedload(PurchaseOrderItem.inventory_item)
    ).filter(PurchaseOrder.id == po_id).first()


def get_purchase_orders(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    supplier_id: Optional[int] = None
):
    """Get list of purchase orders with optional filtering"""
    query = db.query(PurchaseOrder).options(
        joinedload(PurchaseOrder.supplier),
        joinedload(PurchaseOrder.items)
    )
    
    if status:
        query = query.filter(PurchaseOrder.status == status)
    
    if supplier_id:
        query = query.filter(PurchaseOrder.supplier_id == supplier_id)
    
    return query.order_by(PurchaseOrder.created_at.desc()).offset(skip).limit(limit).all()


def update_purchase_order(db: Session, po_id: int, po: PurchaseOrderUpdate):
    """Update purchase order status and details"""
    db_po = get_purchase_order(db, po_id)
    if not db_po:
        return None
    
    update_data = po.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_po, field, value)
    
    db.commit()
    db.refresh(db_po)
    return db_po


def receive_purchase_order(db: Session, po_id: int, received_items: dict):
    """Mark purchase order as received and update inventory"""
    db_po = get_purchase_order(db, po_id)
    if not db_po or db_po.status == "received":
        return None
    
    # Update PO status
    db_po.status = "received"
    db_po.actual_delivery = datetime.now()
    
    # Update each item's received quantity and inventory
    for item_id, received_qty in received_items.items():
        # Find the PO item
        po_item = next(
            (item for item in db_po.items if item.id == int(item_id)),
            None
        )
        
        if po_item:
            po_item.received_quantity = received_qty
            
            # Update inventory
            inventory_item = get_inventory_item(db, po_item.inventory_item_id)
            if inventory_item:
                inventory_item.current_quantity += received_qty
                inventory_item.last_restocked = datetime.now()
                
                # Create transaction record
                transaction = InventoryTransactionCreate(
                    inventory_item_id=po_item.inventory_item_id,
                    transaction_type="purchase",
                    quantity=received_qty,
                    unit_cost=po_item.unit_cost,
                    reference_type="purchase",
                    reference_id=po_id,
                    notes=f"Received from PO {db_po.po_number}"
                )
                create_inventory_transaction(db, transaction)
    
    db.commit()
    db.refresh(db_po)
    return db_po


def cancel_purchase_order(db: Session, po_id: int):
    """Cancel a purchase order"""
    db_po = get_purchase_order(db, po_id)
    if db_po and db_po.status == "pending":
        db_po.status = "cancelled"
        db.commit()
        db.refresh(db_po)
        return db_po
    return None


# ==================== INVENTORY ANALYTICS ====================

def get_inventory_stats(db: Session):
    """Get inventory statistics"""
    total_items = db.query(func.count(InventoryItem.id)).filter(
        InventoryItem.is_active == True
    ).scalar()
    
    total_value = db.query(
        func.sum(InventoryItem.current_quantity * InventoryItem.unit_cost)
    ).filter(InventoryItem.is_active == True).scalar() or 0
    
    low_stock_count = db.query(func.count(InventoryItem.id)).filter(
        and_(
            InventoryItem.current_quantity <= InventoryItem.min_quantity,
            InventoryItem.current_quantity > 0,
            InventoryItem.is_active == True
        )
    ).scalar()
    
    out_of_stock_count = db.query(func.count(InventoryItem.id)).filter(
        and_(
            InventoryItem.current_quantity == 0,
            InventoryItem.is_active == True
        )
    ).scalar()
    
    total_suppliers = db.query(func.count(Supplier.id)).filter(
        Supplier.is_active == True
    ).scalar()
    
    pending_purchase_orders = db.query(func.count(PurchaseOrder.id)).filter(
        PurchaseOrder.status == "pending"
    ).scalar()
    
    return {
        "total_items": total_items,
        "total_value": round(total_value, 2),
        "low_stock_count": low_stock_count,
        "out_of_stock_count": out_of_stock_count,
        "total_suppliers": total_suppliers,
        "pending_purchase_orders": pending_purchase_orders
    }


def check_recipe_availability(db: Session, menu_item_id: int, quantity: int = 1):
    """Check if enough inventory is available to prepare a menu item"""
    recipes = get_menu_item_recipes(db, menu_item_id)
    
    unavailable_items = []
    for recipe in recipes:
        required_qty = recipe.quantity_required * quantity
        if recipe.inventory_item.current_quantity < required_qty:
            unavailable_items.append({
                "item_name": recipe.inventory_item.name,
                "required": required_qty,
                "available": recipe.inventory_item.current_quantity,
                "unit": recipe.inventory_item.unit
            })
    
    return {
        "can_prepare": len(unavailable_items) == 0,
        "unavailable_items": unavailable_items
    }


def deduct_inventory_for_order(db: Session, menu_item_id: int, quantity: int, order_id: int, user_id: int):
    """Deduct inventory items when an order is placed"""
    recipes = get_menu_item_recipes(db, menu_item_id)
    
    for recipe in recipes:
        required_qty = recipe.quantity_required * quantity
        
        # Deduct from inventory
        inventory_item = get_inventory_item(db, recipe.inventory_item_id)
        if inventory_item and inventory_item.current_quantity >= required_qty:
            inventory_item.current_quantity -= required_qty
            
            # Create transaction record
            transaction = InventoryTransactionCreate(
                inventory_item_id=recipe.inventory_item_id,
                transaction_type="usage",
                quantity=-required_qty,
                reference_type="order",
                reference_id=order_id,
                notes=f"Used for order #{order_id}",
                performed_by=user_id
            )
            create_inventory_transaction(db, transaction)
    
    db.commit()
    return True
