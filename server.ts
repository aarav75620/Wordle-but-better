import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORDS = {
  easy: ["CAKE", "BIRD", "FISH", "TREE", "BLUE", "FIRE", "WIND", "SNOW", "MOON", "STAR"],
  medium: ["APPLE", "BREAD", "CHAIR", "DREAM", "EARTH", "FLAME", "GRAPE", "HEART", "LIGHT", "MUSIC"],
  hard: ["BANANA", "COFFEE", "DRAGON", "FLOWER", "GARDEN", "HAMMER", "ISLAND", "JUNGLE", "KITTEN", "LEMON"]
};

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // Game state in memory for quick access, but synced with Firestore if needed
  const rooms: Record<string, any> = {};

  const getDailyWord = (difficulty: string) => {
    const date = new Date().toISOString().split('T')[0];
    let hash = 0;
    for (let i = 0; i < date.length; i++) {
      hash = ((hash << 5) - hash) + date.charCodeAt(i);
      hash |= 0;
    }
    const words = WORDS[difficulty as keyof typeof WORDS];
    return words[Math.abs(hash) % words.length];
  };

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-room", ({ roomId, user, mode, difficulty, isRanked, isSingleplayer }) => {
      socket.join(roomId);
      
      if (!rooms[roomId]) {
        const targetWord = mode === 'daily' 
          ? getDailyWord(difficulty) 
          : WORDS[difficulty as keyof typeof WORDS][Math.floor(Math.random() * WORDS[difficulty as keyof typeof WORDS].length)];

        rooms[roomId] = {
          roomId,
          mode,
          difficulty,
          isRanked: !!isRanked,
          isSingleplayer: !!isSingleplayer || mode === 'daily' || mode === 'free',
          status: "waiting",
          players: [],
          targetWord,
          startTime: null,
          hintRequests: [] // Track who requested a hint
        };
      }

      const player = {
        id: socket.id,
        uid: user.uid,
        username: user.username,
        progress: [],
        isReady: isSingleplayer ? true : false,
        finished: false,
        guesses: 0,
        time: 0
      };

      rooms[roomId].players.push(player);

      if (isSingleplayer) {
        rooms[roomId].status = "playing";
        rooms[roomId].startTime = Date.now();
        socket.emit("game-start", rooms[roomId]);
      } else {
        io.to(roomId).emit("room-update", rooms[roomId]);
      }
    });

    socket.on("request-hint", ({ roomId }) => {
      const room = rooms[roomId];
      if (!room || room.status !== "playing") return;

      if (!room.hintRequests.includes(socket.id)) {
        room.hintRequests.push(socket.id);
      }

      const allRequested = room.players.every((p: any) => room.hintRequests.includes(p.id));
      if (allRequested || room.isSingleplayer) {
        io.to(roomId).emit("hint-approved", { approved: true });
        room.hintRequests = []; // Reset for next hint
      } else {
        io.to(roomId).emit("room-update", room);
      }
    });

    socket.on("player-ready", ({ roomId }) => {
      const room = rooms[roomId];
      if (!room) return;

      const player = room.players.find((p: any) => p.id === socket.id);
      if (player) {
        player.isReady = true;
      }

      const allReady = room.players.every((p: any) => p.isReady);
      if (allReady && room.players.length >= (room.mode === "1v1" ? 2 : 1)) {
        room.status = "playing";
        room.startTime = Date.now();
        io.to(roomId).emit("game-start", room);
      } else {
        io.to(roomId).emit("room-update", room);
      }
    });

    socket.on("submit-guess", ({ roomId, guess, feedback }) => {
      const room = rooms[roomId];
      if (!room || room.status !== "playing") return;

      const player = room.players.find((p: any) => p.id === socket.id);
      if (player) {
        player.progress.push(feedback);
        player.guesses++;
        
        const isCorrect = feedback.every((f: any) => f.status === "correct");
        if (isCorrect) {
          player.finished = true;
          player.time = (Date.now() - room.startTime) / 1000;
          
          if (room.mode === "1v1" || room.mode === "coop") {
            room.status = "finished";
            room.winner = player.username;
            io.to(roomId).emit("game-over", room);
          }
        } else if (player.guesses >= 6) {
          player.finished = true;
          player.time = (Date.now() - room.startTime) / 1000;
          
          const allFinished = room.players.every((p: any) => p.finished);
          if (allFinished) {
            room.status = "finished";
            io.to(roomId).emit("game-over", room);
          }
        }
        
        io.to(roomId).emit("room-update", room);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      for (const roomId in rooms) {
        const room = rooms[roomId];
        const playerIndex = room.players.findIndex((p: any) => p.id === socket.id);
        if (playerIndex !== -1) {
          room.players.splice(playerIndex, 1);
          if (room.players.length === 0) {
            delete rooms[roomId];
          } else {
            io.to(roomId).emit("room-update", room);
          }
        }
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
