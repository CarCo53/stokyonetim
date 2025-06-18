// Türkiye Cumhuriyeti Kimlik Numarası algoritma kontrolü
function validateTCKN(tckn) {
  if (!/^\d{11}$/.test(tckn)) return false;
  const digits = tckn.split('').map(Number);
  if (digits[0] === 0) return false;
  const sumOdd = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const sumEven = digits[1] + digits[3] + digits[5] + digits[7];
  const check1 = ((sumOdd * 7) - sumEven) % 10;
  if (check1 !== digits[9]) return false;
  const sumAll = digits.slice(0, 10).reduce((a, b) => a + b, 0);
  if (sumAll % 10 !== digits[10]) return false;
  return true;
}
module.exports = validateTCKN;