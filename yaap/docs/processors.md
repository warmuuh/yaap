#Processors

If you want to register your own Annotation Processor, you need to define it first. 
Every processor can have a processFunction method and a processParameter method, depending, 
if your processor supports parameter-annotations or function-annotations.

The "annotation" property defines the name of your annotation. The following example declares the @NotNull annotation processor.

```js
var myProcessor = {
	annotation: "@NotNull",
	processFunction: function(object, fnDescription, annotationParams,  context){...	},
	processParameter: function(object, fnDescription, annotatedParameters, context){...},
	processClass: function(object, annotatedParameters, context){...},
}
yaap.register(myProcessor);
```

The last line registers the processor at yaap. The annotation is now ready to be used.

The context object can be supplied as argument to yaap.process so you could hand over some dependencies to the annotation processors. (currently, its used for wire-specific processors).

#Process Functions

the processFunction parameter will be called, if a function-annotation is discovered, e.g.:

```js
myFn = function() /*@NotNull*/ {...}
```

It recieves the object on which yaap was called as first attribute. The second attribute is a description of the function, e.g.:
```js
{
name: "myFn",
parameters: [{name: "..."}, ...]
}
```
Because Annotations can be "called" with parameters, the third parameter, "annotationParams" can contain the parameters.

#Process Parameters
analog to the function, this will be called in case of a discovered annotation on a parameter.
The "annotatedParameters" parameter is an array of the parameters that are annotated by the annotation handled by this Annotation Processor.
Each entry is an object like this:
```js
{
name: "parameterName",
index: 0,
annotation: {
				name:"@NotNull", //will only contain YOUR annotations
				parameters:[...] //the parameter supplied to this annotation
			}
}
```
The parameters are handed over as array instead of multiple calls to "processParameters" 
because then you can handle each annotated parameter in one wrapper of the target function 
instead of one separate handler for each annotated parameter.

#Process Classes
Class-annotations are not comments but specific attributes. they are strings starting with `@`. Their value will be handed over to the `processClass`-function.
The parameters are the same as for `processParameter` except that there is no fnDescription.

##Wire-Specific Processors
Wire-specific processors need a specific instance of wire to e.g. resolve references in the current context. 
Therefore the context contains the wire-context as well as an array where plugins can put their promises. The context object looks loke this:
```js
{
wire: ...,
promises: []
}
```