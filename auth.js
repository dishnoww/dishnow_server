const jwt = require('./jwt');

module.exports = async (req, res, next) => {
  let token = req.headers["authorization"] || req.query.token || req.cookies["token"];
  if (!token) return res.status(401).end();
  if (token.indexOf("Bearer ") === 0) token = token.slice(7);
  try {
    const decoded = await jwt.verify(token);
    req.auth = decoded;
    return next();
  } catch(e) {
    res.status(401).end();
  }
}
