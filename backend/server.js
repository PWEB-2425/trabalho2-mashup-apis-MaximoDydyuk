require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// 1. Trust proxy (fundamental para cookies secure em cloud)
app.set('trust proxy', 1);

// 2. Origens permitidas para CORS
const allowedOrigins = [
  'http://localhost:3000',
  'https://trabalho2-mashup-apis-maximo-dydyuk-nine.vercel.app',
  'https://trabalho2-mashup-apis-maximodydyuk-7wtj.onrender.com'
];

// 3. Middleware de CORS com debug
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) {
      console.log('CORS: Pedido sem origem permitido (ex: curl/Postman)');
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      console.log(`CORS: Origem permitida: ${origin}`);
      return callback(null, true);
    } else {
      console.log(`CORS BLOQUEADO: ${origin} não está na lista permitida`);
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

// 5. Sessão com MongoDB (debug extra)
app.use(session({
  secret: process.env.SESSION_SECRET || 'chave_secreta_aleatoria',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 24 * 60 * 60 // 1 dia
  }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 1 dia
    httpOnly: true,
    secure: true, // HTTPS obrigatório
    sameSite: 'none' // cross-origin
  }
}));

// 6. Passport.js
require('./config/passport-config');
app.use(passport.initialize());
app.use(passport.session());

// 7. Debug global de sessão e autenticação
app.use((req, res, next) => {
  console.log('--- NOVO PEDIDO ---');
  console.log('Data:', new Date().toISOString());
  console.log('Método:', req.method, '| URL:', req.originalUrl);
  console.log('SessionID:', req.sessionID);
  console.log('Cookies recebidos:', req.headers.cookie);
  console.log('Sessão:', req.session);
  console.log('Utilizador autenticado:', req.isAuthenticated ? req.isAuthenticated() : false, '| req.user:', req.user);
  next();
});

// 8. Middleware para definir Content-Type
app.use((req, res, next) => {
  res.header('Content-Type', 'application/json; charset=utf-8');
  next();
});

// 9. Middleware de autenticação para rotas protegidas
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    console.log('Autenticação: Utilizador está autenticado');
    return next();
  }
  console.log('Autenticação: NÃO autenticado - 401');
  res.status(401).json({ error: 'Não autenticado' });
}

// 10. Rotas de autenticação
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// 11. Rotas de API (exemplo de rota protegida com debug)
const expressRouter = require('express').Router();
expressRouter.get('/search/city', isAuthenticated, (req, res) => {
  console.log('Acedida rota protegida /search/city');
  res.json({ message: 'Acesso autorizado à cidade', user: req.user });
});
expressRouter.get('/search/image', isAuthenticated, (req, res) => {
  console.log('Acedida rota protegida /search/image');
  res.json({ message: 'Acesso autorizado à imagem', user: req.user });
});
expressRouter.get('/history', isAuthenticated, (req, res) => {
  console.log('Acedida rota protegida /history');
  res.json({ message: 'Acesso autorizado ao histórico', user: req.user });
});
app.use('/api', expressRouter);

// 12. Servir ficheiros estáticos (opcional)
app.use(express.static(path.join(__dirname, 'frontend')));

// 13. Rota de status (pública)
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    app: 'API Mashup',
    ambiente: process.env.NODE_ENV || 'development',
    data_hora: new Date().toISOString(),
    base_de_dados: mongoose.connection.readyState === 1 ? 'ligada' : 'desligada',
    sessao: req.sessionID || 'nenhuma'
  });
});

// 14. Rota principal
app.get('/', (req, res) => {
  res.redirect('/status');
});

// 15. Middleware para erro 404
app.use((req, res) => {
  res.status(404).json({
    erro: 'Rota não encontrada',
    caminho: req.originalUrl,
    método: req.method
  });
});

// 16. Middleware global de erros
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

// 17. Conexão ao MongoDB e arranque do servidor
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Ligação à base de dados MongoDB estabelecida com sucesso.');
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Servidor a correr na porta ${PORT}`);
      console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 URL: http://localhost:${PORT}`);
      console.log(`💾 Base de dados: ${mongoose.connection.readyState === 1 ? 'Ligada' : 'Desligada'}`);
      console.log('🍪 Configuração de cookies:');
      console.log('   secure: true, sameSite: none, httpOnly: true');
    });

    // Encerramento gracioso
    const shutdown = () => {
      console.log('\n🛑 Recebido sinal de encerramento. A encerrar servidor...');
      server.close(() => {
        mongoose.connection.close(false, () => {
          console.log('🔌 Todas as ligações foram encerradas.');
          process.exit(0);
        });
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  })
  .catch(err => {
    console.error('❌ Erro ao ligar à base de dados MongoDB:', err.message);
    console.error('ℹ️ Por favor, verifique a variável de ambiente MONGODB_URI no ficheiro .env');
    process.exit(1);
  });
