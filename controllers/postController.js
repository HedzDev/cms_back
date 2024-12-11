import pool from "../config/database.js";

export const createPost = async (req, res) => {
  try {
    const { title, content, tags, status = "draft" } = req.body;
    const userId = req.user.id;
    console.log(req.user);

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Create post
      const [result] = await connection.query(
        "INSERT INTO posts (title, content, user_id, status) VALUES (?, ?, ?, ?)",
        [title, content, userId, status]
      );

      const postId = result.insertId;

      // Add tags
      if (tags && tags.length) {
        for (const tagName of tags) {
          // Get or create tag
          let [existingTags] = await connection.query(
            "SELECT id FROM tags WHERE name = ?",
            [tagName]
          );

          let tagId;
          if (existingTags.length === 0) {
            const [newTag] = await connection.query(
              "INSERT INTO tags (name) VALUES (?)",
              [tagName]
            );
            tagId = newTag.insertId;
          } else {
            tagId = existingTags[0].id;
          }

          // Link tag to post
          await connection.query(
            "INSERT INTO posts_tags (post_id, tag_id) VALUES (?, ?)",
            [postId, tagId]
          );
        }
      }

      await connection.commit();
      res.status(201).json({ message: "Post created successfully", postId });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ message: "Error creating post" });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, tags, status } = req.body;
    const userId = req.user.id;

    // Check if user owns the post or is admin/moderator
    const [post] = await pool.query("SELECT user_id FROM posts WHERE id = ?", [
      id,
    ]);

    if (!post.length) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (
      post[0].user_id !== userId &&
      !["admin", "moderator"].includes(req.user.role)
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Update post
      await connection.query(
        "UPDATE posts SET title = ?, content = ?, status = ? WHERE id = ?",
        [title, content, status, id]
      );

      // Update tags
      if (tags) {
        // Remove existing tags
        await connection.query("DELETE FROM posts_tags WHERE post_id = ?", [
          id,
        ]);

        // Add new tags
        for (const tagName of tags) {
          let [existingTags] = await connection.query(
            "SELECT id FROM tags WHERE name = ?",
            [tagName]
          );

          let tagId;
          if (existingTags.length === 0) {
            const [newTag] = await connection.query(
              "INSERT INTO tags (name) VALUES (?)",
              [tagName]
            );
            tagId = newTag.insertId;
          } else {
            tagId = existingTags[0].id;
          }

          await connection.query(
            "INSERT INTO posts_tags (post_id, tag_id) VALUES (?, ?)",
            [id, tagId]
          );
        }
      }

      await connection.commit();
      res.json({ message: "Post updated successfully" });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ message: "Error updating post" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user owns the post or is admin/moderator
    const [post] = await pool.query("SELECT user_id FROM posts WHERE id = ?", [
      id,
    ]);

    if (!post.length) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (
      post[0].user_id !== userId &&
      !["admin", "moderator"].includes(req.user.role)
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await pool.query("DELETE FROM posts WHERE id = ?", [id]);
    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting post" });
  }
};

export const getPostsByTag = async (req, res) => {
  try {
    const { tagName } = req.params;
    const [posts] = await pool.query(
      `
      SELECT p.*, u.username, GROUP_CONCAT(t.name) as tags
      FROM posts p
      JOIN users u ON p.user_id = u.id
      JOIN posts_tags pt ON p.id = pt.post_id
      JOIN tags t ON pt.tag_id = t.id
      WHERE t.name = ?
      GROUP BY p.id
    `,
      [tagName]
    );

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching posts" });
  }
};
