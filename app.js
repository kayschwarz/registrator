var flatiron  = require('flatiron'),
    fs        = require('fs'),
    path      = require('path'),
    util      = require('util'),
    app       = flatiron.app,
    mu        = require('mu2');

// app: config
app.config.file({ file: path.join(__dirname, 'config', 'config.json') });
// app: networks config
app.config.file('networks', { file: path.join(__dirname, 'config', 'networks.json') });

// app: `http`, plugins
app.use(flatiron.plugins.http);
// "use" the `static` plugin, configure it to serve all available files in `./static` under http root (`/`).
// example: `./client/css/style.css` -> `http://app.url/css/style.css`
app.use(flatiron.plugins.static, {
  dir: path.join(__dirname, 'client'),
  path: "static"
});   


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

// # ROUTER

// ## LIST: GET /knoten
var listAll = function (property) {
  
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

// ## CHECK/INFO: GET /knoten/number
var getKnoten = function (number) {
  var http = this;
  
  app.register.get(number, function(err, res) {
    http.res.end(JSON.stringify((err || res), null, 2));
  });
};

app.router.get('/knoten/:number', getKnoten);
app.router.get('/GET/knoten/:number', getKnoten);

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

// # Static files
app.router.get("/static/:file", function (file) {
  var http = this,
      target;
  
  // serve module js from node_modules
  if (file === "plates.js") {
    target = path.join(__dirname, 'node_modules', 'plates', 'lib', 'plates.js');
  } else {
    target = path.join(__dirname, 'public', file);
  }
  
  // read and send the target file
  fs.readFile(target, function (err, data) {
    if (err) {
      http.res.writeHead(500);
      return http.res.end('Error loading index.html');
    }
    http.res.writeHead(200);
    http.res.end(data);
  });
});

// ## HOMEPAGE
app.router.get('/', function () {
  
  var http      = this,
      template  = './client/index.mustache',
      data      = {};
  
  app.register.getAll(null, function(err, res) {
    
    if (!err) {
      data.knoten = res.result.knoten;
      data.knoten.sort(function(a,b){return b.last_seen - a.last_seen})
    }
    
    data.network = app.config.get('networks')[1];
    data.name = app.config.get('name');
    
    app.log.debug("data", data);
    
    stream = mu.compileAndRender(template, data);    
    util.pump(stream, http.res);

  });  
  
});

// start http server on configured port
app.start(app.config.get('port'));
app.log.info("Server started!", { "port": app.config.get('port') })

// Socket.io
// 
var io = require('socket.io').listen(app.server);

io.sockets.on('connection', function(socket) {
  
  socket.emit('console', {
    "event": 'HELLO',
    "message": 'socket.io connected!',
    "knoten": null,
    "timestamp": (new Date().toJSON())
  });

  app.resources.Knoten.on('update', function(doc) {
    socket.emit('console', {
      "event": "HEARTBEAT",
      "message": null,
      "knoten": doc.id,
      "timestamp": (new Date().toJSON())
    });
  });  

  app.resources.Knoten.on('save', function(doc) {
    
    require('eyes').inspect(doc);
    
    socket.emit('console', {
      "event": "REGISTER",
      "message": null,
      "knoten": doc.id,
      "timestamp": (new Date().toJSON())
    });
  });  

});

