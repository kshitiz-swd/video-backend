import "dotenv/config"
import connectDB from "./db/db.js"
import { app } from "./app.js"

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(
                "Server is listening on PORT:",
                process.env.PORT || 8000
            )
        })
    })
    .catch((error) => {
        console.log("MONGODB connection error!!: ", error)
    })