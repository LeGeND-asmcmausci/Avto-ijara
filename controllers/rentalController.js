import { query, pool } from '../config/db.js';

// 1. Barcha ijaralarni olish (filtrlar bilan)
export async function getAllRentals(req, res) {
    try {
        const { status, car_id, customer_phone } = req.query;

        let sql = `
            SELECT 
                r.id,
                r.car_id,
                c.brand,
                c.model,
                c.license_plate,
                c.color,
                c.daily_price,
                r.customer_name,
                r.customer_phone,
                r.customer_passport,
                r.start_date,
                r.end_date,
                r.total_days,
                r.total_price,
                r.status,
                r.created_at
            FROM rentals r
            JOIN cars c ON r.car_id = c.id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            params.push(status);
            sql += ` AND r.status = $${params.length}`;
        }

        if (car_id) {
            params.push(parseInt(car_id));
            sql += ` AND r.car_id = $${params.length}`;
        }

        if (customer_phone) {
            params.push(customer_phone);
            sql += ` AND r.customer_phone LIKE '%' || $${params.length} || '%'`;
        }

        sql += ` ORDER BY r.id DESC`;

        const result = await query(sql, params);
        res.status(200).json({
            success: true,
            count: result.rowCount,
            data: result.rows,
        });
    } catch (error) {
        console.error('Ijaralarni olishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Serverda xatolik yuz berdi.',
            error: error.message,
        });
    }
}

// 2. ID bo'yicha bitta ijara ma'lumotini olish
export async function getRentalById(req, res) {
    try {
        const { id } = req.params;

        const sql = `
            SELECT 
                r.*,
                c.brand,
                c.model,
                c.license_plate,
                c.year,
                c.color,
                c.fuel_type,
                c.daily_price
            FROM rentals r
            JOIN cars c ON r.car_id = c.id
            WHERE r.id = $1
        `;

        const result = await query(sql, [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: `ID ${id} bo'lgan ijara shartnomasi topilmadi.`,
            });
        }

        res.status(200).json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        console.error('Ijarani olishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Serverda xatolik yuz berdi.',
            error: error.message,
        });
    }
}

// 3. Yangi ijara ochish (mashinani band qilish)
export async function createRental(req, res) {
    const client = await pool.connect();
    try {
        const {
            car_id,
            customer_name,
            customer_phone,
            customer_passport,
            start_date,
            end_date,
        } = req.body;

        if (!car_id || !customer_name || !customer_phone || !customer_passport || !start_date || !end_date) {
            return res.status(400).json({
                success: false,
                message: "Barcha ma'lumotlar to'ldirilishi shart: car_id, customer_name, customer_phone, customer_passport, start_date, end_date.",
            });
        }

        const start = new Date(start_date);
        const end = new Date(end_date);
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) {
            return res.status(400).json({
                success: false,
                message: "Tugash sanasi boshlanish sanasidan keyin bo'lishi kerak (kamida 1 kun).",
            });
        }

        await client.query('BEGIN');

        // Mashinani tekshirish (mavjudligi va bo'shligi)
        const carRes = await client.query(`SELECT * FROM cars WHERE id = $1 FOR UPDATE`, [car_id]);
        if (carRes.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: `ID ${car_id} bo'lgan avtomobil topilmadi.`,
            });
        }

        const car = carRes.rows[0];
        if (car.status !== 'available') {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: `Bu avtomobil (${car.brand} ${car.model}) hozirda bo'sh emas! Holati: ${car.status}`,
            });
        }

        // Narxni hisoblash
        const totalPrice = diffDays * parseFloat(car.daily_price);

        // Ijarani bazaga yozish
        const insertRentalSql = `
            INSERT INTO rentals (
                car_id, customer_name, customer_phone, customer_passport,
                start_date, end_date, total_days, total_price, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
            RETURNING *;
        `;

        const rentalResult = await client.query(insertRentalSql, [
            car_id,
            customer_name,
            customer_phone,
            customer_passport,
            start_date,
            end_date,
            diffDays,
            totalPrice,
        ]);

        // Mashina holatini 'rented' ga o'zgartirish
        await client.query(`UPDATE cars SET status = 'rented' WHERE id = $1`, [car_id]);

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: "Avtomobil muvaffaqiyatli ijaraga berildi!",
            data: {
                ...rentalResult.rows[0],
                car: {
                    brand: car.brand,
                    model: car.model,
                    license_plate: car.license_plate,
                    daily_price: car.daily_price,
                },
            },
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Ijara yaratishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Serverda xatolik yuz berdi.',
            error: error.message,
        });
    } finally {
        client.release();
    }
}

// 4. Mashinani qaytarish (ijarani yakunlash)
export async function returnCarRental(req, res) {
    const client = await pool.connect();
    try {
        const { id } = req.params;

        await client.query('BEGIN');

        const rentalRes = await client.query(`SELECT * FROM rentals WHERE id = $1 FOR UPDATE`, [id]);
        if (rentalRes.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: `ID ${id} bo'lgan ijara topilmadi.`,
            });
        }

        const rental = rentalRes.rows[0];
        if (rental.status !== 'active') {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: `Bu ijara allaqachon '${rental.status}' holatida!`,
            });
        }

        // Ijarani 'completed' qilish
        const updatedRental = await client.query(
            `UPDATE rentals SET status = 'completed' WHERE id = $1 RETURNING *`,
            [id]
        );

        // Mashinani yana 'available' holatiga o'tkazish
        await client.query(`UPDATE cars SET status = 'available' WHERE id = $1`, [rental.car_id]);

        await client.query('COMMIT');

        res.status(200).json({
            success: true,
            message: "Avtomobil qaytarildi va ijara muvaffaqiyatli yakunlandi!",
            data: updatedRental.rows[0],
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Mashinani qaytarishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Serverda xatolik yuz berdi.',
            error: error.message,
        });
    } finally {
        client.release();
    }
}

// 5. Ijarani bekor qilish
export async function cancelRental(req, res) {
    const client = await pool.connect();
    try {
        const { id } = req.params;

        await client.query('BEGIN');

        const rentalRes = await client.query(`SELECT * FROM rentals WHERE id = $1 FOR UPDATE`, [id]);
        if (rentalRes.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: `ID ${id} bo'lgan ijara topilmadi.`,
            });
        }

        const rental = rentalRes.rows[0];
        if (rental.status === 'cancelled') {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: "Bu ijara allaqachon bekor qilingan!",
            });
        }

        // Ijarani bekor qilish
        const updatedRental = await client.query(
            `UPDATE rentals SET status = 'cancelled' WHERE id = $1 RETURNING *`,
            [id]
        );

        // Agar mashina hali ham 'rented' bo'lsa, 'available' ga qaytarish
        await client.query(
            `UPDATE cars SET status = 'available' WHERE id = $1 AND status = 'rented'`,
            [rental.car_id]
        );

        await client.query('COMMIT');

        res.status(200).json({
            success: true,
            message: "Ijara muvaffaqiyatli bekor qilindi!",
            data: updatedRental.rows[0],
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Ijarani bekor qilishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Serverda xatolik yuz berdi.',
            error: error.message,
        });
    } finally {
        client.release();
    }
}

// 6. Ijarani o'chirish
export async function deleteRental(req, res) {
    const client = await pool.connect();
    try {
        const { id } = req.params;

        await client.query('BEGIN');

        const rentalRes = await client.query(`SELECT * FROM rentals WHERE id = $1 FOR UPDATE`, [id]);
        if (rentalRes.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: `ID ${id} bo'lgan ijara topilmadi.`,
            });
        }

        const rental = rentalRes.rows[0];

        // Agar ijara faol bo'lsa, mashinani bo'shatish
        if (rental.status === 'active') {
            await client.query(`UPDATE cars SET status = 'available' WHERE id = $1`, [rental.car_id]);
        }

        await client.query(`DELETE FROM rentals WHERE id = $1`, [id]);

        await client.query('COMMIT');

        res.status(200).json({
            success: true,
            message: "Ijara yozuvi muvaffaqiyatli o'chirildi!",
            deleted_rental: rental,
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Ijarani o\'chirishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Serverda xatolik yuz berdi.',
            error: error.message,
        });
    } finally {
        client.release();
    }
}

// 7. Avto-ijara umumiy statistikasi
export async function getStats(req, res) {
    try {
        const statsQuery = `
            SELECT 
                (SELECT COUNT(*) FROM cars) AS total_cars,
                (SELECT COUNT(*) FROM cars WHERE status = 'available') AS available_cars,
                (SELECT COUNT(*) FROM cars WHERE status = 'rented') AS rented_cars,
                (SELECT COUNT(*) FROM rentals) AS total_rentals,
                (SELECT COUNT(*) FROM rentals WHERE status = 'active') AS active_rentals,
                (SELECT COALESCE(SUM(total_price), 0) FROM rentals WHERE status IN ('active', 'completed')) AS total_revenue
        `;

        const result = await query(statsQuery);

        res.status(200).json({
            success: true,
            stats: result.rows[0],
        });
    } catch (error) {
        console.error('Statistikani olishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Serverda xatolik yuz berdi.',
            error: error.message,
        });
    }
}

