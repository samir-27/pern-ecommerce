import express from 'express';
import { registerUser, loginUser, getUserProfile, updateUserProfile, updateUserPassword } from '../controllers/auth.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile',protectRoute,getUserProfile)
router.put('/profile', protectRoute, updateUserProfile);
router.put('/password', protectRoute, updateUserPassword);

export default router;