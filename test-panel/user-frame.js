function api() { return localStorage.getItem('apiurl') || "http://localhost:3001"; }
function getHeaders() {
  const h = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('jwt_token');
  if(token) h['Authorization'] = 'Bearer ' + token;
  return h;
}

// JWT decode ve kullanıcı gösterimi
function parseJwt(token) {
  if (!token) return null;
  try { return JSON.parse(atob(token.split('.')[1])); } catch (e) { return null; }
}
function showCurrentUser() {
  const token = localStorage.getItem('jwt_token');
  const payload = parseJwt(token);
  const user = payload && payload.user ? payload.user : null;
  const el = document.getElementById('currentUser');
  if (user) el.textContent = `Giriş yapan: ${user.username} (${user.role})`;
  else el.textContent = "Giriş yapılmamış.";
  return user;
}

let editingId = null;
let usersCache = [];

async function listUsers() {
  const r = await fetch(api()+'/api/users', { headers: getHeaders() });
  if (r.status === 401 || r.status === 403) {
    document.getElementById('usersTable').style.display = 'none';
    showResult('Yetkiniz yok veya tekrar giriş yapmalısınız.');
    return;
  }
  let users = await r.json();
  usersCache = Array.isArray(users) ? users : [];
  const tbody = document.querySelector('#usersTable tbody');
  tbody.innerHTML = '';
  if (Array.isArray(users) && users.length) {
    document.getElementById('usersTable').style.display = '';
    users.forEach(u => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${u.id}</td>
        <td>${u.username}</td>
        <td>${u.role}</td>
        <td>${u.store_id}</td>
        <td>
          <button class="edit-btn">Düzenle</button>
          <button class="delete-btn">Sil</button>
        </td>`;
      tbody.appendChild(tr);
    });
  } else {
    document.getElementById('usersTable').style.display = 'none';
    showResult('Kullanıcı yok.');
  }
}

document.addEventListener('DOMContentLoaded', function() {
  showCurrentUser();
  listUsers();
  document.getElementById('btnList').onclick = listUsers;
  // ... Diğer btn ve form işlemleri burada ...
});

function showResult(msg) {
  document.getElementById('result').textContent = msg;
}