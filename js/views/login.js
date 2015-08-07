var LoginView = (function(){

    /**
     * The register event handler
     * @method register
     * @return {[type]}
     */
    var register = function(){
        var email = $("input.email").val();
        var pass = $("input.password").val();
        //As of now email should match the common format *@* and should be atleast six characters.
        var isValid = email.match(/.*@.*\..*/g) && pass && pass.length>=6;
        if(isValid){
            DataOp.getUser($("input.email").val(),function(user){
                if(!user.email){
                    pass = md5(pass);
                    DataOp.addUser({
                        "_id" : email,
                        "email" : email,
                        "password" : pass,
                        "themes" : Object.keys(app.config.THEMES)
                    },function(u){
                        DataOp.sendMail({
                            "to" : email,
                            "subject" : app.config.APP_MESSAGES["REGISTER_SUCCESS_SUBJECT"],
                            "body" : app.config.APP_MESSAGES["REGISTER_SUCCESS_BODY"],
                            "from" : "team@opsight.in",
                            "fromname" : "Team Opsight"
                        });
                        UIRender.toggleLoader("Successfully registered; Redirecting..");
                        setTimeout(function(){
                            app.user = u;
                            app.user.themes = app.user.themes || [];
                            window.localStorage.setItem("user",JSON.stringify(app.user));
                            $(".userForm").hide();
                            UIRender.toggleLoader();
                            $(".logo").show();
                            UIRender.drawHome();
                        }.bind(this),1500);
                    }.bind(this));
                }else{
                    //The case when the user is already registered.
                    $(".userForm .message").html(app.config.APP_MESSAGES["ID_ALREADY_REGISTERED"]);
                    UIRender.toggleLoader();
                }
            }.bind(this));
        }else{
            if(pass.length<6){
                $(".userForm .message").html(app.config.APP_MESSAGES["INVALID_PASSWORD"]);    
            }else{
                $(".userForm .message").html(app.config.APP_MESSAGES["VALID_USERNAME_PASSWORD"]);    
            }
            UIRender.toggleLoader();
        }
    };

     /**
     * The login event handler
     * @method login
     * @return {[type]}
     */
    var login = function(){
        var id = $("input.email").val();
        var pass = md5($("input.password").val());
        //As of now email should match the common format *@* and should be atleast six characters.
        var isValid = id.match(/.*@.*\..*/g) && pass;
        if(isValid){
            DataOp.getUser(id,function(user){
                if(user._id && user.password == pass){
                    app.user = user;
                    app.savedArticles = app.user.savedPosts || {};
                    window.localStorage.setItem("user",JSON.stringify(user));
                    window.localStorage.setItem("articles",JSON.stringify(app.savedArticles));
                    $("input.password").val("");
                    $(".userForm .message").html("");
                    $(".userForm").hide();
                    UIRender.toggleLoader();
                    $(".logo").show();
                    UIRender.drawHome();
                }else{
                    $(".userForm .message").html("<span class='error'>Incorrect username/password</span>");
                    UIRender.toggleLoader();
                }
            }.bind(this));
        }else{
             $(".userForm .message").html(app.config.APP_MESSAGES["VALID_USERNAME_PASSWORD"]);
             UIRender.toggleLoader();
        }
    };
    /**
     * Save the password for a particular user
     * @method savePassword
     * @param  {[type]}     pass - The md5 encrypted password.
     * @param  {[type]}     c    - Callback to call once password is saved
     * @param  {[type]}     id   - id of the user (default - set in app.user._id; used in case of sending temporary password)
     * @return {[type]}
     */
    var savePassword = function(pass,c,id){
        DataOp.runMongoQuery({
            "u" : app.config["END_POINTS"]["USERS_COLLECTION"]+(id || app.user._id),
            "t" : "PUT",
            "d" : JSON.stringify( {"$set":{ "password" : pass } }),
            "c" : c
        });
    };


    /**
     * The actual event to do a register or login.
     * @method bindLoginRegisterEvent
     */
    var bindLoginRegisterEvent = function(){
        $(".userForm .btn1").gwClick(function(el){
          UIRender.toggleLoader();
          if(el.hasClass("login")){
              login.call(this);
          }else if(el.hasClass("register")){
              register.call(this);
          }
        }.bind(this),{
            "data-timeout" : 100
        });
    };

    /**
     * Shows up the view for forgot password.
     * @method bindForgotPassEvent
     * @return {[type]}
     */
    var bindForgotPassEvent = function(){
        //If user forgets the password
        $(".userForm .forgotPass").gwClick(function(el){
            $(".userForm").addClass("forgot");
            $(".loginMsg").html(app.config.APP_MESSAGES["FORGOT_MSG"]);
            $("input.email").attr("placeholder","Your email");
            $(".userForm .message").html(app.config.APP_MESSAGES["INFO_SEND_TEMP_PASSWORD"]);
        },{
            "data-timeout" : 50
        });
    };

    /**
     * The switch button which basically enables 'btn1' as register or login event.
     * @method bindSwitchEvent
     */
    var bindSwitchEvent = function(){
      //btn2 is basically the login or the register button.
      $(".userForm .btn2").gwClick(function(el){
          if(el.hasClass("login")){
              el.html("Register").removeClass("login").addClass("register");
              $(".userForm .btn1").removeClass("register").addClass("login").html("LOGIN");
              $("input.email").attr("placeholder","Your email");
              $("input.password").attr("placeholder","Your password");
              $(".loginMsg").html(app.config.APP_MESSAGES["REGISTER_MSG"]);
          }else if(el.hasClass("register")){
              el.html("Login").removeClass("register").addClass("login");
              $(".userForm .btn1").removeClass("login").addClass("register").html("REGISTER");
              $("input.email").attr("placeholder","Choose an email");
              $("input.password").attr("placeholder","Choose a password");
              $(".loginMsg").html(app.config.APP_MESSAGES["LOGIN_MSG"]);
          }
      },{
          "data-timeout" : 50
      });
    };

    var bindSendTempPassEvent = function(){
          // Sending the temporary password to the user.
          $(".btn.sendTemp").gwClick(function(el){
              var val = $("input.email").val();
              if(val && val.length){
                  UIRender.toggleLoader();
                  //Any random password would do.
                  var pass = "vyg"+parseInt(Math.random()*1000);
                  DataOp.sendMail({
                      "to" : val,
                      "subject" : app.config.APP_MESSAGES["FORGOT_PASS_SUBJECT"],
                      "body" : app.config.APP_MESSAGES["FORGOT_PASS_BODY"].replace("{{TEMP_PASSWORD}}",pass),
                      "fromname" : "Support Opsight"
                  });
                  savePassword(md5(pass),function(){
                      UIRender.toggleLoader();
                      $(".userForm .message").html(app.config.APP_MESSAGES["INFO_SENT_TEMP_PASSWORD"]);
                      $(".userForm .message .backtologin").gwClick(function(el){
                          $(".userForm .message").html("");
                          $(".userForm").removeClass("forgot");
                      }.bind(this));
                  }.bind(this),val);
              }else{
                  $(".userForm .message").html(app.config.APP_MESSAGES["INVALID_EMAIL"]);    
              }
          }.bind(this),{
              "data-timeout" : 50
          });
    };

    var obj = BaseView.extend({

      type : "userForm",
      
      el : ".userForm",

      viewLoaded : function(){
          bindLoginRegisterEvent();
          bindForgotPassEvent();
          bindSwitchEvent();
          bindSendTempPassEvent();
      }

    });
    return obj;
})();