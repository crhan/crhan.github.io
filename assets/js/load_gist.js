$(function(){
  $(".show-gist").each(function(index) {
    var gistId = this.dataset.gistId;
    var gistResult = $.getGist( gistId );
    var placeHolder = $(this)

    placeHolder.append(
      "Loading Gist " + gistId + "..."
    );

    gistResult.done( function( gist ) {
      placeHolder.empty();

      var ordered = gist.ordered;

      for (var i=0; i < ordered.length; i++) {
        placeHolder.append( "<h3>" + ordered[i].fileName + "</h3>");
        placeHolder.append( ordered[i].content);
      }
    });
  })
});
