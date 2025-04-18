import { Router } from "express"
import { allPayment, buySubscription, cancelSubscription, getRazorpayApiKey, verifySubscription } from "../controllers/payment.controller.js";
import { authorizeRoles, isLoggedIn } from "../middlerwares/auth.middleware.js";



const router = Router();

router
     .route('/razorpay-key')
     .get(
      isLoggedIn,
        getRazorpayApiKey
    );
 
router
     .route('/subscribe')
     .post(
      isLoggedIn,
        buySubscription
    );    

router
     .route('/verify')
     .post(
      isLoggedIn,
        verifySubscription
    );
     
router
     .route('/unsubscribe')
     .post(
      isLoggedIn,
        cancelSubscription
     );  
     
router
     .route('/')
     .get(
      isLoggedIn,
        authorizeRoles('ADMIN'),
        allPayment
     );   

export default router;