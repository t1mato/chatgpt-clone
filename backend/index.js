import "dotenv/config";
import express from "express";
import cors from "cors";
import ImageKit from "imagekit";
import mongoose from "mongoose";
import Chat from "./models/chat.js";
import UserChats from "./models/userChats.js";
import { requireAuth, getAuth } from "@clerk/express";

const port = process.env.PORT || 3000;
const app = express();

// Configure CORS to allow requests from the client app
app.use(
    cors({
      origin: process.env.CLIENT_URL, // http://localhost:5173
      credentials: true,
    })
);

// Parse incoming JSON request bodies
app.use(express.json())

// Establish MongoDB connection
const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.log(error)
  }
}

// Initialize ImageKit SDK for image uploads/authentication
const imagekit = new ImageKit({
    urlEndpoint: process.env.IMAGE_KIT_ENDPOINT,   
    publicKey: process.env.IMAGE_KIT_PUBLIC_KEY,    
    privateKey: process.env.IMAGE_KIT_PRIVATE_KEY,   
});

// Route: Returns ImageKit authentication parameters for client-side uploads
app.get("/api/upload", (req, res) => {
    const result = imagekit.getAuthenticationParameters();
    res.json(result);
});

// Route: Create a new chat and associate it with the user's chat list
app.post("/api/chats", requireAuth(), async (req, res) => {
    const { userId } = getAuth(req)
    const { text } = req.body;
    
    try {
      // 1. Create and save a new chat document
      const newChat = new Chat({
        userId: userId,
        history: [{ role: "user", parts: [{text}] }],
      });
      const savedChat = await newChat.save()

      // 2. Check if a UserChats document exists for the user
      const userChats = await UserChats.findOne({ userId: userId });

      if(!userChats) {
        // 3a. If none exists, create a new UserChats document
        const newUserChats = new UserChats({
          userId: userId,
          chats: [
            {
              _id: savedChat.id,
              title: text.substring(0, 40), // Use first 40 chars as chat title
            },
          ],
        });

        await newUserChats.save();

      } else {
        // 3b. Otherwise, append the new chat to the existing user's chat list
        await UserChats.updateOne({userId: userId}, {
            $push: {
              chats:{
                _id: savedChat._id,
                title: text.substring(0, 40),
              },
            },
        });

        // 4. Return the newly created chat ID
        res.status(201).send(newChat._id);
      }
    } catch (error) {
      console.log(error)
      res.status(500).send("Error creating chat!")
    }
});

// Start the server and connect to the database
app.listen(port, () => {
  connect()
  console.log(`Server running on ${port}`);
});
