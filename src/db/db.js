import mongoose from "mongoose";
import { DB_NAME } from '../constants.js'

export const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        console.log('MONGODB connected !!');

    } catch (error) {
        console.error("MONOGDB connection error: ", error)
    }
}

export default connectDB

