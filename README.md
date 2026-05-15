# 🎮 Chibi Pet World - Real-time Multiplayer Game

A full-featured real-time multiplayer online game system built with Node.js, Express, and Socket.io

## Features

✅ **Real-time Multiplayer**
- Live player position updates
- Multiple players in the same world
- Real-time chat system

✅ **Game Rooms**
- Create custom game rooms
- Join existing rooms with room codes
- Support for 1-4 players per room

✅ **Player Management**
- Persistent player database
- Player profiles with stats (level, coins, exp)
- Multiple worlds to explore
- Position tracking

✅ **Admin Panel**
- Monitor all online players
- View player statistics
- Track active rooms
- Real-time updates

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm

### Setup

1. Clone the repository
```bash
git clone https://github.com/saoluu5567-hub/jnojnoj.git
cd jnojnoj
```

2. Install dependencies
```bash
npm install
```

3. Create .env file (optional)
```bash
PORT=3000
NODE_ENV=development
```

4. Start the server
```bash
npm start
```

Or with auto-reload during development:
```bash
npm run dev
```

## Usage

### Access the Game

1. **Game**: Open http://localhost:3000/game.html
2. **Admin Panel**: Open http://localhost:3000/admin.html
3. **Home**: Open http://localhost:3000

### How to Play

1. Enter your username and choose an avatar
2. Click "Start Game"
3. Move around using:
   - **WASD** keys
   - **Arrow keys**
   - **Click** to move to position
4. Create or join rooms to play with other players
5. Chat with other players in the room

### API Endpoints

#### Players
- `GET /api/players` - Get all players
- `GET /api/players/:playerId` - Get specific player
- `GET /api/players/online` - Get online players

#### Rooms
- `GET /api/rooms` - Get all rooms
- `GET /api/rooms/:roomCode` - Get specific room

#### Worlds
- `GET /api/worlds` - Get all worlds
- `GET /api/worlds/:worldId` - Get specific world

## Socket.io Events

### Client to Server

```javascript
// Player joins game
socket.emit('player_join', {
  username: 'PlayerName',
  avatar: '🐱',
  level: 1,
  coins: 0
});

// Player moves
socket.emit('player_move', {
  x: 100,
  y: 150,
  world: 'Grass Land'
});

// Create room
socket.emit('create_room', {
  roomName: 'My Room'
});

// Join room
socket.emit('join_room', {
  roomCode: 'ABC123'
});

// Leave room
socket.emit('leave_room', {
  roomCode: 'ABC123'
});

// Send chat message
socket.emit('room_chat', {
  roomCode: 'ABC123',
  username: 'PlayerName',
  message: 'Hello!'
});

// Update player stats
socket.emit('update_stats', {
  level: 5,
  coins: 1000,
  exp: 500
});

// Heartbeat (keep-alive)
socket.emit('heartbeat');
```

### Server to Client

```javascript
// Join successful
socket.on('join_success', (player) => {
  console.log('Joined:', player);
});

// Player position updated
socket.on('player_position_update', (player) => {
  console.log('Position:', player.x, player.y);
});

// Online players list
socket.on('admin_online_update', (data) => {
  console.log('Online:', data.total);
});

// Room created
socket.on('room_created', (room) => {
  console.log('Room code:', room.roomCode);
});

// Room updated
socket.on('room_update', (room) => {
  console.log('Room:', room);
});

// Chat message
socket.on('new_chat', (data) => {
  console.log(`${data.username}: ${data.message}`);
});

// Error
socket.on('room_error', (error) => {
  console.error(error);
});
```

## File Structure

```
jnojnoj/
├── server.js              # Main server file
├── database.js            # Database management
├── package.json           # Dependencies
├── .env                   # Environment variables
├── .gitignore             # Git ignore file
├── public/
│   ├── index.html         # Home page
│   ├── game.html          # Game interface
│   ├── admin.html         # Admin panel
├── data/                  # Data storage
│   ├── players.json       # Player database
│   ├── rooms.json         # Rooms database
│   └── worlds.json        # Worlds database
└── README.md              # This file
```

## Database

Data is stored in JSON files in the `data/` directory:

### players.json
```json
{
  "uuid": {
    "playerId": "uuid",
    "username": "PlayerName",
    "avatar": "🐱",
    "level": 1,
    "coins": 0,
    "exp": 0,
    "world": "Grass Land",
    "x": 0,
    "y": 0,
    "createdAt": 1234567890,
    "updatedAt": 1234567890
  }
}
```

### rooms.json
```json
{
  "ABC123": {
    "roomCode": "ABC123",
    "roomName": "My Room",
    "hostId": "host-uuid",
    "players": ["uuid1", "uuid2"],
    "maxPlayers": 4,
    "status": "waiting",
    "createdAt": 1234567890,
    "updatedAt": 1234567890
  }
}
```

## Performance

- Auto-cleanup of inactive players after 30 seconds
- Real-time updates via WebSocket
- Efficient JSON file storage
- Automatic player removal on disconnect

## Security Notes

This is a demo/learning project. For production:

- Add authentication (JWT, OAuth)
- Use a proper database (MongoDB, PostgreSQL)
- Validate all input data
- Implement rate limiting
- Add HTTPS
- Implement proper error handling

## Troubleshooting

### Port already in use
```bash
# Change port in .env file
PORT=3001
```

### Cannot connect to server
- Make sure server is running: `npm start`
- Check if port 3000 is accessible
- Check browser console for errors

### Player data not saving
- Check if `data/` directory exists and is writable
- Check file permissions

## License

MIT

## Author

saoluu5567-hub

## Support

For issues and questions, please visit: https://github.com/saoluu5567-hub/jnojnoj/issues
