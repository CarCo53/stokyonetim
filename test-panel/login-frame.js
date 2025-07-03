function api() { return localStorage.getItem('apiurl') || "http://localhost:3001"; }
function getHeaders() { 
  const h = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('jwt_token');
  if (token) h['Authorization'] = 'Bearer ' + token;
  return h;
}
function handleResult(id, data) {
  document.getElementById(id).textContent = typeof data === "string" ? data : JSON.stringify(data, null, 2);
}

function logout() {
  localStorage.removeItem('jwt_token');
  document.getElementById('loginStatus').textContent = "Çıkış yapıldı";
  document.getElementById('loginResult').textContent = "";
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'loginSuccess' }, '*');
  }
}

document.getElementById('loginForm').onsubmit = async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const data = Object.fromEntries(fd.entries());
  document.getElementById('loginStatus').textContent = "Giriş yapılıyor...";
  document.getElementById('loginResult').textContent = "";
  try {
    let loginUrl = api() + '/api/auth/login';
    const r = await fetch(loginUrl, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    const result = await r.json();
    handleResult('loginResult', result);
    if(result.token) {
      localStorage.setItem('jwt_token', result.token);
      if (window.parent !== window) {
        window.parent.postMessage({ type: 'setJwtToken', token: result.token }, '*');
        window.parent.postMessage({ type: 'loginSuccess' }, '*');
      }
      document.getElementById('loginStatus').textContent = "Giriş başarılı!";
    } else {
      document.getElementById('loginStatus').textContent = (result.error || result.message || "Giriş başarısız!");
    }
  } catch(err) {
    document.getElementById('loginStatus').textContent = "Bağlantı hatası!";
    handleResult('loginResult', { error: err.message });
  }
};

if (!localStorage.getItem('apiurl')) localStorage.setItem('apiurl', "http://localhost:3001");

document.getElementById('logoutBtn').addEventListener('click', logout);