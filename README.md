Autor

Nome: Máximo Dydyuk

Número: 31818 


Descrição do trabalho

Aplicação web que combina informações sobre cidades com imagens, através de um mashup de APIs públicas. Permite ao utilizador registar-se, autenticar-se, efetuar pesquisas e consultar o histórico das mesmas 


O que faz e como funciona

Funcionalidades principais:

Autenticação

Registo e login com validação de username único.

Passwords hashadas via bcrypt.

Sessões persistentes e rotas protegidas para utilizadores autenticados 

Pesquisa de cidades

Consulta tempo real com a OpenWeatherMap.

Informações do país e bandeira via RestCountries 

Pesquisa de imagens

Integra com Pixabay para obter imagens relacionadas às cidades 


Histórico persistente

Armazena todas as pesquisas (cidade ou imagem) no MongoDB, associado ao utilizador.

Visualiza em ordem cronológica, com opção de apagar histórico 

Frontend moderno e responsivo

Layout clean via HTML/CSS/JS.

Localização do projeto: https://trabalho2-mashup-apis-maximo-dydyuk-nine.vercel.app/

 Instalação e execução
Pré‑requisitos

Node.js v18+

MongoDB (local ou Atlas)

Chaves nas APIs: OpenWeatherMap, Pixabay 

Passos

Clone o repositório:

git clone https://github.com/PWEB-2425/trabalho2-mashup-apis-MaximoDydyuk.git

cd trabalho2-mashup-apis-MaximoDydyuk

Instale dependências:

cd backend
npm install

cd ../frontend

npm install   # se existirem dependências no frontend

Configure o .env na pasta backend/ com:


MONGODB_URI=<uri_mongo>

SESSION_SECRET=<chave_secreta>

OPENWEATHER_API_KEY=<sua_api_key>

PIXABAY_API_KEY=<sua_api_key>

FRONTEND_URL=http://localhost:3000   # ou porta que usar

Inicie o servidor:

cd backend

npm run dev   # ou npm start se configurado

Aceda à aplicação via navegador em http://localhost:3000 



Estrutura da base de dados
Utiliza MongoDB.

Modelo User: contém username (único), password (hash), e um array de searches, cada uma com:

term, type ('city' ou 'image'), date, e dados específicos (ex. weather) 


Autenticação
Implementada via Passport-local com sessões Express.

Rotas de registo (/auth/register), login (/auth/login) e logout.

Senhas encriptadas (bcrypt) e validação de duplicados.

Rotas de API/search exigem sessão ativa, garantindo segurança dos dados 
