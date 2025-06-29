Imagens e Informação de cidades — Mashup de APIs 

Trabalho #2 — Programação Web

Autor:

Maximo Dydyuk (31818)

Descrição:

Aplicação web que integra dados de múltiplas APIs públicas para fornecer informações sobre cidades e imagens.

Oferece:

Sistema de autenticação seguro (registo, login e logout);

Pesquisa de informações sobre cidades (dados meteorológicos + informações do país);

Pesquisa de imagens;

Histórico persistente de todas as pesquisas;

Interface moderna e responsiva;

Funcionalidades:

Autenticação segura;

Registo com validação de username único;

Login com sessões persistentes;

Senhas criptografadas com bcrypt;

Proteção de rotas para utilizadores autenticados

Pesquisa de Cidades

Dados meteorológicos em tempo real (OpenWeatherMap);

Informações detalhadas do país (RestCountries);

Visualização da bandeira do país

Pesquisa de Imagens

Banco de imagens com milhões de fotos (Pixabay);

Exibição em grid responsiva;

Tags descritivas para cada imagem

Histórico de Pesquisas

Armazenamento permanente no MongoDB;

Visualização cronológica das pesquisas;

Detalhes específicos por tipo de pesquisa;

Opção para limpar todo o histórico

Estrutura do Projeto

text

backend/

├── config/

│   └── passport-config.js   # Configuração de autenticação

├── models/

│   └── User.js              # Modelo do MongoDB

├── routes/

│   ├── authRoutes.js        # Rotas de autenticação

│   └── apiRoutes.js         # Rotas de API (pesquisas/histórico)

├── services/

│   └── apiService.js        # Integração com APIs externas

├── .env                     # Variáveis de ambiente

└── server.js                # Ponto de entrada do servidor


frontend/

├── index.html               # Página inicial (login/registo)

├── app.js                   # Lógica da aplicação

└── style.css                # Estilos principais

Instalação Local

Pré-requisitos

Node.js (v18 ou superior)

MongoDB (local ou Atlas)

Contas nas APIs:

OpenWeatherMap

Pixabay

Instalação

Passo a Passo

Clonar o repositório

git clone https://github.com/seu-usuario/api-mashup.git

cd api-mashup

Instalar dependências do backend

cd backend

npm install

Configurar variáveis de ambiente

Criar arquivo .env na pasta backend:

env

MONGODB_URI=mongodb://localhost:27017/mashupdb

SESSION_SECRET=sua_chave_secreta_forte

OPENWEATHER_API_KEY=sua_chave_openweathermap

PIXABAY_API_KEY=sua_chave_pixabay

FRONTEND_URL=http://localhost:3000

Iniciar servidor backend

Para desenvolvimento com reinício automático:

npm run dev 

aceder a: http://localhost:3000


Descrição da Base de Dados

Modelo de Usuário (User)

javascript

{
  username: String,       // Nome de usuário único
  
  password: String,       // Senha criptografada
  
  searches: [             // Array de pesquisas
    {
      term: String,       // Termo pesquisad
      type: String,       // 'city' ou 'image'
      date: Date,         // Data da pesquisa
      // Dados específicos para cidade:
      weather: {
        temp:

Como Usar

Faz registo com nome de utilizador e password.

Faz login na plataforma.

Pesquisa por uma cidade, onde aparece informações sobre essa cidade

Vê o clima atual, o pais e a bandeira.

Tambem da para pesquisar imagens caso queiras.

Consulta o teu histórico de pesquisas.

Se quiseres podes apagar o historico.

Faz logout quando quiseres.
