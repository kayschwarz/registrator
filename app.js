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
app.router.get('/knoten/:number', function (number) {
  var http = this;
  db.get(number, function(err, obj) {
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
      var data = {
        // the number property is our current value
        "number": number,
        // just take the values we want from the db result
        // (so we could add private metadata)
        "mac": obj.mac,
        "pass": obj.pass
      };
      // send it
      http.res.json(data);
    }
  });
});

app.start(3000);
