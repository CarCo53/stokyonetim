// local-storage.js yüklenmiş olmalı!
function showResult(msg) {
  document.getElementById('result').textContent = msg;
}
async function listUsers() {
  const r = await fetch(api() + '/api/users', { headers: getHeaders() });
  if (r.status === 401 || r.status === 403) {
    showResult('Yetkiniz yok veya tekrar giriş yapmalısınız.');
    return;
  }
  let users = await r.json();
  const tbody = document.querySelector('#usersTable tbody');
  tbody.innerHTML = '';
  if (Array.isArray(users) && users.length) {
    document.getElementById('usersTable').style.display = '';
    users.forEach(u => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${u.id}</td><td>${u.username}</td><td>${u.role}</td><td>${u.store_id}</td>
        <td><button class="edit-btn">Düzenle</button><button class="delete-btn">Sil</button></td>`;
      tbody.appendChild(tr);
    });
  } else {
    document.getElementById('usersTable').style.display = 'none';
    showResult('Kullanıcı yok.');
  }
}

document.addEventListener('DOMContentLoaded', function() {
  listUsers();
  document.getElementById('btnList').onclick = listUsers;
});