import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import carRoutes from './routes/carRoutes.js';
import rentalRoutes from './routes/rentalRoutes.js';
import { pool } from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 1122;

// Middlewarelar
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statik frontend fayllari (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// API yo'riqnomasi marshruti
app.get('/api/docs', (req, res) => {
    res.json({
        message: "🚗 Avto Ijara (Car Rental) API tizimi",
        status: "Active",
        port: PORT,
        endpoints: {
            cars: {
                "GET /api/cars": "Barcha mashinalarni olish (filtrlar: brand, status, fuel_type, max_price, search)",
                "GET /api/cars/:id": "Bitta mashinani barcha 10+ ma'lumotlari bilan olish",
                "POST /api/cars": "Yangi mashina qo'shish (10 ta maydon bilan)",
                "PUT /api/cars/:id": "Mashina ma'lumotlarini yangilash",
                "DELETE /api/cars/:id": "Mashinani o'chirish",
            },
            rentals: {
                "GET /api/rentals": "Barcha ijara shartnomalarini olish",
                "GET /api/rentals/stats": "Umumiy statistika",
                "GET /api/rentals/:id": "Bitta ijara tafsiloti",
                "POST /api/rentals": "Avtomobilni ijaraga berish",
                "PATCH /api/rentals/:id/return": "Mashinani qaytarib olish",
                "PATCH /api/rentals/:id/cancel": "Ijarani bekor qilish",
                "DELETE /api/rentals/:id": "Ijara yozuvini o'chirish",
            },
        },
    });
});

// API Marshrutlari
app.use('/api/cars', carRoutes);
app.use('/api/rentals', rentalRoutes);

// 404 handler (API so'rovlari uchun)
app.use('/api', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Bunday API yo'nalishi mavjud emas: ${req.method} ${req.originalUrl}`,
    });
});

// Barcha boshqa noma'lum sahifa so'rovlarini frontend index.html ga yo'naltirish
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Xatoliklarni ushlovchi middleware
app.use((err, req, res, next) => {
    console.error('Server xatosi:', err);
    res.status(500).json({
        success: false,
        message: 'Ichki server xatoligi yuz berdi.',
        error: err.message,
    });
});

// Serverni ishga tushirish
app.listen(PORT, async () => {
    console.log(`🚀 Avto Ijara tizimi ishga tushdi: http://localhost:${PORT}`);
    try {
        const client = await pool.connect();
        console.log(`✅ PostgreSQL ma'lumotlar bazasiga muvaffaqiyatli ulandi (${process.env.DB_NAME || 'car_rental_db'})`);
        client.release();
    } catch (err) {
        console.error(`❌ PostgreSQL ga ulanishda xatolik:`, err.message);
    }
});
