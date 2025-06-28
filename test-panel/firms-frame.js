// local-storage.js yüklenmiş olmalı!
// Tüm işlevler: ekle, güncelle, sil, listele...
function api() {
  return localStorage.getItem('apiurl') || "http://localhost:3001";
}
function getHeaders() {
  const h = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('jwt_token');
  if (token) h['Authorization'] = 'Bearer ' + token;
  return h;
}

function showResult(msg) {
  document.getElementById('firmsResult').textContent = msg;
}

// Firma Listele
async function listFirms() {
  showResult('');
  try {
    const r = await fetch(api() + '/api/firms', { headers: getHeaders() });
    if (r.status === 401 || r.status === 403) {
      showResult('Yetkiniz yok veya tekrar giriş yapmalısınız.');
      return;
    }
    const firms = await r.json();
    let html = '';
    if (Array.isArray(firms) && firms.length) {
      html += `<table><thead><tr><th>ID</th><th>Adı</th><th>Düzenle</th><th>Sil</th></tr></thead><tbody>`;
      for (const f of firms) {
        html += `<tr>
          <td>${f.id}</td>
          <td>${f.name}</td>
          <td><button type="button" data-id="${f.id}" data-name="${f.name}" class="editBtn">Düzenle</button></td>
          <td><button type="button" data-id="${f.id}" class="deleteBtn">Sil</button></td>
        </tr>`;
      }
      html += `</tbody></table>`;
    } else {
      html = 'Firma yok.';
    }
    document.getElementById('firmsResult').innerHTML = html;

    // Edit ve Delete butonları bağla
    document.querySelectorAll('.editBtn').forEach(btn => {
      btn.onclick = function() {
        document.getElementById('firmId').value = this.dataset.id;
        document.getElementById('firmName').value = this.dataset.name;
        document.getElementById('firmSaveBtn').textContent = "Güncelle";
        document.getElementById('firmCancelBtn').classList.remove('hidden');
      };
    });
    document.querySelectorAll('.deleteBtn').forEach(btn => {
      btn.onclick = async function() {
        if (!confirm('Silmek istediğinize emin misiniz?')) return;
        const id = this.dataset.id;
        const r = await fetch(api() + `/api/firms/${id}`, { method: 'DELETE', headers: getHeaders() });
        if (r.ok) {
          showResult('Firma silindi.');
          listFirms();
        } else {
          const data = await r.json();
          showResult(data.message || 'Silme işlemi başarısız.');
        }
      };
    });
  } catch (e) {
    showResult('Bağlantı veya sunucu hatası.');
  }
}

// Firma Ekle/Güncelle
async function saveFirm(e) {
  e.preventDefault();
  const id = document.getElementById('firmId').value;
  const name = document.getElementById('firmName').value;
  if (!name) return showResult("Adı zorunlu!");
  let url = api() + '/api/firms';
  let method = 'POST';
  let body = JSON.stringify({ name });
  if (id) {
    url += '/' + id;
    method = 'PUT';
  }
  try {
    const r = await fetch(url, { method, headers: getHeaders(), body });
    if (r.ok) {
      showResult('Kayıt başarılı.');
      document.getElementById('firmForm').reset();
      document.getElementById('firmId').value = '';
      document.getElementById('firmSaveBtn').textContent = "Ekle";
      document.getElementById('firmCancelBtn').classList.add('hidden');
      listFirms();
    } else {
      const data = await r.json();
      showResult(data.message || 'Kayıt başarısız.');
    }
  } catch {
    showResult('Bağlantı veya sunucu hatası.');
  }
}

// Form iptal
function cancelFirmEdit() {
  document.getElementById('firmForm').reset();
  document.getElementById('firmId').value = '';
  document.getElementById('firmSaveBtn').textContent = "Ekle";
  document.getElementById('firmCancelBtn').classList.add('hidden');
}

// Olayları bağla
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('firmForm').onsubmit = saveFirm;
  document.getElementById('firmCancelBtn').onclick = cancelFirmEdit;
  document.getElementById('firmsListBtn').onclick = listFirms;
  listFirms();
});