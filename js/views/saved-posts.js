var SavedPostsView = (function(){
    
      var getPostItemLayout = function(post, postsPos, isSavedPage){
        var html="";
        html += "<div class='post saved inProgress' data-pos='"+postsPos+"' data-id='"+post._id+"'>";
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
        var savedPost = app.savedArticles[post._id];
        html += "<div class='metainfo progress'>"+savedPost.readingPos+"/"+savedPost.totalPages+"</div> ";
        html += "</div>";
        if(post.image && post.image.url){
            //console.log(JSON.stringify(post.image));
            html += "<div class='image' style='background-image:url(\""+post.image.url+"\")'></div>";
        }
        html += "<div class='summary'   >"+ ( post.description.replace(/<\/?[^>]+(>|$)/g,"").substring(0,150).match(/[^]*\s/).toString())+"..</div>";
        html += "</div>";
        return html;
    };
    
    var obj = BaseView.extend({

        type : "saved",

        fetchData : function(c){
           this.data = $.map(app.savedArticles, function(el) { return el; });
           c();
        },

        render : function(){
            var cont = $("._wrapper .posts"),html= "",postsPos=0,posts = this.data;
            app.state = app.state || {};
            //If its the saved articles page.
            cont.empty();
            app.state["scrollPos"] = 0;
            if(posts.length){
                $.each(posts,function(i,post){
                    if(post.description.length>1500){
                        html += getPostItemLayout(post,postsPos);
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
        },

        viewLoaded : function(){
            var cont = $("._wrapper .posts")
            $(".post:not(.empty) .title",cont).unbind("click").on("click",function(ev){
                $(".posts").fadeOut();
                var postData;
                postData = this.data[$(ev.currentTarget).parent().attr("data-pos")];
                var postView = new PostView(postData);
                postView.launch();  
            }.bind(this));
            $(".post:not(.empty) .metainfo.themeName",cont).unbind("click").on("click",function(ev){
                var el = $(ev.currentTarget);
                el.css("opacity",0.5);
                setTimeout(function(){
                    UIRender.toggleLoader("Loading theme..");
                },500);
                var thView = new ThemeView(el.text().trim());
                thView.launch();  
            }.bind(this));
        }
    });
    return obj;
})();
