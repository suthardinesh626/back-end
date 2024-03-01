import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"
import { fileURLToPath } from 'url';


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        const response = await cloudinary.uploader.upload(localFilePath, { resource_type: "auto" })
        //file has been uploaded 
        // console.log("file is uploaded on Cloudinary:", response.url)
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) //remove the file locally saved temporary file has uploaded operation got failed
        return null;
    }
}


export { uploadOnCloudinary }