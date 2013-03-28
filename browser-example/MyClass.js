define([], function(){
function MyClass (val){
	this.value = val;
}


MyClass.prototype = {

	doSomething: function( 	/*@Default("Default Message")*/msg, 	/*@Autowired("message")*/msg2, 	/*@Autowired*/message) {
		//console.log( node );
		//output.value = "default: " +msg +"\n";
		console.log("default: " +msg);
		console.log("wired: " + this.value );
		console.log("autowired: " +msg2 );
		console.log("autowired(pname): " + message );
		
	},
  
  
  doSomethingElse: function( msg) /*@NotNull*/{
		console.log(msg + " " +this.value);
	},
  
  
  onNodeClick: function( e ) 
  /* @On("node", "click") */  
  {
		alert("you clicked the button: " + e.target.value); // + node);
  }
  
};






return MyClass;
});


