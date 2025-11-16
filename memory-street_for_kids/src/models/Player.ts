
import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true 
  },
  email: {
    type: String,
    unique: true,
    sparse: true // Allows null/undefined for guest players
  },
  totalGames: { type: Number, default: 0 },
  totalWins: { type: Number, default: 0 },
  totalScore: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Player || mongoose.model('Player', playerSchema);