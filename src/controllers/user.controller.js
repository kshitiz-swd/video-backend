import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/User.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


export const registerUser = asyncHandler(async (req, res) => {
    //check if the imagw existes or not
    //upload image on cloudinary
    //add the use in the DB

    const { name, userName, email, password } = req.body
    if (
        [name, userName, email, password].some((field) =>
            field.trim() === '')) {
        throw new ApiError(400, "All fields are required!")
    }

    const existingUser = await User.findOne({
        $or: [{ email }, { userName }]
    })
    if (existingUser) throw new ApiError(409, "User already exists!!")

    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverLocalPath = req.files?.coverImage[0]?.path

    if (!avatarLocalPath) throw new ApiError(400, "Avatar file is required!!")

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    // const coverImage = await uploadOnCloudinary(coverLocalPath)

    if (!avatar) throw new ApiError(400, "Avatar file is required!!")

    let coverLocalPath
    let coverImage
    if (req.files.coverImage) {
        coverLocalPath = req.files.coverImage[0]?.path
        coverImage = await uploadOnCloudinary(coverLocalPath)
    }


    const user = await User.create({
        name,
        password,
        userName: userName.toLowerCase(),
        email,
        avatar: avatar.url,
        coverImage: coverImage ? coverImage.url : ""
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if (!createdUser) throw new ApiError(400, "Something went wrong while registering the user")

    res.status(201).json(
        new ApiResponse(200, createdUser, 'User registered successfully!!')
    )


});