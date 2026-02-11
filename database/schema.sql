-- VetPro Database Schema
-- PostgreSQL 15+

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- ============================================
-- CORE TABLES
-- ============================================

-- Users & Authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'veterinarian', 'nurse', 'receptionist', 'shop_staff')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    voice_profile_url TEXT, -- URL to voice sample for AI recognition
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Staff Details
CREATE TABLE staff_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    license_number VARCHAR(100),
    specializations TEXT[], -- Array of specializations
    date_hired DATE,
    employment_type VARCHAR(50) CHECK (employment_type IN ('full_time', 'part_time', 'contract')),
    languages TEXT[], -- Languages spoken
    certifications JSONB, -- Store certification details
    emergency_contact JSONB, -- Emergency contact information
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Work Schedules
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_on_call BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clients
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone_primary VARCHAR(50) NOT NULL,
    phone_secondary VARCHAR(50),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Slovakia',
    id_number VARCHAR(50), -- National ID or passport
    preferred_language VARCHAR(10) DEFAULT 'sk',
    preferred_vet_id UUID REFERENCES users(id),
    referral_source VARCHAR(255),
    marketing_consent BOOLEAN DEFAULT false,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pets/Animals
CREATE TABLE pets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    species VARCHAR(50) NOT NULL, -- dog, cat, bird, exotic, etc.
    breed VARCHAR(100),
    breed_secondary VARCHAR(100), -- For mixed breeds
    sex VARCHAR(20) CHECK (sex IN ('male', 'female', 'neutered_male', 'spayed_female')),
    date_of_birth DATE,
    color_markings TEXT,
    microchip_number VARCHAR(50) UNIQUE,
    tattoo_number VARCHAR(50),
    insurance_provider VARCHAR(255),
    insurance_policy_number VARCHAR(100),
    weight_kg DECIMAL(6,2),
    photo_urls TEXT[], -- Array of photo URLs
    is_deceased BOOLEAN DEFAULT false,
    date_of_death DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Weight History
CREATE TABLE weight_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
    weight_kg DECIMAL(6,2) NOT NULL,
    measured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    measured_by_id UUID REFERENCES users(id),
    notes TEXT
);

-- ============================================
-- APPOINTMENTS & SCHEDULING
-- ============================================

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    assigned_vet_id UUID REFERENCES users(id),
    appointment_type VARCHAR(50) NOT NULL CHECK (appointment_type IN ('consultation', 'surgery', 'vaccination', 'follow_up', 'emergency', 'grooming')),
    scheduled_start TIMESTAMP NOT NULL,
    scheduled_end TIMESTAMP NOT NULL,
    actual_start TIMESTAMP,
    actual_end TIMESTAMP,
    room_number VARCHAR(20),
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show')),
    reason TEXT,
    special_instructions TEXT,
    reminder_sent BOOLEAN DEFAULT false,
    confirmation_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MEDICAL RECORDS
-- ============================================

-- Vaccinations
CREATE TABLE vaccinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
    vaccine_name VARCHAR(255) NOT NULL,
    manufacturer VARCHAR(255),
    batch_number VARCHAR(100),
    administered_date DATE NOT NULL,
    due_date DATE,
    administered_by_id UUID REFERENCES users(id),
    site_of_injection VARCHAR(100),
    reactions TEXT,
    certificate_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Diagnoses
CREATE TABLE diagnoses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id),
    diagnosed_by_id UUID REFERENCES users(id),
    diagnosis_code VARCHAR(50), -- ICD-10 or similar
    diagnosis_name VARCHAR(255) NOT NULL,
    severity VARCHAR(50) CHECK (severity IN ('mild', 'moderate', 'severe', 'critical')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'chronic', 'in_remission')),
    diagnosed_date DATE NOT NULL,
    resolved_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Treatments
CREATE TABLE treatments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
    diagnosis_id UUID REFERENCES diagnoses(id),
    appointment_id UUID REFERENCES appointments(id),
    treatment_type VARCHAR(100) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    administered_by_id UUID REFERENCES users(id),
    response VARCHAR(50) CHECK (response IN ('excellent', 'good', 'moderate', 'poor', 'no_response')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prescriptions
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id),
    prescribed_by_id UUID REFERENCES users(id),
    medication_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    route VARCHAR(50), -- oral, topical, injection, etc.
    frequency VARCHAR(100) NOT NULL,
    duration_days INTEGER,
    quantity DECIMAL(10,2),
    unit VARCHAR(50),
    refills_allowed INTEGER DEFAULT 0,
    instructions TEXT,
    warnings TEXT,
    prescribed_date DATE NOT NULL,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Surgeries
CREATE TABLE surgeries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id),
    procedure_name VARCHAR(255) NOT NULL,
    procedure_type VARCHAR(100) CHECK (procedure_type IN ('elective', 'emergency')),
    surgeon_id UUID REFERENCES users(id),
    anesthetist_id UUID REFERENCES users(id),
    assisting_staff_ids UUID[], -- Array of staff IDs
    surgery_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    pre_op_bloodwork JSONB,
    anesthesia_protocol TEXT,
    surgical_notes TEXT, -- AI-generated from voice
    findings TEXT,
    complications TEXT,
    post_op_instructions TEXT,
    suture_removal_date DATE,
    photos_urls TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lab Tests
CREATE TABLE lab_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id),
    ordered_by_id UUID REFERENCES users(id),
    test_type VARCHAR(100) NOT NULL, -- CBC, Chemistry, Urinalysis, etc.
    ordered_date DATE NOT NULL,
    sample_collected_date DATE,
    results_received_date DATE,
    laboratory_name VARCHAR(255),
    results JSONB, -- Store results as structured data
    abnormalities TEXT[], -- AI-flagged abnormal values
    interpretation TEXT, -- AI-generated summary
    file_url TEXT, -- PDF of lab report
    status VARCHAR(50) DEFAULT 'ordered' CHECK (status IN ('ordered', 'collected', 'sent', 'received', 'reviewed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Diagnostic Imaging
CREATE TABLE diagnostic_imaging (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id),
    ordered_by_id UUID REFERENCES users(id),
    imaging_type VARCHAR(100) NOT NULL CHECK (imaging_type IN ('x-ray', 'ultrasound', 'ct', 'mri')),
    body_part VARCHAR(100),
    ordered_date DATE NOT NULL,
    performed_date DATE,
    findings TEXT,
    radiologist_report TEXT,
    image_urls TEXT[], -- Array of DICOM or image URLs
    video_urls TEXT[], -- For ultrasound videos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Visit Notes (AI-Generated)
CREATE TABLE visit_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
    veterinarian_id UUID REFERENCES users(id),
    chief_complaint TEXT,
    history TEXT,
    physical_exam JSONB, -- Structured exam findings
    assessment TEXT,
    plan TEXT,
    voice_recording_url TEXT,
    transcription TEXT, -- Full transcription from AI
    ai_extracted_data JSONB, -- Structured data extracted by AI
    is_draft BOOLEAN DEFAULT true,
    approved_at TIMESTAMP,
    approved_by_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INVENTORY MANAGEMENT
-- ============================================

CREATE TABLE inventory_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    parent_category_id UUID REFERENCES inventory_categories(id),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES inventory_categories(id),
    sku VARCHAR(100) UNIQUE,
    barcode VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    manufacturer VARCHAR(255),
    unit_of_measure VARCHAR(50), -- bottle, box, tablet, ml, etc.
    package_size VARCHAR(100),
    cost_per_unit DECIMAL(10,2),
    selling_price DECIMAL(10,2),
    markup_percentage DECIMAL(5,2),
    is_prescription BOOLEAN DEFAULT false,
    is_controlled_substance BOOLEAN DEFAULT false,
    requires_refrigeration BOOLEAN DEFAULT false,
    minimum_stock INTEGER DEFAULT 0,
    optimal_stock INTEGER,
    current_stock INTEGER DEFAULT 0,
    location VARCHAR(100), -- pharmacy, surgery, retail, storage
    is_sellable_in_eshop BOOLEAN DEFAULT false,
    eshop_images TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
    batch_number VARCHAR(100),
    quantity INTEGER NOT NULL,
    cost_per_unit DECIMAL(10,2),
    expiration_date DATE,
    received_date DATE DEFAULT CURRENT_DATE,
    supplier_id UUID REFERENCES suppliers(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES inventory_items(id),
    transaction_type VARCHAR(50) CHECK (transaction_type IN ('purchase', 'sale', 'adjustment', 'waste', 'return')),
    quantity INTEGER NOT NULL, -- Negative for deductions
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    reference_type VARCHAR(50), -- 'invoice', 'purchase_order', 'manual', etc.
    reference_id UUID,
    performed_by_id UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    website VARCHAR(255),
    payment_terms VARCHAR(100),
    lead_time_days INTEGER,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_number VARCHAR(100) UNIQUE NOT NULL,
    supplier_id UUID REFERENCES suppliers(id),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'sent', 'received', 'cancelled')),
    order_date DATE DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    subtotal DECIMAL(10,2),
    tax DECIMAL(10,2),
    total DECIMAL(10,2),
    created_by_id UUID REFERENCES users(id),
    approved_by_id UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
    item_id UUID REFERENCES inventory_items(id),
    quantity_ordered INTEGER NOT NULL,
    quantity_received INTEGER DEFAULT 0,
    unit_cost DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- BILLING & INVOICING
-- ============================================

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    client_id UUID REFERENCES clients(id),
    pet_id UUID REFERENCES pets(id),
    appointment_id UUID REFERENCES appointments(id),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled')),
    issue_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    balance_due DECIMAL(10,2),
    ai_generated BOOLEAN DEFAULT false, -- Was this generated by AI?
    generated_by_id UUID REFERENCES users(id),
    approved_by_id UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    item_type VARCHAR(50) CHECK (item_type IN ('service', 'product', 'medication', 'diagnostic')),
    description VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    inventory_item_id UUID REFERENCES inventory_items(id), -- If it's a product/medication
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id),
    payment_method VARCHAR(50) CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'insurance', 'payment_plan')),
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE DEFAULT CURRENT_DATE,
    reference_number VARCHAR(100), -- Card transaction ID, bank transfer ref, etc.
    ekasa_receipt_number VARCHAR(100), -- Slovak fiscal receipt number
    ekasa_okp_code VARCHAR(100), -- Security code
    processed_by_id UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- E-COMMERCE
-- ============================================

CREATE TABLE eshop_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(100) UNIQUE NOT NULL,
    client_id UUID REFERENCES clients(id),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned')),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    shipping_method VARCHAR(100),
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    tracking_number VARCHAR(255),
    subtotal DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    shipping_address JSONB,
    billing_address JSONB,
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE eshop_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES eshop_orders(id) ON DELETE CASCADE,
    item_id UUID REFERENCES inventory_items(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- COMMUNICATION & MARKETING
-- ============================================

CREATE TABLE email_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    ai_generated BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
    scheduled_send_time TIMESTAMP,
    sent_at TIMESTAMP,
    total_recipients INTEGER,
    total_opened INTEGER DEFAULT 0,
    total_clicked INTEGER DEFAULT 0,
    created_by_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE client_communications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id),
    communication_type VARCHAR(50) CHECK (communication_type IN ('email', 'sms', 'phone', 'in_person', 'chat')),
    direction VARCHAR(50) CHECK (direction IN ('inbound', 'outbound')),
    subject VARCHAR(255),
    content TEXT,
    sent_by_id UUID REFERENCES users(id),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) CHECK (status IN ('sent', 'delivered', 'opened', 'failed')),
    metadata JSONB -- Store additional info like phone number, email ID, etc.
);

-- ============================================
-- AI & VOICE DATA
-- ============================================

CREATE TABLE voice_recordings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES appointments(id),
    room_number VARCHAR(20),
    recording_url TEXT NOT NULL,
    duration_seconds INTEGER,
    transcription TEXT,
    speaker_diarization JSONB, -- Who spoke when
    ai_extracted_data JSONB, -- Diagnoses, medications, etc. extracted by AI
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- SYSTEM & AUDIT
-- ============================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100), -- 'client', 'pet', 'invoice', etc.
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    data_type VARCHAR(50) CHECK (data_type IN ('string', 'integer', 'boolean', 'json')),
    description TEXT,
    updated_by_id UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Clients
CREATE INDEX idx_clients_phone ON clients(phone_primary);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_name ON clients(last_name, first_name);
CREATE INDEX idx_clients_search ON clients USING gin(to_tsvector('simple', first_name || ' ' || last_name));

-- Pets
CREATE INDEX idx_pets_client ON pets(client_id);
CREATE INDEX idx_pets_name ON pets(name);
CREATE INDEX idx_pets_microchip ON pets(microchip_number);
CREATE INDEX idx_pets_species ON pets(species);

-- Appointments
CREATE INDEX idx_appointments_pet ON appointments(pet_id);
CREATE INDEX idx_appointments_vet ON appointments(assigned_vet_id);
CREATE INDEX idx_appointments_date ON appointments(scheduled_start);
CREATE INDEX idx_appointments_status ON appointments(status);

-- Medical Records
CREATE INDEX idx_vaccinations_pet ON vaccinations(pet_id);
CREATE INDEX idx_vaccinations_due ON vaccinations(due_date);
CREATE INDEX idx_diagnoses_pet ON diagnoses(pet_id);
CREATE INDEX idx_prescriptions_pet ON prescriptions(pet_id);
CREATE INDEX idx_surgeries_pet ON surgeries(pet_id);
CREATE INDEX idx_lab_tests_pet ON lab_tests(pet_id);

-- Inventory
CREATE INDEX idx_inventory_items_sku ON inventory_items(sku);
CREATE INDEX idx_inventory_items_category ON inventory_items(category_id);
CREATE INDEX idx_inventory_items_stock ON inventory_items(current_stock);
CREATE INDEX idx_inventory_transactions_item ON inventory_transactions(item_id);
CREATE INDEX idx_inventory_transactions_date ON inventory_transactions(created_at);

-- Invoices
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_date ON invoices(issue_date);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);

-- Audit Logs
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- ============================================
-- TRIGGERS FOR AUTO-UPDATE
-- ============================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON pets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INITIAL DATA SEEDS
-- ============================================

-- Insert admin user (password: admin123 - CHANGE IN PRODUCTION!)
INSERT INTO users (email, password_hash, role, first_name, last_name) VALUES
('admin@vetpro.com', '$2b$10$rXQzJ5K5Y5J5J5J5J5J5J.5J5J5J5J5J5J5J5J5J5J5J5J5J5J5', 'admin', 'Admin', 'User');

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, data_type, description) VALUES
('clinic_name', 'VetPro Veterinary Clinic', 'string', 'Name of the clinic'),
('clinic_email', 'info@vetpro.com', 'string', 'Main clinic email'),
('clinic_phone', '+421 XXX XXX XXX', 'string', 'Main clinic phone'),
('default_vat_rate', '20', 'integer', 'Default VAT rate percentage'),
('currency', 'EUR', 'string', 'Primary currency'),
('timezone', 'Europe/Bratislava', 'string', 'Clinic timezone');
