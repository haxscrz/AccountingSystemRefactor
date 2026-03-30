const fs = require('fs');
let t = fs.readFileSync('src/components/fs/FSVoucherEntry.tsx', 'utf8');

// Fix broken input element - the className attribute was string-concatenated with list attribute on wrong line
const broken = `id="input_lineAcct" value={addLineRow.acctCode} className={\`\${message.field === 'lineAcct' ? 'ring-2 ring-error !border-error animate-pulse' : ''} \` + \r\n                            list="voucher-account-list"`;
const fixed = `id="input_lineAcct"\r\n                            className={message.field === 'lineAcct' ? 'ring-2 ring-error !border-error animate-pulse' : ''}\r\n                            value={addLineRow.acctCode}\r\n                            list="voucher-account-list"`;

if (t.includes('id="input_lineAcct" value={addLineRow.acctCode}')) {
  // Use a regex to find and fix the broken pattern
  t = t.replace(
    /id="input_lineAcct" value=\{addLineRow\.acctCode\} className=\{`\$\{message\.field === 'lineAcct' \? 'ring-2 ring-error !border-error animate-pulse' : ''\} ` \+ \r?\n\s*list="voucher-account-list"/,
    'id="input_lineAcct"\n                            className={message.field === \'lineAcct\' ? \'ring-2 ring-error !border-error animate-pulse\' : \'\'}\n                            value={addLineRow.acctCode}\n                            list="voucher-account-list"'
  );
  fs.writeFileSync('src/components/fs/FSVoucherEntry.tsx', t);
  console.log('Fixed the broken input attribute!');
} else {
  console.log('Pattern not found - may already be fixed');
}
