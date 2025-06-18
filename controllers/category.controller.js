const { Category } = require('../models');

exports.createCategory = async (req, res, next) => {
  try {
    const { name, requires_imei, store_id } = req.body;
    if (!name || typeof requires_imei === "undefined" || !store_id)
      return res.status(400).json({ error: "Name, requires_imei and store_id required" });

    const category = await Category.create({
      name,
      requires_imei: !!requires_imei,
      store_id,
      created_at: new Date()
    });

    res.status(201).json({ message: "Category created", category });
  } catch (err) {
    next(err);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const { name, requires_imei } = req.body;
    const { id } = req.params;
    const category = await Category.findByPk(id);
    if (!category) return res.status(404).json({ error: "Category not found" });

    if (typeof name !== "undefined") category.name = name;
    if (typeof requires_imei !== "undefined") category.requires_imei = !!requires_imei;

    await category.save();
    res.json({ message: "Category updated", category });
  } catch (err) {
    next(err);
  }
};

exports.listCategories = async (req, res, next) => {
  try {
    // Kendi mağazası için (isteğe göre filtre eklenebilir)
    const { store_id } = req.query;
    const where = store_id ? { store_id } : undefined;
    const categories = await Category.findAll({ where });
    res.json(categories);
  } catch (err) {
    next(err);
  }
};