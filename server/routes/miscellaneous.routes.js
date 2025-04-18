import { Router } from 'express';
import { contactUs, userStats } from '../controllers/miscellaneous.controller.js';
import { authorizeRoles, isLoggedIn } from '../middlerwares/auth.middleware.js';

const router = Router();

router.route('/contact').post(contactUs);
router
    .route('/admin/stats/users')
    .get(isLoggedIn, authorizeRoles('ADMIN'), userStats);

export default router;
