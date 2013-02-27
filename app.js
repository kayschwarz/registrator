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

// Auto-Reg: knoten without number, but mac pass
app.router.get('/put/knoten/:mac/:pass', function (mac, pass) {
  var http = this,      
      data = {};
  
  
  db.get(number, function(err, knoten) {
    // respond with error, if any
    if (err) {
      console.log(require('eyes').inspect(err));
      
      // we just assume a 404
      var e = {
        "status": 404,
        "msg": "Not Found"
      };
      http.res.writeHead(e.status, e.msg);
      http.res.json(e);
      
    } else { // if no error
      
      // timestamp the received object
      knoten.last_seen = new Date().getTime();
      
      // save back to db
      db.save(number, knoten, function(err) {
        
        if (err) {
          
          // db error at this stage is our fault
          var e = {
            "status": 500,
            "msg": "Server Error"
          };
          
          http.res.writeHead(e.status, e.msg);
          http.res.json(e);
          
          
        } else {
          
          // build answer
          var a = {
            "status": 200,
            "msg": "ok",
            "result": {
              // number is still the number
              "number": number,
              // we pick the just values we want from the db result
              "mac": knoten.mac,
              "last_seen": knoten["last_seen"]
            }
          };
          
          // send it
          http.res.json(a);
          
        }
      });
    }
  });  
});

// PUT single knoten with data (auto-reg or heartbeat)
app.router.get('/put/knoten/:number/:mac/:pass', function (number, mac, pass) {
  var http = this,      
      data = {};
        
  db.get(number, function(err, knoten) {
    // respond with error, if any
    if (err) {      
      // we just assume a 404
      var e = {
        "status": 404,
        "msg": "Not Found"
      };
      http.res.writeHead(e.status, e.msg);
      http.res.json(e);
      
    } else { // if no error, continue updating
      
      if (mac !== knoten.mac) {
        // wrong pass: Error 400 Bad Request
        var e = {
          "status": 401,
          "msg": "Wrong $MAC"
        };
        http.res.writeHead(e.status, e.msg);
        http.res.json(e);
        
      } 
      
      if (pass !== knoten.pass) {
        // wrong pass: Error 401 Unauthorized
        var e = {
          "status": 401,
          "msg": "Wrong $PASS"
        };
        http.res.writeHead(e.status, e.msg);
        http.res.json(e);
        
      }
      
      // it seems all is well! let's do the heartbeat:
      
      // timestamp the knoten
      knoten.last_seen = new Date().getTime();
      
      // save knoten back to db
      db.save(number, knoten, function(err) {
        
        if (err) {
          
          // db error at this stage is our fault
          var e = {
            "status": 500,
            "msg": "Server Error"
          };
          
          http.res.writeHead(e.status, e.msg);
          http.res.json(e);
          
          
        } else {
          
          // build answer
          var a = {
            "status": 200,
            "msg": "ok",
            "result": {
              // number is still the number
              "number": number,
              // we pick the just values we want from the db result
              "mac": knoten.mac,
              "last_seen": knoten["last_seen"]
            }
          };
          
          // send it
          http.res.json(a);
          
        }
      });      

    }
  });  
});


// start http server on configured port
app.start(app.config.get('port'));
