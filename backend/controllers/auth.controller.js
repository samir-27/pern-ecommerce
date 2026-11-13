import { asyncHandler } from '../utils/asyncHandler.js';
import * as authService from '../services/auth.service.js';

export const registerUser = asyncHandler(async (req, res) => {
    const result = await authService.registerUserService(req.body);
    res.status(201).json({
        message: 'User registered successfully',
        token: result.token,
        user: result.user
    });
});

export const registerBrandSeller = asyncHandler(async (req, res) => {
    const result = await authService.registerBrandSellerService(req.body);
    res.status(201).json({
        message: 'Brand Seller registered successfully',
        token: result.token,
        user: result.user,
        brand: result.brand
    });
});

export const loginUser = asyncHandler(async (req, res) => {
    const result = await authService.loginUserService(req.body);
    res.json({
        message: 'Login successful',
        token: result.token,
        user: result.user,
        brand: result.brand
    });
});

export const getUserProfile = asyncHandler(async (req, res) => {
    const profile = await authService.getUserProfileService(req.user.id);
    res.json(profile);
});

export const updateUserProfile = asyncHandler(async (req, res) => {
    const result = await authService.updateUserProfileService(req.user.id, req.body);
    res.json({
        message: 'Profile updated successfully',
        user: result
    });
});

export const updateUserPassword = asyncHandler(async (req, res) => {
    await authService.updateUserPasswordService(req.user.id, req.body);
    res.json({ message: 'Password updated successfully' });
});

export const getUserAddresses = asyncHandler(async (req, res) => {
    const addresses = await authService.getUserAddressesService(req.user.id);
    res.json(addresses);
});

export const createUserAddress = asyncHandler(async (req, res) => {
    const address = await authService.createUserAddressService(req.user.id, req.body);
    res.status(201).json(address);
});

export const deleteUserAddress = asyncHandler(async (req, res) => {
    await authService.deleteUserAddressService(req.user.id, req.params.id);
    res.json({ message: 'Address removed successfully' });
});

export const setDefaultUserAddress = asyncHandler(async (req, res) => {
    const address = await authService.setDefaultUserAddressService(req.user.id, req.params.id);
    res.json(address);
});
