import { asyncHandler } from '../utils/asyncHandler.js';
import * as orderService from '../services/order.service.js';

export const createPaymentOrder = asyncHandler(async (req, res) => {
    const data = await orderService.createPaymentOrderService(req.user.id, req.body.orderItems);
    res.json(data);
});

export const verifyPayment = asyncHandler(async (req, res) => {
    const result = await orderService.verifyPaymentService(req.user.id, req.body);
    if (result.alreadyProcessed) {
        return res.json({
            message: 'Payment already processed',
            order: result.order
        });
    }
    res.status(201).json({
        message: 'Payment verified and marketplace order created successfully',
        order: result.order
    });
});

export const createOrder = asyncHandler(async (req, res) => {
    const newOrder = await orderService.createOrderService(req.user.id, req.body);
    res.status(201).json({
        message: 'Order created successfully',
        order: newOrder
    });
});

export const getMyOrders = asyncHandler(async (req, res) => {
    const orders = await orderService.getMyOrdersService(req.user.id);
    res.json(orders);
});

export const requestReturn = asyncHandler(async (req, res) => {
    const returnRequest = await orderService.requestReturnService(req.user.id, req.body);
    res.status(201).json({
        message: 'Return request submitted successfully',
        returnRequest
    });
});

export const getMyReturns = asyncHandler(async (req, res) => {
    const returns = await orderService.getMyReturnsService(req.user.id);
    res.json(returns);
});
