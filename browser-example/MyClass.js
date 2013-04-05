define([], function(){
function MyClass (val){
	this.value = val;
}


MyClass.prototype = {

	doSomething: function( 	/*@Default("Default Message")*/msg, 	/*@Autowired("message")*/msg2, 	/*@Autowired*/message, /*@Autowired("out")*/output) {
		output.value = "default: " +msg +"\n";
		output.value +="wired: " + this.value +"\n";
		output.value +="autowired: " +msg2 +"\n";
		output.value +="autowired(pname): " + message +"\n";
	},
  
  
  doSomethingElse: function( msg) /*@NotNull*/{
		console.log(msg + " " +this.value);
	},
  
  
  onNodeClick: function( e ) 
  /* @On("node", "click") */  
  {
		alert("you clicked the button: " + e.target.value ); // + node);
  }
  
};






return MyClass;
});


