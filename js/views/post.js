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
        app.state["progress"] = postData.progress;
        postData["lastRead"] = new Date().toISOString();
        app.savedArticles[postData._id] = postData;
        if(this.persistTimeout){
            clearTimeout(this.persistTimeout);
        }
        //****Not sure why iam adding a delay here.
        this.persistTimeout = setTimeout(function(){
            window.localStorage.setItem("articles",JSON.stringify(app.savedArticles));
        },2000);
    };

    var enableArticleSnap = function(elSel,pos,c){
        myScroll = new IScroll(elSel, { probeType: 3, mouseWheel: true, click : true});
        var timer;
        myScroll.on('scroll', function(){
            c(this.y);
        });
        myScroll.scrollTo(0,pos*-1);

        //myScroll.on('scrollEnd', updatePosition);
        /*        
        this.myScroll = new IScroll(elSel, {
            snap : true,
            momentum : false
            });
        this.myScroll.on('scrollEnd',function(ev){
                c(this.currentPage.pageY+1);
        });
        if(pos>1){
           this.myScroll.goToPage(0, pos-1, 1000);   
        }
        */
    };
    
    var obj = BaseView.extend({

        type : "post",

        el : ".postFull",

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
                    this.post.progress = Math.floor( (parseInt($('#header .progress .pos').text())/parseInt($('#header .progress .total').text())) * 100);
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
                    url  : "http://www.opsight.in/article?url="+encodeURIComponent(this.post.orignalUrl || this.post.link)
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
                $(".postFullCont img").wrap("<div/>").parent().addClass("imageCont");
            }
            
            //Calculating the height of one page. It will be the height which is a perfect multiple of 25 and less the window height minus toolbar.
            var toLeave = (window.innerHeight-55)%25+50;
            $(".postFullContWrapper").height(window.innerHeight - toLeave);


            var pageHt = window.innerHeight-toLeave;
            var totHt = $(".postFullCont").height();
            //The number of pages will be the total height rendered divided by calculated height of one page.
            var pages = Math.ceil(totHt/(pageHt));


            //Setting the progress element.
            $("#header .progress").html("<span class='pos'>1</span>/<span class='total'>"+pages+"</span>").show();

            //Check if the post is bookmarked
            var pagePos=1;
            if(app.savedArticles){
                if(Object.keys(app.savedArticles).indexOf(this.post._id)>-1){
                    $("#header .save").addClass("saved");
                    pagePos = Math.ceil((app.savedArticles[this.post._id]["progress"]/100) * pages);
                }else{
                    $("#header .save").removeClass("saved");
                }
            }
            var elPos = $("#header .progress .pos");
            elPos.data("pos",pagePos).html(pagePos);
            //The last step is to enable the snapping across pages.
            enableArticleSnap.call(this,'.postFullContWrapper',Math.min((pagePos -1)*pageHt,totHt-pageHt),function(position){
                if(Math.abs(position)+pageHt >= (totHt-10)){
                    pos = pages;
                }else{
                    var pos = (Math.abs(position) + pageHt)/pageHt;
                    pos = Math.floor(pos);
                }
                if(parseInt(elPos.data("pos")) !== pos ){
                    elPos.data("pos",pos).html(pos);
                    //The callback function called on swipe which will keep updating the progress if its a saved article
                    if($("#header .save").hasClass('saved')){
                        this.post.progress = Math.floor( (pos/pages) * 100);
                        saveArticle(this.post,true);
                    }
                }
            }.bind(this));
        },

        viewLoaded : function(){
            this.enablePageLayout();
            this.assignHeaderEvents();
            this.assignArticleEvents();
            this.recordView();
        },

        recordView : function(){
            DataOp.loadURL({
                u : app.config["END_POINTS"]["FEED_ITEMS"],
                d : {id : this.post._id},
                t : "POST",
                c : function(d){
                    d = JSON.parse(d);
                    if(!d._source){
                        return;
                    }
                    var toUpd = {
                        "doc" : { "view_count" : d._source.view_count ? d._source.view_count+1 : 1}
                    };
                    DataOp.loadURL({
                        u : app.config["END_POINTS"]["UPDATE_ITEM"],
                        t : "POST",
                        d : {
                                q : JSON.stringify(toUpd),
                                id : d._id
                            },
                        c : function(){
                        }.bind(this)
                    },true);
                }.bind(this)
            },true);
        },

        render : function(){
            var post = this.post;
            //Get the help overlay object
            var helpStatus = DataOp.getHelpStatus();
            if(!helpStatus["ARTICLE"]){
                //Show the first time help overlay of article
                $(".imgHelpOverlay").addClass("show");
                helpStatus["ARTICLE"] = true;
                DataOp.setHelpStatus(helpStatus);
            }
            var html = "";
            html += "<div class='postFullContWrapper'>";
            html += "<div class='postFullCont'>";
            //Title
            html += "<div class='title'>"+post.title+"</div>";
            //Publish date
           
            html += "<div class='audate'>";
            html += "<div class='date'>"+new Date(new Date(post.pubdate).toISOString().substring(0,10)).toDateString().substring(4,30)+"&nbsp&nbsp&nbsp|&nbsp&nbsp&nbsp</div>";
            //Author
            html += "<div class='author' >"+ (post.author || post.item_author || "") +"</div>";
            html += "</div>";
            //Image of article
            if(post.image && post.image.url){
                html += "<div class='image' data-src='"+post.image.url+"' style='background-image:url(\""+post.image.url+"\");'></div>";
            }
            //Description. Removing any strong tags since it is resulting in cutting of text on the edges
            //
            html += "<div class='content'><div class='postDisclaimer'>"+("This article is being displayed originally from this <a href='"+post.guid+"'>link.</a></div>")+(post.description.replace(/\<\/*strong\>/g,""))+"</div>";
            html += "</div>";
            html += "</div>";
            $("._wrapper .postFull").html(html);
        }
    });
    return obj;
})();
