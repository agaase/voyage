var DataOp = (function(){
    return {

        collection : {},

        /**
         * Sync up the saved articles to the server,
         * @method updateSavedPosts
         * @param  {function}         c - Callback function to call.
         */
        updateSavedPosts : function(c){
            if(Object.keys(app.savedArticles).length){
                DataOp.runMongoQuery({
                    "u" : app.config["END_POINTS"]["USERS_COLLECTION"]+app.user._id,
                    "t" : "PUT",
                    "d" : JSON.stringify( {"$set":{ "savedPosts" : app.savedArticles } }),
                    "c" : c
                },true);
            }
        },

         /**
         * Get a particular user from the id.
         * @method getUser
         * @param  {string} id   -  The id of the user.
         * @param  {function} c  -  Callback function to call.
         */
        getUser : function(id,c){
             DataOp.runMongoQuery({
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
            DataOp.runMongoQuery({
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
         * Any mongo query first comes here and then goes to loadUrl.
         * @method runMongoQuery
         * All parameters remain same as loadUrl except the following
         *  u : endpoint url is appended with credentials of mongodb
         *  contentType : hardcoded value since return from mongo is always json.
         */
        runMongoQuery : function(params,dontShowError,dontTimeout){
            params.u = params.u + (params.u.indexOf("?") >-1 ? "&" : "?") + "apiKey="+app.config["KEYS"]["MONGODB"];
            params.contentType = "application/json";
            this.loadURL(params,dontShowError,dontTimeout);
        },

        /**
         * Any request will be triggered using this.
         * @method loadURL
         * @param  {[type]} params   - u : the endpoint url, d : data to send, 
         *                             t : type of request,  contentType : what type of content will be in response
         *                             c : callback to call
         * @param  {[type]} dontShowError -  TRUE: dont show the alert to the user if some error has occured.
         * @param  {[type]} dontTimeout   - TRUE : dont timeout on the request
         */
        loadURL : function(params,dontShowError,dontTimeout){
            var options = { 
                url: params.u,
                data: params.d || null,
                type: params.t || "POST",
                contentType : params.contentType,
                beforeSend : function(xhr){
                    xhr.setRequestHeader("Authorization", "Basic "+app.config["END_POINTS"]["AUTH_HEADER"]);
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
        },
         /**
         * Getters for the help status from localStorage
         * @method getHelpStatus
         */
        getHelpStatus : function(){
            var helpStatus = window.localStorage.getItem("helpStatus");
            helpStatus = helpStatus ? JSON.parse(helpStatus) : {};
            return helpStatus;
        },
        /**
         * Setters for the help status into localStorage
         * @method setHelpStatus
         */
        setHelpStatus : function(helpStatus){
            window.localStorage.setItem("helpStatus",JSON.stringify(helpStatus));
        },

        getModel : function(key){
            return this.collection[key] || [];
        },
        setModel : function(key,model){
            this.collection[key] = model;
        }

    };
})();
