document.addEventListener("DOMContentLoaded", function (event) {

  var chatWindow = $("#chat")[0];

  chatWindow.scrollTop = chatWindow.scrollHeight;

  window.refresh = function () {

    document.location.href = "/" + $('#tags').val();

  }

  var currentTags = document.location.pathname.substring(1).split(",");

  if (currentTags.length === 1 && currentTags[0] === "") {

    currentTags.length = 0;

  }

  $('#tags').tagsInput({});

});
