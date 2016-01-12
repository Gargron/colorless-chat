var express = require('express');
var app     = express();
var http    = require('http').Server(app);
var io      = require('socket.io')(http);
var redis   = require('redis');
var cookie  = require('cookie');
var crypto  = require('crypto');
var color   = require("ansi-color").set;
var httpProxy   = require('http-proxy');
var RateLimiter = require("rolling-rate-limiter");
var pjson   = require('../package.json');

const REDIS_HOST  = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT  = process.env.REDIS_PORT || 6379;
const PORT        = process.env.PORT || 3000;
const BRAND       = process.env.BRAND || 'Chat';
const BASE_URL    = process.env.BASE_URL || '';
const CHANNELS    = process.env.CHANNELS || '/main/:default;/ru/:russian';
const VERSION     = pjson.version;
const FAVICON_URL = process.env.FAVICON_URL || '/favicon.ico';
const CLEAN_SLATE = (process.env.CLEAN_SLATE || false) === 'true';
const CSS_URL     = process.env.CSS_URL || false;
const JS_URL      = process.env.JS_URL || false;

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
  res.render('index', {
    brand: BRAND,
    base_url: BASE_URL,
    channels: CHANNELS,
    version: VERSION,
    favicon_url: FAVICON_URL,
    css_url: CSS_URL,
    js_url: JS_URL
  });
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

if (CLEAN_SLATE) {
  console.log(color('Cleaning up Redis for a fresh start', 'green'));

  var db = redis.createClient({ host: REDIS_HOST, port: REDIS_PORT });

  db.keys('chat:list:*', function (_, lists) {
    db.keys('chat:sessions:*', function (_, sessions) {
      db.del(['chat:online'].concat(lists, sessions), function (err) {
        db.quit();
      });
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

  // Commands that modify the contents of the message without side-effects
  // and do not require privileges
  if (text.charAt(0) === '/') {
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

var warningEvent = function (type) {
  return JSON.stringify({
    type: type
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

  var tmpDb = db.duplicate();

  tmpDb.srem(sessionKey(channel, user.id), socket.id, function (err) {
    if (err) {
      return;
    }

    tmpDb.scard(sessionKey(channel, user.id), function (err, num) {
      if (err) {
        return;
      }

      if (num === 0) {
        tmpDb.hdel(listKey(channel), user.id);
        tmpDb.publish(channel, leaveEvent(user));
        tmpDb.quit();
      }
    });
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

var checkBansAndMutes = function (db, socket, user, callback) {
  db.mget(['chat:mute:' + user.name, 'ban:id:' + user.id], function (err, res) {
    if (err) {
      return;
    }

    var muted  = !!res[0];
    var banned = !!res[1];

    if (banned) {
      socket.emit('warning', warningEvent('banned'));
    } else if (muted) {
      socket.emit('warning', warningEvent('muted'));
    }

    callback(muted || banned);
  });
};

var isCommand = function (d) {
  var raw = d.text;

  // Quick check to see if the message is a command with side-effects that requires privileges
  if (raw.charAt(0) === '/') {
    if (raw.indexOf('/mute ') === 0) {
      return true;
    }

    if (raw.indexOf('/unmute') === 0) {
      return true;
    }
  }

  return false;
};

var executeCommand = function (db, socket, user, channel, d) {
  var raw = d.text;
  var elements = raw.split(' ');

  switch(elements[0]) {
    case '/mute':
      if (elements.length !== 3) {
        socket.emit('warning', warningEvent('bad-args'));
        break;
      }

      var target   = elements[1];
      var duration = elements[2];

      db.setex('chat:mute:' + target, parseInt(duration), true, function (err) {
        if (err) {
          return;
        }

        broadcast(db, socket, channel, messageEvent(user, {
          text: '/me muted ' + target + ' for ' + duration + ' sec',
          hex: d.hex
        }), false);

        db.quit();
      });

      break;
    case '/unmute':
      if (elements.length !== 2) {
        socket.emit('warning', warningEvent('bad-args'));
        break;
      }

      var target = elements[1];

      db.del('chat:mute:' + target, function (err) {
        if (err) {
          return;
        }

        broadcast(db, socket, channel, messageEvent(user, {
          text: '/me unmuted ' + target,
          hex: d.hex
        }), false);

        db.quit();
      });

      break;
  }
};

var connectedClients = 0;

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
  connectedClients += 1;

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
        role:  parseInt(json.role),
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

    var tmpDb = db.duplicate();

    if (user.role > 1 && isCommand(d)) {
      executeCommand(tmpDb, socket, user, channel, d);
      return;
    }

    checkBansAndMutes(tmpDb, socket, user, function (err) {
      if (err) {
        tmpDb.quit();
        return;
      }

      // fwd to redis
      broadcast(tmpDb, socket, channel, messageEvent(user, d), localOnly);
      tmpDb.quit();
    });
  });

  socket.on('resubscribe', function (d) {
    if (d === channel) {
      return;
    }

    if (!authenticated) {
      db.unsubscribe();
      channel = d;
      sync(db, socket, channel);
      db.subscribe(channel);

      return;
    }

    leave(db, socket, channel, user, localOnly);
    channel = d;
    join(db, socket, channel, user, localOnly);
  });

  socket.on('disconnect', function () {
    console.log(socket.id, 'disconnecting');

    if (authenticated) {
      leave(db, socket, channel, user, localOnly);
      db.zincrby('chat:online', -1, user.id);
    }

    // bye!
    db.quit();
    connectedClients -= 1;
  });
});

console.log('Version', VERSION);
console.log(color('Starting chat server...', 'green'));
http.listen(process.env.PORT || 3000);
console.log('Listening on http://localhost:' + PORT);
console.log('Parameters:');
console.log('  Redis host:', REDIS_HOST);
console.log('  Redis port:', REDIS_PORT);
console.log('  Brand:', BRAND);
console.log('  Base URL:', BASE_URL);
console.log('  Favicon URL:', FAVICON_URL);
console.log('  Channels:', CHANNELS);

var gracefulExit = function () {
  console.log('Shutting down...');
  io.close();

  setInterval(function () {
    if (connectedClients === 0) {
      process.exit(0);
    }
  }, 10);
};

process.on('SIGINT', gracefulExit).on('SIGTERM', gracefulExit);
