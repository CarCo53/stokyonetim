let token = '';
let user = null;

document.getElementById('loginForm').onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    let res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    let out = await res.json();
    if (res.ok) {
        token = out.token;
        user = out.user;
        document.getElementById('panel').style.display = '';
        document.getElementById('userInfo').innerText = user.username + ' (' + user.role + ')';
        document.getElementById('loginForm').style.display = 'none';
        loadModules();
    } else {
        document.getElementById('loginErr').innerText = out.message || 'Hata';
    }
};

function logout() {
    token = '';
    user = null;
    document.getElementById('panel').style.display = 'none';
    document.getElementById('loginForm').style.display = '';
    document.getElementById('modules').innerHTML = '';
    document.getElementById('loginErr').innerText = '';
}

function makeForm(fields, cb) {
    const form = document.createElement('form');
    fields.forEach(f => {
        let label = document.createElement('label');
        label.innerText = f.label + ': ';
        let input;
        if (f.type === 'select') {
            input = document.createElement('select');
            (f.options || []).forEach(opt => {
                let o = document.createElement('option');
                o.value = opt.value;
                o.innerText = opt.label;
                input.appendChild(o);
            });
        } else {
            input = document.createElement('input');
            input.type = f.type || 'text';
            if (f.value) input.value = f.value;
        }
        input.name = f.name;
        label.appendChild(input);
        form.appendChild(label);
    });
    let btn = document.createElement('button');
    btn.type = 'submit';
    btn.innerText = 'Gönder';
    form.appendChild(btn);
    let res = document.createElement('pre');
    form.appendChild(res);
    form.onsubmit = async e => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form));
        try {
            let out = await cb(data);
            res.innerText = JSON.stringify(out, null, 2);
        } catch (err) {
            res.innerText = err.message || 'Hata';
        }
    };
    return form;
}

async function loadModules() {
    const modules = document.getElementById('modules');
    modules.innerHTML = '';

    // Kategori ekle
    if (['admin', 'patron'].includes(user.role)) {
        modules.appendChild(document.createElement('hr'));
        modules.appendChild(document.createTextNode('Kategori Ekle'));
        modules.appendChild(makeForm([
            { name: 'name', label: 'Kategori Adı' },
            { name: 'requires_imei', label: 'IMEI Gerekli mi', type: 'select', options: [{ value: '0', label: 'Hayır' }, { value: '1', label: 'Evet' }] }
        ], async (data) => {
            let res = await fetch('/api/categories', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            return await res.json();
        }));
    }

    // Ürün ekle
    modules.appendChild(document.createElement('hr'));
    modules.appendChild(document.createTextNode('Ürün Ekle'));
    modules.appendChild(makeForm([
        { name: 'name', label: 'Ürün Adı' },
        { name: 'barcode', label: 'Barkod' },
        { name: 'category_id', label: 'Kategori ID' },
        { name: 'stock', label: 'Stok' },
        { name: 'min_quantity', label: 'Min. Miktar' },
        { name: 'price', label: 'Fiyat' },
        { name: 'imei1', label: 'IMEI 1 (varsa)' },
        { name: 'imei2', label: 'IMEI 2 (varsa)' }
    ], async (data) => {
        let res = await fetch('/api/products', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        return await res.json();
    }));

    // Müşteri ekle
    modules.appendChild(document.createElement('hr'));
    modules.appendChild(document.createTextNode('Müşteri Ekle'));
    modules.appendChild(makeForm([
        { name: 'name', label: 'Ad' },
        { name: 'surname', label: 'Soyad' },
        { name: 'birthdate', label: 'Doğum Tarihi (YYYY-MM-DD)' },
        { name: 'tckn', label: 'TCKN' },
        { name: 'consent_personal_data', label: 'KVKK Onayı (1:evet, 0:hayır)' }
    ], async (data) => {
        let res = await fetch('/api/customers', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        return await res.json();
    }));

    // Satış ekle
    modules.appendChild(document.createElement('hr'));
    modules.appendChild(document.createTextNode('Satış Ekle'));
    modules.appendChild(makeForm([
        { name: 'customer_id', label: 'Müşteri ID' },
        { name: 'product_id', label: 'Ürün ID' },
        { name: 'quantity', label: 'Adet' }
    ], async (data) => {
        let res = await fetch('/api/sales', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        return await res.json();
    }));

    // Listeleme örnekleri eklenebilir...
}