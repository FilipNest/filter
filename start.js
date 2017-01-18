// Register global object

global.filters = {};

filters.specialFilters = {};

// Debug helper

var util = require("util");
filters.debug = function (thing) {
  console.log(util.inspect(thing, {
    depth: 10
  }));

};

filters.config = {
  port: 80,
  database: "db_nedb",
  pageSize: "40"
};

var fs = require("fs");

// Load in config file if 

try {

  Object.assign(filters.config, JSON.parse(fs.readFileSync("./config.json", "utf8")));

} catch (e) {

  if (e.code && e.code === "ENOENT") {

    // File doesn't exist, ignore

  } else {

    filters.debug(e);

  }

}

// Check command line arguments

process.argv.forEach(function (val, index, array) {

  var argument = {
    key: val.split("=")[0],
    value: val.split("=")[1]
  };

  if (argument.key && argument.value) {

    filters.config[argument.key] = argument.value;

  }

});

require("./" + filters.config.database);

var Handlebars = require('handlebars');
var moment = require("moment");

Handlebars.registerHelper('json', function (obj) {
  return JSON.stringify(obj);
});

var linkify = require('linkifyjs');
require('linkifyjs/plugins/hashtag')(linkify);
require('linkifyjs/plugins/mention')(linkify);
var linkifyHtml = require('linkifyjs/html');

var cookie = require("cookie");
var cookieParser = require('cookie-parser');

var passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy;

var https = require("https");
var http = require("http");
var server = http.createServer(),
  WebSocketServer = require('ws').Server,
  ws = new WebSocketServer({
    server: server
  }),
  express = require('express'),
  app = express(),
  bodyParser = require('body-parser');

app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist/'));

app.use('/vex', express.static(__dirname + '/node_modules/vex-js/dist/'));

var busboy = require('connect-busboy');

app.use(busboy({
  limit: {
    files: 1,
    fileSize: 3000
  }
}));

app.all('/*', function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");

  next();
});

filters.generateAuthCode = function (username) {

  return new Promise(function (resolve, reject) {

    var authCode = crypto.randomBytes(8).toString('hex');

    filters.dbUpdate("users", {
      username: username
    }, {
      $set: {
        authCode: authCode
      }
    }, {
      upsert: false,
      returnUpdatedDocs: true
    }).then(function (data) {

      resolve(data);

    });


  })

};

passport.use(new LocalStrategy(

  function (username, password, done) {

    filters.dbFetch("users", {
      "$or": [
        {
          username: username.toLowerCase()
        }, {
          email: username
        }
    ]
    }).then(function (data) {

      if (!data.length) {
        return done(null, false, {
          message: 'Incorrect username.'
        });
      } else {

        // Check if has api key, if not set one

        var user = data[0];

        bcrypt.compare(password, user.password, function (err, res) {
          if (res === true || password === user.password) {


            if (!user.authCode) {

              filters.generateAuthCode(user.username).then(function () {

                return done(null, user);

              });

            } else {

              return done(null, user);

            }


          } else {

            return done(null, false, {
              message: 'Incorrect password.'
            });

          }

        });

      }

    }, function (err) {

      done(err);

    });

  }));

var session = require('express-session');

var NedbStore = require('express-nedb-session')(session);

var crypto = require('crypto');

var secret = filters.config.secret || crypto.randomBytes(8).toString('hex');

var sessionStore = new NedbStore({
  filename: 'data/sessions.db'
});

app.use(session({
  secret: secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    maxAge: 3600000 * 24
  },
  rolling: true,
  store: sessionStore
}));

app.use(cookieParser(secret));

app.use(passport.initialize());

app.use(passport.session());

// used to serialize the user for the session
passport.serializeUser(function (user, done) {
  done(null, user.username);
});

// used to deserialize the user
passport.deserializeUser(function (id, done) {

  filters.dbFetch("users", {
    username: id
  }).then(function (data) {

    if (data.length) {

      done(null, data[0]);

    } else {

      done(false, null);

    }

  }, function (fail) {

    done(fail);

  });

});

app.use(bodyParser.urlencoded({
  extended: false
}));

var flash = require('express-flash');

app.use(flash());

app.use(bodyParser.json());

filters.apiCall = function (req) {

  return new Promise(function (resolve, reject) {

    if (req.query.code || req.body.code) {

      filters.dbFetch("users", {
        authCode: req.body.code || req.query.code
      }).then(function (data) {

        if (!data.length) {

          resolve();

          return false;

        }

        var user = data[0];

        req.session.user = user.username;

        req.session.authCode = user.authCode;

        req.session.filters = user.filters;
        req.session.channels = formatChanels(user.channels);

        resolve();

      }, function (fail) {

        resolve();

      });

    } else {

      resolve();

    }

  })

};

var bcrypt = require("bcrypt");

// Create new user

app.get("/meta/logout", function (req, res) {

  req.session.destroy(function (destroyed) {



  });

  res.redirect("/");

});

app.post("/meta/userfilters", function (req, res) {

  filters.dbUpdate("users", {
    username: req.session.user,
  }, {
    $set: {
      filters: req.body.filters
    }
  }, {
    upsert: false,
    returnUpdatedDocs: true
  }).then(function (data) {

    req.session.filters = req.body.filters;
    res.redirect("/");

  });

});

var url = require("url");
app.post("/meta/userchannels", function (req, res) {

  var channels = [];

  Object.keys(req.body).forEach(function (field) {

    if (field.indexOf("channel-number") !== -1) {

      var number = field.replace("channel-number-", "");

      if (!req.body["channel-code-" + number]) {

        req.body["channel-code-" + number] = req.session.channels[number].code;

      }

      channels.push({

        channel: req.body["channel-number-" + number],
        code: req.body["channel-code-" + number]

      })

    }

  })

  filters.dbUpdate("users", {
    username: req.session.user,
  }, {
    $set: {
      channels: channels
    }
  }, {
    upsert: false,
    returnUpdatedDocs: true
  }).then(function (doc) {

    req.session.channels = formatChanels(channels);
    res.redirect("/");

  });

});

var formatChanels = function (channels) {

  var output = [];

  if (channels) {

    channels.forEach(function (element) {

      // Add trailing slash.

      if (element.channel[element.channel.length - 1] !== "/") {

        element.channel = element.channel + "/";

      }

      output.push({
        raw: element.channel,
        path: url.parse(element.channel),
        code: element.code
      });

    });

  }

  return output;

};

app.post("/meta/newUser", function (req, res) {

  if (!req.body.username || !req.body.password || !req.body.email) {

    req.flash("error", "Please fill in all registration fields");

    return res.redirect("/");

  }

  if (!/^[a-z0-9]+$/i.test(req.body.username)) {

    req.flash("error", "Only letters and numbers in usernames please");

    return res.redirect("/");

  };

  // Check if username exists

  filters.dbFetch("users", {
    $or: [{
      "username": req.body.username
    }, {
      "email": req.body.email
    }]
  }).then(function (user) {

    if (user.length) {

      if (user[0].email === req.body.email) {

        req.flash("error", "Email already in use.");

      } else {

        req.flash("error", "Username " + req.body.username + " already in use.");

      }

      return res.redirect("/");

    }

    var account = {
      username: req.body.username.toLowerCase(),
      password: req.body.password,
      email: req.body.email.toLowerCase()
    };

    bcrypt.hash(account.password, 10, function (err, hash) {

      if (err) {

        filters.debug(err);

        res.send(400);

      } else {

        account.password = hash;

        filters.dbInsert("users", account).then(function (user) {

          req.session.user = req.body.username.toLowerCase();

          filters.generateAuthCode(req.session.user).then(function (data) {

            req.session.authCode = data.authCode;
            res.redirect("/");

          });

        });

      }

    });

  })

});

var Hashids = require('hashids');
var hashids = new Hashids('', 0, 'abcdefghijklmnopqrstuvwxyz1234567890');

app.use(function (req, res, next) {

  if (req.session.passport && req.session.passport.user) {

    req.session.user = req.session.passport.user;

    filters.dbFetch("users", {
      username: req.session.user
    }).then(function (data) {

      if (data && data.length) {

        var doc = data[0];

        req.session.authCode = doc.authCode;

        req.session.filters = doc.filters;
        req.session.channels = formatChanels(doc.channels);

      }

      next();

    });

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

    href = href.split("PRIVATEPRIVATEPRIVATE").join("@");

    href = "@" + href.substring(1);

  }

  return href;

};

linkify.options.defaults.format = function (tag, type) {

  if (type === "mention") {

    tag = tag.split("PRIVATEPRIVATEPRIVATE").join("@");

    tag = "@" + tag.substring(1);

  }

  return tag;

};

var typogr = require('typogr');

var messageParse = function (rawMessage, currentTags, currentUser) {

  var message = {};

  Object.assign(message, rawMessage);

  // Typographic extras
  message.words = typogr(message.words).typogrify();

  // Sanitise

  message.words = sanitizeHtml(message.words, {
    allowedTags: [],
    allowedAttributes: {}
  });

  // Parse links in words

  message.words = message.words.split("@@").join("@PRIVATEPRIVATEPRIVATE");

  if (message.file) {

    message.words += "<img class='' src='" + message.file + "'/>";

  }

  message.words = linkifyHtml(message.words);

  // Reply is all tags

  message.reply = JSON.parse(JSON.stringify(message.tags));

  message.parent = message.tags.filter(function (item) {

    return item !== message.author && item !== message.id;

  });

  message.tags = message.tags.filter(function (item) {

    return item !== "@" + message.author && (item[0] + item[1] !== "@@") && item !== message.id && currentTags.indexOf(item) === -1;

  });

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

};

filters.specialFilters["minpoints"] = {

  fetch: function (value) {

    return {
      "points": {
        "$gt": value - 1
      }
    };

  },
  filter: function (value, message) {

    return message.points >= value;

  }

};

filters.specialFilters["author"] = {

  or: true,
  fetch: function (value) {

    return {
      "author": value
    };

  },
  filter: function (value, message) {

    return message.author === value;

  }
};

filters.specialFilters["upvoted"] = {
  or: true,
  fetch: function (value) {

    return {
      upvoted: {
        $elemMatch: value
      }
    };

  },
  filter: function (value, message) {

    return message.upvoted.indexOf(value) !== -1;

  }
};

filters.specialFilters["downvoted"] = {
  or: true,
  fetch: function (value) {

    return {
      downvoted: {
        $elemMatch: value
      }
    };

  },
  filter: function (value, message) {

    return message.downvoted.indexOf(value) !== -1;

  }
};

app.use(express.static('static'));

app.use("/files", express.static("data/files"));

filters.privateFilter = function (message, user) {

  var audienceFilter = function (current) {

    if (!current.audience || !current.audience.length) {


      return true;

    } else {

      if (!user) {

        return false;

      } else {

        current.private = true;

        return (current.audience.indexOf(user) !== -1 || current.author === user);

      }

    }

  };

  if (Array.isArray(message)) {

    return message.filter(audienceFilter);

  } else {

    // Single message

    return audienceFilter(message);

  }

};

var messagesFromTags = function (tags, session) {

  // Strip out traling comma if set

  if (tags && tags[tags.length - 1] === ",") {

    tags = tags.slice(0, -1);

  }

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

      });

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
          });

        } else if (tag[0] === "!") {

          negative.push(tag.substring(1));

        } else {

          positive.push(tag);

        }

      });

      search = {
        "$and": [],
        "$or": []
      };

      special.forEach(function (item) {

        if (filters.specialFilters[item.type]) {

          var query = filters.specialFilters[item.type]["fetch"](item.value);

          // check if special filter is an and or an or

          if (item.negate) {

            query = {
              $not: query
            };

          }

          if (filters.specialFilters[item.type].or) {

            search["$or"].push(query);

          } else {

            search["$and"].push(query);

          }

        }

      });

      if (!search["$or"].length) {

        delete search["$or"];

      }

      positive.forEach(function (item) {

        search["$and"].push({
          tags: {
            $elemMatch: item
          }
        });

      });

      negative.forEach(function (item) {

        search["$and"].push({
          $not: {
            tags: {
              $elemMatch: negative[0]
            }
          }
        });

      });

      currentTags = positive;

    }

    filters.dbFetch("messages", search, {
      date: -1
    }, filters.config.pageSize).then(function (messages) {

      messages.forEach(function (message, index) {

        messages[index] = messageParse(message, currentTags, user);

      });

      messages.reverse();

      // Check if user has any other channels set, if so parse their messages as well.

      if (session.channels) {

        var fetchExternal = function (channel, data) {

          return new Promise(function (resolve, reject) {

            var requestServer;

            if (channel.path.protocol === "http:") {

              requestServer = http;

            } else {

              requestServer = https;

            }

            var options = {
              host: channel.path.host,
              path: data.tags + "?format=json&code=" + channel.code
            };

            var callback = function (response) {

              var str = '';

              response.on('data', function (chunk) {
                str += chunk;
              });

              response.on('end', function () {

                try {

                  var fetchedMessages = JSON.parse(str);

                  if (fetchedMessages.length) {

                    fetchedMessages.forEach(function (message, index) {

                      message.words = message.words.replace('src="/', 'src="' + channel.raw);

                      fetchedMessages[index].channel = channel.raw;

                    });

                    messages = messages.concat(fetchedMessages);

                  }

                } catch (e) {


                }

                resolve();

              });
            };

            var sendRequest = requestServer.request(options, callback);

            sendRequest.on("error", function (err) {

              filters.debug(err);

              resolve();

            });

            sendRequest.end();

          });

        };

        var request = {
          tags: tags
        };

        if (!request.tags) {

          request.tags = "";

        }

        if (session.filters) {

          if (request.tags) {

            request.tags = request.tags + "," + session.filters;

          } else {

            request.tags = session.filters;

          }

        }

        request.tags = "/" + request.tags;

        var promises = [];

        session.channels.forEach(function (element) {

          promises.push(fetchExternal(element, request, messages));

        });

        Promise.all(promises).then(function () {

          messages = filters.privateFilter(messages, user);

          // Sort messages

          messages.sort(function (a, b) {

            if (a.timestamp > b.timestamp) {

              return 1;

            } else if (a.timestamp < b.timestamp) {

              return -1;

            } else {

              return 0;

            }

          });

          // Limit messages

          messages.reverse();

          if (messages.length > filters.config.pageSize) {

            messages.length = filters.config.pageSize;

          }

          messages.reverse();

          resolve(messages);

        }, function (fail) {

          filters.debug(fail);

        });

      } else {

        messages = filters.privateFilter(messages, user);

        messages.length = filters.config.pageSize;

        resolve(messages);

      }


    }, function (err) {

      filters.debug(err);

      resolve([]);

    });

  });

};

var templateFile = fs.readFileSync(__dirname + "/index.html", "utf8");
var messagesTemplateFile = fs.readFileSync(__dirname + "/messages.html", "utf8");
var messageTemplateFile = fs.readFileSync(__dirname + "/message.html", "utf8");

var template = Handlebars.compile(templateFile);
var messagesTemplate = Handlebars.compile(messagesTemplateFile);
var messageTemplate = Handlebars.compile(messageTemplateFile);

app.get("/:tags?", function (req, res) {

  req.session.errors = req.flash('error');

  filters.apiCall(req).then(function () {

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

      filters.debug(reject);

    });

  })

});

// General message filtering function to check message and send socket notifiactions if necessary

var notifySockets = function (message, vote) {

  Object.keys(sockets).forEach(function (id) {

    var subscription = sockets[id].subscription;

    // Check if message should be received

    var send = filters.privateFilter(message, sockets[id].user);

    if (!send) {

      return false;

    }

    var specials = {};

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

          if (!specials[special.type]) {

            specials[special.type] = [];

          }

          specials[special.type].push(special);

        } else if (tag[0] === "!") {


          if (message.tags.indexOf(tag.substring(1)) !== -1) {

            send = false;

          }

        } else if (message.tags.indexOf(tag) === -1) {

          send = false;

        }

      }

    });

    // special filters

    Object.keys(specials).forEach(function (type) {

      if (filters.specialFilters[type]) {

        if (filters.specialFilters[type].or) {

          var passCount = 0;

          specials[type].forEach(function (currentFilter) {

            var localSend = filters.specialFilters[type]["filter"](currentFilter.value, message);

            if (currentFilter.negate) {

              localSend = !localSend;

            }

            if (localSend) {

              passCount += 1;

            }

          });

          if (!passCount) {

            send = false;

          }

        } else {

          specials[type].forEach(function (currentFilter) {

            var localSend = filters.specialFilters[currentFilter.type]["filter"](currentFilter.value, message);

            if (currentFilter.negate) {

              localSend = !localSend;

            }

            if (!localSend) {

              send = false;

            }

          });

        }


      }

    });

    if (send) {

      var output = {
        type: "message",
        message: message,
        vote: vote,
        template: messageTemplate({
          message: messageParse(message, sockets[id].subscription, id),
          session: sockets[id].session
        })

      };

      sockets[id].send(JSON.stringify(output));

    }

  });

  if (vote) {

    // Should send notifications to author if their message has been voted up or down

    Object.keys(sockets).forEach(function (id) {

      if (sockets[id].user === message.author) {

        var output = {
          type: "points",
          direction: vote.direction,
          user: vote.voter,
          message: message
        };

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
            };

            sockets[id].send(JSON.stringify(output));

          }

        });

      }

    });

  }

};

app.post("/points/:message", function (req, res) {

  if (!req.session.user) {

    res.status(403).send("Access denied");
    return false;

  }

  var updateNotification = function (message, vote) {

    // Send socket message with update to registered clients

    notifySockets(message, vote);

    res.status(200).send("OK");

  };

  if (req.body.direction === "+") {

    filters.dbUpdate("messages", {
      id: req.params.message,
      $not: {
        upvoted: {
          $elemMatch: req.session.user
        }
      }
    }, {
      $inc: {
        points: 1
      },
      $push: {
        upvoted: req.session.user
      }
    }, {
      returnUpdatedDocs: true
    }).then(function (data) {

      if (data) {

        updateNotification(data, {
          direction: req.body.direction,
          voter: req.session.user
        });

      }

    }, function (err) {

      filters.debug(err);

    });

  } else if (req.body.direction === "-") {

    filters.dbUpdate("messages", {
      id: req.params.message,
      $not: {
        downvoted: {
          $elemMatch: req.session.user
        }
      }
    }, {
      $inc: {
        points: -1
      },
      $push: {
        downvoted: req.session.user
      }
    }, {
      returnUpdatedDocs: true
    }).then(function (data) {

      if (data) {

        updateNotification(data, {
          direction: req.body.direction,
          voter: req.session.user
        });

      }

    });

  } else {

    res.status(400).send("Invalid points value");

  }

});

app.post('/meta/login', function (req, res, next) {
  passport.authenticate('local', function (err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      res.send("error");
    } else {

      req.logIn(user, function (err) {
        if (err) {
          return next(err);
        }
        return res.send("ok");
      });

    }
  })(req, res, next);
});


app.post("/meta/getAuthCode", function (req, res) {

  filters.dbFetch("users", {
    username: req.session.user
  }).then(function (data) {

    if (!data.length) {

      res.send("error");

    } else {

      var user = data[0];

      bcrypt.compare(req.body.password, user.password, function (err, response) {
        if (response === true || req.body.password === user.password) {

          res.send(req.session.authCode);

        } else {

          res.send("error");

        }

      })
    }
  })
})


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

  });

});

var messageCount = 0;

filters.dbCount("messages").then(function (count) {

  messageCount = count;

});

app.post("/:tags?", function (req, res, next) {

  req.pipe(req.busboy);

  req.busboy.on("limit", function () {

    req.body.error = "File too big";

  })

  req.busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {

    if (!filename) {

      file.resume();

    }

    if (filename) {

      if (mimetype.indexOf("image") === -1) {

        req.body.error = "bad file";
        file.resume();
        return false;

      }

      var filePath = "/files/" + Date.now() + "_" + filename;

      req.body.file = filePath;

      var fstream = fs.createWriteStream(__dirname + "/data" + filePath);
      file.pipe(fstream);
      fstream.on('close', function () {

      });

    }

  });

  req.busboy.on('field', function (key, value) {

    req.body[key] = value;

  });

  req.busboy.on('finish', function () {

    next();

  });

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

      if (word[0] === "@" && word.length > 1) {

        tags.push(word);

      }

    });

    tags.forEach(function (tag, index) {

      if (tag.indexOf("=") !== -1) {

        tags.splice(index, 1);

      } else {

        tags[index] = tag.replace(/[^a-zA-Z0-9-@!]/g, "");

      }

    });

    var idParams = messageCount + req.body.words.length + Date.now();

    var id = hashids.encode(idParams);

    tags.forEach(function (currentTag, index) {

      if (!currentTag.length) {

        tags.splice(index, 1);

      }

    });

    var message = {
      words: req.body.words,
      author: req.session.user,
      file: req.body.file,
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
    });

    message.tags.forEach(function (element, index) {

      message.tags[index] = element.toLowerCase();

    });

    message.tags = message.tags.filter(function (element) {

      return (element[0] !== "!");

    });

    // Parse private-mentions (double @) and make private message.

    message.audience = [];

    message.tags.forEach(function (tag) {

      if (tag.indexOf("@@") === 0) {

        var mentioned = tag.replace("@@", "");

        message.audience.push(mentioned);

        // Push in the soft mention too so that it can be listed with other mentions.

        message.tags.push("@" + mentioned);

      }

    });

    filters.dbInsert("messages", message).then(function (newDoc) {

      messageCount += 1;

      if (!req.params.tags) {

        req.params.tags = "";

      }

      notifySockets(message);

      res.redirect("/" + req.params.tags);


    }, function (fail) {

      filters.debug(fail);

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

        if (!tags.length) {

          tags = [];

        } else {

          tags = tags.split(",");

          tags.forEach(function (tag, index) {

            tags[index] = decodeURI(tag);

          });

          tags = tags.map(function (tag) {

            return tag.toLowerCase();

          });

        }

        subscription = tags;

        var cookies = cookie.parse(ws.upgradeReq.headers.cookie);
        var sid = cookieParser.signedCookie(cookies["connect.sid"], secret);

        sessionStore.get(sid, function (err, results) {

          if (message.user) {

            ws.user = message.user;

          }

          if (results) {

            ws.session = results;

            if (results.filters) {

              subscription = subscription.concat(results.filters.split(","));

            }

          }

          ws.subscription = subscription;

        });

      }

    } catch (e) {

      filters.debug(e);

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

server.listen(filters.config.port);
