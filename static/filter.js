document.addEventListener("DOMContentLoaded", function (event) {

  $("#postmessage").submit(function (e) {

    var data = $("#postmessage").serialize();

    $.post(document.location.href, data, function () {

      $("#words").val("");;

    })

    e.preventDefault();

    return false;

  })

  window.scrollTop = function () {

    $('#chat').scrollTop($('#chat')[0].scrollHeight);

  };

  scrollTop();

  var stateObject = {};

  window.refresh = function () {

    var currentTags = $('#tags').val();

    $.get("/meta/refresh/" + $('#tags').val(), function (result) {

      $("#chat")[0].outerHTML = result;

      scrollTop();

      if (!currentTags) {

        history.pushState(stateObject, currentTags, "/");

      } else {

        history.pushState(stateObject, currentTags, currentTags);

      }

      $("#tagField").val(currentTags);

      if (currentTags) {

        $("h1").text(currentTags);

      } else {

        $("h1").text("*");

      }

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
          tags: document.location.pathname
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

          $("#chat").append(evt.data);
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
