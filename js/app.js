var app = {

    /**
     * Global object containing the user info.
     */
    user : undefined,

    viewStack : [],

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
        /*
        if(typeof(Pushbots) !=="undefined"){
            Pushbots.Plugin.initialize("55c6f9b7177959124c8b4568");
        }
        */
    
        if(PushbotsPlugin.isAndroid()){
            PushbotsPlugin.initializeAndroid("55c6f9b7177959124c8b4568", "552982353176");
        }
        
    },

    checkForRefresh : function(){
        var nextUpdRefresh = localStorage.getItem('nextUpdate');
        if(!nextUpdRefresh){
            nextUpdRefresh = waqt.nextDate(app.config["LOGIC_CONFIG"]["REFRESH_TRIGGER"]["hrs"],app.config["LOGIC_CONFIG"]["REFRESH_TRIGGER"]["mins"]);
            localStorage.setItem("nextUpdate",nextUpdRefresh);
        }
        var d = new Date(parseFloat(nextUpdRefresh));
        if(new Date() >=  d){
                app.shouldBeRefreshed = true;
                $.publish("/vyg/refreshToggle",[]);
                clearTimeout(app.refreshTimer);
        }else{
            app.refreshTimer = setTimeout(function(){
                app.checkForRefresh();
            }, (d - new Date()));
        }
    },

    /**
     * This is the starting point of the application.
     * @method startFlow
     */
    startFlow : function(){
        //Check if the connection is on.
        var connection = Util.checkConnection();
        if(!connection.isOn){
            UIRender.showInfoMessage("Cannot connect to internet",true,2000);
        }
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
                }
                UIRender.initialise();
                app.checkForRefresh();
                UIRender.drawHome();
            });
        });
        /*
        else{
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
        */
    }
};


app.initialize();
