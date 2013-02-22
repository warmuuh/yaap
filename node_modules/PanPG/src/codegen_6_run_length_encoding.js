function v6_rle_enc(arr){var i,l,count,x,ret=[]
 for(x=arr[0],count=1,i=1,l=arr.length;i<l;i++){
  if(arr[i]==x){count++;continue}
  ret.push(count,x)
  x=arr[i]
  count=1}
 ret.push(count,x)
 return ret}

function v6_rle_dec(){}

// RLE encode if the result is shorter by at least 16 chars
function v6_rle_if_shorter(arr){var x,y
 x='rle_dec(['+v6_rle_enc(arr).join(',')+'])'
 y='['+arr.join(',')+']'
 if(y.length - x.length > 16) return x
 return y}

// the decode function as a string literal
v6_function_rle_dec=
 'function rle_dec(a){var r=[],i,l,n,x,ll;'+
  'for(i=0,l=a.length;i<l;i+=2){'+
   'n=a[i];x=a[i+1];'+
   'r.length=ll=r.length+n;'+
   'for(;n;n--)r[ll-n]=x}'+
  'return r}'

// the decode function is used in some of our tests so let's add a shim for it
function v6_rle_dec(a){
 v6_rle_dec=eval('('+v6_function_rle_dec+')')
 return v6_rle_dec(a)}