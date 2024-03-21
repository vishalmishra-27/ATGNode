// Import required modules
const express = require('express'); // Import the Express framework
const bodyParser = require('body-parser'); // Import middleware for parsing request bodies
const crypto = require('crypto'); // Import the Node.js crypto module for generating random IDs
const jwt = require('jsonwebtoken'); // Import JWT module for authentication
const bcrypt = require('bcrypt'); // Import bcrypt module for password hashing

// Create an Express application
const app = express();

// Define the port number for the server to listen on
const PORT = 3000;

// Dummy database for storing user data
const users = {
    'user1@example.com': {
        username: 'user1',
        password: '$2b$10$caQLEGLl3otM.X2WCs9U8ONXoz40Ltvkia7evMdBaXwslOCvS0Jsu' // Hashed password: password123
    },
    'user2@example.com': {
        username: 'user2',
        password: '$2b$10$oAPYKwEV0ijod0AL9P.hcuKdnbIMbjazArkqKhCRe/7rZvQKCKODu' // Hashed password: abc123
    },
    'user3@example.com': {
        username: 'user3',
        password: '$2b$10$3Et/ybQ8AV/WP0ILxaiM2uQtEF3laS9a5WSlIaP2o3uJ.Jm6wq.kG' // Hashed password: qwerty
    }
};

// Dummy database for storing posts
let posts = [];

// Secret key for signing JWT tokens
const JWT_SECRET = 'HI_THIS_IS_V!$HAL';

// Middleware function to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']; // Get token from request headers

    // Check if token exists
    if (!token) {
        return res.status(401).json({ message: 'Token not provided' });
    }

    // Verify token
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid token' });
        }
        req.user = decoded.user; // Set user data in request object
        next(); // Call next middleware
    });
};

// Use bodyParser middleware to parse JSON request bodies
app.use(bodyParser.json());

// User Registration API with JWT token and password encryption
app.post('/api/user/register', async (req, res) => {
    // Handle user registration requests
    const { email, password, username } = req.body;

    // Hash password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10); // Salt rounds: 10

    // Check if the email already exists in the database
    if (email in users) {
        return res.status(400).json({ message: 'Email already exists' });
    }

    // Add the new user to the database with hashed password
    users[email] = { username, password: hashedPassword };

    // Save registered user's data in 'newUser' variable & send it in response
    const newUser = users[email];

    // Generate JWT token
    const token = jwt.sign({ user: { username } }, JWT_SECRET, { expiresIn: '12h' }); // Token expires in 12 hour

    // Return token in response
    return res.status(200).json({ message: 'User registered successfully', newUser, token });
});

// User Login API with JWT token
app.post('/api/user/login', async (req, res) => {
    // Handle user login requests
    const { username, password } = req.body;

    // Iterate over the users in the database to find a matching username
    for (const userEmail in users) {
        const userData = users[userEmail];
        if (userData.username === username) {
            // Compare hashed password using bcrypt
            const match = await bcrypt.compare(password, userData.password);
            if (match) {
                // Generate JWT token
                const token = jwt.sign({ user: { username } }, JWT_SECRET, { expiresIn: '12h' }); // Token expires in 12 hour
                // Return token in response
                return res.status(200).json({ message: 'Login successful', token });
            }
        }
    }

    // Return error response if username or password is incorrect
    return res.status(401).json({ message: 'Invalid username or password' });
});

// Forget User Password API with token verification
app.post('/api/user/forget-password', verifyToken, async (req, res) => {
    // Handle requests to reset a user's password
    const userId = req.user.username; // Get username from the decoded JWT token
    const { email } = req.body;

    // Check if the email exists and also if the user is the owner of the account
    if (email in users) {
        if (users[email].username === userId) {
            // Generate a random temporary password
            const tempPassword = crypto.randomBytes(4).toString('hex');

            // Hash password using bcrypt
            const hashedPassword = await bcrypt.hash(tempPassword, 10); // Salt rounds: 10

            // Update the user's password in the database with the temporary password
            users[email].password = hashedPassword;

            // For demonstration purposes, return the temporary password in the response
            return res.status(200).json({ message: 'Temporary password sent', tempPassword });
        } else {
            // Return an error response if the user is not the owner of the account
            return res.status(403).json({ message: 'You are not authorized to reset the password to this account' });
        }
    } else {
        // Return an error response if the email is not found in the database
        return res.status(404).json({ message: 'Email not found' });
    }
});

// Create a new post API with token verification
app.post('/api/post', verifyToken, (req, res) => {
    // Handle requests to create a new post
    const { content } = req.body;
    const userId = req.user.username; // Get username from the decoded JWT token

    // Generate a unique ID for the new post
    const newPost = {
        id: crypto.randomBytes(3).toString('hex'), // Generate unique ID for the post
        userId,
        content,
        likes: [],
        comments: []
    };

    // Add the new post to the posts database
    posts.push(newPost);

    // Return a success response with the newly created post
    return res.status(201).json({ message: 'Post created successfully', post: newPost });
});

// Get all posts API with token verification
app.get('/api/posts', verifyToken, (req, res) => {
    // Handle requests to retrieve all posts
    return res.status(200).json({ posts });
});

// Update a post API with token verification
app.put('/api/post/:postId', verifyToken, (req, res) => {
    // Handle requests to update a post
    const postId = req.params.postId;
    const { content } = req.body;
    const userId = req.user.username; // Get username from the decoded JWT token

    // Find the post in the posts database by ID
    const postIndex = posts.findIndex(post => post.id === postId);

    // Check if the post exists
    if (postIndex !== -1) {
        // Check if the user is the author of the post
        if (posts[postIndex].userId === userId) {
            // Update the content of the post
            posts[postIndex].content = content;
            // Return a success response with the updated post
            return res.status(200).json({ message: 'Post updated successfully', post: posts[postIndex] });
        } else {
            // Return an error response if the user is not the author of the post
            return res.status(403).json({ message: 'You are not authorized to Update this post' });
        }
    } else {
        // Return an error response if the post is not found
        return res.status(404).json({ message: 'Post not found' });
    }
});

// Delete a post API with token verification and authorization
app.delete('/api/post/:postId', verifyToken, (req, res) => {
    // Handle requests to delete a post
    const postId = req.params.postId;
    const userId = req.user.username; // Get username from the decoded JWT token

    // Find the post in the posts database by ID
    const postIndex = posts.findIndex(post => post.id === postId);

    // Check if the post exists
    if (postIndex !== -1) {
        // Check if the user is the author of the post
        if (posts[postIndex].userId === userId) {
            // Remove the post from the posts database
            posts.splice(postIndex, 1);
            // Return a success response
            return res.status(200).json({ message: 'Post deleted successfully' });
        } else {
            // Return an error response if the user is not the author of the post
            return res.status(403).json({ message: 'You are not authorized to delete this post' });
        }
    } else {
        // Return an error response if the post is not found
        return res.status(404).json({ message: 'Post not found' });
    }
});

// Like a post API with token verification
app.post('/api/post/:postId/like', verifyToken, (req, res) => {
    // Handle requests to like a post
    const postId = req.params.postId;
    const userId = req.user.username; // Get username from the decoded JWT token

    // Find the post in the posts database by ID
    const postIndex = posts.findIndex(post => post.id === postId);

    // Check if the post exists
    if (postIndex !== -1) {
        // Check if the user has already liked the post
        if (!posts[postIndex].likes.includes(userId)) {
            // Add the user's ID to the list of likes for the post
            posts[postIndex].likes.push(userId);
        }
        // Return a success response
        return res.status(200).json({ message: 'Post liked successfully' });
    } else {
        // Return an error response if the post is not found
        return res.status(404).json({ message: 'Post not found' });
    }
});

// Add a comment to a post API with token verification
app.post('/api/post/:postId/comment', verifyToken, (req, res) => {
    // Handle requests to add a comment to a post
    const postId = req.params.postId;
    const { comment } = req.body;
    const userId = req.user.username; // Get username from the decoded JWT token

    // Find the post in the posts database by ID
    const postIndex = posts.findIndex(post => post.id === postId);

    // Check if the post exists
    if (postIndex !== -1) {
        // Add the new comment to the post's comments array
        posts[postIndex].comments.push({ userId, comment });
        // Return a success response
        return res.status(200).json({ message: 'Comment added successfully' });
    } else {
        // Return an error response if the post is not found
        return res.status(404).json({ message: 'Post not found' });
    }
});

// Start the server and listen for incoming requests
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
