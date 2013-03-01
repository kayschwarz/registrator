var Database  = require('simple-js'); // database: json in fs

// `exports.attach` gets called by broadway on `app.use`
exports.attach = function (options) {
  
  // this is our app
  var app = this,
  
  // create flat-file db in folder "db"
  db = new Database("db"),
  
    
  // FUNCTIONS
  
  getfirstFreeNumber = function(callback) {
    
    var res,
        freeNumber,
        tryNumber = 2;
        
    db.all(function(err, register) {
      
      while (!freeNumber || tryNumber < 255 ) {
        
        if (!register.hasOwnProperty(tryNumber)) {
          
          freeNumber = tryNumber;
          break;
           
        } else {
          
          tryNumber = tryNumber + 1;
          
        }
        
      }
      
      // FIXME: give real error
      res = freeNumber || 999;
      callback(res);
            
    });
        
  },
        
  writeKnoten = function (knoten, callback) {
    
    // this always get called with given:
    // mac, pass. maybe a number
    // if no number -> getfirstFreeNumber(cb);
    
          
    // all prechecks are already done!
    // if we reach this point, we are either updating a registered number (may checked pass), 
    // or we are creating a new number (in which case the mac is not already known).
    
    getfirstFreeNumber(function (number) {
      
      
      // timestamp the knoten
      knoten.last_seen = new Date().getTime();
    app.log.debug('Write Knoten!', knoten);
      
      // save knoten back to db
      db.save(number, knoten, function(err) {
          
        // we do not get the data back from the db
        // with a real db, we would return what we got
        knoten.number = number;
        
        if (err) {
          
          // db error at this stage is our fault
          var e = error[500];
          callback(e);
          
        } else {
          
          // build answer
          var a = {
            "status": 200,
            "msg": "ok",
            "result": {
              "number": knoten.number,
              "mac": knoten.mac || null,
              "last_seen": knoten["last_seen"]
            }
          };
          
          // callback with answer
          callback(null, a);
          
        }
          
      });
      
    });
              
              
  };  

  // PUBLIC METHODS
  app.register = {};

  app.register.getAll = function (sender) {
    
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
  
  app.register.get = function (number, sender) {
    
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
  
  app.register.create = function (mac, pass, callback) {
    
    // this is just 1 action:
    //
    // - AUTOREG(mac, pass) -> NEW KNOTEN(NEW NUMBER)
    //   * check for pass && mac
    //   * check if mac is registered -> redirect(303, number)
    //   * if ok, fetch fresh number, then CREATE
    // 
    
    // check for missing parameters
    if (!mac || !pass) {
      app.fail(400, null, callback);
    } 
    
    // # build given (request) data
    var given = {};
    given.mac = mac;
    given.pass = pass;
    

    // check if mac is already registered
    db.all(function (err, registered) {    
      var knoten;
      
      // for each knoten, 
      for (knoten in registered){
        
        // filter unwanted properties from the prototype
        if (registered[knoten].hasOwnProperty(mac)) {
          
          // check if one the registered nodes has this mac,    
          if (given.mac === registered[knoten].mac) {
          
            // and only then callback!
            
            // error: no double entries!
            var r = {
              "location": "/knoten/" + knoten,
              "mac":mac              
            };
            app.log.warn('MAC Exists!', r);
            app.fail(303, r, callback);            
          
          }
          
        }
      
      }
      
      // "auth" succes, we have our knoten to update
      app.log.debug('Try Autocreate Knoten!', given);
      writeKnoten(given, callback);      
      
    });
    
  };
  
  app.register.update = function (number, mac, pass, callback) {
    
    // this is one of these actions:
    // 
    // - RESERVATION(number, pass) -> UPDATE KNOTEN(NUMBER)
    //   * like heartbeat, just without mac
    // 
    // - FULLREG(number, mac, pass) -> NEW KNOTEN(NUMBER)
    //   * like heartbeat, but CREATE knoten
    // 
    // - HEARTBEAT(number, mac, pass) -> UPDATE KNOTEN(NUMBER)
    //   * check pass and mac
    
    
    // # build given (request) data
    var given = {};
    given.mac = mac || null;
    given.pass = pass;
    
    // first, we check if the number already exists:
    db.get(given.number, function(err, registered) {
      
      if (!err) {
        // NO error: 
        // number exists! check "auth"!
          
        if (given.pass !== registered.pass) {
                    
          // the pass is wrong: Error 401 Unauthorized
          var r = {};
          r.message = "Wrong $PASS";
          
          app.log.warn(r.message, given);
          app.fail(401, null, callback);
          
        } 
        
        else if (given.pass === registered.pass) {
        
          // "auth" succes, we have our knoten to update
          app.log.debug('Try Update Knoten!', given);
          writeKnoten(given, callback);
        
        } ////////////////////////////////////////////
      
      } else {
        
      // db error: number does NOT exist! try new entry!
      app.log.debug('Try Create Knoten!', given);
      writeKnoten(given, callback);
      
      }
      
    });
    
  };
  
};

// `exports.init` gets called by broadway on `app.init`.
exports.init = function (done) {

  // This plugin doesn't require any initialization step.
  return done();

};
