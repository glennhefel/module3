import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import usersRouter from './routes/users.js';
import mediaRouter from './routes/media.js';
import ratingRoutes from './routes/ratings.js';
import authRoutes from "./routes/auth.js";
import discussionsRouter from './routes/discussions.js';
import assistantRouter from './routes/assistant.js';
import adminRouter from './routes/admin.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

const uri = process.env.ATLAS_URI;
mongoose.connect(uri);

const connection = mongoose.connection;
connection.once('open', () => {
    console.log("MongoDB database connection established successfully");
});


app.use('/users', usersRouter);
app.use('/media', mediaRouter);
app.use('/ratings', ratingRoutes);
app.use("/auth", authRoutes);
app.use('/media', discussionsRouter);
app.use('/ai', assistantRouter);
app.use('/admin', adminRouter);
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
