import mongoose from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const trimmedName = name?.trim();

    if (!trimmedName) {
        throw new ApiError(400, "Playlist name is required");
    }

    const playlist = await Playlist.create({
        owner: userId,
        name: trimmedName,
        description: description?.trim() || "",
        videos: []
    });

    return res.status(201).json(
        new ApiResponse(201, playlist, "Playlist created successfully")
    );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    let { page = 1, limit = 10 } = req.query;

    if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid UserId");
    }

    page = Math.max(1, parseInt(page) || 1);
    limit = Math.max(1, parseInt(limit) || 10);
    const skip = (page - 1) * limit;

    const [playlists, total] = await Promise.all([
        Playlist.find({ owner: userId })
            .select("name description createdAt")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),

        Playlist.countDocuments({ owner: userId })
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            playlists,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        }, "Playlists fetched successfully")
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!mongoose.isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid PlaylistId");
    }

    const playlist = await Playlist.findById(playlistId)
        .populate("videos", "title thumbnail duration")
        .populate("owner", "username avatar");

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    return res.status(200).json(
        new ApiResponse(200, playlist, "Playlist fetched successfully")
    );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    if (
        !mongoose.isValidObjectId(playlistId) ||
        !mongoose.isValidObjectId(videoId)
    ) {
        throw new ApiError(400, "Invalid IDs");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const updated = await Playlist.findOneAndUpdate(
        {
            _id: playlistId,
            owner: userId,
            videos: { $ne: videoId }
        },
        {
            $addToSet: { videos: videoId }
        },
        { new: true }
    );

    if (!updated) {
        throw new ApiError(404, "Playlist not found or video already exists");
    }

    return res.status(200).json(
        new ApiResponse(200, updated, "Video added successfully")
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    if (
        !mongoose.isValidObjectId(playlistId) ||
        !mongoose.isValidObjectId(videoId)
    ) {
        throw new ApiError(400, "Invalid IDs");
    }

    const updated = await Playlist.findOneAndUpdate(
        {
            _id: playlistId,
            owner: userId,
            videos: videoId
        },
        {
            $pull: { videos: videoId }
        },
        { new: true }
    );

    if (!updated) {
        throw new ApiError(404, "Playlist not found or video not in playlist");
    }

    return res.status(200).json(
        new ApiResponse(200, updated, "Video removed successfully")
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    if (!mongoose.isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid PlaylistId");
    }

    const deleted = await Playlist.findOneAndDelete({
        _id: playlistId,
        owner: userId
    });

    if (!deleted) {
        throw new ApiError(404, "Playlist not found or unauthorized");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Playlist deleted successfully")
    );
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    if (!mongoose.isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid PlaylistId");
    }

    if (!name || name.trim() === "") {
        throw new ApiError(400, "Playlist name is required");
    }

    const updated = await Playlist.findOneAndUpdate(
        {
            _id: playlistId,
            owner: userId
        },
        {
            $set: {
                name: name.trim(),
                description: description?.trim()
            }
        },
        { new: true }
    );

    if (!updated) {
        throw new ApiError(404, "Playlist not found");
    }

    return res.status(200).json(
        new ApiResponse(200, updated, "Playlist updated successfully")
    );
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
