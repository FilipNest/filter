document.addEventListener("DOMContentLoaded", function (event) {

  var scrollTop = function () {

    $('#chat').scrollTop($('#chat')[0].scrollHeight);

  };

  scrollTop();

  var stateObject = {};

  window.refresh = function () {

    var currentTags = $('#tags').val();

    $.get("/meta/refresh/" + $('#tags').val(), function (result) {

      $("#messages")[0].innerHTML = result;

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

    })

  }

  var currentTags = document.location.pathname.substring(1).split(",");

  if (currentTags.length === 1 && currentTags[0] === "") {

    currentTags.length = 0;

  }

  $('#tags').tagsInput({
    width: "100%",
    onRemoveTag: window.refresh,
    onAddTag: window.refresh
  });

});
