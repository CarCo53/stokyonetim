function api() { return localStorage.getItem('apiurl') || "http://localhost:3001"; }
function getHeaders() {
  const h = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('jwt_token');
  if(token) h['Authorization'] = 'Bearer ' + token;
  return h;
}
function handleResult(id, data) {
  document.getElementById(id).textContent = typeof data === "string" ? data : JSON.stringify(data, null, 2);
}

let storesCache = [];
let firmsCache = [];
let editingStoreId = null;

// === FİRMA DROPDOWN GÜNCELLE ===
async function updateFirmsDropdown() {
  const select = document.getElementById('storeFirmId');
  select.innerHTML = '<option value="" disabled selected>Firma seçiniz</option>';
  try {
    const r = await fetch(api() + '/api/firms', { headers: getHeaders() });
    const firms = await r.json();
    firmsCache = Array.isArray(firms) ? firms : [];
    // Firma sıralı gelsin (isteğe göre id veya isme göre sıralanabilir)
    firmsCache.sort((a, b) => a.name.localeCompare(b.name, "tr"));
    firmsCache.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f.id;
      opt.textContent = f.name;
      select.appendChild(opt);
    });
  } catch(e) {
    // Firma çekilemezse select boş kalır ve kullanıcıya mesaj verilmez
    firmsCache = [];
  }
}

// Mağaza ekle/güncelle
document.getElementById('storeForm').onsubmit = async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const data = Object.fromEntries(fd.entries());
  if (!data.firm_id) {
    alert("Firma seçmek zorunlu!");
    return;
  }
  const method = editingStoreId ? 'PUT' : 'POST';
  const url = api() + '/api/stores' + (editingStoreId ? '/' + editingStoreId : '');
  const r = await fetch(url, {
    method,
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  handleResult('storesResult', await r.json());
  e.target.reset();
  editingStoreId = null;
  document.getElementById('storeSaveBtn').textContent = 'Ekle';
  document.getElementById('storeCancelBtn').classList.add('hidden');
  await listStores();
  await updateFirmsDropdown();
};

// Listele
async function listStores() {
  const r = await fetch(api()+'/api/stores', { headers: getHeaders() });
  let stores = await r.json();
  storesCache = Array.isArray(stores) ? stores : [];
  const el = document.getElementById('storesResult');
  if (Array.isArray(stores)) {
    let html = `<table><tr>
      <th>ID</th><th>Adı</th><th>Adres</th><th>Firma</th><th>Düzenle</th><th>Sil</th>
    </tr>`;
    stores.forEach(s => {
      let firmName = '';
      if (s.firm_id && firmsCache.length > 0) {
        const firm = firmsCache.find(f => String(f.id) === String(s.firm_id));
        firmName = firm ? firm.name : s.firm_id;
      } else if (s.firm_id) {
        firmName = s.firm_id;
      }
      html += `<tr>
        <td>${s.id}</td>
        <td>${s.name || ''}</td>
        <td>${s.address || ''}</td>
        <td>${firmName || ''}</td>
        <td><button type="button" class="edit-store-btn" data-id="${s.id}">Düzenle</button></td>
        <td><button type="button" class="delete-store-btn" data-id="${s.id}">Sil</button></td>
      </tr>`;
    });
    html += `</table>`;
    el.innerHTML = html;

    // Butonlara event bağlama CSP uyumlu!
    el.querySelectorAll('.edit-store-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        startEditStore(this.getAttribute('data-id'));
      });
    });
    el.querySelectorAll('.delete-store-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        deleteStore(this.getAttribute('data-id'));
      });
    });
  } else {
    handleResult('storesResult', stores);
  }
}

// Düzenleme başlat
function startEditStore(id) {
  const store = storesCache.find(s => String(s.id) === String(id));
  if (!store) return;
  editingStoreId = store.id;
  document.getElementById('storeId').value = store.id || '';
  document.getElementById('storeName').value = store.name || '';
  document.getElementById('storeAddress').value = store.address || '';
  document.getElementById('storeFirmId').value = store.firm_id || '';
  document.getElementById('storeSaveBtn').textContent = 'Kaydet';
  document.getElementById('storeCancelBtn').classList.remove('hidden');
}

// İptal
document.getElementById('storeCancelBtn').onclick = () => {
  editingStoreId = null;
  document.getElementById('storeForm').reset();
  document.getElementById('storeSaveBtn').textContent = 'Ekle';
  document.getElementById('storeCancelBtn').classList.add('hidden');
};

// Sil
async function deleteStore(id) {
  if (!confirm('Mağazayı silmek istediğinize emin misiniz?')) return;
  const r = await fetch(api() + '/api/stores/' + id, { method:'DELETE', headers: getHeaders() });
  handleResult('storesResult', await r.json());
  await listStores();
}

// Listele butonu bağlama + ilk yüklemede firmaları çek
document.getElementById('storesListBtn').onclick = listStores;
window.addEventListener('DOMContentLoaded', async () => {
  await updateFirmsDropdown();
  await listStores();
});