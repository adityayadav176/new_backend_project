import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.models.js"
import { User } from "../models/user.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {

})

const publishAVideo = asyncHandler(async (req, res) => {

    // get video data from response.body
    // title, description, thumbnail, videoFile
    // check required field exists if missing give error
    // upload video on cloudinary
    // upload thumbnail in cloudinary
    // create video object with title, description, videoUrl, thumbnailUrl, owner
    //save video to database
    // return success and response with video data
    // end

    const { title, description } = req.body

    if (!title || !description) {
        throw new ApiError(400, "Title and description are required")
    }

    const videoFileLocalUrl = req.files?.videoFile?.[0]?.path
    const thumbnailFileLocalUrl = req.files?.thumbnail?.[0]?.path


    if (!videoFileLocalUrl) {
        throw new ApiError(400, "Video file is Required")
    }

    if (!thumbnailFileLocalUrl) {
        throw new ApiError(400, "Thumbnail is Required")
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalUrl)
    const thumbnail = await uploadOnCloudinary(thumbnailFileLocalUrl)

    if (!videoFile) {
        throw new ApiError(500, "something went wrong while uploading the video in cloudinary!")
    }
    if (!thumbnail) {
        throw new ApiError(500, "something went wrong while uploading Video thumbnail in cloudinary!")
    }

    const newVideos = await Video.create({
        title,
        description,
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        owner: req.user._id,
        duration: videoFile.duration || 0,
        views: 0,
    })


    if (!newVideos) {
        throw new ApiError(400, "something went wrong while uploading the video")
    }

    return res.status(201).json(
        new ApiResponse(201, newVideos, "video successfully uploaded")
    )
})

const getVideoById = asyncHandler(async (req, res) => {
})

const updateVideoDetails = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    // At least one field required
    if (!title && !description) {
        throw new ApiError(400, "At least one field is required");
    }

    // Prepare update object safely
    const updateData = {};

    if (title) updateData.title = title;
    if (description) updateData.description = description;

    const video = await Video.findByIdAndUpdate(
        req.params.videoId,
        { $set: updateData },
       { returnDocument: "after" }
    );

    if (!video) {
        throw new ApiError(404, "Video not found or update failed");
    }

    return res.status(200).json(
        new ApiResponse(200, video, "Video details updated successfully")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
    const video = await Video.findByIdAndDelete(req.params.videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    return res.status(200).json({
        success: true,
        data: video,
        message: "Video deleted successfully"
    })
})

const togglePublishStatus = asyncHandler(async (req, res) => {

})
const updateVideo = asyncHandler(async (req, res) => {

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    updateVideoDetails
}
