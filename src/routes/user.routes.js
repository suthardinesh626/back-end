import { Router } from "express";
import {
    resgiterUser, loginUser,
    logoutUser, refreshAccessToken,
    changeCurrentPassword, getCurrentuser,
    updateAccountDetail, updateUserAvatar,
    updateUserCoverImage, getuserChannelProfile,
    getWatchHistory
} from "../controllers/user.contoller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    resgiterUser
)

router.route("/login").post(loginUser)

router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change=password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentuser)
router.route("/update-detail").pacth(verifyJWT, updateAccountDetail)
router.route("/avatar").patch(verifyJWT, upload.single(avatar), updateUserAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage", updateUserCoverImage))
router.route("/c/:username").get(verifyJWT, getuserChannelProfile)
router.route("/histtory").get(verifyJWT, getWatchHistory)

export default router;

