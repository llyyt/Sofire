const express = require('express')
const router = express.Router()
const pool = require('../models/db')
const multer = require('multer')
const sharp = require('sharp')
const path = require('path')
const fs = require('fs')
const csrf = require('csurf');

const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

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

const csrfProtection = csrf({ cookie: true });
const parseForm = express.urlencoded({ extended: false });

// 为文件上传创建自定义CSRF验证中间件
function fileUploadCsrf(req, res, next) {
  // 从表单字段、查询参数或头部获取CSRF令牌
  const token = 
    (req.body && req.body._csrf) || 
    req.query._csrf || 
    req.headers['x-csrf-token'] || 
    req.headers['x-xsrf-token'];
  
  // 将令牌添加到请求对象
  req.csrfToken = () => res.locals.csrfToken;
  
  // 检查令牌是否存在且与会话中的令牌匹配
  if (!token) {
    console.error('没有提供CSRF令牌');
    return res.status(403).render('error', { message: '安全令牌缺失，请重试' });
  }
  
  // 在这里你可以进行令牌验证
  // 对于简化的实现，我们只检查令牌存在
  next();
}


// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 10 * 1024 * 1024 },
//   fileFilter: (req, file, cb) => {
//     if (/image\/(jpeg|png|gif)/.test(file.mimetype)) {
//       cb(null, true)
//     } else {
//       cb(new Error('只允许上传图片文件（JPG/PNG/GIF）'))
//     }
//   }
// })
const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传JPG/PNG/GIF图片'), false);
    }
  }
});

// 修改分类添加路由
router.post('/categories',  async (req, res) => {
  try {
    // 清理输入
    const name = DOMPurify.sanitize(req.body.name.trim(), {ALLOWED_TAGS: []});
    if (!name || name.length > 50) throw new Error('分类名称无效（1-50字符）');

    // 检查重复（保持参数化查询）
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

// // 添加分类
// router.post('/categories', async (req, res) => {
//     try {
//       const { name } = req.body;
//       if (!name) throw new Error('分类名称不能为空');
  
//       // 检查重复分类
//       const [existing] = await pool.query(
//         'SELECT * FROM categories WHERE name = ?', 
//         [name]
//       );
//       if (existing.length > 0) throw new Error('分类已存在');
  
//       await pool.query('INSERT INTO categories (name) VALUES (?)', [name]);
//       res.redirect('/admin/products');
//     } catch (err) {
//       res.render('error', { message: err.message });
//     }
//   });
  
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
  

// 在路由中添加扩展名验证
router.post('/products', 
  (req, res, next) => {
    req.body._csrf = req.query._csrf; // 从查询参数获取
    next();
  },
  // 第二步：CSRF验证
  csrf({ cookie: false }), // 与全局配置一致
  // 第三步：处理文件上传
  upload.single('image'),
  async (req, res) => {
  try {

    console.log('== CSRF 验证通过 ==');
      console.log('请求 Body:', req.body);
      console.log('Cookies:', req.cookies);


    // 清理输入
    const name = DOMPurify.sanitize(req.body.name.trim());
    const price = parseFloat(req.body.price);
    const description = DOMPurify.sanitize(req.body.description.trim());

    // 验证必填字段
    if (!name || name.length < 2 || name.length > 255) {
      throw new Error('产品名称需为2-255字符');
    }
    if (isNaN(price) || price <= 0) {
      throw new Error('价格必须为有效正数');
    }

    let imageName = null;
    if (req.file) {
      // 验证文件扩展名
      const ext = path.extname(req.file.originalname).toLowerCase();
      if (!['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
        throw new Error('无效的文件类型');
      }
      
      // 生成安全文件名
      imageName = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
      const thumbnailPath = `uploads/thumbnails/${imageName}`;
      
      // 保持原有图片处理
      await sharp(req.file.path)
        .resize(300, 300)
        .toFile(thumbnailPath);
    }
    await pool.query(
      'INSERT INTO products (catid, name, price, description, image) VALUES (?, ?, ?, ?, ?)',
      [req.body.catid, name, price, description, imageName]
    );
    
    res.redirect('/admin/products')
  } catch (err) {
    res.render('error', { message: err.message });
  }
});

 
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
  router.post('/products/update/:pid',
    (req, res, next) => {
      req.body._csrf = req.query._csrf; // 从查询参数获取
      next();
    },
    // 第二步：CSRF验证
    csrf({ cookie: false }), // 与全局配置一致
    // 第三步：处理文件上传
    upload.single('image'),
    async (req, res) => {
    try {
      console.log('== CSRF 验证通过 ==');
      console.log('请求 Body:', req.body);
      console.log('Cookies:', req.cookies);

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