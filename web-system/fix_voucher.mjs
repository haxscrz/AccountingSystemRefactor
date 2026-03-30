import fs from 'fs';

let text = fs.readFileSync('src/components/fs/FSVoucherEntry.tsx', 'utf8');

// 1. Messaging system & Unbalanced modal
text = text.replace("const [message, setMessage] = useState('')", "const [message, setMessage] = useState({ text: '', type: 'info', field: '' })\n  \n  const showMsg = (text: string, type = 'info', field = '') => {\n    if (!text) { setMessage({ text: '', type: 'info', field: '' }); return; }\n    const inferredType = type === 'info' && /error|failed|unable|required|invalid|missing|not balanced/i.test(text) ? 'error' : (type === 'info' ? 'success' : type);\n    setMessage({ text, type: inferredType, field });\n  }\n\n  useEffect(() => {\n    if (message.text) {\n      if (message.field) {\n        const el = document.getElementById('input_' + message.field);\n        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }\n      }\n      const timer = setTimeout(() => setMessage({ text: '', type: 'info', field: '' }), 4500);\n      return () => clearTimeout(timer);\n    }\n  }, [message]);");

text = text.replace(/setMessage\((`[^`]*`|'[^']*'|"[^"]*"|err.*|.*Error.*)\)/g, (m, p1) => `showMsg(${p1})`);

text = text.replace("const handleQuit = () => {\n    if (!isLineBalanced) {\n      setShowUnbalanced(true);\n      return;\n    }\n    window.history.back()\n  }", "const handleQuit = () => {\n    if (!isLineBalanced) {\n      setShowUnbalanced(true);\n      return;\n    }\n    window.history.back();\n  }");

const oldModalBtns = '<div style={{ marginTop: \'20px\', display: \'flex\', justifyContent: \'flex-end\' }}>\n            <button type="button" onClick={() => setShowUnbalanced(false)} style={{ padding: \'6px 12px\' }}>\n              Return to Fix\n            </button>\n          </div>';
const newModalBtns = '<div className="bg-surface px-6 py-4 border-t border-outline-variant/20 flex justify-between gap-3 items-center">\n            <button onClick={() => window.history.back()} className="px-5 py-2.5 bg-error/10 hover:bg-error/20 text-error font-bold text-sm rounded-lg transition-colors border border-error/20 flex items-center gap-2">\n              <span className="material-symbols-outlined text-[18px]">logout</span> Force Exit Anyway\n            </button>\n            <button onClick={() => setShowUnbalanced(false)} className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white shadow-sm font-bold text-sm rounded-lg transition-colors">\n              Return to Fix\n            </button>\n          </div>';
text = text.replace(oldModalBtns, newModalBtns);

const oldToastMsg = '{message && (\n        <div style={{ padding: \'10px\', marginBottom: \'15px\', backgroundColor: \'#e0e0e0\', border: \'1px solid #999\' }}>\n          <strong>System Message:</strong> {message}\n        </div>\n      )}';
const newToastMsg = '{message.text && (\n        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl border font-bold text-sm shadow-2xl flex items-center gap-3 transform transition-all animate-in fade-in slide-in-from-bottom-5 ${ message.type === \'error\' ? \'bg-error text-white border-error-container\' : \'bg-surface-container-highest text-primary border-primary/20\' }`}>\n          <span className="material-symbols-outlined text-[20px]">\n            {message.type === \'error\' ? \'warning\' : \'check_circle\'}\n          </span>\n          {message.text}\n          <button type="button" onClick={() => showMsg(\'\')} className="ml-4 opacity-70 hover:opacity-100"><span className="material-symbols-outlined text-[16px]">close</span></button>\n        </div>\n      )}';
text = text.replace(oldToastMsg, newToastMsg);

text = text.replace(/\{\/\* Status message \*\/\}\s*\{message && \(\s*<div style=\{\{[\s\S]*?\}\}\>\s*\{message\}\s*<\/div>\s*\)\}/, '');

// ID inputs
text = text.replace(/<input\s*style=\{\{\s*width:\s*'140px'\s*\}\}\s*value=\{masterForm\.vDate\}/, `<input style={{ width: '140px' }} id="input_masterDate" className={message.field === 'masterDate' ? 'ring-2 ring-error !border-error animate-pulse' : ''} value={masterForm.vDate}`);
text = text.replace(/<input\s*style=\{\{\s*width:\s*'300px',\s*textTransform:\s*'uppercase'\s*\}\}\s*placeholder="Payee Name"\s*value=\{masterForm\.vPayee\}/, `<input style={{ width: '300px', textTransform: 'uppercase' }} id="input_masterPayee" placeholder="Payee Name" className={message.field === 'masterPayee' ? 'ring-2 ring-error !border-error animate-pulse' : ''} value={masterForm.vPayee}`);
text = text.replace(/<input\s*type="number"\s*style=\{\{\s*width:\s*'140px',\s*textAlign:\s*'right'\s*\}\}\s*value=\{masterForm\.vAmount\}/, `<input type="number" style={{ width: '140px', textAlign: 'right' }} id="input_masterAmount" className={message.field === 'masterAmount' ? 'ring-2 ring-error !border-error animate-pulse' : ''} value={masterForm.vAmount}`);

text = text.replace(/<input\s*style=\{\{\s*\.\.\.lineInput\('#86efac'\),\s*textAlign:\s*'left',\s*width:\s*'70px',\s*fontFamily:\s*'monospace'\s*\}\}\s*placeholder="ACCT"\s*list="voucher-account-list"\s*onChange=\{e => setAddLineRow\(x => \(\{\s*\.\.\.x,\s*acctCode:/,
   `<input style={{ ...lineInput('#86efac'), textAlign: 'left', width: '70px', fontFamily: 'monospace' }} placeholder="ACCT" id="input_lineAcct" className={\`\${message.field === 'lineAcct' ? 'ring-2 ring-error !border-error animate-pulse' : ''}\`} list="voucher-account-list" onChange={e => setAddLineRow(x => ({ ...x, acctCode:`);

text = text.replace(/<input\s*type="number"\s*style=\{\{\s*\.\.\.lineInput\('#86efac'\)\s*\}\}\s*value=\{addLineRow\.debit\}/, `<input type="number" style={{ ...lineInput('#86efac') }} id="input_lineDebit" className={\`\${message.field === 'lineDebit' ? 'ring-2 ring-error !border-error' : ''}\`} value={addLineRow.debit}`);
text = text.replace(/<input\s*type="number"\s*style=\{\{\s*\.\.\.lineInput\('#86efac'\)\s*\}\}\s*value=\{addLineRow\.credit\}/, `<input type="number" style={{ ...lineInput('#86efac') }} id="input_lineCredit" className={\`\${message.field === 'lineCredit' ? 'ring-2 ring-error !border-error' : ''}\`} value={addLineRow.credit}`);

// String overrides
text = text.replace(/showMsg\('Voucher Date is required'\)/g, "showMsg('Voucher Date is required', 'error', 'masterDate')");
text = text.replace(/showMsg\('Payee is required'\)/g, "showMsg('Payee is required', 'error', 'masterPayee')");
text = text.replace(/showMsg\('Amount must be > 0'\)/g, "showMsg('Amount must be > 0', 'error', 'masterAmount')");
text = text.replace(/showMsg\('Account Code is required'\)/g, "showMsg('Account Code is required', 'error', 'lineAcct')");
text = text.replace(/showMsg\('Please enter either a Debit or Credit amount'\)/g, "showMsg('Please enter either a Debit or Credit amount', 'error', 'lineDebit')");

fs.writeFileSync('src/components/fs/FSVoucherEntry.tsx', text);
console.log("Rewrite completed successfully!");
