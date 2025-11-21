import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/User.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";


const registerUser = asyncHandler(async (req, res) => {
    //get data from frontend
    const { fullName, email, username, password } = req.body;
    //validation
    if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
        throw new apiError(400, "All fields are required");
    }
    //check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
        throw new apiError(409, "User already exists with this email or username");
    };
    //check for avatar and coverImage files
    const avatarlocalpath = req.files?.avatar?.[0]?.path;
    // const coverImagelocalpath=req.files?.coverImage?.[0]?.path;
    let coverImagelocalpath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImagelocalpath = req.files.coverImage[0].path;
    }
    if (!avatarlocalpath) {
        throw new apiError(400, "Avatar is required");
    }
    //upload to cloudinary
    const avatar = await uploadToCloudinary(avatarlocalpath);
    const coverImage = coverImagelocalpath ? await uploadToCloudinary(coverImagelocalpath) : null;
    if (!avatar) {
        throw new apiError(500, "Error uploading avatar");
    }
    //create user
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        username: username.toLowerCase(),
        password,
    });
    const createdUser = await User.findById(user._id).select(
        "-password  -refreshToken"
    )
    if (!createdUser) {
        throw new apiError(500, "Error creating user");
    }
    return res.status(201).json(new apiResponse(201, createdUser, "User registered successfully"));
});
export {
    registerUser,
};