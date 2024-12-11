import express from 'express';
import { createComment, updateComment, deleteComment, getCommentsByPost } from '../controllers/commentController.js';
import { authenticateToken } from '../middleware/auth.js';
import { body } from 'express-validator';

const router = express.Router();

router.post('/', [
  authenticateToken,
  body('content').trim().isLength({ min: 1 }),
  body('postId').isInt()
], createComment);

router.put('/:id', [
  authenticateToken,
  body('content').trim().isLength({ min: 1 })
], updateComment);

router.delete('/:id', authenticateToken, deleteComment);

router.get('/post/:postId', getCommentsByPost);

export default router;