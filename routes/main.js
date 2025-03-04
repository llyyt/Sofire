const express = require('express');
const router = express.Router();
const pool = require('../models/db');

router.get('/', async (req, res, next) => {
  try {
    const [categories] = await pool.query('SELECT * FROM categories');
    const [products] = await pool.query(`
      SELECT p.*, c.name AS category_name 
      FROM products p
      JOIN categories c ON p.catid = c.catid
      ORDER BY p.created_at DESC LIMIT 8
    `);
    res.render('main/index', { categories, products });
  } catch (err) {
    next(err);
  }
});

router.get('/category/:catid', async (req, res, next) => {
  try {
    // 获取分类信息
    const [category] = await pool.query(
      'SELECT * FROM categories WHERE catid = ?', 
      [req.params.catid]
    );

    // 获取分类商品
    const [products] = await pool.query(`
      SELECT p.*, c.name AS category_name 
      FROM products p
      JOIN categories c ON p.catid = c.catid
      WHERE p.catid = ?
      ORDER BY p.created_at DESC
    `, [req.params.catid]);

    if (category.length === 0) {
      return res.status(404).render('error', {
        message: '分类不存在'
      });
    }

    res.render('main/category', {
      category: category[0],
      products
    });
  } catch (err) {
    next(err);
  }
});

router.get('/product/:pid', async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, c.name AS category_name 
      FROM products p
      JOIN categories c ON p.catid = c.catid
      WHERE p.pid = ?
    `, [req.params.pid]);
    
    res.render('main/product', { product: rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;