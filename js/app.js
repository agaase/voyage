var app = {

    /**
     * Global object containing the user info.
     */
    user : undefined,

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
                    }
                    UIRender.drawHome();
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


app.initialize();
