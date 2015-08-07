var BasePostsView = (function(){


    var getDateInString = function(tstamp){
            var d = new Date(tstamp);
            var cd = new Date();
            var hrs = d.getHours();
            var mins = d.getMinutes();
            var half = hrs >= 12 ? "PM" : "AM";
            hrs = hrs > 12 ? hrs-12  : hrs;
            if(d.toString().substring(0,10) == cd.toString().substring(0,10)){
                return "today at "+hrs +(mins ? ":"+mins  : "")+"&nbsp;"+half;
            }else {
                return "tomorrow at "+hrs +(mins ? ":"+mins  : "")+"&nbsp;"+half;
            }
    };
   
    var obj = BaseView.extend({

        el : ".posts",

        render : function(){
            var cont = $("._wrapper .posts"),html= "",posts = this.data;
            
            app.state = app.state || {};
            var start = this.count;
            //Getting the filtered post based on date
            if(posts.length > this.count){
                if(this.firstRender){
                    cont.empty();
                }
                var d;
                if($(".timestamp:last").length){
                    var t = $(".timestamp:last");
                    d = {
                        date : parseInt(t.data("date")),
                        month : parseInt(t.data("month"))
                    };
                }
                for(var i=start;i<this.data.length;i++){
                    var post = this.data[i], timestampAdded = false;
                    post.description = post.description || post.summary;
                    if(post.description && post.description.length>150){
                        var pd = new Date(post.publish_on);
                        if(!d  || pd.getDate() != d.date || pd.getMonth() != d.month){
                            var isToday = false;
                            d = {
                                date : pd.getDate(),
                                month : pd.getMonth()
                            };
                            if(d.date == new Date().getDate() && d.month == new Date().getMonth()){
                                isToday = true;
                            }
                            var month = (isToday ? "today" : pd.toString().substring(4,7));
                            var day = (isToday ? "" : pd.toString().substring(8,10));
                            if(i===0){
                                html += "<div class='timestamp current' data-date='"+d.date+"' data-month='"+d.month+"'><div class='text'><span class='month "+(isToday ? "today" : "")+"'>"+month+"</span><span class='day'>"+day+"</span></div><div class='line'></div></div>";     
                            }
                            var updateMsg;
                            if(i === 0 && this.type=='home'){
                                if(app.shouldBeRefreshed){
                                    updateMsg = "<div class='updateTime'>New articles available; click on refresh</div>";
                                }else{
                                    updateMsg = "<div class='updateTime'>Next update is "+getDateInString(DataOp.getNextUpdateTime())+"</div>";    
                                }
                            }else{
                                updateMsg = undefined;
                            }
                            html += "<div class='timestamp' data-date='"+d.date+"' data-month='"+d.month+"'>"+(updateMsg  || "") +"<div class='text'><span class='month "+(isToday ? "today" : "")+"'>"+month+"</span><span class='day'>"+day+"</span></div><div class='line'></div></div>"; 
                            timestampAdded = true;
                        }
                        html += this.getPostItemLayout(post,timestampAdded);
                        timestampAdded = false;
                    }
                    this.count++;
                }
                cont.append(html);    
                
                if(!$(".loadmore",cont).length){
                    //This is essentialy the case when its rendering the articles first time.
                    cont.append("<div class='loadmore'>LOAD MORE</div>");
                }else{
                    $(".loadmore",cont).appendTo(cont).removeClass("loading");
                }
            }
            if(start ==  this.count || this.count>= 200){
               $(".loadmore",cont).appendTo(cont).removeClass("loading");
               $(".loadmore",cont).html("There are no more articles to load").addClass("nomore");
            }
        },

        refreshData : function(){

        },

        loadFromCache : function(){
            this.count = 0;
            this.firstRender = true;
            this.render();
            this.viewLoaded();
        },

        viewLoaded : function(){
            var cont = $("._wrapper .posts");
            //The fixed timestamp is hidden by default.
            $(".timestamp.current").show();
             if(this.firstRender){
                this.firstRender=false;
                //When user clicks the loadmore button.
                $(".loadmore",cont).gwClick(function(el){
                    if(el.hasClass("nomore")){
                        return;
                    }
                    el.removeClass("error").addClass("loading");
                    this.renderMore();
                }.bind(this),{"data-timeout":100});
                var timestampTimer;
                //Over here we show the correct timestamp
                cont.unbind("touchmove").on("touchmove",function(){
                    if(timestampTimer){
                        clearTimeout(timestampTimer);
                    }
                    timestampTimer = setTimeout(function(){
                        $.each($(".timestamp:not(.current)"),function(l,el){
                            if(el.getBoundingClientRect().top < 44){
                                $(".timestamp.current .text").html($(".text",el).html());
                            }
                        });
                    },400);
                });
                $.unsubscribe("/vyg/refresh"); 
                $.subscribe("/vyg/refresh", function(){
                    UIRender.toggleLoader("Checking for content..");           
                    this.fetchData(function(){
                        this.render();
                        this.viewLoaded();
                    }.bind(this),true);
                }.bind(this));

                if(this.type == "home"){
                    $.subscribe("/vyg/refreshToggle", function(){
                        if(app.shouldBeRefreshed){
                            $(".updateTime",cont).html("New articles available; click on refresh");    
                        }else{
                            $(".updateTime",cont).html("Next update is "+getDateInString(DataOp.getNextUpdateTime()));    
                        }
                    });
                }

                $.subscribe("/vyg/sectionstoggled", function(e,isOpen){
                    if(isOpen){
                        $(".timestamp.current",cont).hide();
                    }else{
                        $(".timestamp.current",cont).show();
                    }
                }.bind(this));
            }
            $(".post:not(.empty) .title,.post:not(.empty) .image,.post:not(.empty) .summary",cont).unbind("click").on("click",function(ev){
                var postData;
                var el = $(ev.currentTarget).parent();
                $(".title",el).css("opacity",0.4);
                setTimeout(function(){
                    $(".title",el).css("opacity",1);
                },1000);
                postData = this.data[el.attr("data-pos")];
                var postView = new PostView(postData);
                postView.launch();  
            }.bind(this));
            $(".post:not(.empty) .metainfo.themeName",cont).unbind("click").on("click",function(ev){
                var el = $(ev.currentTarget);
                el.css("opacity",0.5);
                UIRender.toggleLoader();
                var thView = new ThemeView(el.data("id").trim());
                thView.launch();  
            }.bind(this));
        },


        fetchData : function(c,isRefresh){
            if(this.firstRender){
                this.data = DataOp.getModel(this.modelKey);
                if(this.data.length>0){
                    c();
                    UIRender.toggleLoader(true);
                    return;
                }
            }
            var q = {
                  "size" : isRefresh ? app.config["LOGIC_CONFIG"]["REFRESH_POSTS_GET_COUNT"]: app.config["LOGIC_CONFIG"]["INC_POST_FETCH_COUNT"],
                  "from" : isRefresh ? 0 : this.count,
                  "query": {
                    "filtered": {
                      "filter": {
                        "bool": this.getBoolQ()
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
            //if(isRefresh || this.firstRender){
                if( new Date(new Date().toUTCString()) < DataOp.getNextUpdateTime()){
                    q["query"]["filtered"]["filter"]["bool"]["must"].push({
                        "range" : {
                            "publish_on" : {
                                "lt" : new Date(DataOp.getNextUpdateTime() - ((24*60*60-1)*1000))
                            }
                        }
                    });
                }
            //}
            DataOp.loadURL({
                u : app.config["END_POINTS"]["FEED_ITEMS"],
                t : "POST",
                d :  {q : JSON.stringify(q), t : "POST"},
                c : function(resp){
                        UIRender.toggleLoader(true);
                        if(resp.statusText == "error"){
                            if(!isRefresh){
                                $(".loadmore").removeClass("loading");
                            }
                            return;
                        }
                        resp = JSON.parse(resp);
                        resp = resp.hits.hits.map(function(v){v._source._id = v._id; return v._source;});
                        //If there is response then only we need to proceed
                        if(isRefresh){
                            //If content is refreshed we need to find the last post which is still there and
                            //append accodingly
                            var lastId = this.data[0]._id;
                            $.each(resp,function(i,v){
                                if(v._id == lastId){
                                    resp = resp.slice(0,i);
                                }
                            });
                            if(resp.length){
                                //Only if we have some new data
                                UIRender.showInfoMessage(resp.length+" new post"+(resp.length>1?"s" :"") +" added.");
                               
                                this.data = $.merge(resp, this.data);
                                //We will draw fresh
                                this.count = 0;
                                this.firstRender = true;
                                c();
                                DataOp.setModel(this.modelKey,this.data);
                            }else{
                                UIRender.showInfoMessage("No posts to add");
                            }
                        }else{
                            //If data is incrementally fetched then we just append it.
                            this.data = $.merge(this.data || [], resp);
                            DataOp.setModel(this.modelKey,this.data);
                            c();
                        }
                        
                    }.bind(this)
            },false,false,true);
        }

    });
    return obj;
})();
