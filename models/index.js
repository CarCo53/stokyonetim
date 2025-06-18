const Sequelize = require('sequelize');
const sequelize = require('../config/db');

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.User = require('./user')(sequelize);
db.Customer = require('./customer')(sequelize);
db.Product = require('./product')(sequelize);
db.Category = require('./category')(sequelize);
db.Consent = require('./consent')(sequelize);

// İlişkiler
db.Consent.belongsTo(db.Customer, { foreignKey: 'customer_id' });
db.Consent.belongsTo(db.User, { foreignKey: 'user_id' });
db.Product.belongsTo(db.Category, { foreignKey: 'category_id' });

module.exports = db;