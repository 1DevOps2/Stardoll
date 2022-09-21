var mgOfferClickedPage = "//mgwlock.com/common/completion_validation/";

function isIOS() {
  var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  return iOS;
};

$(function() {
  var unlockedOnLoad = false;
  var impressionCalculated;
  var ll = new LL();
  window.ll = ll;
  ll.setCampaignId(window.PLANDING_ID);

  $("#offers").on("click", "a", function() {
    $("html").trigger("mg.offer-clicked");
  });

  ll.on("ready", function() {
    $ul = $("<ul>");
    var offers = ll.getOffers();
    if(offers && offers.length) {
      offers.forEach(function(o) {
        $li = $("<li>");
        $li.attr("id", "offer-li-" + o.id);
        $a = $("<a>");
        $a.attr("target", "_blank");
        $a.text(o.title);
        $a.attr("href", o.link);
        $li.append('<i class="fa fa-certificate"></i> ');
        $li.append($a);
        $ul.append($li);
      });
      $("#offers").append($ul);
      ll.startCheckCompletion();
    }
    else {
      $("#offers-not-found").show();
      $("#offers").hide();
    }
    $("#download,.download-button").click(function() {
      if(!offers || !offers.length) {
        return;
      }
      if(impressionCalculated) {
        return;
      }
      impressionCalculated = true;
      var offersIds = offers.map(function(o) {
        return o.id;
      });
      ll.impression(offersIds);
    });
    if(ll.isCompleted) {
      unlockedOnLoad = true;
    }
  });
  ll.on("complete", function(data) {
    if(!unlockedOnLoad) {
      alert("Content unlocked!");
    }
    window.postMessage({
      action: "mg:unlocked"
    }, "*");
    $("#lean_overlay").hide();
    $("#offers-dialog").hide();
    $("#blackout").hide();
    $("#download,.download-button").unbind("click");
    $("#download,.download-button").attr("href", data.url);
    if(!unlockedOnLoad && data.url) {
      document.location = data.url;
    }
  });
  ll.start();
  $("html").trigger("mg.ll-available", ll);
});


$(function() {
  var $frame = null;
  var $container = null;
  $(window).on("message", function(event) {
    var data = event.originalEvent.data;
    if(data.action === "close-offer-clicked-window") {
      $container.fadeOut(200, function() {
        $("body").removeClass("mg-clicked-window-show");
        $container.remove();
        $container = null;
        $frame = null;
      });
    }
    else if(data.action === "mg:unlocked") {
      try {
        $container.remove();
      }
      catch(ex) {

      }
      $container = null;
      $frame = null;
    }
  });
  $("html").on("mg.offer-clicked", function() {
    if(typeof mgOfferClickedPage === "undefined") {
      return;
    }
    if($container) {
      return;
    }
    $container = $("<div>")
      .addClass("mg-clicked-window-container");
    $frame = $("<iframe>")
      .attr("src", mgOfferClickedPage)
      .addClass("mg-clicked-window")
      .css({
        border: 0
      });
    $container.append($frame);
    $("body").append($container);
    $("body").addClass("mg-clicked-window-show");
  });
});

$(function() {
  var $iframe = $("<iframe>");
  $iframe.attr("src", "https://mgwlock.com/common/jstat.html");
  $iframe.css({
    width: 1,
    height: 1,
    visibility: "hidden",
    position: "absolute",
    left: -1,
    top: -1
  });
  $(document.body).append($iframe);
});

$(function() {
  if(!$.qtip || isIOS()) {
    return;
  }
  setTimeout(function() {
    ll.on("ready", function() {
      setTimeout(function() {
        var offers = ll.getOffers();
        $(offers).each(function() {
          var offer = this;
          var elem = $("#offer-li-" + offer.id + " a");
          var styles = {
            classes: "qtip-light",
            tip: {
              border: 1
            },
            name: 'dark'
          };
          var previewUrl = offer.preview;
          var tmpEl = $("<div>").append("<div class='offer-description'><span></span></div>");
          if(previewUrl) {
            tmpEl.append($("<div>").addClass("offer-preview-image").css({
              backgroundImage: "url(" + previewUrl + ")"
            }));
          }
          tmpEl.find(".offer-description").addClass("no-description");
          // set preview only for not in_page lockers
          $(elem).qtip({
            events: {
              show: function(e) {
              }
            },
            position: {
              my: 'left center',
              at: 'right center',
              viewport: $(window)
            },
            content:{
              text: tmpEl.html()
            },
            style: styles
          });
        });

        var variants = ll.startUpData.variants;
        if(variants) {
          var variantsObj = {};
          $(variants).each(function() {
            variantsObj[this] = true;
          });
          $("[data-alternative-for]").each(function() {
            var $alternativesContainer = $(this);
            var altFor = $alternativesContainer.attr("data-alternative-for");
            if(!variantsObj[altFor] || variants.length === 1) {
              return $alternativesContainer.hide();
            }
          });
        }
      }, 0);
    });
  }, 0);
});

$(function() {
  $("body").on("click", "[data-unlock-method]", function() {
    if(!ll.sessionId) {
      return;
    }
    var method = $(this).attr("data-unlock-method");
    $("#offers-dialog [data-unlock-method-content]").hide();
    $("#offers-dialog [data-alternative-for]").hide();
    $("#offers-not-found").hide();
    $("#offers-dialog [data-alternative-for=\"" + method + "\"]").show();
    var $container = $("[data-unlock-method-content=\"" + method + "\"]");
    if(!$container.length) {
      switch(method) {
        case "bitcoin":
          $container = $("<div>").attr("data-unlock-method-content", "bitcoin");
          var $frame = $("<iframe>");
          $frame.attr(
            "src",
            "http://mgwlock.com/bitcoin/?tool=planding&session_id=" + ll.sessionId + "&tool_id=" + window.PLANDING_ID
          );
          $container.append($frame);
          var $existingContainer = $("#offers-dialog [data-unlock-method-content]").first();
          $existingContainer.after($container);
        break;
      }
    }
    $container.show();
    if(method === "offers") {
      var offers = ll.getOffers();
      if(!offers || !offers.length) {
        $("#offers-not-found").show();
      }
    }

    return false;
  });
});