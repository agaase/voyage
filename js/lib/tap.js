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
    var touchEndTimer=0,startPosX=0,startPosY=0, marginX = (options.marginX || 5), marginY = (options.marginY || 5) ;
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