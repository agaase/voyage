var ThemeView = (function(){
    
    var obj = BasePostsView.extend({

        type : "posts",

        getPostItemLayout : function(post){
            var html="";
            var isInProgress = app.savedArticles && Object.keys(app.savedArticles).indexOf(post._id)>-1;
            html += "<div class='post "+ (isInProgress ? " inProgress" : "")+"' data-pos='"+this.count+"'  data-id='"+post._id+"'>";
            html += "<div class='title'>"+post.title+"</div>";
            
            if(post.image && post.image.url){
                //console.log(JSON.stringify(post.image));
                html += "<div class='image' style='background-image:url(\""+post.image.url+"\")'></div>";
            }
            post.summary =  post.summary ? post.summary.replace(/<\/?[^>]+(>|$)/g,"").substring(0,250) : "";
            html += "<div class='summary'   >"+ ( post.summary || post.description.replace(/<\/?[^>]+(>|$)/g,"").substring(0,250).match(/[^]*\s/).toString())+"</div>";
            html += "<div class='metainfoWrapper'>";
            html += "<div class='metainfo source'>"+post.feedTitle+"</div>";
            html += "<div class='metainfo themeNames' >";
            $.each(post.categories.split(","),function(i,v){
                if(this.theme != v &&  app.user.themes.indexOf(v)>-1 && !app.config.THEMES[v].disable){
                    html += "<div class='th' data-id='"+v+"'>"+app.config.THEMES[v].category_title+"</div>";
                }
            }.bind(this));
            html += "</div>";

            if(isInProgress){
                var savedPost = app.savedArticles[post._id];
                html += "<div class='metainfo progress'>"+savedPost.progress+"%</div> ";
            }   
            html += "</div>";
            html += "</div>";
            return html;
        },
   

        headerTitle : null,

        constructor : function(theme){
            this.id = this.theme;
            this.theme = theme;
            this.modelKey = theme;
            this.headerTitle = app.config.THEMES[theme].category_title;
            this.firstRender = true;
            this.count = 0;
        },

        getBoolQ : function(){
            return {
                "must": [
                  {
                      "exists": {
                        "field": "publish_on"
                      }
                  },
                  {"term" : {"categories":this.theme.toLowerCase()}}
                ]
              };
        }

    });
    return obj;
})();
