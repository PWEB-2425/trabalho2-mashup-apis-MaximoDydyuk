const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const searchSchema = new mongoose.Schema({
  term: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['city', 'image'],
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  // Dados específicos para pesquisa de cidade
  weather: {
    temp: Number,
    description: String,
    icon: String
  },
  country: {
    name: String,
    capital: String
  },
  // Dados específicos para pesquisa de imagem
  imageData: {
    count: Number,
    firstImage: String
  }
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  searches: [searchSchema]
});

// Hash da senha antes de salvar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('User', userSchema);