import express from 'express';
import { registerUser, loginUser, getUserProfile } from '../controllers/auth.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile',protectRoute,getUserProfile)

export default router;