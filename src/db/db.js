import mongoose from "mongoose";
import DB_NAME from "../constants.js"

const ConnectedToMongo = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log("connected to mongo successful")
    } catch (error) {
        console.error(`mongoDb connection failed: `, error)
        process.exit(1)
    }
}

export default ConnectedToMongo;