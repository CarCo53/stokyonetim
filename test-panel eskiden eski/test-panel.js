// CSP uyumlu, tüm buton eventleri DOM ile bağlanır!

const api = () => document.getElementById('apiurl').value;
let token = "";
let currentUser = null;
let currentStoreId = null;
let storesCache = [], usersCache = [], productsCache = [], customersCache = [], salesCache = [];
let editingStoreId = null, editingUserId = null, editingProductId = null, editingCustomerId = null, editingSaleId = null;

function getHeaders() {
  const h = { 'Content-Type': 'application/json' };
  if(token) h['Authorization'] = 'Bearer ' + token;
  return h;
}

function handleResult(id, data) {
  document.getElementById(id).textContent =
    typeof data === "string" ? data : JSON.stringify(data, null, 2);
}

// === Login ===
document.getElementById('loginForm').onsubmit = async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const data = Object.fromEntries(fd.entries());
  document.getElementById('loginStatus').textContent = "Giriş yapılıyor...";
  document.getElementById('loginResult').textContent = "";
  try {
    let loginUrl = api() + '/api/auth/login';
    const r = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify(data)
    });
    const result = await r.json();
    document.getElementById('loginResult').textContent = JSON.stringify(result, null, 2);
    if(result.token) {
      token = result.token;
      await fetchMeAndSetupUI();
      document.getElementById('loginStatus').textContent = "Giriş başarılı!";
      document.getElementById('loginFieldset').classList.add('hidden');
      document.getElementById('userbar').classList.remove('hidden');
    } else {
      document.getElementById('loginStatus').textContent = (result.error || result.message || "Giriş başarısız!");
    }
  } catch(err) {
    document.getElementById('loginStatus').textContent = "Bağlantı hatası!";
    document.getElementById('loginResult').textContent = JSON.stringify({ error: err.message }, null, 2);
  }
};
document.getElementById('logoutBtn').onclick = () => {
  token = "";
  currentUser = null;
  currentStoreId = null;
  document.getElementById('userStatus').textContent = '';
  document.getElementById('loginFieldset').classList.remove('hidden');
  document.getElementById('userbar').classList.add('hidden');
  document.getElementById('loginStatus').textContent = 'Çıkış yapıldı.';
};

async function fetchMeAndSetupUI() {
  const r = await fetch(api() + '/api/me', { headers: getHeaders() });
  const me = await r.json();
  if(me && me.user) {
    currentUser = me.user;
    currentStoreId = me.user.store_id;
    document.getElementById('userStatus').textContent =
      `Giriş yapılan kullanıcı: ${currentUser.username} | Mağaza ID: ${currentStoreId}`;
    await updateProductsDropdown();
    await updateCustomersDropdown();
  }
}

// === Dropdownlar ===
async function updateProductsDropdown() {
  const r = await fetch(api()+'/api/products?store_id='+currentStoreId, { headers:getHeaders() });
  const products = await r.json();
  productsCache = Array.isArray(products) ? products : [];
  const datalist = document.getElementById('productOptions');
  datalist.innerHTML = "";
  productsCache.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id + ' - ' + p.name + (p.imei ? (' / ' + p.imei) : '');
    datalist.appendChild(opt);
  });
}
async function updateCustomersDropdown() {
  const r = await fetch(api()+'/api/customers?store_id='+currentStoreId, { headers:getHeaders() });
  const customers = await r.json();
  customersCache = Array.isArray(customers) ? customers : [];
  const datalist = document.getElementById('customerOptions');
  datalist.innerHTML = "";
  customersCache.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id + ' - ' + c.name;
    datalist.appendChild(opt);
  });
}

// === MAĞAZA CRUD ===
document.getElementById('storeForm').onsubmit = async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const data = Object.fromEntries(fd.entries());
  if (data.id === "") delete data.id;
  let method = editingStoreId ? 'PUT' : 'POST';
  let url = api() + '/api/stores' + (editingStoreId ? '/' + editingStoreId : '');
  const r = await fetch(url, { method, headers:getHeaders(), body:JSON.stringify(data) });
  handleResult('storesResult', await r.json());
  e.target.reset();
  editingStoreId = null;
  document.getElementById('storeSaveBtn').textContent = 'Ekle';
  document.getElementById('storeCancelBtn').classList.add('hidden');
  await listStores();
};
document.getElementById('storeCancelBtn').onclick = () => {
  editingStoreId = null;
  document.getElementById('storeForm').reset();
  document.getElementById('storeSaveBtn').textContent = 'Ekle';
  document.getElementById('storeCancelBtn').classList.add('hidden');
};
async function listStores() {
  const r = await fetch(api()+'/api/stores', { headers: getHeaders() });
  let stores = await r.json();
  storesCache = Array.isArray(stores) ? stores : [];
  const el = document.getElementById('storesResult');
  if (Array.isArray(stores)) {
    let html = `<table><tr>
      <th>ID</th><th>Adı</th><th>Adres</th><th>Düzenle</th><th>Sil</th>
    </tr>`;
    stores.forEach(s => {
      html += `<tr>
        <td>${s.id}</td>
        <td>${s.name || ''}</td>
        <td>${s.address || ''}</td>
        <td><button type="button" class="edit-store-btn" data-id="${s.id}">Düzenle</button></td>
        <td><button type="button" class="delete-store-btn" data-id="${s.id}">Sil</button></td>
      </tr>`;
    });
    html += `</table>`;
    el.innerHTML = html;

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
    el.textContent = typeof stores === "string" ? stores : JSON.stringify(stores, null, 2);
  }
}
function startEditStore(id) {
  const store = storesCache.find(s => String(s.id) === String(id));
  if (!store) return;
  editingStoreId = store.id;
  document.getElementById('storeId').value = store.id || '';
  document.getElementById('storeName').value = store.name || '';
  document.getElementById('storeAddress').value = store.address || '';
  document.getElementById('storeSaveBtn').textContent = 'Kaydet';
  document.getElementById('storeCancelBtn').classList.remove('hidden');
}
async function deleteStore(id) {
  if (!confirm('Mağazayı silmek istediğinize emin misiniz?')) return;
  const r = await fetch(api() + '/api/stores/' + id, { method:'DELETE', headers: getHeaders() });
  handleResult('storesResult', await r.json());
  await listStores();
}

// === KULLANICI CRUD ===
document.getElementById('userForm').onsubmit = async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const data = Object.fromEntries(fd.entries());
  if (editingUserId && !data.password) delete data.password;
  if (data.id === "") delete data.id;
  let method = editingUserId ? 'PUT' : 'POST';
  let url = api() + '/api/users' + (editingUserId ? '/' + editingUserId : '');
  const r = await fetch(url, { method, headers:getHeaders(), body:JSON.stringify(data) });
  handleResult('usersResult', await r.json());
  e.target.reset();
  editingUserId = null;
  document.getElementById('userSaveBtn').textContent = 'Ekle';
  document.getElementById('userCancelBtn').classList.add('hidden');
  await listUsers();
};
document.getElementById('userCancelBtn').onclick = () => {
  editingUserId = null;
  document.getElementById('userForm').reset();
  document.getElementById('userSaveBtn').textContent = 'Ekle';
  document.getElementById('userCancelBtn').classList.add('hidden');
};
async function listUsers() {
  const r = await fetch(api()+'/api/users', { headers:getHeaders() });
  let users = await r.json();
  usersCache = Array.isArray(users) ? users : [];
  const el = document.getElementById('usersResult');
  if (Array.isArray(users)) {
    let html = `<table><tr>
      <th>ID</th><th>Kullanıcı Adı</th><th>Rol</th><th>Store ID</th><th>Düzenle</th><th>Sil</th>
    </tr>`;
    users.forEach(u => {
      html += `<tr>
        <td>${u.id}</td>
        <td>${u.username}</td>
        <td>${u.role}</td>
        <td>${u.store_id}</td>
        <td><button type="button" class="edit-user-btn" data-id="${u.id}">Düzenle</button></td>
        <td><button type="button" class="delete-user-btn" data-id="${u.id}">Sil</button></td>
      </tr>`;
    });
    html += `</table>`;
    el.innerHTML = html;

    el.querySelectorAll('.edit-user-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        startEditUser(this.getAttribute('data-id'));
      });
    });
    el.querySelectorAll('.delete-user-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        deleteUser(this.getAttribute('data-id'));
      });
    });
  } else {
    el.textContent = typeof users === "string" ? users : JSON.stringify(users, null, 2);
  }
}
function startEditUser(id) {
  const user = usersCache.find(u => String(u.id) === String(id));
  if (!user) return;
  editingUserId = user.id;
  document.getElementById('userId').value = user.id || '';
  document.getElementById('username').value = user.username || '';
  document.getElementById('role').value = user.role || '';
  document.getElementById('store_id').value = user.store_id || '';
  document.getElementById('password').value = '';
  document.getElementById('userSaveBtn').textContent = 'Kaydet';
  document.getElementById('userCancelBtn').classList.remove('hidden');
}
async function deleteUser(id) {
  if (!confirm('Kullanıcıyı silmek istediğinize emin misiniz?')) return;
  const r = await fetch(api() + '/api/users/' + id, { method:'DELETE', headers:getHeaders() });
  handleResult('usersResult', await r.json());
  await listUsers();
}

// === ÜRÜN CRUD ===
document.getElementById('productForm').onsubmit = async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const data = Object.fromEntries(fd.entries());
  if (data.id === "") delete data.id;
  let method = editingProductId ? 'PUT' : 'POST';
  let url = api() + '/api/products' + (editingProductId ? '/' + editingProductId : '');
  const r = await fetch(url, { method, headers:getHeaders(), body:JSON.stringify(data) });
  handleResult('productsResult', await r.json());
  e.target.reset();
  editingProductId = null;
  document.getElementById('productSaveBtn').textContent = 'Ekle';
  document.getElementById('productCancelBtn').classList.add('hidden');
  await listProducts();
};
document.getElementById('productCancelBtn').onclick = () => {
  editingProductId = null;
  document.getElementById('productForm').reset();
  document.getElementById('productSaveBtn').textContent = 'Ekle';
  document.getElementById('productCancelBtn').classList.add('hidden');
};
async function listProducts() {
  const r = await fetch(api()+'/api/products', { headers:getHeaders() });
  let products = await r.json();
  productsCache = Array.isArray(products) ? products : [];
  const el = document.getElementById('productsResult');
  if (Array.isArray(products)) {
    let html = `<table><tr>
      <th>ID</th><th>Ad</th><th>Marka</th><th>Model</th><th>IMEI</th><th>Adet</th><th>Min</th>
      <th>Alış Fiyatı</th><th>Satış Fiyatı</th><th>Düzenle</th><th>Sil</th>
    </tr>`;
    products.forEach(p => {
      html += `<tr>
        <td>${p.id}</td>
        <td>${p.name}</td>
        <td>${p.brand || ''}</td>
        <td>${p.model || ''}</td>
        <td>${p.imei || ''}</td>
        <td>${p.quantity || ''}</td>
        <td>${p.min_quantity || ''}</td>
        <td>${p.purchase_price || ''}</td>
        <td>${p.sale_price || ''}</td>
        <td><button type="button" class="edit-product-btn" data-id="${p.id}">Düzenle</button></td>
        <td><button type="button" class="delete-product-btn" data-id="${p.id}">Sil</button></td>
      </tr>`;
    });
    html += `</table>`;
    el.innerHTML = html;

    el.querySelectorAll('.edit-product-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        startEditProduct(this.getAttribute('data-id'));
      });
    });
    el.querySelectorAll('.delete-product-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        deleteProduct(this.getAttribute('data-id'));
      });
    });
  } else {
    el.textContent = typeof products === "string" ? products : JSON.stringify(products, null, 2);
  }
}
function startEditProduct(id) {
  const product = productsCache.find(p => String(p.id) === String(id));
  if (!product) return;
  editingProductId = product.id;
  document.getElementById('productId').value = product.id || '';
  document.getElementById('productName').value = product.name || '';
  document.getElementById('productBrand').value = product.brand || '';
  document.getElementById('productModel').value = product.model || '';
  document.getElementById('productIMEI').value = product.imei || '';
  document.getElementById('productQuantity').value = product.quantity || '';
  document.getElementById('productMinQuantity').value = product.min_quantity || '';
  document.getElementById('productPurchasePrice').value = product.purchase_price || '';
  document.getElementById('productSalePrice').value = product.sale_price || '';
  document.getElementById('productSaveBtn').textContent = 'Kaydet';
  document.getElementById('productCancelBtn').classList.remove('hidden');
}
async function deleteProduct(id) {
  if (!confirm('Ürünü silmek istediğinize emin misiniz?')) return;
  const r = await fetch(api() + '/api/products/' + id, { method:'DELETE', headers:getHeaders() });
  handleResult('productsResult', await r.json());
  await listProducts();
}

// === MÜŞTERİ CRUD ===
document.getElementById('customerForm').onsubmit = async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const data = Object.fromEntries(fd.entries());
 if (data.tc_no) {
    data.tckn = data.tc_no;
    delete data.tc_no;
  }
  data.consent_personal_data = !!document.getElementById('customerConsentPersonalData').checked;
  if (data.id === "") delete data.id;
  let method = editingCustomerId ? 'PUT' : 'POST';
  let url = api() + '/api/customers' + (editingCustomerId ? '/' + editingCustomerId : '');
  const r = await fetch(url, { method, headers:getHeaders(), body:JSON.stringify(data) });
  handleResult('customersResult', await r.json());
  e.target.reset();
  editingCustomerId = null;
  document.getElementById('customerSaveBtn').textContent = 'Ekle';
  document.getElementById('customerCancelBtn').classList.add('hidden');
  await listCustomers();
};
document.getElementById('customerCancelBtn').onclick = () => {
  editingCustomerId = null;
  document.getElementById('customerForm').reset();
  document.getElementById('customerSaveBtn').textContent = 'Ekle';
  document.getElementById('customerCancelBtn').classList.add('hidden');
};
async function listCustomers() {
  const r = await fetch(api()+'/api/customers', { headers:getHeaders() });
  let customers = await r.json();
  customersCache = Array.isArray(customers) ? customers : [];
  const el = document.getElementById('customersResult');
  if (Array.isArray(customers)) {
    let html = `<table><tr>
      <th>ID</th><th>Ad</th><th>Soyad</th><th>Email</th><th>Adres</th><th>Doğum Tarihi</th><th>TC No</th><th>Düzenle</th><th>Sil</th>
    </tr>`;
    customers.forEach(c => {
      html += `<tr>
        <td>${c.id}</td>
        <td>${c.name}</td>
        <td>${c.surname}</td>
        <td>${c.email || ''}</td>
        <td>${c.address || ''}</td>
        <td>${c.birthdate || ''}</td>
        <td>${c.tc_no || ''}</td>
        <td><button type="button" class="edit-customer-btn" data-id="${c.id}">Düzenle</button></td>
        <td><button type="button" class="delete-customer-btn" data-id="${c.id}">Sil</button></td>
      </tr>`;
    });
    html += `</table>`;
    el.innerHTML = html;

    el.querySelectorAll('.edit-customer-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        startEditCustomer(this.getAttribute('data-id'));
      });
    });
    el.querySelectorAll('.delete-customer-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        deleteCustomer(this.getAttribute('data-id'));
      });
    });
  } else {
    el.textContent = typeof customers === "string" ? customers : JSON.stringify(customers, null, 2);
  }
}
function startEditCustomer(id) {
  const customer = customersCache.find(c => String(c.id) === String(id));
  if (!customer) return;
  editingCustomerId = customer.id;
  document.getElementById('customerId').value = customer.id || '';
  document.getElementById('customerName').value = customer.name || '';
  document.getElementById('customerSurname').value = customer.surname || '';
  document.getElementById('customerEmail').value = customer.email || '';
  document.getElementById('customerAddress').value = customer.address || '';
  document.getElementById('customerBirthdate').value = customer.birthdate || '';
  document.getElementById('customerTC').value = customer.tc_no || '';
  document.getElementById('customerSaveBtn').textContent = 'Kaydet';
  document.getElementById('customerCancelBtn').classList.remove('hidden');
}
async function deleteCustomer(id) {
  if (!confirm('Müşteriyi silmek istediğinize emin misiniz?')) return;
  const r = await fetch(api() + '/api/customers/' + id, { method:'DELETE', headers:getHeaders() });
  handleResult('customersResult', await r.json());
  await listCustomers();
}

// === SATIŞ CRUD ===
document.getElementById('saleForm').onsubmit = async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  let productVal = fd.get('product_id');
  let customerVal = fd.get('customer_id');
  if(productVal && productVal.includes(' - ')) productVal = productVal.split(' - ')[0];
  if(customerVal && customerVal.includes(' - ')) customerVal = customerVal.split(' - ')[0];
  const data = Object.fromEntries(fd.entries());
  if (data.id === "") delete data.id;
  data.product_id = productVal;
  if(customerVal) data.customer_id = customerVal;
  let method = editingSaleId ? 'PUT' : 'POST';
  let url = api() + '/api/sales' + (editingSaleId ? '/' + editingSaleId : '');
  const r = await fetch(url, { method, headers:getHeaders(), body:JSON.stringify(data) });
  handleResult('salesResult', await r.json());
  e.target.reset();
  editingSaleId = null;
  document.getElementById('saleSaveBtn').textContent = 'Ekle';
  document.getElementById('saleCancelBtn').classList.add('hidden');
  await listProducts();
  await listSales();
};
document.getElementById('saleCancelBtn').onclick = () => {
  editingSaleId = null;
  document.getElementById('saleForm').reset();
  document.getElementById('saleSaveBtn').textContent = 'Ekle';
  document.getElementById('saleCancelBtn').classList.add('hidden');
};
async function listSales() {
  const r = await fetch(api()+'/api/sales', { headers:getHeaders() });
  let sales = await r.json();
  salesCache = Array.isArray(sales) ? sales : [];
  const el = document.getElementById('salesResult');
  if (Array.isArray(sales)) {
    let html = `<table><tr>
      <th>ID</th><th>Ürün</th><th>Müşteri</th><th>Kullanıcı</th><th>Adet</th><th>Satış Fiyatı</th><th>Düzenle</th><th>Sil</th>
    </tr>`;
    sales.forEach(s => {
      html += `<tr>
        <td>${s.id}</td>
        <td>${s.product_name || s.product_id}</td>
        <td>${(s.customer_name || s.customer_id) + ' ' + (s.customer_surname || '')}</td>
        <td>${s.user_name || s.user_id}</td>
        <td>${s.quantity}</td>
        <td>${s.price_at_sale}</td>
        <td><button type="button" class="edit-sale-btn" data-id="${s.id}">Düzenle</button></td>
        <td><button type="button" class="delete-sale-btn" data-id="${s.id}">Sil</button></td>
      </tr>`;
    });
    html += `</table>`;
    el.innerHTML = html;

    el.querySelectorAll('.edit-sale-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        startEditSale(this.getAttribute('data-id'));
      });
    });
    el.querySelectorAll('.delete-sale-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        deleteSale(this.getAttribute('data-id'));
      });
    });
  } else {
    el.textContent = typeof sales === "string" ? sales : JSON.stringify(sales, null, 2);
  }
}
function startEditSale(id) {
  const sale = salesCache.find(s => String(s.id) === String(id));
  if (!sale) return;
  editingSaleId = sale.id;
  document.getElementById('saleId').value = sale.id || '';
  document.getElementById('productSearch').value = sale.product_id;
  document.getElementById('customerSearch').value = sale.customer_id || '';
  document.getElementById('saleQuantity').value = sale.quantity || '';
  document.getElementById('salePrice').value = sale.price_at_sale || '';
  document.getElementById('saleIMEI').value = sale.imei || '';
  document.getElementById('saleSaveBtn').textContent = 'Kaydet';
  document.getElementById('saleCancelBtn').classList.remove('hidden');
}
async function deleteSale(id) {
  if (!confirm('Satışı silmek istediğinize emin misiniz?')) return;
  const r = await fetch(api() + '/api/sales/' + id, { method:'DELETE', headers:getHeaders() });
  handleResult('salesResult', await r.json());
  await listSales();
  await listProducts();
}

// === Buton Bağlama ===
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('storesListBtn').onclick = listStores;
  document.getElementById('usersListBtn').onclick = listUsers;
  document.getElementById('productsListBtn').onclick = listProducts;
  document.getElementById('customersListBtn').onclick = listCustomers;
  document.getElementById('salesListBtn').onclick = listSales;
});