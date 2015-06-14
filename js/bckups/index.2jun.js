/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {

    /**
     * Global object containing the user info.
     */
    user : undefined,

    /**
     * Global object containing all the articles loaded.
     */
    allPosts : undefined,

    /**
     * Global object containing all the saved articles.
     */
    savedArticles : undefined,

    // Application Constructor
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },

    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.startFlow();
    },

    /**
     * This is the starting point of the application.
     * @method startFlow
     */
    startFlow : function(){
        //Check if the connection is on.
        var connection = Util.checkConnection();
        if(connection.isOn){
            Util.getConfig(function(d){
                app.config = d;
                //Get the locally stored user object
                app.user = window.localStorage.getItem("user");
                //Get the locally stored saved articles.
                app.savedArticles = window.localStorage.getItem("articles");
                app.savedArticles = app.savedArticles ? JSON.parse(app.savedArticles) : {};
                //This will be useful if the app closed and the saved posts didnt get time to sync with the server.
                DataOp.updateSavedPosts();
                Util.preloadIcons(function(){
                    if(app.user){
                        app.user = JSON.parse(app.user);
                        app.user.themes = app.user.themes || [];
                        UIRender.drawHome();    
                    }else{
                        UIRender.drawLogin();
                    }
                });
            });
        }else{
            try{
                var r = confirm("Looks like your network is down. Please check and click ok to retry.");
                if(r){
                    setTimeout(function(){
                        //Start the flow again if the user presses ok.
                        app.startFlow();    
                    },2000);
                }else{
                    navigator.app.exitApp();
                }
            }
            catch(err){
                alert(err);
            }
        }
    }
};

/**
 * Just includes some basic Utility functions.
 */
var Util = (function(){
    var obj = {

        /**
         * Gets the app config
         * @method getConfig
         * @param  {function}  c - Callback to call.
         */
        getConfig : function(c){
            $.getJSON("config/config.json",function(d){
                c(d);
            });
        },

         /**
         * Basically pre-loading all static images used in the app.
         * @method preloadIcons
         * @param  {function}     c - Callback to call once the icons are preloaded.
         */
        preloadIcons : function(c){
            var images = ["check.png","home.png","loader.gif","menu.png","save.png","saved.png","saved_info.png","share.png","themes.png","user.png","help_overlay/article.png"];
            var loaded = 0, called=false;
            $.each(images,function(i,v){
                var img = new Image();
                var calb = function(){
                    loaded++;
                    if(loaded == images.length){
                        if(!called){
                            called=true;
                            c();
                        }
                    }
                };
                img.onload = calb;
                img.onerror = calb;
                img.src = "img/"+v;
            });
            setTimeout(function(){
                if(!called){
                    called=true;
                    c();
                }
            },3000);
            
        }, 

        log : function(msg){
            console.log("VOYAGE:"+new Date().getTime()+" - "+msg);
        },
        alert : function(params){
            if (navigator.notification) { // Override default HTML alert with native dialog
              window.alert = function (message) {
                  navigator.notification.alert(
                      message,    // message
                      null,       // callback
                      "VOYAGE", // title
                      params.buttonName        // buttonName
                  );
              };
            }
            alert(params.message);
        },
        checkConnection : function() {
            if(navigator.connection && typeof(Connection) !="undefined"){
                var networkState = navigator.connection.type;
                var states = {};
                states[Connection.UNKNOWN]  = 'Unknown connection';
                states[Connection.ETHERNET] = 'Ethernet connection';
                states[Connection.WIFI]     = 'WiFi connection';
                states[Connection.CELL_2G]  = 'Cell 2G connection';
                states[Connection.CELL_3G]  = 'Cell 3G connection';
                states[Connection.CELL_4G]  = 'Cell 4G connection';
                states[Connection.CELL]     = 'Cell generic connection';
                states[Connection.NONE]     = 'No network connection';
                if(networkState == Connection.NONE){
                    return {
                        isOn : false,
                        state : networkState
                    };
                }else{
                    return {
                        isOn : true,
                        state : networkState
                    };
                }
            }else{
                return {
                    isOn : true,
                };
            }
        }
    };
    return obj;
})();


/**
 * All the database related operations.
 */
var DataOp = (function(){

    /**
     * Any request will be triggered using this.
     * @method loadURL
     * @param  {[type]} params   - u : the endpoint url, d : data to send, 
     *                             t : type of request,  contentType : what type of content will be in response
     *                             c : callback to call
     * @param  {[type]} dontShowError -  TRUE: dont show the alert to the user if some error has occured.
     * @param  {[type]} dontTimeout   - TRUE : dont timeout on the request
     */
    var loadURL = function(params,dontShowError,dontTimeout){
        var options = { 
            url: params.u,
            data: params.d || null,
            type: params.t || "POST",
            contentType : params.contentType,
            beforeSend : function(xhr){
                xhr.setRequestHeader("Authorization", "Basic NGFsdW1lYnBxNzpiZ2I1ejg4aDFy");
            }
        };
        if(!dontTimeout){
            options["timeout"] = 30000;
        }
        $.ajax(options).done(function(data){
            if(params.c){
                params.c(data);
            }
        }).error(function(data){
            alert(data.statusText);
            if(!dontShowError){
                setTimeout(function(){
                    var conn = Util.checkConnection();
                    if(!conn.isOn){
                        alert("Please check your network connection and then try again.");
                    }else{
                        //Whatever error; we just quit. We can be more granular than this.
                        alert("Oops, our bad. Can you please try again launching the app.");
                    }
                    navigator.app.exitApp();
                    UIRender.hideLoader();    
                },2000);
            }else if(params.c){
                params.c(data);
            }
        });
    };

    /**
     * Any mongo query first comes here and then goes to loadUrl.
     * @method runMongoQuery
     * All parameters remain same as loadUrl except the following
     *  u : endpoint url is appended with credentials of mongodb
     *  contentType : hardcoded value since return from mongo is always json.
     */
    var runMongoQuery = function(params,dontShowError,dontTimeout){
        params.u = params.u + (params.u.indexOf("?") >-1 ? "&" : "?") + "apiKey="+app.config["KEYS"]["MONGODB"];
        params.contentType = "application/json";
        loadURL(params,dontShowError,dontTimeout);
    };

    var obj = {


        /**
         * User logout logic. Everything is cleared here.
         * @method logout
         * @param  {function} c  - Callback to call once logout logic is finished.
         */
        logout : function(c){
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
        },

        /**
         * Sends mail using send grid.
         * @method sendMail
         * @param  {object} params  - to : sendee, toname : sendee name, 
         *                            subject : subject of email, html : rich text to send
         *                            from : email of person/org who is sending (default - support@voyageapp.in)
         *                            from name : name of person/org who is sending 
         * @return {[type]}
         */
        sendMail : function(params){
            $.ajax( { 
                url: "https://api.sendgrid.com/api/mail.send.json",
                data: "api_user=agaase&api_key=Bcda1234&to="+(params.to)+"&toname="+(params.toname||"")+"&subject="+(params.subject || "")+"&html="+(encodeURIComponent(params.body) || "")+"&from="+(params.from || "support@voyageapp.in")+"&fromname="+(params.fromname || ""),
                type: "POST"
            }).done(function(){
            });
        },


        /**
         * Save the password for a particular user
         * @method savePassword
         * @param  {[type]}     pass - The md5 encrypted password.
         * @param  {[type]}     c    - Callback to call once password is saved
         * @param  {[type]}     id   - id of the user (default - set in app.user._id; used in case of sending temporary password)
         * @return {[type]}
         */
        savePassword : function(pass,c,id){
            runMongoQuery({
                "u" : app.config["END_POINTS"]["USERS_COLLECTION"]+(id || app.user._id),
                "t" : "PUT",
                "d" : JSON.stringify( {"$set":{ "password" : pass } }),
                "c" : c
            });
        },

        /**
         * Remove the article as a bookmark
         * @method unsaveArticle
         * @param  {object}      postData - The post data
         */
        unsaveArticle : function(postData){
            //This will signify that the articles page has to be updated with the bookmarked articles.
            $("#header .back").addClass("refresh");
            app.state = app.state || {};
            app.state["postId"] = postData._id;
            app.state["progress"] = 0;
            delete app.savedArticles[postData._id];
            window.localStorage.setItem("articles",JSON.stringify(app.savedArticles));
        },

        /**
         * Add the article as a bookmark
         * @method saveArticle
         * @param  {object}    postData [description]
         * @return {[type]}
         */
        saveArticle : function(postData){
            //This will signify that the articles page has to be updated with the bookmarked articles.
            $("#header .back").addClass("refresh");
            app.state = app.state || {};
            app.state["postId"] = postData._id;
            app.state["progress"] = postData.readingPos+"/"+postData.totalPages;
            app.savedArticles[postData._id] = postData;
            if(this.persistTimeout){
                clearTimeout(this.persistTimeout);
            }
            //****Not sure why iam adding a delay here.
            this.persistTimeout = setTimeout(function(){
                window.localStorage.setItem("articles",JSON.stringify(app.savedArticles));
            },2000);
        },

        /**
         * Get a particular user from the id.
         * @method getUser
         * @param  {string} id   -  The id of the user.
         * @param  {function} c  -  Callback function to call.
         */
        getUser : function(id,c){
             runMongoQuery({
                            "u" : app.config["END_POINTS"]["USERS_COLLECTION"]+id,
                            "t" : "GET",
                            "c" : function(user){
                                c(user);
                            }
                },true);
        },

        /**
         * Adds a new user to the db.
         * @method addUser
         * @param  {object} user  - The object having user id (same as email), email and password.
         * @param  {function} c     - Callback function to call.
         */
        addUser: function(user,c){
            runMongoQuery({
                "u" : app.config["END_POINTS"]["USERS_COLLECTION"],
                "t" : "POST",
                "d" : JSON.stringify(user),
                "c" : function(user){
                    c(user);
                }
            });
        },


        getDateFilter : function(){
            var cont = $("._wrapper .posts");
            var el = $(".loadmore",cont);
            var pos = parseInt(el.attr("data-ct")) || 0;
            var d = new Date(), stDate, endDate;
            if(pos === 0){
                stDate = new Date(d.getYear(),d.getMonth(),d.getDate()-1);
                endDate = new Date(d.getYear(),d.getMonth(),d.getDate()+1);
            }else if(pos ==1){
                stDate = new Date(d.getYear(),d.getMonth(),d.getDate()-13);
                endDate = new Date(d.getYear(),d.getMonth(),d.getDate()+1);
            }else if(pos == 2){
                stDate = new Date(d.getYear(),d.getMonth(),d.getDate()-29);
                endDate = new Date(d.getYear(),d.getMonth(),d.getDate()+1);
            }
        },

        /**
         * Gets all the posts for the user. 
         * @method getUserPosts
         * @param  {ARRAY}     themes -  All the themes belonging to the user.
         * @param  {function}     c   -  The callback function.
         * @return {[type]}
         */
        getUserPosts : function(timeStamp,c){
            //If there are five themes for the user; it will make 5 requests. We should improve this to make a single request. 
            //But then; I may never get posts for some themes.
            //$.each(themes,function(i,th){
            //}.bind(this));
                //"http://app.genwi.com/5.0/getjson/articles/43443/"+th+"/0/"+(total > 3 ? "10" : "20")
                //'https://api.mongolab.com/api/1/databases/voyagefeeds/collections/feeditems?apiKey=Xh9SI49zvHqiW6Ma5KaQQsHcIuhu0l2G&q={"categories":"'+th+'"}&l=10',
                var d  =  new Date().getTime();
                var themes = app.user.themes.map(function(v){
                    return {"term" : {"categories":v}};
                });
                var q = {
                      "size" : 300,
                      "query": {
                        "filtered": {
                          "filter": {
                            "bool": {
                              "must": [
                                {
                                  "range": {
                                    "pubdate": {
                                      "gte": new Date(d + timeStamp.gte*24*60*60*1000).toISOString().substring(0,10),
                                      "lt": new Date(d + timeStamp.lt*24*60*60*1000).toISOString().substring(0,10),
                                    }
                                  }
                                }
                              ],
                              "should" : themes
                            }
                          }
                        }
                      },
                      "sort": [
                        {
                          "date": {
                            "order": "desc"
                          }
                        }
                      ]
                    };
                debugger;
                loadURL({
                    u : app.config["END_POINTS"]["FEED_ITEMS"],
                    t : "POST",
                    d :  JSON.stringify(q),
                    c : function(resp){
                            debugger;
                            resp = resp.hits.hits.map(function(v){v._source._id = v._id; return v._source;});
                            resp = resp.sort(function(a,b){
                                return (new Date(b.pubdate) - new Date(a.pubdate));
                            });
                            resp = this.shufflePosts(resp,0);
                            app.allPosts = $.merge(app.allPosts || [], resp);
                            c(resp);
                        }.bind(this)
                });
            //}.bind(this));
        },
        /**
         * This will shuffle the posts making sure posts from same category dont repeat after 3 articles max.
         * Its actually a recursive function; that why the argument 'pos'.
         * @method shufflePosts
         * @param  {array}      posts  - Original array of posts.
         * @param  {[type]}     pos    - The recursive identifier.
         */
        shufflePosts : function(posts,pos){
            var bucketLimit = 3;
            var themePostCount  = {}, themesFull =0;
            $.each(app.user.themes,function(i,theme){
                themePostCount[theme] = 0;
            });
            pos = pos || 0;

            for(var i=pos; i< posts.length;i++){
                var post = posts[i];
                if(themePostCount[post.categories]<bucketLimit){
                    if(i != pos){
                        posts.splice(i,1);
                        posts.splice(pos,0,post);
                    }
                    themePostCount[post.categories]++;
                    if(themePostCount[post.categories]==bucketLimit){
                        themesFull++;
                    }
                    pos++;
                }
            }
            if(pos < posts.length){
                return this.shufflePosts(posts,pos);
            }else{
                return posts;
            }
        },

        /**
         * Update the themes of the user. 
         * @method updateUserThemes
         * @param  {array}         themes - The new themes array
         * @param  {functio}       c  - Callback function.
         */
        updateUserThemes : function(themes,c){
            runMongoQuery({
                "u" : app.config["END_POINTS"]["USERS_COLLECTION"]+app.user._id,
                "t" : "PUT",
                "d" : JSON.stringify( {"$set":{ "themes" : themes } }),
                "c" : c
            });
        },

        /**
         * Sync up the saved articles to the server,
         * @method updateSavedPosts
         * @param  {function}         c - Callback function to call.
         */
        updateSavedPosts : function(c){
            if(Object.keys(app.savedArticles).length){
                runMongoQuery({
                    "u" : app.config["END_POINTS"]["USERS_COLLECTION"]+app.user._id,
                    "t" : "PUT",
                    "d" : JSON.stringify( {"$set":{ "savedPosts" : app.savedArticles } }),
                    "c" : c
                },true);
            }
        }
    };
    return obj;
})();

/**
 * All the operations related to UI rendering.
 */
var UIRender = (function(){

    var currentView,viewStack=[];

    /**
     * The function which carries out the swipe between the pages of the article.
     * Whats left is the ability to drag and pan the page instead of simple swipe.
     * @method enableArticleSnap
     * @param  {object}   el  - the jquery element object on which snap is to be enabled.
     * @param  {[type]}   c   - The callback function which will be called on successfull snap to next/prev page.
     */
    var enableArticleSnap = function(el,c){
        el.css("overflow","hidden");
        var y  = 0, startPosY, moveTimer, originalstartPosY,originalstartPosX;
        var h = $(".postFull").height();
        var pos = parseInt($("#header .progress .pos").text());
        var tot = parseInt($("#header .progress .total").text());

        var handleTouchstart = function(ev){
            var touchobj = ev.originalEvent.changedTouches[0];
            originalstartPosY = touchobj.pageY;
            originalstartPosX = touchobj.pageX;
            startPosY = originalstartPosY; 
        };
        var moving = false;
        var handleTouchmove = function(ev){
            ev.preventDefault();
            //This is where iam trying to implement drag. But needs improvement. Till then lets just go back.
            return;
            if(moving){
                return;
            }
            moving=true;
            var touchobj = ev.originalEvent.changedTouches[0];
            var diff = Math.ceil((touchobj.pageY-startPosY));
            y = y + diff;

            if(diff < 0){
                y = y < (pos * h * -1) ? (pos * h * -1) : y;
                y = y < ((tot-1) * h * -1) ? ((tot-1) * h * -1) : y;
            }else if(diff >= 0){
                y = y > ((pos-2) * h * -1) ? ((pos-2) * h * -1) : y;
                y = y > 0 ? 0 : y;
            }
            //The time for snap is calculated as the touch distance difference x 3 milliseconds. 
            $(".postFullCont").css({"webkit-transform":"translateY("+y+"px)","webkit-transition-duration":""+Math.abs(diff)*3+"ms"});    
            setTimeout(function(){
                //Going to disable any further transform if the page is moving.
                moving=false;
            },Math.abs(diff)*5);
            startPosY = touchobj.pageY;
        };
        var handleTouchend = function(ev){
            if(moveTimer){
                clearTimeout(moveTimer);
            }
            ev.stopPropagation();
            var touchobj = ev.originalEvent.changedTouches[0];
            var endPosY = touchobj.pageY;
            var endPosX = touchobj.pageX;
            if(Math.abs(endPosY-originalstartPosY)>10 && Math.abs(endPosX-originalstartPosX)<100){
                snapto( (endPosY-originalstartPosY)>0 ? "down" : "up" , ev);
            }
        };

        el.on("touchstart",handleTouchstart).on("touchmove",handleTouchmove).on("touchend",handleTouchend);
        var snapto = function(dir){
            if(dir=="up" && pos < tot){
                pos++;
            }else if(dir=="down" && pos > 1){
                pos--;
            }
            snapArticle(pos);
            y = -1*$(".postFull").height()*(pos-1);
            c(pos);
        };
    };

    /**
     * Just carries the snap to the specified page.
     * @method snapArticle
     * @param  {number}    pos  - The page number to which to snap to.
     */
    var snapArticle = function(pos){
        $("#header .progress .pos").html(pos);    
        $(".postFullCont").css({"webkit-transform":"translateY(-"+$(".postFull").height()*(pos-1)+"px)","webkit-transition-duration":"400ms"});
    };

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
            $("._wrapper .sections").slideToggle(700,function(){
                //We show the fixed position timestamp once menu hides.
                $(".timestamp.current").show(); 
                $(".timestamp:eq(1)").html("last 2 days"); 
            });
            $(".main").unbind("touchmove.lock");
        }
    };


    /**
     * All the global events to be triggered.
     * @method assignEvents
     */
    var assignEvents = function(){
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
                $.when(manageViews("back")).then(function(type){
                    updatePosts();
                    DataOp.updateSavedPosts();
                });
            }else{
                manageViews("back");
            }
        },{
            "data-active" : "active",
            "data-timeout" : 500,
            "useClick" : true
        });
        //Binding the device back button.
        document.addEventListener("backbutton", function(){
            if($("#header").hasClass("post_context")){
                var el = $("._wrapper .back");

                if(el.hasClass("refresh")){
                    $.when(manageViews("back")).then(function(type){
                        updatePosts();
                    });
                }else{
                    manageViews("back");
                }
            }
        }, false);
        // All the links on sections menu.
        $(".sections .link").gwClick(function(el){
            if(el.hasClass("allthemes")){
                UIRender.drawThemes();
            }else if(el.hasClass("home")){
                UIRender.drawHome();
            }else if(el.hasClass("saved")){
                $("._wrapper .posts").empty();
                UIRender.drawPosts($.map(app.savedArticles, function(el) { return el; }),"Saved Articles","saved");    
            }else if(el.hasClass("profile")){
                UIRender.drawProfile();
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

        //The change password button. 
        $(".userProfile .changePass.btn").gwClick(function(el){
            var inp = $(".userProfile input.password");
            if(inp.is(":visible")){
                var pass = inp.val();
                if(pass && pass.length>=6){
                    toggleLoader("Saving..");
                    DataOp.savePassword(md5(pass),function(){
                        toggleLoader("Password saved. Redirecting to home");
                        setTimeout(function(){
                            toggleLoader();
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
        //The logout button.
        $(".userProfile .logout.btn").gwClick(function(el){
            DataOp.logout(function(res){
                if(res){
                    UIRender.drawLogin();
                }
            });
        },{
            "data-timeout" : 200
        });
    };

    /**
     * This is a very important function. This is where views are hidden and shown and toolbar is changed accordingly.
     * @method manageViews
     * @param  {string}    view  -  The view to show. view.type can be : userForm, home, saved, post, themes,profile
     */
    var manageViews = function(view){
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
        if(view.type == "userForm"){
            toShow = $(".userForm",cont);  
        }
        else if(view.type == "home" || view.type=="saved"){
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
            toggleLoader(true);
            $(".main",cont).removeClass("main").fadeOut(200,function(){
                toShow.addClass("main").fadeIn(200,function(){
                    def.resolve(view.type);
                    if((view.type == "home" || view.type=="saved") && app.state && app.state["scrollPos"]){
                        $(".main").scrollTop(app.state["scrollPos"]);
                    }
                });
            });  
            if(currentView){
                viewStack.push(currentView);
            }
        }else{
            toggleLoader(true);
            def.resolve(view.type);
        }
        currentView = view;
        return def.promise(view.type);
    };  

    /**
     * The function to toggle the overlay screen which shows the loader and also blocks user interactions.
     * It can also be passed a message to show to the user and keep the loader screen as it is.
     * @method toggleLoader
     * @param  {[type]}     param - true - hide the overlay, false - show the overlay, 
     *                             "string" - show the message passed as the string
     *                             default - just toggle it.
     * @return {[type]}
     */
    var toggleLoader = function(param){
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

    };

    /**
     * Getters for the help status from localStorage
     * @method getHelpStatus
     */
    var getHelpStatus = function(){
        var helpStatus = window.localStorage.getItem("helpStatus");
        helpStatus = helpStatus ? JSON.parse(helpStatus) : {};
        return helpStatus;
    };

    /**
     * Setters for the help status into localStorage
     * @method getHelpStatus
     */
    var setHelpStatus = function(helpStatus){
        window.localStorage.setItem("helpStatus",JSON.stringify(helpStatus));
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
                    toggleLoader();
                    $(".logo").show();
                    this.drawHome();
                }else{
                    $(".userForm .message").html("<span class='error'>Incorrect username/password</span>");
                    toggleLoader();
                }
            }.bind(this));
        }else{
             $(".userForm .message").html(app.config.APP_MESSAGES["VALID_USERNAME_PASSWORD"]);
             toggleLoader();
        }
    };
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
                        "password" : pass
                    },function(u){
                        DataOp.sendMail({
                            "to" : email,
                            "subject" : app.config.APP_MESSAGES["REGISTER_SUCCESS_SUBJECT"],
                            "body" : app.config.APP_MESSAGES["REGISTER_SUCCESS_BODY"],
                            "from" : "team@voyageapp.in",
                            "fromname" : "Team Voyage"
                        });
                        toggleLoader("Successfully registered; Redirecting..");
                        setTimeout(function(){
                            app.user = u;
                            app.user.themes = app.user.themes || [];
                            window.localStorage.setItem("user",JSON.stringify(app.user));
                            $(".userForm").hide();
                            toggleLoader();
                            $(".logo").show();
                            this.drawHome();
                        }.bind(this),1500);
                    }.bind(this));
                }else{
                    //The case when the user is already registered.
                    $(".userForm .message").html(app.config.APP_MESSAGES["ID_ALREADY_REGISTERED"]);
                    toggleLoader();
                }
            }.bind(this));
        }else{
            if(pass.length<6){
                $(".userForm .message").html(app.config.APP_MESSAGES["INVALID_PASSWORD"]);    
            }else{
                $(".userForm .message").html(app.config.APP_MESSAGES["VALID_USERNAME_PASSWORD"]);    
            }
            toggleLoader();
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

    var getPostItemLayout = function(post, postsPos, isSavedPage){
        var html="";
        var isInProgress = isSavedPage ? true : app.savedArticles && Object.keys(app.savedArticles).indexOf(post._id)>-1;
        html += "<div class='post "+ (isSavedPage ? "saved" : "") +(isInProgress ? " inProgress" : "")+"' data-pos='"+postsPos+"' data-id='"+post._id+"'>";
        html += "<div class='title'>"+post.title+"</div>";
        var src = post.feedSource;
        html += "<div class='metainfoWrapper'>";
        //Trying to fetch source link from guid.
        src = /(http(s)*:\/\/)*(www\.)*(.*?)\//.exec(src);
        src = (src && src.length > 1 ? src[src.length-1] : "");
        if(src.indexOf("proxy")==-1){
            html += "<div class='metainfo source'>"+src+"</div>";
        }

        html += "<div class='metainfo themeName'>"+post.categories+"&nbsp;</div>";
        if(isInProgress){
            var savedPost = app.savedArticles[post._id];
            html += "<div class='metainfo progress'>"+savedPost.readingPos+"/"+savedPost.totalPages+"</div> ";
        }   
        html += "</div>";
        if(post.image && post.image.url){
            //console.log(JSON.stringify(post.image));
            html += "<div class='image' style='background-image:url(\""+post.image.url+"\")'></div>";
        }
        html += "<div class='summary'   >"+ ( post.description.replace(/<\/?[^>]+(>|$)/g,"").substring(0,150).match(/[^]*\s/).toString())+"..</div>";
        html += "</div>";
        return html;
    };

    /**
     * Will update the loadmore button with the right data which will trigger the next set of data
     * loadmore button will have data-ct set to the position in TIMESTAMP array present in config. For. e.g if the second set
     * of data is to be loaded then it is set to 2.
     * @method updatePosts
     */
    var bumpUpLoadMore = function(){
        var cont = $("._wrapper .posts");
        var el = $(".loadmore",cont);
        var ct = parseInt(el.attr("data-ct"));
        ct++;
        if(ct>=app.config.TIMESTAMPS.length){
            el.remove();
        }else{
            el.attr("data-ct",ct);
        }
    };



    var obj = {

        /**
         * A public function to remove the loader. 
         * @method hideLoader
         */
        hideLoader : function(){
            $(".loaderOverlay").hide();
        },
        
        /**
         * The initial login screen which allows for a new user to register and existing user to login.
         * @method drawLogin
         */
        drawLogin : function(){
            manageViews({
                type : "userForm"
            }); 
            $(".userForm .btn1").gwClick(function(el){
                toggleLoader();
                if(el.hasClass("login")){
                    login.call(this);
                }else if(el.hasClass("register")){
                    register.call(this);
                }
            }.bind(this),{
                "data-timeout" : 100
            });
            //If user forgets the password
            $(".userForm .forgotPass").gwClick(function(el){
                $(".userForm").addClass("forgot");
                $(".loginMsg").html(app.config.APP_MESSAGES["FORGOT_MSG"]);
                $("input.email").attr("placeholder","Your email");
                $(".userForm .message").html("We will send you a temporary password on your email id");
            },{
                "data-timeout" : 50
            });
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
            // Sending the temporary password to the user.
            $(".btn.sendTemp").gwClick(function(el){
                var val = $("input.email").val();
                if(val && val.length){
                    toggleLoader();
                    //Any random password would do.
                    var pass = "VYG_"+parseInt(Math.random()*1000);
                    DataOp.sendMail({
                        "to" : val,
                        "subject" : app.config.APP_MESSAGES["FORGOT_PASS_SUBJECT"],
                        "body" : app.config.APP_MESSAGES["FORGOT_PASS_BODY"].replace("{{TEMP_PASSWORD}}",pass),
                        "fromname" : "Support Voyage"
                    });
                    DataOp.savePassword(md5(pass),function(){
                        toggleLoader();
                        $(".userForm .message").html("Temporary password sent to your email. Please change once logged in. If you didn't receive it, please send a mail to support@voyageapp.in with your registered email id and we will check it out. <div class='backtologin'>Back to login</div>");
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
        },

        /**
         * It doesnt really renders the main view but a wrapper to draw home.
         * @method drawHome
         */
        drawHome : function(){
            //If its the first time user draw an overlay which tells user about different parts of the app.
            var helpStatus = getHelpStatus();
            if(!helpStatus["firstLaunchHelp"]){
                helpStatus["firstLaunchHelp"] = true;
                setHelpStatus(helpStatus);
                $("._wrapper .logo").addClass("firstLaunch");
                $("._wrapper .logo .btn").gwClick(function(el){
                    el.hide();
                    $("._wrapper .logo img").show();
                });
            }
            if(app.user.themes.length){
                    var fn = function(d){
                        var checkL = setInterval(function(){
                            //It waits for the logo overlay which will be there if this 
                            //is the first time use of app and it shows up the help overlay.
                            if(!$("._wrapper .logo").is(":visible") || $("._wrapper .logo img").is(":visible")){
                                //if logo is there and loader is displayed
                                clearInterval(checkL);
                                $("._wrapper .logo").hide();
                                $("._wrapper .posts").empty();
                                this.drawPosts.call(this,d,"home","home");    
                            }
                        }.bind(this),500);
                    };
                    if(app.allPosts){
                        fn.call(this,app.allPosts);
                    }else{
                        DataOp.getUserPosts(app.config.TIMESTAMPS[0],fn.bind(this));    
                    }    
                    
            }else{
                //If themes are not selected yet; draw the themes page asking user to select some themes.
                var checkL = setInterval(function(){
                    //It waits for the logo overlay which will be there if this 
                    //is the first time use of app and it shows up the help overlay.
                    if(!$("._wrapper .logo").is(":visible") || $("._wrapper .logo img").is(":visible")){
                        $("._wrapper .logo").hide();
                        clearInterval(checkL);
                        toggleLoader();
                        this.drawThemes();  
                    }
                }.bind(this),1000);
            }
            assignEvents();
        },

        /**
         * The profile page of the user. 
         * Pretty simple right now.
         * @method drawProfile
         */
        drawProfile : function(){
            $(".userProfile .changePass").html("CHANGE PASSWORD");
            $(".userProfile input.password").val("").hide();
            $("._wrapper .userProfile .email").html(app.user.email);
            manageViews({
                "type" : "profile"
            });
        },

        /**
         * Draws an individual post.
         * @method drawPost
         * @param  {object} post The individual post object.
         */
        drawPost : function(post){
            //Get the help overlay object
            var helpStatus = getHelpStatus();
            if(!helpStatus["ARTICLE"]){
                //Show the first time help overlay of article
                $(".imgHelpOverlay").addClass("show").css("background-image","url('img/help_overlay/article.png')");
                helpStatus["ARTICLE"] = true;
                setHelpStatus(helpStatus);
            }
            var html = "";
            html += "<div class='postFullCont'>";
            //Title
            html += "<div class='title'>"+post.title+"</div>";
            //Publish date
            html += "<div class='date'>"+new Date(new Date(post.pubdate).toISOString().substring(0,10)).toDateString()+"</div>";
            //Author
            html += "<div class='author'>"+ (post.author || post.item_author || "") +"</div>";
            //Image of article
            if(post.image && post.image.url){
                html += "<div class='image' data-src='"+post.image.url+"' style='background-image:url(\""+post.image.url+"\");'></div>";
            }
            //Description. Removing any strong tags since it is resulting in cutting of text on the edges
            html += "<div class='content'>"+(post.description.replace(/\<\/*strong\>/g,""))+"</div>";
            html += "</div>";

            $("._wrapper .postFull").html(html);
            //Will we really have an image inside anchor?
            $(".postFull a img").remove();
            $.when(manageViews({
                "type" : "post"
            })).then(function(){
                var totImg = $(".postFullCont img"), imgLoadCt = 0;
                var imgloaded = function(){
                    imgLoadCt++;
                    if(true){
                        setup=true;
                        //Calculating the height of one page. It will be the height which is a perfect multiple of 25 and less the window height minus toolbar.
                        var toLeave = (window.innerHeight-50)%25+50;
                        $(".postFull").height(window.innerHeight - toLeave).css("margin-top","50px");
                        //The number of pages will be the total height rendered divided by calculated height of one page.
                        var pages = Math.ceil($(".postFullCont").height()/(window.innerHeight-toLeave));
                        //Setting the progress element.
                        $("#header .progress").html("<span class='pos'>1</span>/<span class='total'>"+pages+"</span>").show();

                        //Check if the post is bookmarked
                        if(app.savedArticles){
                            if(Object.keys(app.savedArticles).indexOf(post._id)>-1){
                                $("#header .save").addClass("saved");
                                var pos = app.savedArticles[post._id]["readingPos"];
                                snapArticle(pos);
                            }else{
                                $("#header .save").removeClass("saved");
                            }
                        }
                        //The last step is to enable the snapping across pages.
                        enableArticleSnap($('.postFull'),function(pos){
                            //The callback function called on swipe which will keep updating the progress if its a saved article
                            if($("#header .save").hasClass('saved')){
                                post.readingPos = pos;
                                post.totalPages = pages;
                                DataOp.saveArticle(post,true);
                            }
                        });
                    }
                };
                if(totImg.length){
                    setTimeout(function(){
                        //Wrapping each image with a container which has a message.
                        $(".postFullCont img").wrap("<div/>").parent().append("<p class='imgMsg'>"+app.config.APP_MESSAGES.OPEN_IN_BROWSER_MSG+"</p>").addClass("imageCont");
                        imgloaded();
                    },300);
                }else{
                    imgloaded();
                }
            }.bind(this));
            $("#header .save").gwClick(function(el){
                //When the bookmark button is clicked.
                if(el.hasClass("saved")){
                    DataOp.unsaveArticle(post);
                    el.removeClass("saved");
                }else{
                    post.readingPos = parseInt($('#header .progress .pos').text());
                    post.totalPages = parseInt($('#header .progress .total').text());
                    DataOp.saveArticle(post);
                    el.addClass("saved");
                }
            },{
                "data-active" : "active",
                "data-timeout" : 500,
                "useClick" : true
            });
            //Using the apache cordova social share plugin to enable share on article.
            $("#header .share").gwClick(function(el){
                var message = {
                    text: post.title,
                    url  : (post.orignalUrl || post.item_channelLink)
                };
                window.socialmessage.send(message);
            },{
                "data-active" : "active",
                "data-timeout" : 500,
                "useClick" : true
            });
            // All links inside article will be opened in external browser.
            $(".postFullCont .content a").on("click",function(ev){
                var el = $(ev.currentTarget);
                el.css("opacity","0.6");
                setTimeout(function(){
                    el.css("opacity","1");
                },1500);
                ev.preventDefault();
                //setting target to _system makes it work almost everywhere.
                window.open(el.attr("href"), '_system');
            });
            //All images to opened in external browser.
            $(".postFullCont .content img,.postFullCont .image").on("click",function(ev){
                var el = $(ev.currentTarget);
                el.css("opacity","0.6");
                setTimeout(function(){
                    el.css("opacity","1");
                },1500);
                ev.preventDefault();
                var url = el.attr("src") || el.attr("data-src")
                window.open(url, '_system');
            });
        },



        /**
         * Draws the list of articles.
         * @method drawPosts
         * @param  {array}  posts - The articles json.
         * @param  {[type]}  name - **** The name of the page (not using it;should remove)
         * @param  {[type]}  type -  type of the page (saved articles/home)
         */
        drawPosts : function(posts,name,type){
                var cont = $("._wrapper .posts"),html= "",postsPos=0, timestampPos=0, timestampTimer=0;
                app.state = app.state || {};
                
                if(type !== "saved"){
                    //If not the saved articles page.
                    timestampPos=parseInt($(".loadmore",cont).attr("data-ct")) || 0;
                    postsPos=parseInt($(".loadmore",cont).attr("data-postpos")) || 0;
                    if(postsPos == 0){
                        html += "<div class='timestamp current'>"+app.config.TIMESTAMPS[timestampPos].title+"&nbsp;("+posts.length+")</div>"; 
                    }
                    html += "<div class='timestamp'>"+app.config.TIMESTAMPS[timestampPos].title+"&nbsp;("+posts.length+")</div>"; 
                    //Getting the filtered post based on date
                }else{
                    //If its the saved articles page.
                    cont.empty();
                    app.state["scrollPos"] = 0;
                }
                if(posts.length){
                    $.each(posts,function(i,post){
                        if(post.description.length>1500){
                            html += getPostItemLayout(post,postsPos,type === "saved");
                        }
                        postsPos++;
                    });
                }else{
                    html += "<div class='post empty'>";
                    html += "<div class='title'>Nothing here!.</div>";
                    html += "<div class='summary'>Go ahead, read some posts and click the bookmark icon to save it for reading later.</div>";
                    html += "</div>";
                }
                cont.append(html);
                if(type !== "saved"){
                    if(!$(".loadmore",cont).length){
                        //This is essentialy the case when its rendering the articles first time.
                        cont.append("<div class='loadmore' data-ct='1' data-postpos='"+postsPos+"'>LOAD MORE</div>");
                        //When user clicks the loadmore button.
                        $(".loadmore",cont).gwClick(function(el){
                            el.removeClass("error").addClass("loading");
                            var pos = parseInt(el.attr("data-ct"));
                            DataOp.getUserPosts(app.config.TIMESTAMPS[pos],function(d){
                                this.drawPosts(d,"home","home");
                            }.bind(this));                
                        }.bind(this),{"data-timeout":100});
                        
                        //Over here we show the correct timestamp
                        cont.unbind("touchmove").on("touchmove",function(){
                            if(timestampTimer){
                                clearTimeout(timestampTimer);
                            }
                            timestampTimer = setTimeout(function(){
                                $.each($(".timestamp:not(.current)"),function(l,el){
                                    if(el.getBoundingClientRect().top < 44){
                                        $(".timestamp.current").html($(el).html());
                                    }
                                });
                            },400);
                        });
                    }else{
                        bumpUpLoadMore(); 
                        $(".loadmore",cont).removeClass("loading").appendTo(cont).attr('data-postpos',postsPos);
                    }
                }
                $.when(manageViews({
                    type : type,
                    name : name
                })).then(function(){
                    $(".post:not(.empty)",cont).unbind("click").on("click",function(ev){
                        $(".posts").fadeOut();
                        var postData = app.allPosts[$(ev.currentTarget).attr("data-pos")];
                        this.drawPost(postData);
                    }.bind(this));
                }.bind(this));
                
        },
        /**
         * Drawing the themes.
         * @method drawThemes
         */
        drawThemes : function(){
            var themes = $.extend(true,[],app.config["THEMES"]);
            $.each(themes,function(i,v){
                if(app.user.themes.indexOf(v.category_title)>-1){
                    v.isChoosen = true;
                }
            });
            var html = " <div class='done'> Select atleast three themes you find interesting</div>";
            html += "<div class='themesC' style='height:"+(window.innerHeight-124)+"px;'>"
            $.each(themes,function(i,theme){
                html += "<div class='theme' data-id='"+theme.cid+"'><div class='title "+(theme.isChoosen ? "selected" : "")+"'><span>"+theme.category_title+"</span></div> <div class='descr'>"+(theme.category_desc || "")+"</div></div>";
            });
            html += "</div>"
            $("._wrapper .themes").html(html);
            manageViews({
                type:"themes",
                name : "themes"
            });
            var orginalThemes = $(".theme .title.selected").map(function(){return $(this).text();}).toArray();
            $("._wrapper .theme .title").gwClick(function(el){
                el.toggleClass("selected");
                var themes = $(".theme .title.selected").map(function(){return $(this).text();}).toArray();
                if(themes.length>=3 && orginalThemes.sort().join() != themes.sort().join()){
                    //Only show the button once three themes are selected.
                    $('._wrapper .done').addClass("btn").html("PREPARE HOME");
                }else{
                    $('._wrapper .done').removeClass("btn").html(" Select atleast three themes you find interesting")
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
                        toggleLoader(); 
                        DataOp.updateUserThemes(themes,function(){
                            app.user.themes = themes;
                            window.localStorage.setItem("user",JSON.stringify(app.user));
                            app.allPosts = null;    
                            this.drawHome();
                        }.bind(this));
                    }
                }
            }.bind(this),{
                "data-timeout" : 1
            });
        },
    };
    return obj;
})();
app.initialize();