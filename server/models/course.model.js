import { Schema, model } from "mongoose";

const courseSchema = new Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        minLength: [8, 'Title must be atleast 8 characters'],
        maxLength: [59, 'Title should be less than 60 charaters'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        minLength: [8, 'Description must be atleast 8 characters'],
        maxLength: [200, 'Description should be less than 60 charaters'],
        trim: true,
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
    },
    thumbnail: {
        public_id: { type: String, default: "" },
        secure_url: { type: String, default: "" }
    },
    lectures: [{
        title: String,
        description: String,
        lecture: {
            public_id: String,
            secure_url: String
        }
    }],
    numberOfLectures: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Add pre-save hook to update numberOfLectures
courseSchema.pre('save', function(next) {
    this.numberOfLectures = this.lectures.length;
    next();
});

const Course = model('Course', courseSchema);

export default Course;