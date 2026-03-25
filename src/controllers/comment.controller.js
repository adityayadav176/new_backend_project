import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { page, limit } = req.query;

    // check if videoId Invalid
    if (!videoId || !mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }
    // Convert query to numbers
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    // Calculate skip
    const skip = (pageNumber - 1) * limitNumber;

    //total comment
    const totalComments = await Comment.countDocuments({
        video: videoId
    })
    // find Comments with proper pagination and populate user details
    const Comments = await Comment.find({
        video: videoId
    }).sort({ createdAt: -1 }).skip(skip).limit(limitNumber).populate("owner", "username avatar")

    // check comment not empty
    if (!Comments || Comments.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, [], "No Comments Yet!")
        )
    }
    //send response
    res
        .status(200)
        .json(
            new ApiResponse(200, {
                Comments,
                totalComments,
                currentPage: pageNumber,
                totalPages: Math.ceil(totalComments / limitNumber)
            }, "fetched All Comments successfully")
        )
})

const addComment = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { videoId } = req.params;

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment cannot be empty");
    }

    if (!videoId || !mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    });

    if (!comment) {
        throw new ApiError(500, "Failed to create comment");
    }

    return res
        .status(201)
        .json(
            new ApiResponse(201, comment, "Comment successfully created")
        );
});

const updateComment = asyncHandler(async (req, res) => {
    const { content } = req.body
    const { commentId } = req.params

    if (!content || content.trim() === "") {
        throw new ApiError(404, "content not be empty")
    }

    if (!commentId || !mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid CommentId")
    }

    const newComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content
            }
        },
        {
            new: true
        }
    )

    if (!newComment) {
        throw new ApiError(400, "failed to update new comment")
    }

    res
        .status(200)
        .json(
            new ApiResponse(200, newComment, "comment updated successfully")
        )
})

const deleteComment = asyncHandler(async (req, res) => {

    const { commentId } = req.params

    if (!commentId || !mongoose.isValidObjectId(commentId)) {
        throw new ApiError(404, "Invalid commentId")
    }
    const comment = await Comment.findByIdAndDelete(commentId)

    if (!comment) {
        throw new ApiError(400, "comment not found!")
    }

    res
        .status(200)
        .json(
            new ApiResponse(200, {}, "comment deleted successfully")
        )
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}