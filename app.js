require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();

// 数据库连接
require('./models/db');

// 模板引擎设置
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 配置 session 中间件
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use((req, res, next) => {
  // 从 session 或数据库获取购物车数据（示例数据）
  const cartItems = req.session.cart || [
    { pid: "P001", name: "测试商品", price: 99.99, quantity: 2 }
  ];

  // 注入模板变量
  res.locals.cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  res.locals.cartItems = cartItems;
  res.locals.totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  next();
});

// // 添加在购物车中间件之后测试购物车数据
// app.use((req, res, next) => {
//   console.log('当前购物车数据：', {
//     cartItemCount: res.locals.cartItemCount,
//     cartItems: res.locals.cartItems,
//     totalPrice: res.locals.totalPrice
//   });
//   next();
// });

// 中间件
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.urlencoded({ extended: true }));

// 路由
app.use('/', require('./routes/main'));
// app.use('/admin', require('./routes/admin'));

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { message: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});