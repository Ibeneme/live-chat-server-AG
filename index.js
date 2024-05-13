const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const userRoutes = require("./router/userRouter");
const messageRoutes = require("./router/messageRouter");
const User = require("./models/users");
const Message = require("./models/messages");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB connection
const dbURI =
  "mongodb+srv://ikennaibenemee:maTM2K5bSleR3uJ3@main.rylexnv.mongodb.net/?retryWrites=true&w=majority&appName=Main";

mongoose
  .connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to MongoDB");
    startServer();
  })
  .catch((err) => console.error("Error connecting to MongoDB:", err));

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
  },
});

app.use("/", userRoutes);
app.use("/", messageRoutes);
// Map to keep track of which users are typing in each room
const typingUsers = new Map();

io.on("connection", async (socket) => {
  console.log("A user connected");
  const users = await User.find(
    {},
    "_id email lastMessage seen updated_at fullName"
  ).sort({ updated_at: -1 }); // Sort by updated_at in descending order (most recent first)
  const userData = users.map((user) => ({
    _id: user._id,
    email: user.email,
    fullName: user?.fullName,
    lastMessage: user.lastMessage, // Assuming you have a lastMessage field in your user schema
    updated_at: user.updated_at, // Assuming you have an updated_at field in your user schema
    seen: user.seen, // Assuming you have a seen field in your user schema
  }));
  io.emit("userData", userData); // Emit user data to everyone

  socket.on("joinRoom", async (groupUniqueID) => {
    socket.join(groupUniqueID);
    console.log(`User ${groupUniqueID} joined room ${groupUniqueID}`);

    try {
      const users = await User.find(
        {},
        "_id email lastMessage seen updated_at fullName"
      ).sort({ updated_at: -1 }); /// Fetch all users with only _id and email fields
      const userData = users.map((user) => ({
        _id: user._id,
        email: user.email,
        fullName: user?.fullName,
        lastMessage: user.lastMessage, // Assuming you have a lastMessage field in your user schema
        updated_at: user.updated_at, // Assuming you have an updated_at field in your user schema
        seen: user.seen, // Assuming you have a seen field in your user schema
      }));
      io.emit("userData", userData); // Emit user data to everyone
      typingUsers.set(groupUniqueID, new Set());

      console.log("Map of connected users and their rooms:", userData);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  });

  socket.on("typing", (userId) => {
    console.log(userId, "dduserId");
    socket.to(userId).emit("isTyping", userId);
  });

  socket.on("stoppedTyping", (room, userId) => {
    socket.to(userId).emit("stoppedTyping", userId);
  });

  socket.on("messages", async (groupUniqueID, message, name) => {
    console.log(groupUniqueID, "groupUniqueIDssss", message);
    try {
      console.log("Message received:", message, name);

      const user = await User.findById(groupUniqueID); // Find user by ID
      if (!user) {
        console.log("User not found with ID:", groupUniqueID);
        return;
      }

      const senderEmail = user.email; // Use user's email as senderEmail

      const room = groupUniqueID;
      console.log(message, "roomroom", senderEmail);

      messageArray = {
        message: message,
        senderEmail: senderEmail,
      };
      if (room) {
        //io.to(room).emit("message", messageArray);
        console.log("Message sent to room", room);

        // Save the message to the message schema
        const newMessage = new Message({
          groupId: groupUniqueID,
          senderEmail: name,
          timeSent: new Date(),
          message: message,
        });
        await newMessage.save();

        // Update the `seen` field of the user to false
        await User.findOneAndUpdate(
          { _id: groupUniqueID },
          { seen: false },
          { lastMessage: message },
          { new: true }
        );
        io.emit('message', newMessage)
        io.emit("userDataAgain", user);
        console.log("User's seen status updated to newMessage", newMessage);
      } else {
        console.log("User is not in any room.");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");

    for (const [room, typingUsersSet] of typingUsers.entries()) {
      if (typingUsersSet.has(socket.id)) {
        typingUsersSet.delete(socket.id);
        io.to(room).emit("stoppedTyping", socket.id);
        break;
      }
    }

    console.log("Map of connected users and their rooms:", typingUsers);
  });
});

const PORT = process.env.PORT || 3000;

function startServer() {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
