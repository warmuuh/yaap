function benchmark(f,ms){var d1=+new Date,d2,end=d1+ms,res=[]
 do{
  f()
  d2=+new Date
  res.push(d2-d1)
  d1=d2}
 while(d2<end)
 return res}

// function, number or ms to run, description, operations per call to f() (for scaling results comparably)
function simple(f,ms,desc,ops){var res,n,tot_ms,most
 res=benchmark(f,ms)
 n=res.length
 tot_ms=sum(res)
 //most=res.sort(function(a,b){return a==b?0:a<b?-1:1}).slice(0,Math.round(res.length*0.5))
 return desc+':\n'+
        ['ops/ms: '+(n*ops/tot_ms).toPrecision(4)
        ,'ms: '+tot_ms
        ,'max: '+max(res)
        ,'min: '+min(res)
        ,'n: '+n
        ,'ops: '+ops
        ].join(' ')}
