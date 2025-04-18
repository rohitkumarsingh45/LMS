import { Router } from "express"
import { addLectureToCourseById, createCourse, deleteLectureFromCourseById, getAllCourses, getLecturesByCoursesId, removeCourse, updateCourse } from "../controllers/course.controller.js";
import { authorizeRoles, isLoggedIn } from "../middlerwares/auth.middleware.js";
import { upload } from "../middlerwares/multer.middleware.js";





const router = Router();

// Get all courses or create a course
router.route('/')
  .get(getAllCourses)
  .post(isLoggedIn, authorizeRoles('ADMIN'), upload.single("thumbnail"), createCourse);

// Get lectures for a course
router.get('/:id/lectures', isLoggedIn, (req, res, next) => {
  console.log("Route hit - Get lectures:", {
    params: req.params,
    headers: req.headers
  });
  getLecturesByCoursesId(req, res, next);
});

// Single course actions
router.route('/:id')
  .put(isLoggedIn, authorizeRoles('ADMIN'), updateCourse)
  .delete(isLoggedIn, authorizeRoles('ADMIN'), removeCourse);

// Add or delete a lecture
router.post(
    '/:id/lectures',
    isLoggedIn,
    authorizeRoles('ADMIN'),
    upload.single('lecture'),
    (req, res, next) => {
        console.log('Add lecture request:', {
            body: req.body,
            file: req.file,
            params: req.params
        });
        addLectureToCourseById(req, res, next);
    }
);
router.delete('/:id/lectures/:lectureId', isLoggedIn, authorizeRoles('ADMIN'), (req, res, next) => {
  console.log("Delete lecture route hit:", req.params);
  deleteLectureFromCourseById(req, res, next);
});





export default router;