import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {

    const { content } = req.body

    if (!content) {
        throw new ApiError(400, "Tweet not be empty")
    }

    const newTweet = await Tweet.create({
        owner: req.user._id,
        content
    })

    if (!newTweet) {
        throw new ApiError(404, "Tweet not found!")
    }

    res
        .status(201)
        .json(new ApiResponse(201, newTweet, "Tweet created successfully"))

})

const getUserTweets = asyncHandler(async (req, res) => {

})

const updateTweet = asyncHandler(async (req, res) => {
    const { content } = req.body
    const { tweetId } = req.params

    if(!tweetId || !mongoose.isValidObjectId(tweetId)){
        throw new ApiError(404, "Invalid TweetId")
    }

    if (!content) {
        throw new ApiError(400, "Tweet not be empty")
    }

    const newTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            content,
            owner: req.user._id
        },
        {
            new: true
        }
    )

    if(!newTweet){
        throw new ApiError(404, "Tweet not found!")
    }

    res.
    status(200)
    .json(
        new ApiResponse(200, newTweet, "Tweet updated successfully")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    // const {tweetId} = req.params

    // if(!tweetId || !mongoose.isValidObjectId(tweetId)){
    //     throw new ApiError(404, "Invalid TweetId")
    // }

    // const deletedTweet = await Tweet.findByIdAndDelete(tweetId)

    // if(!deleteTweet){
    //     throw new ApiError(400, "Tweet not deleted!")
    // }

    // res
    // .status(200)
    // .json(
    //     new ApiResponse(200, {}, "Tweet deleted successfully")
    // )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
