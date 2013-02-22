function build_module(name,requires,exports,body){var ret=[]
 ret.push(';(function(exports){\n')
 requires.forEach(function(require){ret.push('var '+require+'=require(\''+require+'\')\n')})
 ret.push('\n')
 ret.push(body.replace(/\n+$/,''))
 ret.push('\n\n')
 exports.forEach(function(export){ret.push('exports.'+export+'='+export+'\n')})
 ret.push('\n')
 ret.push('})(typeof exports==\'object\'?exports:'+name+'={});\n')
 return ret.join('')}