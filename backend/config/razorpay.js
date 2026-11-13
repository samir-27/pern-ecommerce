import Razorpay from 'razorpay';

export const getRazorpayClient = () => {
    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

    if (!keyId || !keySecret || keyId.includes('your_key') || keySecret.includes('your_key')) {
        throw new Error('Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend/.env');
    }

    return new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
    });
};
