var SavedPostsView = (function(){
    
      var getPostItemLayout = function(post, postsPos, isSavedPage){
        var html="";
        html += "<div class='post saved inProgress' data-pos='"+postsPos+"' data-id='"+post._id+"'>";
        html += "<div class='title'>"+post.title+"</div>";
        var src = post.feedSource;
        html += "<div class='metainfoWrapper'>";
        
        var savedPost = app.savedArticles[post._id];
        html += "<div class='metainfo progressTextWrapper'>Last Read : <span class='progressText'>"+ new Date(savedPost.lastRead).toString().substring(0,10) +"&nbsp;,&nbsp;<span class='progress'>" + savedPost.progress+"%</span></span></div> ";
        html += "</div>";
        
        html += "</div>";
        return html;
    };
    
    var obj = BaseView.extend({

        type : "saved",

        el : ".posts",

        fetchData : function(c){
           this.data = $.map(app.savedArticles, function(el) { return el; });
           c();
        },
        
        loadFromCache : function(){
            this.data = $.map(app.savedArticles, function(el) { return el; });
            this.render();
            this.viewLoaded();
        },

        render : function(){
            var cont = $("._wrapper .posts"),html= "",postsPos=0,posts = this.data;
            app.state = app.state || {};
            //If its the saved articles page.
            cont.empty();
            app.state["scrollPos"] = 0;

            if(posts.length){
                var completedPosts = [], otherPosts = [];
                posts.sort(function(a,b){
                    return new Date(b.lastRead) - new Date(a.lastRead);
                });
                $.each(posts,function(i,post){
                    if(post.progress == 100){
                        completedPosts.push(post);
                    }else{
                        otherPosts.push(post);
                    }
                });
                posts = $.merge(otherPosts,completedPosts);
                this.data = posts;
                var completedSectionAdded = false;
                $.each(posts,function(i,post){
                    if(post.progress == "100" && !completedSectionAdded){
                        html += "<div class='timestamp completed' ><div class='text'></div><div class='line'></div></div>"; 
                        completedSectionAdded = true;
                    }
                    html += getPostItemLayout(post,postsPos);

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
            $(".post:not(.empty)",cont).unbind("click").on("click",function(ev){
                var postData = this.data[$(ev.currentTarget).attr("data-pos")];
                var postView = new PostView(postData);
                postView.launch();  
            }.bind(this));
        }
    });
    return obj;
})();
