import mongoose from "mongoose"
import { Video } from "../models/video.models.js"
import { Subscription } from "../models/subscription.models.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const stats = await Video.aggregate([
        // Match videos of logged-in user
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },

        // Lookup likes
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },

        // 3. Add likes count per video
        {
            $addFields: {
                likesCount: { $size: "$likes" }
            }
        },

        // 4. Group all videos → single stats object
        {
            $group: {
                _id: null,
                totalVideos: { $sum: 1 },
                totalViews: { $sum: "$views" },
                totalLikes: { $sum: "$likesCount" }
            }
        }
    ]);

    // 5. Get subscribers count (separate query)
    const totalSubscribers = await Subscription.countDocuments({
        channel: userId
    });

    return res.status(200).json(
        new ApiResponse(200, {
            totalVideos: stats[0]?.totalVideos || 0,
            totalViews: stats[0]?.totalViews || 0,
            totalLikes: stats[0]?.totalLikes || 0,
            totalSubscribers
        }, "Channel stats fetched successfully")
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const { page = 1, limit = 10 } = req.query;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const videos = await Video.aggregate([
        // Match logged-in user's videos
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
                // No isPublished filter (user can see private videos)
            }
        },

        // Sort latest first
        {
            $sort: { createdAt: -1 }
        },

        // Lookup likes
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },

        // Add likes count
        {
            $addFields: {
                likesCount: { $size: "$likes" }
            }
        },

        // add comments count
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comments"
            }
        },
        {
            $addFields: {
                commentsCount: { $size: "$comments" }
            }
        },

        // Project fields
        {
            $project: {
                title: 1,
                description: 1,
                thumbnail: 1,
                videoFile: 1,
                isPublished: 1,
                createdAt: 1,
                likesCount: 1,
                commentsCount: 1
            }
        },

        // Pagination
        {
            $skip: skip
        },
        {
            $limit: limitNumber
        }
    ]);

    // Total videos count
    const totalVideos = await Video.countDocuments({
        owner: userId
    });

    return res.status(200).json(
        new ApiResponse(200, {
            videos,
            totalVideos,
            currentPage: pageNumber,
            totalPages: Math.ceil(totalVideos / limitNumber)
        }, "Your channel videos fetched successfully")
    );
});

export {
    getChannelStats,
    getChannelVideos
}