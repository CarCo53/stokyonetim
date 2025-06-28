const apiBase = '/api/stores';
const apiFirms = '/api/firms';
let editingId = null;

async function fetchFirms() {
  try {
    const res = await fetch(apiFirms);
    if (!res.ok) throw new Error('Firma API hatası: ' + res.status);
    const firms = await res.json();
    const sel = document.getElementById('firm_id');
    sel.innerHTML = '';
    for (const f of firms) {
      const opt = document.createElement('option');
      opt.value = f.id;
      opt.textContent = f.name;
      sel.appendChild(opt);
    }
  } catch (err) {
    showResult('Firmalar yüklenemedi: ' + err.message);
    console.error(err);
  }
}

async function listStores() {
  try {
    const res = await fetch(apiBase);
    if (!res.ok) throw new Error('Mağaza API hatası: ' + res.status);
    const stores = await res.json();
    const table = document.getElementById('storesTable');
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    if (stores.length) {
      table.style.display = '';
      for (const s of stores) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${s.id}</td>
          <td>${s.name}</td>
          <td data-firmid="${s.firm_id}">${s.firm_name || s.firm_id}</td>
          <td>
            <button class="edit-btn">Düzenle</button>
            <button class="delete-btn">Sil</button>
          </td>
        `;
        tbody.appendChild(tr);
      }
    } else {
      table.style.display = 'none';
    }
  } catch (err) {
    showResult('Mağazalar yüklenemedi: ' + err.message);
    console.error(err);
  }
}

// Event delegation for edit and delete buttons
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('storeForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const firm_id = document.getElementById('firm_id').value;
    if (!name || !firm_id) {
      showResult('Tüm alanlar zorunlu.');
      return;
    }
    try {
      if (editingId) {
        // Update
        const res = await fetch(`${apiBase}/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, firm_id })
        });
        const json = await res.json();
        if (json.id) {
          showResult('Güncellendi.');
          resetForm();
          listStores();
        } else {
          showResult('Hata: ' + (json.error || JSON.stringify(json)));
        }
      } else {
        // Create
        const res = await fetch(apiBase, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, firm_id })
        });
        const json = await res.json();
        if (json.id) {
          showResult('Eklendi.');
          resetForm();
          listStores();
        } else {
          showResult('Hata: ' + (json.error || JSON.stringify(json)));
        }
      }
    } catch (err) {
      showResult('Kayıt hatası: ' + err.message);
      console.error(err);
    }
  });

  document.getElementById('btnUpdate').addEventListener('click', function() {
    document.getElementById('storeForm').dispatchEvent(new Event('submit'));
  });

  document.getElementById('btnCancel').addEventListener('click', function() {
    resetForm();
  });

  document.getElementById('btnList').addEventListener('click', function() {
    listStores();
  });

  // Event delegation for edit/delete
  document.querySelector('#storesTable tbody').addEventListener('click', function(e) {
    if (e.target.tagName === 'BUTTON') {
      const tr = e.target.closest('tr');
      const id = tr.children[0].textContent;
      const name = tr.children[1].textContent;
      const firm_id = tr.children[2].dataset.firmid || tr.children[2].textContent;
      if (e.target.classList.contains('edit-btn')) {
        editStore(id, name, firm_id);
      } else if (e.target.classList.contains('delete-btn')) {
        deleteStore(id);
      }
    }
  });

  fetchFirms();
  listStores();
});

function editStore(id, name, firm_id) {
  document.getElementById('name').value = name;
  document.getElementById('firm_id').value = firm_id;
  editingId = id;
  document.getElementById('btnAdd').style.display = 'none';
  document.getElementById('btnUpdate').style.display = '';
  document.getElementById('btnCancel').style.display = '';
}

async function deleteStore(id) {
  if (!confirm('Bu mağazayı silmek istiyor musunuz?')) return;
  try {
    const res = await fetch(`${apiBase}/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      showResult('Silindi.');
      listStores();
    } else {
      showResult('Hata: ' + (json.error || JSON.stringify(json)));
    }
  } catch (err) {
    showResult('Silme hatası: ' + err.message);
    console.error(err);
  }
}

function resetForm() {
  document.getElementById('name').value = '';
  document.getElementById('firm_id').selectedIndex = 0;
  editingId = null;
  document.getElementById('btnAdd').style.display = '';
  document.getElementById('btnUpdate').style.display = 'none';
  document.getElementById('btnCancel').style.display = 'none';
}

function showResult(msg) {
  document.getElementById('result').textContent = msg;
}