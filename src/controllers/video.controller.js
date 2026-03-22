import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    let { page, limit, query, sortBy = "createdAt", sortType = "desc", userId } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    const skip = (page - 1) * limit;

    const filter = {
        isPublished: true
    };

    // 🔍 Search
    if (query && query.trim() !== "") {
        filter.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ];
    }

    // ✅ FIXED VALIDATION
    if (userId && !mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId");
    }

    // 👤 Filter
    if (userId) {
        filter.owner = new mongoose.Types.ObjectId(userId);
    }

    const sortOrder = sortType === "asc" ? 1 : -1;

    const videos = await Video.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .populate("owner", "username avatar");

    const totalVideos = await Video.countDocuments(filter);

    res.status(200).json(
        new ApiResponse(200, {
            videos,
            pagination: {
                totalVideos,
                currentPage: page,
                totalPages: Math.ceil(totalVideos / limit),
                limit
            }
        }, "Videos fetched successfully")
    );
});

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
    const { videoId } = req.params;


    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }


    const video = await Video.findOne({
        _id: videoId,
        isPublished: true
    });


    if (!video) {
        throw new ApiError(404, "Video not found");
    }


    return res.status(200).json(
        new ApiResponse(200, video, "Video fetched successfully")
    );
});

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

const updateVideoFile = asyncHandler(async (req, res) => {

    // 0. validate id
    const { videoId } = req.params;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // 1. check if video exists FIRST
    const existingVideo = await Video.findById(videoId);

    if (!existingVideo) {
        throw new ApiError(404, "video not found");
    }

    // 2. get video file
    const videoFile = req.file?.path;

    if (!videoFile) {
        throw new ApiError(400, "video file is required");
    }

    // 3. upload to cloudinary
    const uploadedVideo = await uploadOnCloudinary(videoFile);

    if (!uploadedVideo?.url) {
        throw new ApiError(400, "error uploading video");
    }

    // 🔥 OPTIONAL: delete old video from cloudinary
    // await deleteFromCloudinary(existingVideo.videoFile);

    // 4. update DB
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                videoFile: uploadedVideo.url
            }
        },
        { new: true }
    );

    // 5. response
    return res.status(200).json(
        new ApiResponse(200, updatedVideo, "video successfully updated")
    );
});

const updateVideoThumbnail = asyncHandler(async (req, res) => {

    const { videoId } = req.params;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const existingVideo = await Video.findById(videoId);

    if (!existingVideo) {
        throw new ApiError(400, "video not found")
    }

    const thumbnailFile = req?.file?.path;

    if (!thumbnailFile) {
        throw new ApiError(400, "thumbnail file is required")
    }

    const uploadThumbnail = await uploadOnCloudinary(thumbnailFile)

    if (!uploadThumbnail.url) {
        throw new ApiError(400, "error uploading new thumbnail")
    }

    const thumbnail = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                thumbnail: uploadThumbnail.url
            }
        },
        {
            new: true
        }
    )

    return res
        .status(200)
        .json(
            new ApiResponse(200, thumbnail, "Successfully uploaded new thumbnail")
        )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const video = await Video.findByIdAndDelete(req.params.videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Video deleted successfully")
        )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    // get Video by id
    // validate id
    //find video
    //toggle status => if published than true else false
    // update in db
    //return response

    const { videoId } = req.params;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video Id")
    }

    const existingVideo = await Video.findById(videoId)

    if (!existingVideo) {
        throw new ApiError(400, "video not found")
    }

    const updateVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !existingVideo.isPublished
            }
        },
        {
            new: true
        }
    )

    return res
        .status(200)
        .json(
            new ApiResponse(200, updateVideo, `video is now ${updateVideo.isPublished ? "Published" : "Unpublished"}`)
        );
})


export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    deleteVideo,
    togglePublishStatus,
    updateVideoDetails,
    updateVideoFile,
    updateVideoThumbnail
}
