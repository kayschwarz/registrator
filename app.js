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

// get knoten info
app.router.get('/knoten', function (number) {
  var http = this;
    
  db.all(function(err, objs) {
    // respond with error, if any
    if (err) {
      // we just assume a 404
      var e = {
        status: 404,
        msg: "Not Found"
      };
      http.res.writeHead(e.status, e.msg);
      http.res.json(e);
      
    } else { // if no error
      // build data
      var data = Object.keys(objs);
      // send it
      http.res.json(data);
    }
  });
});

// start http server on port 3000
app.start(3000);
