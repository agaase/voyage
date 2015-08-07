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
            var html = "<div class='done'>"+app.config["APP_MESSAGES"]["THEMES_PAGE_MSG"]+"</div>";
            html += "<div class='themesC' style=display: inline-block;'height:"+(window.innerHeight-124)+"px;'>";
            
            $.each(this.allThemes,function(k,theme){
                html += "<div class='theme' data-id='"+k+"'><div class='catImg' style='background-image:url(\""+theme.img+"\");'></div><div class='title "+(theme.isChoosen ? "select" : "")+"'>"+theme.category_title+"</div><div class='checkboxW "+(theme.isChoosen ? "selected" : "")+"'><div class='checkbox'></div></div> </div>";
            });
            html += "<div class='de'></div>";
            var p=app.config.THEMES;
            //html += "</div> <div class='de "+(p.isChoosen ? "select" : "")+"'></div>";
            $("._wrapper .themes").html(html);
        },

        viewLoaded : function(){
            var orginalThemes = $(".theme .title.select").map(function(){return $(this).text();}).toArray();
            $("._wrapper .theme .checkboxW").gwClick(function(el){
                el.toggleClass("selected");
                el.parent().find(".title").toggleClass("select");
                var themes = $(".theme .title.select").map(function(){return $(this).text();}).toArray();
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
 
            $("._wrapper .done").gwClick(function(el){
                if(!el.hasClass("btn")){
                    return;
                }
                var themes;
                if($(".theme .checkboxW.selected").length){
                    themes = $(".theme .checkboxW.selected").map(function(){return $(this).parent().data("id");}).toArray();
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
