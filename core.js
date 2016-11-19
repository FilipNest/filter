var Datastore = require('nedb');
var Handlebars = require('handlebars');
var moment = require("moment");

var db = new Datastore({
  filename: 'words.db',
  autoload: true
});

var util = require("util");

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
  bodyParser = require('body-parser'),
  port = 7777;

app.use(bodyParser.urlencoded({
  extended: false
}));

app.use(bodyParser.json());

var session = require('express-session');

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));

var Hashids = require('hashids');
var hashids = new Hashids();

app.use(function (req, res, next) {

  if (!req.session.user) {

    req.session.user = "user-" + hashids.encode(Date.now());

  }

  next();

});

var messageParse = function (rawMessage, currentTags, currentUser) {

  var message = {}

  Object.assign(message, rawMessage);

  // Reply is all tags

  message.reply = JSON.parse(JSON.stringify(message.tags));

  message.parent = message.tags.filter(function (item) {

    return item !== message.author && item !== message.id;

  })

  message.tags = message.tags.filter(function (item) {

    return item !== message.author && item !== message.id && currentTags.indexOf(item) === -1;

  })

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

specialFilters["points"] = function (value) {

  return {
    "points": {
      "$gt": value - 1
    }
  }

};

specialFilters["author"] = function (value) {

  return {
    "author": value
  }

};

specialFilters["upvoted"] = function (value) {

  return {
    upvoted: {
      $elemMatch: value
    }
  }

};

specialFilters["downvoted"] = function (value) {

  return {
    downvoted: {
      $elemMatch: value
    }
  }

};

app.use(express.static('static'));

var fs = require("fs");

var messagesFromTags = function (tags, user) {

  return new Promise(function (resolve, reject) {

    var currentTags = [];

    var search;

    if (!tags || tags === "") {

      search = {};

    } else {

      var parsedTags = tags.split(",");

      var positive = [];
      var negative = [];
      var special = [];

      var specialOptions = ["points", "upvoted", "downvoted", "author"];

      parsedTags.forEach(function (tag) {

        if (tag.split("~").length > 1) {

          var specialTag = tag.split("~");
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

          var query = specialFilters[item.type](item.value);

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

    debug(search);

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

app.get("/:tags?", function (req, res) {

  var templateFile = fs.readFileSync(__dirname + "/index.html", "utf8");
  var messagesTemplateFile = fs.readFileSync(__dirname + "/messages.html", "utf8");
  var messageTemplateFile = fs.readFileSync(__dirname + "/message.html", "utf8");

  var template = Handlebars.compile(templateFile);
  var messagesTemplate = Handlebars.compile(messagesTemplateFile);
  var messageTemplate = Handlebars.compile(messageTemplateFile);

  messagesFromTags(req.params.tags, req.session.user).then(function (messages) {

    var output = template({
      tagsJSON: req.params.tags,
      tags: req.params.tags ? req.params.tags.split(",") : null
    });

    var messageBlock = messagesTemplate({
      messages: messages,
      tags: req.params.tags
    });

    var innerBlock = "";

    messages.forEach(function (message) {

      innerBlock += messageTemplate({
        message: message
      });

    });

    messageBlock = messageBlock.replace("MESSAGE", innerBlock);

    output = output.replace("MESSAGES", messageBlock);

    res.send(output);

  })

});

app.post("/points/:message", function (req, res) {

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
      upsert: true
    }, function (updated) {

      res.redirect("/" + req.body.current);

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
      upsert: true
    }, function () {

      res.redirect("/" + req.body.current);

    });

  } else {

    res.status(400).send("Invalid points value")

  }

});

app.get("/meta/refresh/:tags?", function (req, res) {

  messagesFromTags(req.params.tags, req.session.user).then(function (messages) {

    var messagesTemplateFile = fs.readFileSync(__dirname + "/messages.html", "utf8");
    var messagesTemplate = Handlebars.compile(messagesTemplateFile);
    var messageTemplateFile = fs.readFileSync(__dirname + "/message.html", "utf8");
    var messageTemplate = Handlebars.compile(messageTemplateFile);

    var messageBlock = messagesTemplate({
      messages: messages,
      tags: req.params.tags
    });

    var innerBlock = "";

    messages.forEach(function (message) {

      innerBlock += messageTemplate({
        message: message
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

  var messageTemplateFile = fs.readFileSync(__dirname + "/message.html", "utf8");
  var messageTemplate = Handlebars.compile(messageTemplateFile);

  var post = req.body;

  if (req.body.words && typeof req.body.words === "string" && req.body.words.length < 500) {

    var tags = req.body.tags.split(",");

    var wordsInMessage = req.body.words.split(" ").forEach(function (word) {

      if (word[0] === "#") {

        var tag = word.substring(1);

        tags.push(tag);

      }

    });

    tags.forEach(function (tag, index) {

      tags[index] = tag.replace(/\W/g, '');

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
      id: id,
      date: Date.now(),
      tags: tags,
      points: 0,
      upvoted: [],
      downvoted: []
    };

    message.tags.push(message.author);
    message.tags.push(message.id);

    message.tags = message.tags.filter(function (item, pos, self) {
      return self.indexOf(item) == pos;
    })

    db.insert(message, function (err, newDoc) {

      messageCount += 1;

      if (!req.params.tags) {

        req.params.tags = "";

      }

      Object.keys(sockets).forEach(function (id) {

        var subscription = sockets[id].subscription;

        var send = true;

        subscription.forEach(function (tag) {

          if (tag.length) {

            if (tags.indexOf(tag) === -1) {

              send = false;

            }

          }

        })

        if (send) {

          sockets[id].send(messageTemplate({
            message: messageParse(message, sockets[id].subscription, id)
          }));

        }

      })

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

        var tags = message.tags.substring(1);

        if (tags === "") {



        } else {

          tags = tags.split(",")

          tags.forEach(function (tag, index) {

            tags[index] = decodeURI(tag);

          })

          subscription = tags;

        }

        ws.subscription = subscription;

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

  //  ws.send('something');

});

server.on('request', app);

server.listen(port);
