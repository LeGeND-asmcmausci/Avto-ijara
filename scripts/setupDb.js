import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
};

const targetDbName = process.env.DB_NAME || 'car_rental_db';

export async function setupDatabase() {
    // 1. Standart 'postgres' bazasiga ulanish (baza mavjudligini tekshirish uchun)
    const adminClient = new Client({
        ...dbConfig,
        database: 'postgres',
    });

    try {
        await adminClient.connect();
        console.log(`[DB Setup] PostgreSQL serveriga ulanish o'rnatildi.`);

        // Baza mavjudligini tekshirish
        const checkDbRes = await adminClient.query(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            [targetDbName]
        );

        if (checkDbRes.rowCount === 0) {
            console.log(`[DB Setup] '${targetDbName}' bazasi mavjud emas. Yangi baza yaratilmoqda...`);
            await adminClient.query(`CREATE DATABASE "${targetDbName}"`);
            console.log(`[DB Setup] '${targetDbName}' bazasi muvaffaqiyatli yaratildi.`);
        } else {
            console.log(`[DB Setup] '${targetDbName}' bazasi allaqachon mavjud.`);
        }
    } catch (err) {
        console.error('[DB Setup] Baza yaratishda xatolik:', err.message);
        throw err;
    } finally {
        await adminClient.end();
    }

    // 2. Yangi 'car_rental_db' bazasiga ulanib sxema va boshlang'ich ma'lumotlarni yozish
    const targetClient = new Client({
        ...dbConfig,
        database: targetDbName,
    });

    try {
        await targetClient.connect();
        console.log(`[DB Setup] '${targetDbName}' bazasiga ulanish amalga oshirildi.`);

        // Schema ni o'qish va bajarish
        const schemaPath = path.join(__dirname, '../sql/schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await targetClient.query(schemaSql);
        console.log(`[DB Setup] Jadvallar (cars, rentals) yaratildi.`);

        // Seed ma'lumotlarni o'qish va bajarish
        const seedPath = path.join(__dirname, '../sql/seed.sql');
        const seedSql = fs.readFileSync(seedPath, 'utf8');
        await targetClient.query(seedSql);
        console.log(`[DB Setup] 10 ta namunaviy mashina va ijara ma'lumotlari kiritildi.`);

        console.log(`[DB Setup] Barcha ma'lumotlar bazasi amallari muvaffaqiyatli yakunlandi!`);
    } catch (err) {
        console.error('[DB Setup] Sxema yoki seed bajarishda xatolik:', err.message);
        throw err;
    } finally {
        await targetClient.end();
    }
}

// Skript to'g'ridan-to'g'ri chaqirilsa ishga tushirish
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    setupDatabase()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

export default setupDatabase;
