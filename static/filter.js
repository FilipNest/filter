document.addEventListener("DOMContentLoaded", function (event) {

  window.sendMessage = function () {

    var datastring = $("#postmessage").serialize();
    $.ajax({
      type: "POST",
      url: document.location.href,
      data: datastring,
      success: function (data) {

        document.location.href = document.location.href;

      },
      error: function () {
        alert('error handing here');
      }
    });

  };

  var scrollTop = function () {

    $('#chat').scrollTop($('#chat')[0].scrollHeight);

  };

  scrollTop();

  var stateObject = {};

  window.refresh = function () {

    $.get("/meta/refresh/" + $('#tags').val(), function (result) {

      $("#messages")[0].innerHTML = result;

      scrollTop();

      history.pushState(stateObject, $('#tags').val(), $('#tags').val());

    })

  }

  var currentTags = document.location.pathname.substring(1).split(",");

  if (currentTags.length === 1 && currentTags[0] === "") {

    currentTags.length = 0;

  }

  $('#tags').tagsInput({
    width: "100%",
    onChange: window.refresh
  });

});
