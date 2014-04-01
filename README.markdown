# Weimarnetz Registrator

---

# :construction: WIP :construction:

- **Status**: almost done, test it according to this README.

---

The `registrator` is a http webservice for assigning internal node numbers for freifunk (or other) mesh networks (aka. "ghetto dhcp").

You can reach the service [somewhere else](http://reg.js.ars.is), but below is some help on how to use it.  

The API is browser-, `curl`-, `wget`- and scripting-friendly:

- `JSON`-only
- instead of `HTTP` verbs and parameters, we use simple paths (i.e. `GET /PUT/resource/item`, not `PUT /resource/item`)
- instead of `HTTP` headers, we also use `JSON`
- we use `couchDB` as database backend
- mv `config.sample.json` to `config.json` and make your settings for `couchDB`

## TL;DR

- This is a `knoten`:

    ```js
    {
      "number": 178,
      "ntwork_id_": "testnet",
      "mac": "90f652c79eb0",        // optional, defeats double-registration, is validated
      "pass": "yoursecret",         // never returned by API!
      "created_at": 1361993339696   // set internally on registration!
      "last_seen": 1361993339696    // set by sending 'heartbeat' to API!
    }
    ```

- This is a ***"reserved"*** `knoten`:

    ```js
    {
      "number": 178,                // this number is reserved. it was created internally on startup.
      "ntwork_id_": "testnet",      // in the networks.config, every net can have a "reserved" array ( like [178])
      "pass": "yoursecret",         // "reserved" knoten have no pass - anyone can set it!
      (…)
    }
    ```

- `✓` **Auto-Register a knoten**:

    ```sh
    $ MAC=f00; PASS="secret"
    $ wget "http://reg.js.ars.is/POST/knoten?mac=$MAC&pass=$PASS"
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
    $ wget "http://reg.js.ars.is/PUT/knoten/$NR?mac=$MAC&pass=$PASS"
    ```
    Response:
    ```js
    { "status" : 200, "msg" : "ok", 
      "result" : { "number" : "178", "mac" : "90f652c79eb0", "last_seen":1361996823533 }
    }
    ```


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
- *Example request:* `curl "http://reg.js.ars.is/testnet/knoten"`
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
- *Example request:* `curl "http://reg.js.ars.is/testnet/knoten/178"`
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
- *Example request:* `curl  "http://reg.js.ars.is/POST/testnet/knoten?mac=12345&pass=secret"`
- *Example response:*

    ```js
    { "status": 200, 
      "msg": "ok", 
      "result": { 
        "number": "2", 
        "mac": "12345", 
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
- *Example request:* `curl "http://reg.js.ars.is/PUT/testnet/knoten/178?mac=caffee&pass=secret"`
- *Example response:*

    ```js
    { "status": 200, 
      "msg": "ok", 
      "result": { 
        "number": "178", 
        "mac": "caffee", 
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
- *Example request:* `curl "http://reg.js.ars.is/GET/time"`
- *Example response:*

    ```js
    { "now": 1362153043220 }
    ```


## Dev: Implementers Walkthrough

```sh

# wget works as well
# alias curl=wget
    
# register a new knoten
MAC="02caffeebabe"; PASS="mysecr3t"
curl "http://reg.js.ars.is/POST/testnet/knoten?mac=$MAC&pass=$PASS"
# > {"status":200,"msg":"ok","result":{"number":56,"mac":"1a2b3c4d5e6f7a8b9c","last_seen":1362248264834}}

# lets pretend the router lost power/connection/foo
# and did not get the answer. what happens?
# we send it again:
curl "http://reg.js.ars.is/POST/testnet/knoten?mac=$MAC&pass=$PASS"
# > {"status":303,"msg":"MAC already registered!","result":{"location":"/knoten/56","number":"56","mac":"1a2b3c4d5e6f7a8b9c"}}

# that is good for scripting. you can ignore the status 
# since you will always get a valid "result" if possible.
# example: 
MAC="anewmac12345678"; PASS="mysecr3t2"
curl "http://reg.js.ars.is/POST/testnet/knoten?mac=$MAC&pass=$PASS" | jq ".result.number"
# > 58
# (we do it again and get the same 303 error as before. but jq output the same info)
curl "http://reg.js.ars.is/POST/testnet/knoten?mac=$MAC&pass=$PASS" | jq ".result.number"
# > 58
    
# same goes for the heartbeat
    
# first, save our own number if we don't know yet or don't have one
MYNUMBER=$(curl "http://reg.js.ars.is/POST/testnet/knoten?mac=$MAC&pass=$PASS" | jq ".result.number")
echo $MYNUMBER
# > 58
    
# now send heartbeat
curl "http://reg.js.ars.is/PUT/testnet/knoten/$MYNUMBER?mac=$MAC&pass=$PASS"
# > {"status":200,"msg":"ok","result":{"number":"58","mac":"anewmac12345678","last_seen":1362248708614}}
# does not matter how often you send it
curl "http://reg.js.ars.is/PUT/testnet/knoten/$MYNUMBER?mac=$MAC&pass=$PASS"
# > {"status":200,"msg":"ok","result":{"number":"58","mac":"anewmac12345678","last_seen":1362248714726}}
curl "http://reg.js.ars.is/PUT/testnet/knoten/$MYNUMBER?mac=$MAC&pass=$PASS"
# > {"status":200,"msg":"ok","result":{"number":"58","mac":"anewmac12345678","last_seen":1362248716503}}
```

## Internal

### Reservations

DB entry with just number, but no mac and pass? It's a "reserved" number. It won't be assigned by autoregistration, but anyone can capture the number by sending a valid `heartbeat`.
This enables smooth migration from [existing networks](https://github.com/eins78/registrator/blob/master/weimarnetz.json).

### How to mass import existing Knoten

To ["reserve"](#reservations) existing numbers, you could import these Knoten directly to the database:

```sh
KNOTEN="1 2 3 4 5" 
NETWORK="YourNetworkName"
for NUMBER in $KNOTEN; do curl -X POST -H 'Content-Type: application/json' -d "{ \"_id\": \"knoten/network/$NETWORK/$NUMBER\", \"network_id\": \"$NETWORK\", \"resource\": \"knoten\"}"  http://user:passwd@localhost:5984/registrator; done
```

### Lease time

- numbers "last_seen" more than 30 days ago are purged from the db?
- current status: numbers "last_seen" more than 30 days ago are given out for auto-registration
- once a central monitoring is in place, lease time can also be updated by the mon. api, after a 'heartbeat' is reveived there

### Networks

- Not implemented

This is a network (can only be set up manually):
```js
{
  "name": "testnet",
  "active": true,
  "public": true,
  "url": "http://github.com/eins78/registrator",
  "minimum": 2,
  "maximum": 1000,
  "lease_days": 30
}
```

### Status Site

- Not implemented

- render html on front page
- give help
- list networks
- network pages
    * list all `knoten`
- auto-update with socket.io
