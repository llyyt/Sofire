const express = require('express')
const router = express.Router()
const pool = require('../models/db')
const multer = require('multer')
const sharp = require('sharp')
const path = require('path')

// 文件上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/original/')
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/image\/(jpeg|png|gif)/.test(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('只允许上传图片文件（JPG/PNG/GIF）'))
    }
  }
})

// 添加分类
router.post('/categories', async (req, res) => {
    try {
      const { name } = req.body;
      if (!name) throw new Error('分类名称不能为空');
  
      // 检查重复分类
      const [existing] = await pool.query(
        'SELECT * FROM categories WHERE name = ?', 
        [name]
      );
      if (existing.length > 0) throw new Error('分类已存在');
  
      await pool.query('INSERT INTO categories (name) VALUES (?)', [name]);
      res.redirect('/admin/products');
    } catch (err) {
      res.render('error', { message: err.message });
    }
  });
  
  // 删除分类
  router.post('/categories/delete/:catid', async (req, res) => {
    try {
      const catid = req.params.catid;
  
      // 检查是否有关联产品
      const [products] = await pool.query(
        'SELECT * FROM products WHERE catid = ?', 
        [catid]
      );
      if (products.length > 0) throw new Error('分类下存在商品，无法删除');
  
      await pool.query('DELETE FROM categories WHERE catid = ?', [catid]);
      res.redirect('/admin/products');
    } catch (err) {
      res.render('error', { message: err.message });
    }
  });
  
  // 更新分类名称
  router.post('/categories/update/:catid', async (req, res) => {
    try {
      const catid = req.params.catid;
      const { name } = req.body;
      if (!name) throw new Error('分类名称不能为空');
  
      const [existing] = await pool.query(
        'SELECT * FROM categories WHERE name = ? AND catid != ?',
        [name, catid]
      );
      if (existing.length > 0) throw new Error('分类名称已存在');
      
      await pool.query('UPDATE categories SET name = ? WHERE catid = ?', [name, catid]);
      res.redirect('/admin/products');
    } catch (err) {
      res.render('error', { message: err.message });
    }
  });



router.get('/products', async (req, res) => {
    try {
      const [categories] = await pool.query('SELECT * FROM categories')
      const [products] = await pool.query(`
        SELECT p.*, c.name AS category_name 
        FROM products p
        JOIN categories c ON p.catid = c.catid
      `)
      res.render('admin/products', { categories, products })
    } catch (err) {
      next(err)
    }
  })
  
  router.post('/products', upload.single('image'), async (req, res) => {
    try {
      // 输入验证
      if (!req.body.name || !req.body.price) {
        throw new Error('必须填写产品名称和价格')
      }
  
      // 处理图片
      let imageName = null
      if (req.file) {
        const thumbnailPath = `uploads/thumbnails/${req.file.filename}`
        await sharp(req.file.path)
          .resize(300, 300, { fit: 'inside' })
          .toFile(thumbnailPath)
        imageName = req.file.filename
      }
  
      // 插入数据库
      await pool.query(
        'INSERT INTO products SET ?',
        {
          catid: req.body.catid,
          name: req.body.name,
          price: req.body.price,
          description: req.body.description,
          image: imageName
        }
      )
      
      res.redirect('/admin/products')
    } catch (err) {
      res.render('error', { message: err.message })
    }
  })


// routes/admin.js
router.get('/products', async (req, res) => {
    try {
      const [categories] = await pool.query('SELECT * FROM categories')
      const [products] = await pool.query(`
        SELECT p.*, c.name AS category_name 
        FROM products p
        JOIN categories c ON p.catid = c.catid
      `)
      res.render('admin/products', { categories, products })
    } catch (err) {
      next(err)
    }
  })
  
  router.post('/products', upload.single('image'), async (req, res) => {
    try {
      // 输入验证
      if (!req.body.name || !req.body.price) {
        throw new Error('必须填写产品名称和价格')
      }
  
      // 处理图片
      let imageName = null
      if (req.file) {
        const thumbnailPath = `uploads/thumbnails/${req.file.filename}`
        await sharp(req.file.path)
          .resize(300, 300, { fit: 'inside' })
          .toFile(thumbnailPath)
        imageName = req.file.filename
      }
  
      // 插入数据库
      await pool.query(
        'INSERT INTO products SET ?',
        {
          catid: req.body.catid,
          name: req.body.name,
          price: req.body.price,
          description: req.body.description,
          image: imageName
        }
      )
      
      res.redirect('/admin/products')
    } catch (err) {
      res.render('error', { message: err.message })
    }
  })


// // routes/admin.js
// router.post('/products', upload.single('image'), async (req, res) => {
//     try {
//       // ...其他验证逻辑
  
//       if (req.file) {
//         // 生成缩略图
//         const thumbnailPath = `uploads/thumbnails/${req.file.filename}`
//         await sharp(req.file.path)
//           .resize(300, 300, { 
//             fit: 'inside',
//             withoutEnlargement: true
//           })
//           .toFile(thumbnailPath)
        
//         imageName = req.file.filename
//       }
  
//       // ...数据库插入逻辑
//     } catch (err) {
//       // ...错误处理
//     }
//   })

router.get('/products/edit/:pid', async (req, res, next) => {
    try {
      const [[product]] = await pool.query(`
        SELECT * FROM products WHERE pid = ?
      `, [req.params.pid])
  
      const [categories] = await pool.query('SELECT * FROM categories')
  
      if (!product) {
        return res.status(404).send('产品不存在')
      }
  
      res.render('admin/edit', {
        product,
        categories
      })
    } catch (err) {
      next(err)
    }
  })
  
  // 更新产品路由
  router.post('/products/update/:pid', upload.single('image'), async (req, res) => {
    try {
      const pid = req.params.pid
      const productData = {
        catid: req.body.catid,
        name: req.body.name,
        price: req.body.price,
        description: req.body.description
      }
  
      // 处理图片更新
      if (req.file) {
        // 生成新缩略图
        const thumbnailPath = `uploads/thumbnails/${req.file.filename}`
        await sharp(req.file.path)
          .resize(300, 300, { fit: 'inside' })
          .toFile(thumbnailPath)
        
        // 删除旧图片
        const [[oldProduct]] = await pool.query(
          'SELECT image FROM products WHERE pid = ?', 
          [pid]
        )
        if (oldProduct.image) {
          fs.unlinkSync(`uploads/original/${oldProduct.image}`)
          fs.unlinkSync(`uploads/thumbnails/${oldProduct.image}`)
        }
        
        productData.image = req.file.filename
      }
  
      await pool.query('UPDATE products SET ? WHERE pid = ?', [productData, pid])
      
      res.redirect('/admin/products')
    } catch (err) {
      res.render('error', { message: err.message })
    }
  })
  
  // 删除产品路由
  router.post('/products/delete/:pid', async (req, res) => {
    try {
      const pid = req.params.pid
  
      // 删除图片文件
      const [[product]] = await pool.query(
        'SELECT image FROM products WHERE pid = ?', 
        [pid]
      )
      if (product.image) {
        fs.unlinkSync(`uploads/original/${product.image}`)
        fs.unlinkSync(`uploads/thumbnails/${product.image}`)
      }
  
      // 删除数据库记录
      await pool.query('DELETE FROM products WHERE pid = ?', [pid])
      
      res.redirect('/admin/products')
    } catch (err) {
      res.render('error', { message: err.message })
    }
  })
module.exports = router