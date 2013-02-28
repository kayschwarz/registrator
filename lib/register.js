var Database  = require('simple-js'), // database: json in fs
    error     = {};

// `exports.attach` gets called by broadway on `app.use`
exports.attach = function (options) {
  
  // create flat-file db in folder "db"
  var db = new Database("db");
  
  // store error messages
  error = {
      404 : { "status": 404,
              "msg": "Not Found"
            },
      500 : { "status": 404,
              "msg": "Not Found"      
            }
  };

  // PUBLIC METHODS
  this.register = {};

  this.register.getAll = function (sender) {
    
    var http = sender;
    
    db.all(function(err, objs) {
      // respond with error, if any
      if (err) {
        // that would be a db error, so it our fault
        var a = error[500];
        http.res.writeHead(e.status, e.msg);
        http.res.json(e);
      
      } else { // if no error, 
        // build answer
        var a = {
          "status": 200,
          "msg": "ok",
          "result": Object.keys(objs)
        };
      }
      // send the answer
      http.res.json(a);
    });
    
  };
  
  this.register.check = function (number, sender) {
    
    var http = sender;
    
    db.get(number, function(err, obj) {
      // respond with error, if any
      if (err) {
        // we just assume a 404
        var a = error[404];
      
      } else { // if no error, 
        
        // build answer
        var a = {
          "status": 200,
          "msg": "ok",
          "result": {
            // number is still the number
            "number": number,
            // we pick the just values we want from the db result
            "mac": obj.mac
          }
        };
      }
      // send the answer
      http.res.json(a);
    });
  };
  
  this.register.reg = function (mac, pass, sender) {

    var http = sender,
        data = {};
    
    // since we have a simple db, we just get it all 
    db.all(function (err, res) {
    
      // read in all keys, in NUMERICAL order
      var numbers = Object.keys(res).sort(function(a,b){return a-b});
    
      // check if mac already exists
      Object.keys(res).forEach(function (knoten) {
            
        if (mac === res[knoten].mac) {
        // we know this mac!
            
          if (pass !== res[knoten].pass) {
                    
            // but the pass is wrong: Error 401 Unauthorized
            var e = {
              "status": 401,
              "msg": "Wrong $PASS"
            };
            http.res.writeHead(e.status, e.msg);
            http.res.writeHead(e.status, e.msg);
            http.res.json(e);
        
          } else {
        
            // known mac, with right pass: error "Exists"
            var e = {
              "status": 303,
              "msg": "already exists",
              "location": "/knoten/" + knoten,
              "result": {
                "number": knoten,
                // we pick just the values we want from the db result
                "mac": res[knoten].mac
              }
            };
            http.res.writeHead(e.status, e.msg);
            http.res.json(e);
          }
        }
      
      });
    
      // the mac does not already exist, so we continue

      // FIMXE: need fresh number here

      // build answer
      var a = {
        "status": 501,
        "msg": "not implemented",
      };        
      // send it
      http.res.json(a);
    });
  }
  
  this.register.heartbeat = function (number, mac, pass, sender) {
    
    var http = sender,      
        data = {};
        
    db.get(number, function(err, knoten) {
      // respond with error, if any
      if (err) {      
        // we just assume a 404
        var e = {
          "status": 404,
          "msg": "Not Found"
        };
        http.res.writeHead(e.status, e.msg);
        http.res.json(e);
      
      } else { // if no error, continue updating
      
        if (mac !== knoten.mac) {
          // wrong pass: Error 400 Bad Request
          var e = {
            "status": 401,
            "msg": "Wrong $MAC"
          };
          http.res.writeHead(e.status, e.msg);
          http.res.json(e);
        
        } 
      
        if (pass !== knoten.pass) {
          // wrong pass: Error 401 Unauthorized
          var e = {
            "status": 401,
            "msg": "Wrong $PASS"
          };
          http.res.writeHead(e.status, e.msg);
          http.res.json(e);
        
        }
      
        // it seems all is well! let's do the heartbeat:
      
        // timestamp the knoten
        knoten.last_seen = new Date().getTime();
      
        // save knoten back to db
        db.save(number, knoten, function(err) {
        
          if (err) {
          
            // db error at this stage is our fault
            var e = {
              "status": 500,
              "msg": "Server Error"
            };
          
            http.res.writeHead(e.status, e.msg);
            http.res.json(e);
          
          
          } else {
          
            // build answer
            var a = {
              "status": 200,
              "msg": "ok",
              "result": {
                // number is still the number
                "number": number,
                // we pick the just values we want from the db result
                "mac": knoten.mac,
                "last_seen": knoten["last_seen"]
              }
            };
          
            // send it
            http.res.json(a);
          
          }
        });      

      }
    });  
    
  };
};

// `exports.init` gets called by broadway on `app.init`.
exports.init = function (done) {

  // This plugin doesn't require any initialization step.
  return done();

};