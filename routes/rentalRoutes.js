import express from 'express';
import {
    getAllRentals,
    getRentalById,
    createRental,
    returnCarRental,
    cancelRental,
    deleteRental,
    getStats,
} from '../controllers/rentalController.js';

const router = express.Router();

// Ijaralar bo'yicha marshrutlar (CRUD)
router.get('/', getAllRentals);
router.get('/stats', getStats);
router.get('/:id', getRentalById);
router.post('/', createRental);
router.patch('/:id/return', returnCarRental);
router.patch('/:id/cancel', cancelRental);
router.delete('/:id', deleteRental);

export default router;

