const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Product', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    barcode: { type: DataTypes.STRING, allowNull: false },
    category_id: { type: DataTypes.INTEGER, allowNull: false },
    stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    min_quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    price: { type: DataTypes.DECIMAL(12,2), allowNull: false },
    imei1: { type: DataTypes.STRING(15), allowNull: true },
    imei2: { type: DataTypes.STRING(15), allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'products',
    timestamps: false
  });
};