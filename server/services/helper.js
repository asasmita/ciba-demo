const jwt = require('jsonwebtoken');

function generateJwt() {
  return jwt.sign({
    exp: Math.floor(Date.now() / 1000) + (60 * 60),
    data: 'foobar'
  }, 'secret');
}

module.exports = {
  generateJwt
};