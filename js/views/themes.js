var ThemesView = (function(){
    /**PRIVATE FUNCTIONS **/
    var updateUserThemes = function(themes,c){
        DataOp.runMongoQuery({
            "u" : app.config["END_POINTS"]["USERS_COLLECTION"]+app.user._id,
            "t" : "PUT",
            "d" : JSON.stringify( {"$set":{ "themes" : themes } }),
            "c" : c
        });
    };
    

    var obj = BaseView.extend({

        type : "themes",
        el : ".themes",

        constructor : function(){
            this.data = app.user.themes;
            this.allThemes = $.extend(true,{},app.config["THEMES"]);
        },

        fetchData : function(c){    
            c();
        },

        render : function(){
            $.each(this.allThemes,function(k,v){
                if(this.data.indexOf(k)>-1){
                    v.isChoosen = true;
                }
            }.bind(this));
            var buckets = Util.getThemeBuckets(this.allThemes);
            var html = "<div class='done'>"+app.config["APP_MESSAGES"]["THEMES_PAGE_MSG"]+"</div>";
            html += "<div class='themesC' style=display: inline-block;'height:"+(window.innerHeight-124)+"px;'>";
            $.each(buckets,function(bck,themes){
                html += "<div class='themeBucket'>";
                $.each(themes,function(i,theme){
                    html += "<div class='theme "+(theme.isChoosen ? "selected" : "")+"' data-id='"+theme.id+"'><div class='title'>"+theme.category_title+"</div> </div>";
                });
                html += "</div>";
            });
            html += "<div class='de'></div>";
            var p=app.config.THEMES;
            //html += "</div> <div class='de "+(p.isChoosen ? "select" : "")+"'></div>";
            $("._wrapper .themes").html(html);
        },

        viewLoaded : function(){
            var orginalThemes = $(".theme.selected").map(function(){return $(this).data("id");}).toArray();
            $("._wrapper .theme").gwClick(function(el){
                el.toggleClass("selected");
                //el.parent().find(".title").toggleClass("select");
                var themes = $(".theme.selected").map(function(){return $(this).data("id");}).toArray();
                if(themes.length>=2 && orginalThemes.sort().join() != themes.sort().join()){
                    //Only show the button once three themes are selected.
                    $('._wrapper .done').addClass("btn").html("SAVE");
                }else{
                    $('._wrapper .done').removeClass("btn").html(app.config["APP_MESSAGES"]["THEMES_PAGE_MSG"]);
                }
            }.bind(this),{
                "data-timeout" : 100
            });
            var t;
            /*
            $("._wrapper .theme .title,._wrapper .theme .catImg").gwClick(function(el){
                var par = el.parent();
                var cid = par.data("id");
                var descCont = $(".de",par.parent());
                var html="<div class='describe'><div class='head'>"+this.allThemes[cid].category_title+"<span class='img' style='background-image:url(\""+this.allThemes[cid].img+"\");'></span></div><div class='para'>"+this.allThemes[cid].description+"</div><div class='button'></div></div>";
                descCont.html(html);
                descCont.addClass("show");
                //descCont.addClass("('.de').scale(1).end();

                descCont.gwClick(function(el,ev){
                   var ct = $(ev.target);
                   if(ct.hasClass("button")){
                        UIRender.toggleLoader("Loading theme..");
                        var thView = new ThemeView(cid);
                        thView.launch();  
                   }
                   else if(!ct.parents(".describe").length){
                        descCont.removeClass("show");
                        //move('.de').scale(0).end();
                   }
                }.bind(this),{
                    "data-timeout" : 100
                });
            }.bind(this),{
                "data-timeout" : 100
            });
            */
 
            $("._wrapper .done").gwClick(function(el){
                if(!el.hasClass("btn")){
                    return;
                }
                var themes;
                if($(".themesC .theme.selected").length){
                    themes =$(".themesC .theme.selected").map(function(){return $(this).data("id");}).toArray();
                    if(orginalThemes.sort().join() != themes.sort().join()){
                        //Only update if we have different set of themes.
                        UIRender.toggleLoader(); 
                        updateUserThemes(themes,function(){
                            app.user.themes = themes;
                            window.localStorage.setItem("user",JSON.stringify(app.user));
                            DataOp.setModel("home",[]);  
                            UIRender.drawHome();
                        }.bind(this));
                    }
                }
            }.bind(this),{
                "data-timeout" : 1
            });
        }

    });
    return obj;
})();
