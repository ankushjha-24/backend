import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadtoCloudinary=async (localfilepath)=>{
    try{
        if(!localfilepath) throw new Error("file path is required");
        const response = await cloudinary.uploader.upload(localfilepath,{
            resource_type:"auto",
        });
        console.log("file uploaded to cloudinary",response.url);
        return response;
    } catch(error){ 
        fs.unlinkSync(localfilepath); //remove the locally saved temporary file as the upload operation got failef
        throw error;

    }
}

export {uploadtoCloudinary};
