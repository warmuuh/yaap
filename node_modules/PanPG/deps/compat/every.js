if(!Array.prototype.every){
 Array.prototype.every=function(f,thisp){var
  l=this.length>>>0,i,x
  for(i=0;i<l;i++)
   if (i in this && !f.call(thisp,this[i],i,this))return false
  return true}}