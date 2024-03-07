const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

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


app.use(bodyParser.json());

// User Registration API
app.post('/api/user/register', (req, res) => {
    const { email, password, username } = req.body;

    if (email in users) {
        return res.status(400).json({ message: 'Email already exists' });
    }

    users[email] = { username, password };
    return res.status(200).json({ message: 'User registered successfully' });
});

// User Login API
app.post('/api/user/login', (req, res) => {
    const { username, password } = req.body;

    for (const userEmail in users) {
        const userData = users[userEmail];
        if (userData.username === username && userData.password === password) {
            return res.status(200).json({ message: 'Login successful' });
        }
    }

    return res.status(401).json({ message: 'Invalid username or password' });
});

// Forget User Password API
app.post('/api/user/forget-password', (req, res) => {
    const { email } = req.body;

    if (email in users) {
        // Generate a random temporary password
        const tempPassword = crypto.randomBytes(4).toString('hex');

        // Update the user's password in the database
        users[email].password = tempPassword;

        // For demonstration purposes, just return the temporary password in the response
        return res.status(200).json({ message: 'Temporary password sent', tempPassword });
    } else {
        return res.status(404).json({ message: 'Email not found' });
    }
}); 

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
