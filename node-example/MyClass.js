
function MyClass (val){
	this.value = val;
}


MyClass.prototype = {

	doSomething: function( /*@Default("Default Message")*/msg, /*@Autowired("message")*/msg2, /*@Autowired*/message) {
		console.log("default: " +msg );
		console.log("wired: " + this.value );
		console.log("autowired: " +msg2 );
		console.log("autowired(pname): " + message );
		
	},
  
  
  doSomethingElse: function( msg) /*@NotNull*/{
		console.log(msg + " " +this.value);
	},
  
  doSomethingElseAgain: function( message) /*@Autowired*/{
		console.log("autowired(fn): " + message );
	},
  
};






module.exports =  MyClass;



