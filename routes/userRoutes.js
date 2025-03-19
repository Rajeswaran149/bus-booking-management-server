const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../db'); 
const router = express.Router();

// User Registration
router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    // Check if the user already exists
    const { data: userCheck, error: userCheckError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username);

    if (userCheckError) {
      return res.status(500).json({ error: 'Error checking for existing user' });
    }

    if (userCheck.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{ username, password: hashedPassword, role }])
      .select();

    if (insertError) {
      return res.status(500).json({ error: 'Error inserting user into database' });
    }

    res.status(201).json(newUser[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// User Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Fetch the user by username
    const { data: userResult, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (userError || !userResult) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, userResult.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: userResult.id, role: userResult.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ token, role: userResult.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
