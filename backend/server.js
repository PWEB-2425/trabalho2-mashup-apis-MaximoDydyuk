require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// 1. Definir trust proxy para produção (obrigatório em Render/Vercel para cookies secure)
app.set('trust proxy', 1);

// 2. Lista de origens permitidas para CORS
const allowedOrigins = [
  'http://localhost:3000',
  'https://trab2maximodydyuk.vercel.app',
  'https://trabalho2-mashup-apis-maximodydyuk-7wtj.onrender.com'
];

// 3. Middleware de CORS
app.use(cors({
  origin: function (origin, callback) {
    // Permitir pedidos sem 'origin' (ex: curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
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

// 5. Configuração da sessão com MongoDB
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
    secure: process.env.NODE_ENV === 'production', // true em produção
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    // NÃO definir domain!
  }
}));

// 6. Passport.js
require('./config/passport-config');
app.use(passport.initialize());
app.use(passport.session());

// 7. Middleware para logs de pedidos
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.originalUrl}`);
  next();
});

// 8. Middleware para definir Content-Type
app.use((req, res, next) => {
  res.header('Content-Type', 'application/json; charset=utf-8');
  next();
});

// 9. Rotas
const authRoutes = require('./routes/authRoutes');
const apiRoutes = require('./routes/apiRoutes');
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// 10. Servir ficheiros estáticos (opcional)
app.use(express.static(path.join(__dirname, 'frontend')));

// 11. Rota de status
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    app: 'API Mashup',
    ambiente: process.env.NODE_ENV || 'development',
    data_hora: new Date().toISOString(),
    base_de_dados: mongoose.connection.readyState === 1 ? 'ligada' : 'desligada'
  });
});

// 12. Rota principal
app.get('/', (req, res) => {
  res.redirect('/status');
});

// 13. Middleware para erro 404
app.use((req, res) => {
  res.status(404).json({
    erro: 'Rota não encontrada',
    caminho: req.originalUrl,
    método: req.method
  });
});

// 14. Middleware global de erros
app.use((err, req, res, next) => {
  console.error('ERRO:', err.stack);
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

// 15. Conexão ao MongoDB e arranque do servidor
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Ligação à base de dados MongoDB estabelecida com sucesso.');
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`\nServidor a correr na porta ${PORT}`);
      console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`URL: http://localhost:${PORT}`);
      console.log(`Base de dados: ${mongoose.connection.readyState === 1 ? 'Ligada' : 'Desligada'}`);
    });

    // Encerramento gracioso
    process.on('SIGINT', () => {
      console.log('\nRecebido sinal SIGINT. A encerrar o servidor...');
      server.close(() => {
        mongoose.connection.close(false, () => {
          console.log('Todas as ligações foram encerradas.');
          process.exit(0);
        });
      });
    });
    process.on('SIGTERM', () => {
      console.log('\nRecebido sinal SIGTERM. A encerrar o servidor...');
      server.close(() => {
        mongoose.connection.close(false, () => {
          console.log('Todas as ligações foram encerradas.');
          process.exit(0);
        });
      });
    });
  })
  .catch(err => {
    console.error('Erro ao ligar à base de dados MongoDB:', err.message);
    console.error('Por favor, verifique a variável de ambiente MONGODB_URI no ficheiro .env');
    process.exit(1);
  });
