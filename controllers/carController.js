import { query } from '../config/db.js';

// 1. Barcha mashinalarni olish (filtr va qidiruv bilan)
export async function getAllCars(req, res) {
    try {
        const { brand, status, fuel_type, transmission, min_price, max_price, search } = req.query;

        let sql = `SELECT * FROM cars WHERE 1=1`;
        const params = [];

        if (brand) {
            params.push(brand);
            sql += ` AND LOWER(brand) = LOWER($${params.length})`;
        }

        if (status) {
            params.push(status);
            sql += ` AND status = $${params.length}`;
        }

        if (fuel_type) {
            params.push(fuel_type);
            sql += ` AND LOWER(fuel_type) LIKE LOWER('%' || $${params.length} || '%')`;
        }

        if (transmission) {
            params.push(transmission);
            sql += ` AND LOWER(transmission) = LOWER($${params.length})`;
        }

        if (min_price) {
            params.push(parseFloat(min_price));
            sql += ` AND daily_price >= $${params.length}`;
        }

        if (max_price) {
            params.push(parseFloat(max_price));
            sql += ` AND daily_price <= $${params.length}`;
        }

        if (search) {
            params.push(search);
            sql += ` AND (
                LOWER(brand) LIKE LOWER('%' || $${params.length} || '%') OR 
                LOWER(model) LIKE LOWER('%' || $${params.length} || '%') OR 
                LOWER(license_plate) LIKE LOWER('%' || $${params.length} || '%')
            )`;
        }

        sql += ` ORDER BY id ASC`;

        const result = await query(sql, params);
        res.status(200).json({
            success: true,
            count: result.rowCount,
            data: result.rows,
        });
    } catch (error) {
        console.error('Mashinalarni olishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Serverda xatolik yuz berdi.',
            error: error.message,
        });
    }
}

// 2. ID bo'yicha bitta mashinani olish (va uning ijara tarixi)
export async function getCarById(req, res) {
    try {
        const { id } = req.params;

        const carResult = await query(`SELECT * FROM cars WHERE id = $1`, [id]);
        if (carResult.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: `ID ${id} bo'lgan avtomobil topilmadi.`,
            });
        }

        // Mashinaning ijara tarixi
        const rentalsResult = await query(
            `SELECT * FROM rentals WHERE car_id = $1 ORDER BY id DESC`,
            [id]
        );

        res.status(200).json({
            success: true,
            data: {
                ...carResult.rows[0],
                rentals_history: rentalsResult.rows,
            },
        });
    } catch (error) {
        console.error('Mashinani olishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Serverda xatolik yuz berdi.',
            error: error.message,
        });
    }
}

// 3. Yangi mashina qo'shish (10 ta ma'lumot kiritiladi)
export async function createCar(req, res) {
    try {
        const {
            brand,
            model,
            year,
            color,
            fuel_type,
            transmission,
            mileage,
            license_plate,
            daily_price,
            status = 'available',
        } = req.body;

        // Majburiy maydonlarni tekshirish
        if (!brand || !model || !year || !color || !fuel_type || !transmission || !license_plate || !daily_price) {
            return res.status(400).json({
                success: false,
                message: "Barcha asosiy maydonlar talab qilinadi: brand, model, year, color, fuel_type, transmission, license_plate, daily_price.",
            });
        }

        // Davlat raqami takrorlanmaganligini tekshirish
        const checkPlate = await query(`SELECT id FROM cars WHERE license_plate = $1`, [license_plate]);
        if (checkPlate.rowCount > 0) {
            return res.status(400).json({
                success: false,
                message: `'${license_plate}' davlat raqamli mashina allaqachon mavjud!`,
            });
        }

        const sql = `
            INSERT INTO cars (
                brand, model, year, color, fuel_type, 
                transmission, mileage, license_plate, daily_price, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *;
        `;

        const values = [
            brand,
            model,
            parseInt(year),
            color,
            fuel_type,
            transmission,
            parseInt(mileage || 0),
            license_plate,
            parseFloat(daily_price),
            status,
        ];

        const result = await query(sql, values);

        res.status(201).json({
            success: true,
            message: "Yangi avtomobil muvaffaqiyatli qo'shildi!",
            data: result.rows[0],
        });
    } catch (error) {
        console.error('Mashina qo\'shishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Serverda xatolik yuz berdi.',
            error: error.message,
        });
    }
}

// 4. Mashina ma'lumotlarini yangilash
export async function updateCar(req, res) {
    try {
        const { id } = req.params;
        const {
            brand,
            model,
            year,
            color,
            fuel_type,
            transmission,
            mileage,
            license_plate,
            daily_price,
            status,
        } = req.body;

        // Mashina borligini tekshirish
        const carCheck = await query(`SELECT * FROM cars WHERE id = $1`, [id]);
        if (carCheck.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: `ID ${id} bo'lgan avtomobil topilmadi.`,
            });
        }

        const current = carCheck.rows[0];

        // Agar yangi license_plate kiritilsa, boshqa mashinada yo'qligini tekshirish
        if (license_plate && license_plate !== current.license_plate) {
            const plateCheck = await query(`SELECT id FROM cars WHERE license_plate = $1 AND id <> $2`, [license_plate, id]);
            if (plateCheck.rowCount > 0) {
                return res.status(400).json({
                    success: false,
                    message: `'${license_plate}' davlat raqami boshqa avtomobilga biriktirilgan!`,
                });
            }
        }

        const sql = `
            UPDATE cars
            SET 
                brand = COALESCE($1, brand),
                model = COALESCE($2, model),
                year = COALESCE($3, year),
                color = COALESCE($4, color),
                fuel_type = COALESCE($5, fuel_type),
                transmission = COALESCE($6, transmission),
                mileage = COALESCE($7, mileage),
                license_plate = COALESCE($8, license_plate),
                daily_price = COALESCE($9, daily_price),
                status = COALESCE($10, status)
            WHERE id = $11
            RETURNING *;
        `;

        const values = [
            brand || null,
            model || null,
            year ? parseInt(year) : null,
            color || null,
            fuel_type || null,
            transmission || null,
            mileage !== undefined ? parseInt(mileage) : null,
            license_plate || null,
            daily_price ? parseFloat(daily_price) : null,
            status || null,
            id,
        ];

        const result = await query(sql, values);

        res.status(200).json({
            success: true,
            message: "Avtomobil ma'lumotlari yangilandi!",
            data: result.rows[0],
        });
    } catch (error) {
        console.error('Mashinani yangilashda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Serverda xatolik yuz berdi.',
            error: error.message,
        });
    }
}

// 5. Mashinani o'chirish
export async function deleteCar(req, res) {
    try {
        const { id } = req.params;

        // Mashina faol ijarada emasligini tekshirish
        const activeRental = await query(
            `SELECT id FROM rentals WHERE car_id = $1 AND status = 'active'`,
            [id]
        );

        if (activeRental.rowCount > 0) {
            return res.status(400).json({
                success: false,
                message: "Bu mashina hozir faol ijarada bo'lganligi sababli o'chirib bo'lmaydi!",
            });
        }

        const result = await query(`DELETE FROM cars WHERE id = $1 RETURNING *;`, [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: `ID ${id} bo'lgan avtomobil topilmadi.`,
            });
        }

        res.status(200).json({
            success: true,
            message: "Avtomobil muvaffaqiyatli o'chirildi!",
            deleted_car: result.rows[0],
        });
    } catch (error) {
        console.error('Mashinani o\'chirishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Serverda xatolik yuz berdi.',
            error: error.message,
        });
    }
}

