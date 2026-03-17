import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
} from "../controllers/video.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"

const router = Router();
console.log("publishAVideo:", publishAVideo);
router.use(verifyJWT);

router.route("/")
.get(getAllVideos)

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

router.route("/all").post(getVideoById)

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

router.get("/test", (req, res) => {
    res.send("Video route working");
});

router
.route("/:videoId")
.get(getVideoById)
.delete(deleteVideo)
.patch(upload.single("thumbnail"), updateVideo);
console.log("video routes loaded")
export default router;