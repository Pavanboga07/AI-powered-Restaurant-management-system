"""
WebSocket Manager for Real-Time Updates
Handles Socket.IO connections, rooms, and event broadcasting
"""
import socketio
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

# Create Socket.IO server with CORS support
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',  # In production, specify exact origins
    logger=True,
    engineio_logger=True
)

# Socket.IO ASGI app - note: we'll wrap the FastAPI app with this
socket_app = socketio.ASGIApp(
    sio,
    socketio_path='socket.io'  # This tells Socket.IO to handle /socket.io path
)

# Track connected users and their rooms
# Format: {sid: {"user_id": int, "role": str, "username": str}}
connected_users: Dict[str, Dict] = {}

# Room definitions
CHEF_ROOM = "chef_room"
STAFF_ROOM = "staff_room"
MANAGER_ROOM = "manager_room"
CUSTOMER_ROOM = "customer_room"

# Room mapping by role
ROOM_MAPPING = {
    "chef": CHEF_ROOM,
    "staff": STAFF_ROOM,
    "manager": MANAGER_ROOM,
    "admin": MANAGER_ROOM,  # Admins join manager room
    "customer": CUSTOMER_ROOM
}


@sio.event
async def connect(sid, environ, auth):
    """Handle client connection"""
    logger.info(f"Client connected: {sid}")
    await sio.emit('connection_established', {'sid': sid}, room=sid)
    return True


@sio.event
async def disconnect(sid):
    """Handle client disconnection"""
    if sid in connected_users:
        user_info = connected_users[sid]
        logger.info(f"User {user_info.get('username')} disconnected: {sid}")
        
        # Leave all rooms
        if user_info.get('role'):
            room = ROOM_MAPPING.get(user_info['role'])
            if room:
                await sio.leave_room(sid, room)
        
        # Remove from connected users
        del connected_users[sid]
    else:
        logger.info(f"Client disconnected: {sid}")


@sio.event
async def join_room(sid, data):
    """
    Join a room based on user role
    Expected data: {"user_id": int, "role": str, "username": str}
    """
    try:
        user_id = data.get('user_id')
        role = data.get('role')
        username = data.get('username')
        
        if not all([user_id, role, username]):
            await sio.emit('error', {'message': 'Missing required fields'}, room=sid)
            return
        
        # Store user info
        connected_users[sid] = {
            "user_id": user_id,
            "role": role,
            "username": username
        }
        
        # Join appropriate room based on role
        room = ROOM_MAPPING.get(role)
        if room:
            await sio.enter_room(sid, room)
            logger.info(f"User {username} ({role}) joined {room}")
            
            # Notify user of successful join
            await sio.emit('room_joined', {
                'room': room,
                'role': role,
                'message': f'Successfully joined {room}'
            }, room=sid)
            
            # Notify others in the room
            await sio.emit('user_joined', {
                'username': username,
                'role': role
            }, room=room, skip_sid=sid)
        else:
            await sio.emit('error', {'message': f'Invalid role: {role}'}, room=sid)
            
    except Exception as e:
        logger.error(f"Error in join_room: {e}")
        await sio.emit('error', {'message': 'Failed to join room'}, room=sid)


@sio.event
async def leave_room_handler(sid, data):
    """Leave a specific room"""
    try:
        room = data.get('room')
        if room and sid in connected_users:
            await sio.leave_room(sid, room)
            user_info = connected_users[sid]
            logger.info(f"User {user_info.get('username')} left {room}")
            
            await sio.emit('room_left', {
                'room': room,
                'message': f'Left {room}'
            }, room=sid)
    except Exception as e:
        logger.error(f"Error in leave_room: {e}")


# ============================================
# Event Broadcasting Functions
# ============================================

async def broadcast_new_order(order_data: dict):
    """
    Broadcast new order to chef room
    Args:
        order_data: Dict containing order details
    """
    try:
        await sio.emit('new_order', {
            'type': 'new_order',
            'order': order_data,
            'message': f"New order #{order_data.get('id')} received",
            'timestamp': order_data.get('created_at')
        }, room=CHEF_ROOM)
        
        logger.info(f"Broadcasted new_order event to {CHEF_ROOM}")
    except Exception as e:
        logger.error(f"Error broadcasting new_order: {e}")


async def broadcast_order_ready(order_data: dict):
    """
    Broadcast order ready to staff room
    Args:
        order_data: Dict containing order details
    """
    try:
        await sio.emit('order_ready', {
            'type': 'order_ready',
            'order': order_data,
            'message': f"Order #{order_data.get('id')} is ready for delivery",
            'timestamp': order_data.get('updated_at')
        }, room=STAFF_ROOM)
        
        logger.info(f"Broadcasted order_ready event to {STAFF_ROOM}")
    except Exception as e:
        logger.error(f"Error broadcasting order_ready: {e}")


async def broadcast_inventory_low(inventory_data: dict):
    """
    Broadcast low inventory alert to manager room and chef room
    Args:
        inventory_data: Dict containing inventory details
    """
    try:
        event_data = {
            'type': 'inventory_low',
            'inventory': inventory_data,
            'message': f"Low stock alert: {inventory_data.get('item_name')} ({inventory_data.get('current_quantity')} left)",
            'timestamp': inventory_data.get('updated_at'),
            'severity': 'warning'
        }
        
        await sio.emit('inventory_low', event_data, room=MANAGER_ROOM)
        await sio.emit('inventory_low', event_data, room=CHEF_ROOM)
        
        logger.info(f"Broadcasted inventory_low event to manager and chef rooms")
    except Exception as e:
        logger.error(f"Error broadcasting inventory_low: {e}")


async def broadcast_table_updated(table_data: dict):
    """
    Broadcast table status update to all staff and managers
    Args:
        table_data: Dict containing table details
    """
    try:
        event_data = {
            'type': 'table_updated',
            'table': table_data,
            'message': f"Table {table_data.get('table_number')} status: {table_data.get('status')}",
            'timestamp': table_data.get('updated_at')
        }
        
        # Broadcast to both staff and manager rooms
        await sio.emit('table_updated', event_data, room=STAFF_ROOM)
        await sio.emit('table_updated', event_data, room=MANAGER_ROOM)
        
        logger.info(f"Broadcasted table_updated event to staff and manager rooms")
    except Exception as e:
        logger.error(f"Error broadcasting table_updated: {e}")


async def broadcast_order_status_changed(order_data: dict):
    """
    Broadcast general order status change to relevant rooms
    Args:
        order_data: Dict containing order details
    """
    try:
        status = order_data.get('status')
        event_data = {
            'type': 'order_status_changed',
            'order': order_data,
            'message': f"Order #{order_data.get('id')} status: {status}",
            'timestamp': order_data.get('updated_at')
        }
        
        # Notify different rooms based on status
        if status in ['pending', 'confirmed']:
            await sio.emit('order_status_changed', event_data, room=CHEF_ROOM)
        elif status in ['preparing', 'ready']:
            await sio.emit('order_status_changed', event_data, room=CHEF_ROOM)
            await sio.emit('order_status_changed', event_data, room=STAFF_ROOM)
        elif status in ['served', 'completed']:
            await sio.emit('order_status_changed', event_data, room=STAFF_ROOM)
        
        # Always notify managers
        await sio.emit('order_status_changed', event_data, room=MANAGER_ROOM)
        
        logger.info(f"Broadcasted order_status_changed event")
    except Exception as e:
        logger.error(f"Error broadcasting order_status_changed: {e}")


async def broadcast_reservation_created(reservation_data: dict):
    """
    Broadcast new reservation to manager/staff rooms
    Args:
        reservation_data: Dict containing reservation details
    """
    try:
        event_data = {
            'type': 'reservation_created',
            'reservation': reservation_data,
            'message': f"New reservation for {reservation_data.get('guest_count')} guests",
            'timestamp': reservation_data.get('created_at')
        }
        
        await sio.emit('reservation_created', event_data, room=MANAGER_ROOM)
        await sio.emit('reservation_created', event_data, room=STAFF_ROOM)
        
        logger.info(f"Broadcasted reservation_created event")
    except Exception as e:
        logger.error(f"Error broadcasting reservation_created: {e}")


async def broadcast_custom_notification(room: str, notification_data: dict):
    """
    Broadcast custom notification to specific room
    Args:
        room: Room name to broadcast to
        notification_data: Dict containing notification details
    """
    try:
        await sio.emit('custom_notification', notification_data, room=room)
        logger.info(f"Broadcasted custom notification to {room}")
    except Exception as e:
        logger.error(f"Error broadcasting custom notification: {e}")


# ============================================
# Phase 5: Kitchen Display System (KDS) Events
# ============================================

async def broadcast_order_item_status_changed(item_data: dict):
    """
    Broadcast order item status change to kitchen room
    Used when item prep status changes (pending -> preparing -> ready)
    Args:
        item_data: Dict containing order item details with prep_status
    """
    try:
        event_data = {
            'type': 'order_item_status_changed',
            'item': item_data,
            'message': f"Item {item_data.get('menu_item_name')} status: {item_data.get('prep_status')}",
            'timestamp': item_data.get('updated_at')
        }
        
        # Broadcast to chef room for KDS updates
        await sio.emit('order_item_updated', event_data, room=CHEF_ROOM)
        
        logger.info(f"Broadcasted order_item_status_changed to {CHEF_ROOM}")
    except Exception as e:
        logger.error(f"Error broadcasting order_item_status_changed: {e}")


async def broadcast_order_bumped(order_data: dict):
    """
    Broadcast order bump (removal from KDS display)
    Args:
        order_data: Dict containing order details that was bumped
    """
    try:
        event_data = {
            'type': 'order_bumped',
            'order': order_data,
            'message': f"Order #{order_data.get('id')} bumped from kitchen display",
            'timestamp': order_data.get('bumped_at')
        }
        
        # Notify chef room to remove from display
        await sio.emit('order_bumped', event_data, room=CHEF_ROOM)
        
        # Also notify staff that order is complete
        await sio.emit('order_ready', {
            'type': 'order_ready',
            'order': order_data,
            'message': f"Order #{order_data.get('id')} is ready for service",
            'timestamp': order_data.get('bumped_at')
        }, room=STAFF_ROOM)
        
        logger.info(f"Broadcasted order_bumped to chef and staff rooms")
    except Exception as e:
        logger.error(f"Error broadcasting order_bumped: {e}")


async def broadcast_order_item_reassigned(item_data: dict, old_station: str, new_station: str):
    """
    Broadcast item reassignment between stations
    Args:
        item_data: Dict containing order item details
        old_station: Previous station name
        new_station: New station name
    """
    try:
        event_data = {
            'type': 'order_item_reassigned',
            'item': item_data,
            'old_station': old_station,
            'new_station': new_station,
            'message': f"Item {item_data.get('menu_item_name')} reassigned from {old_station} to {new_station}",
            'timestamp': item_data.get('updated_at')
        }
        
        await sio.emit('order_item_updated', event_data, room=CHEF_ROOM)
        
        logger.info(f"Broadcasted order_item_reassigned to {CHEF_ROOM}")
    except Exception as e:
        logger.error(f"Error broadcasting order_item_reassigned: {e}")


async def broadcast_kitchen_performance_alert(station_data: dict):
    """
    Broadcast kitchen performance alert (e.g., falling behind, high load)
    Args:
        station_data: Dict containing station performance metrics
    """
    try:
        event_data = {
            'type': 'kitchen_performance_alert',
            'station': station_data,
            'message': station_data.get('alert_message', 'Performance alert'),
            'severity': station_data.get('severity', 'info'),
            'timestamp': station_data.get('timestamp')
        }
        
        # Notify managers and chefs
        await sio.emit('performance_alert', event_data, room=MANAGER_ROOM)
        await sio.emit('performance_alert', event_data, room=CHEF_ROOM)
        
        logger.info(f"Broadcasted kitchen_performance_alert")
    except Exception as e:
        logger.error(f"Error broadcasting kitchen_performance_alert: {e}")


# ============================================
# Utility Functions
# ============================================

def get_connected_users() -> List[Dict]:
    """Get list of all connected users"""
    return list(connected_users.values())


def get_users_in_room(role: str) -> List[Dict]:
    """Get list of users in a specific room based on role"""
    return [user for user in connected_users.values() if user.get('role') == role]


async def get_room_members(room: str) -> int:
    """Get count of members in a room"""
    try:
        # This is a placeholder - Socket.IO doesn't expose room member count directly
        # You can track this manually if needed
        return len(get_users_in_room(room.replace('_room', '')))
    except Exception as e:
        logger.error(f"Error getting room members: {e}")
        return 0
