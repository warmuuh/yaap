/* handwritten parser for a subset of PEG grammar definitions, as well as a test case for the parsing approach.

The subset parsed is the subset used by peg.peg.  The code here, when run on peg.peg, should be able to produce a parse tree which will in turn allow the code generator to produce code which supercedes this. */

/*
RuleSet           ← Rule (LB+ Rule)*
                  / ϵ
*/

function p_RuleSet(s,p){var c=s.pre('RuleSet',p);if(typeof c=='boolean')return c;return s.fin(c,p,
 ordChoice(
  seq(
   p_Rule,
   rep(0,0,
    seq(
     rep(1,0,p_LB),
     p_Rule))),
  empty)(s,c)
)}

/*
Rule              ← NonTerminal S "←" S OrdChoice
*/

function p_Rule(s,p){var c=s.pre('Rule',p);if(typeof c=='boolean')return c;return s.fin(c,p,
 seq(
  p_NonTerminal,
  p_S,
  strLit('←'),
  p_S,
  p_OrdChoice)(s,c)
)}

/*
NonTerminal       ← IdentStartChar IdentChar*
*/

function p_NonTerminal(s,p){var c=s.pre('NonTerminal',p);if(typeof c=='boolean')return c;return s.fin(c,p,
 re(/^[A-Z][a-zA-Z0-9_]*/)(s,c)
)}

function p_S(s,p){var c=s.pre('S',p);if(typeof c=='boolean')return c;return s.fin(c,p,
 re(/^(\n | )+/)(s,c)
)}

/*
OrdChoice         ← S? Sequence S? ("/" S? Sequence S?)*
*/

function p_OrdChoice(s,p){var c=s.pre('OrdChoice',p);if(typeof c=='boolean')return c;return s.fin(c,p,
 seq(
  rep(0,1,
   p_S),
  p_Sequence,
  rep(0,1,
   p_S),
  rep(0,0,
   seq(
    strLit('/'),
    rep(0,1,
     p_S),
    p_Sequence,
    rep(0,1,
     p_S))))(s,c)
)}

/*
Sequence          ← (SeqUnit S?)+
*/

function p_Sequence(s,p){var c=s.pre('Sequence',p);if(typeof c=='boolean')return c;return s.fin(c,p,
 rep(1,0,
  seq(
   p_SeqUnit,
   rep(0,1,
    p_S)))(s,c)
)}

/*
SeqUnit           ← AnyRep
                  / PosRep
                  / MNRep
                  / Optional
                  / ParenthExpr
                  / AtomicExpr
*/

function p_SeqUnit(s,p){var c=s.pre('SeqUnit',p);if(typeof c=='boolean')return c;return s.fin(c,p,
 ordChoice(
  p_AnyRep,
  p_PosRep,
  p_MNRep,
  p_Optional,
  p_ParenthExpr,
  p_AtomicExpr)(s,c)
)}

/*
AnyRep            ← Replicand "*"

PosRep            ← Replicand "+"

MNRep             ← Replicand "{" [0-9]* "," [0-9]* "}"

Optional          ← Replicand "?"

ParenthExpr       ← "(" OrdChoice ")"

AtomicExpr        ← Empty / CharSet / NonTerminal / StrLit
*/

function p_AnyRep(s,p){var c=s.pre('AnyRep',p);if(typeof c=='boolean')return c;return s.fin(c,p,
 seq(
  p_Replicand,
  strLit('*')
 )(s,c)
)}

function p_PosRep(s,p){var c=s.pre('PosRep',p);if(typeof c=='boolean')return c;return s.fin(c,p,
 seq(
  p_Replicand,
  strLit('+')
 )(s,c)
)}

function p_M(s,p){var c=s.pre('M',p);if(typeof c=='boolean')return c;return s.fin(c,p,
 re(/^[0-9]*/)(s,c)
)}

function p_N(s,p){var c=s.pre('N',p);if(typeof c=='boolean')return c;return s.fin(c,p,
 re(/^[0-9]*/)(s,c)
)}

function p_MNRep(s,p){var c=s.pre('MNRep',p);if(typeof c=='boolean')return c;return s.fin(c,p,
 seq(
  p_Replicand,
  strLit('{'),
  p_M,
  strLit(','),
  p_N,
  strLit('}'))(s,c)
)}

function p_Optional(s,p){var c=s.pre('Optional',p);if(typeof c=='boolean')return c;return s.fin(c,p,
 seq(
  p_Replicand,
  strLit('?')
 )(s,c)
)}

function p_ParenthExpr(s,p){var c=s.pre('ParenthExpr',p);if(typeof c=='boolean')return c;return s.fin(c,p,
 seq(
  strLit('('),
  p_OrdChoice,
  strLit(')'))(s,c)
)}

function p_AtomicExpr(s,p){var c=s.pre('AtomicExpr',p);if(typeof c=='boolean')return c;return s.fin(c,p,
 ordChoice(
  p_Empty,
  p_CharSet,
  p_NonTerminal,
  p_StrLit)(s,c)
)}

/*
Replicand         ← ParenthExpr
                  / AtomicExpr
*/

function p_Replicand(s,p){var c=s.pre('Replicand',p);if(typeof c=='boolean')return c;return s.fin(c,p,
 ordChoice(
  p_ParenthExpr,
  p_AtomicExpr)(s,c)
)}

function p_Empty(s,p){var c=s.pre('Empty',p);if(typeof c=='boolean')return c;return s.fin(c,p,
 strLit('ϵ')(s,c)
)}

/*
CharSet           ← "[" S? ( CharSetExpr / ϵ ) "]"
*/

function p_CharSet(s,p){var c=s.pre('CharSet',p);if(typeof c=='boolean')return c;return s.fin(c,p,
 ordChoice(
  p_NegCharSet,
  p_PosCharSet)(s,c)
)}

function p_PosCharSet(s,p){var c=s.pre('PosCharSet',p);if(typeof c=='boolean')return c;return s.fin(c,p,
 seq(
  strLit('['),
  rep(0,1,p_S),
  ordChoice(
   p_CharSetExpr,
   empty),
  strLit(']'))(s,c)
)}

function p_NegCharSet(s,p){var c=s.pre('NegCharSet',p);if(typeof c=='boolean')return c;return s.fin(c,p,
 seq(
  strLit('[^'),
  rep(0,1,p_S),
  ordChoice(
   p_CharSetExpr,
   empty),
  strLit(']'))(s,c)
)}

/*
StrLit            ← '"' ( CharEscape / [^"\] )* '"'
*/

function p_StrLit(s,p){var c=s.pre('StrLit',p);if(typeof c=='boolean')return c;return s.fin(c,p,
 seq(
  strLit('"'),
  rep(0,0,
   ordChoice(
    p_CharEscape,
    re(/^[^"\\]/))),
  strLit('"'))(s,c)
)}

/*
CharEscape        ← "\\u" HEXDIG{4}
                  / '\\' [ f n r t v U+005D ]
*/

function p_CharEscape(s,p){var c=s.pre('CharEscape',p);if(typeof c=='boolean')return c;return s.fin(c,p,
 re(/^\\u[a-fA-F0-9]{4}|^\\[fnrtv]/)(s,c))}

/*
CharSetExpr       ← CharSetDifference S?
*/

function p_CharSetExpr(s,p){var c=s.pre('CharSetExpr',p);if(typeof c=='boolean')return c;return s.fin(c,p,
 seq(
  p_CharSetDifference,
  rep(0,1,p_S))(s,c)
)}

/*
CharSetDifference ← CharSetIntersection (S 'U+2212 MINUS SIGN' S CharSetIntersection)*
*/

function p_CharSetDifference(s,p){var c=s.pre('CharSetDifference',p);if(typeof c=='boolean')return c;return s.fin(c,p,
 seq(
  p_CharSetIntersection,
  rep(0,0,
   seq(
    rep(0,0,p_S),
    re(/^\u2212/),
    rep(0,0,p_S),
    p_CharSetIntersection)))(s,c)
)}

/*
CharSetIntersection ← CharSetUnion (S? "∩" S? CharSetUnion)*
*/

function p_CharSetIntersection(s,p){var c=s.pre('CharSetIntersection',p);if(typeof c=='boolean')return c;return s.fin(c,p,
 seq(
  p_CharSetUnion,
  rep(0,0,
   seq(
    rep(0,1,p_S),
    strLit('∩'),
    rep(0,1,p_S),
    p_CharSetUnion)))(s,c)
)}

/*
CharSetUnion      ← ( CodePointExpr S? )+
*/

function p_CharSetUnion(s,p){var c=s.pre('CharSetUnion',p);if(typeof c=='boolean')return c;return s.fin(c,p,
 rep(1,0,
  seq(
   p_CodePointExpr,
   rep(0,1,p_S)))(s,c)
)}

/*
CodePointExpr     ← UnicodePropSpec
                  / CodePointRange
                  / CodePoint
*/

function p_CodePointExpr(s,p){var c=s.pre('CodePointExpr',p);if(typeof c=='boolean')return c;return s.fin(c,p,
 ordChoice(
  p_UnicodePropSpec,
  p_CodePointRange,
  p_CodePoint)(s,c)
)}

/*
CodePoint         ← UPlusCodePoint
                  / [ [:Any:] − [:space:] − U+005D ]
*/

function p_CodePoint(s,p){var c=s.pre('CodePoint',p);if(typeof c=='boolean')return c;return s.fin(c,p,
 ordChoice(
  p_UPlusCodePoint,
  p_CodePointLit)(s,c)
)}

function p_CodePointLit(s,p){var c=s.pre('CodePointLit',p);if(typeof c=='boolean')return c;return s.fin(c,p,
 re(/^[^ \]\u2212]/)(s,c)
)}

/*
UPlusCodePoint    ← "U+" HEXDIG{4,6}
*/

function p_UPlusCodePoint(s,p){var c=s.pre('UPlusCodePoint',p);if(typeof c=='boolean')return c;return s.fin(c,p,
 seq(
  strLit('U+'),
  re(/^[0-9a-fA-F]{4,6}/))(s,c)
)}

/*
CodePointRange    ← CodePoint "-" CodePoint
*/

function p_CodePointFrom(s,p){var c=s.pre('CodePointFrom',p);if(typeof c=='boolean')return c;return s.fin(c,p,
 p_CodePoint(s,c)
)}

function p_CodePointTo(s,p){var c=s.pre('CodePointTo',p);if(typeof c=='boolean')return c;return s.fin(c,p,
 p_CodePoint(s,c)
)}

function p_CodePointRange(s,p){var c=s.pre('CodePointRange',p);if(typeof c=='boolean')return c;return s.fin(c,p,
 seq(
  p_CodePointFrom,
  strLit('-'),
  p_CodePointTo)(s,c)
)}

/*
UnicodePropSpec   ← PositiveSpec / NegativeSpec

PositiveSpec      ← "[:"  PropSpec ":]"
NegativeSpec      ← "[:^" PropSpec ":]"
*/

function p_UnicodePropSpec(s,p){var c=s.pre('UnicodePropSpec',p);if(typeof c=='boolean')return c;return s.fin(c,p,
 ordChoice(
  p_PositiveSpec,
  p_NegativeSpec)(s,c)
)}

function p_PositiveSpec(s,p){var c=s.pre('PositiveSpec',p);if(typeof c=='boolean')return c;return s.fin(c,p,
 seq(
  strLit('[:'),
  p_PropSpec,
  strLit(':]'))(s,c)
)}

function p_NegativeSpec(s,p){var c=s.pre('NegativeSpec',p);if(typeof c=='boolean')return c;return s.fin(c,p,
 seq(
  strLit('[:^'),
  p_PropSpec,
  strLit(':]'))(s,c)
)}

/*
PropSpec          ← BinaryUnicodeProperty
                  / UnicodeProperty ("=" / "≠") PropVal
                  / ScriptOrCatPropVal ("|" ScriptOrCatPropVal)*

PropVal           ← UnicodePropVal ("|" UnicodePropVal)*
*/

function p_PropSpec(s,p){var c=s.pre('PropSpec',p);if(typeof c=='boolean')return c;return s.fin(c,p,
 ordChoice(
  strLit('Zs'),
  strLit('XXX FIXME'))(s,c)
)}

function p_LB(s,p){var c=s.pre('LB',p);if(typeof c=='boolean')return c;return s.fin(c,p,
 re(/^(\n|\r\n|\r)/)(s,c)
)}