import ConnectedToMongo from "./db/db.js"
import express from "express"
import dotenv from "dotenv"
 dotenv.config({
    path: './env'
 })
const app = express()

app.listen(process.env.PORT, ()=>{
    console.log(`App is running is  port ${process.env.PORT}`);
})

ConnectedToMongo();
