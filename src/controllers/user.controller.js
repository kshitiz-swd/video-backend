import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/User.model.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken'
import mongoose from "mongoose";

const generateAccessandRefreshToken = async (userId) => {
    const user = await User.findById(userId)
    const accessToken = await user.generateAccessToken()
    const refreshToken = await user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    return { accessToken, refreshToken }
}

const registerUser = asyncHandler(async (req, res) => {
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
        avatarPublicId: avatar.public_id,
        coverImage: coverImage ? coverImage.url : ""
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if (!createdUser) throw new ApiError(400, "Something went wrong while registering the user")

    res.status(201).json(
        new ApiResponse(200, createdUser, 'User registered successfully!!')
    )
});


const loginUser = asyncHandler(async (req, res) => {
    //take the data from client
    //validate the data
    // check if user exist
    //password check
    // send the token to frontend

    const { email, userName, password } = req.body

    if (!email && !userName) {
        throw new ApiError(400, "email or username required!!")
    }

    const user = await User.findOne({
        $or: [{ email }, { userName }]
    })
    if (!user) throw new ApiError(401, "User does not exist!!")

    const passwordCheck = await user.isPasswordCorrect(password)

    if (!passwordCheck) throw new ApiError(401, "Invalid password entered!!")

    const { accessToken, refreshToken } = await generateAccessandRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    let options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, {
                user: loggedInUser
            },
                "User loggedIn successfully!!")
        )

})


const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $unset: {
            refreshToken: 1
        }
    });

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/"
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(
                200,
                {},
                "Logged out successfully!!"
            )
        );
});
const refreshAccessToken = asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken || req.body.refreshToken

    if (!token) throw new ApiError(401, "Invalid Request!!")

    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decoded._id)

    if (!user) throw new ApiError(401, "User Invalid!!")

    if (token !== user.refreshToken)
        throw new ApiError(401, "Invalid refresh token!!")

    const { accessToken, newRefreshToken } = await generateAccessandRefreshToken(user._id)

    user.refreshToken = newRefreshToken

    await user.save()

    const options = {
        httpOnly: true,
        secure: true
    }

    res.status(200).
        cookie("accessToken", accessToken, options).
        cookie("refreshToken", newRefreshToken, options).
        json(new ApiResponse(200, {
            accessToken, refreshToken: newRefreshToken
        }, "Access token refreshed"))
})

const changePassword = asyncHandler(async (req, res) => {
    const { newPassword, currentPassword } = req.body

    console.log(newPassword);
    console.log(currentPassword);


    if (!newPassword || !currentPassword)
        throw new ApiError(400, "All fields are required!!")

    const user = await User.findById(req.user._id)

    const isPasswordCorrect = await user.isPasswordCorrect(currentPassword)

    if (!isPasswordCorrect)
        throw new ApiError(400, "Incorrect current password!!")

    // user.password = await bcrypt.hash(newPassword, 10)
    user.password = newPassword
    await user.save()

    res.status(200).json(new ApiResponse(200, { user }, "Password updated successfully!!"))
})

const getUser = asyncHandler(async (req, res) => {
    res.status(200).json(new ApiResponse(200, req.user, "User fetched succesfully!!"))
})

// const updateAccountDetails = asyncHandler(async(req, res)=>{
//     const{}
// })

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath)
        throw new ApiError(400, "Avatar missing!!")

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar?.url)
        throw new ApiError(400, "Error while uploading avatar!!")

    const oldAvatarPublicId = req.user.avatarPublicId

    const user = await User.findByIdAndUpdate(req.user._id, {
        $set: {
            avatar: avatar.url,
            avatarPublicId: avatar.public_id
        }
    }, { returnDocument: "after" }).select("-password -refreshToken")

    await deleteOnCloudinary(oldAvatarPublicId)

    res.status(200).json(new ApiResponse(200, "Avatar updated!!"))
})

const updateCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocal = await req.file?.path

    if (!coverImageLocal)
        throw new ApiError(400, "Cover image missing!!")

    const coverImage = await uploadOnCloudinary(coverImageLocal)

    if (!coverImage)
        throw new ApiError(400, "Error uploading on cloudinary!!")

    const oldCoverImage = req.user.coverImagePublicId

    const user = await User.findByIdAndUpdate(req.user._id, {
        coverImage: coverImage.url,
        coverImagePublicId: coverImage.public_id
    }, { returnDocument: "after" }).select("-password -refreshToken")

    if (!user)
        throw new Error(400, "User not found!!")

    await deleteOnCloudinary(oldAvatarPublicId)

    res.status(200).json(new ApiResponse(200, "Cover image updated!!"))

})

const getUserChannelInfo = asyncHandler(async (req, res) => {
    const { username } = req.params

    if (!username?.trim())
        throw new ApiError(400, "Username required!!")

    const channel = await User.aggregate([
        {
            $match: { username: username?.toLowerCase() }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: 'channel',
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: 'subscriptions',
                localField: "_id",
                foreignField: "subscribers",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                totalSubscribers: {
                    $size: "$subscribers"
                },
                totalSubscribedTo: {
                    $size: "$subscribedTo"
                },
                isSubscribedTo: {
                    $cond: {
                        if: { $in: [req.user._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }

            }
        },
        {
            $project: {
                username: 1,
                name: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                totalSubscribers: 1,
                totalSubscribedTo: 1,
                isSubscribedTo: 1
            }
        }

    ])

    if (!channel?.length)
        throw new ApiError(400, "Channel does not exist!!")

    return res.status(200).
        json(new ApiResponse(200, channel[0], "User channel fetched successfully!"))

})

const getWatchHistory = asyncHandler(async (req, res) => {
    //get user
    //lookup in videos for info of video
    //lookup in user fro the owner info 


    await User.aggregate([
        {
            $match: {
                _id: new mongoose.Schema.Types.ObjectId
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        name: 1,
                                        userName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        },

                    }
                ]
            },
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user[0].watchHistory,
                "Watch history fetched successfully"
            )
        )
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getUser,
    updateUserAvatar,
    updateCoverImage,
    getUserChannelInfo
}