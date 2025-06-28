function api() {
  return localStorage.getItem('apiurl') || "http://localhost:3001";
}
function getHeaders() {
  const h = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('jwt_token');
  if (token) h['Authorization'] = 'Bearer ' + token;
  return h;
}