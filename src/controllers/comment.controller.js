import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getAllComment = asyncHandler(async (req, res) => {

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

// const updateComment = asyncHandler(async (req, res) => {
//     const { content } = req.body
//     const { commentId } = req.params

//     if (!content || content.trim() === "") {
//         throw new ApiError(404, "content not be empty")
//     }

//     if (!commentId || !mongoose.isValidObjectId(commentId)) {
//         throw new ApiError(400, "Invalid CommentId")
//     }

//     const newComment = await Comment.findByIdAndUpdate(
//         commentId,
//         {
//             content
//         },
//         {
//             new: true
//         }
//     )

//     if (!newComment) {
//         throw new ApiError(400, "failed to update new comment")
//     }

//     res
//         .status(200)
//         .json(
//             new ApiResponse(200, newComment, "comment updated successfully")
//         )
// })

const deleteComment = asyncHandler(async (req, res) => {

})

export {
    getAllComment,
    addComment,
    // updateComment,
    deleteComment
}