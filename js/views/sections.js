var SectionsView = (function(){
   
    var obj = BaseView.extend({

      type : "sections",
      
      el : ".sections",

      constructor : function(){
        this.elOb = $(".sections");
      },

      launch : function(){
        
      },

      closeSections : function(){
          if(this.elOb.is(":visible")){
            //We close the section always.
            this.toggleSections();
            return true;
          }
      },

      toggleSections : function(){
        if(this.isOpen){
            this.elOb.fadeOut(200);
            $(".main").removeClass('slidedown');
            setTimeout(function(){
              $.publish("/vyg/sectionstoggled",[!this.isOpen]);
              this.isOpen = false;
            }.bind(this),400);
            /*
            move(".main").translate(0,0).duration(450).end(function(){
              $.publish("/vyg/sectionstoggled",[!this.isOpen]);
              this.isOpen = false;
            }.bind(this));
          
            this.elOb.slideToggle(300,function(){
              $.publish("/vyg/sectionstoggled",[!this.isOpen]);
              this.isOpen = false;
            }.bind(this));
            */
        }else{
            this.elOb.fadeIn(200);
            $(".main").addClass('slidedown');
            setTimeout(function(){
              $.publish("/vyg/sectionstoggled",[!this.isOpen]);
              this.isOpen = true;
            }.bind(this),400);
            /*
            move(".main").translate(0,255).duration(450).end(function(){
              $.publish("/vyg/sectionstoggled",[!this.isOpen]);
              this.isOpen = true;
            }.bind(this));
            /*
            this.elOb.slideToggle(300);
            //We hide the fixed position timestamp once menu shows up.
            $.publish("/vyg/sectionstoggled",[!this.isOpen]);
            this.isOpen = true;
            */
        }
      },

      assignEvents : function(){
          // All the links on sections menu.
          $(".link",this.elOb).gwClick(function(el){
              if(el.hasClass("allthemes")){
                  var themeView = new ThemesView();
                  themeView.launch();
              }else if(el.hasClass("home")){
                  UIRender.drawHome();
              }else if(el.hasClass("saved")){
                  $("._wrapper .posts").empty();
                  var savedView = new SavedPostsView();
                  savedView.launch();
              }else if(el.hasClass("profile")){
                  var profView = new ProfileView();
                  profView.launch();
              }
          });
          $.subscribe("/vyg/togglesections", function(){
            this.toggleSections();
          }.bind(this));
      }

    });
    return obj;
})();