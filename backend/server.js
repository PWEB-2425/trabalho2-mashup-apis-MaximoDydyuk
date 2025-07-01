require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// 1. Configuração do CORS corrigida
const allowedOrigins = [
  'http://localhost:3000',
  'https://trabalho2-mashup-apis-maximodydyuk-r1fm.onrender.com',
  'https://trab2maximodydyuk.vercel.app' // ADICIONEI SEU DOMÍNIO DO VERCEL
];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir solicitações sem 'origin' (como apps mobile)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`Origem bloqueada: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 2. IMPORTANTE: Habilitar pré-vio CORS para todas as rotas
app.options('*', cors());

// Middlewares - Aumentar o limite para JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3. Configuração de sessão corrigida
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
    secure: process.env.NODE_ENV === 'production', // TRUE em produção
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// Passport
require('./config/passport-config');
app.use(passport.initialize());
app.use(passport.session());

// 4. Middleware para logs de requisição (com headers CORS)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.originalUrl} | Origin: ${req.headers.origin}`);
  
  // Configura headers CORS para respostas
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  
  next();
});

// Rotas
const authRoutes = require('./routes/authRoutes');
const apiRoutes = require('./routes/apiRoutes');
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'frontend')));

// Rota de status
app.get('/status', (req, res) => {
  res.json({ 
    status: 'online',
    app: 'API Mashup',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    cors: {
      allowedOrigins: allowedOrigins,
      currentOrigin: req.headers.origin
    }
  });
});

// 5. Rota principal para servir frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// 6. Middleware para tratamento de erros 404
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
      console.log(` Origens permitidas: ${allowedOrigins.join(', ')}`);
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
