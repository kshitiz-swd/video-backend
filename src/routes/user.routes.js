import express from 'express'
import { changePassword, getUser, loginUser, logoutUser, refreshAccessToken, registerUser, updateUserAvatar, updateCoverImage } from '../controllers/user.controller.js'
import { upload } from '../middlewares/multer.js'
import { auth } from '../middlewares/auth.js'

const router = express.Router()

router.post('/register', upload.fields([
    {
        name: 'avatar',
        maxCount: 1
    },
    {
        name: 'coverImage',
        maxCount: 1
    }
]), registerUser)

router.post("/login", loginUser)
router.post("/logout", auth, logoutUser)
router.post("/refresh-token", refreshAccessToken)
router.post("/change-password", auth, changePassword)
router.get("/get-user", auth, getUser)
router.post("/update-avatar", auth, updateUserAvatar)
router.post("/update-cover-image", auth, updateCoverImage)

export default router