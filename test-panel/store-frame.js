// local-storage.js yüklenmiş olmalı!
function showResult(msg) {
  document.getElementById('result').textContent = msg;
}
async function listStores() {
  try {
    const r = await fetch(api() + '/api/stores', { headers: getHeaders() });
    if (r.status === 401 || r.status === 403) {
      showResult('Yetkiniz yok veya tekrar giriş yapmalısınız.');
      return;
    }
    let stores = await r.json();
    const tbody = document.querySelector('#storesTable tbody');
    tbody.innerHTML = '';
    if (Array.isArray(stores) && stores.length) {
      document.getElementById('storesTable').style.display = '';
      stores.forEach(f => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${f.id}</td><td>${f.name}</td>
          <td><button class="edit-btn">Düzenle</button></td>
          <td><button class="delete-btn">Sil</button></td>`;
        tbody.appendChild(tr);
      });
    } else {
      document.getElementById('storesTable').style.display = 'none';
      showResult('Mağaza yok.');
    }
  } catch (e) {
    showResult('Bağlantı veya sunucu hatası.');
  }
}

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('btnList').onclick = listStores;
  listStores();
});