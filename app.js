var flatiron  = require('flatiron'),
    path      = require('path'),
    async     = require('async'),
    app       = flatiron.app;

// app: config
app.config.file({ file: path.join(__dirname, 'config', 'config.json') });
// app: networks config
app.config.file('networks', { file: path.join(__dirname, 'config', 'networks.json') });

// app: `http`, plugins
app.use(flatiron.plugins.http);

// app: internal modules
app.use(require("./lib/errors"));
app.use(require("./lib/register"));
app.use(require("./lib/model"), app.config.get('networks'));

// 
// # EXTERNAL API
// 
// Functions calling the internal API and their HTTP routes 
// (would have to be decoupled when supporting more interfaces).
// 
// Since routes except /home and /time need a `network` parameter, it is not further mentioned.

// 
// ## HOMEPAGE: List all `networks`
// 
// - `GET /`
app.router.get('/', function () {
  // TODO: list networks
  this.res.json({ 'RTFM': 'https://github.com/eins78/registrator/' })
});

// 
// ## Get/List all `Knoten`
// 
  
  var http = this,
      givenprops = [],
      properties = [];
  
  givenprops.push(property);
  ["properties", "property", "props", "prop"].forEach(function(key) {
    givenprops = givenprops.concat(http.req.query[key]);
  });
  
  ["number", "mac", "knoten"].forEach(function(prop) {
    if (givenprops.indexOf(prop) !== -1 || givenprops.indexOf(prop + 's') !== -1) {
      properties.push(prop);
    }
    if (http.req.query[prop] || http.req.query[prop + 's']) {
      if (http.req.query[prop] !== "false" || http.req.query[prop + 's'] !== "false") {
        properties.push(prop);        
      }
    }
  });
    
  app.register.getAll(properties, function(err, res) {
    http.res.end(JSON.stringify((err || res), null, 2));
  });
  
};

app.router.get('/knoten', listAll);
app.router.get('/GET/knoten', listAll);

app.router.get('/list/:property', listAll);
app.router.get('/GET/list/:property', listAll);
app.router.get('/lists/:property', listAll);
app.router.get('/GET/lists/:property', listAll);

var getKnoten = function (number) {
// 
// ## Get a `Knoten`
// 
  var http = this;
  
  app.register.get(number, function(err, res) {
    http.res.end(JSON.stringify((err || res), null, 2));
  });
};

app.router.get('/knoten/:number', getKnoten);
app.router.get('/GET/knoten/:number', getKnoten);

var postKnoten = function () {
// 
// ## AUTOREGISTER: POST a `Knoten`
// 
// - needs mac and pass
// - return a result with a `Knoten`
// - new number is the smallest available, where 
//   available means no db entry for this number
// 
  var http = this, 
  
  mac = http.req.query.mac || null,
  pass = http.req.query.pass || null;
  
  app.register.create(mac, pass, function(err, res) {
    http.res.end(JSON.stringify((err || res), null, 2));
  });
  
};

app.router.post('/knoten', postKnoten);
app.router.get('/POST/knoten', postKnoten);

var putKnoten = function (number) {
// 
// ## HEARTBEAT: PUT a `Knoten`
// 
// - needs mac and pass
// - allow 'costum registration'
// - allows to capture a 'reserved' number
// - logic: if given number has no pass, set it to given pass
// 
  var http = this,
  
  mac = http.req.query.mac || null,
  pass = http.req.query.pass || null;
  number = number || null;
  
  app.register.update(number, mac, pass, function(err, res) {
    http.res.end(JSON.stringify((err || res), null, 2));
  });
  
};

app.router.put('/knoten/:number', putKnoten);
app.router.get('/PUT/knoten/:number', putKnoten);

// 
// ## TIMESTAMP
// 
// - `GET /time`
var getTime = function () {
  
  // send the current timestamp as pretty JSON.
  this.res.end(JSON.stringify({ 'now': new Date().getTime() }, null, 2));
};

app.router.get('/time', getTime);
app.router.get('/GET/time', getTime);


// 
// # STARTUP
// 
// - start app and http server on configured port
// 
app.start(app.config.get('port'));

// 
// ## Check Database, Check and Setup Networks
//
(function bootstrapDB () {

  // - make tmp arrays
  var networks = app.config.get('networks'),
      configuredNetworks = [],
      databasedNetworks = [];

  // bootstrap() sets up network in db if it does not exist
  var bootstrap = function (network, callback) {
        
    // add network to the tmp array
    configuredNetworks.push(network.name);
  
    // check if it already exists in db.
    app.resources.Network.get(network.name, function(err, res) {
    
      // If we got an error db error, we exit!
      if (err && err.status > 500) {
        throw new Error("DB error! Cannot run!")
      }
    
      // If the network is not found, we create it.
      else if (err && err.status === 404) {
      
        app.resources.Network.create({
          id: network.name
        }, function(err, network){
  
          if (err) {
          
            var msg = "could not create network" + network.name;
            
            app.log.error(msg, err);
            callback(new Error(msg));
            
          } else {
          
            app.log.debug("created network!", network);
            callback();
          }
        
        });
      
      }
      
      // if we found the network and the id is correct
      else if (!err && res.id === network.name) {
        // just callback
        callback();

      } else {
        // something is very wrong
        callback(new Error("Network" + res.id + " is not " +  network.name + "!"))
      }
    
    });
  
  };  
  
  // Run async setup for each of the networks 
  // and run the self check after all of them completed.
  async.each(networks, bootstrap, function(err) {
    
    app.log.warn("async finished");
    
    if (err) {
      app.log.error("DB Bootstrap failed!");
    }
    
    Network.all(function(err, networksInDB) {
    
      // and for each network
      networksInDB.forEach(function(n) {
      
        // add it to the tmp list.
        console.log(n.id)
        databasedNetworks.push(n.id);
      });

      // debug: log configured and actual networks
      app.log.debug(" networks configured:", configuredNetworks.sort().toString());
      app.log.debug("networks in database:", databasedNetworks.sort().toString());
    
      // exit if they are not the same!
      if ( configuredNetworks.sort().toString() !== databasedNetworks.sort().toString() ) {
        app.log.error("Self-check: Networks are broken! :(");
      } else {
        app.log.info("self-check:", {'networks_ok': true})
      }
  
    });
    
  });
  
})();
