function api() { return localStorage.getItem('apiurl') || "http://localhost:3001"; }
function getHeaders() { 
  const h = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('jwt_token');
  if (token) h['Authorization'] = 'Bearer ' + token;
  return h;
}
function showResult(msg) {
  document.getElementById('userResult').textContent = msg;
}

// Firmaları yükle
async function loadFirms(selectedFirmId = "") {
  try {
    const r = await fetch(api() + '/api/firms', { headers: getHeaders() });
    if (!r.ok) return showResult('Firma listesi alınamıyor!');
    const firms = await r.json();
    const firmSelect = document.getElementById('firmId');
    firmSelect.innerHTML = '<option value="">Firma Seçin</option>';
    (firms || []).forEach(f => {
      const opt = document.createElement('option');
      opt.value = f.id;
      opt.textContent = f.name;
      if (String(f.id) === String(selectedFirmId)) opt.selected = true;
      firmSelect.appendChild(opt);
    });
  } catch (e) {
    showResult('Firma listesi alınamıyor!');
  }
}

// Mağazaları yükle (firmaya göre filtreli)
async function loadStores(firmId = "", selectedStoreId = "") {
  try {
    let url = api() + '/api/stores';
    if (firmId) url += '?firm_id=' + firmId;
    const r = await fetch(url, { headers: getHeaders() });
    if (!r.ok) return showResult('Mağaza listesi alınamıyor!');
    const stores = await r.json();
    const storeSelect = document.getElementById('storeId');
    storeSelect.innerHTML = '<option value="">Mağaza Seçin</option>';
    (stores || []).forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.name;
      if (String(s.id) === String(selectedStoreId)) opt.selected = true;
      storeSelect.appendChild(opt);
    });
  } catch (e) {
    showResult('Mağaza listesi alınamıyor!');
  }
}

// Kullanıcıları listele
async function listUsers() {
  showResult('');
  try {
    const r = await fetch(api() + '/api/users', { headers: getHeaders() });
    if (r.status === 401 || r.status === 403) {
      showResult('Yetkiniz yok veya tekrar giriş yapmalısınız.');
      return;
    }
    const users = await r.json();

    // Firma ve mağaza isimlerini topluca fetch edelim
    const [stores, firms] = await Promise.all([
      fetch(api() + '/api/stores', { headers: getHeaders() }).then(res => res.ok ? res.json() : []),
      fetch(api() + '/api/firms', { headers: getHeaders() }).then(res => res.ok ? res.json() : [])
    ]);
    const storeMap = {};
    (stores || []).forEach(s => storeMap[s.id] = s);
    const firmMap = {};
    (firms || []).forEach(f => firmMap[f.id] = f);

    const tbody = document.querySelector('#usersTable tbody');
    tbody.innerHTML = '';
    if (Array.isArray(users) && users.length) {
      document.getElementById('usersTable').style.display = '';
      users.forEach(u => {
        const store = storeMap[u.store_id] || {};
        const firm = firmMap[store.firm_id] || {};
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${u.id}</td>
          <td>${firm.name || ''}</td>
          <td>${store.name || ''}</td>
          <td>${u.username}</td>
          <td>${u.role}</td>
          <td><button class="editBtn" data-id="${u.id}" data-store="${u.store_id}" data-firm="${store.firm_id}" data-username="${u.username}" data-role="${u.role}">Düzenle</button></td>
          <td><button class="deleteBtn" data-id="${u.id}">Sil</button></td>
        `;
        tbody.appendChild(tr);
      });
      // Düzenle butonları
      document.querySelectorAll('.editBtn').forEach(btn => {
        btn.onclick = function() {
          document.getElementById('userId').value = this.dataset.id;
          document.getElementById('username').value = this.dataset.username;
          document.getElementById('role').value = this.dataset.role;
          document.getElementById('password').value = '';
          loadFirms(this.dataset.firm).then(() => {
            loadStores(this.dataset.firm, this.dataset.store);
          });
          document.getElementById('saveBtn').textContent = "Güncelle";
          document.getElementById('cancelBtn').style.display = '';
        };
      });
      // Sil butonları
      document.querySelectorAll('.deleteBtn').forEach(btn => {
        btn.onclick = async function() {
          if (!confirm('Kullanıcıyı silmek istiyor musunuz?')) return;
          const id = this.dataset.id;
          try {
            const r = await fetch(api() + '/api/users/' + id, { method: 'DELETE', headers: getHeaders() });
            if (r.ok) {
              showResult('Kullanıcı silindi.');
              listUsers();
            } else {
              const res = await r.json();
              showResult(res.message || 'Silme işlemi başarısız.');
            }
          } catch (e) {
            showResult('Kullanıcı silinemedi!');
          }
        };
      });
    } else {
      document.getElementById('usersTable').style.display = 'none';
      showResult('Kullanıcı yok.');
    }
  } catch (e) {
    showResult('Bağlantı veya sunucu hatası.');
  }
}

// Kayıt (ekle/güncelle)
async function saveUser(e) {
  e.preventDefault();
  const id = document.getElementById('userId').value;
  const store_id = document.getElementById('storeId').value;
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value;

  if (!store_id || !username || !role) return showResult('Mağaza, kullanıcı adı ve rol zorunludur!');

  let data = { store_id, username, role };
  if (password) data.password = password;

  let url = api() + '/api/users';
  let method = 'POST';

  if (id) {
    url += '/' + id;
    method = 'PUT';
  } else if (!password) {
    return showResult('Yeni kullanıcı için şifre zorunlu!');
  }

  try {
    const r = await fetch(url, {
      method,
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (r.ok) {
      showResult('Kayıt başarılı.');
      resetForm();
      listUsers();
    } else {
      const res = await r.json();
      showResult(res.message || 'Kayıt başarısız.');
    }
  } catch (e) {
    showResult('Kayıt sırasında hata oluştu.');
  }
}

function resetForm() {
  document.getElementById('userForm').reset();
  document.getElementById('userId').value = '';
  document.getElementById('saveBtn').textContent = "Ekle";
  document.getElementById('cancelBtn').style.display = 'none';
  loadFirms().then(() => loadStores()); // Formu sıfırlayınca firmaları ve mağazaları da sıfırla
}

document.addEventListener('DOMContentLoaded', function() {
  loadFirms().then(() => loadStores());
  listUsers();

  document.getElementById('refreshBtn').onclick = () => { loadFirms().then(() => loadStores()); listUsers(); };
  document.getElementById('userForm').onsubmit = saveUser;
  document.getElementById('cancelBtn').onclick = resetForm;

  // Firma değişince mağaza listesini güncelle
  document.getElementById('firmId').addEventListener('change', function() {
    loadStores(this.value);
  });
});