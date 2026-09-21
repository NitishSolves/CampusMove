-- Smart Campus Bus Relational Database Schema
-- Multi-College Multi-Tenant Architecture

-- 1. Colleges (Tenants)
CREATE TABLE IF NOT EXISTS colleges (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    short_code VARCHAR(32) NOT NULL UNIQUE,
    domain VARCHAR(128) NOT NULL,
    center_lat DOUBLE PRECISION NOT NULL DEFAULT 34.0537,
    center_lng DOUBLE PRECISION NOT NULL DEFAULT -118.2570,
    zoom_level INTEGER NOT NULL DEFAULT 15,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users (Students, Drivers, Admins)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    college_id VARCHAR(64) NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('STUDENT', 'DRIVER', 'ADMIN')),
    student_id VARCHAR(64),
    cdl_number VARCHAR(64),
    phone VARCHAR(32),
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_college ON users(college_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 3. Routes
CREATE TABLE IF NOT EXISTS routes (
    id VARCHAR(64) PRIMARY KEY,
    college_id VARCHAR(64) NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(32) NOT NULL DEFAULT '#2563EB',
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SCHEDULED', 'DELAYED', 'SUSPENDED')),
    schedule_hours VARCHAR(128) NOT NULL DEFAULT '07:00 AM – 10:00 PM',
    frequency_minutes INTEGER NOT NULL DEFAULT 10,
    path_coordinates JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_routes_college ON routes(college_id);

-- 4. Stops
CREATE TABLE IF NOT EXISTS stops (
    id VARCHAR(64) PRIMARY KEY,
    college_id VARCHAR(64) NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    route_id VARCHAR(64) REFERENCES routes(id) ON DELETE SET NULL,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(255) NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    landmark VARCHAR(255),
    sequence INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_stops_college ON stops(college_id);
CREATE INDEX IF NOT EXISTS idx_stops_route ON stops(route_id);

-- 5. Buses (Fleet)
CREATE TABLE IF NOT EXISTS buses (
    id VARCHAR(64) PRIMARY KEY,
    college_id VARCHAR(64) NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    bus_number VARCHAR(64) NOT NULL,
    plate_number VARCHAR(64) NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 45,
    model VARCHAR(128),
    current_route_id VARCHAR(64) REFERENCES routes(id) ON DELETE SET NULL,
    current_driver_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    driver_name VARCHAR(255),
    status VARCHAR(32) NOT NULL DEFAULT 'OFF_DUTY',
    last_location_lat DOUBLE PRECISION NOT NULL DEFAULT 34.0537,
    last_location_lng DOUBLE PRECISION NOT NULL DEFAULT -118.2570,
    heading DOUBLE PRECISION NOT NULL DEFAULT 0,
    speed_kmh DOUBLE PRECISION NOT NULL DEFAULT 0,
    current_occupancy INTEGER NOT NULL DEFAULT 0,
    gps_status VARCHAR(32) NOT NULL DEFAULT 'GPS_ACTIVE',
    network_status VARCHAR(32) NOT NULL DEFAULT 'NETWORK_ONLINE',
    eta_confidence VARCHAR(32) NOT NULL DEFAULT 'SCHEDULED',
    is_simulated BOOLEAN NOT NULL DEFAULT false,
    last_sync_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_buses_college ON buses(college_id);
CREATE INDEX IF NOT EXISTS idx_buses_route ON buses(current_route_id);

-- 6. Trips (Lifecycle: STARTED -> IN_PROGRESS -> COMPLETED / CANCELLED)
CREATE TABLE IF NOT EXISTS trips (
    id VARCHAR(64) PRIMARY KEY,
    college_id VARCHAR(64) NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    bus_id VARCHAR(64) NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
    route_id VARCHAR(64) NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    driver_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    current_occupancy INTEGER NOT NULL DEFAULT 0,
    max_occupancy_recorded INTEGER NOT NULL DEFAULT 0,
    distance_covered_km DOUBLE PRECISION NOT NULL DEFAULT 0,
    total_locations_logged INTEGER NOT NULL DEFAULT 0,
    synced_locations_count INTEGER NOT NULL DEFAULT 0,
    queued_locations_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_trips_college ON trips(college_id);
CREATE INDEX IF NOT EXISTS idx_trips_bus ON trips(bus_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver ON trips(driver_id);
-- Unique constraint to prevent race condition on concurrent active trips
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_trip_per_bus ON trips(bus_id) WHERE status IN ('STARTED', 'IN_PROGRESS');
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_trip_per_driver ON trips(driver_id) WHERE status IN ('STARTED', 'IN_PROGRESS');

-- 7. Locations (Raw GPS breadcrumbs from driver phone)
CREATE TABLE IF NOT EXISTS locations (
    id VARCHAR(64) PRIMARY KEY,
    trip_id VARCHAR(64) REFERENCES trips(id) ON DELETE SET NULL,
    bus_id VARCHAR(64) NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
    college_id VARCHAR(64) NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    speed DOUBLE PRECISION,
    heading DOUBLE PRECISION,
    accuracy DOUBLE PRECISION,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_offline_queued BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_locations_trip ON locations(trip_id);
CREATE INDEX IF NOT EXISTS idx_locations_recorded_at ON locations(recorded_at);

-- 8. Emergency Alerts
CREATE TABLE IF NOT EXISTS emergency_alerts (
    id VARCHAR(64) PRIMARY KEY,
    college_id VARCHAR(64) NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    trip_id VARCHAR(64) REFERENCES trips(id) ON DELETE SET NULL,
    bus_id VARCHAR(64) REFERENCES buses(id) ON DELETE SET NULL,
    driver_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    bus_number VARCHAR(64) NOT NULL,
    route_name VARCHAR(255) NOT NULL,
    driver_name VARCHAR(255) NOT NULL,
    reason VARCHAR(255) NOT NULL,
    location_lat DOUBLE PRECISION NOT NULL,
    location_lng DOUBLE PRECISION NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED')),
    acknowledged_by VARCHAR(255),
    resolved_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_alerts_college ON emergency_alerts(college_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON emergency_alerts(status);

-- 9. Campus Notifications & Announcements
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) PRIMARY KEY,
    college_id VARCHAR(64) NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    route_id VARCHAR(64) REFERENCES routes(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(32) NOT NULL DEFAULT 'ANNOUNCEMENT' CHECK (category IN ('ANNOUNCEMENT', 'DELAY', 'ROUTE_CHANGE', 'EMERGENCY', 'CANCELLATION', 'WEATHER_DELAY')),
    priority VARCHAR(32) NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT', 'EMERGENCY')),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notif_college ON notifications(college_id);
