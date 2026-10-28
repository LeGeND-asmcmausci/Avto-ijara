-- Avval mavjud bo'lsa jadvallarni o'chirish (toza qayta yuklash uchun)
DROP TABLE IF EXISTS rentals CASCADE;
DROP TABLE IF EXISTS cars CASCADE;

-- Avtomobillar jadvali (har bir mashina uchun 10+ ma'lumot/maydon)
CREATE TABLE cars (
    id SERIAL PRIMARY KEY,                     -- 1. Unikal ID
    brand VARCHAR(50) NOT NULL,                -- 2. Ishlab chiqaruvchi (brendi)
    model VARCHAR(50) NOT NULL,                -- 3. Modeli
    year INT NOT NULL,                         -- 4. Ishlab chiqarilgan yili
    color VARCHAR(30) NOT NULL,                -- 5. Rangi
    fuel_type VARCHAR(30) NOT NULL,            -- 6. Yoqilg'i turi (Benzin, Gaz, Dizel, Elektro, Gibrid)
    transmission VARCHAR(30) NOT NULL,         -- 7. Uzatmalar qutisi (Avtomat, Mexanika)
    mileage INT NOT NULL DEFAULT 0,            -- 8. Bosib o'tgan masofasi (km)
    license_plate VARCHAR(20) UNIQUE NOT NULL, -- 9. Davlat raqami
    daily_price NUMERIC(12, 2) NOT NULL,       -- 10. Kunlik ijara narxi (so'mda)
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance')), -- 11. Holati
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- 12. Tizimga kiritilgan vaqti
);

-- Ijaralar jadvali (Rentals)
CREATE TABLE rentals (
    id SERIAL PRIMARY KEY,
    car_id INT NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(30) NOT NULL,
    customer_passport VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INT NOT NULL,
    total_price NUMERIC(12, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indekslar
CREATE INDEX idx_cars_status ON cars(status);
CREATE INDEX idx_cars_brand ON cars(brand);
CREATE INDEX idx_rentals_status ON rentals(status);
CREATE INDEX idx_rentals_car_id ON rentals(car_id);
