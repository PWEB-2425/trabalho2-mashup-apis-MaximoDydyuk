require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// 1. Trust proxy crítico para ambientes cloud
app.set('trust proxy', 1);

// 2. Lista de origens permitidas para CORS (atualizada)
const allowedOrigins = [
  'http://localhost:3000',
  'https://trabalho2-mashup-apis-maximo-dydyuk-nine.vercel.app',
  'https://trabalho2-mashup-apis-maximodydyuk-7wtj.onrender.com'
];

// 3. Middleware de CORS com debug aprimorado
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) {
      console.log('CORS: Pedido sem origem permitido (local/teste)');
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      console.log(`CORS: Origem permitida: ${origin}`);
      return callback(null, true);
    } else {
      console.log(`CORS BLOCKED: ${origin} não permitido`);
      return callback(new Error('Origem não permitida pelo CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 4. Middlewares para JSON e URL-encoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Configuração de sessão otimizada
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
    // Removido domain para evitar conflitos cross-origin
  }
}));

// 6. Passport.js
require('./config/passport-config');
app.use(passport.initialize());
app.use(passport.session());

// 7. Debug de sessão aprimorado
app.use((req, res, next) => {
  console.log('\n--- NOVO PEDIDO ---');
  console.log('URL:', req.method, req.originalUrl);
  console.log('SessionID:', req.sessionID);
  console.log('req.isAuthenticated():', req.isAuthenticated());
  console.log('req.user:', req.user || 'null');
  
  // Log detalhado do cookie recebido
  if (req.headers.cookie) {
    console.log('Cookies recebidos:', req.headers.cookie);
  } else {
    console.log('Cookies recebidos: Nenhum');
  }
  
  next();
});

// 8. Middleware de autenticação reforçado
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    console.log('[AUTH] Usuário autenticado:', req.user.username);
    return next();
  }
  console.log('[AUTH] Acesso não autorizado');
  res.status(401).json({ error: 'Não autenticado' });
};

// 9. Rotas
const authRoutes = require('./routes/authRoutes');
const apiRoutes = require('./routes/apiRoutes');
app.use('/api/auth', authRoutes);
app.use('/api', isAuthenticated, apiRoutes);

// 10. Rota de status (pública)
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    app: 'API Mashup',
    ambiente: process.env.NODE_ENV || 'development',
    data_hora: new Date().toISOString(),
    base_de_dados: mongoose.connection.readyState === 1 ? 'ligada' : 'desligada'
  });
});

// 11. Rota principal
app.get('/', (req, res) => {
  res.redirect('/status');
});

// 12. Middleware para erro 404
app.use((req, res) => {
  res.status(404).json({
    erro: 'Rota não encontrada',
    caminho: req.originalUrl,
    método: req.method
  });
});

// 13. Middleware global de erros
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

// 14. Conexão ao MongoDB e arranque do servidor
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB conectado com sucesso');
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Servidor ativo na porta ${PORT}`);
      console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Acesso: http://localhost:${PORT}`);
      console.log('🍪 Configuração de cookies:');
      console.log('   secure: true, sameSite: none, httpOnly: true');
    });

    // Gerenciamento de encerramento
    const gracefulShutdown = () => {
      console.log('\n🛑 Recebido sinal de desligamento');
      server.close(() => {
        mongoose.connection.close(() => {
          console.log('🔌 Conexões encerradas');
          process.exit(0);
        });
      });
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
  })
  .catch(err => {
    console.error('❌ Falha na conexão com MongoDB:', err.message);
    console.error('ℹ️ Verifique MONGODB_URI no arquivo .env');
    process.exit(1);
  });
