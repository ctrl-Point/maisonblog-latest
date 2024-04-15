const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const User = require('./models/User');
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const bcrypt = require('bcryptjs');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const uploadMiddleware = multer({ dest: 'uploads/' });
const fs = require('fs');

const salt = bcrypt.genSaltSync(10);
const secret = 'asdfe45we45w345wegw345werjktjwertkj';

app.use(cors({ credentials: true, origin: 'https://blog.maisondecorco.com' }));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));

mongoose.connect('mongodb+srv://amin4712:ANdakun.1010@mogo-express-db.ume5fvt.mongodb.net/?retryWrites=true&w=majority&appName=mogo-express-db');

// Error handling for asynchronous mongoose operations
const handleAsyncError = async (fn) => {
  try {
    return await fn();
  } catch (error) {
    console.error(error);
    // Send a generic error response or specific error messages based on the error type
    return { error: 'Internal server error' };
  }
};

// Improved error handling for routes
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const userDoc = await User.create({
      username,
      password: bcrypt.hashSync(password, salt),
    });
    res.json(userDoc);
  } catch (error) {
    res.status(400).json({ error: 'Registration failed' }); // More specific error message
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const userDoc = await User.findOne({ username });
    if (!userDoc) {
      return res.status(400).json({ error: 'User not found' });
    }
    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (passOk) {
      // logged in
      jwt.sign({ username, id: userDoc._id }, secret, {}, (err, token) => {
        if (err) throw err;
        res.cookie('token', token).json({
          id: userDoc._id,
          username,
        });
      });
    } else {
      res.status(400).json({ error: 'Wrong credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/profile', (req, res) => {
  const { token } = req.cookies;
  jwt.verify(token, secret, {}, (err, info) => {
    if (err) {
      console.error(err);
      return res.status(401).json({ error: 'Unauthorized' });
    }
    res.json(info);
  });
});

app.post('/logout', (req, res) => {
  res.cookie('token', '').json('ok');
  localStorage.removeItem('token');
  res.redirect('/');
});

app.post('/post', uploadMiddleware.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const { originalname, path } = req.file;
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];
    const newPath = path + '.' + ext;
    fs.renameSync(path, newPath);

    const { token } = req.cookies;
    jwt.verify(token, secret, {}, async (err, info) => {
      if (err) throw err;
      const { title, summary, content } = req.body;
      const postDoc = await Post.create({
        title,
        summary,
        content,
        cover: newPath,
        author: info.id,
      });
      res.json(postDoc);
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/post', uploadMiddleware.single('file'), async (req, res) => {
  try {
    let newPath = null;
    if (req.file) {
      const { originalname, path } = req.file;
      const parts = originalname.split('.');
      const ext = parts[parts.length - 1];
      newPath = path + '.' + ext;
      fs.renameSync(path, newPath);
    }

    const { token } = req.cookies;
    jwt.verify(token, secret, {}, async (err, info) => {
      if (err) throw err;
      const { id, title, summary, content } = req.body;
      const postDoc = await Post.findById(id);
      const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
      if (!isAuthor) {
        return res.status(400).json({ error: 'You are not the author' });
      }
      await postDoc.update({
        title,
        summary,
        content,
        cover: newPath ? newPath : postDoc.cover,
      });

      res.json(postDoc);
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/post', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', ['username'])
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/post/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const postDoc = await Post.findById(id).populate('author', ['username']);
    if (!postDoc) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(postDoc);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/post/:id', async (req, res) => {
  try {
    const { token } = req.cookies;
    jwt.verify(token, secret, async (err, info) => {
      if (err) throw err;

      const { id } = req.params;
      const postDoc = await Post.findById(id);

      if (!postDoc) {
        return res.status(404).json({ error: 'Post not found' });
      }

      const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
      if (!isAuthor) {
        return res.status(400).json({ error: 'You are not the author' });
      }

      await Post.findByIdAndDelete(id);
      if (postDoc.cover) {
        try {
          fs.unlinkSync(postDoc.cover); // Use try...catch for file deletion
        } catch (error) {
          console.error('Error deleting cover image:', error);
        }
      }
      res.json({ message: 'Post deleted successfully' });
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function handleLikeDislike(id, likeStatus) {
  if (likeStatus === undefined || typeof likeStatus !== 'boolean') {
    return { error: 'Invalid like status (must be true or false)' };
  }

  try {
    const postDoc = await Post.findById(id);
    if (!postDoc) {
      return { error: 'Post not found' };
    }

    if (likeStatus) {
      postDoc.likes++;
    } else {
      postDoc.dislikes++;
    }
    await postDoc.save();

    // Fetch the updated post document with new like/dislike count
    const updatedPost = await Post.findById(id).populate('author', ['username']);

    return updatedPost;
  } catch (error) {
    console.error(error);
    return { error: 'Internal server error' };
  }
}

app.post('/like-dislike/:id', async (req, res) => {
  const { id } = req.params;
  const { like } = req.body; // Extract like status from request body
  console.log(req.body)
  // Implement authentication check here (e.g., using token verification)

  const likeDislikeResult = await handleLikeDislike(id, like);
  if (likeDislikeResult.error) {
    return res.status(400).json(likeDislikeResult);
  }

  res.json(likeDislikeResult);
});

app.post('/comment/:id', async (req, res) => {
  try {
    const { name, comment, id } = req.body; // Extract comment and postId from request body

    const newComment = await new Comment({
      name,
      comment,
      post: id,
    }).save();

    res.json(newComment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});


app.get('/post/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const comments = await Comment.find({ post: id });
    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});



app.listen(4000);
