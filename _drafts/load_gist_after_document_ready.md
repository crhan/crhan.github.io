---
layout: post
title: load gist after document ready
date: 2013-12-22 23:48:00
description:
categories:
tags:
uniq_id: load_gist_after_document_ready

---

Gist 

{% highlight javascript %}
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
{% endhighlight %}

[1]: http://www.bennadel.com/blog/2312-Loading-GitHub-Gists-After-The-Page-Content-Has-Loaded.htm
