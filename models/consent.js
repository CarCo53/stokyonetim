const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Consent', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    customer_id: { type: DataTypes.INTEGER, allowNull: false },
    consent_type: { type: DataTypes.STRING, allowNull: false }, // KVKK, ticari ileti, vs.
    consent_value: { type: DataTypes.BOOLEAN, allowNull: false },
    consent_date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    ip_address: { type: DataTypes.STRING, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false }
  }, {
    tableName: 'consents',
    timestamps: false
  });
};