import User from "../models/user.model.js";
import { razorpay } from "../server.js";
import AppError from "../utils/error.util.js";
import crypto from 'crypto';
import Payment from "../models/payment.model.js"; // Add missing import

const getRazorpayApiKey = async (req, res, next) => {
    try {
        // Debug log
        console.log('Razorpay Key Check:', {
            keyExists: !!process.env.RAZORPAY_KEY_ID,
            user: req.user?.id
        });

        if (!process.env.RAZORPAY_KEY_ID) {
            throw new Error('RAZORPAY_KEY_ID not found in environment');
        }

        res.status(200).json({
            success: true,
            key: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('Razorpay key fetch error:', error);
        return next(new AppError(error.message || 'Could not get razorpay key', 500));
    }
};

const buySubscription = async (req, res, next) => {
    try {
        const { id } = req.user;
        const user = await User.findById(id);

        if (!user) {
            return next(new AppError('Unauthorized, please login', 401));
        }

        if (user.role === "ADMIN") {
            return next(new AppError('Admin cannot purchase a subscription', 400));
        }

        // Fixed: Changed razorpayInstance to razorpay
        const subscription = await razorpay.subscriptions.create({
            plan_id: process.env.RAZORPAY_PLAN_ID,
            customer_notify: 1,
            total_count: 12 // Add number of billing cycles
        });

        console.log('Created subscription:', subscription); // Debug log

        user.subscription.id = subscription.id;
        user.subscription.status = subscription.status;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Subscribed Successfully',
            subscription_id: subscription.id
        });
    } catch (error) {
        console.error('Subscription error:', error);
        return next(new AppError(error.message || 'Subscription creation failed', 500));
    }
};

const verifySubscription = async (req, res, next) => {
    try {
        const { razorpay_payment_id, razorpay_signature, razorpay_subscription_id } = req.body;
        const userId = req.user.id;

        // Debug logs
        console.log('Payment verification data:', {
            payment_id: razorpay_payment_id,
            signature: razorpay_signature,
            subscription_id: razorpay_subscription_id,
            userId
        });

        // Verify user exists
        const user = await User.findById(userId);
        if (!user) {
            return next(new AppError('User not found', 404));
        }

        // Verify signature
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_SECRET)
            .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            // Create failed payment record
            await Payment.create({
                razorpay_payment_id,
                razorpay_subscription_id,
                razorpay_signature,
                user: userId,
                amount: 499,
                status: 'failed'
            });

            return next(new AppError('Payment verification failed', 400));
        }

        // Create successful payment record
        await Payment.create({
            razorpay_payment_id,
            razorpay_subscription_id,
            razorpay_signature,
            user: userId,
            amount: 499,
            status: 'successful'
        });

        // Update user subscription
        user.subscription.id = razorpay_subscription_id;
        user.subscription.status = 'active';
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Payment verified successfully!'
        });

    } catch (error) {
        console.error('Payment verification error:', error);
        return next(new AppError(error.message || 'Payment verification failed', 500));
    }
};

const cancelSubscription = async (req, res, next) => {
    try {
        const { id } = req.user;
        const user = await User.findById(id);

        if (!user) {
            return next(new AppError('Unauthorized, please login', 401));
        }

        if (user.role === "ADMIN") {
            return next(new AppError('Admin cannot cancel subscription', 400));
        }

        const subscriptionId = user.subscription.id;
        if (!subscriptionId) {
            return next(new AppError('No active subscription found', 400));
        }

        const subscription = await razorpay.subscriptions.cancel(subscriptionId);
        console.log('Cancelled subscription:', subscription); // Debug log

        user.subscription.status = subscription.status;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Subscription cancelled successfully'
        });
    } catch (error) {
        console.error('Subscription cancellation error:', error);
        return next(new AppError(error.message || 'Failed to cancel subscription', 500));
    }
};

const allPayment = async (req, res, next) => {
    try {
        const { count = 10 } = req.query;

        // Debug log
        console.log('Fetching payments, count:', count);

        const subscriptions = await razorpay.subscriptions.all({
            count: parseInt(count)
        });

        res.status(200).json({
            success: true,
            message: 'All payments fetched successfully',
            subscriptions
        });
    } catch (error) {
        console.error('Payment fetch error:', error);
        return next(new AppError(error.message || 'Failed to fetch payments', 500));
    }
};

export {
    getRazorpayApiKey,
    buySubscription,
    verifySubscription,
    cancelSubscription,
    allPayment
};