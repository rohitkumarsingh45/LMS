import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import AppError from "../utils/error.util.js";

const isLoggedIn = async (req, res, next) => {
    try {
        // ✅ Check if token is in cookies or headers
      //  console.log("Cookies:", req.cookies);
     //   console.log("Authorization Header:", req.headers.authorization);

        const token = req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            console.log("No token found!");  // Debugging log
            return next(new AppError("Unauthenticated, please login again", 401));
        }

        // ✅ Verify the token
      //  console.log("Verifying token...");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
      //  console.log("Decoded Token:", decoded);

        // ✅ Fetch user from database
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            console.log("User not found in DB!");
            return next(new AppError("User not found, please log in again", 401));
        }

        req.user = user;
       // console.log("User Authenticated:", user);
        next();
    } catch (error) {
        console.log("JWT Verification Error:", error.message);
        return next(new AppError("Invalid or expired token, please log in again", 401));
    }
};

const authorizeRoles = (...roles) => async (req, res, next) => {
    const currentUserRole = req.user.role;
    
    if (!roles.includes(currentUserRole)) {
        return next(
            new AppError('You do not have permission to access this route', 403)
        );
    }
    
    next();
};

const authorizeSubscriber = async (req, res, next) => {
     const subscription = req.user.subscription;
     const currentUserRole = req.user.role;
     
     if(currentUserRole !== 'ADMIN' && subscription.status !== 'active'){
        return next(
            new AppError('Please subscribe to access this routes! ', 403)
        );
     }
     next(); // Add missing next() call
};

export { isLoggedIn, authorizeRoles, authorizeSubscriber };
