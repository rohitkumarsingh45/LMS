import { Router } from "express"
import { changepassword, forgetPassword, getProfile, login, logout, register, resetPassword, updateUser } from "../controllers/user.controller.js";
import { isLoggedIn } from "../middlerwares/auth.middleware.js";
import { upload } from "../middlerwares/multer.middleware.js";



const router = Router();

router.post('/register', upload.single("avatar"), (req, res, next) => {
    console.log("Received file:", req.file);
    register(req, res, next);
});

router.post('/login', login);
router.get('/logout', logout);
router.get('/me',isLoggedIn, getProfile);
router.post('/forget-password',forgetPassword);
router.post('/reset-password', resetPassword)
router.post('/change-password', isLoggedIn, changepassword)
router.put('/update/:id', isLoggedIn, upload.single("avatar"), updateUser )


export default router;

