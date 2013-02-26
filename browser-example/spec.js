define([], function(){


return {
  message: "autowired",
  myComponent: {
          create: {
	            module: 'MyClass',
	            args: "wired"
	        }
  },
  	
  plugins: [
    //{module: "wire/debug", trace: true},
     {module: "yaap/wire/wireplugin"}
     
  ]
        
}

});