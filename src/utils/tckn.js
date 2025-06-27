module.exports = function isValidTCKN(tckn) {
    if (!/^[1-9][0-9]{10}$/.test(tckn)) return false;
    const digits = tckn.split('').map(Number);
    const sumOdd = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
    const sumEven = digits[1] + digits[3] + digits[5] + digits[7];
    const check10 = ((sumOdd * 7 - sumEven) % 10 + 10) % 10;
    const check11 = (digits.slice(0, 10).reduce((a, b) => a + b, 0)) % 10;
    return digits[9] === check10 && digits[10] === check11;
};