# Registrator

## TL;DR

- This is a knoten:  
    {
      "number": 178,
      "mac": "90f652c79eb0",
      "pass": "hashed private key"
    }

- Auto-Register a knoten:  
  `MAC=c0ffe3; PASS="phrase" && wget http://reg.js.ars.is/post/knoten?MAC=$MAC&PASS=$PASS`

- Update a knoten:  
  `NR=178; MAC=c0ffe3; PASS="phrase" && wget http://reg.js.ars.is/post/knoten?NUMBER=$NR&MAC=$MAC&PASS=$PASS`

- Get all knoten:  
  `wget http://reg.js.ars.is/get/knoten`

- Check if a knoten exists:  
  `NR=178; wget http://reg.js.ars.is/get/knoten?NUMBER=$NR`


## API

- Protocol: `HTTP`
- Data format: `JSON`
- Base URL: <http://reg.js.ars.is/>
- Authentication: `?`
- For client compatibility we supply shortcuts to be used instead of real HTTP verbs (i.e. `POST /` === `GET /post`)

### Error handling

- response with status code (like `http`'s)
- example: `{ "status": "514" }`

## Resources, Methods, Calls

All methods deal with just one kind of resource (a single router, or "knoten").
It follows a list of applicable methods (or actions).

### Get all `KNOTEN`

Returns an array of all registered knoten.

- *Request path:* `/knoten`
- *Request method:* `GET`
- *Parameters:* None
- *Authentication:* None
- *Example request:* `curl -X GET http://reg.js.ars.is/knoten`
- *Example response:* `{ "knoten": [ {knoten}, {knoten}, {knoten} ] }`

### Update or auto-register a `KNOTEN`

Marks the knoten "as seen" (so it will not be deleted from the pool).
If there is no knoten with the supplied number, the server may create it if all paramaters are given.

- *Request path:* `/knoten`
- *Request method:* `PUT`
- *Request Parameters:* [`NUMBER`], `MAC`, `pass`
- *Request Body:* None
- *Authentication:* None
- *Example request:* `curl -X GET http://reg.js.ars.is/knoten`
- *Example response:* `{ "status": "200", "knoten": {knoten} }` -- kleinste verfügbare nummer >=2

### Reserve a new `KNOTEN` number

- *Request path:* `/knoten`
- *Request method:* `GET`
- *Parameters:* `NUMBER`, "passphrase"
- *Authentication:* None
- *Example request:* `curl -X GET http://reg.js.ars.is/knoten`
- *Example response:* `{ "knoten": [ {knoten}, {knoten}, {knoten} ] }`

