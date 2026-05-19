const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'moldyr_secret_2024_change_in_prod';

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Авторизация қажет' });
  }
  const token = header.slice(7);
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Жарамсыз токен' });
  }
}

module.exports = { requireAuth, JWT_SECRET };
