var flatiron  = require('flatiron'),
    path      = require('path'),
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

// # ROUTER

// ## HOMEPAGE
app.router.get('/', function () {
  this.res.json({ 'RTFM': 'https://github.com/eins78/registrator/' })
});

// ## LIST: GET /knoten
var getAll = function () {
  var http = this;
  
  app.register.getAll(null, function(err, res) {
    http.res.end(JSON.stringify((err || res), null, 2));
  });
  
};

app.router.get('/knoten', getAll);
app.router.get('/GET/knoten', getAll);

// ## CHECK/INFO: GET /knoten/number
var getKnoten = function (number) {
  var http = this;
  
  app.register.get(number, function(err, res) {
    http.res.end(JSON.stringify((err || res), null, 2));
  });
};

app.router.get('/knoten/:number', getKnoten);
app.router.get('/GET/knoten/:number', getKnoten);

// TODO: get knoten property
// app.router.get('/GET/knoten/:number/:property', function (number) {
//   app.register.check(number, property, this);
// });

// ## AUTOREGISTER: POST knoten, needs mac and pass
var postKnoten = function () {
  var http = this, 
  
  mac = http.req.query.mac || null,
  pass = http.req.query.pass || null;
  
  app.register.create(mac, pass, function(err, res) {
    http.res.end(JSON.stringify((err || res), null, 2));
  });
  
};

app.router.post('/knoten', postKnoten);
app.router.get('/POST/knoten', postKnoten);

// ## HEARTBEAT: PUT knoten/number, needs mac and pass
// - special: if number has no pass, set to given pass
var putKnoten = function (number) {
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

// ## TIMESTAMP: GET /time
var getTime = function () {
  this.res.end(JSON.stringify({ 'now': new Date().getTime() }, null, 2));
};

app.router.get('/time', getTime);
app.router.get('/GET/time', getTime);

// start http server on configured port
app.start(app.config.get('port'));
