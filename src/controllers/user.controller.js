import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/User.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

//generate access and refresh token 
const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };


    } catch (error) {
        throw new apiError(500, "Error generating tokens");
    }
}
//register user
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
        throw new apiError(400, "Avatar file is reqiured");
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

//login user
const loginUser = asyncHandler(async (req, res) => {
    //get data from frontend
    if (!req.body) {
        throw new apiError(400, "Request body is required");
    }
    const { email, username, password } = req.body;

    if (!(username || email)) {
        throw new apiError(400, "Email and username are required");
    }
    if (!password) {
        throw new apiError(400, "Password is required");
    }
    const user = await User.findOne({ $or: [{ email }, { username: username?.toLowerCase() }] })

    if (!user) {
        throw new apiError(404, "User not found");
    };
    //password check
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new apiError(401, "Invalid password");
    }
    //access and refreh token generation
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
    //send cookies and response
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );
    const options = {
        httpOnly: true,
        secure: false,
    };
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new apiResponse(
                200,
                {
                    user: loggedInUser, accessToken,
                    refreshToken
                },
                "User logged in successfully" 
            )

        );
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { $set: { refreshToken: undefined } }, { new: true });
    const options = {
        httpOnly: true,
        secure: false,
    };
    
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new apiResponse(200, null, "User logged out successfully"));

});

//refreshtoekn
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new apiError(401,"No refresh token provided");
    }
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET) 
    const user = await User.findById(decodedToken?._id);
    if(!user || user.refreshToken !== incomingRefreshToken){
        throw new apiError(401,"Invalid refresh token");
    }

    if(incomingRefreshToken !== user.refreshToken){
        throw new apiError(401,"Refresh token mismatch");
    }

    const options = {
        httpOnly: true,
        secure: false,
    };
    const { accessToken, newrefreshToken } = await generateAccessAndRefreshToken(user._id);
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)        
        .cookie("refreshToken", newrefreshToken, options)
        .json(new apiResponse(200, { accessToken, refreshToken: newrefreshToken
        }, "Access token refreshed successfully"));

});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id);
    const ispasswordcorrect = await user.isPasswordCorrect(oldPassword);
    if(!ispasswordcorrect){
        throw new apiError(400,"invalid old password");
    }
    user.password=newPassword;
    await user.save({validateBeforeSave:false});
    return res
    .json(new apiResponse(200,{},"password change successfully"))
});
//get current user
const getCurrentuser =asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(200,req.user,"current user fetch successfully");
});
const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullName,email}=req.body;
    if(!(fullName || email)){
        throw new apiError(400,"all fields are required");
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
          $set:{
            fullName,
            email:email
          }
        },
        {new:true}
    ).select(" - password ")
    return res
    .status(200)
    .json(new apiResponse(200,user,"account details updated succesfully"));
});
//update avatr image
const updateAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path;
    if(!avatarLocalPath){
        throw new apiError(400," avatar path is reuired");
    }
    const avatar = await uploadToCloudinary(avatarLocalPath);
    if(!avatar){
        throw new apiError(400,"avatar doesnt ulpoad on cloudinary");
    }
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {
            new:true
        }
    ).select("-password");
    return res
    .status(200)
    .json(200,{},"avatar updated successfully");
});
//update coverImage
const updatecoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path;
    if(!avatarLocalPath){
        throw new apiError(400," coverImage path is reuired");
    }
    const coverImage = await uploadToCloudinary(coverImageLocalPath);
    if(!coverImage){
        throw new apiError(400,"avatar doesnt ulpoad on cloudinary");
    }
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {
            new:true
        }
    ).select("-password");
    return res
    .status(200)
    .json(200,{},"coverImage updated successfully");
});
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentuser,
    changeCurrentPassword,
    updateAccountDetails,
    updateAvatar,
    updatecoverImage
};