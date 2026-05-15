const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");

// ======================================
// DATABASE STORAGE
// ======================================

const DATA_DIR = path.join(__dirname, "data");
const PLAYERS_FILE = path.join(DATA_DIR, "players.json");
const ROOMS_FILE = path.join(DATA_DIR, "rooms.json");
const WORLDS_FILE = path.join(DATA_DIR, "worlds.json");

// Create data directory if not exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// ======================================
// PLAYER DATABASE
// ======================================

class PlayerDatabase {
  constructor() {
    this.players = this.loadPlayers();
    this.onlinePlayers = {};
  }

  loadPlayers() {
    if (fs.existsSync(PLAYERS_FILE)) {
      const data = fs.readFileSync(PLAYERS_FILE, "utf-8");
      return JSON.parse(data);
    }
    return {};
  }

  savePlayers() {
    fs.writeFileSync(PLAYERS_FILE, JSON.stringify(this.players, null, 2));
  }

  createPlayer(username, avatar = "default.png") {
    const playerId = uuidv4();
    const player = {
      playerId,
      username,
      avatar,
      level: 1,
      coins: 0,
      exp: 0,
      world: "Grass Land",
      x: 0,
      y: 0,
      inventory: [],
      pets: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.players[playerId] = player;
    this.savePlayers();
    return player;
  }

  getPlayer(playerId) {
    return this.players[playerId];
  }

  updatePlayer(playerId, updates) {
    if (this.players[playerId]) {
      this.players[playerId] = {
        ...this.players[playerId],
        ...updates,
        updatedAt: Date.now(),
      };
      this.savePlayers();
      return this.players[playerId];
    }
    return null;
  }

  deletePlayer(playerId) {
    delete this.players[playerId];
    this.savePlayers();
  }

  getAllPlayers() {
    return Object.values(this.players);
  }

  setPlayerOnline(socketId, playerId) {
    this.onlinePlayers[socketId] = playerId;
  }

  setPlayerOffline(socketId) {
    delete this.onlinePlayers[socketId];
  }

  getOnlinePlayerIds() {
    return Object.values(this.onlinePlayers);
  }

  getOnlinePlayers() {
    return Object.values(this.onlinePlayers).map((id) => this.players[id]);
  }
}

// ======================================
// ROOM DATABASE
// ======================================

class RoomDatabase {
  constructor() {
    this.rooms = this.loadRooms();
  }

  loadRooms() {
    if (fs.existsSync(ROOMS_FILE)) {
      const data = fs.readFileSync(ROOMS_FILE, "utf-8");
      return JSON.parse(data);
    }
    return {};
  }

  saveRooms() {
    fs.writeFileSync(ROOMS_FILE, JSON.stringify(this.rooms, null, 2));
  }

  createRoom(hostId, roomName = "Room") {
    const roomCode = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

    const room = {
      roomCode,
      roomName,
      hostId,
      players: [hostId],
      maxPlayers: 4,
      status: "waiting",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.rooms[roomCode] = room;
    this.saveRooms();
    return room;
  }

  getRoom(roomCode) {
    return this.rooms[roomCode];
  }

  joinRoom(roomCode, playerId) {
    const room = this.rooms[roomCode];
    if (room && room.players.length < room.maxPlayers) {
      if (!room.players.includes(playerId)) {
        room.players.push(playerId);
        room.updatedAt = Date.now();
        this.saveRooms();
        return room;
      }
    }
    return null;
  }

  leaveRoom(roomCode, playerId) {
    const room = this.rooms[roomCode];
    if (room) {
      room.players = room.players.filter((id) => id !== playerId);
      room.updatedAt = Date.now();

      if (room.players.length === 0) {
        delete this.rooms[roomCode];
      } else if (room.hostId === playerId) {
        room.hostId = room.players[0];
      }

      this.saveRooms();
      return room;
    }
    return null;
  }

  getAllRooms() {
    return Object.values(this.rooms);
  }

  deleteRoom(roomCode) {
    delete this.rooms[roomCode];
    this.saveRooms();
  }
}

// ======================================
// WORLD DATABASE
// ======================================

class WorldDatabase {
  constructor() {
    this.worlds = this.loadWorlds();
  }

  loadWorlds() {
    if (fs.existsSync(WORLDS_FILE)) {
      const data = fs.readFileSync(WORLDS_FILE, "utf-8");
      return JSON.parse(data);
    }

    // Default worlds
    return {
      "grass-land": {
        id: "grass-land",
        name: "Grass Land",
        description: "A peaceful green world",
        npc: [
          {
            id: "npc-1",
            name: "Elder Oak",
            x: 100,
            y: 100,
            dialogue: "Welcome to Grass Land!",
          },
        ],
        items: [
          {
            id: "item-1",
            name: "Apple",
            x: 200,
            y: 150,
            quantity: 5,
          },
        ],
      },
      "candy-world": {
        id: "candy-world",
        name: "Candy World",
        description: "A sweet and colorful world",
        npc: [
          {
            id: "npc-2",
            name: "Sweet Shop Owner",
            x: 150,
            y: 120,
            dialogue: "Come buy some candies!",
          },
        ],
        items: [
          {
            id: "item-2",
            name: "Lollipop",
            x: 180,
            y: 180,
            quantity: 10,
          },
        ],
      },
    };
  }

  saveWorlds() {
    fs.writeFileSync(WORLDS_FILE, JSON.stringify(this.worlds, null, 2));
  }

  getWorld(worldId) {
    return this.worlds[worldId];
  }

  getAllWorlds() {
    return Object.values(this.worlds);
  }

  updateWorld(worldId, updates) {
    if (this.worlds[worldId]) {
      this.worlds[worldId] = {
        ...this.worlds[worldId],
        ...updates,
      };
      this.saveWorlds();
      return this.worlds[worldId];
    }
    return null;
  }
}

// ======================================
// EXPORT
// ======================================

module.exports = {
  PlayerDatabase,
  RoomDatabase,
  WorldDatabase,
};
