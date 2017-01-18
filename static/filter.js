document.addEventListener("DOMContentLoaded", function (event) {

  // Popup theme

  vex.defaultOptions.className = 'vex-theme-plain';

  $("#login").click(function () {

    vex.dialog.open({
      "message": "Login",
      input: "<input type='text' placeholder='username or email' name='username'/><br /><input type='password' placeholder='password' name='password'/>",
      callback: function (response) {

        if (response.password) {

          $.post("/meta/login", {
              username: response.username,
              password: response.password
            })
            .done(function (data) {

              if (data === "error") {

                vex.dialog.alert("Wrong info");

              } else {

                window.location.href = window.location.href;

              }

            });

        }
      }
    });

  })

  $("#register").click(function () {

    vex.dialog.open({
      "message": "Register for an account",
      input: "<input type='email' placeholder='email' name='email'/><br /><input placeholder='username' type='text' name='username'/><br /><input type='password' name='password'/>",
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

  })

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

    var reader = new FileReader();

    reader.addEventListener("load", function () {

      $(".fileUpload").css('background-image', 'url("' + reader.result + '")');

    }, false);

    if (file) {
      reader.readAsDataURL(file);
    }

  })

  $("#authCodeReveal").click(function (event) {

    vex.dialog.open({
      "message": "Enter your password to get the API code",
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

    event.preventDefault;
    return false;

  })

  $(".addChannel").click(function (event) {

    var number = $("#channelList").find(".channel").length;

    $("#channelList").append('<fieldset class="channel"><input type="text" name="channel-number-' + number + '" placeholder="http://..." /><input type="password" name="channel-code-' + number + '" value="" placeholder="Set authcode" /><button class="removeChannel">Remove</button></fieldset>');

    event.preventDefault();

    return false;

  });

  $("#channelList").on("click", ".removeChannel", function (event) {

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

    $("html, body").animate({
      scrollTop: $(document).height()
    }, 200);

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

  window.refresh = function () {

    var currentTags = $('#tags').val();

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

            //Mentioned

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

  document.getElementById("words").onkeyup = function (e) {
    e = e || event;
    if (e.keyCode === 13 && !e.shiftKey) {

      $("#postmessage").submit();

    }
    return true;
  };

});
