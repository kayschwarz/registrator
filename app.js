var flatiron  = require('flatiron'),
    path      = require('path'),
    app       = flatiron.app,
    Database  = require('simple-js'), // database: json in fs
    db        = new Database("db"); // a folder "db"

// app: config
app.config.file({ file: path.join(__dirname, 'config', 'config.json') });

// app: `http`, `cli` plugins
app.use(flatiron.plugins.http);
//app.use(flatiron.plugins.cli);

// app: internal modules
app.use(require("./lib/errors"), { "style": "http" } );
app.use(require("./lib/register"), { "networks": ['ffweimar'] } );

// ROUTER ////////////////////////////////////////////

// HOMEPAGE
app.router.get('/', function () {
  this.res.json({ 'RTFM': 'https://github.com/eins78/registrator/' })
});

// LIST: GET /knoten
app.router.get('/GET/knoten', function () {
  app.register.getAll(this);
});
app.router.get('/knoten', function () {
  app.register.getAll(this);
});

// CHECK/INFO: GET /knoten/number
app.router.get('/GET/knoten/:number', function (number) {
  app.register.check(number, this);
});
app.router.get('/knoten/:number', function (number) {
  app.register.check(number, this);
});

// TODO: get knoten property
// app.router.get('/GET/knoten/:number/:property', function (number) {
//   app.register.check(number, property, this);
// });

// AUTOREGISTER: POST knoten, needs mac and pass
app.router.get('/POST/knoten', function () {
  var http = this, 
  
  mac = http.req.query.mac || null,
  pass = http.req.query.pass || null;
  
  app.register.create(mac, pass, function(err, res) {
    http.res.json(err || res);
  });
  
});

// HEARTBEAT: PUT knoten/number, needs mac and pass
// - special: if number has no pass, set to given pass
app.router.get('/PUT/knoten/:number', function (number) {
  var http = this,
  
  mac = http.req.query.mac || null,
  pass = http.req.query.pass || null;
  number = number || null;
  
  app.register.update(number, mac, pass, function(err, res) {
    http.res.json(err || res);
  });
  
});

// TIMESTAMP: GET /time
app.router.get('/GET/time', function () {
  this.res.json({ 'now': new Date().getTime() })
});

// start http server on configured port
app.start(app.config.get('port'));
