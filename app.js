var flatiron  = require('flatiron'),
    path      = require('path'),
    app       = flatiron.app,
    Database  = require('simple-js'), // database: json in fs
    db        = new Database("db"); // a folder "db"

// app: config
app.config.file({ file: path.join(__dirname, 'config', 'config.json') });

// app: `http` plugin
app.use(flatiron.plugins.http);

// app: `register` module
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

// CHECK/INFO: GET knoten with number
app.router.get('/GET/knoten/:number', function (number) {
  app.register.check(number, this);
});

// AUTOREG: PUT knoten without number, but mac and pass
app.router.get('/PUT/knoten/:mac/:pass', function (mac, pass) {
  app.register.reg(mac, pass, this);
});

// HEARTBEAT: PUT knoten with complete data
app.router.get('/PUT/knoten/:number/:mac/:pass', function (number, mac, pass) {
  app.register.heartbeat(number, mac, pass, this);
});

// TIMESTAMP: GET /time
app.router.get('/GET/time', function () {
  this.res.json({ 'now': new Date().getTime() })
});

// start http server on configured port
app.start(app.config.get('port'));
