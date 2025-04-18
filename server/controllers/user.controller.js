import User from "../models/user.model.js";
import AppError from "../utils/error.util.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"; 
import { sendEmail } from "../utils/sendEmail.js"; // Fixed import path
import crypto from 'crypto'

const cookieOptions = {
    maxAge: 7 * 24 * 60 * 60 * 1000,  //7 days 
    httpOnly: true,
    secure: true
}

const register = async (req, res, next) => {
    try {
        console.log("Request Body:", req.body);
        console.log("Uploaded File:", req.file); // ✅ Check if multer processed the file

        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return next(new AppError("All fields are required", 400));
        }

        if (!req.file) {
            return next(new AppError("Avatar file is required", 400)); // ✅ Ensure avatar exists
        }

        const userExists = await User.findOne({ email });

        if (userExists) {
            return next(new AppError("Email already exists", 400));
        }

        const avatarLocalPath = req.file.path;
        console.log("Avatar Path:", avatarLocalPath); // ✅ Log file path

        let avatarUrl = "";
        if (avatarLocalPath) {
            const avatar = await uploadOnCloudinary(avatarLocalPath);
            if (!avatar || !avatar.secure_url) {
                return next(new AppError("Avatar upload failed, please try again", 400));
            }
            avatarUrl = avatar.secure_url;
        }

        const user = await User.create({
            fullName,
            email,
            password,
            avatar: avatarUrl,
        });

        if (!user) {
            return next(new AppError("User registration failed, please try again", 500));
        }

        user.password = undefined;

        const token = await user.generateJWTToken();
        res.cookie("token", token, { httpOnly: true });

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user,
        });

    } catch (error) {
        console.error("🔥 Registration Error:", error);
        return next(new AppError(error.message, 500));
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
    
        if(!email || !password) {
            return next(new AppError('All fields are required', 400));
        }
    
        // Include role in select
        const user = await User.findOne({ email })
            .select('+password')
            .select('+role'); // Add this line to explicitly select role
    
        if(!user || !(await user.comparePassword(password))) {
            return next(new AppError('Email or password does not match', 400));
        }

        // Debug logs
        // console.log("Found user:", user);
        // console.log("User role:", user.role);

        const token = await user.generateJWTToken();
        user.password = undefined;
    
        res.cookie('token', token, cookieOptions);
    
        // Send role explicitly in response
        res.status(200).json({
            success: true,
            message: 'User logged in successfully',
            user: {
                ...user.toObject(),
                role: user.role // Ensure role is included
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        return next(new AppError(error.message, 500));
    }
}

const logout = (req, res) =>{
      res.cookie('token',null,{
        secure: true,
        maxAge:0,
        httpOnly:true
      })

      res.status(200).json({
        success:true,
        message: "User logged out successfuly"
      })
}

const getProfile = async(req, res, next) =>{
    
      try {
        const userId = req.user.id;
        const user = await User.findById(userId)
        res.status(200).json({
            success:true,
            message:'User details',
            user
        })
      } catch (error) {
        return next(new AppError('failed to fetch profile details ',500));

      }
}

const forgetPassword = async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return next(new AppError('Email is required', 400));
    }

    const user = await User.findOne({ email });
    if (!user) {
        return next(new AppError('Email not registered', 400));
    }

    // Generate a password reset token
    const resetToken = await user.generatePasswordResetToken();
    await user.save();

    // ✅ Define subject and message before sending email
    const resetPasswordURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

console.log(resetPasswordURL);


    const subject = "Password Reset Request";  // 🔥 FIXED: Define the subject
    const message = `Click the link to reset your password: ${resetPasswordURL}`;

    try {
        // ✅ Make sure `sendEmail` is properly imported
        await sendEmail(email, subject, message);

        res.status(200).json({
            success: true,
            message: `Reset password token has been sent to ${email} successfully`,
        });
    } catch (error) {
        // If email sending fails, reset the token fields in DB
        user.forgetPasswordExpiry = undefined;
        user.forgetPasswordToken = undefined;
        await user.save();

        return next(new AppError(error.message, 500));
    }
};

const resetPassword = async (req, res, next) => {
   const { resetToken } = req.params;
   const { password } = req.body;

   const forgetPasswordToken = crypto
   .createhash('sha256')
   .update('resetToken')
   .digest('hex');

   const user = await User.findOne({
    forgetPasswordToken,
    forgetPasswordExpiry: {$gt: Date.now()}

   })
   if(!user){
         return next(
            new AppError('Token is invalid or expired, please try again', 400)
         )
   }

   user.password = password;
   user.forgetPasswordToken = undefined;
   user.forgetPasswordExpiry = undefined;

   user.save();

   res.status(200).json({
    success: true,
    message: 'Password changed successfully!'
   })

}


const changepassword = async (req, res, next) =>{
    const { oldPassword, newPassword } = req.body;
    const { id } = req.user;

    if(!oldPassword || !newPassword) {
        return next(
            new AppError('All field are mandatory', 400)
        )
    }

    const user = await User.findById(id).select('+password');

    if(!user){
        return next(
            new AppError('User does not exits', 400)
        )
    }
    const isPasswordValid = await user.comparePassword(oldPassword);

    if(!isPasswordValid){
        return next(
            new AppError('Invalid old password', 400)
        )
    }
    user.password = newPassword;

    await user.save();

    user.password = undefined;

    res.status(200).json({
        success: true,
        message: 'Password changed successfully'
    })
}

const updateProfile = async (req, res) => {
    try {
        const { fullName } = req.body;
        const avatarLocalPath = req.file?.path;

        if (!avatarLocalPath) {
            return res.status(400).json({
                success: false,
                message: "Avatar file is required"
            });
        }

        // Transform local path to URL path
        const relativePath = avatarLocalPath.split('public')[1].replace(/\\/g, '/');
        const avatarUrl = `${req.protocol}://${req.get('host')}/api/v1/public${relativePath}`;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    fullName,
                    avatar: avatarUrl // Store the full URL
                }
            },
            { new: true }
        ).select("-password");

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user
        });
    } catch (error) {
        console.error("Update error:", error);
        res.status(500).json({
            success: false,
            message: "Error updating profile"
        });
    }
};

const updateUser = async (req, res) => {
    try {
        const { fullName } = req.body;
        const avatarLocalPath = req.file?.path;

        // Upload to Cloudinary instead of storing local path
        let avatarUrl = '';
        if (avatarLocalPath) {
            const cloudinaryResponse = await uploadOnCloudinary(avatarLocalPath);
            if (cloudinaryResponse && cloudinaryResponse.secure_url) {
                avatarUrl = cloudinaryResponse.secure_url;
            } else {
                return res.status(400).json({
                    success: false,
                    message: "Error uploading avatar to Cloudinary"
                });
            }
        }

        const updateData = {
            ...(fullName && { fullName }),
            ...(avatarUrl && { avatar: avatarUrl })
        };

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updateData },
            { new: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user
        });
    } catch (error) {
        console.error("Update error:", error);
        res.status(500).json({
            success: false,
            message: "Error updating profile"
        });
    }
};

export { 
    register, 
    login, 
    logout, 
    getProfile ,
    forgetPassword,
    resetPassword,
    changepassword,
    updateUser
};
