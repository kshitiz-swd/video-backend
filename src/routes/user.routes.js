import express from 'express'
import { loginUser, logoutUser, registerUser } from '../controllers/user.controller.js'
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

export default router