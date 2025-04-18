const express = require('express');
const router = express.Router();
const User = require('../models/user');
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: false });

// 登录页面
router.get('/login', csrfProtection, (req, res) => {
    res.render('auth/login', { 
        csrfToken: req.csrfToken(),
        message: req.flash('error') 
    });
});

// 登录处理
router.post('/login', csrfProtection, async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findByEmail(email);

        if (!user || !(await User.verifyPassword(user, password))) {
            req.flash('error', '邮箱或密码错误');
            return res.redirect('/auth/login');
        }

        if (!user.is_admin) {
            req.flash('error', '无权访问管理后台');
            return res.redirect('/auth/login');
        }

        // 创建新会话防止会话固定攻击
        req.session.regenerate(async (err) => {
            if (err) throw err;

            req.session.user = {
                id: user.userid,
                email: user.email,
                isAdmin: user.is_admin
            };

            // 设置会话cookie
            res.cookie('sessionId', req.sessionID, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 2 * 24 * 60 * 60 * 1000 // 2天
            });

            res.redirect('/admin/products');
        });
    } catch (err) {
        res.status(500).render('error', { message: err.message });
    }
});

// 注销
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) throw err;
        res.clearCookie('sessionId');
        res.redirect('/');
    });
});

module.exports = router;