function parseTMProg(text){var lines,rule,rules=[],rulesets=[]
 lines=text.split('\n').filter(notEmpty)
 lines.forEach(function(l){
  if(/^\s/.test(l)){
   rule.ops.push(parseTMOp(l,rule))
  }else if(l==';'){
   if(rule)rules.push(rule);rule=0
   rulesets.push(rules)
   rules=[]
  }else{
   if(rule)rules.push(rule)
   rule={sel:modelStructSel(l),ops:[],bindings:[]}
  }})
 if(rule)rules.push(rule)
 if(rules.length)rulesets.push(rules)
 return rulesets}

function parseTMOp(text,rule){var tokens,op
 tokens=text.split(/\s+/).filter(notEmpty)
 if(tokens[0] == 'del' || tokens[0] == 'elide')
  return [tokens[0]]
 if(tokens[1] == '≔')
  return ['define',tokens[0],parseAttrExpr(tokens.slice(2),rule)]
 throw Error('can\'t parse '+text)}

function notEmpty(s){return !!s.length}

function parseAttrExpr(tokens,rule){
 if(tokens.length==1) return fixupTok(rule)(tokens[0]);
 return tokens[0]+'('+['opts'].concat(tokens.slice(1).map(fixupTok(rule))).join(',')+')'}

function fixupTok(rule){return function(t){var i,l,skel
 ,n=t.split('.')[0]
 ,attr=t.split('.')[1]
 for(i=0,l=rule.sel.key.length;i<l,skel=rule.sel.key[i];i++){
  if(skel[0].match(RegExp(n+'$'))){
   n=(n?skel[0]:'node')
   if(attr=='match') t='_get_match('+n+')'
   else if(attr=='start') t=n+'.start'
   else if(attr=='end') t=n+'.end'
   else t=n+'.'+attr+'()'
   addBinding(rule.bindings,skel)
   return t}}
 if(t=='children')return t
 throw Error('bad node reference: "'+n+'"')}}

function addBinding(bindings,skel){var i,l
 for(i=0,l=bindings.length;i<l;i++)
  if(bindings[i][0]==skel[0]) return
 bindings.push(skel)}

function showAST(prog){return pp(prog)}