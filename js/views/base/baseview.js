var BaseView = (function(){
    var extend = function(protoProps, staticProps) {
        var parent = this;
        var child;

        // The constructor function for the new subclass is either defined by you
        // (the "constructor" property in your `extend` definition), or defaulted
        // by us to simply call the parent's constructor.
        if (protoProps && protoProps.hasOwnProperty('constructor')) {
            child = protoProps.constructor;
        } else {
            child = function() {
                return parent.apply(this, arguments);
            };
        }

        // Add static properties to the constructor function, if supplied.
        $.extend(child, parent, staticProps);

        // Set the prototype chain to inherit from `parent`, without calling
        // `parent`'s constructor function.
        var Surrogate = function() {
            this.constructor = child;
        };
        Surrogate.prototype = parent.prototype;
        child.prototype = new Surrogate();

        // Add prototype properties (instance properties) to the subclass,
        // if supplied.
        if (protoProps) {
            $.extend(child.prototype, protoProps);
        }

        // Set a convenience property in case the parent's prototype is needed
        // later.
        child.prototype.__super__ = parent.prototype;

        return child;
    };

    var obj = function(){
    };

    $.extend(obj.prototype, {

        launch : function(){
            this.fetchData(function(){
                var checkL = setInterval(function(){
                    //It waits for the logo overlay which will be there if this 
                    //is the first time use of app and it shows up the help overlay.
                    if(!$("._wrapper .logo").is(":visible") || $("._wrapper .logo img").is(":visible")){
                        //if logo is there and loader is displayed
                        clearInterval(checkL);
                        $("._wrapper .logo").hide();
                        this.render();  
                        $.when(UIRender.manageViews(this)).then(function(){
                            this.viewLoaded();
                        }.bind(this));
                    }
                }.bind(this),200);
            }.bind(this));
        },

        renderMore : function(){
            this.fetchData(function(){
                this.render();  
                $.when(UIRender.manageViews(this)).then(function(){
                    this.viewLoaded();
                }.bind(this));
            }.bind(this));
        },


        bindEvents : function(){

        },

        render : function(){
        },

        fetchData : function(c){
            c();
        },

        viewLoaded : function(){

        }

    });

    obj.extend = extend;

    return obj;
})();

