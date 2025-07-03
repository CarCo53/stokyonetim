// local-storage.js dahil edilmiş olmalı!
function showResult(msg) {
  document.getElementById('result').textContent = msg;
}

// Firmaları yükle
async function loadFirms() {
  try {
    const r = await fetch(api() + '/api/firms', { headers: getHeaders() });
    if (r.status === 401 || r.status === 403) {
      showResult('Yetkiniz yok veya tekrar giriş yapmalısınız.');
      return;
    }
    const firms = await r.json();
    const select = document.getElementById('firmId');
    select.innerHTML = '<option value="">Firma Seçin</option>';
    
    // Firma listesi geliyorsa
    if (Array.isArray(firms) && firms.length) {
      firms.forEach(firm => {
        const option = document.createElement('option');
        option.value = firm.id;
        option.textContent = firm.name;
        select.appendChild(option);
      });
      // Hata mesajını temizle
      showResult('');
    } else {
      showResult('Firma bulunamadı. Önce firma eklemelisiniz.');
    }
    
    // API yanıtını console'a yazdır (debug için)
    console.log('Firms API response:', firms);
    
  } catch (e) {
    console.error('Firma yükleme hatası:', e);
    showResult('Firmalar yüklenirken hata oluştu.');
  }
}

async function listStores() {
  try {
    const r = await fetch(api() + '/api/stores', { headers: getHeaders() });
    if (r.status === 401 || r.status === 403) {
      showResult('Yetkiniz yok veya tekrar giriş yapmalısınız.');
      return;
    }
    const stores = await r.json();
    const tbody = document.querySelector('#storesTable tbody');
    tbody.innerHTML = '';
    
    if (Array.isArray(stores) && stores.length) {
      document.getElementById('storesTable').style.display = '';
      stores.forEach(store => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${store.id}</td>
          <td>${store.name}</td>
          <td>${store.firm_name || ''}</td>
          <td><button class="edit-btn" data-id="${store.id}" data-name="${store.name}" data-firm="${store.firm_id}">Düzenle</button></td>
          <td><button class="delete-btn" data-id="${store.id}">Sil</button></td>
        `;
        tbody.appendChild(tr);
      });

      // Düzenleme butonları
      document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.onclick = function() {
          const { id, name, firm } = this.dataset;
          document.getElementById('storeId').value = id;
          document.getElementById('storeName').value = name;
          document.getElementById('firmId').value = firm;
          document.getElementById('saveBtn').textContent = 'Güncelle';
          document.getElementById('cancelBtn').style.display = '';
        };
      });

      // Silme butonları
      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = async function() {
          if (!confirm('Mağazayı silmek istediğinize emin misiniz?')) return;
          
          const id = this.dataset.id;
          try {
            const r = await fetch(api() + '/api/stores/' + id, {
              method: 'DELETE',
              headers: getHeaders()
            });
            
            if (r.ok) {
              showResult('Mağaza silindi.');
              listStores();
            } else {
              const data = await r.json();
              showResult(data.message || 'Silme işlemi başarısız.');
            }
          } catch (e) {
            showResult('Silme işlemi sırasında hata oluştu.');
          }
        };
      });
    } else {
      document.getElementById('storesTable').style.display = 'none';
      showResult('Mağaza yok.');
    }
  } catch (e) {
    console.error('Mağaza listeleme hatası:', e);
    showResult('Bağlantı veya sunucu hatası.');
  }
}

// Mağaza kaydetme/güncelleme
async function saveStore(e) {
  e.preventDefault();
  const id = document.getElementById('storeId').value;
  const name = document.getElementById('storeName').value;
  const firmId = document.getElementById('firmId').value;

  if (!name) return showResult('Mağaza adı zorunlu!');
  if (!firmId) return showResult('Firma seçimi zorunlu!');

  const data = { name, firm_id: firmId };
  let url = api() + '/api/stores';
  let method = 'POST';

  if (id) {
    url += '/' + id;
    method = 'PUT';
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
      listStores();
    } else {
      const result = await r.json();
      showResult(result.message || 'Kayıt başarısız.');
    }
  } catch (e) {
    console.error('Kayıt hatası:', e);
    showResult('Kayıt sırasında hata oluştu.');
  }
}

function resetForm() {
  document.getElementById('storeForm').reset();
  document.getElementById('storeId').value = '';
  document.getElementById('saveBtn').textContent = 'Ekle';
  document.getElementById('cancelBtn').style.display = 'none';
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {
  // Önce firmaları yükle
  loadFirms();
  
  // Sonra mağazaları listele
  listStores();
  
  // Event listener'ları ekle
  document.getElementById('btnList').onclick = () => {
    loadFirms();  // Firma listesini yenile
    listStores(); // Mağaza listesini yenile
  };
  document.getElementById('storeForm').onsubmit = saveStore;
  document.getElementById('cancelBtn').onclick = resetForm;
});