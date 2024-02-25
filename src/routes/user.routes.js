import { Router } from "express";
import { resgiterUser } from "../controllers/user.contoller.js";

const router = Router();

router.route("/register").post(resgiterUser)

export default router;

