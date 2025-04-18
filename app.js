require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const helmet = require('helmet');
const crypto = require('crypto');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');
const app = express();
const MySQLStore = require('express-mysql-session')(session);
const authMiddleware = require('./middleware/auth');


// 初始化DOM净化
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);


const flash = require('connect-flash');

// 数据库连接
require('./models/db');

// CSP配置中间件
app.use((req, res, next) => {
  const nonce = crypto.randomBytes(16).toString('base64');
  res.locals.cspNonce = nonce;
  
  const cspHeader = `
    default-src 'self';
    script-src 'self' https://cdn.jsdelivr.net 'nonce-${nonce}';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: http://s19.iems5718.ie.cuhk.edu.hk/uploads/;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\n/g, "");
  
  res.setHeader('Content-Security-Policy', cspHeader);
  next();
});

// 安全头设置
app.use(helmet({
  contentSecurityPolicy: false, // 已手动设置
  hsts: { maxAge: 31536000, includeSubDomains: true },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
  noSniff: true,
  hidePoweredBy: true
}));

// 会话配置
app.use(session({
  secret: process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex'),
  resave: true,
  saveUninitialized: true,
  //store: new MySQLStore({ /* 数据库存储配置 */ }), // 使用持久化存
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
  }
}));
app.use(authMiddleware.injectUser);
app.use(flash());

// 中间件
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());


app.use(express.urlencoded({ extended: true }));


app.use(cookieParser(process.env.SESSION_SECRET));



app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success');
    res.locals.error_msg = req.flash('error');
    next();
  });


app.use(csrf({ cookie: false }));

// CSRF令牌中间件
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

// const csrfProtection = csrf({
//   cookie: {
//     key: '_csrf',
//     path: '/',
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//     sameSite: 'strict',
//     maxAge: 86400 // 24小时
//   }
// });

// // 全局应用
// app.use(csrfProtection);

// app.use((req, res, next) => {
//   console.log('Request URL:', req.url);
//   console.log('Session ID:', req.sessionID);
//   console.log('Session:', req.session);
//   console.log('CSRF Token:', req.csrfToken());
//   console.log('Headers:', req.headers);
//   next();
// });

// 模板引擎设置
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.set('trust proxy', 1);  // 添加代理支持

// 路由
app.use('/', require('./routes/main'));
//app.use('/admin', require('./routes/admin'));
app.use('/admin', authMiddleware.requireAuth, require('./routes/admin'));
app.use('/auth', require('./routes/auth'));

// 全局用户状态
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { message: err.message });
});
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    console.error('CSRF验证失败:', {
      url: req.originalUrl,
      method: req.method,
      headers: req.headers,
      cookies: req.cookies
    });
    return res.status(403).send('非法请求来源');
  }
  next(err);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});