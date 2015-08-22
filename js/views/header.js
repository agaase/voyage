var HeaderView = (function(){


    var toggleAllThemes = function(){
      if($(".allThemes").hasClass("show")){
        $(".allThemes").removeClass("bgShow");
        setTimeout(function(){
          $(".allThemes").removeClass("show");
        },100);
      }else{
        $(".allThemes").addClass("show");
        setTimeout(function(){
          $(".allThemes").addClass("bgShow");
        },250);
      }
    };
   
    var obj = BaseView.extend({

      type : "header",
      
      el : "#header",

      constructor : function(){
        this.elOb = $(this.el);
        this.renderAllThemes();
      },



      manageBack : function(){
          if($(".allThemes").hasClass("show")){
            toggleAllThemes();
          }
          if(app.viewStack.length > 0){
              var el = $("#header .back");
              if(el.hasClass("refresh")){
                  //If the main view has to be refreshed.
                  $.when(UIRender.manageViews(undefined,true)).then(function(type){
                      UIRender.updatePosts();
                      DataOp.updateSavedPosts();
                  });
              }else{
                  UIRender.manageViews(undefined,true);
              }
          }else{
            if(navigator.app && navigator.app.exitApp){
                navigator.app.exitApp();
            }
          }
      },

      updateToolbarContext : function(type,title){
          $(".menu",this.elOb).removeClass("open");

          //The context of the page is added to toolbar as a class
          if(type){
            this.elOb.removeClass().addClass(type + "_context");
          }
          if(!app.user || !app.user.themes || !app.user.themes.length) {
              //If no themes are selected; dont show the menu.
              this.elOb.addClass("noThemes");
          }else{
              this.elOb.removeClass("noThemes");
          }
          //If the name is passed we use it to show the title in toolbar.
          if(title){
              $(".title",this.elOb).html("<div class='headertitle'>"+title+"</div>");
          }else{
              $(".title",this.elOb).html("");
          }
      },

      assignEvents : function(){
           $(".menu",this.elOb).gwClick(function(el){
                $.publish("/vyg/togglesections",[]);
            },{
                "data-activegrp" : "dummy",
                "useClick" : true
            });
           
            $(".refreshI",this.elOb).gwClick(function(el){
                $.publish("/vyg/refresh",[]);
            },{
                "data-activegrp" : "dummy",
                "useClick" : true
            });

            $(".allTh",this.elOb).gwClick(function(el){
                toggleAllThemes();
            },{
                "data-activegrp" : "dummy",
                "useClick" : true
            });

            $(".allThemes").gwClick(function(el,event){
              toggleAllThemes();
            },{
                "data-activegrp" : "dummy",
                "useClick" : true
            });
            $(".allThemes .th").gwClick(function(el,event){
              event.stopPropagation();
              toggleAllThemes();
              setTimeout(function(){
                UIRender.toggleLoader();
                var thView = new ThemeView(el.data("id").trim());  
                debugger;
                thView.launch();  
              },200);
            },{
                "useClick" : true
            });

            $.subscribe("/vyg/refreshToggle", function(){
                if(app.shouldBeRefreshed){
                  $(".refreshI",this.elOb).addClass("show");  
                }else{
                  $(".refreshI",this.elOb).removeClass("show");
                }
                
            }.bind(this));

            // The in app back button on the toolbar.
            $(".back",this.elOb).gwClick(function(el){
                  this.manageBack(el);
            }.bind(this),{
                "data-active" : "active",
                "data-timeout" : 500,
                "useClick" : true
            });
            //Binding the device back button.
            document.addEventListener("backbutton", function(){
                this.manageBack();
            }.bind(this), false);
      },
      
      renderAllThemes : function(){
        var buckets = Util.getThemeBuckets($.extend(true,{},app.config["THEMES"]));
        var html = "<div class='label'>ALL THEMES <div class='labelMsg'>(Select a theme to read articles)</div></div>";
        $.each(buckets,function(bck,themes){
          html += "<div class='themeBucket'>";
          $.each(themes,function(i,v){
             html  += "<div data-id='"+v.id+"' class='th'>"+v.category_title+"</div>";
          });
          html += "</div>";
        });
        $(".allThemes .allThemesCont").html(html);
      },

      launch : function(){
        
      }
    });
    return obj;
})();