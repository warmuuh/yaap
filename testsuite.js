var reporter = require('nodeunit').reporters.default;
reporter.run([
'test', 
'parser/test',
'plugins/test'
]);