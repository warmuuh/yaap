function cset_prod(text,unicat,forEach,filter){
 text=text+'(typeof exports==\'object\'?exports:CSET={})'
 text=cleanupWS(stripJSComments(text))
 text=insertUnicodeCategories(text,unicat)
 text=forEach
     +'\n'
     +filter
     +'\n'
     +text
 text=cleanupWS(stripJSComments(text))
 text=doReplacements(text)
 text=text+';'
 return text}

function stripJSComments(s){return s.replace(/\/\*.*?\*\//gm,'').replace(/\/\/.*/g,'')}

function cleanupWS(s){return s.replace(/[\t ]+\n/g,'\n').replace(/^\n+|\n(?=\n(?!function))|\n+$/g,'')}

function insertUnicodeCategories(s,x){
 var y=s.split('\n')
 y.splice(1,0,x)
 return y.join('\n')}

function doReplacements(s){return s
 .replace(/cset_unicode_categories/g,'cUC')
 .replace(/surrogateSetToRE/g,'sS2RE')
 .replace(/_CSET/g,'CSET')}