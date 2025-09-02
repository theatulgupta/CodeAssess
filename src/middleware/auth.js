// Admin authentication middleware
function adminAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).send('Authentication required');
  }
  
  const credentials = Buffer.from(auth.slice(6), 'base64').toString();
  const [username, password] = credentials.split(':');
  
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'atul@admin';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    next();
  } else {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Area"');
    res.status(401).send('Invalid credentials');
  }
}

module.exports = { adminAuth };