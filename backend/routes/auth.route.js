import express from 'express';
import { 
    registerUser, 
    registerBrandSeller, 
    loginUser, 
    getUserProfile, 
    updateUserProfile, 
    updateUserPassword,
    getUserAddresses,
    createUserAddress,
    deleteUserAddress,
    setDefaultUserAddress
} from '../controllers/auth.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';
import { validatePassword, validatePasswordUpdate } from '../middleware/validator.middleware.js';

const router = express.Router();

router.post('/register', validatePassword, registerUser);
router.post('/register-brand', validatePassword, registerBrandSeller);
router.post('/login', loginUser);
router.get('/profile', protectRoute, getUserProfile);
router.put('/profile', protectRoute, updateUserProfile);
router.put('/password', protectRoute, validatePasswordUpdate, updateUserPassword);

// Saved Addresses Management
router.get('/addresses', protectRoute, getUserAddresses);
router.post('/addresses', protectRoute, createUserAddress);
router.delete('/addresses/:id', protectRoute, deleteUserAddress);
router.put('/addresses/:id/default', protectRoute, setDefaultUserAddress);

export default router;