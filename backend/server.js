require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// 1. Trust proxy obrigatório
app.set('trust proxy', 1);

// 2. Origens permitidas (domínio EXATO do Vercel)
const allowedOrigins = [
  'http://localhost:3000',
  'https://trabalho2-mashup-apis-maximo-dydyuk-nine.vercel.app'
];

// 3. CORS configurado especificamente para cookies cross-origin
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Origem não permitida pelo CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie']
}));

// 4. Middleware para OPTIONS preflight
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    res.sendStatus(200);
  } else {
    next();
  }
});

// 5. Middlewares para JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 6. Configuração de sessão OTIMIZADA para cross-origin
app.use(session({
  secret: process.env.SESSION_SECRET || 'chave_secreta_muito_forte',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 24 * 60 * 60
  }),
  name: 'sessionId', // Nome específico
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    // NÃO definir domain para evitar conflitos
  }
}));

// 7. Passport.js
require('./config/passport-config');
app.use(passport.initialize());
app.use(passport.session());

// 8. Debug detalhado
app.use((req, res, next) => {
  console.log('--- PEDIDO ---');
  console.log('Origin:', req.headers.origin);
  console.log('Method:', req.method);
  console.log('URL:', req.originalUrl);
  console.log('Cookies:', req.headers.cookie);
  console.log('SessionID:', req.sessionID);
  console.log('Authenticated:', req.isAuthenticated ? req.isAuthenticated() : false);
  next();
});

// 9. Middleware para forçar headers CORS em todas as respostas
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  next();
});

// 10. Rotas
const authRoutes = require('./routes/authRoutes');
const apiRoutes = require('./routes/apiRoutes');
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

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
