const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Customer', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    surname: { type: DataTypes.STRING, allowNull: false },
    birthdate: { type: DataTypes.DATEONLY, allowNull: true },
    tckn: { type: DataTypes.STRING(11), allowNull: true, validate: { len: [11, 11] } },
    consent_personal_data: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'customers',
    timestamps: false
  });
};