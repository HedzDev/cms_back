import pool from '../config/database.js';
import bcrypt from 'bcryptjs';

async function seedDatabase() {
  try {
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await pool.query(`
      INSERT INTO users (username, email, password, role) 
      VALUES ('admin', 'admin@example.com', ?, 'admin')
    `, [hashedPassword]);

    // Create moderator
    const modPassword = await bcrypt.hash('mod123', 10);
    await pool.query(`
      INSERT INTO users (username, email, password, role) 
      VALUES ('moderator', 'mod@example.com', ?, 'moderator')
    `, [modPassword]);

    // Create regular user
    const userPassword = await bcrypt.hash('user123', 10);
    await pool.query(`
      INSERT INTO users (username, email, password, role) 
      VALUES ('user', 'user@example.com', ?, 'user')
    `, [userPassword]);

    // Create sample tags
    const tags = ['Technology', 'Travel', 'Food', 'Lifestyle', 'Business'];
    for (const tag of tags) {
      await pool.query('INSERT INTO tags (name) VALUES (?)', [tag]);
    }

    // Create sample post
    const [result] = await pool.query(`
      INSERT INTO posts (title, content, user_id, status) 
      VALUES ('Welcome to our CMS', 'This is a sample post content.', 1, 'published')
    `);

    // Add tags to the post
    const postId = result.insertId;
    await pool.query(`
      INSERT INTO posts_tags (post_id, tag_id) 
      VALUES (?, 1), (?, 2)
    `, [postId, postId]);

    // Add sample comment
    await pool.query(`
      INSERT INTO comments (content, user_id, post_id) 
      VALUES ('Great first post!', 2, ?)
    `, [postId]);

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();