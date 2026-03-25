import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.models.js"
import { Subscription } from "../models/subscription.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const userId = req.user?._id;

    // Auth check
    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    // Validate channelId
    if (!channelId || !mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId");
    }

    // Prevent self subscribe
    if (channelId.toString() === userId.toString()) {
        throw new ApiError(400, "You cannot subscribe to your own channel");
    }

    // Check channel exists
    const channelExists = await User.exists({ _id: channelId });
    if (!channelExists) {
        throw new ApiError(404, "Channel not found");
    }

    // Check existing subscription
    const existingSubscriber = await Subscription.findOne({
        subscriber: userId,
        channel: channelId
    });

    let message;

    if (existingSubscriber) {
        await Subscription.deleteOne({ _id: existingSubscriber._id });
        message = "Unsubscribed successfully";
    } else {
        await Subscription.create({
            subscriber: userId,
            channel: channelId
        });
        message = "Subscribed successfully";
    }

    return res.status(200).json(
        new ApiResponse(200, {}, message)
    );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    let { page = 1, limit = 10 } = req.query;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const pageNumber = Math.max(1, parseInt(page));
    const limitNumber = Math.max(1, parseInt(limit));
    const skip = (pageNumber - 1) * limitNumber;

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberDetails"
            }
        },
        { $unwind: "$subscriberDetails" },
        {
            $project: {
                _id: "$subscriberDetails._id",
                fullname: "$subscriberDetails.fullname",
                username: "$subscriberDetails.username",
                avatar: "$subscriberDetails.avatar"
            }
        },
        { $skip: skip },
        { $limit: limitNumber }
    ]);

    return res.status(200).json(
        new ApiResponse(200, subscribers, "Subscribers fetched successfully")
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    let { page = 1, limit = 10 } = req.query;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const pageNumber = Math.max(1, parseInt(page));
    const limitNumber = Math.max(1, parseInt(limit));
    const skip = (pageNumber - 1) * limitNumber;

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
        { $unwind: "$channelDetails" },
        {
            $project: {
                _id: 0,
                channelId: "$channelDetails._id",
                username: "$channelDetails.username",
                fullname: "$channelDetails.fullname",
                avatar: "$channelDetails.avatar"
            }
        },
        { $skip: skip },
        { $limit: limitNumber }
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