var ThemeView = (function(){
    /**PRIVATE FUNCTIONS **/
    var updateUserThemes = function(themes,c){
        DataOp.runMongoQuery({
            "u" : app.config["END_POINTS"]["USERS_COLLECTION"]+app.user._id,
            "t" : "PUT",
            "d" : JSON.stringify( {"$set":{ "themes" : themes } }),
            "c" : c
        });
    };
    var bindEvents = function(){
        var orginalThemes = $(".theme .title.selected").map(function(){return $(this).text();}).toArray();
        $("._wrapper .theme .title").gwClick(function(el){
            el.toggleClass("selected");
            var themes = $(".theme .title.selected").map(function(){return $(this).text();}).toArray();
            if(themes.length>=3 && orginalThemes.sort().join() != themes.sort().join()){
                //Only show the button once three themes are selected.
                $('._wrapper .done').addClass("btn").html("PREPARE HOME");
            }else{
                $('._wrapper .done').removeClass("btn").html(" Select atleast three themes you find interesting");
            }
        }.bind(this),{
            "data-timeout" : 100
        });
        $("._wrapper .done").gwClick(function(el){
            if(!el.hasClass("btn")){
                return;
            }
            var themes;
            if($(".theme .title.selected").length){
                themes = $(".theme .title.selected").map(function(){return $(this).text();}).toArray();
                if(orginalThemes.sort().join() != themes.sort().join()){
                    //Only update if we have different set of themes.
                    UIRender.toggleLoader(); 
                    updateUserThemes(themes,function(){
                        app.user.themes = themes;
                        window.localStorage.setItem("user",JSON.stringify(app.user));
                        app.allPosts = null;    
                        UIRender.drawHome();
                    }.bind(this));
                }
            }
        }.bind(this),{
            "data-timeout" : 1
        });
    };

    var obj = function(){
    };
    /**
     * Drawing the themes.
     * @method drawThemes
     */
    obj.prototype.drawThemes = function(){
        var themes = $.extend(true,[],app.config["THEMES"]);
        $.each(themes,function(i,v){
            if(app.user.themes.indexOf(v.category_title)>-1){
                v.isChoosen = true;
            }
        });
        var html = " <div class='done'> Select atleast three themes you find interesting</div>";
        html += "<div class='themesC' style='height:"+(window.innerHeight-124)+"px;'>";
        $.each(themes,function(i,theme){
            html += "<div class='theme' data-id='"+theme.cid+"'><div class='title "+(theme.isChoosen ? "selected" : "")+"'><span>"+theme.category_title+"</span></div> <div class='descr'>"+(theme.category_desc || "")+"</div></div>";
        });
        html += "</div>";
        $("._wrapper .themes").html(html);
        UIRender.manageViews({
            type:"themes",
            name : "themes"
        });
        bindEvents();
    };
    return obj;
})();