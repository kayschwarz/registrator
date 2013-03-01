# Weimarnetz Registrator

The `registrator` is a http webservice for assigning internal node numbers for freifunk mesh networks (aka. "ghetto dhcp").

You can reach the service [somewhere else](http://reg.js.ars.is), but below is some help on how to use it.  

The API is `curl`-, `wget`- and scripting-friendly:

- `JSON`-only
- instead of `HTTP` verbs and parameters, we use simple paths (i.e. `GET /PUT/resource/item`, not `PUT /resource/item`)
- instead of `HTTP` headers, we also use `JSON`

## TL;DR

- This is a `knoten`:

    ```js
    {
      "number": 178,
      "mac": "90f652c79eb0",
      "pass": "yoursecret",         // never returned by API!
      "last_seen": 1361993339696    // set by sending 'heartbeat' to API!
    }
    ```

- `✓` **Auto-Register a knoten**:

    ```sh
    $ MAC=f00; PASS="secret"
    $ wget http://reg.js.ars.is/POST/knoten?mac=$MAC&pass=$PASS
    ```
    Response:
    ```js
    { "status" : 201, "msg" : "ok", 
      "result" : { "number" : "178", "mac" : "90f652c79eb0", "last_seen":1361996823533 } 
    }
    ```

- `✓` **Update a `knoten` ("heartbeat")**:
    
    ```sh
    $ NR=178; $MAC=f00; $PASS="secret" 
    $ wget http://reg.js.ars.is/PUT/knoten/$NR?mac=$MAC&pass=$PASS
    ```
    Response:
    ```js
    { "status" : 200, "msg" : "ok", 
      "result" : { "number" : "178", "mac" : "90f652c79eb0", "last_seen":1361996823533 }
    }
    ```


---

# :construction:

**WIP:** This is a description of how the API should work. 
(why? documentation-driven developement!)


## API Description

- Protocol: `HTTP`
- Data format: `JSON`
- Base URL: <http://reg.js.ars.is/yournetwork>
- Authentication: simple passphrase (hashing TBD)
- For client compatibility we supply shortcuts to be used instead of real HTTP verbs (i.e. `POST /` === `GET /POST`)

### Error handling

- response with status code (like `http`'s)
- example: `{ "status": "514", "message": "I'm a teapot!" }`

## Calls

All methods deal with just one kind of resource (a single router, or "knoten").
It follows a list of applicable methods (or actions).

### Get all `KNOTEN`

Returns an array of all registered knoten.

- *Request path:* `/knoten`
- *Request method:* `GET`
- *Parameters:* None
- *Authentication:* None
- *Example request:* `curl http://reg.js.ars.is/testnet/knoten`
- *Example response:* 
    
    ```js
    { 
      "status": 200, 
      "msg": "ok", 
      "result": [ 1, 2, 3 ] 
    }
    ```

### Get single `KNOTEN` info

Returns an array of all registered knoten.

- *Request path:* `/knoten/:number`
- *Request method:* `GET`
- *Parameters:* None
- *Authentication:* None
- *Example request:* `curl http://reg.js.ars.is/testnet/knoten/178`
- *Example response:* 
    
    ```js
    { 
      "status": 200, 
      "msg": "ok", 
      "result": { 
        "number": "178", 
        "mac": "xxxx", 
        "last_seen": 1362151832050 
      } 
    }
    ```

### Register new `KNOTEN`

- *Request path:* `/knoten`
- *Request method:* `POST`
- *Parameters:* `MAC`, `PASS`
- *Authentication:* None
- *Example request:* `wget http://reg.js.ars.is/POST/knoten?mac=lalala&pass=secret`
- *Example response:*

    ```js
    { "status": 200, 
      "msg": "ok", 
      "result": { 
        "number": "178", 
        "mac": "xxxx", 
        "last_seen": 1362151832050 
      } 
    }
    ```


### Update a `KNOTEN` ("heartbeat")

Marks the knoten "as seen" (so it will not be deleted from the pool).

If there is no knoten with the supplied number, the server may create it if all parameters are given (this enables costum registration with a *wunsch*-number).

If there is already a knoten with this number but no pass, it is a ["reserved"](#reservations) number. The pass is set by whoever sends the first valid update.

- *Request path:* `/knoten/:number`
- *Request method:* `PUT`
- *Request Parameters:* `MAC`, `PASS`
- *Authentication:* passphrase, if set
- *Example request:* `wget http://reg.js.ars.is/knoten/178?mac=caffee&pass=secret`
- *Example response:*

    ```js
    { "status": 200, 
      "msg": "ok", 
      "result": { 
        "number": "178", 
        "mac": "xxxx", 
        "last_seen" :1362151832050 
      } 
    }
    ```


### Get current time

Just a timestamp from the server. If we do our own `DHCP`, why not `NTP` as well… `;)`

- *Request path:* `/time`
- *Request method:* `GET`
- *Request Parameters:* None
- *Authentication:* None
- *Example request:* `wget http://reg.js.ars.is/GET/time`
- *Example response:*

    ```js
    { "now": 1362153043220 }
    ```



## Internal

### Reservations

DB entry with just number, but no mac and pass? It's a "reserved" number. It won't be assigned by autoregistration, but anyone can capture the number by sending a valid `heartbeat`.
This enables smooth migration from [existing networks](https://github.com/eins78/registrator/blob/master/weimarnetz.json).

### Lease time

TODO: implement and document

- numbers "last_seen" more than 30 days ago are purged from the db?