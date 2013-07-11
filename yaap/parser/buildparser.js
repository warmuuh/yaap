/** @license MIT License (c) copyright 2013 original author or authors */

/**
 * build script for the ECMA-parser used in Yaap
 *
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author Peter Mucha
 *
 * @version 0.1.1
 */
"use strict";

var pg = require("./PanPG");
var fs = require("fs");

var grammar = fs.readFileSync("ECMAScript_5.peg").toString();
var parser = pg.generateParser(grammar);


parser = "(function(define) {\ndefine([],function(){\n\n" + parser + "return {Program:Program};\n\n});})(typeof define == 'function'? define: function(deps, factory) {module.exports = factory.apply(this, deps.map(function(x) {return require(x);}));});";


fs.writeFileSync("ECMA5Parser.js", parser);