/* Compatibility for browsers that lack .filter(), simplified and shortened from the Mozilla example.  It is compatible if the function argument is a function and does not mutate the array elements. */

if(!Array.prototype.filter)
 Array.prototype.filter=function(f){var i,l=this.length>>>0,res=[],thisp=arguments[1],v
  for(i=0;i<l;i++){
   v=this[i]
   if(i in this&&f.call(thisp,v,i,this))res.push(v)}
  return res}