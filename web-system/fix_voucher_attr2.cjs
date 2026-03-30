const fs = require('fs');
let t = fs.readFileSync('src/components/fs/FSVoucherEntry.tsx', 'utf8');

// Fix all broken className + string concat patterns from the old fix_voucher.mjs
// Pattern: className={`${...} ` +  \n  someAttr="..." 
// Should be: className={...} \n  someAttr="..."

t = t.replace(
  /id="input_lineDebit" value=\{addLineRow\.debit\} className=\{`\$\{message\.field === 'lineDebit' \? 'ring-2 ring-error !border-error' : ''\} ` \+ \r?\n\s*onFocus/,
  'id="input_lineDebit"\n                          className={message.field === \'lineDebit\' ? \'ring-2 ring-error !border-error\' : \'\'}\n                          value={addLineRow.debit}\n                          onFocus'
);

t = t.replace(
  /id="input_lineCredit" value=\{addLineRow\.credit\} className=\{`\$\{message\.field === 'lineCredit' \? 'ring-2 ring-error !border-error' : ''\} ` \+ \r?\n\s*onFocus/,
  'id="input_lineCredit"\n                          className={message.field === \'lineCredit\' ? \'ring-2 ring-error !border-error\' : \'\'}\n                          value={addLineRow.credit}\n                          onFocus'
);

fs.writeFileSync('src/components/fs/FSVoucherEntry.tsx', t);
console.log('Fixed debit and credit broken className attrs!');
