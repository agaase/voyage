var ProfileView = (function(){

    /**
     * User logout logic. Everything is cleared here.
     * @method logout
     * @param  {function} c  - Callback to call once logout logic is finished.
     */
    var logout = function(c){
        var r = confirm("Are you sure, you want to logout?");
        if(r){
            window.localStorage.removeItem("user");
            window.localStorage.removeItem("articles");
            app.user = null;
            app.allPosts = null;
            app.savedArticles = {};
            c(r);
        }else{
            c();
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
    var savePassword = function(pass,id,c){
        DataOp.runMongoQuery({
            "u" : app.config["END_POINTS"]["USERS_COLLECTION"]+id,
            "t" : "PUT",
            "d" : JSON.stringify( {"$set":{ "password" : pass } }),
            "c" : c
        });
    };


    var logoutEvent = function(){
        //The logout button.
        $(".userProfile .logout.btn").gwClick(function(el){
            logout(function(res){
                if(res){
                    UIRender.drawHome();
                }
            });
        },{
            "data-timeout" : 200
        });
    };

    var bindChangePassEvent = function(id){
        //The change password button. 
        $(".userProfile .changePass.btn").gwClick(function(el){
            var inp = $(".userProfile input.password");
            if(inp.is(":visible")){
                var pass = inp.val();
                if(pass && pass.length>=6){
                    UIRender.toggleLoader("Saving..");
                    savePassword(md5(pass),id,function(){
                        UIRender.toggleLoader("Password saved. Redirecting to home");
                        setTimeout(function(){
                            UIRender.toggleLoader();
                            UIRender.drawHome();
                        },1000);
                    });
                }else{
                    $(".userProfile .message").html(app.config.APP_MESSAGES["INVALID_PASSWORD"]);
                }
            }else{
                $(".userProfile input.password").show();
                el.html("SAVE");
            }
        },{
            "data-timeout" : 200
        });
        
    };

    var obj = BaseView.extend({

        type : "profile",

        fetchData : function(c){
            this.data = app.user;
            c();
        },

        render : function(){
            $(".userProfile .changePass").html("CHANGE PASSWORD");
            $(".userProfile input.password").val("").hide();
            $("._wrapper .userProfile .email").html(this.data.email);
        },

        viewLoaded : function(){
            bindChangePassEvent(this.data._id);
            logoutEvent();
        }

    });

    return obj;
})();
