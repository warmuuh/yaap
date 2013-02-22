function v6_named_res(result){var dict,ret,hide,warnings,st
 hide=
  ['anonymous']
 //st=showTree(result,{hide:hide})
 dict={
RuleSet:
  function(_,cn){ret=cn},

Rule:
  function(_,cn){return [cn[0][1],cn[1]]},

NonTerminal:
  function(m){return re_reference(m.text())},

OrdChoice:
  function(_,cn){return re_union(cn)},

AtomicExpr:transparent,
SeqUnit:transparent,
Replicand:transparent,
ParenthExpr:transparent,

AnyRep:
  function(_,cn){return re_rep(0,0,cn[0])},
M: function(m){return parseInt(m.text(),10)},
N: function(m){return parseInt(m.text(),10)},
MNRep:
  function(_,cn){
   if(cn.length==2)return re_rep(cn[1],cn[1],cn[0])
   else return re_rep(cn[1],cn[2],cn[0])},
Optional:
  function(_,cn){return re_rep(0,1,cn[0])},
PosRep:
  function(_,cn){return re_rep(1,0,cn[0])},

Sequence:
  function(_,cn){return re_sequence(cn)},

StrLit:
  function(m){return re_from_str(m.text().slice(1,-1))},

Epsilon:
  function(){return re_from_str('')},

NegLookahead:
  function(_,cn){return re_neg_lookahead(cn[0])},

PosLookahead:
  function(_,cn){return re_pos_lookahead(cn[0])},

PropSpec:
  function(m){return CSET.fromUnicodeGeneralCategory(m.text())},

NegativeSpec:
  function(_,cn){return CSET.complement(cn[0])},
PositiveSpec:
  function(_,cn){return cn[0]},
UnicodePropSpec:
  function(_,cn){return cn[0]},
CodePointExpr:
  function(_,cn){return cn[0]},

CharSet:
  function(_,cn){return re_from_cset(cn[0])},
CharSetUnion:
  function(_,cn){return foldl1(CSET.union,cn)},
//CharSetIntersection:
//  function(_,cn){return foldl1(CSET.intersection,cn)},
CharSetDifference:
  function(_,cn){return foldl1(CSET.difference,cn)},
CharSetExpr:transparent,
PosCharSet:
  function(_,cn){return cn[0]||CSET.nil},
NegCharSet:
  function(_,cn){return CSET.complement(cn[0]||CSET.nil)},

UPlusCodePoint:
  function(m){return parseInt(m.text().slice(2),16)},

CodePointLit:
  function(m){return cpFC(m.text())},

CodePoint:
  function(_,cn){return CSET.fromInt(cn[0])},

CodePointRange:
  function(_,cn){return CSET.fromIntRange(cn[0][0],cn[1][0])},

CodePointFrom:transparent,
CodePointTo:transparent,

warn:function(s){warnings.push(s)}

}
 warnings=[]
 treeWalker(dict,result)
 if(warnings.length)throw warnings
 return ret
 return pp(ret)+'\n\n'+pp(warnings.slice(0,8))+'\n\n'+st
 function transparent(_,cn){return cn[0]}

 // from CSET
 function cpFC(s){var hi,lo
  if(/[\uD800-\uDBFF][\uDC00-\uDFFF]/.test(s)){
   hi=s.charCodeAt(0)
   lo=s.charCodeAt(1)
   return 0x10000+(((hi&0x3FF) << 10) | (lo&0x3FF))}
  return s.charCodeAt(0)}}
