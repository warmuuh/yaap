CSET['import']('',CSET)

function codegen_v5(opts,names,named_res){var ctx,nameline
 ctx={csets:[],strlits:[]}
 opts.drop=opts.drop||[]
 opts.nocache=opts.nocache||[]
 opts.prefix=opts.prefix||''
 opts.start=opts.start||names[0]
 opts.fname=opts.fname||opts.prefix+opts.start
 if(opts.codegen=='v6'){
  return codegen_v6(opts,named_res)}
 nameline=opts.fname+'.names='+'[\''+names.join('\',\'')+'\'];'
 return ['function '+opts.fname+'(str){'
 , 'var tbl=[],pos=0,l=str.length+1;'
 + (opts.debug?'var i=0;while(i<l)tbl.push({_:i++});'
              :'while(l--)tbl.push([]);')
 + 'l=str.length;'
 + (opts.profile?'var profile_log=[]'
                :'')
 ]
 .concat(names.map(ntof))
 .concat(named_res.map(named_re_to_fdecl(ctx)))
 .join('\n ')
 +'\n '
 +ctx.csets.map(snd)
 .concat(ctx.strlits.map(snd))
 .join('\n ')

 // fin()
 +['\n function fin(c,p,x,r,a){'
 ,'if(r)a.push([p,x]);' // pointer style
 ,'tbl[p][x]='
 ,'r?[true,pos,c]:false;'
 //,'if(r)a.push(tbl[p][x]);' // direct reference
 ,'return r}'
 ].join('')

 // empty()
 +['\n function e(){return true}'
 // ordChoice()
 ,'function o(){var args=arguments;return function(c){var i,l;for(i=0,l=args.length;i<l;i++)if(args[i](c))return true;return false}}'
 // seQuence()
 ,'function q(){var args=arguments;return function(c){var i,l,cp=pos,cl=c.length;for(i=0,l=args.length;i<l;i++)if(!args[i](c)){pos=cp;t(c,cl);return false}return true}}'
 // repetition()
 ,'function r(m,n,f){return function(c){var i=0,cp=pos,cl=c.length;while(i<m){i++;if(!f(c)){pos=cp;t(c,cl);return false}}cl=c.length;while(i++<n||n==0)if(!f(c))return true;return true}}'
 // negative lookahead
 ,'function n(f){return function(){var p=pos'
 +',x=f([]);pos=p;return !x}}'
 // positive lookahead
 ,'function p(f){return function(){var p=pos'
 +',x=f([]);pos=p;return x}}'
 // truncate() an array
 ,'function t(a,n){if(a.length>n)a.splice(n)}'
 // get() the current Unicode character
 // XXX doesn't handle UTF-16 yet
 ,'function g(p){return str.charCodeAt(p)}'
 // build() a parse tree from the result table
 /*,'function b(p,n){var i,l,'
 +'x=tbl[p][n],c=x[2],cn=[],o=[n,p,x[1],cn];'
 +'for(i=0,l=c.length;i<l;i++){'
 +'cn.push(b(c[i][0],c[i][1]))}'
 +'return o}'*/
 ,'function b(p,n){var '
 + 'x=tbl[p][n],c=[],a=[n,x[1]-p,c],y=x[2],i=0,l=y.length,z;'
 + 'for(;i<l;i++){z=y[i];'
 +  'if(z[0]>p)c.push([-1,z[0]-p]);' // anonymous node
 +  'c.push(b(z[0],z[1]));' // named node
 +  'p=tbl[z[0]][z[1]][1]}' // new position
 + 'if(p<x[1]&&c.count)c.push([-1,x[1]-p]);'
 + 'return a}'
 , 'if(typeof str!=\'string\')throw new Error(\''+opts.fname+': argument is not a string\')'
 ].join('\n ')
 +'\n return '+opts.start+'([])&&pos==l?[true'
  +(opts.profile?',profile_log'
                :',b(0,'+names.indexOf(opts.start)+')')
  +']:[false,pos,tbl]'
 //+'\n return '+opts.start+'([])&&pos==l?[true,b(0,\''+start+'\')]:[false,pos,tbl]'
 +'}'
 +'\n'+nameline

 function ntof(name){var drop,nocache,idx
  drop=opts.drop.indexOf(name)>-1
  nocache=opts.nocache.indexOf(name)>-1
  idx=names.indexOf(name)
  return 'function '+name
  + (drop?'()'
         :'(a)')
  + '{'
  + (drop&&nocache?''
      :drop?'var x,p=pos;'
        :nocache?'var c=[],p=pos;'
          :'var x,p=pos,c;')
  + (nocache?''
            :'if(x=tbl[p]['+idx+']){'
             + 'pos=x[1];'
             +  (opts.profile?'profile_log.push([1,\''+name+'\']);'
                             :'')
             +  (drop?''
                     :'a.push([p,'+idx+']);')
             +  'return 1}'
             + 'if(x==false){'
             +  (opts.profile?'profile_log.push([2,\''+name+'\']);'
                             :'')
             +  'return 0}')
  + (drop||nocache?''
                  :'c=[];')
  + (drop?nocache?'return _'+name+'([])'
                 :'if(_'+name+'([])){'
                    + 'tbl[p]['+idx+']=[true,pos];'
                    + 'return 1}return 0'
         :nocache?'if(_'+name+'(c)){'
                    + 'a.push([p,'+idx+']);'
                    + 'tbl[p]['+idx+']=[,pos,c];'
                    + 'return 1}return 0'
                 :opts.profile?'x=_'+name+'(c);'
                                +'profile_log.push([0,\''+name+'\']);'
                                +'return fin(c,p,'+idx+',x,a)'
                              :'return fin(c,p,'+idx
                                +',_'+name+'(c),a)')
  + '}'}}

function named_re_to_fdecl(ctx){return function(named_re){
 return 'var _'+named_re[0]+'='+re_to_function_v5(ctx)(named_re[1])}}

function re_to_function_v5(ctx){return function(re){
 return f(re)
 function f(re){
  switch(re[0]){
   case 0:
    return 'cs_'+cset_ref(ctx,re[1])
   case 1:
    if(!re[1].length)return 'e'
    return 'sl_'+strlit_ref(ctx,re[1])
   case 2:
    return 'q('+re[1].map(f).join(',')+')'
   case 3:
    return 'o('+re[1].map(f).join(',')+')'
   case 4:
    return 'r('+re[1]+','+re[2]+','+f(re[3])+')'
   case 5:
    return re[1]
   case 6:
    return 'n('+f(re[1])+')'
   case 7:
    return 'p('+f(re[1])+')'
   }
  return re}}
 function cset_ref(ctx,cset){var x
  function cset_test(x){return CSET.equal(x[0],cset)}
  x=first(ctx.csets,cset_test)
  if(x>-1)return x
  x=ctx.csets.length
  ctx.csets[x]=[cset,cset_f(cset,x)]
  return x}
 function first(xs,f){var i,l
  for(i=0,l=xs.length;i<l;i++){
   if(f(xs[i]))return i}
  return -1}
 function cset_f(cset,n){
  return 'function cs_'+n+'(){var c,x;'
  + 'if(pos==l)return false;'
  + 'c=g(pos);'
  + cset_to_js_v5(cset,'c','x').replace('\n',';')+';'
  + 'if(x){pos++;return true}'
  + 'return false'
  + '}'}
 function strlit_ref(ctx,str){
  function strlit_test(x){return x[0]==str}
  x=first(ctx.strlits,strlit_test)
  if(x>-1)return x
  x=ctx.strlits.length
  ctx.strlits[x]=[str,strlit_f(str,x)]
  return x}
 function strlit_f(str,n){var i,l,ret,ret2
  l=str.length
  if(l>8){
   return 'function sl_'+n+'(){'
   + 'var x=str.slice(pos,pos+' +l+ ');'
   + 'if(x=="'+escDblQuot(str)+'"){pos+='+l+';return true}'
   + 'return false'
   + '}'}
  else{
   ret=['function sl_'+n+'(){var '
   ,'p=pos;'
   ,'if(']
   ret2=[]
   for(i=0;i<l;i++)
    ret2.push('str.charCodeAt(p'+(i<l-1?'++':'')+')=='+str.charCodeAt(i))
   ret.push(ret2.join('&&'))
   ret.push('){pos+='+str.length+';return true}')
   ret.push('return false}')
   return ret.join('')}}}

function escDblQuot(s){return s.replace(/\\|"/g,"\\$&")}

function cset_to_js_v5(cset,id,id2){
 return g(cset)
 function g(cset){
  if(cset.length<196)
   return id2+'='+f(cset,false)
  return 'if('+id+'<'+cset[128]+')'
       + id2+'='+f(cset.slice(0,128))
       + '\nelse '+g(cset.slice(128))}
 function f(cset,mode){var l=cset.length,a,b,pivot
  if(!l)return mode?'1':'0'
  a=Math.ceil(l/2);b=l-a
  pivot=cset[a-1]
  return id+'<'+pivot
         +'?'+f(cset.slice(0,a-1),mode)
         +':'+f(cset.slice(a),a%2?!mode:mode)}}

function cset_to_js_v5_test(){
 return cset_to_js_v5(CSET.fromUnicodeGeneralCategory('Ll'),'c','x')}