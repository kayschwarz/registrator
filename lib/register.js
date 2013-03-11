var tool = require('./common').tool,
    resourceful = require('resourceful');

// `exports.attach` gets called by broadway on `app.use`
exports.attach = function (options) {
  
  // this is our app
  var app = this;
  
  // MODELS (resourceful)
  
  app.resources = {};
  
  // set up resourceful to use couchdb
  resourceful.use('couchdb', {
    "https": false,
    "uri": 'couchdb://couch.js.ars.is',
    "database": "test_registrator",
    "port": "80",
    "auth": {
          "username": process.env["COUCH_USER"],
          "password": process.env["COUCH_PASS"]
        }
  });
    
  var Knoten = app.resources.Knoten = 
  resourceful.define('knoten', function () {
    
    // Specify some properties
    this.number('number');
    this.string('mac');
    this.string('pass');
    // Specify timestamp properties
    this.timestamps();
    
  });
  
    
  // # FUNCTIONS
  
  var getfirstFreeNumber = function(callback) {
    
    var res, freeNumber, tryNumber, now;
    
    //initialize search
    freeNumber = null;
    tryNumber = 2;
    now = new Date();    
    
    // get network database
    // pro tip: do this with reasonable low caching in respect to leases timing out
    Knoten.all(function(err, register) {
      
      app.log.error(JSON.stringify(err));

      // check incrementing number till usable found
      // free === not in db; or with lease timed out
      checkNumber: while (!freeNumber || tryNumber < 255 ) {
        
        // check if the number exists
        if (register.hasOwnProperty(tryNumber)) {
          
          // check if the lease timed out
          
          // current lease time in days
          var leasedays = ((now - new Date(register[tryNumber]["last_seen"]))/1000/60/60/24)
                    
          if (leasedays > 30) {

            // if lease timed out, we have our number!
            
            freeNumber = tryNumber;
            break checkNumber;
            
          }
          
        }
        
        if (!register.hasOwnProperty(tryNumber)) {
          
          freeNumber = tryNumber;
          break checkNumber;
           
        } else {
          
          tryNumber = tryNumber + 1;
          
        }
        
      }
      
      // FIXME: give real error
      res = freeNumber || {"error": "404"};
      callback(res);
            
    });
        
  },
        
  createKnoten = function (leknoten, callback) {
    
    
    // this always get called with given:
    // fresh number, pass, maybe mac 
           
    // also, all prechecks are already done!
    // if we reach this point, we are creating a new number (also means the mac is not already known).
        
    // FIXME: number -> id
    leknoten.id = leknoten.number;
    delete leknoten.number;
          
    app.log.debug('Create Knoten!', leknoten);
          
    Knoten.create(leknoten, function(err, result) {
            
      // we get the result back from the db
        
      if (err) {
          
        // db error at this stage is our fault
        app.log.error(err);
        app.fail(500, err, callback);
        returnl
          
      } else {
              
        // build answer
        var a = {
          "status": 200,
          "msg": "ok",
          "result": {
            "number": result.id,
            "mac": result.mac || null,
            "last_seen": result["last_seen"]
          }
        };
              
        // callback with answer
        callback(null, a);
              
      }
            
    });
    
  };  

  updateKnoten = function (leknoten, callback) {
    
    // this always get called with given:
    // registered number, pass, maybe mac 
           
    // also, all prechecks are already done!
    // if we reach this point, we are updating a registered number (also means pass was checked).
    
    
    // FIXME: number -> id
    leknoten.id = leknoten.number;
    delete leknoten.number;
          
    app.log.debug("Update Knoten:", leknoten);
    
    Knoten.get(leknoten.id, function (err, knoten) {
      
      if (err) {
        
        // db error at this stage is our fault
        app.fail(500, "db error", callback);
        return;
        
      } else {
                  
        knoten.update(leknoten, function(err, result) {
            
          // we get the result back from the db
        
          if (err) {
          
            // db error at this stage is our fault
            app.fail(500, "db error", callback);
            return;
          
          } else {
              
            // build answer
            var a = {
              "status": 200,
              "msg": "ok",
              "result": {
                "number": parseInt(result.id),
                "mac": result.mac,
                "created_at": result["ctime"],
                "last_seen": result["mtime"]
              }
            };
              
            // callback with answer
            callback(null, a);
              
          }
            
        });
        
      }
      
    });
    
  };  

  // # PUBLIC METHODS
  app.register = {};

  app.register.getAll = function (properties, callback) {
        
    // Set default properties, if none given.
    
   if (!properties) {
     properties = [];
   }
   if (properties.length === 0) {
      properties = ["knoten"];
    }

    // Fetch the database.
    Knoten.all(function (err, res) {
      
      // If there was an error, 
      if (err) {
        
        // that would be a db error, so it is our fault.
        var e = {"error": "Sorry, this is a bug  m("};
        
        // So we callback with the error message.
        app.fail(500, e, callback);
        return;
      
      // If there was no error, 
      } else { 
        
        // we build an answer, 
        var a = {};
        a.status = 200;
        a.message = "ok";
        a.result = {};
                
        // anwer arrays TODO: better
        if (properties.indexOf("knoten") !== -1 ) {
          // make an empty aray
          a.result.knoten = [];
        }
        if (properties.indexOf("mac") !== -1 ) {
          // make an empty aray
          a.result.macs = [];
        }
        if (properties.indexOf("number") !== -1 ) {
          // make an empty aray
          a.result.numbers = [];
        }
        
        // Now, for each database object, 
        Object.keys(res).forEach(function(nr){
          
          // make a tmp knoten, 
          var knoten = {
            // a knoten always has a number as its id, we parse it as integer
            "number": parseInt(res[nr]["id"])
          };
          
          // read the mac, 
          var mac = res[nr]["mac"];
          
          // if it has a MAC,
          if (mac) {
            // add it to current knoten.
            knoten.mac = mac;            
          }
          
          // same with 'created_at'
          if (res[nr]["ctime"]) {
            knoten["created_at"] = res[nr]["ctime"];            
          }
          
          // and with 'last_seen'.
          if (res[nr]["mtime"]) {
            knoten["last_seen"] = res[nr]["mtime"];            
          }
          
          
          // If macs array is wanted, 
          if (properties.indexOf("mac") !== -1 ) {
            
            // and if there is a MAC, 
            if (mac) {
                        
              // add it to the macs array (as string).
              a.result.macs.push(mac);
            
            }
              
          }
            
          // If a numbers array is wanted, 
          if (properties.indexOf("number") !== -1 ) {
            
            // then add number property of knoten to numbers array.
            a.result.numbers.push(knoten.number);
              
          }
          
          // If a knoten array is wanted, 
          if (properties.indexOf("knoten") !== -1 ) {

            //  then add the knoten itself into the knoten array (as an object).
            a.result.knoten.push(knoten);
              
          }
            
          
        });
        
      }
      
      // Finally, callback with the answer.
      callback(null, a);
      
    });
    
  };
  
  app.register.get = function (number, callback) {
            
    Knoten.get(number, function(err, knoten) {
      // respond with error, if any
      if (err) {
        // we just assume a 404
        app.fail(404, null, callback);
        return;
      
      } else { // if no error, 

        // knoten.number is the id
        knoten.number = parseInt(knoten.id);
        
        // build answer        
        var a = {
          "status": 200,
          "msg": "ok",
          "result": {
            "number": knoten.number,
            // we pick the just values we want from the db result
            "mac": knoten.mac,
            "created_at": knoten.ctime,
            "last_seen": knoten.mtime
          }
        };
      }
      // send the answer
      callback(a);
    });
  };
  
    // # AUTOREGISTRATION
    //
    // - CREATE(mac, pass) -> NEW KNOTEN(NEW NUMBER)
    //   * check for pass && mac
    //   * check if mac is registered -> redirect(303, number)
    //   * if ok, fetch fresh number, then CREATE
    
  app.register.create = function (mac, pass, callback) {
    
    // - check for missing parameters
    if (!mac || !pass) {
      app.fail(400, { error: "Missing info!" }, callback);
      return;
    }
    
    // - build given (request) data
    var given = {};
    given.mac = tool.normalizeMac(mac);
    given.pass = pass;
    
    // - check for invalid MAC (if any)
    if (mac) {
      if (!tool.isValidMac(mac)) {
        app.fail(400, { error: "Malformed MAC!" }, callback);
      } else { 
        given.mac = tool.normalizeMac(mac);
      }
    }
    
    // Let's check if mac is already registered: 
    Knoten.all(function (err, registered) {
      
      app.log.warn("registered:", registered);
               
      var knoten, 
          ok = true; // we have to be optimistic
      
      // For each knoten, 
      for (knoten in registered){
        
        // (filter unwanted properties from the prototype) and
        if (registered[knoten].hasOwnProperty("mac")) {
          
          // check if one the registered nodes has the given mac,    
          if (given.mac === registered[knoten].mac) {
          
            // and only then we are not `ok`!
            ok = false;
            
            // - build error result: 

            // knoten.number is the id
            registered[knoten].number = 
              parseInt(registered[knoten].id);
        
            var r = {
              "location": "/knoten/" + registered[knoten].number,
              "number": registered[knoten].number,           
              "mac": registered[knoten].mac,
              "last_seen": registered[knoten].mtime
            };
            
          }
          
        }
      
      }
      
      if (!ok) {
        
        // > Error: no double entries!
        app.log.debug('MAC Exists!', r);
        app.fail(303, r, callback);            
        
      } else {
        
        getfirstFreeNumber(function (number) {
          
          given.number = number;
          
          app.log.debug('Try Autocreate Knoten!', given);
          createKnoten(given, callback);
          
        });
        
      }
      
    });
    
  };
  
  //
  // ## REST: UPDATE
  //
  // we validate the input and try to find a useful action to do. 
  // could be one of these actions:
  // 
  // - RESERVATION(number, pass) -> NEW KNOTEN(NUMBER)
  //   * like heartbeat, just without mac
  // 
  // - FULLREG(number, mac, pass) -> NEW KNOTEN(NUMBER)
  //   * like heartbeat, but CREATE knoten
  // 
  // - HEARTBEAT(number, mac, pass) -> UPDATE KNOTEN(NUMBER)
  //   * check pass and mac
  
  app.register.update = function (number, mac, pass, callback) {    
    
    // check for missing parameters
    if (!number || !pass) {
      app.fail(400, null, callback);
      return;
    }
    
    // # build given (request) data
    var given = {};
    given.number = number;
    given.pass = pass;

    // - check for invalid MAC (if any)
    if (mac) {
      if (!tool.isValidMac(mac)) {
        app.fail(400, { error: "Malformed MAC!" }, callback);
        return;
      } else { 
        given.mac = tool.normalizeMac(mac);
      }
    }
    
    
    // HEARTBEAT:
    // first, we check if the number already exists:
    Knoten.get(given.number, function(err, registered) {
      
      require('eyes').inspect(registered, err);
      
      if (!err) {
        // NO error: 
        // number exists! check "auth"!
        
        if (registered.pass) {
          
          if (given.pass !== registered.pass) {
                    
            // the pass is wrong: Error 401 Unauthorized
            var r = {};
            r.msg = "Wrong $PASS";
          
            app.log.debug(r.message, given);
            app.fail(401, r, callback);
            return;
          
          } else {
        
            // "auth" succes, we have our knoten to update
            app.log.debug('Try Update Knoten!', given);
            updateKnoten(given, callback);
          
          }
          
        } else {

          // there was no pass to check, so the number was just "reserved".
          // since we still got a heartbeat, we may allow "capturing" the number.
          
          // but only if it has a mac!
          // TODO: ask @bittorf about this check, seems to make sense
          if (!mac) {
            app.fail(400, null, callback);
            return;
            
          } else {
            
            app.log.debug('Try Capture Reserved Knoten!', given);
            updateKnoten(given, callback);
            
          }
          
        } 
      
      } else {
        
      // REGISTRATION:
      // db error: number does NOT exist! try new entry!
      
      app.log.debug('Try Create Knoten!', given);
      createKnoten(given, callback);
      
    }
      
    });
    
  };
  
};

// `exports.init` gets called by broadway on `app.init`.
exports.init = function (done) {

  // This plugin doesn't require any initialization step.
  return done();

};
