var resourceful = require('resourceful'),
    resources = {};

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
    
// 
// # Models/Resources
// 
  

// 
// ## `Network`
// 
// Define `Network` resource with properties.
// 
// 
// ## `Knoten`
// 
// Define `Knoten` resource with properties.
// 
var Knoten = resources.Knoten = 
resourceful.define('knoten', function () {
    
  this.string('mac');
  this.string('pass');
  this.timestamps();
    
});

// Define 'virtual property `number` (used externally instead of `id`)
Knoten.property('number', 'number', {
  // - configure a getter:
  get: function() {
        // get own id, 
    var id = this.properties.id,
        // setup a regex stripping just the number from the `id`
        reg = /network\/\w+\/(\d+)/;
    
    // and return the result of regex replace of own `id`.
    return parseInt(id.toString().replace(reg, "$1"));
  }
});
  
// Define 'virtual property `created_at` (used externally instead of `ctime`)
Knoten.property('created_at', 'number', {
  
  // validation: must be unix timestamp
  format: 'unix-time',
  
  // getter: just return the `ctime`
  get: function() {
    return this.properties.ctime;
  }
  
});
  
// Define 'virtual property `last_seen` (used externally instead of `mtime`)
Knoten.property('last_seen', 'number', {
  
  // validation: must be unix timestamp
  format: 'unix-time',
  
  // getter: just return the `mtime`
  get: function() {
    return this.properties.mtime;
  }
  
});

// Define `Network` as parent of `Knoten`
// 
// ## Resource: Network
// 
var Network = resources.Network = 
resourceful.define('network', function () {
    
  this.string('url');
  this.number('range_min');
  this.number('range_max');
  this.number('lease_days');
  this.timestamps();
    
});

Knoten.parent('network');


// 
// export the resources as module
// 
exports.resources = resources;

// export self as broadway plugin
exports.attach = function (configuredNetworks) {

  // attach resources to app on plugin attach.
  this.resources = resources;
  
};

// init
exports.init = function (done) {
  // nothin to do
  done();
};

