var tool = require('./common').tool,
    Knoten = require('./model').resources.Knoten;

// - `exports.attach` gets called by broadway on `app.use`
exports.attach = function (options) {
  
  // - this is our app
  var app = this,
      lists = ["knoten", "number", "mac"],
      whitelist = ["number", "mac", "created_at", "last_seen"];
  
  // # FUNCTIONS
  // 
  // ## getfirstFreeNumber
  
  var getfirstFreeNumber = function(callback) {
    
    app.log.debug("getfirstFreeNumber()");
    
    var freeNumber, tryNumber, now;
    
    // - initialize search
    freeNumber = null;
    tryNumber = 2;
    now = new Date();    
    
    // - get *network* database
    // 
    // > pro tip: do this with reasonable low caching in respect to leases timing out
    // 
    Knoten.all(function(err, res) {
      
      if (err) {
        // - fail in case of db error
        app.fail(500, e, callback);
        return;
      }
      
      // - prepare the result `:)`
      var register = {};
      res.forEach(function(knoten) {
        register[knoten.number] = knoten;
      });
      app.log.debug("register:", register);
      
      // - check incrementing *number* till usable found
      // (*"free"* means not in db; or with lease timed out)
      search: while (!freeNumber || tryNumber < 255 ) {
        
        // - check if the *number* exists
        if (register.hasOwnProperty(tryNumber)) {
          
          // - check if the *lease* timed out
          
          // - calculate current *lease* time in days
          var leasedays = ((now - new Date(register[tryNumber]["last_seen"]))/1000/60/60/24)
                    
          if (leasedays > 30) {

            // - if *lease* timed out, we have our *number*!
            app.log.debug("found number because lease timed out", trynumber, leasedays);
            freeNumber = tryNumber;
            break search;
            
          }
          
        }
        
        // When the *number* does not exist in the registry at all, 
        if (!register.hasOwnProperty(tryNumber)) {
          
          // we have our *number*!
          freeNumber = tryNumber;
          break search;
           
        } else {
          
          tryNumber = tryNumber + 1;
          
        }
        
      }
      
      // - if we got finished the loop without finding a *number*,
      // we give up `:(`
      if (!freeNumber) {
        
        // - TODO: give correct error
        callback("ERROR!", null);
        
      } else {
        
        // - yay, we callback with the fresh *number*
        callback(null, freeNumber);
      }
              
    });
      
  },
        
  createKnoten = function (leknoten, callback) {
    
    // This always get called with given:
    //  * (fresh) *number*
    //  * *pass*
    //  * maybe *mac*
           
    // Also, all prechecks are already done!
    // If we reach this point, we are creating a new *number* (also means the *mac* is not already known).
    
    // - we use the *number* as our id
    leknoten.id = leknoten.number;
    delete leknoten.number;
        
    app.log.debug('REG: Create Knoten!', leknoten);
          
    Knoten.create(leknoten, function(err, result) {
            
      // - we get the result back from the db
        
      if (err) {
          
        // - db error at this stage is our fault
        app.fail(500, err, callback);
        return;
          
      } else {
              
        // - build answer…
        var a = {
          "status": 201,
          "message": "Created!",
          "result": {
            "number": result.number,
            "mac": result.mac || null,
            "last_seen": result["last_seen"]
          }
        };
              
        // - success!
        app.log.debug("REG: Success!", a);
        callback(null, a);
              
      }
            
    });
    
  },
  
  // ## updateKnoten
  // 
  updateKnoten = function (leknoten, callback) {
    
    // This always get called with given:
    //  * registered *number*
    //  * *pass*
    //  * maybe *mac*
           
    // Also, all prechecks are already done!
    // If we reach this point, we are updating a registered number (also means pass was checked).
    
              
    app.log.debug("REG: Update Knoten:", leknoten);
    
    Knoten.get(leknoten.number, function (err, knoten) {
      
      if (err) {
        
        // - db error at this stage is our fault
        app.fail(500, JSON.stringify(err), callback);
        return;
        
      } 
      else {
                  
        knoten.update(leknoten, function(err, result) {
            
          // - we get the result back from the db
        
          if (err) {
          
            // - db error at this stage is our fault
            app.fail(500, JSON.stringify(err), callback);
            return;
          
          } 
          else {
              
            // - build answer…
            var a = {
              "status": 200,
              "msg": "ok",
              "result": {
                "number": result.number,
                "mac": result.mac,
                "created_at": result.created_at,
                "last_seen": result.last_seen
              }
            };
              
            // - success!
            app.log.debug("REG: Success!", a);
            callback(null, a);
            
          }
            
        });
        
      }
      
    });
    
  };  

  // # PUBLIC METHODS
  app.register = {};

  // ## app.register.getAll
  app.register.getAll = function (wanted, callback) {
    
    var a = {},
        list = {};
    a.status = 200;
    a.message = "ok";
    a.result = {};
    
    // Set default wanted, if none given.
    if (!wanted || wanted.length === 0) {
      wanted = ["knoten"];
    }

    // prepare arrays for each possibly wanted property list
    lists.forEach(function (prop) {
      
      // create an list array
      list[prop] = [];

    });
        
   // Fetch the database.
    Knoten.all(function (err, res) {
      
      // If there was an error, 
      if (err) {
        
        // that would be a db error, so it is our fault.
        app.fail(500, "Sorry, this is a bug  m(", callback);
        return;
      
      // If there was no error, we build an answer:
      } 
      else { 

       // Now, for each database object, 
        Object.keys(res).forEach(function (nr){
          
          // make a tmp knoten, 
          var knoten = {};
          
          // add the whitelisted properties; 
          whitelist.forEach(function (prop) {
            knoten[prop] = res[nr][prop];
          });
          
          // and for each possible list
          lists.forEach(function (prop) {
            
            // if there is such a property, 
            if (res[nr][prop]) {
                        
              // add it to its list array; 
              list[prop].push(res[nr][prop] || knoten[prop]);
            
            }
            else if (prop === "knoten") {
              
              // also add the knoten itself into list. 
              list.knoten.push(knoten);
            
            }
                          
          });
          
        });
        
      }
      
      // now, for each possible list, 
      lists.forEach(function(prop) {
            
        // if the list is wanted, 
        if (wanted.indexOf(prop) !== -1 ) {
          
          // add it to the result, 
          if (prop === "knoten") {

            // in case its a knoten in singular, 
            a.result[prop] = list[prop];
            
          } else {
            
            // otherwise in plural.
            a.result[prop + "s"] = list[prop];

          }
        }
                    
      });
      
      // Finally, callback with the answer.
      callback(null, a);
      
    });
    
  };
  
  // ##  app.register.get
  // 
  app.register.get = function (number, callback) {
            
    Knoten.get(number, function(err, knoten) {
      // respond with error, if any
      if (err) {
        // we just assume a 404
        app.fail(404, null, callback);
        return;
      
      } else { // if no error, 

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
  // - `CREATE(mac, pass) -> NEW KNOTEN(NEW NUMBER)`
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
    
    // Let's check if mac is already registered: 
    Knoten.all(function (err, registered) {
                     
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
        app.fail(303, r, callback);            
        return;
        
      } else {
        
        getfirstFreeNumber(function (err, number) {
          
          if (err) {
            
            app.fail(404, "No free numbers!", callback);
            return;
            
          } else {
          
            given.number = number;
          
            app.log.debug('Try Autocreate Knoten!', given);
            createKnoten(given, callback);
            
          }
          
        });
        
      }
      
    });
    
  };
  
  //
  // ## REST: UPDATE
  //
  // we validate input and find out which of these actions to do: 
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
    given.number = parseInt(number);
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
            
      if (!err) {
        // NO error: 
        // number exists! check "auth"!
        
        if (registered.pass) {
          
          if (given.pass !== registered.pass) {
                    
            // the pass is wrong: Error 401 Unauthorized
            app.fail(401, "Wrong $PASS", callback);
            return;
          
          } else {
        
            // "auth" succes, we have our knoten to update
            app.log.debug('API: Try Update Knoten!', given);
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
            
            app.log.debug('API: Try Capture Reserved Knoten!', given);
            updateKnoten(given, callback);
            
          }
          
        } 
      
      } else {
        
      // REGISTRATION:
      // db error: number does NOT exist! try new entry!
      
      app.log.debug('API: Try Create Knoten!', given);
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
