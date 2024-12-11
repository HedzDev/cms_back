import pool from "../config/database.js";

export const createComment = async (req, res) => {
  try {
    const { content, postId } = req.body;
    const userId = req.user.id;

    // Check if post exists
    const [post] = await pool.query("SELECT id FROM posts WHERE id = ?", [
      postId,
    ]);
    if (!post.length) {
      return res.status(404).json({ message: "Post not found" });
    }

    const [result] = await pool.query(
      "INSERT INTO comments (content, user_id, post_id) VALUES (?, ?, ?)",
      [content, userId, postId]
    );

    const [comment] = await pool.query(
      `
      SELECT c.*, u.username 
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `,
      [result.insertId]
    );

    res.status(201).json({
      message: "Comment created successfully",
      comment: comment[0],
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating comment" });
  }
};

export const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Check if comment exists and user owns it
    const [comment] = await pool.query(
      "SELECT user_id FROM comments WHERE id = ?",
      [id]
    );

    if (!comment.length) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Allow comment update only for comment owner or admin/moderator
    if (
      comment[0].user_id !== userId &&
      !["admin", "moderator"].includes(req.user.role)
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await pool.query("UPDATE comments SET content = ? WHERE id = ?", [
      content,
      id,
    ]);

    res.json({ message: "Comment updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating comment" });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if comment exists and user owns it
    const [comment] = await pool.query(
      "SELECT user_id FROM comments WHERE id = ?",
      [id]
    );

    if (!comment.length) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Allow comment deletion only for comment owner or admin/moderator
    if (
      comment[0].user_id !== userId &&
      !["admin", "moderator"].includes(req.user.role)
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await pool.query("DELETE FROM comments WHERE id = ?", [id]);
    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting comment" });
  }
};

export const getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;

    // Check if post exists
    const [post] = await pool.query("SELECT id FROM posts WHERE id = ?", [
      postId,
    ]);
    if (!post.length) {
      return res.status(404).json({ message: "Post not found" });
    }

    const [comments] = await pool.query(
      `
      SELECT c.*, u.username
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at DESC
    `,
      [postId]
    );

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching comments" });
  }
};
