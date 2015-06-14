
var UIRender = (function(){
    var currentView,viewStack=[];

     /**
     * The logic to toggle the sections menu.
     * @method toggleSections
     */
    var toggleSections = function(){
        var el = $("#header .menu");
        el.toggleClass("open");
        if(el.hasClass("open")){
            $("._wrapper .sections").slideToggle();
            //We hide the fixed position timestamp once menu shows up.
            $(".timestamp.current").hide();
            $(".timestamp:eq(1)").html($(".timestamp.current").html());
            var tmtimer, orPos, touch;

            $(".main").on("touchmove.lock",function(ev){
                touch = ev.originalEvent.changedTouches[0];
                if(!orPos){
                    orPos = touch.pageY;
                }
                if(tmtimer){
                    return;
                }
                tmtimer = setTimeout(function(){
                    if(orPos-touch.pageY > 0){
                        //If you are scrolling up; lets just close the sections.
                        toggleSections();  
                    }
                    setTimeout(function(){
                        tmtimer = 0;  
                        orPos = 0;  
                    },400);
                },300);
            });
        }else{
            $("._wrapper .sections").slideToggle(700);
            $(".main").unbind("touchmove.lock");
        }
    };

     /**
         * Update on the posts page the progress of the article if its bookmarked.
         * The progress is stored in local object in the same format it is to be represented. e.g 2/6
         * @method updatePosts
         */
    var updatePosts = function(){
        if(app.state['postId']){
            var post = $(".posts .post[data-id="+app.state['postId']+"]");
            if(app.state["progress"]){
                post.addClass("inProgress");
                if($(".progress",post).length){
                    $(".posts .post[data-id="+app.state['postId']+"] .progress").html(app.state["progress"]);
                }else{
                    $(".metainfoWrapper",post).append("<div class='metainfo progress'>"+app.state["progress"]+"</div>");
                }
            }else{
                post.removeClass("inProgress");
                $(".progress",post).hide();
            }
        }
    };

    return {

      /**
       * All the global events to be triggered.
       * @method assignEvents
       */
      assignEvents : function(){
            $("#header .menu").gwClick(function(el){
                toggleSections(el);
            },{
                "data-activegrp" : "dummy",
                "useClick" : true
            });
            // The in app back button on the toolbar.
            $("._wrapper .back").gwClick(function(el){
                if(el.hasClass("refresh")){
                    //If the main view has to be refreshed.
                    $.when(this.manageViews("back")).then(function(type){
                        updatePosts();
                        DataOp.updateSavedPosts();
                    });
                }else{
                    this.manageViews("back");
                }
            }.bind(this),{
                "data-active" : "active",
                "data-timeout" : 500,
                "useClick" : true
            });
            //Binding the device back button.
            document.addEventListener("backbutton", function(){
                if($("#header").hasClass("post_context")){
                    var el = $("._wrapper .back");

                    if(el.hasClass("refresh")){
                        $.when(this.manageViews("back")).then(function(type){
                            updatePosts();
                        }.bind(this));
                    }else{
                        this.manageViews("back");
                    }
                }
            }.bind(this), false);
            // All the links on sections menu.
            $(".sections .link").gwClick(function(el){
                if(el.hasClass("allthemes")){
                    var themeView = new ThemesView();
                    themeView.launch();
                }else if(el.hasClass("home")){
                    UIRender.drawHome();
                }else if(el.hasClass("saved")){
                    $("._wrapper .posts").empty();
                    var savedView = new SavedPostsView();
                    savedView.launch();
                    //postsView.drawPosts($.map(app.savedArticles, function(el) { return el; }),"Saved Articles","saved");    
                }else if(el.hasClass("profile")){
                    var profView = new ProfileView();
                    profView.launch();
                }
            });

            //The loader overlay which shows the loading sign and blocks the screen 
            //from user interactions in case of sync operation.
            $(".loaderOverlay").on("touchstart touchmove",function(ev){
                ev.preventDefault();
            }); 

            //Any image help mockup overlay when clicked should just be removed from sight.
            $(".imgHelpOverlay").on("touchstart touchmove",function(ev){
                $(ev.currentTarget).removeClass("show").css("background-image","");
            }); 

            
        },

         /**
         * It doesnt really renders the main view but a wrapper to draw home.
         * @method drawHome
         */
        drawHome : function(){
            if(!app.user){  
              var loginView = new LoginView();
              loginView.launch();
            }
            else {
              //If its the first time user draw an overlay which tells user about different parts of the app.
              var helpStatus = DataOp.getHelpStatus();
              if(!helpStatus["firstLaunchHelp"]){
                  helpStatus["firstLaunchHelp"] = true;
                  DataOp.setHelpStatus(helpStatus);
                  $("._wrapper .logo").addClass("firstLaunch");
                  $("._wrapper .logo .btn").gwClick(function(el){
                      el.hide();
                      $("._wrapper .logo img").show();
                  });
              }
              if(app.user.themes && app.user.themes.length){
                      var postsView = new HomeView(app.user.themes);
                      postsView.launch();
                      
              }else{
                  var themeView = new ThemesView();
                  //If themes are not selected yet; draw the themes page asking user to select some themes.
                  var checkL = setInterval(function(){
                      //It waits for the logo overlay which will be there if this 
                      //is the first time use of app and it shows up the help overlay.
                      if(!$("._wrapper .logo").is(":visible") || $("._wrapper .logo img").is(":visible")){
                          $("._wrapper .logo").hide();
                          clearInterval(checkL);
                          UIRender.toggleLoader();
                          themeView.launch();  
                      }
                  }.bind(this),1000);
              }
              this.assignEvents();
            }
        },

        /**
         * This is a very important function. This is where views are hidden and shown and toolbar is changed accordingly.
         * @method manageViews
         * @param  {string}    view  -  The view to show. view.type can be : userForm, home, saved, post, themes,profile
         */
        manageViews : function(view){
            var def = $.Deferred();
            var cont = $("._wrapper");
            if(view == "back"){
                view = viewStack.pop();
            }
            var toShow;

            if(view.type){
                if($(".sections").is(":visible")){
                    //We close the section always.
                    toggleSections();
                }
                $("#header .menu").removeClass("open");
                $("#header",cont).removeClass().addClass(view.type + "_context");
                if(!app.user || !app.user.themes || !app.user.themes.length) {
                    //If no themes are selected; dont show the menu.
                    $("#header",cont).addClass("noThemes");
                }else{
                    $("#header",cont).removeClass("noThemes");
                }
            }
            if(view.name){
                //If the name is passed we use it to show the title in toolbar.
                $("#header .title").html(view.name);
            }else{
                $("#header .title").html("");
            }
            if(view.type == "userForm"){
                toShow = $(".userForm",cont);  
            }
            else if(view.type.match(/(home|saved|posts)/gi)){
                toShow = $(".posts",cont);
                toShow.height(window.innerHeight-44);
            }
            else if(view.type == "post"){
                toShow = $(".postFull",cont);
                $("#header .back").removeClass("refresh");
                app.state = app.state = {};
                //The scroll position on articles is stored so that when we come back to article; we go to same article.
                app.state["scrollPos"] = $(".main").scrollTop();
            }else if(view.type == "themes"){
                toShow = $(".themes",cont);
            }else if(view.type == "profile"){
                toShow = $(".userProfile",cont);
            }
            if(!currentView || view.type != currentView.type){
                this.toggleLoader(true);
                $(".main",cont).removeClass("main").fadeOut(200,function(){
                    toShow.addClass("main").fadeIn(200,function(){
                        def.resolve(view.type);
                        if(view.type.match(/(home|saved|posts)/gi)){
                          if(app.state && app.state["scrollPos"]){
                            $(".main").scrollTop(app.state["scrollPos"]);
                          }else{
                            $(".main").scrollTop(0);
                          }
                        }
                    });
                });  
                if(currentView){
                    viewStack.push(currentView);
                }
            }else{
                this.toggleLoader(true);
                def.resolve(view.type);
            }
            currentView = view;
            return def.promise(view.type);
        },

        /**
         * A public function to remove the loader. 
         * @method hideLoader
         */
        hideLoader : function(){
            $(".loaderOverlay").hide();
        },
        /**
         * The function to toggle the overlay screen which shows the loader and also blocks user interactions.
         * It can also be passed a message to show to the user and keep the loader screen as it is.
         * @method toggleLoader
         * @param  {[type]}     param - true - hide the overlay, false - show the overlay, 
         *                             "string" - show the message passed as the string
         *                             default - just toggle it.
         * @return {[type]}
         */
        toggleLoader : function(param){
            $(".loaderOverlay .message").html("");
            if(typeof(param) == "boolean"){
                if(param){
                    $(".loaderOverlay").hide();
                }else{
                    $(".loaderOverlay").show();
                }
            }else if(typeof(param) == "string"){
                $(".loaderOverlay .message").html(param);
                if(!$(".loaderOverlay").is(":visible")){
                    $(".loaderOverlay").show();
                }
            }else{
                $(".loaderOverlay").toggle();
            }

        }

    };
})();
