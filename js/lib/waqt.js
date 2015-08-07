var waqt = (function(){
	return {
		nextDate : function(hrs,mins){
			var d = new Date();
			if(d.getUTCHours() > hrs || (d.getUTCHours() == hrs && d.getUTCMinutes() >= mins)){
					return(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()) + ((24 + hrs)*60 +mins)*60*1000);
			}else{
				return Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate(),hrs,mins);
			}
		}
		
	}
})();