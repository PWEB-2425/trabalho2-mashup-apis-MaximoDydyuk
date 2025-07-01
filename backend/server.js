require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// CORS: Domínios permitidos
const allowedOrigins = [
  'http://localhost:3000',
  'https://trab2maximodydyuk.vercel.app',
  'https://trabalho2-mashup-apis-maximodydyuk-r1fm.onrender.com',
  'https://trabalho2-mashup-apis-maximodydyuk-7wtj.onrender.com'
];

// Configura CORS
app.use(cors({
  origin: function(origin, callback) {
    // Permite chamadas sem origin (ex: Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('CORS não permitido'));
  },
  credentials: true
}));

// Parsers JSON e URL-encoded com limite aumentado
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configuração de sessão com MongoDB
app.use(session({
  secret: process.env.SESSION_SECRET || 'uma_chave_qualquer_secreta',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 24 * 60 * 60 // 1 dia em segundos
  }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 1 dia em ms
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// Teste simples de sessão
app.post('/login', (req, res) => {
  req.session.user = { id: 'usuario123' };
  res.json({ message: 'Login ok' });
});

app.get('/check', (req, res) => {
  if (req.session.user) {
    res.json({ logged: true, user: req.session.user });
  } else {
    res.status(401).json({ logged: false });
  }
});

// Serve frontend estático
app.use(express.static(path.join(__dirname, 'frontend')));

// Redireciona qualquer rota não-API para frontend (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Passport (autenticação)
require('./config/passport-config');
app.use(passport.initialize());
app.use(passport.session());

// Middleware para logs de requisição
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.originalUrl}`);
  next();
});

// Define Content-Type JSON para todas as respostas
app.use((req, res, next) => {
  res.header('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Rotas da API
const authRoutes = require('./routes/authRoutes');
const apiRoutes = require('./routes/apiRoutes');
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// Rota status para monitorar saúde da API
app.get('/status', (req, res) => {
  res.json({ 
    status: 'online',
    app: 'API Mashup',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Rota raiz redireciona para status
app.get('/', (req, res) => {
  res.redirect('/status');
});

// Middleware para 404
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Rota não encontrada',
    path: req.originalUrl,
    method: req.method
  });
});

// Middleware global de erro
app.use((err, req, res, next) => {
  console.error('ERRO:', err.stack);

  const errorResponse = {
    error: {
      message: err.message || 'Erro interno no servidor',
      type: err.name || 'InternalServerError',
      status: err.status || 500
    }
  };

  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
  }

  res.status(errorResponse.error.status).json(errorResponse);
});

// Conecta ao MongoDB e inicia servidor
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Conectado ao MongoDB');

    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
      console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Database: ${mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado'}`);
    });

    // Tratamento de encerramento gracioso
    process.on('SIGINT', () => {
      console.log('Recebido SIGINT. Encerrando servidor...');
      server.close(() => {
        mongoose.connection.close(false, () => {
          console.log('Conexões encerradas');
          process.exit(0);
        });
      });
    });

    process.on('SIGTERM', () => {
      console.log('Recebido SIGTERM. Encerrando servidor...');
      server.close(() => {
        mongoose.connection.close(false, () => {
          console.log('Conexões encerradas');
          process.exit(0);
        });
      });
    });
  })
  .catch(err => {
    console.error('Erro no MongoDB:', err.message);
    console.error('Verifique sua string de conexão MONGODB_URI no arquivo .env');
    process.exit(1);
  });
