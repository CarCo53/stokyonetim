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

let firmsCache = [];
let editingFirmId = null;

document.getElementById('firmForm').onsubmit = async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const data = Object.fromEntries(fd.entries());
  const method = editingFirmId ? 'PUT' : 'POST';
  const url = api() + '/api/firms' + (editingFirmId ? '/' + editingFirmId : '');
  const r = await fetch(url, {
    method,
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  handleResult('firmsResult', await r.json());
  e.target.reset();
  editingFirmId = null;
  document.getElementById('firmSaveBtn').textContent = 'Ekle';
  document.getElementById('firmCancelBtn').classList.add('hidden');
  await listFirms();
};

async function listFirms() {
  const r = await fetch(api()+'/api/firms', { headers: getHeaders() });
  let firms = await r.json();
  firmsCache = Array.isArray(firms) ? firms : [];
  const el = document.getElementById('firmsResult');
  if (Array.isArray(firms)) {
    let html = `<table><tr>
      <th>ID</th><th>Adı</th><th>Düzenle</th><th>Sil</th>
    </tr>`;
    firms.forEach(f => {
      html += `<tr>
        <td>${f.id}</td>
        <td>${f.name || ''}</td>
        <td><button type="button" class="edit-firm-btn" data-id="${f.id}">Düzenle</button></td>
        <td><button type="button" class="delete-firm-btn" data-id="${f.id}">Sil</button></td>
      </tr>`;
    });
    html += `</table>`;
    el.innerHTML = html;

    el.querySelectorAll('.edit-firm-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        startEditFirm(this.getAttribute('data-id'));
      });
    });
    el.querySelectorAll('.delete-firm-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        deleteFirm(this.getAttribute('data-id'));
      });
    });
  } else {
    handleResult('firmsResult', firms);
  }
}

function startEditFirm(id) {
  const firm = firmsCache.find(f => String(f.id) === String(id));
  if (!firm) return;
  editingFirmId = firm.id;
  document.getElementById('firmId').value = firm.id || '';
  document.getElementById('firmName').value = firm.name || '';
  document.getElementById('firmSaveBtn').textContent = 'Kaydet';
  document.getElementById('firmCancelBtn').classList.remove('hidden');
}

document.getElementById('firmCancelBtn').onclick = () => {
  editingFirmId = null;
  document.getElementById('firmForm').reset();
  document.getElementById('firmSaveBtn').textContent = 'Ekle';
  document.getElementById('firmCancelBtn').classList.add('hidden');
};

async function deleteFirm(id) {
  if (!confirm('Firmayı silmek istediğinize emin misiniz?')) return;
  const r = await fetch(api() + '/api/firms/' + id, { method:'DELETE', headers: getHeaders() });
  handleResult('firmsResult', await r.json());
  await listFirms();
}

document.getElementById('firmsListBtn').onclick = listFirms;
window.addEventListener('DOMContentLoaded', listFirms);