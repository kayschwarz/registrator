var tool = require('./common').tool,
    crypto = require('./common').crypto,
    Knoten = require('./model').resources.Knoten;
    Network = require('./model').resources.Network;

// - `exports.attach` gets called by broadway on `app.use`
exports.attach = function (options) {
  
  // - this is our app
  var app = this,
      lists = ["knoten", "number", "mac"],
      whitelist = ["number", "mac", "created_at", "last_seen"];
  
  // 
  // # FUNCTIONS
  // 
  // ## getfirstFreeNumber
  //   
  
  // ## `whiteList(knoten)`
  // 
  // returns a new knoten object, 
  // with just the properties we want (if they exist)
  // 
  var whiteList = function (knoten) {
    
    var whitelisted = {
      "number": knoten.number,           
      "mac": knoten.mac,
      "last_seen": knoten.last_seen,
      "network": knoten.network_id,           
      "location": knoten.location
    };
    
    return whitelisted;
    
  },
  
  // ## `getfirstFreeNumber(network, callback)`
  // 
  // - gets the first free `number` from a `network` resource
  // - fail()s if there is no free number
  // 
  getfirstFreeNumber = function (network, callback) {
    
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
    network.knotens(function (err, res) {
    
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
      // app.log.debug("register:", register);
    
     // - check incrementing *number* till usable found
      // (*"free"* means not in db; or with lease timed out)
       checkNumber: while (!freeNumber || tryNumber < 255 ) {
      
        // check if the number exists
        if (register.hasOwnProperty(tryNumber)) {
          
          // - check if the *lease* timed out
          
          // - calculate current *lease* time in days
          var leasedays = ((now - new Date(register[tryNumber]["last_seen"]))/1000/60/60/24);
                  
          if (leasedays > 30) {

            // - if *lease* timed out, we have our *number*!
            app.log.debug("found number because lease timed out", tryNumber, leasedays);
            freeNumber = tryNumber;
            break checkNumber;
          
          }
        
        }
        
        // When the *number* does not exist in the registry at all, 
        if (!register.hasOwnProperty(tryNumber)) {
          
          // we have our *number*!
          freeNumber = tryNumber;
          break checkNumber;
         
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

  // ## `createKnoten(network, knoten, callback)`
  // 
  createKnoten = function (network_id, leknoten, callback) {
    
    // This always get called with given:
    //  * *network_id*
    //  * (fresh) * number*
    //  * *pass*
    //  * maybe *mac*
           
    // Also, all prechecks are already done!
    // If we reach this point, we are creating a new *number* (also means the *mac* is not already known).
    
    // - we use the *number* as our id
    leknoten.id = leknoten.number;
    delete leknoten.number;
    leknoten.pass_hashed = crypto.hash(leknoten.pass);
    delete leknoten.pass;    
        
    app.log.debug(network_id + ": REG: Create Knoten!", leknoten);
    
    // get the network
    Network.get(network_id, function(err, network) {

      // - we get the result back from the db
        
      if (err) {
          
        // - db error at this stage is our fault
        app.fail(500, err, callback);
        return;
        
      }
      
      else {
                
        network.createKnoten(leknoten, function (err, result) {
        
          // we get the result back from the db
    
          if (err) {
      
            // db error at this stage is our fault
            app.fail(500, err, callback);
            return;
      
          } else {
          
            // - build answer…
            var a = {
              "status": 201,
              "message": "Created!",
              "result": whiteList(result)
            };
          
            // - success!
            app.log.debug(network_id + ": REG: Success!", a.result);
            callback(null, a);
        
          }
                  
        });
        
      }
      
    });
  
  },

  // ## updateKnoten
  // 
  updateKnoten = function (network_id, leknoten, callback) {
    
    // This always get called with given:
    //  * *network_id*
    //  * registered *number*
    //  * *pass*
    //  * maybe *mac*
           
    // also, all prechecks are already done!
    // if we reach this point, we are updating a registered number (also means pass was checked).

    app.log.debug(network_id + ": REG: Update Knoten:", leknoten);
    
    // we use the number as our id // FIXME: use virtual property setter
    leknoten.id = leknoten.number;
    delete leknoten.number;    
    leknoten.pass_hashed = crypto.hash(leknoten.pass);
    delete leknoten.pass;    
    
    // get the `Knoten`
    Knoten.get('network/' + network_id + '/' + leknoten.id, function (err, knoten) {
      
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
              "message": "updated",
              "result": whiteList(result)
            };
              
            // - success!
            app.log.debug(network_id + ": HEARTBEAT: ", a.result);
            callback(null, a);
            
          }
            
        });
        
      }
      
    });
    
  };  

  // # PUBLIC METHODS
  app.register = {};

  // ## app.register.getAll
  app.register.getAll = function (network_id, wanted, callback) {
        
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
        
   // Get the network
    Network.get(network_id, function(err, network) {
      
      // fail if there was an error
      if (err || !network) {
        var msg = "Network " + network_id + " not found!";
        return app.fail(404, msg, callback);
      }

      // otherwise, get this networks knoten
      network.knotens(function (err, res) {
      
        // If there was an error, 
        if (err) {
        
          // that would be a db error, so it is our fault.
          return app.fail(500, "Sorry, this is a bug  m(", callback);
      
          // If there was no error, we build an answer:
          } 
          else { 

         // Now, for each database object, 
          Object.keys(res).forEach(function (nr){
          
            // make a tmp knoten, 
            var knoten = {};
          
            // add the whitelisted properties  
            whitelist.forEach(function (prop) {
              // (if they exist);
              if (res[nr][prop]) {
                knoten[prop] = res[nr][prop];
              }
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
      
    });
    
  };
  
  // ##  app.register.get
  // 
  app.register.get = function (network_id, number, callback) {
    
    // Get the network
     Network.get(network_id, function(err, network) {
      
       // fail if there was an error
       if (err || !network) {
         var msg = "Network " + network_id + " not found!";
         return app.fail(404, msg, callback);
       };
       
      network.getKnoten(number, function(err, knoten) {
        // respond with error, if any
        if (err || !knoten) {
          // we just assume a 404
          var msg = "No knoten " + number + " found in network " + network_id;
          return app.fail(404, msg, callback);
      
        } else { // if no error, 

          // build answer        
          var a = {
            "status": 200,
            "message": "ok",
            "result": whiteList(knoten)
          };
        }
        // send the answer
        callback(a);
      });
      
    });

  };
  
  // # AUTOREGISTRATION
  //
  // - `CREATE(mac, pass) -> NEW KNOTEN(NEW NUMBER)`
  //   * check for pass && mac
  //   * check if mac is registered -> redirect(303, number)
  //   * if ok, fetch fresh number, then CREATE
    
  app.register.create = function (network_id, mac, pass, callback) {
    
    // - check for missing parameters
    if (!mac || !pass) {
      app.fail(400, { error: "Missing info!" }, callback);
      return;
    }
    
    // - build given (request) data
    var given = {};
    given.network_id = network_id;
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
    
    // Get the network
     Network.get(given.network_id, function(err, network) {
      
       // fail if there was an error
       if (err || !network) {
         var msg = "Network " + given.network_id + " not found!";
         return app.fail(404, msg, callback);
       };    
    
      // Let's check if mac is already registered in the network:
      // 
      // TODO: use Knoten.find({'network_id': given.network_id, 'mac': given.mac}, function(err, knoten) {};)
      // 
      network.knotens(function (err, registered) {
                     
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
            
              // - whitelist: build error result:
              var r = whiteList(registered[knoten]);
            
            }
          
          }
      
        }
      
        if (!ok) {
        
          // > Error: no double entries!
          app.fail(303, r, callback);            
          return;
        
        } else {
        
          getfirstFreeNumber(network, function (err, number) {
          
            if (err) {
            
              app.fail(404, "No free numbers!", callback);
              return;
            
            } else {
          
              given.number = number;
          
              app.log.debug('Try Autocreate Knoten!', given);
              createKnoten(network, given, callback);
            
            }
          
          });
        
        }
      
      });
      
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
  
  app.register.update = function (network_id, number, mac, pass, callback) {    
    
    // check for missing parameters
    if (!number || !pass) {
      app.fail(400, null, callback);
      return;
    }
    
    // # build given (request) data
    var given = {
      number: parseInt(number, 10),
      network_id: network_id,
      pass: pass
    };
    
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
    // 
    // first, we check if the number already exists:
    // app.log.warn('network/' + network_id + '/' + number);
    Knoten.get('network/' + given.network_id + '/' + given.number, function(err, registered) {
      
      // app.log.warn(err);
      // app.log.warn(registered);
      
      
      if (!err) {
        // NO error: 
        // number exists! check "auth"!
        
        if (registered.pass) {
          
          if (!crypto.check(given.pass, registered.pass)) {
                    
            // the pass is wrong: Error 401 Unauthorized
            return app.fail(401, "Wrong $PASS", callback);
          
          } else {
        
            // "auth" succes, we have our knoten to update
            app.log.debug('API: Try Update Knoten!', given);
            updateKnoten(given.network_id, given, callback);
          
          }
          
        } else {

          // there was no pass to check, so the number was just "reserved".
          // since we still got a heartbeat, we may allow "capturing" the number. 
                     
          app.log.debug('API: Try Capture Reserved Knoten!', given);
          updateKnoten(given.network_id, given, callback);
          
        }
      
      } else {
        
      // REGISTRATION:
      // db error: number does NOT exist! try new entry!
      
      app.log.debug('API: Try Create Knoten!', given);
      createKnoten(given.network_id, given, callback);
      
      }
      
    });
    
  };
  
};

// `exports.init` gets called by broadway on `app.init`.
exports.init = function (done) {

  // This plugin doesn't require any initialization step.
  return done();

};
