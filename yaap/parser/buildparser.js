var pg = require("./PanPG");
var fs = require("fs");

var grammar = fs.readFileSync("ECMAScript_5.peg").toString();
var parser = pg.generateParser(grammar);


parser = parser + "\nexports.Program = Program;";


fs.writeFileSync("ECMA5Parser.js", parser);