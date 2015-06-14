var HomeView = (function(){
     
    var obj = BasePostsView.extend({

        type : "home",

        getPostItemLayout : function(post){
            var html="";
            var isInProgress = app.savedArticles && Object.keys(app.savedArticles).indexOf(post._id)>-1;
            html += "<div class='post "+ (isInProgress ? " inProgress" : "")+"' data-pos='"+this.count+"' data-id='"+post._id+"'>";
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
        },

        constructor : function(themes){
            this.themes = themes;
            this.count = 0;
            this.firstRender = true;
        },

        fetchData : function(c){
            if(this.firstRender){
                this.data = DataOp.getModel(this.type);
                if(this.data.length>0){
                    c();
                    return;
                }
            }

            var themes = this.themes.map(function(v){
                return {"term" : {"categories":v}};
            });
            var q = {
                  "size" : 20,
                  "from" : this.count,
                  "query": {
                    "filtered": {
                      "filter": {
                        "bool": {
                          "must" : [
                            {
                            "exists": {
                              "field": "publish_on"
                            }
                          }],
                          "should" : themes
                        }
                      }
                    }
                  },
                  "sort": [
                    {
                      "publish_on": {
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
                        this.data = $.merge(this.data || [], resp);
                        DataOp.setModel(this.type,this.data);
                        c();
                    }.bind(this)
            });
        }

    });
    return obj;
})();
