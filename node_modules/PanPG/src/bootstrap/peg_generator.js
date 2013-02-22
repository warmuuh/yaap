/* Here we take PEG.peg, which is the full description of the supported PEG grammar written in the minimal subset defined by peg_minimal.peg.  From this and the handwritten peg_minimal parser and code generator, we generate a parser for the full PEG language.  This output becomes the file peg_generated.js. */

function peg_generator(peg_peg,n2_body){var ret
 ,n2_ast=parseTMProg(n2_body)
 ,peg_peg_tree=tree(p_RuleSet,peg_peg)
 if(peg_peg_tree[0]==false) return 'no parse'
 ret=applyTMProg(n2_ast,'{prefix:"p_PEG_"}',peg_peg_tree[1],peg_peg,'match_code')
 return ret}