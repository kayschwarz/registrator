// `exports.attach` gets called by broadway on `app.use`
exports.attach = function (options) {
  
  // this is our app
  var app = this,
  
  // error codes config
  error = {
    303 : { 
            "status": 303,
            "msg": "MAC already registered!"
          },
    400 : { 
            "status": 400,
            "msg": "Bad Request!"
          },
    401 : { 
            "status": 401,
            "msg": "Unauthorized!"
          },
    404 : { 
            "status": 404,
            "msg": "Not Found!"
          },
    500 : { 
            "status": 500,
            "msg": "Server Error!"      
          },
    501 : { 
          "status": 501,
          "msg": "Not Implemented!"
          },
    666 : {
          "status": 500,
          "msg": "Error message not found  o_O"
    }
  };

  // PUBLIC METHODS
  app.fail = function (code, meta, callback) {
        
    if (!error.hasOwnProperty(code)) {
      code = 666
    }
    
    var err = {
        "status": error[code]["status"],
        "msg": error[code]["msg"],
        "result": meta || null
      };
    
    // log the error
    if (err.status < 500) {
      app.log.debug("client error", err);
    } else {
      app.log.server("internal error", err);
    }
    
    // callback with our error
    callback(err);
      
  };

};

// `exports.init` gets called by broadway on `app.init`.
exports.init = function (done) {

  // This plugin doesn't require any initialization step.
  return done();

};