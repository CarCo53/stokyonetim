const { Consent, Customer, User } = require('../models');

exports.listConsents = async (req, res, next) => {
  try {
    const consents = await Consent.findAll({
      include: [
        { model: Customer, attributes: ['id', 'name', 'surname'] },
        { model: User, attributes: ['id', 'username', 'role'] }
      ]
    });
    res.json(consents);
  } catch (err) {
    next(err);
  }
};