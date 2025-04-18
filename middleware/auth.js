const authMiddleware = {
  requireAuth: (req, res, next) => {
      if (!req.session.user || !req.session.user.isAdmin) {
          return res.redirect('/auth/login');
      }
      next();
  },

  injectUser: (req, res, next) => {
      res.locals.user = req.session.user || { email: 'Guest' };
      next();
  }
};

module.exports = authMiddleware;