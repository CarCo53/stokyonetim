// Ortak fonksiyon: Header'a JWT token ekle
function authHeaders() {
  const token = localStorage.getItem('jwt_token');
  return token ? { 'Authorization': 'Bearer ' + token } : {};
}