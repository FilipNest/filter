var Datastore = require('nedb');
var Handlebars = require('handlebars');
var moment = require("moment");

var linkify = require('linkifyjs');
require('linkifyjs/plugins/hashtag')(linkify);
require('linkifyjs/plugins/mention')(linkify);
var linkifyHtml = require('linkifyjs/html');

var cookie = require("cookie");
var cookieParser = require('cookie-parser')

var db = new Datastore({
  filename: 'data/words.db',
  autoload: true
});

var users = new Datastore({
  filename: 'data/users.db',
  autoload: true
});

var util = require("util");
var passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy;

var debug = function (thing) {
  console.log(util.inspect(thing, {
    depth: 10
  }))

}

var server = require('http').createServer(),
  WebSocketServer = require('ws').Server,
  ws = new WebSocketServer({
    server: server
  }),
  express = require('express'),
  app = express(),
  bodyParser = require('body-parser');

var config = {};

process.argv.forEach(function (val, index, array) {

  var argument = {
    key: val.split("=")[0],
    value: val.split("=")[1]
  }

  if (argument.key && argument.value) {

    config[argument.key] = argument.value;

  }

});

passport.use(new LocalStrategy(
  function (username, password, done) {
    users.findOne({
      "$or": [
        {
          username: username
        }, {
          email: username
        }
    ]
    }, function (err, user) {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false, {
          message: 'Incorrect username.'
        });
      }

      bcrypt.compare(password, user.password, function (err, res) {
        if (res === true || password === user.password) {

          return done(null, user);

        } else {

          return done(null, false, {
            message: 'Incorrect password.'
          });

        }

      });
    });
  }));

var session = require('express-session');

var NedbStore = require('express-nedb-session')(session);

var crypto = require('crypto');

var secret = crypto.randomBytes(8).toString('hex');

var sessionStore = new NedbStore({
  filename: 'data/sessions.db'
})

app.use(session({
  secret: secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    maxAge: 3600000
  },
  rolling: true,
  store: sessionStore
}));

app.use(cookieParser(secret));

app.use(passport.initialize());

app.use(passport.session());

// used to serialize the user for the session
passport.serializeUser(function (user, done) {
  done(null, user.username)
});

// used to deserialize the user
passport.deserializeUser(function (id, done) {

  users.findOne({
    username: id
  }, function (err, user) {
    done(err, user);
  });

});

app.use(bodyParser.urlencoded({
  extended: false
}));

var flash = require('express-flash');

app.use(flash());

app.use(bodyParser.json());

var bcrypt = require("bcrypt");

// Create new user

app.get("/meta/logout", function (req, res) {

  req.session.destroy(function (destroyed) {



  });

  res.redirect("/");

});

app.post("/meta/settings", function (req, res) {

  users.update({
    username: req.session.user,
  }, {
    $set: {
      filters: req.body.filters
    }
  }, {
    upsert: false,
    returnUpdatedDocs: true
  }, function (err, updated, doc) {

    req.session.filters = req.body.filters;

  });

  res.redirect("/");

})

app.post("/meta/newUser", function (req, res) {

  if (!req.body.username || !req.body.password || !req.body.email) {

    return res.redirect("/");

  }

  var account = {
    username: req.body.username.toLowerCase(),
    password: req.body.password,
    email: req.body.email.toLowerCase()
  }

  bcrypt.hash(account.password, 10, function (err, hash) {

    if (err) {

      console.log(err);

      res.send(400);

    } else {

      account.password = hash;

      users.insert(account, function (err, newDoc) {

        req.session.user = req.body.username;

        res.redirect("/");

      });
    }

  })

});

var Hashids = require('hashids');
var hashids = new Hashids('', 0, 'abcdefghijklmnopqrstuvwxyz1234567890');

app.use(function (req, res, next) {

  if (req.session.passport && req.session.passport.user) {

    req.session.user = req.session.passport.user;

    users.findOne({
      username: req.session.user
    }, function (err, doc) {

      if (doc) {
        
        req.session.filters = doc.filters;

      }

      next();

    })

  } else {

    next();

  }


});

app.use('/humans.txt', express.static(__dirname + '/static/humans.txt'));

app.use('/favicon.ico', express.static(__dirname + '/static/favicon.ico'));

var sanitizeHtml = require('sanitize-html');

linkify.options.defaults.formatHref = function (href, type) {

  if (type === "hashtag") {

    href = href.substring(1);

  }

  if (type === "mention") {

    href = "@" + href.substring(1);

  }

  return href;

};

var typogr = require('typogr');

var messageParse = function (rawMessage, currentTags, currentUser) {

  var message = {}

  Object.assign(message, rawMessage);

  // Typographic extras
  message.words = typogr(message.words).typogrify();

  // Sanitise

  message.words = sanitizeHtml(message.words, {
    allowedTags: ['i', 'em'],
    allowedAttributes: {}
  });

  // Parse links in words

  message.words = linkifyHtml(message.words);

  // Reply is all tags

  message.reply = JSON.parse(JSON.stringify(message.tags));

  message.parent = message.tags.filter(function (item) {

    return item !== message.author && item !== message.id;

  })

  message.tags = message.tags.filter(function (item) {

    return item !== "@" + message.author && item !== message.id && currentTags.indexOf(item) === -1;

  })

  message.timestamp = message.date;
  message.date = moment(message.date).fromNow();

  // Check if person has upvoted

  if (message.upvoted && message.downvoted) {

    if (message.upvoted.indexOf(currentUser) !== -1) {

      message.votedUp = true;

    }

    if (message.downvoted.indexOf(currentUser) !== -1) {

      message.votedDown = true;

    }

  }

  return message;

}

var specialFilters = {};

specialFilters["points"] = {

  fetch: function (value) {

    return {
      "points": {
        "$gt": value - 1
      }
    }

  },
  filter: function (value, message) {

    return message.points >= value;

  }

}

specialFilters["author"] = {
  fetch: function (value) {

    return {
      "author": value
    }

  },
  filter: function (value, message) {

    return message.author === value;

  }
};

specialFilters["upvoted"] = {
  fetch: function (value) {

    return {
      upvoted: {
        $elemMatch: value
      }
    }

  },
  filter: function (value, message) {

    return message.upvoted.indexOf(value) !== -1;

  }
};

specialFilters["downvoted"] = {
  fetch: function (value) {

    return {
      downvoted: {
        $elemMatch: value
      }
    }

  },
  filter: function (value, message) {

    return message.downvoted.indexOf(value) !== -1;

  }
};

app.use(express.static('static'));

var fs = require("fs");

var messagesFromTags = function (tags, session) {

  var user = session.user;

  return new Promise(function (resolve, reject) {

    var currentTags = [];

    var parsedTags;

    if (!tags) {

      parsedTags = [];

    } else {

      parsedTags = tags.split(",");

    }

    // Add user's filters if set

    if (session.filters) {

      parsedTags = parsedTags.concat(session.filters.split(","));

    }

    var search;

    if (!parsedTags.length) {

      search = {};

    } else {

      var positive = [];
      var negative = [];
      var special = [];

      parsedTags = parsedTags.map(function (item) {

        return item.toLowerCase();

      })

      parsedTags.forEach(function (tag) {

        if (tag.split("=").length > 1) {

          var specialTag = tag.split("=");
          var negate;

          if (specialTag[0][0] === "!") {

            specialTag[0] = specialTag[0].substr(1);
            negate = true;

          }

          special.push({
            type: specialTag[0],
            value: specialTag[1],
            negate: negate
          })

        } else if (tag[0] === "!") {

          negative.push(tag.substring(1));

        } else {

          positive.push(tag);

        }

      });

      search = {
        "$and": []
      };

      special.forEach(function (item) {

        if (specialFilters[item.type]) {

          var query = specialFilters[item.type]["fetch"](item.value);

          if (item.negate) {

            query = {
              $not: query
            }

          }

          search["$and"].push(query);

        }

      });

      positive.forEach(function (item) {

        search["$and"].push({
          tags: {
            $elemMatch: item
          }
        })

      })

      negative.forEach(function (item) {

        search["$and"].push({
          $not: {
            tags: {
              $elemMatch: negative[0]
            }
          }
        })

      })

      currentTags = positive;

    }

    //    debug(search);

    db.find(search).sort({
      date: -1
    }).exec(function (err, messages) {

      if (err) {

        debug(err);

        return resolve([]);

      }

      messages.forEach(function (message, index) {

        messages[index] = messageParse(message, currentTags, user)

      });


      messages.reverse();

      resolve(messages);

    });

  })

};

var templateFile = fs.readFileSync(__dirname + "/index.html", "utf8");
var messagesTemplateFile = fs.readFileSync(__dirname + "/messages.html", "utf8");
var messageTemplateFile = fs.readFileSync(__dirname + "/message.html", "utf8");

var template = Handlebars.compile(templateFile);
var messagesTemplate = Handlebars.compile(messagesTemplateFile);
var messageTemplate = Handlebars.compile(messageTemplateFile);

app.get("/:tags?", function (req, res) {

  messagesFromTags(req.params.tags, req.session).then(function (messages) {

    if (req.query.format === "json") {

      res.json(messages);

      return true;

    }

    var output = template({
      tagsJSON: req.params.tags,
      tags: req.params.tags ? req.params.tags.split(",") : null,
      req: req
    });

    var messageBlock = messagesTemplate({
      messages: messages,
      tags: req.params.tags,
      req: req
    });

    var innerBlock = "";

    messages.forEach(function (message) {

      innerBlock += messageTemplate({
        message: message,
        session: req.session
      });

    });

    messageBlock = messageBlock.replace("MESSAGE", innerBlock);

    output = output.replace("MESSAGES", messageBlock);

    res.send(output);

  }, function (reject) {

    console.log(reject);

  })

});

// General message filtering function to check message and send socket notifiactions if necessary

var notifySockets = function (message, points) {

  Object.keys(sockets).forEach(function (id) {

    var subscription = sockets[id].subscription;

    var send = true;

    subscription.forEach(function (tag) {

      if (tag.length) {

        // Check if special tag

        if (tag.indexOf("=") !== -1) {

          var special = {
            type: tag.split("=")[0],
            value: tag.split("=")[1],
          };

          if (special.type[0] === "!") {

            special.type = special.type.substr(1);
            special.negate = true;

          }

          if (specialFilters[special.type]) {

            var localSend = specialFilters[special.type]["filter"](special.value, message);

            if (special.negate) {

              localSend = !localSend;

            }

            if (!localSend) {

              send = false;

            }

          }

        } else if (messsage.tags.indexOf(tag) === -1) {

          send = false;

        }

      }

    })

    if (send) {

      var output = {
        type: "message",
        message: message,
        template: messageTemplate({
          message: messageParse(message, sockets[id].subscription, id),
          session: sockets[id].session
        })

      }

      sockets[id].send(JSON.stringify(output));

    }

  })

  if (points) {

    // Should send notifications to author if their message has been voted up or down

    Object.keys(sockets).forEach(function (id) {

      if (sockets[id].user === message.author) {

        var output = {
          type: "points",
          direction: points,
          message: message
        }

        sockets[id].send(JSON.stringify(output));

      }

    });

  } else {

    // Check if message contains mention. If it does, send notification to mentioneeeee(?)

    message.tags.forEach(function (tag) {

      if (tag[0] === "@") {

        var mentioned = tag.substring(1);

        Object.keys(sockets).forEach(function (id) {

          if (sockets[id].user === mentioned) {

            var output = {
              type: "mention",
              message: message
            }

            sockets[id].send(JSON.stringify(output));

          }

        });

      }

    })

  }

};

app.post("/points/:message", function (req, res) {

  if (!req.session.user) {

    res.status(403).send("Access denied");
    return false;

  }

  var updateNotification = function (message, voteDirection) {

    // Send socket message with update to registered clients

    notifySockets(message, voteDirection);

    res.status(200).send("OK");

  };

  if (req.body.direction === "+") {

    db.update({
      id: req.params.message,
    }, {
      $inc: {
        points: 1
      },
      $push: {
        upvoted: req.session.user
      }
    }, {
      upsert: true,
      returnUpdatedDocs: true
    }, function (err, updated, doc) {

      updateNotification(doc, req.body.direction)

    });

  } else if (req.body.direction === "-") {

    db.update({
      id: req.params.message,
    }, {
      $inc: {
        points: -1
      },
      $push: {
        downvoted: req.session.user
      }
    }, {
      upsert: true,
      returnUpdatedDocs: true

    }, function (err, updated, doc) {

      updateNotification(doc, req.body.direction);

    });

  } else {

    res.status(400).send("Invalid points value")

  }

});

app.post('/meta/login',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/',
    failureFlash: true
  })
);

app.get("/meta/refresh/:tags?", function (req, res) {

  messagesFromTags(req.params.tags, req.session).then(function (messages) {

    var messageBlock = messagesTemplate({
      messages: messages,
      tags: req.params.tags,
      req: req
    });

    var innerBlock = "";

    messages.forEach(function (message) {

      innerBlock += messageTemplate({
        message: message,
        session: req.session
      });

    });

    messageBlock = messageBlock.replace("MESSAGE", innerBlock);

    res.send(messageBlock);

  })

})

var messageCount = 0

db.count({}, function (err, count) {
  messageCount = count;
});

app.post("/:tags?", function (req, res) {

  if (!req.session.user) {

    res.status(403).send("Access denied");
    return false;

  }

  var post = req.body;

  if (req.body.words && typeof req.body.words === "string" && req.body.words.length < 500) {

    var tags = req.body.tags.split(",");

    var wordsInMessage = req.body.words.match(/\S+/g) || [];

    wordsInMessage.forEach(function (word) {

      if (word[0] === "#") {

        var tag = word.substring(1);

        tags.push(tag);

      }

      if (word[0] === "@") {

        tags.push(word);

      }

    });

    tags.forEach(function (tag, index) {

      if (tag.indexOf("=") !== -1) {

        tags.splice(index, 1)

      } else {

        tags[index] = tag.replace(/[^a-zA-Z0-9-@]/g, "");

      }

    })

    var id = hashids.encode(messageCount);

    tags.forEach(function (currentTag, index) {

      if (!currentTag.length) {

        tags.splice(index, 1)

      }

    })

    var message = {
      words: req.body.words,
      author: req.session.user,
      id: "msg-" + id,
      date: Date.now(),
      tags: tags,
      points: 0,
      upvoted: [],
      downvoted: []
    };

    message.tags.push("@" + message.author);
    message.tags.push(message.id);

    message.tags = message.tags.filter(function (item, pos, self) {
      return self.indexOf(item) == pos;
    })

    message.tags = message.tags.map(function (element) {

      return element.toLowerCase();

    })

    tags = tags.map(function (element) {

      return element.toLowerCase();

    });

    db.insert(message, function (err, newDoc) {

      messageCount += 1;

      if (!req.params.tags) {

        req.params.tags = "";

      }

      notifySockets(message);

      res.redirect("/" + req.params.tags);

    });

  } else {

    res.status(400).send("Bad message");

  }

});

var uuid = require('uuid');

var sockets = {};

ws.on('connection', function (ws) {

  ws.id = uuid.v1();

  sockets[ws.id] = ws;

  ws.on('message', function (message) {

    try {

      var subscription = [];

      message = JSON.parse(message);

      if (message.type === "pair" && message.tags) {

        // Remove leading slash

        var tags = message.tags.substring(1);

        if (tags === "") {



        } else {

          tags = tags.split(",")

          tags.forEach(function (tag, index) {

            tags[index] = decodeURI(tag);

          })

          tags = tags.map(function (tag) {

            return tag.toLowerCase();

          });

          subscription = tags;

        }

        var cookies = cookie.parse(ws.upgradeReq.headers.cookie);
        var sid = cookieParser.signedCookie(cookies["connect.sid"], secret);

        sessionStore.get(sid, function (err, results) {

          if (message.user) {

            ws.user = message.user;

          }


          if (results && results.filters) {

            ws.sesssion = results;

            subscription = subscription.concat(results.filters.split(","));

          }

          ws.subscription = subscription;

        });

      }

    } catch (e) {

      console.log(e);

    }

  });

  ws.on("close", function () {

    try {

      delete sockets[ws.id];

    } catch (e) {

      // Not stored

    }

  });

});

server.on('request', app);

server.listen(config.port || 80);
