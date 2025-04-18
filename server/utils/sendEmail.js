import nodemailer from 'nodemailer';

const sendEmail = async (email, subject, message) => {
    try {
        // Create a transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD
            }
        });

        // Configure mail options
        const mailOptions = {
            from: process.env.SMTP_EMAIL,
            to: email,
            subject: subject,
            text: message
        };

        // Send mail
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ', info.response);
        
        return info;
    } catch (error) {
        console.error('Send email error:', error);
        throw error;
    }
};

export { sendEmail };

