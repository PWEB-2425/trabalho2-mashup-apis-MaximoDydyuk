require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// 1. Trust proxy
app.set('trust proxy', 1);

// 2. Origens permitidas para CORS
const allowedOrigins = [
  'http://localhost:3000',
  'https://trabalho2-mashup-apis-maximo-dydyuk-nine.vercel.app',
  'https://trabalho2-mashup-apis-maximodydyuk-7wtj.onrender.com'
];

// 3. Middleware de CORS (CORRIGIDO)
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) {
      console.log('CORS: Pedido sem origem permitido');
      return callback(null, true);
    } // ✅ CHAVE ADICIONADA
    
    if (allowedOrigins.includes(origin)) {
      console.log(`CORS: Origem permitida: ${origin}`);
      return callback(null, true);
    } else {
      console.log(`CORS BLOQUEADO: ${origin} não permitido`);
      return callback(new Error('Origem não permitida pelo CORS'), false);
    } // ✅ CHAVE ADICIONADA
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 4. Middlewares para JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Configuração da sessão
app.use(session({
  secret: process.env.SESSION_SECRET || 'chave_secreta_aleatoria',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 24 * 60 * 60
  }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    domain: '.onrender.com'
  }
}));

// 6. Passport.js
require('./config/passport-config');
app.use(passport.initialize());
app.use(passport.session());

// 7. Debug de sessão
app.use((req, res, next) => {
  console.log('--- NOVO PEDIDO ---');
  console.log('Data:', new Date().toISOString());
  console.log('Método:', req.method, '| URL:', req.originalUrl);
  console.log('SessionID:', req.sessionID);
  console.log('Cookies recebidos:', req.headers.cookie);
  console.log('Utilizador autenticado:', req.isAuthenticated ? req.isAuthenticated() : false);
  console.log('req.user:', req.user);
  next();
});

// 8. Rotas (SEM duplicações)
const authRoutes = require('./routes/authRoutes');
const apiRoutes = require('./routes/apiRoutes');
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes); // ✅ Usa as rotas reais do apiRoutes.js

// 9. Rota de status
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    app: 'API Mashup',
    ambiente: process.env.NODE_ENV || 'development',
    data_hora: new Date().toISOString(),
    base_de_dados: mongoose.connection.readyState === 1 ? 'ligada' : 'desligada'
  });
});

// 10. Rota principal
app.get('/', (req, res) => {
  res.redirect('/status');
});

// 11. Middleware 404
app.use((req, res) => {
  res.status(404).json({
    erro: 'Rota não encontrada',
    caminho: req.originalUrl,
    método: req.method
  });
});

// 12. Middleware de erros
app.use((err, req, res, next) => {
  console.error('ERRO GLOBAL:', err.stack);
  const respostaErro = {
    erro: {
      mensagem: err.message || 'Erro interno no servidor',
      tipo: err.name || 'ErroInternoServidor',
      estado: err.status || 500
    }
  };
  if (process.env.NODE_ENV === 'development') {
    respostaErro.erro.stack = err.stack;
  }
  res.status(respostaErro.erro.estado).json(respostaErro);
});

// 13. Conexão MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB conectado');
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`🚀 Servidor na porta ${PORT}`);
      console.log('🍪 Cookies: secure=true, sameSite=none');
    });

    const shutdown = () => {
      console.log('🛑 Encerrando servidor...');
      server.close(() => {
        mongoose.connection.close(() => {
          console.log('🔌 Conexões encerradas');
          process.exit(0);
        });
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  })
  .catch(err => {
    console.error('❌ Erro MongoDB:', err.message);
    process.exit(1);
  });
