import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideoDetails,
    updateVideoFile,
} from "../controllers/video.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.middleware.js"

const router = Router();

router.use(verifyJWT);

router.post(
    "/AddNewVideo",
    (req, res, next) => {
        next();
    },
    upload.fields([
        { name: "videoFile", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 },
    ]),
    (req, res, next) => {
        next();
    },
    publishAVideo
);




router.get("/test", (req, res) => {
    res.send("Video route working");
});

router.delete("/delete-video/:videoId", deleteVideo)

router.patch("/update-video-details/:videoId", updateVideoDetails)

router.patch("/update-videoFile",
    upload.single("videoFile"),
    updateVideoFile
);

router.get("/getVideoById", getVideoById)

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

router.route("/").get(getAllVideos)

export default router;