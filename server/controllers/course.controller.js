import Course from "../models/course.model.js";
import AppError from "../utils/error.util.js";
import { v2 as cloudinary } from "cloudinary";
import fs from 'fs/promises';

const uploadOnCloudinary = async (filePath) => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: "lms",
        });
        return {
            public_id: result.public_id,
            secure_url: result.secure_url,
        };
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        return null;
    }
};

const getAllCourses = async (req, res, next) => {
    try {
        const courses = await Course.find({});
        
        // Map courses to include lecture count
        const coursesWithDetails = courses.map(course => ({
            ...course.toObject(),
            numberOfLectures: course.lectures?.length || 0
        }));

        res.status(200).json({
            success: true,
            message: "All Courses",
            courses: coursesWithDetails
        });
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
};

const getLecturesByCoursesId = async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log("Processing lecture request for course:", id);

        // Validate MongoDB ID
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return next(new AppError("Invalid course ID format", 400));
        }

        // Debug query
        console.log("Executing MongoDB query for course:", id);
        const course = await Course.findById(id).select('+lectures');
        console.log("Query result:", course ? "Course found" : "Course not found");

        if (!course) {
            return next(new AppError("Course not found", 404));
        }

        console.log(`Found ${course.lectures.length} lectures`);

        res.status(200).json({
            success: true,
            message: "Course lectures fetched successfully",
            lectures: course.lectures || []
        });

    } catch (error) {
        console.error("getLecturesByCoursesId error:", error);
        return next(new AppError(error.message || "Failed to fetch lectures", 500));
    }
};

const createCourse = async (req, res, next) => {
    try {
        const { title, description, category, createdBy } = req.body;
        // console.log('Creating course with data:', { title, description, category, createdBy });
        // console.log('Uploaded file:', req.file); // Log the uploaded file

        if (!title || !description || !category || !createdBy) {
            return next(new AppError("All fields are required", 400));
        }

        if (!req.file) {
            console.error("Thumbnail file is missing in the request");
            return next(new AppError("Thumbnail file is required", 400));
        }

        let thumbnailUrl = null;

        try {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'course-thumbnails',
                width: 340,
                height: 200,
                crop: "fill"
            });

            // console.log('Cloudinary upload result:', result);

            thumbnailUrl = {
                public_id: result.public_id,
                secure_url: result.secure_url
            };

            // console.log('Thumbnail URL object:', thumbnailUrl);

            // Clean up the uploaded file
            await fs.unlink(req.file.path);
        } catch (error) {
            console.error("Cloudinary upload error details:", error);
            return next(new AppError("Error uploading thumbnail to Cloudinary", 500));
        }

        const course = await Course.create({
            title,
            description,
            category,
            createdBy,
            thumbnail: thumbnailUrl
        });

        console.log('Created course:', course);

        res.status(201).json({
            success: true,
            message: "Course created successfully",
            course
        });

    } catch (error) {
        console.error("Course creation error:", error);
        return next(new AppError(error.message, 500));
    }
};

const updateCourse = async (req, res, next) => {
    try {
        const { id } = req.params;
        const course = await Course.findByIdAndUpdate(
            id,
            {
                $set: req.body
            },
            {
                runValidators: true
            }
        );
        if (!course) {
            return next(
                new AppError(error.message, 500)
            );
        }

        res.status(200).json({
            success: true,
            message: 'Course update successfully!',
            course: courses,
        });
    }
    catch (error) {
        return next(
            new AppError('Course with given id does not exits', 500)
        );
    }
};

const removeCourse = async (req, res, next) => {
    try {
        const { id } = req.params;
        const course = await Course.findById(id);

        if (!course) {
            return next(
                new AppError('Course with given id does not exists', 500)
            );
        }
        await course.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Course deleted successfully'
        });
    }
    catch (error) {
        return next(
            new AppError(error.message, 500)
        );
    }
};

const addLectureToCourseById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, description } = req.body;

        console.log('Lecture upload request:', {
            courseId: id,
            title,
            description,
            file: req.file
        });

        if (!title || !description || !req.file) {
            return res.status(400).json({
                success: false,
                message: 'Title, description and lecture video are required'
            });
        }

        const course = await Course.findById(id);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        try {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'lms-lectures',
                resource_type: 'video',
            });

            console.log('Cloudinary upload result:', result);

            // Add lecture to course
            course.lectures.push({
                title,
                description,
                lecture: {
                    public_id: result.public_id,
                    secure_url: result.secure_url
                }
            });

            // Update numberOfLectures
            course.numberOfLectures = course.lectures.length;
            await course.save();

            // Clean up uploaded file
            await fs.unlink(req.file.path);

            return res.status(200).json({
                success: true,
                message: 'Lecture added successfully',
                course
            });

        } catch (uploadError) {
            console.error('Cloudinary upload error:', uploadError);
            return res.status(400).json({
                success: false,
                message: 'Failed to upload lecture video',
                error: uploadError.message
            });
        }

    } catch (error) {
        console.error('Add lecture error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to add lecture',
            error: error.message
        });
    }
};

const deleteLectureFromCourseById = async (req, res, next) => {
    try {
        const { id: courseId, lectureId } = req.params;
        console.log("Deleting lecture:", { courseId, lectureId });

        const course = await Course.findById(courseId);
        if (!course) {
            return next(new AppError("Course not found", 404));
        }

        // Find lecture index
        const lectureIndex = course.lectures.findIndex(
            (lecture) => lecture._id.toString() === lectureId
        );

        if (lectureIndex === -1) {
            return next(new AppError("Lecture not found", 404));
        }

        // Remove lecture from cloudinary if it exists
        const lecture = course.lectures[lectureIndex];
        if (lecture.lecture?.public_id) {
            await cloudinary.uploader.destroy(lecture.lecture.public_id);
        }

        // Remove lecture from array
        course.lectures.splice(lectureIndex, 1);

        // Update lecture count
        course.numbersOfLectures = course.lectures.length;

        await course.save();

        res.status(200).json({
            success: true,
            message: "Lecture deleted successfully",
            course
        });

    } catch (error) {
        console.error("Delete lecture error:", error);
        return next(new AppError(error.message || "Failed to delete lecture", 500));
    }
};

export {
    getAllCourses,
    getLecturesByCoursesId,
    createCourse,
    updateCourse,
    removeCourse,
    addLectureToCourseById,
    deleteLectureFromCourseById
};