import express from "express";
import {
  createPost,
  updatePost,
  deletePost,
  getPostsByTag,
} from "../controllers/postController.js";
import { authenticateToken, checkRole } from "../middleware/auth.js";
import { body } from "express-validator";

const router = express.Router();

router.post(
  "/",
  [
    authenticateToken,
    body("title").trim().isLength({ min: 1 }),
    body("content").trim().isLength({ min: 1 }),
    body("tags").isArray(),
  ],
  createPost
);

router.put(
  "/:id",
  [
    authenticateToken,
    body("title").trim().isLength({ min: 1 }),
    body("content").trim().isLength({ min: 1 }),
    body("tags").isArray(),
  ],
  updatePost
);

router.delete("/:id", authenticateToken, deletePost);

router.get("/tag/:tagName", getPostsByTag);

export default router;
