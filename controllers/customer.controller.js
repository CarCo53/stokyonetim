const { Customer, Consent } = require('../models');
const validateTCKN = require('../utils/tckn');

exports.createCustomer = async (req, res, next) => {
  try {
    const { name, surname, birthdate, tckn, consent_personal_data } = req.body;
    if (!name || !surname) return res.status(400).json({ error: 'Name and surname required' });

    // Kişisel veri rızası olmadan doğum tarihi ve TCKN girilemez
    if ((birthdate || tckn) && !consent_personal_data) {
      return res.status(400).json({ error: 'Consent required for personal data fields' });
    }

    // TCKN varsa doğrula
    if (tckn) {
      if (!validateTCKN(tckn)) return res.status(400).json({ error: 'Invalid TCKN' });
    }

    // Kaydı oluştur
    const customer = await Customer.create({
      name, surname,
      birthdate: consent_personal_data ? birthdate : null,
      tckn: consent_personal_data ? tckn : null,
      consent_personal_data: !!consent_personal_data
    });

    // Consent logla
    await Consent.create({
      customer_id: customer.id,
      consent_type: "kvkk",
      consent_value: !!consent_personal_data,
      consent_date: new Date(),
      ip_address: req.ip,
      user_id: req.user.id
    });

    res.status(201).json({ message: "Customer created", customer });
  } catch (err) {
    next(err);
  }
};