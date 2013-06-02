// # Regex

// match any IEEE 802 MAC adress format
// look at graph: <http://www.debuggex.com>
var mac802 = exports.regmac802 = /^([a-fA-F0-9]{2})([a-f0-9A-F]{2})([a-f0-9A-F]{2})([a-f0-9A-F]{2})([a-f0-9A-F]{2})([a-f0-9A-F]{2})$|^([a-f0-9A-F]{2}):([a-f0-9A-F]{2}):([a-f0-9A-F]{2}):([a-f0-9A-F]{2}):([a-f0-9A-F]{2}):([a-f0-9A-F]{2})$|^([a-f0-9A-F]{2})-([a-f0-9A-F]{2})-([a-f0-9A-F]{2})-([a-f0-9A-F]{2})-([a-f0-9A-F]{2})-([a-f0-9A-F]{2})$|^([0-9A-Fa-f]{4})\.([0-9A-Fa-f]{4})\.([0-9A-Fa-f]{4})$/,

isValidMac = function (string) {
  return mac802.test(string);
}

// output a normalized version of the MAC address (just hex chars)
normalizeMac = function (string) {
  var mac = string.replace(mac802, "$1$2$3$4$5$6$7$8$9$10$11$12$13$14$15$16$17$18$19$20$21");
  mac = mac.toLowerCase()
  return mac;
},

// console.log(normalizeMac("90f652c79eb0"));      // 90f652c79eb0
// console.log(normalizeMac("90:f6:52:c7:9e:b0")); // 90f652c79eb0
// console.log(normalizeMac("90-f6-52-c7-9e-b0")); // 90f652c79eb0
// console.log(normalizeMac("90f6.52c7.9eb0"));    // 90f652c79eb0

// 
// # Password Hashing
//

bcrypt = require('bcrypt'),
crypto = {},

crypto.hash = function (password) {
  
  // returns auto-salted bcrypt hash
  return bcrypt.hashSync(password, 8);
  
},

crypto.check = function(password, hash) {
  
  // returns true or false
  return bcrypt.compareSync(password, hash);
  
},

crypto.hashAsync = function (password, callback) {
  
  // calls back with err or auto-salted bcrypt hash
  bcrypt.hash(password, 8, function(err, hash) {
    callback(err || hash);
  });
  
},

crypto.checkAsync = function(password, hash, callback) {
  
  // calls back with err or ok=true|false
  bcrypt.compare(password, hash, function(err, ok) {
    callback(err || ok)
  });
  
};


// 
// - expose as module

exports.tool = {};
exports.tool.isValidMac = isValidMac;
exports.tool.normalizeMac = normalizeMac;
exports.crypto = crypto;
