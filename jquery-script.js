
function main() {

  /*
   * Titles, reviews, etc. [From http://userscripts.org/scripts/show/102008]
   */

  function addTitles() {
    var donePage = ""
    var h = setInterval(function () {
      var page = document.location.hash
      if(page.match(/(#playlist|#play_queue|#album)/) && page!=donePage) {
        var divToLookFor
        if(page.match(/#playlist/))
          divToLookFor = "#playlist_container"
        else if(page.match(/#album/))
          divToLookFor = ".album_pic"
        else if(page.match(/#play_queue/))
          divToLookFor = "#queue"

        if ($(divToLookFor).length > 0){
          //clearInterval(h) => can't because page doesn't load again
          donePage = page
          addTrackTitles()
          addAlbumTitles()
          if(divToLookFor == ".album_pic")
            addReviews();
        }
      }
    }, 1000);
  }

  function addTrackTitles() {
    var $trackTitles = $(".track_name")
    $trackTitles.each(function(){
      $(this).attr("title",cleanupName($(this).html()))
    })
  }

  function addAlbumTitles() {
    var $albumTitles = $(".album_name")
    $albumTitles.each(function(){
      $(this).attr("title",cleanupName($(this).html()))
    })
  }

  function addReviews() {
    var page = document.location.hash
    var albumID = page.match(/#album\/(.*)/)[1]
    var url = "http://mog.com/albums/mn" + albumID

    $.ajax({
      url: url,
      dataType: "html",
      success: function processData(datastring) {
          var labelPosition = $(".album_label").position()
          var reviewcontent = $(datastring).find("div.reviewlist.pro").html()
          if(reviewcontent) {
            //new positioning code so added MOG metadata doesn't mess up review positioning
            $("li.clrfx.album").after("<div style=\"width:540px;float:left;margin-top:3px;\">" + reviewcontent + "</div>")
            var stars = $(datastring).find("div.stars.inactive").attr("title")
            $("div.stars.inactive").html("AMG Rating: <span style=\"color:red\">" + stars + "</span> stars")
          } else {
            $("li.clrfx.album").after("<div style=\"width:540px;float:left;margin-top:3px;\">" + "No Reviews Yet" + "</div>")
          }
        }
    });
  }

  function cleanupName(name) {
    return name.replace(/&amp;/g, "&");
  }

  addTitles();

  /*
   * Shuffle [From http://userscripts.org/scripts/show/102008]
   */

  function addShuffleButton() {
    $("<a/>")
      .attr({ "id" : "shuffle_button",
       "title" : "Shuffle tracks in Queue"})
      .addClass("control")
      .css({ "float" : "right",
       "padding" : "6px 5px",
       "color" : "gray" })
      .html("Shuffle")
      .click(shuffleQueue)
      .appendTo($("#queue_controls"));
  }

  function shuffleQueue() {
    var ul = $("#realized");
    var lis = ul.find(".track").detach();
    lis = shuffled(lis);
    lis.appendTo(ul);
    Mog.detectWebDb() && Mog.ui.saveRealized();
  }

  function shuffled(l) {
    l.swap = function(i,j) { var t = this[i]; this[i] = this[j]; this[j] = t; };
    var n = l.length;
    for (var i = 0; i < n; i++) {
      var r = Math.floor(Math.random() * (n-i));
      l.swap(i, i + r);
    }
    return l;
  }

  addShuffleButton();

  /*
   * Keybindings
   */

  var _debug = function(e, msg) {
    if(true) {
      console.log(e);
      console.log(msg + ': ' + String.fromCharCode(e.which) + ' (' + e.which + ')');
    }
  };

  lastNonSearchUrl = null;
  $('#searchbox').focus(function(e) {
    if (!window.location.hash.match(/^#search\//)) {
      lastNonSearchUrl = window.location.toString(); // (Copy!)
    }
  });

  $('input, textarea').keydown(function(e) {
    _debug(e, 'input down');
    if (13 == e.which) { // enter
      $(e.target).blur();
    }
    if (27 == e.which) { // esc
      $(e.target).val('');
      $(e.target).blur();
      if (lastNonSearchUrl) {
        window.location  = lastNonSearchUrl;
        lastNonSearchUrl = null;
      }
    }
    e.stopPropagation();
  });
  $('input, textarea').keypress(function(e) {
    _debug(e, 'input press');
    e.stopPropagation();
  });

  $(document).keydown(function(e) {
    _debug(e, 'document down');
    if (37 == e.which && !(e.altKey || e.ctrlKey || e.metaKey || e.shiftKey)) { // left
      $("#previous").click();
      // Mog.ui.previousTrack();
      
    }
    if (39 == e.which && !(e.altKey || e.ctrlKey || e.metaKey || e.shiftKey)) { // right
      $("#next").click();
      // Mog.ui.nextTrack();
    }
  });
  
  // Do keybindings
  $(document).keypress(function(e) {
    _debug(e, 'document press');
    
    char = String.fromCharCode(e.which);
    s  = function(t) {
      return t.charCodeAt(0);
    }
    switch(char) {
      case '/':
        // go to search box
        $('#searchbox').select().focus();
        e.preventDefault(); // Don't emit '/' into the search box
        break;
      case 'p':
      case ' ':
        // play / pause
        $('#play').click();
        setTimeout(function() {
          $("#modal_confirmation_dialog ol .button:first").click();
        }, 500);
        break;
      case 'q':
        // queue
        if ($('#play_queue').css('display') == 'none') {
          window.location.hash = '#play_queue';
        } else {
          history.back();
        }
        break;
      case 'r':
        // radio toggle
        $('#radio_toggle').click();
        break;
      case 'R':
        // repeat toggle
        $('#repeat_toggle').click();
        break;
      case 'F':
        // full view
        if ($('#full_view').css('display') == 'none') {
          $('#full_view_toggle').click();
        } else {
          $('#full_view').click();
        }
        break;
      case 't':
        // view play queue
        if ($('#play_queue').css('display') == 'none') {
          window.location.hash = '#play_queue';
        }
        Mog.ui.scrollToPlaying();
        break;
    };
  });
  

}

// add the script to the page, so it can execute properly
var script = document.createElement("script");
script.appendChild(document.createTextNode("(" + main + ")();"));
(document.body || document.head || document.documentElement).appendChild(script);