document.addEventListener("DOMContentLoaded", function (event) {

  $("#postmessage").submit(function (e) {

    var data = $("#postmessage").serialize();

    $.post(document.location.href, data, function () {

      $("#words").val("");;

    })

    e.preventDefault();

    return false;

  })

  window.vote = function (e) {

    if (!window.loggedIn) {

      alert("You need to be logged in to vote");
      e.preventDefault();
      return false;

    }

    var button = $(e.target);

    var location = "points/" + $(button).attr("data-message");

    var data = $.param({
      direction: $(button).attr("value"),
      tags: $(button).attr("data-tags")
    })

    $.post(location, data, function () {

      $(button).attr("disabled", "disabled");

    })

    e.preventDefault();

    return false;

  }

  window.scrollTop = function () {

    $('#chat').scrollTop($('#chat')[0].scrollHeight);

  };

  scrollTop();

  var stateObject = {};

  window.refresh = function () {

    var currentTags = $('#tags').val();

    document.title = "| Filters | " + currentTags;

    $.get("/meta/refresh/" + $('#tags').val(), function (result) {

      $("#chat")[0].outerHTML = result;

      scrollTop();

      if (!currentTags) {

        history.pushState(stateObject, currentTags, "/");

      } else {

        history.pushState(stateObject, currentTags, currentTags);

      }

      $("#tagField").val(currentTags);

      window.pair();

    })

  }

  var currentTags = document.location.pathname.substring(1).split(",");

  if (currentTags.length === 1 && currentTags[0] === "") {

    currentTags.length = 0;

  }

  $('#tags').tagsInput({
    width: "100%",
    onChange: window.refresh(),
    defaultText: "",
    tagValidator: function (tag) {

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

    var connectSocket = function () {

      var websocket;

      window.pair = function () {

        var message = {
          type: "pair",
          tags: document.location.pathname,
          user: window.loggedIn
        };

        websocket.send(JSON.stringify(message));

      };

      if (window.location.protocol === "https:") {

        websocket = new WebSocket("wss://" + document.location.host);

      } else {

        websocket = new WebSocket("ws://" + document.location.host);

      }

      websocket.onmessage = function (evt) {

        if (evt.data) {

          var message = JSON.parse(evt.data);


          if (message.type === "mention") {

            console.log("mentioned", message.message);

          } else if (message.type === "points") {

            console.log("points", message.message, message.points)

          } else {

            var update = $("#" + message.message.id)[0];
            if (update) {

              update.outerHTML = message.template;

            } else {

              // Check where to add message (it could be earlier in the chain)

              var later;

              $.each($(".message-wrapper"), function (index, element) {

                var messageDate = $(element).attr("data-timestamp");

                var updateDate = message.message.date;

                if (messageDate > updateDate) {

                  later = element;

                }

              })

              if (later) {

                $(later).before(message.template);

              } else {

                $("#chat").append(message.template);

              }

            }

          }

          window.scrollTop();

        };

      }

      websocket.onopen = function () {

        window.pair();

      };

      websocket.onclose = function (close) {

        setTimeout(function () {
          connectSocket();
        }, 2000);

      };

    }

    connectSocket();
  }

  $("#words").focus();

  document.getElementById("words").onkeyup = function (e) {
    e = e || event;
    if (e.keyCode === 13 && !e.shiftKey) {

      $("#postmessage").submit();

    }
    return true;
  }

});
