-- 10 ta to'liq namunaviy avtomobil ma'lumotlari
INSERT INTO cars (brand, model, year, color, fuel_type, transmission, mileage, license_plate, daily_price, status)
VALUES
    ('Chevrolet', 'Malibu 2 Turbo', 2023, 'Qora', 'Benzin', 'Avtomat', 18500, '01 A 777 AA', 600000.00, 'available'),
    ('Chevrolet', 'Tracker 2 Premier', 2024, 'Oq marvarid', 'Benzin', 'Avtomat', 12000, '01 B 123 BB', 450000.00, 'available'),
    ('Chevrolet', 'Gentra (Lacetti)', 2022, 'Kulrang', 'Benzin + Gaz', 'Avtomat', 45000, '01 C 345 CC', 300000.00, 'available'),
    ('Chevrolet', 'Cobalt LTZ', 2023, 'Oq', 'Benzin + Gaz', 'Avtomat', 28000, '01 D 456 DD', 280000.00, 'available'),
    ('Chevrolet', 'Tahoe High Country', 2023, 'Qora', 'Benzin', 'Avtomat', 15000, '01 T 001 TT', 1800000.00, 'available'),
    ('Kia', 'K5 GT-Line', 2023, 'To''q ko''k', 'Benzin', 'Avtomat', 21000, '01 K 555 KK', 700000.00, 'available'),
    ('Hyundai', 'Sonata', 2023, 'Kumushrang', 'Benzin', 'Avtomat', 19000, '01 H 888 HH', 650000.00, 'available'),
    ('BYD', 'Song Plus Flagship', 2024, 'Yashil metalik', 'Gibrid', 'Avtomat', 9500, '01 E 999 EE', 550000.00, 'available'),
    ('Toyota', 'Camry 75', 2022, 'Oq', 'Benzin', 'Avtomat', 33000, '01 Y 700 YY', 750000.00, 'available'),
    ('BMW', 'X5 M-Sport', 2022, 'Qora', 'Benzin', 'Avtomat', 31000, '01 M 007 MM', 1500000.00, 'available');

-- Namunaviy ijara ma'lumoti
INSERT INTO rentals (car_id, customer_name, customer_phone, customer_passport, start_date, end_date, total_days, total_price, status)
VALUES
    (1, 'Ali Valiyev', '+998901234567', 'AA1234567', CURRENT_DATE, CURRENT_DATE + INTERVAL '3 day', 3, 1800000.00, 'active');

-- Ijaradagi mashina holatini 'rented' qilish
UPDATE cars SET status = 'rented' WHERE id = 1;
