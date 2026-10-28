# 🚗 Avto Ijara (Car Rental) CRUD API

PostgreSQL va Express.js asosida ishlab chiqilgan avtomobillarni ijaraga berish (Car Rental) boshqaruv tizimi.

- **Port:** `1122`
- **Ma'lumotlar bazasi:** PostgreSQL (`car_rental_db`)
- **Node.js moduli:** ES Modules (`"type": "module"`)

---

## 📋 Mashinaning 10 ta ma'lumot maydoni:

Jadvaldagi har bir avtomobil quyidagi 10 ta asosiy xususiyatga ega:
1. `brand` – Ishlab chiqaruvchi brendi (masalan: Chevrolet, Kia, BMW)
2. `model` – Mashina modeli (masalan: Malibu 2 Turbo, K5, X5)
3. `year` – Ishlab chiqarilgan yili (masalan: 2023)
4. `color` – Mashina rangi (masalan: Qora, Oq marvarid)
5. `fuel_type` – Yoqilg'i turi (Benzin, Gaz, Dizel, Elektro, Gibrid)
6. `transmission` – Uzatmalar qutisi (Avtomat, Mexanika)
7. `mileage` – Bosib o'tgan masofasi (km)
8. `license_plate` – Davlat raqami (masalan: 01 A 777 AA)
9. `daily_price` – Kunlik ijara narxi (so'mda)
10. `status` – Holati (`available`, `rented`, `maintenance`)

*(Qo'shimcha: `id` va `created_at` maydonlari mavjud)*

---

## ⚙️ O'rnatish va Ishga tushirish

1. **Kutubxonalarni o'rnatish:**
   ```bash
   npm install
   ```

2. **Bazani yaratish va 10 ta namunaviy mashinani kiritish:**
   ```bash
   npm run db:setup
   ```

3. **Serverni ishga tushirish:**
   ```bash
   npm start
   # yoki fayllar o'zgarishini kuzatish rejimi:
   npm run dev
   ```

Server manzili: `http://localhost:1122`

---

## 🛣 API Yo'nalishlari (Endpoints)

### 1. Avtomobillar (Cars CRUD)
| Metod | URL | Tavsif |
|---|---|---|
| `GET` | `/api/cars` | Barcha mashinalarni olish (filtrlar: `brand`, `status`, `fuel_type`, `transmission`, `max_price`, `search`) |
| `GET` | `/api/cars/:id` | Bitta mashina va uning ijara tarixini olish |
| `POST` | `/api/cars` | Yangi mashina qo'shish |
| `PUT` | `/api/cars/:id` | Mashina ma'lumotlarini to'liq/qisman tahrirlash |
| `DELETE` | `/api/cars/:id` | Mashinani o'chirish |

### 2. Ijaralar (Rentals CRUD & Management)
| Metod | URL | Tavsif |
|---|---|---|
| `GET` | `/api/rentals` | Barcha ijara shartnomalarini ko'rish |
| `GET` | `/api/rentals/stats` | Umumiy statistika (jami mashinalar, band mashinalar, tushum) |
| `GET` | `/api/rentals/:id` | Bitta ijara ma'lumotini ko'rish |
| `POST` | `/api/rentals` | Mashinani ijaraga berish (mashina statusini avtomatik `rented` qiladi) |
| `PATCH` | `/api/rentals/:id/return` | Mashinani qaytarish (ijarani `completed` va mashinani `available` qiladi) |
| `PATCH` | `/api/rentals/:id/cancel` | Ijarani bekor qilish |
| `DELETE` | `/api/rentals/:id` | Ijara yozuvini o'chirish |

---

## 📝 Namunaviy so'rovlar (JSON)

### Yangi mashina qo'shish (`POST /api/cars`):
```json
{
  "brand": "Kia",
  "model": "K8",
  "year": 2024,
  "color": "Qora",
  "fuel_type": "Benzin",
  "transmission": "Avtomat",
  "mileage": 8000,
  "license_plate": "01 R 888 RR",
  "daily_price": 950000,
  "status": "available"
}
```

### Mashinani ijaraga berish (`POST /api/rentals`):
```json
{
  "car_id": 2,
  "customer_name": "Jasur Karimov",
  "customer_phone": "+998901112233",
  "customer_passport": "AA9988776",
  "start_date": "2026-10-25",
  "end_date": "2026-10-28"
}
```

