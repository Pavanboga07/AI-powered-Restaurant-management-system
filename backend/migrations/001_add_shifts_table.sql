-- Migration: Add shifts table for employee scheduling
-- Created: 2024

-- Create enum type for shift types
DO $$ BEGIN
    CREATE TYPE shifttype AS ENUM ('morning', 'afternoon', 'evening', 'night');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create shifts table
CREATE TABLE IF NOT EXISTS shifts (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    shift_type shifttype NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_shifts_employee_id ON shifts(employee_id);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(date);
CREATE INDEX IF NOT EXISTS idx_shifts_employee_date ON shifts(employee_id, date);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_shifts_updated_at
    BEFORE UPDATE ON shifts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE shifts IS 'Employee shift scheduling table';
COMMENT ON COLUMN shifts.employee_id IS 'Foreign key to users table';
COMMENT ON COLUMN shifts.date IS 'Date of the shift';
COMMENT ON COLUMN shifts.shift_type IS 'Type of shift: morning, afternoon, evening, or night';
COMMENT ON COLUMN shifts.start_time IS 'Shift start time';
COMMENT ON COLUMN shifts.end_time IS 'Shift end time';
