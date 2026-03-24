import mongoose from "mongoose"
import { Video } from "../models/video.models.js"
import { Subscription } from "../models/subscription.models.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
})

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