#Yaap
## Overview
Yaap is a generic annotation processor for javascript. It can be used to implement cross-cutting concerns and inject additional apect oriented code.

Javascript does not have annotations, but at specific positions, comments are saved and can be retrieved during runtime. This library allow to retrieve and parse annotations placed at these positions.

It integrates with wire.js (part of cujo.js), which enables Spring-style wiring (i.e. dependency injection) of your javascript applications. 
With the `yaap/wire` plugin, @Autowired applications are possible


##Example

The Yaap-library can process annotated javascript-objects. One simply defines the object adds annotations and let Yaap process it.

The library already includes some so-called annotation processors, e.g. @NotNull or @Default, which injects a default value in case of a missing or null-argument.

```js
var logger = {
	log: function(message, /*@Defaul("INFO")*/ level){
					console.log(level + ": " + message);
					}
};
yaap.process(logger);
```

The level-parameter is annotated with @Default. Calling <code>yaap.process</code> scans and 
enables attached annotations.


```js
logger.log("hello world"); //will print "INFO: hello world"
```

##Processors
Yaap is no library of pre-defined annotations for javascript. It should be an extensible foundation to process 
your own annotations easily. All need to be done is to register your processor. The rest is taken care of by Yaap.

```js
var myProcessor = {
	annotation: "@NotNull",
	processFunction: function(object, fnDescription, configuration){...	},
	processParameter: function(object, fnDescription, paramDescription, configuration){...}
}
yaap.register(myProcessor);
```

After registering your processor, `processFunction` will be called, 
if a function is annotated with the according annotation. `processParameter` is called, 
if an annotated parameter is found.

`Remark:` You can either define both or one of these functions, depending on 
where you want to allow your annotation to be placed.

