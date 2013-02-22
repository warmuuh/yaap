function empty(){return true}

function strLit(str){return re(RegExp('^'+reEsc(str)))}

function reEsc(s){return s.replace(/[\^$\\\/.*+?()[\]{}|]/g,'\\$&')}

/* re() takes a regex and returns a parser function which succeeds, and advances the point, iff the regex matches. 

We assume a state implementation (the s object) which provides a str() function which returns the string at the current point, and an adv() function which advances the point by some integer. */

function re(r){return function(s){var m
 m=r.exec(s.str())
 if(!m) return false
 s.adv(m[0].length);return true}}

/* ordChoice is a combinator which takes n functions, and returns a function f which tries each in turn.  If any of the n functions succeeds, f succeeds, otherwise f fails and consumes no input. */

function ordChoice(){var args=arguments
 return function(s,p){var i,l
  for(i=0,l=args.length;i<l;i++)
   if(args[i](s,p))return true
  return false}}

/* seq() takes n parse function arguments and returns a parse function which succeeds iff each of them succeeds on sequential substrings of the input */

/* We require the state object to implement checkpoint() and restore() operations which allow abandoning an unsuccessful sequence even after a successful match at the beginning. */

function seq(){var args=arguments
 return function(s,p){var i,l,cp
  cp=s.checkpoint()
  for(i=0,l=args.length;i<l;i++)
   if(!args[i](s,p)){s.restore(cp);return false}
  return true}}

/* rep() takes integers m,n ≥ 0 and a single parse function f.  It returns a parse function which succeeds iff f succeeds at least m times, and up to n times, or, if n is 0, any number of times. */

function rep(m,n,f){return function(s,p){var cp,i=0
 cp=s.checkpoint()
 while(i<m){
  i++
  if(!f(s,p)){s.restore(cp);return false}}
 while(i++<n || n==0)
  if(!f(s,p))return true
 return true}}

/* peek() takes a parse function f and returns a parse function which succeeds iff f succeeds, but does not consume any input in any case. */

function peek(f){return function(s,p){var cp,ret
 cp=s.checkpoint()
 ret=f(s,p) // passing the parent may give confusing results…
 s.restore(cp)
 return ret}}

/* negPeek() takes a parse function f and returns a parse function which succeeds iff f fails, but does not consume any input in any case. */

function negPeek(f){return function(s,p){var cp,ret
 cp=s.checkpoint()
 ret=f(s,p)
 s.restore(cp)
 return !ret}}