// local-storage.js yüklenmiş olmalı!
function showResult(msg) {
  document.getElementById('result').textContent = msg;
}
async function listFirms() {
  const r = await fetch(api() + '/api/firms', { headers: getHeaders() });
  if (r.status === 401 || r.status === 403) {
    showResult('Yetkiniz yok veya tekrar giriş yapmalısınız.');
    return;
  }
  let firms = await r.json();
  const tbody = document.querySelector('#firmsTable tbody');
  tbody.innerHTML = '';
  if (Array.isArray(firms) && firms.length) {
    document.getElementById('firmsTable').style.display = '';
    firms.forEach(f => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${f.id}</td><td>${f.name}</td>
        <td><button class="edit-btn">Düzenle</button></td>
        <td><button class="delete-btn">Sil</button></td>`;
      tbody.appendChild(tr);
    });
  } else {
    document.getElementById('firmsTable').style.display = 'none';
    showResult('Firma yok.');
  }
}

document.addEventListener('DOMContentLoaded', function() {
  listFirms();
  document.getElementById('btnList').onclick = listFirms;
});