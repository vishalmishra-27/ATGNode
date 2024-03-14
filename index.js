const express = require('express'); // Import the Express framework
const bodyParser = require('body-parser'); // Import middleware for parsing request bodies
const crypto = require('crypto'); // Import the Node.js crypto module for generating random IDs

const app = express(); // Create an Express application
const PORT = 3000; // Define the port number for the server to listen on

// Dummy database for storing user data
const users = {
    'user1@example.com': {
        username: 'user1',
        password: 'password123'
    },
    'user2@example.com': {
        username: 'user2',
        password: 'abc123'
    },
    'user3@example.com': {
        username: 'user3',
        password: 'qwerty'
    }
};

// Dummy database for storing posts
let posts = [];

app.use(bodyParser.json()); // Use bodyParser middleware to parse JSON request bodies

// User Registration API
app.post('/api/user/register', (req, res) => {
    // Handle user registration requests
    const { email, password, username } = req.body;

    // Check if the email already exists in the database
    if (email in users) {
        return res.status(400).json({ message: 'Email already exists' });
    }

    // Add the new user to the database
    users[email] = { username, password };
    return res.status(200).json({ message: 'User registered successfully' });
});


// User Login API
app.post('/api/user/login', (req, res) => {
    // Handle user login requests
    const { username, password } = req.body;

    // Iterate over the users in the database to find a matching username and password
    for (const userEmail in users) {
        const userData = users[userEmail];
        if (userData.username === username && userData.password === password) {
            return res.status(200).json({ message: 'Login successful' });
        }
    }

    // Return an error response if the username or password is incorrect
    return res.status(401).json({ message: 'Invalid username or password' });
});


// Forget User Password API
app.post('/api/user/forget-password', (req, res) => {
    // Handle requests to reset a user's password
    const { email } = req.body;

    // Check if the email exists in the database
    if (email in users) {
        // Generate a random temporary password
        const tempPassword = crypto.randomBytes(4).toString('hex');

        // Update the user's password in the database with the temporary password
        users[email].password = tempPassword;

        // For demonstration purposes, return the temporary password in the response
        return res.status(200).json({ message: 'Temporary password sent', tempPassword });
    } else {
        // Return an error response if the email is not found in the database
        return res.status(404).json({ message: 'Email not found' });
    }
});


// Create a new post API
app.post('/api/post', (req, res) => {
    // Handle requests to create a new post
    const { userId, content } = req.body;

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


// Get all posts API
app.get('/api/posts', (req, res) => {
    // Handle requests to retrieve all posts
    return res.status(200).json({ posts });
});


// Update a post API
app.put('/api/post/:postId', (req, res) => {
    // Handle requests to update a post
    const postId = req.params.postId;
    const { content } = req.body;

    // Find the post in the posts database by ID
    const postIndex = posts.findIndex(post => post.id === postId);

    // Check if the post exists
    if (postIndex !== -1) {
        // Update the content of the post
        posts[postIndex].content = content;
        // Return a success response with the updated post
        return res.status(200).json({ message: 'Post updated successfully', post: posts[postIndex] });
    } else {
        // Return an error response if the post is not found
        return res.status(404).json({ message: 'Post not found' });
    }
});


// Delete a post API
app.delete('/api/post/:postId', (req, res) => {
    // Handle requests to delete a post
    const postId = req.params.postId;

    // Find the post in the posts database by ID
    const postIndex = posts.findIndex(post => post.id === postId);

    // Check if the post exists
    if (postIndex !== -1) {
        // Remove the post from the posts database
        posts.splice(postIndex, 1);
        // Return a success response
        return res.status(200).json({ message: 'Post deleted successfully' });
    } else {
        // Return an error response if the post is not found
        return res.status(404).json({ message: 'Post not found' });
    }
});


// Like a post API
app.post('/api/post/:postId/like', (req, res) => {
    // Handle requests to like a post
    const postId = req.params.postId;
    const { userId } = req.body;

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


// Add a comment to a post API
app.post('/api/post/:postId/comment', (req, res) => {
    // Handle requests to add a comment to a post
    const postId = req.params.postId;
    const { userId, comment } = req.body;

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
