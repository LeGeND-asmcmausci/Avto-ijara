import express from 'express';
import {
    getAllCars,
    getCarById,
    createCar,
    updateCar,
    deleteCar,
} from '../controllers/carController.js';

const router = express.Router();

// Mashinalar bo'yicha marshrutlar (CRUD)
router.get('/', getAllCars);
router.get('/:id', getCarById);
router.post('/', createCar);
router.put('/:id', updateCar);
router.delete('/:id', deleteCar);

export default router;

