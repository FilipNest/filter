document.addEventListener("DOMContentLoaded", function (event) {

  var __ = function (words) {

    if (window.translations[words]) {
      return window.translations[words];
    } else {

      return words;

    }

  };

  if (window.loggedIn) {

    // Request permission for notifactions if not granted

    if (window.Notification && window.Notification.permission === "granted") {

      window.notifyOn = true;

    } else if (Notification.permission !== 'denied') {

      Notification.requestPermission(function (permission) {
        if (permission === "granted") {
          window.notifyOn = true;
        }
      });

    }

  }

  window.filterCategories = {
    "tags": [],
    "author": [],
    "minpoints": [],
    "upvoted": [],
    "downvoted": []
  };

  window.parseFriendlyFilters = function (form, callback) {

    var output = [];

    Object.keys(form).forEach(function (key) {

      var negate = 0;

      if (key[0] === "!") {

        negate = true;

      }

      var type = key.substring(1);

      var values = form[key];

      // Remove whitespace

      values.replace(/\s/g, '');

      var valuesList = values.split(",");

      valuesList.forEach(function (value) {

        var formattedFilter = "";

        if (type === "tags") {

          formattedFilter = value;

        } else {

          formattedFilter = type + "=" + value;

        }

        if (negate) {

          formattedFilter = "!" + formattedFilter;

        }

        output.push(formattedFilter);

      });

    });

    callback(output.join(","));

  };

  window.friendlyFilters = function (filters) {

    var filtersList = filters.split(",");

    filtersList.forEach(function (filter) {

      if (!filter) {

        return false;

      }

      var negate;

      if (filter[0] === "!") {

        filter = filter.substring(1);
        negate = true;

      }

      if (filter.indexOf("=") !== -1) {

        var parts = filter.split("=");

        var type = parts[0];
        var value = parts[1];

        if (window.filterCategories[type]) {

          window.filterCategories[type].push({
            value: value,
            negate: negate
          });

        }

      } else {

        window.filterCategories.tags.push({
          value: filter,
          negate: negate
        });

      }

    });

    // Generate form

    var form = "";

    Object.keys(window.filterCategories).forEach(function (key) {

      var positive = window.filterCategories[key].filter(function (item) {

        return !item.negate;

      });

      var negative = window.filterCategories[key].filter(function (item) {

        return item.negate;

      });

      form += "<fieldset class='filterBox'>";
      form += "<label>" + key + "</label>";
      form += "<button class='positive switch'>" + __("Include") + "</button>";

      form += '<textarea class="positive" name="+' + key + '">' + positive.map(function (item) {
        return item.value;
      }).join(",") + '</textarea>';

      form += '<textarea class="negative" name="!' + key + '">' + negative.map(function (item) {
        return item.value;
      }).join(",") + '</textarea>';

      form += "</fieldset>";

    });

    return form;

  };

  $("body").on("click", ".switch", function (e) {

    var button = $(e.target);

    button.toggleClass("positive");
    button.toggleClass("negative");

    if (button.hasClass("positive")) {

      button.html(__("Include"));

    } else {

      button.html(__("Exclude"));

    }

    e.preventDefault();

    return false;

  });

  // Detect commas or spaces in tag field

  $("body").on("keyup", "#tags_tag", function (event) {

    if (event.keyCode == 32 || event.keyCode == 44) {

      var e = $.Event("keypress", {
        which: 13,
        keyCode: 13
      });
      $("#tags_tag").trigger(e);

      event.preventDefault();

    }

  });

  // Popup theme

  vex.defaultOptions.className = 'vex-theme-top';

  $("#login").click(function () {

    vex.dialog.open({
      "message": __("Login"),
      input: "<input type='text' placeholder='username or email' name='username'/><br /><input type='password' placeholder='password' name='password'/>",
      callback: function (response) {

        if (response.password) {

          $.post("/meta/login", {
              username: response.username,
              password: response.password
            })
            .done(function (data) {

              if (data === "error") {

                vex.dialog.alert(__("Wrong info"));

              } else {

                window.location.href = window.location.href;

              }

            });

        }
      }
    });

  });

  $("#register").click(function () {

    vex.dialog.open({
      "message": __("Register for an account"),
      input: "<input type='email' placeholder='email' name='email'/><br /><input placeholder='username' type='text' name='username'/><br /><input placeholder='password' type='password' name='password'/>",
      callback: function (response) {

        if (response.password) {

          $.post("/meta/newuser", {
              username: response.username,
              password: response.password,
              email: response.email
            })
            .done(function (data) {

              if (data.error) {

                vex.dialog.alert(data.error);

              } else {

                window.location.href = window.location.href;

              }

            });

        }
      }
    });

  });

  $("#userFilters").click(function () {

    // Format userfilters

    var form = window.friendlyFilters($("<textarea/>").html(window.userFilters).text());

    vex.dialog.open({
      "message": __("Filters that are always applied when you're logged in, useful for blocking specific users, downvoted posts etc)."),
      input: form,
      callback: function (response) {

        if (response) {

          window.parseFriendlyFilters(response, function (filters) {

            $.post("/meta/userfilters", {
                filters: filters
              })
              .done(function (data) {

                if (data.error) {

                  vex.dialog.alert(data.error);

                } else {

                  window.location.href = window.location.href;

                }

              });

          });
        }
      }
    });

  });

  $("#channelsMenu").click(function () {

    vex.dialog.open({
      "message": __("Insert extra URLS you want to listen to messages from. Get an Authcode from the settings page of the channel site itself once logged in there."),
      input: $("#channelsForm").html(),
      callback: function (response) {

        if (response) {

          $.post("/meta/userchannels", response)
            .done(function (data) {

              window.location.href = window.location.href;

            });

        }
      }
    });

  });

  $("#postmessage").submit(function (e) {

    var form = document.querySelector('#postmessage');
    var formData = new FormData(form);

    $.ajax({
      url: document.location.href,
      type: 'POST',
      data: formData,
      cache: false,
      contentType: false,
      processData: false,
    });

    $(".fileUpload").css('background-image', 'url("/icons/image.svg")');

    $("#postmessage")[0].reset();

    e.preventDefault();

    return false;

  });

  $("#upload").on("change", function (e) {

    var file = this.files[0];

    if (!file) {

      $(".fileUpload").removeClass('done');
      $(".fileUpload").css('background-image', '');

    }

    var reader = new FileReader();

    reader.addEventListener("load", function () {

      vex.dialog.prompt({
        "unsafeMessage": "<img class='preview' src='" + reader.result + "'><p>" + __("Describe this image (alt text)") + "</p>",
        callback: function (data) {

          if (data) {

            $("#fileAlt").val(data);

          }

        }
      });

      $(".fileUpload").css('background-image', 'url("' + reader.result + '")');
      $(".fileUpload").addClass('done');

    }, false);

    if (file) {
      reader.readAsDataURL(file);
    }

  });

  $("body").on("click", ".authCodeReveal", function (event) {

    vex.dialog.open({
      "message": __("Enter your password to get the API code"),
      input: "<input type='password' name='password'/>",
      callback: function (password) {

        if (password) {

          $.post("/meta/getAuthCode", {
              password: password.password
            })
            .done(function (data) {

              if (data === "error") {

                vex.dialog.alert("Wrong info");

              } else {
                $("#authCodeReveal").hide();
                $(".authcode").show().html(data);

              }

            });

        }
      }
    });

    event.preventDefault();
    return false;

  });

  $("body").on("click", ".addChannel", function (event) {

    var number = $(".channelList").find(".channel").length;

    $(".channelList").append('<fieldset class="channel"><input type="text" name="channel-number-' + number + '" placeholder="http://..." /><input type="password" name="channel-code-' + number + '" value="" placeholder="Set authcode" /><button class="removeChannel">Remove</button></fieldset>');

    event.preventDefault();

    return false;

  });

  $("body").on("click", ".removeChannel", function (event) {

    var input = $(event.target).parent().remove();

    event.preventDefault();

    return false;

  });

  window.vote = function (e) {

    var button = $(e.target);

    var location = "points/" + $(button).attr("data-message");

    var data = $.param({
      direction: $(button).attr("value"),
      tags: $(button).attr("data-tags")
    });

    var wrapper = $(e.target).closest(".message-wrapper");

    $.post($(wrapper).attr("data-channel") + location, data, function () {

      $(button).attr("disabled", "disabled");

    });

    e.preventDefault();

    return false;

  };

  window.scrollTop = function () {

    $("html, body").scrollTop($(document).height());

    $('body').imagesLoaded(function () {
      $("html, body").scrollTop($(document).height());
    });

  };

  window.scrollTop();

  var stateObject = {};

  // Wrapper to check for readystate before sending

  window.sendSocketMessage = function (websocket, message) {

    var sent = false;

    var interval = window.setInterval(function () {

      if (sent) {

        window.clearInterval(interval);

      } else {

        if (websocket.readyState === 1) {

          websocket.send(message);

          sent = true;

        }

      }

    }, 100);

  };

  window.placeHolderRefresh = function () {

    var currentTags = $('#tags').val();

    // Split into words

    currentTags = currentTags.split(",");

    // Remove special filters

    currentTags = currentTags.filter(function (tag) {

      return (tag.indexOf("!") === -1) && (tag.indexOf("=") === -1);

    });

    var placeholder = __("Write anything") + " ";

    if (currentTags.length && currentTags[0].length) {

      var last = currentTags.pop();


      if (currentTags.length) {

        placeholder += __("about") + " " + currentTags.join(', ') + ' & ' + last;

      } else {

        placeholder += __("about") + " " + last;

      }

    }

    $("#words").attr("placeholder", placeholder);

  };

  window.placeHolderRefresh();

  window.refresh = function () {

    var currentTags = $('#tags').val();

    window.placeHolderRefresh();

    currentTags = currentTags.split("#").join("");

    document.title = "| Filters | " + currentTags;

    jQuery.get("/meta/refresh/" + currentTags, function (result) {

      $("#chat")[0].outerHTML = result;

      window.scrollTop();

      if (!currentTags) {

        history.pushState(stateObject, currentTags, "/");

      } else {

        history.pushState(stateObject, currentTags, currentTags);

      }

      $("#tagField").val(currentTags);

      window.pair();

    });

  };

  var currentTags = document.location.pathname.substring(1).split(",");

  if (currentTags.length === 1 && currentTags[0] === "") {

    currentTags.length = 0;

  }

  $('#tags').tagsInput({
    height: "54px",
    onChange: window.refresh(),
    defaultText: "",
    tagValidator: function (tag) {

      // Remove # if added

      if (tag[0] === "#") {

        tag = tag.substring(1);

      }

      function isValid(str) {
        return /^[a-z\d\-_=@!]+$/i.test(str);
      }

      if (!isValid(tag)) {


        return false;

      } else {

        return true;

      }

    },
    onRemoveTag: window.refresh,
    onAddTag: window.refresh
  });

  // Websocket stuff

  if (window.WebSocket) {

    window.socketChannels = [];

    window.pair = function () {

      Object.keys(window.socketChannels).forEach(function (key) {

        var channel = window.socketChannels[key];

        var message = {
          type: "pair",
          tags: document.location.pathname,
          user: window.loggedIn
        };

        window.sendSocketMessage(channel, JSON.stringify(message));

      });

    };

    var connectSocket = function (channel, local, secure) {

      var websocket;

      if (secure) {

        websocket = new WebSocket("wss://" + channel);

      } else {

        websocket = new WebSocket("ws://" + channel);

      }

      window.socketChannels[channel] = websocket;

      websocket.onmessage = function (evt) {

        if (evt.data) {

          var message = JSON.parse(evt.data);

          if (message.type === "mention") {

            if (message.message.author !== window.loggedIn && !document.hasFocus()) {

              new Notification(__("Mentioned by") + " " + message.message.author, {
                body: message.message.words,
                icon: "/icons/favicon.png"
              });

            }

          } else if (message.type === "points") {

            //Points

          } else {

            var update = $("#" + message.message.id)[0];

            if (update) {

              update.outerHTML = message.template;

              if (message.vote) {

                var buttons = $("#" + message.message.id).find(".vote button");

                if (message.message.upvoted.indexOf(window.loggedIn) !== -1) {

                  buttons[0].disabled = true;

                }

                if (message.message.downvoted.indexOf(window.loggedIn) !== -1) {

                  buttons[1].disabled = true;

                }

              }

            } else {

              // Check where to add message (it could be earlier in the chain)

              var later;

              $.each($(".message-wrapper"), function (index, element) {

                var messageDate = $(element).attr("data-timestamp");

                var updateDate = message.message.date;

                if (messageDate > updateDate) {

                  later = element;

                }

              });

              if (later) {

                $(later).before(message.template);

              } else {

                $("#chat").append(message.template);

              }

              window.scrollTop();

            }

            message = $("#" + message.message.id);

            if (!local) {

              // Hide vote buttons

              message.attr("data-channel", channel);
              message.find(".message-channel").text(" (" + channel + ") ");
              message.find(".vote").hide();

              var image = message.find(".message img")[0];

              if (image) {

                var imagePath = $(image).attr("src");

                $(image).attr("src", channel + imagePath);

              }

            }

          }

        }

      };

      websocket.onopen = function () {

        window.pair();

      };

      websocket.onclose = function (close) {

        setTimeout(function () {
          connectSocket(channel, local, secure);
        }, 2000);

      };

    };

    connectSocket(document.location.host, true, window.location.protocol === "https:");

    if (window.channels) {

      window.channels.forEach(function (channel) {

        connectSocket(channel.path.host, false, channel.path.protocol === "https:");

      });

    }

  }

  $("#words").focus();

  if (document.getElementById("words")) {
    document.getElementById("words").onkeyup = function (e) {
      e = e || event;
      if (e.keyCode === 13 && !e.shiftKey) {

        $("#postmessage").submit();

      }
      return true;
    };
  }

  $("#filters").click(function () {

    var currentTags = $('#tags').val();

    // Get form
    var form = window.friendlyFilters(currentTags);

    vex.dialog.open({
      message: __("Helper for filters. Toggle include and exclude buttons and put in comma seperated values."),
      input: form,
      callback: function (value) {

        window.parseFriendlyFilters(value, function (output) {

          window.location.pathname = output;

        });

      }
    });

  });

});
