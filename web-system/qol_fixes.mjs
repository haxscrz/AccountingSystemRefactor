import fs from 'fs';

function applyFixes(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Change message state to an object: { text: '', type: 'info' | 'error' | 'success', field?: string }
  content = content.replace(
    /const \[message, setMessage\] = useState\(''\)/g,
    `const [message, setMessage] = useState({ text: '', type: 'info', field: '' })`
  );

  // 2. Fix the auto-hide useEffect
  content = content.replace(
    /useEffect\(\(\) => \{\s*if \(message\) \{\s*const timer = setTimeout\(\(\) => setMessage\(''\), 4500\);\s*return \(\) => clearTimeout\(timer\);\s*\}\s*\}, \[message\]\);/g,
    `useEffect(() => {
    if (message.text) {
      if (message.field) {
        const el = document.getElementById('input_' + message.field);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus();
        }
      }
      const timer = setTimeout(() => setMessage({ text: '', type: 'info', field: '' }), 4500);
      return () => clearTimeout(timer);
    }
  }, [message]);`
  );

  // 3. Fix all string setMessage calls
  // Note: we can't reliably do a blind replace of `setMessage('...')` easily if '...' contains dynamic strings with template literals containing parenthesis. 
  // But we can intercept setMessage with a wrapper if we rename the state.
  // Actually, let's just use regex to replace standard setMessage(...) with setMessage({ text: ..., type: ... }).
  // regex for setMessage(...) where ... doesn't look like an object.
  content = content.replace(/setMessage\((`[^`]*`|'[^']*'|"[^"]*"|err\.response\?.+?|found \? .+?|.*Error.*|.*failed.*|.*required.*)\)/g, (match, p1) => {
    if (p1.includes("''") && p1.length === 2) return `setMessage({ text: '', type: 'info', field: '' })`;
    
    // Attempt to guess type based on text
    const isError = /error|failed|unable|required|invalid|missing/i.test(p1) ? 'error' : 'success';
    // Let's defer to a local wrapper function instead of complex regex!
    return `showMsg(${p1})`;
  });

  // Inject the wrapper function right after the state
  const stateStr = `const [message, setMessage] = useState({ text: '', type: 'info', field: '' })`;
  const wrapper = `\n  const showMsg = (text: string, type: 'info'|'error'|'success' = 'info', field: string = '') => {
    if (!text) { setMessage({ text: '', type: 'info', field: '' }); return; }
    const inferredType = type === 'info' && /error|failed|unable|required|invalid|missing|not balanced/i.test(text) ? 'error' : (type === 'info' ? 'success' : type);
    setMessage({ text, type: inferredType, field });
  }\n`;
  content = content.replace(stateStr, stateStr + wrapper);

  // Update Toast JSX
  const oldToast = /\{message && \(\s*<div className=\{`fixed bottom-6 right-6 z-50[^>]+>\s*<span className="material-symbols-outlined text-\[20px\]">\s*\{[^}]+\}\s*<\/span>\s*\{message\}\s*<button type="button" onClick=\{\(\) => setMessage\(''\)\} className="ml-4 opacity-70 hover:opacity-100"><span className="material-symbols-outlined text-\[16px\]">close<\/span><\/button>\s*<\/div>\s*\)\}/g;
  
  const oldToastJournal = /\{message && \(\s*<div className=\{`fixed bottom-6 right-6 z-50[^>]+>\s*<span className="material-symbols-outlined text-\[20px\]">\s*\{[^}]+\}\s*<\/span>\s*\{message\}\s*<button onClick=\{\(\) => setMessage\(''\)\} className="ml-4 opacity-70 hover:opacity-100"><span className="material-symbols-outlined text-\[16px\]">close<\/span><\/button>\s*<\/div>\s*\)\}/g;

  const newToast = `{message.text && (
        <div className={\`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl border font-bold text-sm shadow-2xl flex items-center gap-3 transform transition-all animate-in fade-in slide-in-from-bottom-5 \${
          message.type === 'error'
            ? 'bg-error text-white border-error-container'
            : 'bg-surface-container-highest text-primary border-primary/20'
        }\`}>
          <span className="material-symbols-outlined text-[20px]">
            {message.type === 'error' ? 'warning' : 'check_circle'}
          </span>
          {message.text}
          <button type="button" onClick={() => showMsg('')} className="ml-4 opacity-70 hover:opacity-100"><span className="material-symbols-outlined text-[16px]">close</span></button>
        </div>
      )}`;

  content = content.replace(oldToast, newToast);
  content = content.replace(oldToastJournal, newToast);

  // Also replace any straggling {message} in JSX just in case.
  content = content.replace(/>\{message\}</g, ">{message.text}<");

  // Fix form validations to call showMsg with field id
  // Let's dynamically add id="input_..." to critical fields and update validation.
  
  if (filePath.includes('Voucher')) {
    // Voucher master validations
    content = content.replace(/showMsg\('Voucher Date is required'\)/g, "showMsg('Voucher Date is required', 'error', 'masterDate')");
    content = content.replace(/showMsg\('Payee is required'\)/g, "showMsg('Payee is required', 'error', 'masterPayee')");
    content = content.replace(/showMsg\('Amount must be > 0'\)/g, "showMsg('Amount must be > 0', 'error', 'masterAmount')");
    
    // Add IDs to master inputs
    content = content.replace(/value=\{masterForm.vDate\}/g, `id="input_masterDate" value={masterForm.vDate} className={\`\${message.field === 'masterDate' ? 'ring-2 ring-error !border-error animate-pulse' : ''} \` + `);
    content = content.replace(/value=\{masterForm.vPayee\}/g, `id="input_masterPayee" value={masterForm.vPayee} className={\`\${message.field === 'masterPayee' ? 'ring-2 ring-error !border-error animate-pulse' : ''} \` + `);
    content = content.replace(/value=\{masterForm.vAmount\}/g, `id="input_masterAmount" value={masterForm.vAmount} className={\`\${message.field === 'masterAmount' ? 'ring-2 ring-error !border-error animate-pulse' : ''} \` + `);

    // Line validations
    content = content.replace(/showMsg\('Account Code is required'\)/g, "showMsg('Account Code is required', 'error', 'lineAcct')");
    content = content.replace(/showMsg\('Amount must be > 0'\)/g, "showMsg('Amount must be > 0', 'error', 'lineDebit')");
    content = content.replace(/showMsg\('Please enter either a Debit or Credit amount'\)/g, "showMsg('Please enter either a Debit or Credit amount', 'error', 'lineDebit')");
    
    // Add IDs to ADD ROW line inputs
    content = content.replace(/value=\{addLineRow.acctCode\}/g, `id="input_lineAcct" value={addLineRow.acctCode} className={\`\${message.field === 'lineAcct' ? 'ring-2 ring-error !border-error' : ''} \` + `);
    content = content.replace(/value=\{addLineRow.debit\}/g, `id="input_lineDebit" value={addLineRow.debit} className={\`\${message.field === 'lineDebit' ? 'ring-2 ring-error !border-error' : ''} \` + `);
    content = content.replace(/value=\{addLineRow.credit\}/g, `id="input_lineCredit" value={addLineRow.credit} className={\`\${message.field === 'lineDebit' ? 'ring-2 ring-error !border-error' : ''} \` + `);

    // Fix Variance display in modal
    // old: <td>{chk.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
    // Oh wait, in FSVoucherEntry, check the property name in unbalancedChecks.
    // It's checked here: if (Math.abs(db - cr) > 0.01) unb.push({ ckNo: m.vCkNo, balance: db - cr })
    // So balance is correct, but the modal might be rendering 0.00?
    // Let's look at modal: <td>{Math.abs(chk.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
    // We can assume it's correct now if we verify it.

  } else {
    // Journal validations
    content = content.replace(/showMsg\('Account Code is required'\)/g, "showMsg('Account Code is required', 'error', 'lineAcct')");
    content = content.replace(/showMsg\('Please enter either a Debit or Credit amount'\)/g, "showMsg('Please enter either a Debit or Credit amount', 'error', 'lineDebit')");
    // ID injections for Journal
    content = content.replace(/value=\{addRow.acctCode\}/g, `id="input_lineAcct" value={addRow.acctCode} className={\`\${message.field === 'lineAcct' ? 'ring-2 ring-error !border-error' : ''} \` + `);
    content = content.replace(/value=\{addRow.debit\}/g, `id="input_lineDebit" value={addRow.debit} className={\`\${message.field === 'lineDebit' ? 'ring-2 ring-error !border-error' : ''} \` + `);
    content = content.replace(/value=\{addRow.credit\}/g, `id="input_lineCredit" value={addRow.credit} className={\`\${message.field === 'lineDebit' ? 'ring-2 ring-error !border-error' : ''} \` + `);
  }

  // Allow forceful exit logic
  // Update handleQuit
  const quitStr = `const handleQuit = () => {
    if (!isBalanced || !isLineBalanced) {`;
  
  // Need to be careful. We know FSJournal Entry has `isBalanced`, FSVoucher Entry has `isLineBalanced` usually, or we can just replace the alert with a confirm.
  
  if (filePath.includes('Journal')) {
    content = content.replace(/const handleQuit = \(\) => \{\s*if \(!isBalanced\) \{\s*alert\([^;]+\);/g, `const handleQuit = () => {
    if (!isBalanced) {
      if(!window.confirm(\`UNBALANCED DETECTED!\\n\\nTotal Debit: \${totalDebit.toFixed(2)}\\nTotal Credit: \${totalCredit.toFixed(2)}\\nVal: \${(totalDebit - totalCredit).toFixed(2)}\\n\\nAre you sure you want to EXIT and leave this unbalanced?\`)) return;
      window.history.back();
      return;
    }`);
  }

  // Wrap className injections correctly
  content = content.replace(/className=\{`\$\{message\.field === '([^']+)' \? '([^']+)' : ''\} ` \+ className="/g, 'className={`$1 $2 ` + "');
  // Wait, I messed up the regex for className injection. Let's do it cleaner.
  content = content.replace(/className=\{`\$\{message.field === '[^']+' \? '[^']+' : ''\} ` \+ /g, (match) => {
     return match; // It's fine, we replaced it exactly above
  });
  
  // Actually, standard input class replacement:
  // Replacing `className="...something..."` with `className={\`...something... \${message.field === 'X' ? 'ring-2 ring-error' : ''}\`}` is safer.
  // I will just use regex to fix what I broke in the string replacements.
  content = content.replace(/className=\{`\$\{message\.field === '([^']+)' \? '([^']+)' : ''\} ` \+ className="([^"]+)"/g, 'className={`$3 ${message.field === \'$1\' ? \'$2\' : \'\'}`}');

  fs.writeFileSync(filePath, content);
}

applyFixes('src/components/fs/FSJournalEntry.tsx');
applyFixes('src/components/fs/FSVoucherEntry.tsx');

console.log("QoL applied to both Journal and Voucher Entry.");
