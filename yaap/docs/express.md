#Express.js integration
If you want to use the `yaap/wire/express` plugin, you need to supply an express application to the plugin. This is done during wire-setup as follows:
Your wire-context:
```js
{
		app: { create: 'express',
			   init:{use:[express.bodyParser()]}, 
			   ready:{listen:[8000]}
		},
        myService:  { create: './MyService' }, 
        
        plugins: [
			{module: "yaap/wire"},
			{module: "yaap/wire/express",server: "app"}
        ]
}

```

The setup of the application is exemplary and can also be done somewhere else.
The yaap/wire/express accepts the name of a reference which will later be resolved against the wire-context as `server`-parameter.

##yaap/wire/express options
There are several options that can be configured during plugin-setup. 
*`server` (mandatory): string name of the express-application bean
*`view` (optional, default: "jade"): string of the extension that will be added to view-names. These extensions determine the template-engine in express.