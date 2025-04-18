import { Schema, model } from "mongoose";

const paymentSchema = new Schema({
    razorpay_payment_id: {
        type: String,
        required: true
    },
    razorpay_subscription_id: {
        type: String,
        required: true,
    },
    razorpay_signature: {
        type: String,
        required: true,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['created', 'successful', 'failed'],
        default: 'created'
    }
}, {
    timestamps: true
});

// Add index for better query performance
paymentSchema.index({ user: 1, status: 1 });

export default model('Payment', paymentSchema);