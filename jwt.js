const jwt = require('jsonwebtoken');

const JWT_SECRET = 'TKQrb8iQ+nqegF/KX5hdIVLwCbeH1d+GziSSOrL3Ye/ovOsOnJfoQ54F7nhooeUz';

module.exports = {
  async sign(data) {
    return new Promise((resolve, reject) => {
      jwt.sign(data, JWT_SECRET, {}, (err, token) => {
        if (err) return reject(err);
        return resolve(token);
      });
    });
  },
  async verify(token) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return reject(err);
        return resolve(decoded);
      });
    });
  }
}
