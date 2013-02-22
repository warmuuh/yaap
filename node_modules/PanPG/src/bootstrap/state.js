function State(str){var l=str.length+1
 this._str=str
 this.pos=0
 this.tbl=[]
 while(l--)this.tbl.push({})
 /*this.log=log.create()
 this.log.timing=true*/}

/* str() returns the string at the current position */

State.prototype.str=function(){
 return this._str.slice(this.pos)}

/* adv() advances the current position by the integer argument and returns the new position. */

State.prototype.adv=function(n){return this.pos+=n}

State.prototype.checkpoint=function(){return [this.pos]}

State.prototype.restore=function(cp){this.pos=cp[0]}

/* result table lookup and insertion */

State.prototype.pre=function(ruleName,p){
 var ret=this.tbl[this.pos][ruleName]
 if(ret===undefined){
  /*this.log('RT miss: '+ruleName+' '+this.pos);*/return[ruleName,this.pos]}
 //this.log('RT hit: '+ruleName+' '+this.pos)
 if(ret){
  if(p)this.tbl[this.pos][ruleName][2]=p
  this.pos=ret[1]
  return true}
 return false}

State.prototype.fin=function(a,p,result){
 this.tbl[a[1]][a[0]]=
  result?
   p?[true,this.pos,p]
    :[true,this.pos]
  :false
 //this.log('fin: '+a.toString()+uneval(p))
 return result}