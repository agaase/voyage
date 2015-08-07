var HeaderView = (function(){
   
    var obj = BaseView.extend({

      type : "header",
      
      el : "#header",

      constructor : function(){
        this.elOb = $(this.el);
      },

      manageBack : function(){
          if(app.viewStack.length > 1){
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

      launch : function(){

      }
    });
    return obj;
})();