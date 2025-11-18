"""
Phase 5: Kitchen Display System (KDS) Database Migration
Creates tables and columns for kitchen station management and order item tracking
"""

import sqlite3
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# Get database path - use absolute path
script_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(script_dir, 'restaurant.db')

print(f"📍 Database path: {db_path}")
print(f"📍 Database exists: {os.path.exists(db_path)}")

def run_migration():
    """Run Phase 5 KDS migration"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print("🚀 Starting Phase 5 KDS Migration...")
        
        # 1. Create kitchen_stations table
        print("\n📦 Creating kitchen_stations table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS kitchen_stations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                station_type VARCHAR(50) NOT NULL,
                is_active BOOLEAN DEFAULT 1,
                display_order INTEGER DEFAULT 0,
                max_concurrent_orders INTEGER DEFAULT 10,
                average_prep_time INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Insert default kitchen stations
        print("   Adding default kitchen stations...")
        stations = [
            ('Grill Station', 'Grilled items, steaks, BBQ', 'grill', 1, 1, 8, 15),
            ('Fry Station', 'Deep fried items, appetizers', 'fry', 1, 2, 10, 10),
            ('Saute Station', 'Pan-fried dishes, pasta', 'saute', 1, 3, 6, 12),
            ('Cold Station', 'Salads, cold appetizers, desserts', 'cold', 1, 4, 8, 5),
            ('Beverage Station', 'Drinks, smoothies, coffee', 'beverage', 1, 5, 15, 3),
            ('Expeditor', 'Final quality check and plating', 'expeditor', 1, 6, 20, 2)
        ]
        
        cursor.executemany("""
            INSERT OR IGNORE INTO kitchen_stations 
            (name, description, station_type, is_active, display_order, max_concurrent_orders, average_prep_time)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, stations)
        
        print(f"   ✅ Created {len(stations)} kitchen stations")
        
        # 2. Add KDS-related columns to order_items table
        print("\n📝 Adding KDS columns to order_items table...")
        
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(order_items)")
        existing_columns = [col[1] for col in cursor.fetchall()]
        
        kds_columns = [
            ("station_id", "INTEGER"),
            ("priority", "INTEGER DEFAULT 0"),
            ("prep_status", "VARCHAR(50) DEFAULT 'pending'"),
            ("prep_start_time", "TIMESTAMP"),
            ("prep_end_time", "TIMESTAMP"),
            ("assigned_chef_id", "INTEGER"),
            ("preparation_notes", "TEXT"),
            ("estimated_prep_time", "INTEGER")
        ]
        
        for col_name, col_type in kds_columns:
            if col_name not in existing_columns:
                print(f"   Adding column: {col_name}")
                cursor.execute(f"ALTER TABLE order_items ADD COLUMN {col_name} {col_type}")
        
        # Add foreign key index for station_id
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_order_items_station 
            ON order_items(station_id)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_order_items_prep_status 
            ON order_items(prep_status)
        """)
        
        print("   ✅ Order items table updated for KDS")
        
        # 3. Create kitchen_performance_logs table
        print("\n📊 Creating kitchen_performance_logs table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS kitchen_performance_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                station_id INTEGER NOT NULL,
                order_item_id INTEGER NOT NULL,
                action VARCHAR(50) NOT NULL,
                chef_id INTEGER,
                duration_seconds INTEGER,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (station_id) REFERENCES kitchen_stations(id),
                FOREIGN KEY (order_item_id) REFERENCES order_items(id),
                FOREIGN KEY (chef_id) REFERENCES users(id)
            )
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_perf_logs_station 
            ON kitchen_performance_logs(station_id, created_at)
        """)
        
        print("   ✅ Performance logs table created")
        
        # 4. Create station_assignments table for chef-station mapping
        print("\n👨‍🍳 Creating station_assignments table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS station_assignments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chef_id INTEGER NOT NULL,
                station_id INTEGER NOT NULL,
                shift_start TIMESTAMP NOT NULL,
                shift_end TIMESTAMP,
                is_primary BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (chef_id) REFERENCES users(id),
                FOREIGN KEY (station_id) REFERENCES kitchen_stations(id)
            )
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_station_assignments_chef 
            ON station_assignments(chef_id, shift_start)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_station_assignments_station 
            ON station_assignments(station_id, shift_start)
        """)
        
        print("   ✅ Station assignments table created")
        
        # 5. Update orders table with KDS fields
        print("\n📦 Adding KDS fields to orders table...")
        cursor.execute("PRAGMA table_info(orders)")
        order_columns = [col[1] for col in cursor.fetchall()]
        
        order_kds_columns = [
            ("kitchen_status", "VARCHAR(50) DEFAULT 'pending'"),
            ("kitchen_received_at", "TIMESTAMP"),
            ("all_items_ready_at", "TIMESTAMP"),
            ("bumped_at", "TIMESTAMP")
        ]
        
        for col_name, col_type in order_kds_columns:
            if col_name not in order_columns:
                print(f"   Adding column: {col_name}")
                cursor.execute(f"ALTER TABLE orders ADD COLUMN {col_name} {col_type}")
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_orders_kitchen_status 
            ON orders(kitchen_status, kitchen_received_at)
        """)
        
        print("   ✅ Orders table updated for KDS")
        
        # 6. Create ticket_display_settings table
        print("\n⚙️ Creating ticket_display_settings table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ticket_display_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                station_id INTEGER UNIQUE,
                font_size VARCHAR(20) DEFAULT 'medium',
                show_customer_names BOOLEAN DEFAULT 1,
                show_ticket_times BOOLEAN DEFAULT 1,
                show_special_requests BOOLEAN DEFAULT 1,
                auto_bump_completed BOOLEAN DEFAULT 0,
                bump_delay_seconds INTEGER DEFAULT 0,
                alert_threshold_minutes INTEGER DEFAULT 15,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (station_id) REFERENCES kitchen_stations(id)
            )
        """)
        
        print("   ✅ Display settings table created")
        
        # Commit all changes
        conn.commit()
        
        # Verify migration
        print("\n✅ Verifying migration...")
        cursor.execute("SELECT COUNT(*) FROM kitchen_stations")
        station_count = cursor.fetchone()[0]
        print(f"   Kitchen stations: {station_count}")
        
        cursor.execute("PRAGMA table_info(order_items)")
        order_item_cols = cursor.fetchall()
        print(f"   Order items columns: {len(order_item_cols)}")
        
        print("\n🎉 Phase 5 KDS Migration completed successfully!")
        print("\n📋 Summary:")
        print("   ✅ kitchen_stations table created")
        print("   ✅ order_items table enhanced with KDS fields")
        print("   ✅ kitchen_performance_logs table created")
        print("   ✅ station_assignments table created")
        print("   ✅ orders table updated with kitchen status")
        print("   ✅ ticket_display_settings table created")
        print(f"   ✅ {station_count} default stations added")
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Migration failed: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    run_migration()
