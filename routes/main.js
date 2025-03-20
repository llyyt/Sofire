const express = require('express');
const router = express.Router();
const pool = require('../models/db');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');

// 初始化 DOM Purify
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// 验证中间件
const validateId = (idParam) => (req, res, next) => {
  const id = parseInt(req.params[idParam], 10);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: `Invalid ${idParam}` });
  }
  req.validatedId = id;
  next();
};

// 产品消毒中间件
const sanitizeProduct = (product) => {
  return {
    ...product,
    name: DOMPurify.sanitize(product.name),
    description: DOMPurify.sanitize(product.description, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: []
    })
  };
};


router.get('/', async (req, res, next) => {
  try {
    const [categories] = await pool.query('SELECT * FROM categories');
    const [products] = await pool.query(`
      SELECT p.*, c.name AS category_name 
      FROM products p
      JOIN categories c ON p.catid = c.catid
      ORDER BY p.created_at DESC LIMIT 8
    `);
    //res.render('main/index', { categories, products });
    const sanitizedProducts = products.map(sanitizeProduct);
    res.render('main/index', { 
      categories,
      products: sanitizedProducts,
      csrfToken: req.csrfToken() 
    });
  } catch (err) {
    next(err);
  }
});


router.get('/category/:catid', validateId('catid'), async (req, res, next) => {
  try {
    const [category] = await pool.query(
      'SELECT * FROM categories WHERE catid = ?', 
      [req.validatedId]
    );

    if (!category.length) {
      return res.status(404).render('error', { message: '分类不存在' });
    }

    const [products] = await pool.query(`
      SELECT p.*, c.name AS category_name 
      FROM products p
      JOIN categories c ON p.catid = c.catid
      WHERE p.catid = ?
      ORDER BY p.created_at DESC
    `, [req.validatedId]);

    res.render('main/category', {
      category: category[0],
      products: products.map(sanitizeProduct),
      csrfToken: req.csrfToken()
    });
  } catch (err) {
    next(err);
  }
});

router.get('/product/:pid', validateId('pid'), async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, c.name AS category_name 
      FROM products p
      JOIN categories c ON p.catid = c.catid
      WHERE p.pid = ?
    `, [req.validatedId]);
    
    if (!rows.length) {
      return res.status(404).render('error', { message: '商品不存在' });
    }

    res.render('main/product', { 
      product: sanitizeProduct(rows[0]),
      csrfToken: req.csrfToken()
    });
  } catch (err) {
    next(err);
  }
});


// 获取商品信息接口
router.get('/api/products/:pid', validateId('pid'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT pid, name, price, image FROM products WHERE pid = ?',
      [req.validatedId]
    );
    
    if (!rows.length) {
      return res.status(404).json({ error: '商品不存在' });
    }
    
    res.json(sanitizeProduct(rows[0]));
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;