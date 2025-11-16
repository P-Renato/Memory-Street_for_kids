
import mongoose from 'mongoose';

const gameSessionSchema = new mongoose.Schema({
  sessionId: { 
    type: String, 
    unique: true,
    default: () => Math.random().toString(36).substr(2, 9)
  },
  players: [{
    playerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Player',
      required: true 
    },
    playerName: String, // Cache for quick access
    score: { type: Number, default: 0 },
    matchesFound: { type: Number, default: 0 },
    turnsTaken: { type: Number, default: 0 }
  }],
  gameState: {
    cards: [{
      id: Number,
      value: String,
      isFlipped: Boolean,
      isMatched: Boolean
    }],
    currentTurn: { type: Number, default: 0 }, // Index of current player
    isCompleted: { type: Boolean, default: false }
  },
  winner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Player' 
  },
  maxScore: Number,
  startedAt: { type: Date, default: Date.now },
  completedAt: Date,
  duration: Number // in seconds
}, { timestamps: true });

export default mongoose.models.GameSession || mongoose.model('GameSession', gameSessionSchema);