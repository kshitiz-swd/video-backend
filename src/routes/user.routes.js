import express from 'express'
import { loginUser, logoutUser, refreshAccessToken, registerUser } from '../controllers/user.controller.js'
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

export default router