import { User } from "../models/User.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

export const auth = asyncHandler(async (req, res, next) => {
    const token = req.cookie?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

    if (!token) throw new ApiError(400, "Unauthorized request!!")

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

    const user = await User.findById(decoded._id).select("-password -refreshToken")

    if (!user) throw new ApiError("Invalid access token!!")

    req.user = user
    next()
})
