import jwt from 'jsonwebtoken';
const users = [];

export const signup = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ error: "Username and password required" });

  const exists = users.find(u => u.username === username);
  if (exists)
    return res.status(409).json({ error: "User already exists" });

  const newUser = { username, password, isAdmin: username === "admin", _id: generateId() };
  users.push(newUser);
  res.status(201).json({ message: "Signup successful", user: newUser });
};

export const login = (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user)
    return res.status(401).json({ error: "Invalid credentials" });

  // Generate JWT token
  const token = jwt.sign(
    { id: user._id, username: user.username, isAdmin: user.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  res.status(200).json({ message: "Login successful", user, token });
};