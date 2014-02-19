//<--- --------------------------------------------------------------------------------------- ----
//Blog Entry:
//Loading GitHub Gists After The Page Content Has Loaded
//Author:
//Ben Nadel / Kinky Solutions
//Link:
//http://www.bennadel.com/index.cfm?event=blog.view&id=2312
//Date Posted:
//Jan 13, 2012 at 10:54 AM
//---- --------------------------------------------------------------------------------------- --->
// Define a sandbox in which to create the Gist loader jQuery plugin.
// This Gist loader only works with public gists. It will load all of
// the files (in a single request) and then return an array of loaded
// files (with the ability to access by file name).
(function(e,t){var n=function(t){if(!i){e("head:first").append(t);i=!0}document.write=r},r=function(t){s={};s.ordered=[];var n=e(t);n.find("div.gist-file").each(function(){var t=e(this),n=t.find("div.gist-meta a").filter(function(){return e(this).text().search(new RegExp("^\\s*(view raw|this gist|github)","i"))===-1}),r=e.trim(n.first().text()),i=e("<div class='gist'></div>").append(t);s[r]={fileName:r,content:i};s.ordered.push(s[r])})},i=!1,s=null;e.getGist=function(r){document.write=n;var i=e.Deferred();e.ajax({url:"https://gist.github.com/"+r+".js",dataType:"script",success:function(){i.resolve(s)},error:function(e,t,n){i.reject(t,n)},complete:function(){document.write=t}});return i.promise()}})(jQuery,document.write);