(function(){
var customClickTouchStartEventList = "touchstart.customClick MSPointerDown.customClick pointerdown.customClick";
var customClickTouchEndEventList = "touchend.customClick MSPointerUp.customClick pointerup.customClick";
var customClickActiveGrpAttr =  "data-activegrp";
var customClickActiveAttr =  "data-active";
var customClickTimeoutAttr =  "data-timeout";
/**
 * Custom click plugin that solves two issues
 * 1. Remove the 300ms delay present for click event in touch devices.
 * 2. Provide indicators on every click.
 * @method customClick
 * @param  {Function}  callback [description]
 * @param  {object}    options  [description]
 */
$.fn.gwClick = function(callback,options){
    options = options || {};
    var touchEndTimer=0,startPosX=0,startPosY=0, marginX = (options.marginX || 2), marginY = (options.marginY || 2) ;
    var eventTrigger = function(ev){
        var tapEl = $(ev.currentTarget);
        var activeGroup = options[customClickActiveGrpAttr] || tapEl.attr(customClickActiveGrpAttr), timeout;
        try{
            timeout = parseInt(options[customClickTimeoutAttr]) || parseInt(tapEl.attr(customClickTimeoutAttr)) || 2000;
        }catch(err){
            timeout = 2000;
        }
        if(activeGroup){
            $('['+customClickActiveGrpAttr+'='+activeGroup+']').removeClass(activeGroup);
            tapEl.addClass(activeGroup);
        }
        else{
            var activeClass = options[customClickActiveAttr] || tapEl.attr(customClickActiveAttr);
            if(activeClass){
                tapEl.addClass(activeClass);
            }else{
                tapEl.css({ opacity: 0.3 });    
            }
            setTimeout(function(){
                if(activeClass){
                    tapEl.removeClass(activeClass);
                }else{
                    tapEl.css({ opacity: 1});
                }
            },timeout);
        }
        if(callback){
            callback(tapEl,ev);
        }
        else if(tapEl.attr("data-href")){
            Gwf.navigate(tapEl.attr("data-href"));
        }
    };
    var handleTouchstart = function(ev){
        var touchobj = ev.originalEvent.changedTouches[0];
        startPosX = touchobj.pageX;
        startPosY = touchobj.pageY;
    };
    var handleTouchend = function(ev){
        ev.stopPropagation();
        if(touchEndTimer){
            clearTimeout(touchEndTimer);
        }
        touchEndTimer = setTimeout(function(){
            var touchobj = ev.originalEvent.changedTouches[0];
            if(Math.abs(touchobj.pageX-startPosX)<marginX ? (Math.abs(touchobj.pageY-startPosY)<marginY?true:false):false){
                eventTrigger(ev);
            }else if(Math.abs(touchobj.pageY-startPosY)>marginY){
    
                callback( (touchobj.pageY-startPosY)>0 ? "down" : "up" , ev);
            }else if(Math.abs(touchobj.pageX-startPosX)>marginX){
    
                callback( (touchobj.pageX-startPosX)>0 ? "right" : "left" , ev);
            }
        },10);
    };
    var handleClick= function(ev){
        ev.stopPropagation();
        eventTrigger(ev);
    };
    if( (('ontouchstart' in window) || (navigator.msMaxTouchPoints > 0)) && !options.useClick){
        $(this).unbind(customClickTouchStartEventList).on(customClickTouchStartEventList, options.filter || null,handleTouchstart)
               .unbind(customClickTouchEndEventList).on(customClickTouchEndEventList, options.filter || null,handleTouchend);
    }
    else{
        $(this).unbind('click.customClick').on('click.customClick',options.filter || null,handleClick);
    }
    
};
})();



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

    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        ///window.onload = function(){
         //   this.onDeviceReady();
        //}.bind(this);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },

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

    startFlow : function(){
        var connection = Util.checkConnection();
        if(connection.isOn){
            app.user = window.localStorage.getItem("user");
            app.savedArticles = window.localStorage.getItem("articles");
            app.savedArticles = app.savedArticles ? JSON.parse(app.savedArticles) : {};
            DataOp.updateSavedPosts();
            app.preloadIcons(function(){
                if(app.user){
                    app.user = JSON.parse(app.user);
                    UIRender.drawHome();    
                }else{
                    UIRender.drawLogin();
                }
            });
        }else{
            try{
                var r = confirm("Looks like your network is down. Please check and click ok to retry.");
                if(r){
                    setTimeout(function(){
                        app.startFlow();    
                    },2000);
                }
            }
            catch(err){
                alert(err);
            }
        }
    },
   

    // Update DOM on a Received Event
    receivedEvent: function(id) {
        app.startFlow();
    }
};


var Util = (function(){
    var obj = {

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

var DataOp = (function(){
    var allThemesUrl = "http://app.genwi.com/5.0/getjson/skeleton/43443";
    var allThemesPostsUrl = "http://app.genwi.com/5.0/getjson/jsonObject/43443";
    var baseThemeUrl = "http://app.genwi.com/5.0/getjson/articles/43443/";
    var mongodbkey = "Xh9SI49zvHqiW6Ma5KaQQsHcIuhu0l2G";
    var usersCollection = "https://api.mongolab.com/api/1/databases/longreads/collections/users/";
    var userPosts;
    var themesData;
    var postLength = {};


    var loadURL = function(params,dontShowError,dontTimeout){
        var options = { 
            url: params.u,
            data: params.d || null,
            type: params.t || "POST",
            contentType : params.contentType
        };
        if(!dontTimeout){
            options["timeout"] = 8000;
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

    var runMongoQuery = function(params,dontShowError,dontTimeout){
        params.u = params.u + (params.u.indexOf("?") >-1 ? "&" : "?") + "apiKey="+mongodbkey;
        params.contentType = "application/json";
        loadURL(params,dontShowError,dontTimeout);
    };

    var obj = {

        userPosts : null,
        themesData : null,

        logout : function(c){
            var r = confirm("Are you sure, you want to logout?");
            if(r){
                window.localStorage.removeItem("user");
                window.localStorage.removeItem("articles");
                app.user = null;
                this.themesData = null;
                this.userPosts = null;
                app.savedArticles = {};
                c(r);
            }else{
                c();
            }
        },

        sendMail : function(params){
            $.ajax( { 
                url: "https://api.sendgrid.com/api/mail.send.json",
                data: "api_user=agaase&api_key=Bcda1234&to="+(params.to)+"&toname="+(params.toname||"")+"&subject="+(params.subject || "")+"&html="+(encodeURIComponent(params.body) || "")+"&from="+(params.from || "support@voyage.com")+"&fromname="+(params.fromname || ""),
                type: "POST"
            }).done(function(){
            });
        },
        
        savePassword : function(pass,c,id){
            runMongoQuery({
                "u" : usersCollection+(id || app.user._id),
                "t" : "PUT",
                "d" : JSON.stringify( {"$set":{ "password" : pass } }),
                "c" : c
            });
        },

        unsaveArticle : function(postData){
            $("#header .back").addClass("refresh");
            app.state = app.state || {};
            app.state["postId"] = postData.item_id;
            app.state["progress"] = 0;
            delete app.savedArticles[postData.item_id];
            window.localStorage.setItem("articles",JSON.stringify(app.savedArticles));
        },
        saveArticle : function(postData,auto){
            
            $("#header .back").addClass("refresh");
            app.state = app.state || {};
            app.state["postId"] = postData.item_id;
            app.state["progress"] = postData.readingPos+"/"+postData.totalPages;
            app.savedArticles[postData.item_id] = postData;
            if(this.persistTimeout){
                clearTimeout(this.persistTimeout);
            }
            this.persistTimeout = setTimeout(function(){
                window.localStorage.setItem("articles",JSON.stringify(app.savedArticles));
            },2000);
        },

        getUser : function(id,c){
             runMongoQuery({
                            "u" : usersCollection+id,
                            "t" : "GET",
                            "c" : function(user){
                                c(user);
                            }
                },true);
        },

        addUser: function(user,c){
            runMongoQuery({
                "u" : usersCollection,
                "t" : "POST",
                "d" : JSON.stringify(user),
                "c" : function(user){
                    c(user);
                }
            });
        },

        getThemes : function(c){
            if(this.themesData){
                c(this.themesData);
            }else{
                loadURL({
                    u : allThemesUrl,
                    t : "GET",
                    c : function(data){
                        data = data.filter(function(o){
                            return o.category_title != "Most Recent";
                        });
                        if(app.user){
                            if(app.user.themes){
                                $.each(data,function(i,theme){
                                    if(app.user.themes.indexOf(theme.category_title) >-1 ){
                                        theme.isChoosen = true;
                                    }
                                });         
                            }
                        }
                        this.themesData = data;
                        c(this.themesData);
                    }.bind(this)
                });
            }
        },


        getPostLength : function(theme){
            if(postLength[theme]){
                return postLength[theme];
            }else{
                $.each(DataOp.themesData,function(i,v){
                    if(v.category_title == theme){
                        try{
                            l = parseInt(v.PostLength) || 1500;
                        }catch(err){
                            l = 1500;
                        }
                        return;
                    }
                });
                postLength[theme] = l;
                return l;
            }
        },

        getUserPosts : function(themes,c){
            if(this.userPosts){
                c(this.userPosts);
            }else{
                var allPosts = [], ct = 0, total = themes.length;
                $.each(themes,function(i,th){
                    //u : 'https://api.mongolab.com/api/1/databases/voyagefeeds/collections/feeditems?apiKey=Xh9SI49zvHqiW6Ma5KaQQsHcIuhu0l2G&q={"categories":"'+th+'"}&l=10',
                    loadURL({
                        u : "http://app.genwi.com/5.0/getjson/articles/43443/"+th+"/0/"+(total > 3 ? "10" : "20"),
                        t : "GET",
                        c : function(resp){
                                $.merge(allPosts,resp);
                                ct++;
                                if(ct == total){
                                    this.userPosts = allPosts.sort(function(a,b){
                                        return (new Date(b.item_pubDate) - new Date(a.item_pubDate));
                                    });
                                    c(this.userPosts);
                                    //this.getAllUserPosts(themes);
                                }
                            }.bind(this)
                    });
                }.bind(this));
            }
        },

        getAllUserPosts : function(themes){
            var allPosts = [], ct = 0, total = themes.length;
            $.each(themes,function(i,th){
                loadURL({
                    u : "http://app.genwi.com/5.0/getjson/articles/43443/"+th+"/0/100",
                    t : "GET",
                    c : function(resp){
                            $.merge(allPosts,resp);
                            ct++;
                            if(ct == total){
                                debugger;
                                this.allUserPosts = allPosts.sort(function(a,b){
                                    return (new Date(b.item_pubDate) - new Date(a.item_pubDate));
                                });
                            }
                        }.bind(this)
                },true,true);
            }.bind(this));
        },

        getPosts : function(theme,c){
            loadURL({
                u : baseThemeUrl+theme+"/0/100",
                c :  function (data) {
                    c(data);
                },
                t : "GET"
            });
        },
        /**
         * This will shuffle the posts making sure posts from same category dont repeat after max 3 articles.
         * @method shufflePosts
         * @param  {array}     posts Original posts
         * @param  {[type]}     pos   
         * @return {[type]}
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
                if(themePostCount[post.category_title]<bucketLimit){
                    if(i != pos){
                        posts.splice(i,1);
                        posts.splice(pos,0,post);
                    }
                    themePostCount[post.category_title]++;
                    if(themePostCount[post.category_title]==bucketLimit){
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

        updateUserThemes : function(t,c){
            runMongoQuery({
                "u" : usersCollection+app.user._id,
                "t" : "PUT",
                "d" : JSON.stringify( {"$set":{ "themes" : t } }),
                "c" : c
            });
        },
        updateSavedPosts : function(c){
            if(Object.keys(app.savedArticles).length){
                runMongoQuery({
                    "u" : usersCollection+app.user._id,
                    "t" : "PUT",
                    "d" : JSON.stringify( {"$set":{ "savedPosts" : app.savedArticles } }),
                    "c" : c
                },true);
            }
        }
    };
    return obj;
})();


var UIRender = (function(){

    var HARDCODED_FEED_URLS = {
        "Help Yourself" : [{ "http://feedproxy.google.com/~r/The99Percent" : "99U.com"}]
    };
    var currentView,viewStack=[];

    var APP_MESSAGES = {
        "REGISTER_SUCCESS_SUBJECT" : "Welcome to VOYAGE",

        "REGISTER_SUCCESS_BODY" : "<body style='margin:0;font-family:sans-serif;'>  <a href='http://www.voyageapp.in' style='display: block; text-decoration: none;background-color:#1CB9B8;color:#fff;margin:0;padding:10px 0;text-align:center;margin-bottom:20px;font-size:150%;'> VOYAGE </a><div style='padding:15px;'><div style='margin-bottom:20px;'> Welcome to <a href='http://www.voyageapp.in' style='color:#1CB9B8;text-decoration: underline;'>Voyage</a></div>   <div style='margin-bottom:20px;'>Voyage believes in providing content which helps you know the big picture and the finer details.</div>  <ul>    <li style='margin-bottom:10px;'> Not news but articles which tell you facts mixed with the right amount of opinion and research that will get your grey cells racing.</li>       <li style='margin-bottom:10px;'> We help you read one page at a time, soak it all in and if not now, then you can always bookmark the page to come back and finish later.    </li>  </ul>  <div>    We would love your feedback. Please hit reply to this mail if you want to contribute in any way to our platform.    <br><br>    Cheers!<br>    <a href='http://www.voyageapp.in' style='color:#1CB9B8;text-decoration: underline;'>Team Voyage</a>  </div></div></body>",
        "FORGOT_PASS_SUBJECT" : "Your temporary password for VOYAGE",
        "FORGOT_PASS_BODY" : "<body style='margin:0;font-family:sans-serif;'>  <a href='http://www.voyageapp.in' style='display: block; text-decoration: none;background-color:#1CB9B8;color:#fff;margin:0;padding:10px 0;text-align:center;margin-bottom:20px;font-size:150%;'> VOYAGE </a><div style='padding:15px;'><div style='margin-bottom:20px;'> Welcome to <a href='http://www.voyageapp.in' style='color:#1CB9B8;text-decoration: underline;'>Voyage</a> </div>  <div style='margin-bottom:20px;'>Here is your temporary password.</div>  {{TEMP_PASSWORD}}  <div style='margin:20px 0;'>Please change the password once you login to the app.</div>  <div>    If you still are facing any problems with signing in, please get back at support@voyageapp.in with your registerd email id and we will get back to you ASAP.    <br><br>    Cheers!<br>     <a href='http://www.voyageapp.in' style='color:#1CB9B8;text-decoration: underline;'>Team Voyage</a>  </div></div></body>",
        "OPEN_IN_BROWSER_MSG" : "Click on image to open in browser",
        "VALID_USERNAME_PASSWORD" : "<span class='error'>Please enter valid username & password.</span>",
        "INVALID_PASSWORD" : "<span class='error'>Password needs to be atleast 6 characters.</span>",
        "LOGIN_MSG" : "Click login if you already have an email id setup",
        "REGISTER_MSG" : "Click register if you are a new user",
        "FORGOT_MSG" : "Enter the email you signed up with",
        "INVALID_EMAIL" : "<span class='error'>Please enter valid email.</span>",
        "ID_ALREADY_REGISTERED" : "<span class='error'>Id already registered</span>"
    }; 


    var toggleLockContainer = function(el){
        if(el.hasClass("locked")){
            el.unbind("touchmove.lock touchend.lock").removeClass("locked");
        }else{
            el.on("touchmove.lock touchend.lock",function(ev){
                ev.preventDefault();
            }).addClass("locked");
        }
    };

    var enableSnap = function(el,c){
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


            $(".postFullCont").css({"webkit-transform":"translateY("+y+"px)","webkit-transition-duration":""+Math.abs(diff)*3+"ms"});    
            setTimeout(function(){
                moving=false;
            },Math.abs(diff)*5);
            console.log((touchobj.pageY-startPosY));
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

    var snapArticle = function(pos){
        $("#header .progress .pos").html(pos);    
        $(".postFullCont").css({"webkit-transform":"translateY(-"+$(".postFull").height()*(pos-1)+"px)","webkit-transition-duration":"400ms"});
    };

    var assignEvents = function(){
        $("#header .menu").gwClick(function(el){
            toggleSections(el);
        },{
            "data-activegrp" : "dummy",
            "useClick" : true
        });
        $("._wrapper .back").gwClick(function(el){
            if(el.hasClass("refresh")){
                $.when(manageViews("back")).then(function(type){
                    UIRender.updatePosts();
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
        document.addEventListener("backbutton", function(){
            if($("#header").hasClass("post_context")){
                var el = $("._wrapper .back");

                if(el.hasClass("refresh")){
                    $.when(manageViews("back")).then(function(type){
                        UIRender.updatePosts();
                    });
                }else{
                    manageViews("back");
                }
            }
        }, false);
        $(".sections .link").gwClick(function(el){
            if(el.hasClass("allthemes")){
                UIRender.drawThemes();
            }else if(el.hasClass("home")){
                UIRender.drawHome();
            }else if(el.hasClass("saved")){
                $("._wrapper .posts").empty();
                UIRender.drawPosts(app.savedArticles,"Saved Articles","saved");    
            }else if(el.hasClass("profile")){
                UIRender.drawProfile();
            }
        });
        $(".loaderOverlay").on("touchstart touchmove",function(ev){
            ev.preventDefault();
        }); 

        $(".imgHelpOverlay").on("touchstart touchmove",function(ev){
            $(ev.currentTarget).removeClass("show").css("background-image","");
        }); 
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
                    $(".userProfile .message").html(APP_MESSAGES["INVALID_PASSWORD"]);
                }
            }else{
                $(".userProfile input.password").show();
                el.html("SAVE");
            }
        },{
            "data-timeout" : 200
        });
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
    var manageViews = function(view){
        var def = $.Deferred();
        var cont = $("._wrapper");
        if(view == "back"){
            view = viewStack.pop();
        }
        var toShow;

        if(view.type){
            if($(".sections").is(":visible")){
                toggleSections();
            }
            $("#header .menu").removeClass("open");

            $("#header",cont).removeClass().addClass(view.type + "_context");
            if(!app.user || !app.user.themes || !app.user.themes.length) {
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
            $("#header .save").removeClass("autoff");
            app.state = app.state = {};
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
     * This will categorise the posts based on the date.
     * @method getDateCategorisedPosts
     * @param  {array}        posts All the posts
     * @param  {Boolean}      isOld true if its not being rendered the first time
     * @return {array}
     */
    var getDateCategorisedPosts = function(posts,isOld){
        var cPosts = isOld ? {"Last 2 weeks" : [],"Last Month" : []} : {"Last Week":[]} , groups = 0;
        $.each(posts,function(i,post){
            if(!isOld && (new Date() - new Date(post.item_pubDate))<=(1000 * 60 * 60 * 24 * 7)){
                cPosts["Last Week"].push(post);
            }else if(isOld && (new Date() - new Date(post.item_pubDate))>(1000 * 60 * 60 * 24 * 7) && (new Date() - new Date(post.item_pubDate))<=(1000 * 60 * 60 * 24 * 14)){
                cPosts["Last 2 weeks"].push(post);
            }else if(isOld && (new Date() - new Date(post.item_pubDate))>(1000 * 60 * 60 * 24 *14) && (new Date() - new Date(post.item_pubDate))<=(1000 * 60 * 60 * 24 *30) ){
                cPosts["Last Month"].push(post);
            }
        });
        $.each(cPosts,function(k,v){
            v = DataOp.shufflePosts(v);
        });
        return cPosts;
    };


    var obj = {

        hideLoader : function(){
            $(".loaderOverlay").hide();
        },

        updatePosts : function(){
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
        },

        login : function(){
            var id = $("input.email").val();
            var pass = md5($("input.password").val());
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
                 $(".userForm .message").html(APP_MESSAGES["VALID_USERNAME_PASSWORD"]);
                 toggleLoader();
            }
        },

        register : function(){
            var email = $("input.email").val();
            var pass = $("input.password").val();
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
                                "subject" : APP_MESSAGES["REGISTER_SUCCESS_SUBJECT"],
                                "body" : APP_MESSAGES["REGISTER_SUCCESS_BODY"],
                                "from" : "team@voyageapp.in",
                                "fromname" : "Team Voyage"
                            });
                            toggleLoader("Successfully registered; Redirecting..");
                            setTimeout(function(){
                                app.user = u;
                                window.localStorage.setItem("user",JSON.stringify(app.user));
                                $(".userForm").hide();
                                toggleLoader();
                                $(".logo").show();
                                this.drawHome();
                            }.bind(this),1500);
                        }.bind(this));
                    }else{
                        $(".userForm .message").html(APP_MESSAGES["ID_ALREADY_REGISTERED"]);
                        toggleLoader();
                    }
                }.bind(this));
            }else{
                if(pass.length<6){
                    $(".userForm .message").html(APP_MESSAGES["INVALID_PASSWORD"]);    
                }else{
                    $(".userForm .message").html(APP_MESSAGES["VALID_USERNAME_PASSWORD"]);    
                }
                toggleLoader();
            }
        },

        drawLogin : function(){
            manageViews({
                type : "userForm"
            }); 
            $(".userForm .btn1").gwClick(function(el){
                toggleLoader();
                if(el.hasClass("login")){
                    this.login();
                }else if(el.hasClass("register")){
                     this.register();
                }
            }.bind(this),{
                "data-timeout" : 100
            });
            $(".userForm .forgotPass").gwClick(function(el){
                $(".userForm").addClass("forgot");
                $(".loginMsg").html(APP_MESSAGES["FORGOT_MSG"]);
                $("input.email").attr("placeholder","Your email");
                $(".userForm .message").html("We will send you a temporary password on your email id");
            },{
                "data-timeout" : 50
            });
            $(".userForm .btn2").gwClick(function(el){
                if(el.hasClass("login")){
                    el.html("Register").removeClass("login").addClass("register");
                    $(".userForm .btn1").removeClass("register").addClass("login").html("LOGIN");
                    $("input.email").attr("placeholder","Your email");
                    $("input.password").attr("placeholder","Your password");
                    $(".loginMsg").html(APP_MESSAGES["REGISTER_MSG"]);
                }else if(el.hasClass("register")){
                    el.html("Login").removeClass("register").addClass("login");
                    $(".userForm .btn1").removeClass("login").addClass("register").html("REGISTER");
                    $("input.email").attr("placeholder","Choose an email");
                    $("input.password").attr("placeholder","Choose a password");
                    $(".loginMsg").html(APP_MESSAGES["LOGIN_MSG"]);
                }
            },{
                "data-timeout" : 50
            });
            $(".btn.sendTemp").gwClick(function(el){
                var val = $("input.email").val();
                if(val && val.length){
                    toggleLoader();
                    var pass = "VYG_"+new Date().getTime();
                    DataOp.sendMail({
                        "to" : val,
                        "subject" : APP_MESSAGES["FORGOT_PASS_SUBJECT"],
                        "body" : APP_MESSAGES["FORGOT_PASS_BODY"].replace("{{TEMP_PASSWORD}}",pass),
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
                    $(".userForm .message").html(APP_MESSAGES["INVALID_EMAIL"]);    
                }
            }.bind(this),{
                "data-timeout" : 50
            });
        },

        drawHome : function(){
            var helpStatus = window.localStorage.getItem("helpStatus");
            helpStatus = helpStatus ? JSON.parse(helpStatus) : {};
            if(!helpStatus["firstLaunchHelp"]){
                helpStatus["firstLaunchHelp"] = true;
                window.localStorage.setItem("helpStatus",JSON.stringify(helpStatus));
                $("._wrapper .logo").addClass("firstLaunch");
                $("._wrapper .logo .btn").gwClick(function(el){
                    el.hide();
                    $("._wrapper .logo img").show();
                });
            }
            if(app.user.themes){
                //If user themes are already selected
                DataOp.getThemes(function(themes){
                    var selThemes = [];
                    $.each(themes,function(i,theme){
                        if(theme.isChoosen){
                            selThemes.push(theme.cid);
                        }
                    });
                    DataOp.getUserPosts(selThemes,function(d){
                        var checkL = setInterval(function(){
                            if(!$("._wrapper .logo").is(":visible") || $("._wrapper .logo img").is(":visible")){
                                //if logo is there and loader is displayed
                                clearInterval(checkL);
                                $("._wrapper .logo").hide();
                                $("._wrapper .posts").empty();
                                this.drawPosts.call(this,d,"home","home");    
                            }
                        }.bind(this),1000);
                    }.bind(this));
                    
                }.bind(this));
            }else{
                var checkL = setInterval(function(){
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

        drawProfile : function(){
            $(".userProfile .changePass").html("CHANGE PASSWORD");
            $(".userProfile input.password").val("").hide();
            $("._wrapper .userProfile .email").html(app.user.email);
            manageViews({
                "type" : "profile"
            });
        },



        drawPost : function(post){
            var helpStatus = window.localStorage.getItem("helpStatus");
            helpStatus = helpStatus ? JSON.parse(helpStatus) : {};
            if(!helpStatus["ARTICLE"]){
                $(".imgHelpOverlay").addClass("show").css("background-image","url('img/help_overlay/article.png')");
                helpStatus["ARTICLE"] = true;
                window.localStorage.setItem("helpStatus",JSON.stringify(helpStatus));
            }
            var html = "";
            html += "<div class='postFullCont'>";
            html += "<div class='title'>"+post.item_title+"</div>";
            html += "<div class='date'>"+new Date(post.item_pubDate).toDateString()+"</div>";
            html += "<div class='author'>"+ (post.author || post.item_author || "") +"</div>";
            if(post.image_url){
                html += "<div class='image' data-src='"+post.image_url+"' style='background-image:url(\""+post.image_url+"\");'></div>";
            }
            html += "<div class='content'>"+(post.item_description.replace(/\<\/*strong\>/g,""))+"</div>";
            html += "</div>";

            $("._wrapper .postFull").html(html);
            $.when(manageViews({
                "type" : "post"
            })).then(function(){
                var totImg = $(".postFullCont img"), imgLoadCt = 0;
                var imgloaded = function(){
                    imgLoadCt++;
                    if(true){
                        setup=true;
                        var toLeave = (window.innerHeight-50)%25+50;
                        $(".postFull").height(window.innerHeight - toLeave).css("margin-top","50px");
                        var pages = Math.ceil($(".postFullCont").height()/(window.innerHeight-toLeave));
                        $("#header .progress").html("<span class='pos'>1</span>/<span class='total'>"+pages+"</span>").show();
                        var saveTimeout;
                        if(app.savedArticles){
                            if(Object.keys(app.savedArticles).indexOf(post.item_id)>-1){
                                $("#header .save").addClass("saved");
                                var pos = app.savedArticles[post.item_id]["readingPos"];
                                snapArticle(pos);
                            }else{
                                $("#header .save").removeClass("saved");
                            }
                        }
                        enableSnap($('.postFull'),function(pos){
                            if($("#header .save").hasClass('saved')){
                                post.readingPos = pos;
                                post.totalPages = pages;
                                DataOp.saveArticle(post,true);
                            }
                        });
                    }
                };
                if(totImg.length){
                    /*
                    $.each(totImg,function(i,v){
                        var url = $(v).attr("data-src");
                        var img = new Image();
                        img.onload = function(){
                            var w = (window.innerWidth-30) < this.width ? (window.innerWidth -30) : this.width;
                            var h = w*(this.height/this.width);
                            h = h - h%25;
                            if(!$(v).hasClass('fixed')){
                                $(v).attr("src",url).height(h).addClass("fixed");
                            }
                            imgloaded();
                        };
                        img.src = url;
                    });
                    */
                    setTimeout(function(){
                        $(".postFullCont img").after("<p class='imgMsg'>"+APP_MESSAGES.OPEN_IN_BROWSER_MSG+"</p>").parent().addClass("imageCont");
                        imgloaded();
                    },300);
                }else{
                    imgloaded();
                }
            }.bind(this));
            $("#header .save").gwClick(function(el){
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
            $("#header .share").gwClick(function(el){
                var message = {
                    text: post.item_title,
                    url  : (post.orignalUrl || post.item_channelLink)
                };
                window.socialmessage.send(message);
            },{
                "data-active" : "active",
                "data-timeout" : 500,
                "useClick" : true
            });

            $(".postFullCont .content a").on("click",function(ev){
                var el = $(ev.currentTarget);
                el.css("opacity","0.6");
                setTimeout(function(){
                    el.css("opacity","1");
                },1500);
                ev.preventDefault();
                window.open(el.attr("href"), '_system');
            });
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

        drawPosts : function(posts,name,type){
                var cont = $("._wrapper .posts"),html= "",postsPos=0, filteredPosts=[], allPosts=[],itemtitles=[];
                app.state = app.state || {};
                if(type !== "saved"){
                    //If not the saved articles page.
                    postsPos=parseInt($(".loadmore",cont).attr("data-pos")) || 0;
                    var oldPosts = false;
                    if(postsPos>0){
                        //If old posts are already there.
                        oldPosts = true;
                        $(".loadmore",cont).remove();
                        app.state["scrollPos"] = 0;
                    }else{
                        //First time rendering the posts.
                        html += "<div class='timestamp current'> Last Week</div>";
                    }
                    //Getting the filtered post based on date
                    filteredPosts = getDateCategorisedPosts(posts.slice(postsPos,posts.length),oldPosts);
                    //Only rendering the new posts
                    allPosts = posts.slice(0,postsPos);
                    $.each(filteredPosts,function(iii,postss){
                        allPosts = $.merge(allPosts,postss);
                    });
                }else{
                    //If its the saved articles page.
                    cont.empty();
                    app.state["scrollPos"] = 0;
                    //Posts will not be filtered
                    $.each(posts,function(k,sPost){
                        filteredPosts.push(sPost);
                    });
                }
                if(type!=="saved"){
                    $.each(filteredPosts,function(g,gPosts){
                        html += "<div class='timestamp'> "+g+"</div>";
                        $.each(gPosts,function(i,post){
                        if(post.item_description.length>DataOp.getPostLength(post.category_title) && itemtitles.indexOf(post.item_title)==-1){
                        //if(itemtitles.indexOf(post.item_title)==-1){
                                itemtitles.push(post.item_title);
                                var isInProgress = app.savedArticles && Object.keys(app.savedArticles).indexOf(post.item_id)>-1;
                                html += "<div class='post "+type+(isInProgress ? " inProgress" : "")+"' data-pos='"+postsPos+"' data-id='"+post.item_id+"'>";
                                html += "<div class='title'>"+post.item_title+"</div>";
                                var src = post.source || post.item_guid;
                                //var hardcodedUrls = HARDCODED_FEED_URLS[post.category_title];
                                //var guids = hardcodedUrls ? Object.keys(hardcodedUrls) : "";
                                html += "<div class='metainfoWrapper'>";
                                //Trying to fetch source link from guid.
                                src = /(http(s)*:\/\/)*(www\.)*(.*?)\//.exec(src);
                                src = (src && src.length > 1 ? src[src.length-1] : "");
                                if(src.indexOf("proxy")==-1){
                                    html += "<div class='metainfo source'>"+src+"</div>";
                                }

                                html += "<div class='metainfo themeName'>"+post.category_title+"&nbsp;</div>";
                                if(isInProgress){
                                    var savedPost = app.savedArticles[post.item_id];
                                    html += "<div class='metainfo progress'>"+savedPost.readingPos+"/"+savedPost.totalPages+"</div> ";
                                }   
                                html += "</div>";
                                if(post.image_url){
                                    html += "<div class='image' style='background-image:url(\""+post.image_url+"\")'></div>";
                                }
                                html += "<div class='summary'   >"+ (post.summary || post.item_description.replace(/<\/?[^>]+(>|$)/g,"").substring(0,150).match(/[^]*\s/).toString())+"..</div>";
                                html += "</div>";
                            }
                            postsPos++;
                        });
                    });
                    if(posts.length > postsPos && !oldPosts){
                        html += "<div class='loadmore' data-pos='"+(postsPos)+"'>LOAD MORE</div>";
                    }
                }else if(filteredPosts.length){
                    allPosts = filteredPosts;
                    $.each(filteredPosts.slice(postsPos,filteredPosts.length),function(i,post){
                            if(post.item_description.length>1500 && itemtitles.indexOf(post.item_title)==-1){
                                var isInProgress = app.savedArticles && Object.keys(app.savedArticles).indexOf(post.item_id)>-1;
                                html += "<div class='post "+type+(isInProgress ? " inProgress" : "")+"' data-pos='"+postsPos+"' data-id='"+post.item_id+"'>";
                                html += "<div class='title'>"+post.item_title+"</div>";
                                var src = post.source || post.item_guid;
                                src = /(http:\/\/)*(www\.)*(.*?)\//.exec(src);
                                html += "<div class='metainfoWrapper'>";
                                html += "<div class='metainfo source'>"+(src && src.length > 1 ? src[src.length-1] : "")+"</div>";
                                html += "<div class='metainfo themeName'>"+post.category_title+"&nbsp;</div>";
                                if(isInProgress){
                                    var savedPost = app.savedArticles[post.item_id];
                                    html += "<div class='metainfo progress'>"+savedPost.readingPos+"/"+savedPost.totalPages+"</div> ";
                                }   
                                html += "</div>";
                                if(post.image_url){
                                    html += "<div class='image' style='background-image:url(\""+post.image_url+"\")'></div>";
                                }
                                html += "<div class='summary'   >"+ (post.summary || post.item_description.replace(/<\/?[^>]+(>|$)/g,"").substring(0,150).match(/[^]*\s/).toString())+"..</div>";
                                html += "</div>";
                            }else{
                                Util.log("short post"+i);
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
                var timer=0;
                cont.unbind("touchmove").on("touchmove",function(){
                    if(timer){
                        clearTimeout(timer);
                    }
                    timer = setTimeout(function(){
                        $.each($(".timestamp:not(.current)"),function(l,el){
                            if(el.getBoundingClientRect().top < 44){
                                $(".timestamp.current").html($(el).html());
                            }
                        });
                    },400);
                });
                $(".loadmore",cont).gwClick(function(el){
                    el.removeClass("error").addClass("loading");
                    var tries = 0;
                    var allPostsInt = setInterval(function(){
                        tries++;
                        if(DataOp.allUserPosts){
                            clearInterval(allPostsInt);
                            el.hide();
                            this.drawPosts($.merge(allPosts,DataOp.allUserPosts.slice(allPosts.length,DataOp.allUserPosts.length)),name,type);
                        }
                        if(tries > 7){
                            clearInterval(allPostsInt);
                            el.removeClass("loading").addClass("error").html("Not able to fetch old posts;<br> please click to try again.");
                        }
                    }.bind(this),2000);
                }.bind(this),{"data-timeout":100});
                $.when(manageViews({
                    type : type,
                    name : name
                })).then(function(){
                    $(".post:not(.empty)",cont).unbind("click").on("click",function(ev){
                        $(".posts").fadeOut();
                        var postData = allPosts[$(ev.currentTarget).attr("data-pos")];
                        this.drawPost(postData);
                    }.bind(this));
                }.bind(this));
        },

        drawThemes : function(onlyUsers){
            DataOp.getThemes(function(themes){
                var html = " <div class='done'> Select atleast three themes you find interesting</div>";
                html += "<div class='themesC' style='height:"+(window.innerHeight-124)+"px;'>"
                $.each(themes,function(i,theme){
                    if(onlyUsers && theme.isChoosen){
                        html += "<div class='theme' data-id='"+theme.cid+"'><div class='title'><span>"+theme.category_title+"</span></div><div class='descr'>"+(theme.category_desc || "")+"</div></div>";
                    }else if(!onlyUsers){
                        html += "<div class='theme' data-id='"+theme.cid+"'><div class='title "+(theme.isChoosen ? "selected" : "")+"'><span>"+theme.category_title+"</span></div> <div class='descr'>"+(theme.category_desc || "")+"</div></div>";
                    }
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
                            toggleLoader(); 
                            DataOp.updateUserThemes(themes,function(){
                                app.user.themes = themes;
                                window.localStorage.setItem("user",JSON.stringify(app.user));
                                DataOp.themesData = null;
                                DataOp.userPosts = null;    
                                this.drawHome();
                            }.bind(this));
                        }
                        
                    }
                    
                }.bind(this),{
                    "data-timeout" : 1
                });
            }.bind(this));
        },
    };
    return obj;
})();

app.initialize();