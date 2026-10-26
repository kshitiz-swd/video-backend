import fs from 'fs'
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});

export const uploadOnCloudinary = async (localFilePath) => {
    try {
        const response = await cloudinary.uploader.upload(
            localFilePath, {
            resource_type: "auto"
        })
        console.log("File has been uploaded on cloudinary", response.url);
        fs.unlinkSync(localFilePath)
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath)
        return null
    }
}

export const deleteOnCloudinary = async (publicId) => {
    try {
        cloudinary.uploader.destroy(publicId, {
            resource_type: "auto"
        })
    } catch (error) {
        return null
    }
}