var PostsView = (function(){
    

     /**
     * This will shuffle the posts making sure posts from same category dont repeat after 3 articles max.
     * Its actually a recursive function; that why the argument 'pos'.
     * @method shufflePosts
     * @param  {array}      posts  - Original array of posts.
     * @param  {[type]}     pos    - The recursive identifier.
     */
    var shufflePosts = function(posts,pos){
        var bucketLimit = 3;
        var themePostCount  = {}, themesFull =0;
        $.each(app.user.themes,function(i,theme){
            themePostCount[theme] = 0;
        });
        pos = pos || 0;

        for(var i=pos; i< posts.length;i++){
            var post = posts[i];
            if(themePostCount[post.categories]<bucketLimit){
                if(i != pos){
                    posts.splice(i,1);
                    posts.splice(pos,0,post);
                }
                themePostCount[post.categories]++;
                if(themePostCount[post.categories]==bucketLimit){
                    themesFull++;
                }
                pos++;
            }
        }
        if(pos < posts.length){
            return shufflePosts(posts,pos);
        }else{
            return posts;
        }
    };
    var getPostItemLayout = function(post, postsPos, isSavedPage){
        var html="";
        var isInProgress = isSavedPage ? true : app.savedArticles && Object.keys(app.savedArticles).indexOf(post._id)>-1;
        html += "<div class='post "+ (isSavedPage ? "saved" : "") +(isInProgress ? " inProgress" : "")+"' data-pos='"+postsPos+"' data-id='"+post._id+"'>";
        html += "<div class='title'>"+post.title+"</div>";
        var src = post.feedSource;
        html += "<div class='metainfoWrapper'>";
        //Trying to fetch source link from guid.
        src = /(http(s)*:\/\/)*(www\.)*(.*?)\//.exec(src);
        src = (src && src.length > 1 ? src[src.length-1] : "");
        if(src.indexOf("proxy")==-1){
            html += "<div class='metainfo source'>"+src+"</div>";
        }

        html += "<div class='metainfo themeName'>"+post.categories+"&nbsp;</div>";
        if(isInProgress){
            var savedPost = app.savedArticles[post._id];
            html += "<div class='metainfo progress'>"+savedPost.readingPos+"/"+savedPost.totalPages+"</div> ";
        }   
        html += "</div>";
        if(post.image && post.image.url){
            //console.log(JSON.stringify(post.image));
            html += "<div class='image' style='background-image:url(\""+post.image.url+"\")'></div>";
        }
        html += "<div class='summary'   >"+ ( post.description.replace(/<\/?[^>]+(>|$)/g,"").substring(0,150).match(/[^]*\s/).toString())+"..</div>";
        html += "</div>";
        return html;
    };
    var bumpUpLoadMore = function(){
        var cont = $("._wrapper .posts");
        var el = $(".loadmore",cont);
        var ct = parseInt(el.attr("data-ct"));
        ct++;
        if(ct>=app.config.TIMESTAMPS.length){
            el.remove();
        }else{
            el.attr("data-ct",ct);
        }
    };

    var obj = function(themes){
        this.themes = themes;
    };

    /**
     * Gets all the posts for the user. 
     * @method getUserPosts
     * @param  {ARRAY}     themes -  All the themes belonging to the user.
     * @param  {function}     c   -  The callback function.
     * @return {[type]}
     */
    obj.prototype.getUserPosts = function(timeStamp,c){
        var d  =  new Date().getTime();
        var themes = app.user.themes.map(function(v){
            return {"term" : {"categories":v}};
        });
        var q = {
              "size" : 300,
              "query": {
                "filtered": {
                  "filter": {
                    "bool": {
                      "must": [
                        {
                          "range": {
                            "pubdate": {
                              "gte": new Date(d + timeStamp.gte*24*60*60*1000).toISOString().substring(0,10),
                              "lt": new Date(d + timeStamp.lt*24*60*60*1000).toISOString().substring(0,10),
                            }
                          }
                        }
                      ],
                      "should" : themes
                    }
                  }
                }
              },
              "sort": [
                {
                  "date": {
                    "order": "desc"
                  }
                }
              ]
            };
        DataOp.loadURL({
            u : app.config["END_POINTS"]["FEED_ITEMS"],
            t : "POST",
            d :  JSON.stringify(q),
            c : function(resp){
                    resp = resp.hits.hits.map(function(v){v._source._id = v._id; return v._source;});
                    resp = resp.sort(function(a,b){
                        return (new Date(b.pubdate) - new Date(a.pubdate));
                    });
                    resp = shufflePosts(resp,0);
                    app.allPosts = $.merge(app.allPosts || [], resp);
                    c(resp);
                }.bind(this)
        });
    };
    /**
     * Draws the list of articles.
     * @method drawPosts
     * @param  {array}  posts - The articles json.
     * @param  {[type]}  name - **** The name of the page (not using it;should remove)
     * @param  {[type]}  type -  type of the page (saved articles/home)
     */
    obj.prototype.drawPosts = function(posts,name,type){
        var cont = $("._wrapper .posts"),html= "",postsPos=0, timestampPos=0, timestampTimer=0;
        app.state = app.state || {};
        
        if(type !== "saved"){
            //If not the saved articles page.
            timestampPos=parseInt($(".loadmore",cont).attr("data-ct")) || 0;
            postsPos=parseInt($(".loadmore",cont).attr("data-postpos")) || 0;
            if(postsPos == 0){
                html += "<div class='timestamp current'>"+app.config.TIMESTAMPS[timestampPos].title+"&nbsp;("+posts.length+")</div>"; 
            }
            html += "<div class='timestamp'>"+app.config.TIMESTAMPS[timestampPos].title+"&nbsp;("+posts.length+")</div>"; 
            //Getting the filtered post based on date
        }else{
            //If its the saved articles page.
            cont.empty();
            app.state["scrollPos"] = 0;
        }
        if(posts.length){
            $.each(posts,function(i,post){
                if(post.description.length>1500){
                    html += getPostItemLayout(post,postsPos,type === "saved");
                }
                postsPos++;
            });
        }else{
            html += "<div class='post empty'>";
            html += "<div class='title'>Nothing here!.</div>";
            html += "<div class='summary'>Go ahead, read some posts and click the bookmark icon to save it for reading later.</div>";
            html += "</div>";
        }
        cont.append(html);
        if(type !== "saved"){
            if(!$(".loadmore",cont).length){
                //This is essentialy the case when its rendering the articles first time.
                cont.append("<div class='loadmore' data-ct='1' data-postpos='"+postsPos+"'>LOAD MORE</div>");
                //When user clicks the loadmore button.
                $(".loadmore",cont).gwClick(function(el){
                    el.removeClass("error").addClass("loading");
                    var pos = parseInt(el.attr("data-ct"));
                    this.getUserPosts(app.config.TIMESTAMPS[pos],function(d){
                        this.drawPosts(d,"home","home");
                    }.bind(this));                
                }.bind(this),{"data-timeout":100});
                
                //Over here we show the correct timestamp
                cont.unbind("touchmove").on("touchmove",function(){
                    if(timestampTimer){
                        clearTimeout(timestampTimer);
                    }
                    timestampTimer = setTimeout(function(){
                        $.each($(".timestamp:not(.current)"),function(l,el){
                            if(el.getBoundingClientRect().top < 44){
                                $(".timestamp.current").html($(el).html());
                            }
                        });
                    },400);
                });
            }else{
                bumpUpLoadMore(); 
                $(".loadmore",cont).removeClass("loading").appendTo(cont).attr('data-postpos',postsPos);
            }
        }
        $.when(UIRender.manageViews({
            type : type,
            name : name
        })).then(function(){
            $(".post:not(.empty) .title",cont).unbind("click").on("click",function(ev){
                $(".posts").fadeOut();
                var postData;
                postData = type == "saved" ? app.savedArticles[$(ev.currentTarget).parent().attr("data-id")] : app.allPosts[$(ev.currentTarget).parent().attr("data-pos")];
                var postView = new PostView();
                postView.drawPost(postData);  
            }.bind(this));
        }.bind(this));
    };

    return obj;
})();
