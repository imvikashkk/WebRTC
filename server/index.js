import { Server } from "socket.io";
import express from "express";
import {createServer}  from "http"
import cors from "cors";

const app = express();

app.use(cors())
const server = createServer(app);

const port = process.env.PORT || 8000

const io = new Server(server, {
  cors: {
    allowedHeaders: true,
    exposedHeaders: "*",
    credentials: true,
    methods: ["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "PATCH"],
  },
});

const roomMap = new Map();
const socketIdToEmail = new Map();
const emailToRoom = new Map();
const emailToSocketId = new Map();

io.on("connection", (socket) => {
  console.log(`Socket Connected`, socket.id);

  socket.on("room:join", async (data) => {
    const { email, room } = data;
    const roomHas = roomMap.has(room);

    if (emailToRoom.has(email)) {
      io.to(socket.id).emit("already:joined", data);
    } else {
      if (roomHas) {
        const roomEntries = roomMap.get(room);
        if (roomEntries.length >= 2) {
          io.to(socket.id).emit("room:full", room);
        } else {
          roomMap.set(room, [...roomEntries, email]);
          emailToRoom.set(email, room);
          socketIdToEmail.set(socket.id, email);
          emailToSocketId.set(email, socket.id);
          socket.join(room);
          io.to(socket.id).emit("room:join", {you:data, other:{ email:roomEntries[0] , id: emailToSocketId.get(roomEntries[0])}});
          io.to(socket.id).emit("user:joined", );
          io.to(emailToSocketId.get(roomEntries[0])).emit("user:joined", { email:email , id: socket.id});
        }
      } else {
        roomMap.set(room, [email]);
        emailToRoom.set(email, room);
        socketIdToEmail.set(socket.id, email);
        emailToSocketId.set(email, socket.id);
        socket.join(room);
        io.to(socket.id).emit("room:join", {you:data, other:null});
      }
    }
  });

  socket.on("user:call", ({ to, offer, email }) => {
    io.to(to).emit("incomming:call", { from: socket.id, offer, email });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    // console.log("peer:nego:needed", offer);
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    // console.log("peer:nego:done", ans);
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected ID: " + socket.id);
    const isEmail = socketIdToEmail.has(socket.id);
    if (isEmail) {
      const userEmail = socketIdToEmail.get(socket.id);
      const userRoom = emailToRoom.get(userEmail);
      const usersInRoom = roomMap.get(userRoom);
      socketIdToEmail.delete(socket.id);
      emailToRoom.delete(userEmail);
      emailToSocketId.delete(userEmail);
      const newRoom = usersInRoom?.filter((item) => {
        return item !== userEmail;
      });
      if (newRoom.length === 0) {
        roomMap.delete(userRoom);
      } else {
        roomMap.set(userRoom, newRoom);
        io.to(emailToSocketId.get(newRoom[0])).emit("user:disconnected", { email:userEmail , id: socket.id});
      }
    }
  });
});


app.get("/", (req, res)=>{
  res.send("Welcome to WebSocket !!")
})


server.listen(port , ()=>{
  console.log("listening on port "+port)
})