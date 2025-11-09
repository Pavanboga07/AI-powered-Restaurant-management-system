from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import qrcode
import io
import base64
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/qr", tags=["qr"])

def generate_qr_code(data: str) -> str:
    """Generate QR code and return as base64 string"""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    
    # Convert to base64
    img_base64 = base64.b64encode(buffer.getvalue()).decode()
    return f"data:image/png;base64,{img_base64}"

@router.get("/table/{table_id}", response_model=schemas.QRCodeData)
async def get_table_qr(table_id: int, db: Session = Depends(get_db)):
    """Generate QR code for a specific table"""
    table = db.query(models.Table).filter(models.Table.id == table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    # Generate URL that customers will scan
    base_url = "http://localhost:5173"  # Frontend URL
    url = f"{base_url}/qr-menu?table={table.id}"
    
    # Generate QR code
    qr_data = generate_qr_code(url)
    
    return schemas.QRCodeData(
        table_id=table.id,
        table_number=table.table_number,
        url=url,
        qr_data=qr_data
    )

@router.post("/batch", response_model=schemas.QRCodeBatchResponse)
async def generate_batch_qr(
    request: schemas.QRCodeBatchRequest,
    db: Session = Depends(get_db)
):
    """Generate QR codes for multiple tables"""
    qr_codes = []
    
    for table_id in request.table_ids:
        table = db.query(models.Table).filter(models.Table.id == table_id).first()
        if not table:
            continue
        
        base_url = "http://localhost:5173"
        url = f"{base_url}/qr-menu?table={table.id}"
        qr_data = generate_qr_code(url)
        
        qr_codes.append(schemas.QRCodeData(
            table_id=table.id,
            table_number=table.table_number,
            url=url,
            qr_data=qr_data
        ))
    
    return schemas.QRCodeBatchResponse(qr_codes=qr_codes)

@router.post("/checkin/{table_id}", response_model=schemas.QRCheckInResponse)
async def checkin_table(
    table_id: int,
    request: schemas.QRCheckInRequest,
    db: Session = Depends(get_db)
):
    """Public endpoint for customers to check-in via QR code"""
    table = db.query(models.Table).filter(models.Table.id == table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    # Update table status if needed
    if table.status == models.TableStatus.available:
        table.status = models.TableStatus.occupied
        db.commit()
        db.refresh(table)
    
    return schemas.QRCheckInResponse(
        success=True,
        message=f"Welcome! You've checked in to Table {table.table_number}",
        table_id=table.id,
        table_number=table.table_number
    )
