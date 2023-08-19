
// export default class DamageRoll extends Roll {
//     constructor(formula, data, options) {
//         super(formula, data, options);
//     }

//     configureDamage() {
//         let flatBonus = 0;
//         for (let [i, term] of this.terms.entries()) {

//             // Multiply dice terms
//             if (term instanceof DiceTerm) {
//                 term.options.baseNumber = term.options.baseNumber ?? term.number; // Reset back
//                 term.number = term.options.baseNumber;
//                 if (this.isCritical) {
//                     let cm = this.options.criticalMultiplier ?? 2;

//                     // Powerful critical - maximize damage and reduce the multiplier by 1
//                     if (this.options.powerfulCritical) {
//                         flatBonus += (term.number * term.faces);
//                         cm = Math.max(1, cm - 1);
//                     }

//                     // Alter the damage term
//                     let cb = (this.options.criticalBonusDice && (i === 0)) ? this.options.criticalBonusDice : 0;
//                     term.alter(cm, cb);
//                     term.options.critical = true;
//                 }

//             }

//             // Multiply numeric terms
//             else if (this.options.multiplyNumeric && (term instanceof NumericTerm)) {
//                 term.options.baseNumber = term.options.baseNumber ?? term.number; // Reset back
//                 term.number = term.options.baseNumber;
//                 if (this.isCritical) {
//                     term.number *= (this.options.criticalMultiplier ?? 2);
//                     term.options.critical = true;
//                 }
//             }
//         }

//         // Add powerful critical bonus
//         if (this.options.powerfulCritical && (flatBonus > 0)) {
//             this.terms.push(new OperatorTerm({ operator: "+" }));
//             this.terms.push(new NumericTerm({ number: flatBonus }, { flavor: 'PowerfulCritical' }));
//         }

//         // Add extra critical damage term
//         if (this.isCritical && this.options.criticalBonusDamage) {
//             const extra = new Roll(this.options.criticalBonusDamage, this.data);
//             if (!(extra.terms[0] instanceof OperatorTerm)) this.terms.push(new OperatorTerm({ operator: "+" }));
//             this.terms.push(...extra.terms);
//         }

//         // Re-compile the underlying formula
//         this._formula = this.constructor.getFormula(this.terms);
//     }
// }  