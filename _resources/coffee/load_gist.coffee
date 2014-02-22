$ ->
  $(".show-gist").each ->
    gistId = this.dataset.gistId
    gistResult = $.getGist( gistId )
    placeHolder = $(this)

    placeHolder.append(
      "Loding Gist #{gistId}..."
    )

    gistResult.done (gist) ->
      placeHolder.empty()
      orderedGist = gist.ordered

      for file in orderedGist
        placeHolder.append "<h3>#{file.fileName}</h3>"
        placeHolder.append file.content
        console.log file.content
