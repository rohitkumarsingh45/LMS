import cloudinary from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// ✅ Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Check if Cloudinary credentials are loaded
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error("⚠️ Cloudinary credentials are missing. Check your .env file.");
}

// ✅ Cloudinary file upload function
export const uploadOnCloudinary = async (localFilePath) => {
  try {
    console.log("🚀 Uploading file:", localFilePath);

    const response = await cloudinary.v2.uploader.upload(localFilePath, {
      folder: "avatars",
      transformation: [{ width: 300, height: 300, crop: "fill" }]
    });

    console.log("✅ Cloudinary URL:", response.secure_url);

    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    console.error("❌ Cloudinary upload failed:", error.message);
    if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
    return null;
  }
};
