import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (localfilepath) => {
    try {
        if (!localfilepath) throw new Error("file path is required");
        const response = await cloudinary.uploader.upload(localfilepath, {
            resource_type: "auto",
        });
        // remove the locally saved temporary file after successful upload if it exists
        if (localfilepath && fs.existsSync(localfilepath)) fs.unlinkSync(localfilepath);
        
        return response;
    } catch (error) {
        // attempt to remove the locally saved temporary file if it exists
        try {
            if (localfilepath && fs.existsSync(localfilepath)) fs.unlinkSync(localfilepath);
        } catch (unlinkErr) {
            // ignore unlink errors
        }
        throw error;

    }
}

export { uploadToCloudinary };
