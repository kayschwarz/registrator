var crypto = require('./common').crypto,
    resourceful = require('resourceful'),
    resources = {};
var moment = require('moment');
moment.lang('de');

// 
// # Models/Resources
// 
  

// 
// ## `Network`
// 
// Define `Network` resource with properties.
// 
var Network = resources.Network = 
resourceful.define('network', function () {
    
  this.string('url');
  this.number('range_min');
  this.number('range_max');
  this.number('lease_days');
  this.timestamps();
    
});

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
        // setup a regex stripping just the number from the `id` (like "network/testnet/178")
        reg = /network\/\w+\/(\d+)/;
    
    // and return the result of regex replace of own `id`.
    return parseInt(id.toString().replace(reg, "$1"));
  }
});
  
// - Define 'virtual property `pass`
Knoten.property('pass', 'string', {
  
  get: function() {
    return this.properties.pass_hashed;
  }
  
});

// - Define 'virtual property `location` (gives path for URL)
Knoten.property('location', 'string', {
  // - configure a getter:
  get: function() {   
    return '/' + this.network_id + '/knoten/' + this.number;
  }
});
  
// - Define 'virtual property `created_at` (used externally instead of `ctime`)
Knoten.property('created_at', 'number', {
  
  // validation: must be unix timestamp
  format: 'unix-time',
  
  // getter: just return the `ctime`
  get: function() {
    return moment(this.properties.ctime).format('L LT');
  }
  
});

// - Define 'virtual property `last_seen` (used externally instead of `mtime`)
Knoten.property('last_seen', 'number', {
  
  // validation: must be unix timestamp
  format: 'unix-time',
  
  // getter: just return the `mtime`
  get: function() {
    return moment(this.properties.mtime).format('L LT');
  }
  
});

// Define `Network` as parent of `Knoten`
// 
Knoten.parent('network');


// 
// export the resources as module
// 
exports.resources = resources;

// export self as broadway plugin
exports.attach = function (configuredNetworks) {
  
  var app = this;
  
  // set up resourceful to use couchdb
  resourceful.use('couchdb', app.config.get('couch'));

  // attach resources to app on plugin attach.
  this.resources = resources;
  
};

// init
exports.init = function (done) {
  // nothin to do
  done();
};

