var BasePostsView = (function(){
   
    var obj = BaseView.extend({

        render : function(){
            var cont = $("._wrapper .posts"),html= "",posts = this.data;
            
            app.state = app.state || {};
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
                var start = this.count;
                for(var i=start;i<this.data.length;i++){
                    var post = this.data[i];
                    if(post.description.length>1500){
                        var pd = new Date(post.publish_on);
                        if(!d  || pd.getDate() != d.date || pd.getMonth() != d.month){
                            if(!d){
                                html += "<div class='timestamp current'>"+pd.toString().substring(0,11)+"</div>"; 
                            }
                            d = {
                                date : pd.getDate(),
                                month : pd.getMonth()
                            };
                            html += "<div class='timestamp' data-date='"+d.date+"' data-month='"+d.month+"'>"+pd.toString().substring(0,11)+"</div>"; 
                        }
                        html += this.getPostItemLayout(post);
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
            }else{
                html += "<div class='post empty'>";
                html += "There are no more posts to show";
                html += "</div>";
                $(".loadmore",cont).remove();
                cont.append(html);
            }
            
        },



        viewLoaded : function(){
            var cont = $("._wrapper .posts");
            //The fixed timestamp is hidden by default.
            $(".timestamp.current").show();
             if(this.firstRender){
                this.firstRender=false;
                //When user clicks the loadmore button.
                $(".loadmore",cont).gwClick(function(el){
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
                                $(".timestamp.current").html($(el).html());
                            }
                        });
                    },400);
                });
            }
            $(".post:not(.empty) .title",cont).unbind("click").on("click",function(ev){
                var postData;
                var el = $(ev.currentTarget);
                el.css("opacity",0.4);
                setTimeout(function(){
                    el.css("opacity",1);
                },1000);
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
