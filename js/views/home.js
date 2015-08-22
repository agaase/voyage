
var HomeView = (function(){
     
    var obj = BasePostsView.extend({

        type : "home",

        getPostItemLayout :function(post,timeAdded){
            var html="";
            var isInProgress = app.savedArticles && Object.keys(app.savedArticles).indexOf(post._id)>-1;
            html += "<div class='post "+ (isInProgress ? " inProgress" : "")+ (timeAdded ? " noBorder" : "")+"' data-pos='"+this.count+"' data-id='"+post._id+"'>";
            html += "<div class='title'>"+post.title+"</div>";
            
            if(post.image && post.image.url){
                //console.log(JSON.stringify(post.image));
                html += "<div class='image' style='background-image:url(\""+post.image.url+"\")'></div>";
            }
            post.summary = post.summary ? post.summary.replace(/<\/?[^>]+(>|$)/g,"").substring(0,250) : "";
            html += "<div class='summary'   >"+ ( post.summary || post.description.replace(/<\/?[^>]+(>|$)/g,"").substring(0,250).match(/[^]*\s/).toString())+"</div>";
            html += "<div class='metainfoWrapper'>";
            
            var cat = app.config.THEMES[post.categories.split(",")[0]];
            html += "<div class='metainfo source'>"+post.feedTitle+"</div>";
            html += "<div class='metainfo themeNames' >";
            $.each(post.categories.split(","),function(i,v){
                if(app.user.themes.indexOf(v)>-1 && !app.config.THEMES[v].disable){
                    html += "<div class='th' data-id='"+v+"'>"+app.config.THEMES[v].category_title+"</div>";    
                }
            });
            html += "</div>";
            
            if(isInProgress){
                var savedPost = app.savedArticles[post._id];
                html += "<div class='metainfo progress'>"+savedPost.progress+"%</div> ";
            }   
            html += "</div>";
            html += "</div>";
            return html;
        },

        constructor : function(themes){
            this.themes = themes;
            this.modelKey = "home";
            this.count = 0;
            this.firstRender = true;
        },

        getBoolQ : function(){
            var themes = this.themes.map(function(v){
                return {"term" : {"categories":v.toLowerCase()}};
            });
            return {
                "must" : [
                  {
                  "exists": {
                    "field": "publish_on"
                  }
                }],
                "should" : themes
            };
        }
    });
    return obj;
})();
