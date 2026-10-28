// Global holat (State)
let allCars = [];
let selectedCarForRent = null;

// DOM elementlari
const carsContainer = document.getElementById('carsContainer');
const rentalsTableBody = document.getElementById('rentalsTableBody');
const searchInput = document.getElementById('searchInput');
const filterStatus = document.getElementById('filterStatus');
const filterBrand = document.getElementById('filterBrand');
const sortCars = document.getElementById('sortCars');
const btnResetFilters = document.getElementById('btnResetFilters');

// Stats elementlari
const statTotalCars = document.getElementById('statTotalCars');
const statAvailableCars = document.getElementById('statAvailableCars');
const statRentedCars = document.getElementById('statRentedCars');
const statTotalRevenue = document.getElementById('statTotalRevenue');

// Modallar
const carModal = document.getElementById('carModal');
const rentModal = document.getElementById('rentModal');
const carForm = document.getElementById('carForm');
const rentForm = document.getElementById('rentForm');
const carModalTitle = document.getElementById('carModalTitle');

// Narxni so'm formatiga o'tkazish yordamchisi (masalan: 600 000 so'm)
function formatCurrency(amount) {
    if (!amount) return '0 so\'m';
    return Number(amount).toLocaleString('uz-UZ') + ' so\'m';
}

// 1. STATISTIKANI YUKLASH
async function loadStats() {
    try {
        const res = await fetch('/api/rentals/stats');
        const data = await res.json();
        if (data.success) {
            statTotalCars.textContent = data.stats.total_cars || '0';
            statAvailableCars.textContent = data.stats.available_cars || '0';
            statRentedCars.textContent = data.stats.rented_cars || '0';
            statTotalRevenue.textContent = formatCurrency(data.stats.total_revenue);
        }
    } catch (err) {
        console.error('Statistika yuklashda xatolik:', err);
    }
}

// 2. MASHINALARNI YUKLASH VA CHIQARISH (10 ta ma'lumot)
async function loadCars() {
    carsContainer.innerHTML = `
        <div class="loading-spinner">
            <i class="fa-solid fa-circle-notch fa-spin"></i> Mashinalar yuklanmoqda...
        </div>
    `;

    try {
        const res = await fetch('/api/cars');
        const data = await res.json();

        if (data.success) {
            allCars = data.data;
            renderCars();
        } else {
            carsContainer.innerHTML = `<div class="loading-spinner">Xatolik: ${data.message}</div>`;
        }
    } catch (err) {
        carsContainer.innerHTML = `<div class="loading-spinner">Server bilan bog'lanib bo'lmadi!</div>`;
    }
}


// 1. Narxni o'zgartirish funksiyasi (PUT so'rovi)
async function updateCarPrice(carId) {
    const newPrice = prompt("Yangi kunlik narxni kiriting:");
    if (!newPrice) return;

    try {
        const response = await fetch(`http://localhost:1122/api/cars/${carId}`, { 
            method: 'PUT', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ daily_price: parseFloat(newPrice) }) 
        });  
        
        const data = await response.json(); 
        if (data.success) { 
            alert("Narx muvaffaqiyatli o'zgartirildi!"); 
            loadCars(); // Ro'yxatni serverdan qayta yuklab olish 
        } else { 
            alert("Xatolik: " + data.message); 
        } 
    } catch (error) { 
        console.error("Xatolik:", error); 
    } 
}

// 2. Mashinani o'chirish funksiyasi (DELETE so'rovi)
async function deleteCar(carId) {
    const isConfirmed = confirm("Haqiqatan ham bu mashinani o'chirmoqchimisiz?");
    if (!isConfirmed) return;

    try {
        const response = await fetch(`http://localhost:1122/api/cars/${carId}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        if (data.success) {
            alert("Mashina o'chirildi!");
            loadCars(); // Ro'yxatni yangilash
        } else {
            alert("Xatolik: " + data.message);
        }
    } catch (error) {
        console.error("Xatolik:", error);
    }
}

function renderCars() {
    let filtered = [...allCars];

    // Qidiruv
    const query = searchInput.value.toLowerCase().trim();
    if (query) {
        filtered = filtered.filter(car => 
            car.brand.toLowerCase().includes(query) ||
            car.model.toLowerCase().includes(query) ||
            car.license_plate.toLowerCase().includes(query)
        );
    }

    // Status filtri
    const statusVal = filterStatus.value;
    if (statusVal) {
        filtered = filtered.filter(car => car.status === statusVal);
    }

    // Brend filtri
    const brandVal = filterBrand.value;
    if (brandVal) {
        filtered = filtered.filter(car => car.brand.toLowerCase() === brandVal.toLowerCase());
    }

    // Saralash
    const sortVal = sortCars.value;
    if (sortVal === 'price-asc') {
        filtered.sort((a, b) => parseFloat(a.daily_price) - parseFloat(b.daily_price));
    } else if (sortVal === 'price-desc') {
        filtered.sort((a, b) => parseFloat(b.daily_price) - parseFloat(a.daily_price));
    } else if (sortVal === 'year-desc') {
        filtered.sort((a, b) => b.year - a.year);
    } else {
        filtered.sort((a, b) => a.id - b.id);
    }

    if (filtered.length === 0) {
        carsContainer.innerHTML = `
            <div class="loading-spinner">
                <i class="fa-solid fa-car-tunnel" style="font-size: 40px; margin-bottom: 12px; display:block;"></i>
                Qidiruv bo'yicha hech qanday mashina topilmadi.
            </div>
        `;
        return;
    }

    carsContainer.innerHTML = filtered.map(car => {
        const isAvail = car.status === 'available';
        const statusClass = car.status === 'available' ? 'badge-available' : (car.status === 'rented' ? 'badge-rented' : 'badge-maintenance');
        const statusText = car.status === 'available' ? 'Bo\'sh (Tayyor)' : (car.status === 'rented' ? 'Ijarada' : 'Ta\'mirda');

        return `
            <div class="car-card">
                <!-- Sarlavha va Holat -->
                <div class="car-card-header">
                    <div class="car-title-wrap">
                        <span class="car-brand-sub">${escapeHtml(car.brand)}</span>
                        <h3>${escapeHtml(car.model)}</h3>
                    </div>
                    <span class="badge ${statusClass}">${statusText}</span>
                </div>

                <!-- Davlat Raqami (Uzbek License Plate) -->
                <div class="plate-container">
                    <div class="uz-plate">
                        <div class="plate-flag">
                            <div class="flag-blue"></div>
                            <div class="flag-red"></div>
                            <div class="flag-white"></div>
                            <div class="flag-green"></div>
                        </div>
                        <span>${escapeHtml(car.license_plate)}</span>
                        <div class="uz-code">UZ</div>
                    </div>
                </div>

                <!-- 10 ta asosiy ma'lumot (Texnik xususiyatlar) -->
                <div class="car-specs">
                    <div class="spec-item" title="Yili">
                        <i class="fa-regular fa-calendar"></i>
                        <span>Yili: <strong>${car.year}</strong></span>
                    </div>
                    <div class="spec-item" title="Rangi">
                        <i class="fa-solid fa-palette"></i>
                        <span>Rangi: <strong>${escapeHtml(car.color)}</strong></span>
                    </div>
                    <div class="spec-item" title="Yoqilg'i">
                        <i class="fa-solid fa-gas-pump"></i>
                        <span>Yoqilg'i: <strong>${escapeHtml(car.fuel_type)}</strong></span>
                    </div>
                    <div class="spec-item" title="Uzatmalar qutisi">
                        <i class="fa-solid fa-gear"></i>
                        <span>Korobka: <strong>${escapeHtml(car.transmission)}</strong></span>
                    </div>
                    <div class="spec-item" title="Bosib o'tgan masofasi">
                        <i class="fa-solid fa-gauge-high"></i>
                        <span>Masofa: <strong>${Number(car.mileage).toLocaleString('uz-UZ')} km</strong></span>
                    </div>
                    <div class="spec-item" title="ID">
                        <i class="fa-solid fa-hashtag"></i>
                        <span>ID: <strong>#${car.id}</strong></span>
                    </div>
                </div>

                <!-- Kunlik narx qatori -->
                <div class="car-price-bar">
                    <div>
                        <span class="price-sub">Kunlik ijara narxi</span>
                        <span class="price-tag">${formatCurrency(car.daily_price)}</span>
                    </div>
                </div>

                <!-- Amallar tugmalari -->
                <div class="car-card-actions">
                    ${isAvail ? `
                        <button class="btn btn-success btn-sm" onclick="openRentModal(${car.id})" style="flex:1;">
                            <i class="fa-solid fa-key"></i> Ijaraga berish
                        </button>
                    ` : `
                        <button class="btn btn-secondary btn-sm" disabled style="flex:1; opacity: 0.6; cursor: not-allowed;">
                            <i class="fa-solid fa-ban"></i> Band qilingan
                        </button>
                    `}
                    <button class="btn btn-secondary btn-sm" onclick="openEditCarModal(${car.id})" title="Tahrirlash">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteCar(${car.id})" title="O'chirish">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// 3. IJARALAR JURNALINI YUKLASH VA CHIQARISH
async function loadRentals() {
    const filterStatusVal = document.getElementById('filterRentalStatus').value;
    let url = '/api/rentals';
    if (filterStatusVal) {
        url += `?status=${filterStatusVal}`;
    }

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (data.success) {
            renderRentals(data.data);
        }
    } catch (err) {
        rentalsTableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Ijaralarni yuklashda xatolik!</td></tr>`;
    }
}

function renderRentals(rentals) {
    if (rentals.length === 0) {
        rentalsTableBody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding: 30px;">Hozircha ijara shartnomalari mavjud emas.</td></tr>`;
        return;
    }

    rentalsTableBody.innerHTML = rentals.map(r => {
        let badgeClass = 'badge-available';
        let badgeText = 'Faol';
        if (r.status === 'completed') {
            badgeClass = 'badge-available';
            badgeText = 'Yakunlangan';
        } else if (r.status === 'cancelled') {
            badgeClass = 'badge-maintenance';
            badgeText = 'Bekor qilingan';
        } else if (r.status === 'active') {
            badgeClass = 'badge-rented';
            badgeText = 'Faol (Ijarada)';
        }

        const startDate = new Date(r.start_date).toLocaleDateString('uz-UZ');
        const endDate = new Date(r.end_date).toLocaleDateString('uz-UZ');

        return `
            <tr>
                <td><strong>#${r.id}</strong></td>
                <td>
                    <strong>${escapeHtml(r.brand)} ${escapeHtml(r.model)}</strong>
                    <div style="font-size: 11px; color: var(--gray-500);">${escapeHtml(r.license_plate)}</div>
                </td>
                <td><strong>${escapeHtml(r.customer_name)}</strong></td>
                <td>
                    <div><i class="fa-solid fa-phone" style="font-size:11px;"></i> ${escapeHtml(r.customer_phone)}</div>
                    <div style="font-size: 11px; color: var(--gray-500);"><i class="fa-solid fa-id-card"></i> ${escapeHtml(r.customer_passport)}</div>
                </td>
                <td>
                    <div>${startDate} ➔ ${endDate}</div>
                    <span style="font-size: 11px; color: var(--primary); font-weight: 600;">${r.total_days} kun</span>
                </td>
                <td><strong style="color: var(--dark);">${formatCurrency(r.total_price)}</strong></td>
                <td><span class="badge ${badgeClass}">${badgeText}</span></td>
                <td>
                    <div style="display:flex; gap: 6px;">
                        ${r.status === 'active' ? `
                            <button class="btn btn-success btn-sm" onclick="returnRentalCar(${r.id})" title="Mashinani qabul qilish">
                                <i class="fa-solid fa-circle-check"></i> Qabul qilish
                            </button>
                            <button class="btn btn-secondary btn-sm" onclick="cancelRentalOrder(${r.id})" title="Bekor qilish">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-danger btn-sm" onclick="deleteRentalRecord(${r.id})" title="O'chirish">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// 4. MASHINA QO'SHISH / TAHRIRLASH MODALI
document.getElementById('btnOpenAddCarModal').addEventListener('click', () => {
    carModalTitle.innerHTML = `<i class="fa-solid fa-plus"></i> Yangi mashina qo'shish`;
    carForm.reset();
    document.getElementById('carId').value = '';
    document.getElementById('carStatus').value = 'available';
    carModal.classList.add('active');
});

window.openEditCarModal = function(id) {
    const car = allCars.find(c => c.id === id);
    if (!car) return;

    carModalTitle.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Mashinani tahrirlash (#${car.id})`;
    document.getElementById('carId').value = car.id;
    document.getElementById('carBrand').value = car.brand;
    document.getElementById('carModel').value = car.model;
    document.getElementById('carYear').value = car.year;
    document.getElementById('carColor').value = car.color;
    document.getElementById('carFuelType').value = car.fuel_type;
    document.getElementById('carTransmission').value = car.transmission;
    document.getElementById('carMileage').value = car.mileage;
    document.getElementById('carLicensePlate').value = car.license_plate;
    document.getElementById('carDailyPrice').value = car.daily_price;
    document.getElementById('carStatus').value = car.status;

    carModal.classList.add('active');
};

document.getElementById('btnCloseCarModal').addEventListener('click', () => carModal.classList.remove('active'));
document.getElementById('btnCancelCarModal').addEventListener('click', () => carModal.classList.remove('active'));

carForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('carId').value;
    const carData = {
        brand: document.getElementById('carBrand').value.trim(),
        model: document.getElementById('carModel').value.trim(),
        year: parseInt(document.getElementById('carYear').value),
        color: document.getElementById('carColor').value.trim(),
        fuel_type: document.getElementById('carFuelType').value,
        transmission: document.getElementById('carTransmission').value,
        mileage: parseInt(document.getElementById('carMileage').value) || 0,
        license_plate: document.getElementById('carLicensePlate').value.trim().toUpperCase(),
        daily_price: parseFloat(document.getElementById('carDailyPrice').value),
        status: document.getElementById('carStatus').value,
    };

    try {
        let res;
        if (id) {
            // Update (PUT)
            res = await fetch(`/api/cars/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(carData),
            });
        } else {
            // Create (POST)
            res = await fetch('/api/cars', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(carData),
            });
        }

        const result = await res.json();
        if (result.success) {
            showToast(result.message, 'success');
            carModal.classList.remove('active');
            loadCars();
            loadStats();
        } else {
            showToast(result.message, 'error');
        }
    } catch (err) {
        showToast('Server bilan bog\'lanishda xatolik!', 'error');
    }
});

window.deleteCar = async function(id) {
    if (!confirm(`Haqiqatan ham #${id} raqamli mashinani o'chirmoqchimisiz?`)) return;

    try {
        const res = await fetch(`/api/cars/${id}`, { method: 'DELETE' });
        const result = await res.json();
        if (result.success) {
            showToast(result.message, 'success');
            loadCars();
            loadStats();
        } else {
            showToast(result.message, 'error');
        }
    } catch (err) {
        showToast('O\'chirishda xatolik yuz berdi!', 'error');
    }
};

// 5. MASHINANI IJARAGA BERISH MODALI VA AMALLARI
window.openRentModal = function(id) {
    const car = allCars.find(c => c.id === id);
    if (!car) return;

    selectedCarForRent = car;
    document.getElementById('rentCarId').value = car.id;
    document.getElementById('rentCarTitle').textContent = `${car.brand} ${car.model} (${car.license_plate})`;
    document.getElementById('rentCarPrice').textContent = `${formatCurrency(car.daily_price)} / kun`;

    // Boshlang'ich sanalarni bugun va ertangi kunga sozlash
    const today = new Date().toISOString().split('T')[0];
    const nextDay = new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];
    
    document.getElementById('startDate').value = today;
    document.getElementById('endDate').value = nextDay;

    updateRentCalculation();
    rentModal.classList.add('active');
};

document.getElementById('btnCloseRentModal').addEventListener('click', () => rentModal.classList.remove('active'));
document.getElementById('btnCancelRentModal').addEventListener('click', () => rentModal.classList.remove('active'));

// Sanalar o'zgarganda narxni avtomatik hisoblash
function updateRentCalculation() {
    if (!selectedCarForRent) return;

    const startDateVal = document.getElementById('startDate').value;
    const endDateVal = document.getElementById('endDate').value;

    if (!startDateVal || !endDateVal) return;

    const start = new Date(startDateVal);
    const end = new Date(endDateVal);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
        const total = diffDays * parseFloat(selectedCarForRent.daily_price);
        document.getElementById('calcDays').textContent = `${diffDays} kun`;
        document.getElementById('calcTotalPrice').textContent = formatCurrency(total);
        document.getElementById('btnConfirmRent').disabled = false;
    } else {
        document.getElementById('calcDays').textContent = 'Noto\'g\'ri sana!';
        document.getElementById('calcTotalPrice').textContent = '0 so\'m';
        document.getElementById('btnConfirmRent').disabled = true;
    }
}

document.getElementById('startDate').addEventListener('change', updateRentCalculation);
document.getElementById('endDate').addEventListener('change', updateRentCalculation);

rentForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const rentData = {
        car_id: parseInt(document.getElementById('rentCarId').value),
        customer_name: document.getElementById('customerName').value.trim(),
        customer_phone: document.getElementById('customerPhone').value.trim(),
        customer_passport: document.getElementById('customerPassport').value.trim().toUpperCase(),
        start_date: document.getElementById('startDate').value,
        end_date: document.getElementById('endDate').value,
    };

    try {
        const res = await fetch('/api/rentals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rentData),
        });

        const result = await res.json();
        if (result.success) {
            showToast(result.message, 'success');
            rentModal.classList.remove('active');
            rentForm.reset();
            loadCars();
            loadRentals();
            loadStats();
        } else {
            showToast(result.message, 'error');
        }
    } catch (err) {
        showToast('Ijarani rasmiylashtirishda xatolik!', 'error');
    }
});

// Mashinani qaytarish
window.returnRentalCar = async function(id) {
    if (!confirm('Avtomobil qaytarildimi? Ijarani yakunlashni tasdiqlaysizmi?')) return;

    try {
        const res = await fetch(`/api/rentals/${id}/return`, { method: 'PATCH' });
        const result = await res.json();
        if (result.success) {
            showToast(result.message, 'success');
            loadCars();
            loadRentals();
            loadStats();
        } else {
            showToast(result.message, 'error');
        }
    } catch (err) {
        showToast('Mashinani qaytarishda xatolik!', 'error');
    }
};

// Ijarani bekor qilish
window.cancelRentalOrder = async function(id) {
    if (!confirm('Ijarani bekor qilmoqchimisiz?')) return;

    try {
        const res = await fetch(`/api/rentals/${id}/cancel`, { method: 'PATCH' });
        const result = await res.json();
        if (result.success) {
            showToast(result.message, 'success');
            loadCars();
            loadRentals();
            loadStats();
        } else {
            showToast(result.message, 'error');
        }
    } catch (err) {
        showToast('Bekor qilishda xatolik!', 'error');
    }
};

// Ijara yozuvini o'chirish
window.deleteRentalRecord = async function(id) {
    if (!confirm('Ushbu ijara yozuvini bazadan butunlay o\'chirmoqchimisiz?')) return;

    try {
        const res = await fetch(`/api/rentals/${id}`, { method: 'DELETE' });
        const result = await res.json();
        if (result.success) {
            showToast(result.message, 'success');
            loadCars();
            loadRentals();
            loadStats();
        } else {
            showToast(result.message, 'error');
        }
    } catch (err) {
        showToast('O\'chirishda xatolik!', 'error');
    }
};

// 6. TABLARNI ALMASHTIRISH
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const targetTab = btn.getAttribute('data-tab');
        document.getElementById(targetTab).classList.add('active');

        if (targetTab === 'tabRentals') {
            loadRentals();
        }
    });
});

// Filtrlarni kuzatish
searchInput.addEventListener('input', renderCars);
filterStatus.addEventListener('change', renderCars);
filterBrand.addEventListener('change', renderCars);
sortCars.addEventListener('change', renderCars);
btnResetFilters.addEventListener('click', () => {
    searchInput.value = '';
    filterStatus.value = '';
    filterBrand.value = '';
    sortCars.value = 'id-asc';
    renderCars();
});

document.getElementById('filterRentalStatus').addEventListener('change', loadRentals);

// TOAST BILDIRISHNOMASI
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}"></i>
        <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// Xavfsiz matn chiqarish
function escapeHtml(text) {
    if (!text) return '';
    return text.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Dastlabki yuklash
loadStats();
loadCars();
loadRentals();

