/* This is similar to the Mozilla compatibility code, but does not support the optional second argument, which we do not use. */

if(!Array.prototype.map)Array.prototype.map=
 function(f){var r=[],i=0,l=this.length>>>0
  for(;i<l;i++)
   if(i in this)r[i]=f(this[i])
  return r}