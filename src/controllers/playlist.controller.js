import mongoose from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body
    const userId = req.user?._id

    if (!name || name.trim() === "") {
        throw new ApiError(400, "Playlist name is required")
    }

    if (!userId || !mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId")
    }

    const playlist = await Playlist.create({
        owner: userId,
        name,
        description,
        videos: []
    })

    if (!playlist) {
        throw new ApiError(500, "error while creating a playlist")
    }

    res
        .status(201)
        .json(
            new ApiResponse(201, playlist, "Playlist added successfully")
        )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    
})

const getPlaylistById = asyncHandler(async (req, res) => {
    // const { playlistId } = req.params;

    // if (!playlistId || !mongoose.isValidObjectId(playlistId)) {
    //     throw new ApiError(400, "Invalid PlaylistId")
    // }

    // const playlist = await Playlist.findById(playlistId)

    // if (!playlist) {
    //     throw new ApiError(404, "Playlist not found")
    // }

    // return res
    //     .status(200)
    //     .json(
    //         new ApiResponse(200, playlist, "fetched Playlist Successfully")
    //     )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {

})

const deletePlaylist = asyncHandler(async (req, res) => {
//    const { playlistId } = req.params;

   
//    if (!playlistId || !mongoose.isValidObjectId(playlistId)) {
//       throw new ApiError(400, "Invalid PlaylistId");
//    }

//    const playlist = await Playlist.findById(playlistId);

//    if (!playlist) {
//       throw new ApiError(404, "Playlist not found");
//    }

  
//    if (playlist.owner.toString() !== req.user?._id.toString()) {
//       throw new ApiError(403, "Unauthorized to delete this playlist");
//    }

   
//    await Playlist.findByIdAndDelete(playlistId);

   
//    return res.status(200).json(
//       new ApiResponse(200, {}, "Playlist deleted successfully")
//    );
});

const updatePlaylist = asyncHandler(async (req, res) => {

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
