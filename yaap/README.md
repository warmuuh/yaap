#Yaap

Yaap is a generic annotation processor for javascript. It can be used to implement cross-cutting concerns and inject additional aspect oriented code.


It [integrates](#wirejs-integration) with [wire.js](https://github.com/cujojs/wire) (part of [cujo.js](http://cujojs.com)), which enables Spring-style wiring (i.e. dependency injection) of your javascript applications. 
With the `yaap/wire` plugin, @Autowired applications are possible

It also [integrates](#expressjs-integration) with Express.js to achieve a SpringMVC-style framework for webapps.

`Remark:` This is an experimentational library and should not be used in production.

An overview of out-of-the-box supported annotations is available [here](docs/annotations.md)

##Installation
Installation for node: `npm install yaap`

##Articles

* [Annotations for JavaScript](http://cubiccow.blogspot.com/2013/02/yaap-annotations-for-javascript.html)
* [@Autowired for JavaScript](http://cubiccow.blogspot.de/2013/02/autowire-for-javascript.html)
* [Express.js the SpringMVC-way](http://cubiccow.blogspot.com/2013/04/expressjs-springmvc-way.html)

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

##Annotations in Javascript
Javascript does not have annotations, but at specific positions, comments are saved and can be retrieved during runtime. This library allow to retrieve and parse annotations placed at these positions.

Right now, Yaap supports class-annotations, parameter-annotations and function-annotations:

```js
var obj = {
	"@Autowired": {"myBean": "bean"},
	
	fn: function(message, /*@Defaul("INFO")*/ level) /*@NotNull*/{
		console.log(level + ": " + message);
	}
};
```
`@Default` here is an parameter-annotation while `@NotNull` is a function-annotation. (`@NotNull` can also be used as parameter-annotation though).
`@Autowired` is an example for a classbased annotation.



##Processors
Yaap is no library of pre-defined annotations for javascript. It should be an extensible foundation to process 
your own annotations easily. All need to be done is to register your processor. The rest is taken care of by Yaap.

```js
var myProcessor = {
	annotation: "@NotNull",
	processFunction: function(object, fnDescription, annotationParams, configuration){...	},
	processParameter: function(object, fnDescription, annotatedParameters, configuration){...},
	processClass: function(object, annotatedParameters, configuration){...}
}
yaap.register(myProcessor);
```

After registering your processor, `processFunction` will be called, 
if a function is annotated with the according annotation. `processParameter` is called, 
if an annotated parameter is found and `processClass`, if a class-annotation is found.

`Remark:` You can either define all or some of these functions, depending on 
where you want to allow your annotation to be placed.

More information on how to create custom annotation processors are available [here](docs/processors.md).

##wire.js Integration
To use @Autowired (and annotations in general) in wire.js, simply add it as a plugin:
```js
var wire = require("wire");
wire({
	level: "INFO",
	logger: {create:  './Logger'},
        
	plugins: [
		{module: "yaap/wire"}
	]
}, {require: require}).then(function(ctx){
	ctx.logger.log("message");
}, console.error);
```
Everything else is done by yaap, so you can start use your annotations:

```js
//Logger.js

module.exports = {
  log: function(message, /*@Autowire*/ level){
		console.log(level + ": " + message);
	}
}
```
`level` references the value in the wire-context (with value "INFO") now.

`Remark:` Yaap/wire uses the parameter name to autowire. You can also supply a reference name with `/*@Autowire("level")*/`

`Remark:` You can also annotate the whole function with `@Autowire` so every parameter will be autowired by name.

###Constructors
The yaap/wire plugin will be called after the bean was created. That means, the constructor itself will not be affected by annotations. 

As a workaround, use a separate initialize-method (using the [init-facade](https://github.com/cujojs/wire/blob/master/docs/configure.md#init-methods) of wire).

##Express.js integration
There are also out-of-the-box annotations included for creating webapps in a springMVC-like manner. 
More information on how to setup this integration is available [here](docs/express.md)
A simple example of a service:

```js
MyService.prototype = {
    index: function ()/*@GET*/ {
		return 'index';
    },
    
    submit: function (name, age)/*@POST @Param*/ {
     var msg = (age < 18)? "You are too young" : "You are welcome!";
	 return {view:'greet', model:{name: name, msg: msg}};
    }
};
```
As known from SpringMVC, the returned values determine, which view will be called and with what parameters. 
More details on this in my [blogpost](http://cubiccow.blogspot.com/2013/02/autowire-for-javascript.html).

