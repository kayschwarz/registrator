// # REGISTRATOR client (jquery)

  // > Structure loosely based on [underscore](http://underscorejs.org/docs/underscore.html)
(function() {
  
  var root = this,
  
  //  ## FFReg
  
  // First, config object (JSON): 
  config = {
    "BaseURL": "http://reg.weimarnetz.de/ffweimar"
  },
  
  // Everything is encapsulated into the `FFReg` object, which will be attached to `global` later.
  FFReg = {
    "VERSION": "0.0.0"
  };
    
    
  // ## Functions
  // 
  // ### Check
  // 
  // A function to check a **number** against the *Registrator*.
  FFReg.check = function (number, callback) {
    
    // First, some sanity checks
    if (!number) {
      console.log("FFReg.check(): no number to check!");
      return;
    }

    if (!window.$) {
      console.log("FFReg.check(): no JQuery!");
      return;          
    } else {
      // set up JQuery
      var JQuery = window.$;
    }
    
    // If all is well, get the **number**'s status from *Registrator* with `JQuery.ajax()`.
    jQuery.ajax(config.BaseURL + "/knoten/" + number, {
      
      // When the request completes, 
      complete: function complete(jqXHR, textStatus) {
        
        // get the received data
        var answer = {
          "textStatus": textStatus,
          "data": JSON.parse(jqXHR.responseText),
        }
        
        // and "analyze" it:
        // 
        // - If the was a `HTTP Error 404`, the number is *FREE*
        if (answer.data.status === 404) {
          answer.free = true;
          answer.result = "FREE! " + answer.data.result + "!";
        
        // - If the was a `HTTP Status 200`, the number is *TAKEN*
        } else if (answer.data.status === 200) {
          answer.free = false;
          answer.result = "TAKEN! Number " + number + " registered" + (answer.data.result.mac ? (" to MAC " + answer.data.result.mac) : ("")) + "!";
        // - Otherwise, it is an *error*
        } else {
          answer.free = null;
          answer.result = "WTF:" + JSON.stringify(answer.data);
        }
        
        // We log the data and result to the console, 
        console.log(JSON.stringify(answer));
        
        // and call back with the same answer.
        if (typeof callback === 'function') {
          callback(answer);                  
        }
      }
    });

  };
  
  // Lastly, we semi-safely attach **FFReg** to the `global` object.
  if (!root.FFReg) {
    root.FFReg = FFReg;
  }

// The above is run once on page load. That is all.
})();
