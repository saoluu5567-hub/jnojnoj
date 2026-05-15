require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");

const { PlayerDatabase, RoomDatabase, WorldDatabase } = require("./database");

// ======================================
// INITIALIZE
// ======================================

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// ======================================
// DATABASE INSTANCES
// ======================================

const playerDB = new PlayerDatabase();
const roomDB = new RoomDatabase();
const worldDB = new WorldDatabase();

// ======================================
// API ROUTES
// ======================================

// Test route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Get all online players
app.get("/api/players/online", (req, res) => {
  const onlinePlayers = playerDB.getOnlinePlayers();
  res.json({
    total: onlinePlayers.length,
    players: onlinePlayers,
  });
});

// Get all players
app.get("/api/players", (req, res) => {
  const allPlayers = playerDB.getAllPlayers();
  res.json({
    total: allPlayers.length,
    players: allPlayers,
  });
});

// Get player by ID
app.get("/api/players/:playerId", (req, res) => {
  const player = playerDB.getPlayer(req.params.playerId);
  if (player) {
    res.json(player);
  } else {
    res.status(404).json({ error: "Player not found" });
  }
});

// Get all rooms
app.get("/api/rooms", (req, res) => {
  const allRooms = roomDB.getAllRooms();
  res.json({
    total: allRooms.length,
    rooms: allRooms,
  });
});

// Get room by code
app.get("/api/rooms/:roomCode", (req, res) => {
  const room = roomDB.getRoom(req.params.roomCode);
  if (room) {
    res.json(room);
  } else {
    res.status(404).json({ error: "Room not found" });
  }
});

// Get all worlds
app.get("/api/worlds", (req, res) => {
  const allWorlds = worldDB.getAllWorlds();
  res.json({
    total: allWorlds.length,
    worlds: allWorlds,
  });
});

// Get world by ID
app.get("/api/worlds/:worldId", (req, res) => {
  const world = worldDB.getWorld(req.params.worldId);
  if (world) {
    res.json(world);
  } else {
    res.status(404).json({ error: "World not found" });
  }
});

// ======================================
// SOCKET REALTIME EVENTS
// ======================================

io.on("connection", (socket) => {
  console.log("🎮 Player Connected:", socket.id);

  // ===========================
  // PLAYER JOIN GAME
  // ===========================

  socket.on("player_join", (data) => {
    let player = playerDB.getPlayer(data.playerId);

    if (!player) {
      player = playerDB.createPlayer(data.username, data.avatar);
    }

    playerDB.setPlayerOnline(socket.id, player.playerId);

    console.log(`✅ Player Joined: ${player.username} (${player.playerId})`);

    socket.emit("join_success", player);

    // Broadcast online players update
    io.emit("admin_online_update", {
      total: playerDB.getOnlinePlayers().length,
      players: playerDB.getOnlinePlayers(),
    });

    socket.join(`player-${player.playerId}`);
  });

  // ===========================
  // PLAYER MOVE
  // ===========================

  socket.on("player_move", (data) => {
    const playerId = Array.from(playerDB.onlinePlayers.entries()).find(
      ([key]) => key === socket.id
    )?.[1];

    if (playerId) {
      const updatedPlayer = playerDB.updatePlayer(playerId, {
        x: data.x,
        y: data.y,
        world: data.world || "Grass Land",
      });

      io.emit("player_position_update", updatedPlayer);
    }
  });

  // ===========================
  // CREATE ROOM
  // ===========================

  socket.on("create_room", (data) => {
    const playerId = Array.from(playerDB.onlinePlayers.entries()).find(
      ([key]) => key === socket.id
    )?.[1];

    if (playerId) {
      const room = roomDB.createRoom(playerId, data.roomName || "Room");

      socket.join(room.roomCode);

      socket.emit("room_created", room);

      console.log(`🏠 Room Created: ${room.roomCode} by ${playerId}`);

      io.emit("room_list_update", roomDB.getAllRooms());
    }
  });

  // ===========================
  // JOIN ROOM
  // ===========================

  socket.on("join_room", (data) => {
    const playerId = Array.from(playerDB.onlinePlayers.entries()).find(
      ([key]) => key === socket.id
    )?.[1];

    if (playerId) {
      const room = roomDB.joinRoom(data.roomCode, playerId);

      if (room) {
        socket.join(room.roomCode);

        io.to(room.roomCode).emit("room_update", room);

        console.log(`➕ Player ${playerId} joined room ${data.roomCode}`);

        io.emit("room_list_update", roomDB.getAllRooms());
      } else {
        socket.emit("room_error", "Cannot join room - room full or not found");
      }
    }
  });

  // ===========================
  // LEAVE ROOM
  // ===========================

  socket.on("leave_room", (data) => {
    const playerId = Array.from(playerDB.onlinePlayers.entries()).find(
      ([key]) => key === socket.id
    )?.[1];

    if (playerId) {
      const room = roomDB.leaveRoom(data.roomCode, playerId);

      socket.leave(data.roomCode);

      if (room) {
        io.to(data.roomCode).emit("room_update", room);
      }

      console.log(`➖ Player ${playerId} left room ${data.roomCode}`);

      io.emit("room_list_update", roomDB.getAllRooms());
    }
  });

  // ===========================
  // ROOM CHAT
  // ===========================

  socket.on("room_chat", (data) => {
    io.to(data.roomCode).emit("new_chat", {
      username: data.username,
      message: data.message,
      timestamp: Date.now(),
    });
  });

  // ===========================
  // UPDATE PLAYER STATS
  // ===========================

  socket.on("update_stats", (data) => {
    const playerId = Array.from(playerDB.onlinePlayers.entries()).find(
      ([key]) => key === socket.id
    )?.[1];

    if (playerId) {
      const updatedPlayer = playerDB.updatePlayer(playerId, {
        level: data.level,
        coins: data.coins,
        exp: data.exp,
      });

      io.emit("player_stats_update", updatedPlayer);
    }
  });

  // ===========================
  // HEARTBEAT
  // ===========================

  socket.on("heartbeat", () => {
    const playerId = Array.from(playerDB.onlinePlayers.entries()).find(
      ([key]) => key === socket.id
    )?.[1];

    if (playerId) {
      playerDB.updatePlayer(playerId, {
        lastSeen: Date.now(),
      });
    }
  });

  // ===========================
  // DISCONNECT
  // ===========================

  socket.on("disconnect", () => {
    const playerId = Array.from(playerDB.onlinePlayers.entries()).find(
      ([key]) => key === socket.id
    )?.[1];

    if (playerId) {
      playerDB.setPlayerOffline(socket.id);
      console.log(`❌ Player Disconnected: ${playerId}`);

      io.emit("admin_online_update", {
        total: playerDB.getOnlinePlayers().length,
        players: playerDB.getOnlinePlayers(),
      });
    }
  });
});

// ======================================
// AUTO CLEANUP
// ======================================

setInterval(() => {
  const now = Date.now();

  playerDB.getOnlinePlayers().forEach((player) => {
    if (player.lastSeen && now - player.lastSeen > 30000) {
      playerDB.setPlayerOffline(
        Array.from(playerDB.onlinePlayers.entries()).find(
          ([, id]) => id === player.playerId
        )?.[0]
      );
    }
  });

  io.emit("admin_online_update", {
    total: playerDB.getOnlinePlayers().length,
    players: playerDB.getOnlinePlayers(),
  });
}, 5000);

// ======================================
// START SERVER
// ======================================

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`\n${"=".repeat(50)}`);
  console.log("🎮 CHIBI PET WORLD SERVER STARTED");
  console.log(`${"=".repeat(50)}`);
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`🎮 Game: http://localhost:${PORT}/game.html`);
  console.log(`👨‍💼 Admin: http://localhost:${PORT}/admin.html`);
  console.log(`${"=".repeat(50)}\n`);
});
