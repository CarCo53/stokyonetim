const crypto = require('crypto');
const ENCRYPTION_KEY = 'stokv1KvkkSecret!'; // .env ile de çekilebilir
const IV_LENGTH = 16;

function encrypt(text) {
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'utf8'), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
    let parts = text.split(':');
    let iv = Buffer.from(parts.shift(), 'hex');
    let encryptedText = parts.join(':');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'utf8'), iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

module.exports = { encrypt, decrypt };