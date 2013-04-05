"use strict";

function MyService() {
}


MyService.prototype = {
    index: function ()/*@GET*/ {
		return 'index';
    },
    
    submit: function (name, age)/*@POST @Param*/ {
     var msg = (age < 18)? "You are too young" : "You are welcome!";
	 return {view:'greet', model:{name: name, msg: msg}};
	 
    }
    
 
};


module.exports =  MyService;



