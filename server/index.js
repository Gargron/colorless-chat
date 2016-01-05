var express = require('express');
var app     = express();
var http    = require('http').Server(app);
var io      = require('socket.io')(http);
var redis   = require('redis');
var cookie  = require('cookie');
var crypto  = require('crypto');
var color   = require("ansi-color").set;
var httpProxy = require('http-proxy');
var RateLimiter = require("rolling-rate-limiter");

const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const PORT = process.env.PORT || 3000;
const BRAND = process.env.BRAND || 'Chat';
const BASE_URL = process.env.BASE_URL || '';

/**
 * Client-side events:
 * -------------------
 *
 * On the receiving end, all messages are namespaced as "message" and are JSON strings of
 * the actual message object that can have different types
 *
 * As for sending, the events can be "message" or "resubscribe"
 *
 * Message types:
 * --------------
 *
 * Action:  Text message in 3rd person
 * Message: Basic text message
 * Join:    When a room is joined
 * Leave:   When a room is departed
 * Auth:    Returns te authenticated user, the "self"
 * Sync:    Returns list of users in room
 **/

app.use(express.static(__dirname + '/../public'));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/../views');

app.get('/', function (req, res) {
  res.render('index', { brand: BRAND, base_url: BASE_URL });
});

if (process.env.NODE_ENV === 'development') {
  var proxy  = httpProxy.createProxyServer();
  var bundle = require('./bundle.js');

  bundle();

  app.all('/assets/*', function (req, res) {
    proxy.web(req, res, {
        target: 'http://localhost:8080'
    });
  });
}

const DEFAULT_HEX     = '222223';
const DEFAULT_CHANNEL = 'default';

var joinEvent = function (user) {
  return JSON.stringify({
    type: 'join',
    user: user
  });
};

var leaveEvent = function (user) {
  return JSON.stringify({
    type: 'leave',
    user: user
  });
};

var messageEvent = function (user, d) {
  var type = 'message';
  var text = d.text;
  var hex  = d.hex;
  var ts   = Math.floor(new Date() / 1000);

  if (text.indexOf('/') === 0) {
    if (text.indexOf('/me ') === 0) {
      type = 'action';
      text = text.substring(4);
    }
  }

  if (typeof hex === 'undefined' || hex === null) {
    hex = user.color;
  } else {
    hex = hex.replace(/[^0-9a-f]+/i, '').substring(0, 6);
  }

  var id = crypto.createHash('md5').update(ts + text + user.id).digest("hex");

  return JSON.stringify({
    id:   id,
    type: type,
    text: text,
    user: user,
    hex:  hex
  });
};

var syncEvent = function (items) {
  return JSON.stringify({
    type: 'sync',
    data: items.map(function (val) {
      return JSON.parse(val);
    })
  });
};

var authEvent = function (user) {
  return JSON.stringify({
    type: 'auth',
    user: user
  });
};

var send = function (socket, d) {
  socket.emit('message', d);
};

var broadcast = function (db, socket, channel, d, localOnly) {
  if (localOnly) {
    io.sockets.emit('message', d);
    return;
  }

  db.publish(channel, d);
};

var listKey = function (channel) {
  return 'chat:list:' + channel;
};

var authKey = function (auth) {
  return 'user:session:' + auth;
};

var sessionKey = function (channel, userId) {
  return 'chat:sessions:' + channel + ':' + userId;
};

var join = function (db, socket, channel, user, localOnly) {
  db.hset(listKey(channel), user.id, JSON.stringify(user));
  db.sadd(sessionKey(channel, user.id), socket.id);
  sync(db, socket, channel);
  broadcast(db, socket, channel, joinEvent(user), localOnly);
  send(socket, joinEvent(user));
  db.subscribe(channel);
};

var leave = function (db, socket, channel, user, localOnly) {
  db.unsubscribe();

  db.srem(sessionKey(channel, user.id), socket.id);

  db.scard(sessionKey(channel, user.id), function (err, num) {
    if (err) {
      return;
    }

    if (num === 0) {
      db.hdel(listKey(channel), user.id);
      db.publish(channel, leaveEvent(user), localOnly);
    }
  });
};

var sync = function (db, socket, channel) {
  db.hvals(listKey(channel), function (err, items) {
    if (err) {
      return;
    }

    socket.emit('message', syncEvent(items));
  });
};

var reasonsToReject = function (user, d, limiter) {
  if (d.text.length === 0 || d.text.replace(/\s+/, '').length === 0) {
    return true;
  }

  if (user.role < 1) {
    return true;
  }

  var timeLeft = limiter(user.id);

  if (timeLeft > 0) {
    return true;
  }

  return false;
};

io.on('connection', function (socket) {
  var db            = redis.createClient({ host: REDIS_HOST, port: REDIS_PORT });
  var channel       = DEFAULT_CHANNEL;
  var cookies       = cookie.parse(socket.request.headers.cookie || '');
  var user          = {};
  var authenticated = false;
  var localOnly     = false;

  var limiter = RateLimiter({
    interval: 500,
    maxInInterval: 5,
    minDifference: 100
  });

  console.log('New socket connection', socket.id);

  db.on('error', function (err) {
    console.log(color('Redis error:', 'red'), err.code, 'for', socket.id);

    if (err.code === 'ECONNREFUSED') {
      localOnly = true;
    }
  });

  db.on('ready', function () {
    if (localOnly) {
      console.log(color('Redis connection re-established', 'green'), 'for', socket.id);
      localOnly = false;
    }
  });

  if (typeof cookies.auth !== 'undefined') {
    // load user
    db.get(authKey(cookies.auth), function (err, data) {
      if (err) {
        return;
      }

      var json = JSON.parse(data);

      user = {
        id:    json.id,
        name:  json.name,
        hash:  crypto.createHash('md5').update(json.email).digest("hex"),
        role:  json.role,
        color: typeof json.meta !== 'undefined' ? (json.meta.color || DEFAULT_HEX) : DEFAULT_HEX
      };

      authenticated = true;
      console.log(socket.id, color('identified as', 'green'), user.name);

      db.zincrby('chat:online', 1, user.id);
      send(socket, authEvent(user));
      join(db, socket, channel, user, localOnly);
    });
  } else {
    sync(db, socket, channel);
    db.subscribe(channel);
  }

  db.on('message', function (_channel, message) {
    // fwd to socket
    send(socket, message);
  });

  socket.on('message', function (d) {
    if (!authenticated) {
      return;
    }

    if (reasonsToReject(user, d, limiter)) {
      return;
    }

    // fwd to redis
    broadcast(db.duplicate(), socket, channel, messageEvent(user, d), localOnly);
  });

  socket.on('resubscribe', function (d) {
    if (!authenticated) {
      db.unsubscribe();
      channel = d;
      db.subscribe(channel);

      return;
    }

    leave(db, socket, channel, user, localOnly);
    channel = d;
    join(db, socket, channel, user, localOnly);
  });

  socket.on('disconnect', function () {
    if (authenticated) {
      leave(db, socket, channel, user, localOnly);
      db.zincrby('chat:online', -1, user.id);
    }

    // bye!
    db.quit();
  });
});

console.log(color('Starting chat server...', 'green'));
http.listen(process.env.PORT || 3000);
console.log('Listening on http://localhost:' + PORT);
console.log('Parameters:');
console.log('  Redis host:', REDIS_HOST);
console.log('  Redis port:', REDIS_PORT);
