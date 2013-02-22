// N.B. not used yet, but will replace re.js and the other expr type used in the v6_codegen.

/* The expr type represents parser expressions.
 * 
 * This is a superset of regular expressions.
 * Added to the regular expressions are named references, which can create loops and can be used to define non-regular languages.
 * 
 * A single rule in a PEG consists of a rule name and an expr, which is the right hand side of the rule.
 * Named references in exprs use a string to identify the referent; typically this string will be the name of another rule in the same grammar, but resolving named references is outside the scope of the expr type itself.
 * 
 * Some operations, such as DFA generation, require that named references not be present, that the expression be regular, that certain expr types not occur, or various other restrictions.
 * 
 * Various operations on exprs are used to meet these restrictions, such as replacing string literals with sequences of single character classes, or resolving named references to flatten an expr when possible.
 * The expr type itself is a superset of these various restricted subsets, so it can be used everywhere where grammar fragments are manipulated, but some operations will throw exceptions if called with exprs of an unexpected form.
 */


/* Each kind of expr has an integer ID, a three-character name, and a full name.
 * Integer IDs can be used for the most compact representation, and the others for debugging or display.
 * More kinds may be added as necessary (e.g. if new regex syntax is supported).
 */

var expr_kinds=

// ID  short  full

[[ 0, "chr", "character class"]
,[ 1, "str", "string literal"]
,[ 2, "seq", "sequence"]
,[ 3, "ord", "ordered choice"]
,[ 4, "mnr", "m,n repetition"]
,[ 5, "ref", "named reference"]
,[ 6, "neg", "negative lookahead"]
,[ 7, "pos", "positive lookahead"]
,[ 8, "rep", "greedy repetition"]
,[ 9, "any", "union"]
]

/* The chr and str kinds are the only primitive kinds, which actually match input characters.
 * The str type can be eliminated by replacing a string literal with a sequence of character classes each of which matches a single character from the string.
 * Each of the others (except named references) contains one or more exprs, which must eventually terminate in primitive leaf expressions or named refs.
 * 
 * The ordered choice expressions have PEG ordered choice semantics, i.e. an expr of the form "e1 / e2" will test e2 only if e1 fails.
 * The "any" or union type is more generic and may be used for regex or CFG union expression semantics, where disambiguation between two possibly successful matches is unspecified or is specified by some rule outside of the grammar itself (longest match, etc).
 */