"""
Inventory Management API Router (Phase 2)
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from .. import schemas, models
from ..database import get_db
from ..crud import inventory as crud_inventory
from .auth import get_current_user, require_role

router = APIRouter(prefix="/api/inventory", tags=["Inventory Management"])


# ==================== SUPPLIER ENDPOINTS ====================

@router.post("/suppliers", response_model=schemas.Supplier, status_code=status.HTTP_201_CREATED)
def create_supplier(
    supplier: schemas.SupplierCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["manager", "admin"]))
):
    """Create a new supplier (Manager/Admin only)"""
    return crud_inventory.create_supplier(db, supplier)


@router.get("/suppliers", response_model=List[schemas.Supplier])
def get_suppliers(
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get list of suppliers"""
    return crud_inventory.get_suppliers(db, skip, limit, is_active)


@router.get("/suppliers/{supplier_id}", response_model=schemas.Supplier)
def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get supplier by ID"""
    supplier = crud_inventory.get_supplier(db, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier


@router.put("/suppliers/{supplier_id}", response_model=schemas.Supplier)
def update_supplier(
    supplier_id: int,
    supplier: schemas.SupplierUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["manager", "admin"]))
):
    """Update supplier information (Manager/Admin only)"""
    updated_supplier = crud_inventory.update_supplier(db, supplier_id, supplier)
    if not updated_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return updated_supplier


@router.delete("/suppliers/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["manager", "admin"]))
):
    """Deactivate supplier (Manager/Admin only)"""
    if not crud_inventory.delete_supplier(db, supplier_id):
        raise HTTPException(status_code=404, detail="Supplier not found")
    return None


# ==================== INVENTORY ITEM ENDPOINTS ====================

@router.post("/items", response_model=schemas.InventoryItem, status_code=status.HTTP_201_CREATED)
def create_inventory_item(
    item: schemas.InventoryItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["manager", "admin"]))
):
    """Create a new inventory item (Manager/Admin only)"""
    return crud_inventory.create_inventory_item(db, item)


@router.get("/items", response_model=List[schemas.InventoryItem])
def get_inventory_items(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get list of inventory items with optional filters"""
    return crud_inventory.get_inventory_items(db, skip, limit, category, is_active, search)


@router.get("/items/low-stock", response_model=List[schemas.InventoryItem])
def get_low_stock_items(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get items with stock below minimum quantity"""
    return crud_inventory.get_low_stock_items(db)


@router.get("/items/{item_id}", response_model=schemas.InventoryItem)
def get_inventory_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get inventory item by ID"""
    item = crud_inventory.get_inventory_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return item


@router.put("/items/{item_id}", response_model=schemas.InventoryItem)
def update_inventory_item(
    item_id: int,
    item: schemas.InventoryItemUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["manager", "admin"]))
):
    """Update inventory item (Manager/Admin only)"""
    updated_item = crud_inventory.update_inventory_item(db, item_id, item)
    if not updated_item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return updated_item


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["manager", "admin"]))
):
    """Deactivate inventory item (Manager/Admin only)"""
    if not crud_inventory.delete_inventory_item(db, item_id):
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return None


# ==================== INVENTORY TRANSACTION ENDPOINTS ====================

@router.post("/transactions", response_model=schemas.InventoryTransaction, status_code=status.HTTP_201_CREATED)
def create_inventory_transaction(
    transaction: schemas.InventoryTransactionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["manager", "admin", "chef"]))
):
    """Create a new inventory transaction (Manager/Admin/Chef)"""
    # Set performed_by to current user
    transaction.performed_by = current_user.id
    return crud_inventory.create_inventory_transaction(db, transaction)


@router.get("/transactions", response_model=List[schemas.InventoryTransaction])
def get_inventory_transactions(
    skip: int = 0,
    limit: int = 100,
    item_id: Optional[int] = None,
    transaction_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get list of inventory transactions with optional filters"""
    return crud_inventory.get_inventory_transactions(
        db, skip, limit, item_id, transaction_type, start_date, end_date
    )


@router.get("/transactions/{transaction_id}", response_model=schemas.InventoryTransaction)
def get_inventory_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get inventory transaction by ID"""
    transaction = crud_inventory.get_inventory_transaction(db, transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction


@router.get("/items/{item_id}/transactions", response_model=List[schemas.InventoryTransaction])
def get_item_transaction_history(
    item_id: int,
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get transaction history for a specific inventory item"""
    return crud_inventory.get_item_transaction_history(db, item_id, days)


# ==================== MENU ITEM RECIPE ENDPOINTS ====================

@router.post("/recipes", response_model=schemas.MenuItemRecipe, status_code=status.HTTP_201_CREATED)
def create_menu_item_recipe(
    recipe: schemas.MenuItemRecipeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["manager", "admin", "chef"]))
):
    """Create a new menu item recipe (Manager/Admin/Chef)"""
    return crud_inventory.create_menu_item_recipe(db, recipe)


@router.get("/recipes/menu-item/{menu_item_id}", response_model=List[schemas.MenuItemRecipe])
def get_menu_item_recipes(
    menu_item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all recipes (ingredients) for a menu item"""
    return crud_inventory.get_menu_item_recipes(db, menu_item_id)


@router.get("/recipes/inventory-item/{inventory_item_id}", response_model=List[schemas.MenuItemRecipe])
def get_inventory_item_recipes(
    inventory_item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all menu items that use this inventory item"""
    return crud_inventory.get_inventory_item_recipes(db, inventory_item_id)


@router.get("/recipes/{recipe_id}", response_model=schemas.MenuItemRecipe)
def get_menu_item_recipe(
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get menu item recipe by ID"""
    recipe = crud_inventory.get_menu_item_recipe(db, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return recipe


@router.put("/recipes/{recipe_id}", response_model=schemas.MenuItemRecipe)
def update_menu_item_recipe(
    recipe_id: int,
    recipe: schemas.MenuItemRecipeUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["manager", "admin", "chef"]))
):
    """Update menu item recipe (Manager/Admin/Chef)"""
    updated_recipe = crud_inventory.update_menu_item_recipe(db, recipe_id, recipe)
    if not updated_recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return updated_recipe


@router.delete("/recipes/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_menu_item_recipe(
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["manager", "admin", "chef"]))
):
    """Delete menu item recipe (Manager/Admin/Chef)"""
    if not crud_inventory.delete_menu_item_recipe(db, recipe_id):
        raise HTTPException(status_code=404, detail="Recipe not found")
    return None


# ==================== PURCHASE ORDER ENDPOINTS ====================

@router.post("/purchase-orders", response_model=schemas.PurchaseOrder, status_code=status.HTTP_201_CREATED)
def create_purchase_order(
    po: schemas.PurchaseOrderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["manager", "admin"]))
):
    """Create a new purchase order (Manager/Admin only)"""
    return crud_inventory.create_purchase_order(db, po, current_user.id)


@router.get("/purchase-orders", response_model=List[schemas.PurchaseOrder])
def get_purchase_orders(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    supplier_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get list of purchase orders with optional filters"""
    return crud_inventory.get_purchase_orders(db, skip, limit, status, supplier_id)


@router.get("/purchase-orders/{po_id}", response_model=schemas.PurchaseOrder)
def get_purchase_order(
    po_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get purchase order by ID"""
    po = crud_inventory.get_purchase_order(db, po_id)
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return po


@router.put("/purchase-orders/{po_id}", response_model=schemas.PurchaseOrder)
def update_purchase_order(
    po_id: int,
    po: schemas.PurchaseOrderUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["manager", "admin"]))
):
    """Update purchase order (Manager/Admin only)"""
    updated_po = crud_inventory.update_purchase_order(db, po_id, po)
    if not updated_po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return updated_po


@router.post("/purchase-orders/{po_id}/receive", response_model=schemas.PurchaseOrder)
def receive_purchase_order(
    po_id: int,
    received_items: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["manager", "admin"]))
):
    """Mark purchase order as received and update inventory (Manager/Admin only)
    
    Example received_items: {"1": 100.5, "2": 50.0} where keys are PO item IDs and values are received quantities
    """
    po = crud_inventory.receive_purchase_order(db, po_id, received_items)
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found or already received")
    return po


@router.post("/purchase-orders/{po_id}/cancel", response_model=schemas.PurchaseOrder)
def cancel_purchase_order(
    po_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["manager", "admin"]))
):
    """Cancel a purchase order (Manager/Admin only)"""
    po = crud_inventory.cancel_purchase_order(db, po_id)
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found or cannot be cancelled")
    return po


# ==================== ANALYTICS & UTILITY ENDPOINTS ====================

@router.get("/stats", response_model=schemas.InventoryStats)
def get_inventory_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get inventory statistics"""
    return crud_inventory.get_inventory_stats(db)


@router.get("/check-availability/{menu_item_id}")
def check_recipe_availability(
    menu_item_id: int,
    quantity: int = 1,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Check if enough inventory is available to prepare a menu item"""
    return crud_inventory.check_recipe_availability(db, menu_item_id, quantity)


@router.post("/deduct-for-order/{menu_item_id}")
def deduct_inventory_for_order(
    menu_item_id: int,
    quantity: int,
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["staff", "manager", "admin"]))
):
    """Deduct inventory items when an order is placed"""
    success = crud_inventory.deduct_inventory_for_order(
        db, menu_item_id, quantity, order_id, current_user.id
    )
    if not success:
        raise HTTPException(status_code=400, detail="Failed to deduct inventory")
    return {"message": "Inventory deducted successfully"}
