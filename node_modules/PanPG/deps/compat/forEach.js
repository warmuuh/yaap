/* Simplified version of MDC's forEach compatibility code: https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/Array/forEach#Compatibility */

if(!Array.prototype.forEach)
 Array.prototype.forEach=function(f){var i,l=this.length>>>0,thisp=arguments[1]
  for(i=0;i<l;i++)
   if(i in this)
    f.call(thisp,this[i],i,this)}