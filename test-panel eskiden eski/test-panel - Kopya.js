// === Yardımcılar ===
const api = () => document.getElementById('apiurl').value;
let token = "";
let currentUser = null;
let currentStoreId = null;
let productsCache = [];
let customersCache = [];

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

function getHeaders() {
  const h = { 'Content-Type': 'application/json' };
  if(token) h['Authorization'] = 'Bearer ' + token;
  return h;
}

// ========== MAĞAZA & KULLANICI CRUD ==========
document.getElementById('storeForm').onsubmit = async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const data = Object.fromEntries(fd.entries());
  const r = await fetch(api()+'/api/stores', {
    method:'POST', headers:getHeaders(), body:JSON.stringify(data)
  });
  handleResult('storesResult', await r.json());
};
async function listStores() {
  const r = await fetch(api()+'/api/stores', { headers: getHeaders() });
  handleResult('storesResult', await r.json());
}
document.getElementById('userForm').onsubmit = async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const data = Object.fromEntries(fd.entries());
  const r = await fetch(api()+'/api/users', {
    method:'POST', headers:getHeaders(), body:JSON.stringify(data)
  });
  handleResult('usersResult', await r.json());
};
async function listUsers() {
  const r = await fetch(api()+'/api/users', { headers:getHeaders() });
  handleResult('usersResult', await r.json());
}

// ========== LOGIN ==========
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

// LOGOUT
document.getElementById('logoutBtn').onclick = () => {
  token = "";
  currentUser = null;
  currentStoreId = null;
  document.getElementById('userStatus').textContent = '';
  document.getElementById('loginFieldset').classList.remove('hidden');
  document.getElementById('userbar').classList.add('hidden');
  document.getElementById('loginStatus').textContent = 'Çıkış yapıldı.';
};

// Kullanıcı ve mağaza bilgisi çek
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

// ========== ÜRÜN ==========
document.getElementById('productForm').onsubmit = async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const data = Object.fromEntries(fd.entries());
  const r = await fetch(api()+'/api/products', {
    method:'POST', headers:getHeaders(), body:JSON.stringify(data)
  });
  handleResult('productsResult', await r.json());
};
async function listProducts() {
  const r = await fetch(api()+'/api/products', { headers:getHeaders() });
  handleResult('productsResult', await r.json());
}

// ========== MÜŞTERİ ==========
document.getElementById('customerForm').onsubmit = async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const data = Object.fromEntries(fd.entries());
  const r = await fetch(api()+'/api/customers', {
    method:'POST', headers:getHeaders(), body:JSON.stringify(data)
  });
  handleResult('customersResult', await r.json());
};
async function listCustomers() {
  const r = await fetch(api()+'/api/customers', { headers:getHeaders() });
  handleResult('customersResult', await r.json());
}

// ========== SATIŞ ==========
document.getElementById('saleForm').onsubmit = async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  let productVal = fd.get('product_id');
  let customerVal = fd.get('customer_id');
  if(productVal && productVal.includes(' - ')) productVal = productVal.split(' - ')[0];
  if(customerVal && customerVal.includes(' - ')) customerVal = customerVal.split(' - ')[0];
  const data = Object.fromEntries(fd.entries());
  data.product_id = productVal;
  if(customerVal) data.customer_id = customerVal;
  const r = await fetch(api()+'/api/sales', {
    method:'POST', headers:getHeaders(), body:JSON.stringify(data)
  });
  handleResult('salesResult', await r.json());
  await listProducts();
  await listSales();
};
async function listSales() {
  const r = await fetch(api()+'/api/sales', { headers:getHeaders() });
  handleResult('salesResult', await r.json());
}

// ========== Genel Result Helper ==========
function handleResult(id, data) {
  document.getElementById(id).textContent =
    typeof data === "string" ? data : JSON.stringify(data, null, 2);
}

// ========== CSP UYUMLU BUTON BAĞLAMA ==========
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('storesListBtn').onclick = listStores;
  document.getElementById('usersListBtn').onclick = listUsers;
  document.getElementById('productsListBtn').onclick = listProducts;
  document.getElementById('customersListBtn').onclick = listCustomers;
  document.getElementById('salesListBtn').onclick = listSales;
});