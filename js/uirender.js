
var UIRender = (function(){

    
    return {
      viewStack : [],

      /**
       * Update on the posts page the progress of the article if its bookmarked.
       * The progress is stored in local object in the same format it is to be represented. e.g 2/6
       * @method updatePosts
       */
      updatePosts : function(){
          if(app.state['postId']){
              var post = $(".posts .post[data-id="+app.state['postId']+"]");
              if(post.hasClass("saved")){
                //For saved page we are redrawing the page.
                return;
              }
              if(app.state["progress"]){
                  if($(".progress",post).length){
                      $(".progress",post).html(app.state["progress"]+"%");
                  }else{
                      $(".metainfoWrapper",post).append("<div class='metainfo progress'>"+app.state["progress"]+"%</div>");
                  }
              }else{
                  post.removeClass("inProgress");
                  $(".progress",post).hide();  
              }
          }
      },

      manageSectionsOpenTouch : function(e,isOpen){
        var tmtimer, orPos, touch;
        if(isOpen){
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
                      $.publish("/vyg/togglesections",[false]);
                  }
                  setTimeout(function(){
                      tmtimer = 0;  
                      orPos = 0;  
                  },400);
              },300);
          });
        }else{
          $(".main").unbind("touchmove.lock");
        }
      },

      /**
       * All the global events to be triggered.
       * @method assignEvents
       */
      assignEvents : function(){
            this.header.assignEvents();

            this.sections.assignEvents();
            
            $.subscribe("/vyg/sectionstoggled", this.manageSectionsOpenTouch);

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

        initialise : function(){
            this.sections = new SectionsView();
            this.header = new HeaderView();
            this.assignEvents();
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
                  app.user.justRegistered = false;
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
              
            }
        },


        manageViews : function(view,fromStack){
            if(fromStack){
              //If we have to pull it from stack
              view = app.viewStack.pop();
            }else if(app.currentView && app.currentView.type.match(/(home|saved|posts)/gi) && (view.type != app.currentView.type || (view.theme && view.theme != app.currentView.theme))){
              //Else if a new view is drawn, lets push old view to stack (only if articles page and view is different"
              if(app.viewStack.length > 2){
               //At max we keep 3 views in stack
               app.viewStack.splice(0,1);  
              }
              app.viewStack.push(app.currentView);
            }
            var def = $.Deferred();
            var cont = $("._wrapper");
            if(view.type){
                var isSectionsOpen = this.sections.closeSections();
            }
            setTimeout(function(){
              this.header.updateToolbarContext(view.type,view.headerTitle);
              
              var toShow = $(view.el,cont);

              /** All this should be in specific views */
              if(view.type.match(/(home|saved|posts)/gi)){
                  toShow.height(window.innerHeight-44);
              }
              else if(view.type == "post"){
                  $("#header .back").removeClass("refresh");
                  app.state = app.state = {};
                  //The scroll position on articles is stored so that when we come back to article; we go to same article.
                  app.state["scrollPos"] = $(".main").scrollTop();
              }


              if( !app.currentView || view.type != app.currentView.type || (view.theme && view.theme != app.currentView.theme)){
                  //Only if first time render, current view type is not same as old view, if its a different theme
                      if( !app.currentView || view.el != app.currentView.el){
                        //Only if current vip
                        //ew is not same as old view
                        this.toggleLoader(true);
                        $(".main",cont).removeClass("main").fadeOut(200,function(){
                            toShow.addClass("main").fadeIn(200,function(){
                                def.resolve(view.type);
                                if(view.type.match(/(home|saved|posts)/gi)){
                                  if(app.state && app.state["scrollPos"]){
                                    $(".main").scrollTop(app.state["scrollPos"]);
                                    app.state["scrollPos"] = null;
                                  }else{
                                    $(".main").scrollTop(0);
                                  }
                                }
                                if(view.type == "saved"){
                                  //
                                  view.loadFromCache();
                                }
                            });
                        });  
                      }else if(view.loadFromCache){
                        view.loadFromCache();
                        $(".main").scrollTop(0);  
                      }
              }else{
                  this.toggleLoader(true);
                  def.resolve(view.type);
              }
              app.currentView = view;
            }.bind(this),isSectionsOpen ? 500 :  50);
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
            $(".loaderOverlay").unbind("touchstart").bind("touchstart",function(e){
                e.preventDefault();
            });
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
        },

        /**
         * To show an info message to the user
         * @method toggleInfoMessage
         * @param  {[type]}          msg      [description]
         * @param  {[type]}          duration [description]
         * @return {[type]}
         */
        showInfoMessage : function(msg,isError,duration){
            if(msg){
                $("#infoMessage").removeClass().addClass(isError ? "error" : "").html(msg).fadeIn();
                setTimeout(function(){
                    $("#infoMessage").fadeOut();
                },(duration || 3500));
            }
        }

    };
})();
