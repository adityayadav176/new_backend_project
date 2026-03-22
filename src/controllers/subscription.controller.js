import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.models.js"
import { Subscription } from "../models/subscription.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const userId =  req.user?._id

    if(!channelId || !mongoose.isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channelId")
    }

    if(channelId.toString() === userId.toString()){
        throw new ApiError(400, "you can not subscribe to your own channel")
    }

    if(!userId){
        throw new ApiError(401, "unAuthorized!")
    }

    const existingSubscriber = await Subscription.findOne({
        subscriber: userId,
        channel: channelId 
    })

    let message;

    if(existingSubscriber){
        await Subscription.findByIdAndDelete(existingSubscriber._id);
        message = "unsubscribed successfully"
    }else{
        await Subscription.create({
            subscriber: userId,
            channel: channelId
        });
        message = "Subscribed successfully"
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, message)
    );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const channels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelDetails"
            }
        },
        {
            $unwind: "$channelDetails"
        },
        {
            $project: {
                _id: 0,
                channelId: "$channelDetails._id",
                username: "$channelDetails.username",
                fullname: "$channelDetails.fullname",
                avatar: "$channelDetails.avatar"
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, channels, "Subscribed channels fetched successfully")
    );
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}