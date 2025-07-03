module.exports = function isValidIMEI(imei) {
    if (!/^\d{15}$/.test(imei)) return false;
    let sum = 0;
    for (let i = 0; i < 15; i++) {
        let num = parseInt(imei.charAt(i));
        if (i % 2 === 1) num = num * 2 > 9 ? num * 2 - 9 : num * 2;
        sum += num;
    }
    return sum % 10 === 0;
};