
var Util = (function(){
    var obj = {

        /**
         * Gets the app config
         * @method getConfig
         * @param  {function}  c - Callback to call.
         */
        getConfig : function(c){
            $.getJSON("config/config_dev.json",function(d){
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


