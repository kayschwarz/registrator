# Weimarnetz Registrator

The `registrator` is a http webservice for assigning internal node numbers for freifunk mesh networks (aka. "ghetto dhcp").

You can reach the service [somewhere else](http://reg.js.ars.is), but below is some help on how to use it.  

The API is `curl`-, `wget`- and scripting-friendly.

- `JSON`-only
- instead of `HTTP` verbs and parameters, we use simple paths (i.e. `GET /PUT/res/:any/:key`, not `PUT /res?any=any&key=key`)
- instead of `HTTP` headers, we also use `JSON`

## TL;DR

- This is a `knoten`:  
```js
{
  "number": 178,
  "mac": "90f652c79eb0",
  "pass": "hashed private key", // never returned by API!
  "last_seen": 1361993339696    // set by sending 'heartbeat' to API!
}
```

- `✓` **Get all `knoten` numbers**:  
```sh
$ curl http://reg.js.ars.is/GET/knoten
```
```js
{
  "status" : 200,
  "msg" : "ok",
  "result" : [
    "64",
    "178"
  ]
}
```

- `✓` **Check if a `knoten` exists**:  
```sh
$ NR=178; curl http://reg.js.ars.is/GET/knoten/$NR
```
Response:
```js
{
  "status" : 200,
  "msg" : "ok",
  "result" : {
    "number" : "178",
    "mac" : "90f652c79eb0"
  }
}
```
or:
```js
{ "status": 404, "msg": "Not Found" }
```

- `✓` **Update a `knoten` (send "heartbeat")**:  
```sh
$ NR=178; $MAC=f00; $PASS="secret" 
$ NR=178; curl http://reg.js.ars.is/put/knoten/$NR/$MAC/$PASS
```
Response:
```js
{
  "status" : 200,
  "msg" : "ok",
  "result" : {
    "number" : "178",
    "mac" : "90f652c79eb0",
    "last_seen":1361996823533
  }
}
```

- `✓` **Get a current timestamp**:  
```sh
$ curl http://reg.js.ars.is/time
```
Response:
```js
{ "now": 1362000948023 }
```

- Auto-Register a knoten: `MAC=c0ffe3; PASS="phrase" && wget http://reg.js.ars.is/post/knoten?MAC=$MAC&PASS=$PASS`


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

## Resources, Methods, Calls

All methods deal with just one kind of resource (a single router, or "knoten").
It follows a list of applicable methods (or actions).

### Get all `KNOTEN`

Returns an array of all registered knoten.

- *Request path:* `/knoten`
- *Request method:* `GET`
- *Parameters:* None
- *Authentication:* None
- *Example request:* `curl http://reg.js.ars.is/testnet/knoten`
- *Example response:* `{ "knoten": [ {knoten}, {knoten}, {knoten} ] }`

### Get single `KNOTEN` info

Returns an array of all registered knoten.

- *Request path:* `/knoten/:number`
- *Request method:* `GET`
- *Parameters:* None
- *Authentication:* None
- *Example request:* `curl http://reg.js.ars.is/testnet/knoten/178`
- *Example response:* `{ "status": 200, "msg":"ok", "result": { "number": "178", "mac": "xxxx" } }`

### Register new `KNOTEN`

- *Request path:* `/knoten`
- *Request method:* `POST`
- *Parameters:* None
- *Authentication:* None
- *Example request:* `wget http://reg.js.ars.is/POST/knoten`
- *Example response:* `{ "status": 200, "msg":"ok", "result": { "number": "178", "mac": "xxxx" } }`


### Update a `KNOTEN` ("heartbeat")

Marks the knoten "as seen" (so it will not be deleted from the pool).

If there is no knoten with the supplied number, the server may create it if all parameters are given (this enables costum registration with a *wunsch*-number).

- *Request path:* `/knoten/:number?mac=string&pass=string`
- *Request method:* `PUT`
- *Request Parameters:* `NUMBER`, `MAC`, `pass`
- *Request Body:* None
- *Authentication:* None
- *Example request:* `wget http://reg.js.ars.is/knoten/178?mac=caffee&pass=secret`
- *Example response:* `{ "status": 200, "msg":"ok", "result": { "number": "178", "mac": "xxxx" } }`


## Internal

### Reservations

DB entry with just number, but no mac and pass? It's a "reserved" number. It won't be assigned by autoregistration, but anyone can capture the number by sending a valid `heartbeat`.
This enables smooth migration from [existing networks](https://github.com/eins78/registrator/blob/master/weimarnetz.json).