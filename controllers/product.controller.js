const { Product, Category } = require('../models');
const validateIMEI = require('../utils/imei');

exports.createProduct = async (req, res, next) => {
  try {
    const {
      name, barcode, category_id, stock, min_quantity, price, imei1, imei2
    } = req.body;
    if (!name || !barcode || !category_id || typeof stock === "undefined" || typeof min_quantity === "undefined" || !price)
      return res.status(400).json({ error: "Missing fields" });

    // Kategori requires_imei ise IMEI kontrolleri zorunlu
    const category = await Category.findByPk(category_id);
    if (!category) return res.status(400).json({ error: "Category not found" });

    if (category.requires_imei) {
      if (!imei1) return res.status(400).json({ error: "IMEI1 required for this category" });
      if (!validateIMEI(imei1)) return res.status(400).json({ error: "IMEI1 invalid" });
      if (imei2 && !validateIMEI(imei2)) return res.status(400).json({ error: "IMEI2 invalid" });
    }

    // UNIQUE IMEI kuralı opsiyonel, istersen burada kontrol edebilirsin

    const product = await Product.create({
      name, barcode, category_id, stock, min_quantity, price,
      imei1: category.requires_imei ? imei1 : null,
      imei2: category.requires_imei && imei2 ? imei2 : null,
      created_at: new Date()
    });

    res.status(201).json({ message: "Product created", product });
  } catch (err) {
    next(err);
  }
};

exports.listProducts = async (req, res, next) => {
  try {
    // İsteğe bağlı mağaza/kategori filtreleri ekleyebilirsin
    const products = await Product.findAll();
    res.json(products);
  } catch (err) {
    next(err);
  }
};