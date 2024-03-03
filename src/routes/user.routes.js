import { Router } from "express";
import { resgiterUser, loginUser, logoutUser } from "../controllers/user.contoller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verify } from "jsonwebtoken";
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

export default router;

