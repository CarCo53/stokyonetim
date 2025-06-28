// === Ortak Fonksiyonlar ===
function api() { return localStorage.getItem('apiurl') || "http://localhost:3001"; }
function getHeaders() { return { 'Content-Type': 'application/json' }; }
function handleResult(id, data) {
  document.getElementById(id).textContent = typeof data === "string" ? data : JSON.stringify(data, null, 2);
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
      // Token'ı ana pencereye gönder!
      if (window.parent !== window) {
        window.parent.postMessage({ type: 'setJwtToken', token: result.token }, '*');
        window.parent.postMessage({ type: 'loginSuccess' }, '*');
      } else {
        // Eğer iframe değilse (doğrudan açılmışsa)
        localStorage.setItem('jwt_token', result.token);
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
// İlk girişte api url ayarla:
if (!localStorage.getItem('apiurl')) localStorage.setItem('apiurl', "http://localhost:3001");