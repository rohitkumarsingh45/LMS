import { sendEmail } from '../utils/sendEmail.js';
import User from "../models/user.model.js";  // Add this import

const contactUs = async (req, res, next) => {
    try {
        const { name, email, message } = req.body;
        
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Email to admin
        const emailResponse = await sendEmail(
            process.env.CONTACT_US_EMAIL,
            'New Contact Form Submission',
            `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
        );

        console.log('Email sent successfully:', emailResponse);

        res.status(200).json({
            success: true,
            message: 'Your message has been sent successfully'
        });
    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending message',
            error: error.message
        });
    }
};

const userStats = async (req, res) => {
    try {
        const allUserCount = await User.countDocuments();
        const subscribedUsersCount = await User.countDocuments({
            'subscription.status': 'active'
        });

        res.status(200).json({
            success: true,
            message: 'Stats fetched successfully',
            allUserCount,
            subscribedUsersCount
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user stats',
            error: error.message
        });
    }
};

export { contactUs, userStats };
