require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Configuração do CORS
const allowedOrigins = [
  'http://localhost:3000',
  'https://trab2maximodydyuk.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir solicitações sem 'origin'
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Origem não permitida por CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
  }));

// Middlewares - Aumentar o limite para JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configuração de sessão
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret_key_aleatoria',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGODB_URI,
    ttl: 24 * 60 * 60 // 1 dia
  }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 1 dia
    httpOnly: true,
    secure: true,         
    sameSite: 'none'         // ESSENCIAL pra cookies cross-site funcionarem
  }
}));


// Passport
require('./config/passport-config');
app.use(passport.initialize());
app.use(passport.session());

// Middleware para logs de requisição
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.originalUrl}`);
  next();
});

// Middleware para definir headers de conteúdo
app.use((req, res, next) => {
  res.header('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Rotas
const authRoutes = require('./routes/authRoutes');
const apiRoutes = require('./routes/apiRoutes');
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// Servir arquivos estáticos (se necessário)
app.use(express.static(path.join(__dirname, 'public')));


// Rota de status
app.get('/status', (req, res) => {
  res.json({ 
    status: 'online',
    app: 'API Mashup',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.get('/', (req, res) => {
  res.redirect('/status'); // Ou servir o frontend
});

// Middleware para tratamento de erros 404
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Rota não encontrada',
    path: req.originalUrl,
    method: req.method
  });
});

// Middleware global de tratamento de erros
app.use((err, req, res, next) => {
  console.error(' ERRO:', err.stack);
  
  // Formata resposta de erro
  const errorResponse = {
    error: {
      message: err.message || 'Erro interno no servidor',
      type: err.name || 'InternalServerError',
      status: err.status || 500
    }
  };
  
  // Adiciona stack trace apenas em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
  }
  
  res.status(errorResponse.error.status).json(errorResponse);
});

// Iniciar servidor APÓS conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log(' Conectado ao MongoDB');
    
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`\n Servidor rodando na porta ${PORT}`);
      console.log(` Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(` URL: http://localhost:${PORT}`);
      console.log(` Database: ${mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado'}`);
    });

    // Gerenciamento de encerramento
    process.on('SIGINT', () => {
      console.log('\n Recebido SIGINT. Encerrando servidor...');
      server.close(() => {
        mongoose.connection.close(false, () => {
          console.log(' Conexões encerradas');
          process.exit(0);
        });
      });
    });

    process.on('SIGTERM', () => {
      console.log('\n Recebido SIGTERM. Encerrando servidor...');
      server.close(() => {
        mongoose.connection.close(false, () => {
          console.log(' Conexões encerradas');
          process.exit(0);
        });
      });
    });
  })
  .catch(err => {
    console.error(' Erro no MongoDB:', err.message);
    console.error(' Verifique sua string de conexão MONGODB_URI no arquivo .env');
    process.exit(1);
  });
