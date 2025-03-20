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

// 初始化DOM净化
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

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
    img-src 'self' data: /uploads/;
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
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// 中间件
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(csrf({ cookie: true }));


// CSRF令牌中间件
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

// 模板引擎设置
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 路由
app.use('/', require('./routes/main'));
app.use('/admin', require('./routes/admin'));

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { message: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});