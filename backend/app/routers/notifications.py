from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db
from .auth import get_current_user, require_role
from ..services.email_service import email_service
from ..services.sms_service import sms_service

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

# ============ Send Promotional Email ============
@router.post("/email/promotional", status_code=status.HTTP_202_ACCEPTED)
async def send_promotional_email(
    campaign: schemas.EmailCampaign,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["manager", "admin"]))
):
    """Send promotional email to selected customers (Manager/Admin only)"""
    
    # Get recipients based on filter
    query = db.query(models.User).filter(models.User.is_active == True)
    
    if campaign.recipient_filter == "all":
        recipients = query.all()
    elif campaign.recipient_filter == "customers":
        recipients = query.filter(models.User.role == "customer").all()
    elif campaign.recipient_filter == "specific":
        if not campaign.recipient_emails:
            raise HTTPException(
                status_code=400,
                detail="Please provide recipient emails for specific filter"
            )
        recipients = query.filter(models.User.email.in_(campaign.recipient_emails)).all()
    else:
        raise HTTPException(status_code=400, detail="Invalid recipient filter")
    
    # Filter users who have email
    recipient_emails = [user.email for user in recipients if user.email]
    
    if not recipient_emails:
        raise HTTPException(status_code=400, detail="No valid recipients found")
    
    # Prepare campaign data
    campaign_data = {
        'title': campaign.title,
        'subtitle': campaign.subtitle or '',
        'description': campaign.description or '',
        'offer_details': campaign.offer_details or [],
        'cta_text': campaign.cta_text or 'Order Now',
        'cta_link': campaign.cta_link or 'http://localhost:5173',
        'valid_until': campaign.valid_until or '',
        'image_url': campaign.image_url or ''
    }
    
    # Send email in background
    background_tasks.add_task(
        email_service.send_promotional_email,
        recipients=recipient_emails,
        subject=campaign.subject,
        campaign_data=campaign_data
    )
    
    return {
        "success": True,
        "message": f"Promotional email queued for {len(recipient_emails)} recipients",
        "recipient_count": len(recipient_emails)
    }


# ============ Send Promotional SMS ============
@router.post("/sms/promotional", status_code=status.HTTP_202_ACCEPTED)
async def send_promotional_sms(
    sms_campaign: schemas.SMSCampaign,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["manager", "admin"]))
):
    """Send promotional SMS to selected customers (Manager/Admin only)"""
    
    # Get recipients based on filter
    query = db.query(models.User).filter(models.User.is_active == True)
    
    if sms_campaign.recipient_filter == "all":
        recipients = query.all()
    elif sms_campaign.recipient_filter == "customers":
        recipients = query.filter(models.User.role == "customer").all()
    elif sms_campaign.recipient_filter == "specific":
        if not sms_campaign.recipient_phones:
            raise HTTPException(
                status_code=400,
                detail="Please provide recipient phones for specific filter"
            )
        recipients = query.filter(models.User.phone.in_(sms_campaign.recipient_phones)).all()
    else:
        raise HTTPException(status_code=400, detail="Invalid recipient filter")
    
    # Filter users who have phone
    recipients_with_phone = [(user.phone, user.full_name or user.username) 
                              for user in recipients if user.phone]
    
    if not recipients_with_phone:
        raise HTTPException(status_code=400, detail="No valid recipients found")
    
    # Send SMS to each recipient in background
    for phone, name in recipients_with_phone:
        background_tasks.add_task(
            sms_service.send_promotional_sms,
            phone_number=phone,
            customer_name=name,
            offer_text=sms_campaign.message
        )
    
    return {
        "success": True,
        "message": f"Promotional SMS queued for {len(recipients_with_phone)} recipients",
        "recipient_count": len(recipients_with_phone)
    }


# ============ Get All Customers for Campaign ============
@router.get("/customers", response_model=List[schemas.CustomerContact])
async def get_customers_for_campaign(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["manager", "admin"]))
):
    """Get list of customers with contact information for campaign targeting"""
    customers = db.query(models.User).filter(
        models.User.role == "customer",
        models.User.is_active == True
    ).all()
    
    return [
        schemas.CustomerContact(
            id=customer.id,
            username=customer.username,
            full_name=customer.full_name,
            email=customer.email,
            phone=customer.phone
        )
        for customer in customers
    ]
