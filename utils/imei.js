// IMEI: 15 haneli, Luhn algoritması ile kontrol
function validateIMEI(imei) {
  if (!/^\d{15}$/.test(imei)) return false;
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let num = parseInt(imei.charAt(i));
    if (i % 2 === 1) { // çift indexler (0 bazlı) ikiyle çarpılıp toplanır
      num *= 2;
      if (num > 9) num -= 9;
    }
    sum += num;
  }
  return sum % 10 === 0;
}
module.exports = validateIMEI;