const API_BASE_URL = 'https://trabalho2-mashup-apis-maximodydyuk-7wtj.onrender.com/api';
const appContainer = document.getElementById('app');
let currentUser = null;

// 1. Configuração avançada para forçar cookies cross-origin
function setupCrossOriginCookies() {
  // Força configurações globais para cookies cross-origin
  if (typeof document !== 'undefined') {
    // Override global do fetch para sempre incluir credentials
    const originalFetch = window.fetch;
    window.fetch = function(url, options = {}) {
      const enhancedOptions = {
        ...options,
        credentials: 'include',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...options.headers
        }
      };
      return originalFetch(url, enhancedOptions);
    };

    // Força políticas de cookies no browser
    document.cookie = "SameSite=None; Secure; Path=/";
    
    // Configuração adicional para Vercel
    if (window.location.hostname.includes('vercel.app')) {
      document.cookie = "cross-site-cookie=1; SameSite=None; Secure; Path=/";
    }
    
    console.log('[DEBUG] Configurações cross-origin aplicadas');
  }
}

// 2. Função auxiliar para fetch com configuração forçada
async function fetchWithForcedCredentials(url, options = {}) {
  const enhancedOptions = {
    credentials: 'include',
    mode: 'cors',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...options.headers
    },
    ...options
  };

  console.log(`[DEBUG] Fazendo fetch para: ${url}`);
  console.log(`[DEBUG] Opções do fetch:`, enhancedOptions);

  const response = await fetch(url, enhancedOptions);
  
  console.log(`[DEBUG] Response status: ${response.status}`);
  console.log(`[DEBUG] Response headers:`, [...response.headers.entries()]);
  
  return response;
}

// Inicializar aplicação
setupCrossOriginCookies();
init();

async function init() {
  await checkSession();
}

// Verificar sessão com configuração forçada
async function checkSession() {
  console.log('[DEBUG] Iniciando verificação de sessão...');
  try {
    const response = await fetchWithForcedCredentials(`${API_BASE_URL}/auth/check-session`);

    if (response.status === 401) {
      console.log('[DEBUG] Sessão inválida (401)');
      showLogin();
      return;
    }

    if (!response.ok) {
      throw new Error(`Sessão inválida (status: ${response.status})`);
    }

    const data = await response.json();
    console.log('[DEBUG] Resposta do check-session:', data);

    if (data.authenticated) {
      currentUser = data.user;
      showDashboard();
    } else {
      showLogin();
    }
  } catch (error) {
    console.error('[DEBUG] Erro ao verificar sessão:', error);
    showLogin();
  }
}

// Mostrar tela de login
function showLogin() {
  console.log('[DEBUG] Mostrando tela de login');
  appContainer.innerHTML = `
    <div class="auth-container">
      <h2 class="text-center mb-4">Login</h2>
      <div id="error" class="alert alert-danger d-none"></div>
      <form id="loginForm">
        <div class="mb-3">
          <label for="username" class="form-label">Utilizador</label>
          <input type="text" class="form-control" id="username" required>
        </div>
        <div class="mb-3">
          <label for="password" class="form-label">Senha</label>
          <input type="password" class="form-control" id="password" required>
        </div>
        <button type="submit" class="btn btn-primary w-100">Entrar</button>
      </form>
      <div class="mt-3 text-center">
        Não tem conta? <a href="#" id="showRegister">Registe-se</a>
      </div>
    </div>
  `;

  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('showRegister').addEventListener('click', showRegister);
}

// Mostrar tela de registro
function showRegister() {
  console.log('[DEBUG] Mostrando tela de registro');
  appContainer.innerHTML = `
    <div class="auth-container">
      <h2 class="text-center mb-4">Registro</h2>
      <div id="error" class="alert alert-danger d-none"></div>
      <form id="registerForm">
        <div class="mb-3">
          <label for="regUsername" class="form-label">Utilizador</label>
          <input type="text" class="form-control" id="regUsername" required>
        </div>
        <div class="mb-3">
          <label for="regPassword" class="form-label">Senha (mín. 6 caracteres)</label>
          <input type="password" class="form-control" id="regPassword" required>
        </div>
        <button type="submit" class="btn btn-success w-100">Registrar</button>
      </form>
      <div class="mt-3 text-center">
        Já tem conta? <a href="#" id="showLogin">Faça login</a>
      </div>
    </div>
  `;

  document.getElementById('registerForm').addEventListener('submit', handleRegister);
  document.getElementById('showLogin').addEventListener('click', showLogin);
}

// Mostrar dashboard
function showDashboard() {
  console.log('[DEBUG] Mostrando dashboard para:', currentUser.username);
  appContainer.innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
      <div class="container">
        <a class="navbar-brand" href="#">API Mashup</a>
        <div class="collapse navbar-collapse">
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <a class="nav-link active" href="#" id="dashboardLink">Dashboard</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#" id="historyLink">Histórico</a>
            </li>
          </ul>
          <span class="navbar-text me-3">Olá, ${currentUser.username}</span>
          <button class="btn btn-outline-light" id="logoutBtn">Sair</button>
        </div>
      </div>
    </nav>

    <div class="row">
      <div class="col-md-6">
        <div class="card mb-4">
          <div class="card-header bg-primary text-white">
            Pesquisar Cidade
          </div>
          <div class="card-body">
            <form id="citySearchForm">
              <div class="input-group">
                <input type="text" class="form-control" id="cityInput" placeholder="Ex: Lisboa" required>
                <button class="btn btn-primary" type="submit">Buscar</button>
              </div>
            </form>
            <div id="cityResults" class="mt-3"></div>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card">
          <div class="card-header bg-success text-white">
            Pesquisar Imagens
          </div>
          <div class="card-body">
            <form id="imageSearchForm">
              <div class="input-group">
                <input type="text" class="form-control" id="imageInput" placeholder="Ex: Praia" required>
                <button class="btn btn-success" type="submit">Buscar</button>
              </div>
            </form>
            <div id="imageResults" class="mt-3 row"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  document.getElementById('citySearchForm').addEventListener('submit', handleCitySearch);
  document.getElementById('imageSearchForm').addEventListener('submit', handleImageSearch);
  document.getElementById('historyLink').addEventListener('click', function(e) {
    e.preventDefault();
    showHistory();
  });

  document.getElementById('cityInput').value = '';
  document.getElementById('imageInput').value = '';
  document.getElementById('cityResults').innerHTML = '';
  document.getElementById('imageResults').innerHTML = '';
}

// Mostrar histórico
async function showHistory() {
  console.log('[DEBUG] Mostrando histórico');
  try {
    const response = await fetchWithForcedCredentials(`${API_BASE_URL}/history`);

    if (response.status === 401) {
      console.log('[DEBUG] Não autenticado no histórico');
      showLogin();
      return;
    }

    if (!response.ok) {
      throw new Error('Erro ao carregar histórico');
    }

    const searches = await response.json();
    console.log('[DEBUG] Dados do histórico:', searches);

    let historyHTML = `
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h2>Histórico de Pesquisas</h2>
          <button class="btn btn-danger" id="clearHistory">Limpar Histórico</button>
        </div>
        <div class="card-body">
          <table class="table table-striped">
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Termo</th>
                <th>Detalhes</th>
              </tr>
            </thead>
            <tbody>
    `;

    searches.forEach(search => {
      let details = '';
      if (search.type === 'city') {
        details = `
          <div>
            <small>Temperatura: ${search.weather.temp}°C</small><br>
            <small>Descrição: ${search.weather.description}</small><br>
            <small>País: ${search.country.name}</small>
          </div>
        `;
      } else {
        details = `
          <div>
            <small>Total de imagens: ${search.imageData.count}</small>
          </div>
        `;
      }
      historyHTML += `
        <tr>
          <td>${new Date(search.date).toLocaleString()}</td>
          <td>${search.type === 'city' ? 'Cidade' : 'Imagem'}</td>
          <td>${search.term}</td>
          <td>${details}</td>
        </tr>
      `;
    });

    historyHTML += `
            </tbody>
          </table>
          <button class="btn btn-secondary" id="backToDashboard">Voltar</button>
        </div>
      </div>
    `;

    appContainer.innerHTML = `
      <nav class="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
        <div class="container">
          <a class="navbar-brand" href="#">API Mashup</a>
          <button class="btn btn-outline-light" id="logoutBtn">Sair</button>
        </div>
      </nav>
      ${historyHTML}
    `;

    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('backToDashboard').addEventListener('click', showDashboard);
    document.getElementById('clearHistory').addEventListener('click', clearHistory);
  } catch (error) {
    console.error('[DEBUG] Erro no histórico:', error);
    showError('Erro ao carregar histórico: ' + error.message);
  }
}

// Limpar histórico
async function clearHistory() {
  if (!confirm('Tem certeza que deseja limpar todo o histórico?')) return;

  console.log('[DEBUG] Limpando histórico...');
  try {
    const response = await fetchWithForcedCredentials(`${API_BASE_URL}/history`, {
      method: 'DELETE'
    });

    if (response.status === 401) {
      console.log('[DEBUG] Não autenticado ao limpar histórico');
      showLogin();
      return;
    }

    if (!response.ok) {
      throw new Error('Erro ao limpar histórico');
    }

    console.log('[DEBUG] Histórico limpo com sucesso');
    await showHistory();
  } catch (error) {
    console.error('[DEBUG] Erro ao limpar histórico:', error);
    showError('Erro ao limpar histórico: ' + error.message);
  }
}

// Manipulador de login com forçamento de cookies
async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  console.log('[DEBUG] Tentativa de login para:', username);

  try {
    const response = await fetchWithForcedCredentials(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    if (response.status === 401) {
      console.log('[DEBUG] Credenciais inválidas');
      showError('Credenciais inválidas');
      return;
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Credenciais inválidas');
    }

    const data = await response.json();
    console.log('[DEBUG] Resposta do login:', data);

    if (data.success) {
      console.log('[DEBUG] Login bem-sucedido, forçando configuração de cookies...');
      
      // Força configuração adicional de cookies após login
      setupCrossOriginCookies();
      
      // Aguarda um pouco para garantir que o cookie foi definido
      await new Promise(resolve => setTimeout(resolve, 100));
      
      currentUser = data.user;
      showDashboard();
    } else {
      showError(data.error || 'Credenciais inválidas');
    }
  } catch (error) {
    console.error('[DEBUG] Erro no login:', error);
    showError(error.message || 'Erro na conexão com o servidor');
  }
}

// Manipulador de registro
async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('regUsername').value;
  const password = document.getElementById('regPassword').value;
  console.log('[DEBUG] Tentativa de registro para:', username);

  try {
    const response = await fetchWithForcedCredentials(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    if (response.status === 401) {
      console.log('[DEBUG] Erro no registro');
      showError('Erro no registro');
      return;
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro no registro');
    }

    const data = await response.json();
    console.log('[DEBUG] Resposta do registro:', data);

    if (data.success) {
      console.log('[DEBUG] Registro bem-sucedido');
      
      // Força configuração de cookies após registro
      setupCrossOriginCookies();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      currentUser = data.user;
      showDashboard();
    } else {
      showError(data.error || 'Erro no registro');
    }
  } catch (error) {
    console.error('[DEBUG] Erro no registro:', error);
    showError(error.message || 'Erro na conexão com o servidor');
  }
}

// Manipulador de logout
async function handleLogout() {
  console.log('[DEBUG] Iniciando logout...');
  try {
    await fetchWithForcedCredentials(`${API_BASE_URL}/auth/logout`);
    console.log('[DEBUG] Logout bem-sucedido');
  } catch (error) {
    console.error('[DEBUG] Erro no logout:', error);
  } finally {
    // Limpa cookies locais
    document.cookie = "sessionId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure";
    document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure";
    
    currentUser = null;
    showLogin();
  }
}

// Manipulador de pesquisa de cidade
async function handleCitySearch(e) {
  e.preventDefault();
  const city = document.getElementById('cityInput').value;
  const resultsDiv = document.getElementById('cityResults');
  console.log(`[DEBUG] Pesquisando cidade: ${city}`);

  resultsDiv.innerHTML = '<div class="text-center">Carregando... <div class="spinner-border"></div></div>';

  try {
    const response = await fetchWithForcedCredentials(`${API_BASE_URL}/search/city?term=${encodeURIComponent(city)}`);

    if (response.status === 401) {
      console.log('[DEBUG] Não autenticado na pesquisa de cidade');
      showLogin();
      return;
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[DEBUG] Dados da cidade:', data);

    resultsDiv.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">${city}</h5>
          <div class="row">
            <div class="col-md-6">
              <div class="card">
                <div class="card-header bg-info text-white">Clima</div>
                <div class="card-body">
                  <p>Temperatura: ${data.weather.temp}°C</p>
                  <p>Descrição: ${data.weather.description}</p>
                  <p>Humidade: ${data.weather.humidity}%</p>
                  <img src="http://openweathermap.org/img/wn/${data.weather.icon}@2x.png" alt="Ícone do clima" class="weather-icon">
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="card">
                <div class="card-header bg-warning">País</div>
                <div class="card-body">
                  <p>Nome: ${data.country.name}</p>
                  <p>Capital: ${data.country.capital}</p>
                  <p>População: ${data.country.population.toLocaleString()}</p>
                  <img src="${data.country.flag}" alt="Bandeira" class="country-flag">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('[DEBUG] Erro na pesquisa de cidade:', error);
    resultsDiv.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
  }
}

// Manipulador de pesquisa de imagens
async function handleImageSearch(e) {
  e.preventDefault();
  const term = document.getElementById('imageInput').value;
  const resultsDiv = document.getElementById('imageResults');
  console.log(`[DEBUG] Pesquisando imagem: ${term}`);

  resultsDiv.innerHTML = '<div class="text-center">Carregando... <div class="spinner-border"></div></div>';

  try {
    const response = await fetchWithForcedCredentials(`${API_BASE_URL}/search/image?term=${encodeURIComponent(term)}`);

    if (response.status === 401) {
      console.log('[DEBUG] Não autenticado na pesquisa de imagem');
      showLogin();
      return;
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }

    const images = await response.json();
    console.log('[DEBUG] Dados da imagem:', images);

    let imagesHTML = '<div class="row g-3">';
    images.forEach(image => {
      imagesHTML += `
        <div class="col-md-4">
          <div class="card image-card h-100">
            <img src="${image.webformatURL}" class="card-img-top image-result" alt="${image.tags}">
            <div class="card-footer">
              <p class="card-text small">${image.tags}</p>
            </div>
          </div>
        </div>
      `;
    });
    imagesHTML += '</div>';
    resultsDiv.innerHTML = imagesHTML;
  } catch (error) {
    console.error('[DEBUG] Erro na pesquisa de imagem:', error);
    resultsDiv.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
  }
}

// Mostrar erro
function showError(message) {
  console.error(`[DEBUG] Exibindo erro: ${message}`);
  const errorEl = document.getElementById('error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.remove('d-none');
  } else {
    alert(message);
  }
}
