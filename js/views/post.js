var PostView = (function(){



    /**
     * Remove the article as a bookmark
     * @method unsaveArticle
     * @param  {object}      postData - The post data
     */
    var unsaveArticle = function(postData){
        //This will signify that the articles page has to be updated with the bookmarked articles.
        $("#header .back").addClass("refresh");
        app.state = app.state || {};
        app.state["postId"] = postData._id;
        app.state["progress"] = 0;
        delete app.savedArticles[postData._id];
        window.localStorage.setItem("articles",JSON.stringify(app.savedArticles));
    };

    /**
     * Add the article as a bookmark
     * @method saveArticle
     * @param  {object}    postData [description]
     * @return {[type]}
     */
    var saveArticle = function(postData){
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
    };

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

    
    var obj = BaseView.extend({

        type : "post",

        constructor : function(post){
            this.post = post;
        },

        assignHeaderEvents : function(){
            $("#header .save").gwClick(function(el){
                //When the bookmark button is clicked.
                if(el.hasClass("saved")){
                    unsaveArticle(this.post);
                    el.removeClass("saved");
                }else{
                    this.post.readingPos = parseInt($('#header .progress .pos').text());
                    this.post.totalPages = parseInt($('#header .progress .total').text());
                    saveArticle(this.post);
                    el.addClass("saved");
                }
            }.bind(this),{
                "data-active" : "active",
                "data-timeout" : 500,
                "useClick" : true
            });
            //Using the apache cordova social share plugin to enable share on article.
            $("#header .share").gwClick(function(el){
                var message = {
                    text: this.post.title,
                    url  : (this.post.orignalUrl || this.post.link)
                };
                window.socialmessage.send(message);
            }.bind(this),{
                "data-active" : "active",
                "data-timeout" : 500,
                "useClick" : true
            });
        },

        assignArticleEvents : function(){
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
                var url = el.attr("src") || el.attr("data-src");
                window.open(url, '_system');
            });
        },


        enablePageLayout : function(){
            var totImg = $(".postFullCont img"), imgLoadCt = 0;
            if(totImg.length){
                //Wrapping each image with a container which has a message.
                $(".postFullCont img").wrap("<div/>").parent().append("<p class='imgMsg'>"+app.config.APP_MESSAGES.OPEN_IN_BROWSER_MSG+"</p>").addClass("imageCont");
            }
            
            //Calculating the height of one page. It will be the height which is a perfect multiple of 25 and less the window height minus toolbar.
            var toLeave = (window.innerHeight-50)%25+50;
            $(".postFull").height(window.innerHeight - toLeave).css("margin-top","50px");

            //The number of pages will be the total height rendered divided by calculated height of one page.
            var pages = Math.ceil($(".postFullCont").height()/(window.innerHeight-toLeave));
            
            //Setting the progress element.
            $("#header .progress").html("<span class='pos'>1</span>/<span class='total'>"+pages+"</span>").show();

            //Check if the post is bookmarked
            if(app.savedArticles){
                if(Object.keys(app.savedArticles).indexOf(this.post._id)>-1){
                    $("#header .save").addClass("saved");
                    var pos = app.savedArticles[this.post._id]["readingPos"];
                    snapArticle(pos);
                }else{
                    $("#header .save").removeClass("saved");
                }
            }
            
            //The last step is to enable the snapping across pages.
            enableArticleSnap($('.postFull'),function(pos){
                //The callback function called on swipe which will keep updating the progress if its a saved article
                if($("#header .save").hasClass('saved')){
                    this.post.readingPos = pos;
                    this.post.totalPages = pages;
                    saveArticle(this.post,true);
                }
            }.bind(this));
        },

        viewLoaded : function(){
            this.enablePageLayout();
            this.assignHeaderEvents();
            this.assignArticleEvents();
        },


        render : function(){
            var post = this.post;
            //Get the help overlay object
            var helpStatus = DataOp.getHelpStatus();
            if(!helpStatus["ARTICLE"]){
                //Show the first time help overlay of article
                $(".imgHelpOverlay").addClass("show").css("background-image","url('img/help_overlay/article.png')");
                helpStatus["ARTICLE"] = true;
                DataOp.setHelpStatus(helpStatus);
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
        }
    });
    return obj;
})();