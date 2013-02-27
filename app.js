var flatiron  = require('flatiron'),
    path      = require('path'),
    app       = flatiron.app,
    Database  = require('simple-js'), // database: json in fs
    db        = new Database("db"); // a folder "db"

// app: config
app.config.file({ file: path.join(__dirname, 'config', 'config.json') });

// app: http plugin
app.use(flatiron.plugins.http);

// ROUTER ////////////////////////////////////////////

// homepage
app.router.get('/', function () {
  this.res.json({ 'hello': 'world' })
});

// get all knoten info
app.router.get('/knoten', function () {
  var http = this;
    
  db.all(function(err, objs) {
    // respond with error, if any
    if (err) {
      // we just assume a 404
      var e = {
        "status": 404,
        "msg": "Not Found"
      };
      http.res.writeHead(e.status, e.msg);
      http.res.json(e);
      
    } else { // if no error
      // build answer
      var a = {
        "status": 200,
        "msg": "ok",
        "result": Object.keys(objs)
      };
      // send it
      http.res.json(a);
    }
  });
});

// get single knoten info
app.router.get('/knoten/:number', function (number) {
  var http = this;
    
  db.get(number, function(err, obj) {
    // respond with error, if any
    if (err) {
      // we just assume a 404
      var e = {
        "status": 404,
        "msg": "Not Found"
      };
      http.res.writeHead(e.status, e.msg);
      http.res.json(e);
      
    } else { // if no error
      // build answer
      var a = {
        "status": 200,
        "msg": "ok",
        "result": {
          // number is still the number
          "number": number,
          // we pick the just values we want from the db result
          "mac": obj.mac
        }
      };
      // send it
      http.res.json(a);
    }
  });
});


// start http server on configured port
app.start(app.config.get('port'));
