define([], function(){


return {
  message: "autowired",
  node:   {$ref: "dom.all!.pressed"},
  out: {$ref: "dom!output"},
  myComponent: {
          create: {
	            module: 'MyClass',
	            args: "wired"
	        }
  },
  	
  plugins: [
    //{module: "wire/debug", trace: true},
     {module: "yaap/wire/wireplugin"},
     {module: "yaap/wire/html/wireplugin"},
     {module: "wire/dom"},
     {module: "wire/on"}
  ]
        
};

});