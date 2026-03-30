import fs from 'fs';

let content = fs.readFileSync('src/components/fs/FSVoucherEntry.tsx', 'utf8');

// 1. Ribbon border
content = content.replace(
  /className="sticky top-0 z-40 -mt-2 mb-6 p-3 bg-surface-container-lowest\/85 backdrop-blur-xl border border-outline-variant\/30 rounded-2xl shadow-\[0_8px_24px_var\(--shadow-color\)]/g,
  'className="sticky top-0 z-40 -mt-2 mb-6 p-3 bg-surface-container-lowest/95 backdrop-blur-xl border border-outline-variant/50 rounded-2xl shadow-xl'
);

// 2. Table rows
content = content.replace(
  /className="hover:bg-primary\/5 even:bg-black\/\[0\.02\] dark:even:bg-white\/\[0\.02\] group transition-colors cursor-pointer border-none"/g,
  'className="hover:bg-primary/5 even:bg-surface-container-lowest/50 group transition-colors cursor-pointer border-b border-outline-variant/20"'
);

// 3. Line Actions (opacity)
content = content.replace(
  /className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"/g,
  'className="flex justify-center gap-2 text-on-surface-variant"'
);

// 4. Transform Toast for Voucher Entry
const msgBlock = `{message && (
        <div className={\`px-4 py-3 rounded-lg border-l-4 font-medium text-sm shadow-sm flex items-center gap-2 \${
          message.includes('Error') || message.includes('failed')
            ? 'bg-error-container text-on-error-container border-error'
            : 'bg-emerald-50 text-emerald-800 border-emerald-500'
        }\`}>
          <span className="material-symbols-outlined text-[18px]">
            {message.includes('Error') || message.includes('failed') ? 'error' : 'check_circle'}
          </span>
          {message}
        </div>
      )}`;

const toastBlock = `{message && (
        <div className={\`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl border font-bold text-sm shadow-2xl flex items-center gap-3 transform transition-all animate-in fade-in slide-in-from-bottom-5 \${
          message.toLowerCase().includes('error') || message.toLowerCase().includes('failed') || message.toLowerCase().includes('unable')
            ? 'bg-error text-white border-error-container'
            : 'bg-surface-container-highest text-primary border-primary/20'
        }\`}>
          <span className="material-symbols-outlined text-[20px]">
            {message.toLowerCase().includes('error') || message.toLowerCase().includes('failed') || message.toLowerCase().includes('unable') ? 'warning' : 'check_circle'}
          </span>
          {message}
          <button type="button" onClick={() => setMessage('')} className="ml-4 opacity-70 hover:opacity-100"><span className="material-symbols-outlined text-[16px]">close</span></button>
        </div>
      )}`;

content = content.replace(msgBlock, toastBlock);

// 5. Add Auto-hide useEffect to FSVoucherEntry
// Search for component start and insert
const searchStr = `  const [message, setMessage] = useState('')`;
const replaceStr = `  const [message, setMessage] = useState('')

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 4500);
      return () => clearTimeout(timer);
    }
  }, [message]);`;

if (!content.includes('clearTimeout(timer)')) {
    content = content.replace(searchStr, replaceStr);
}

fs.writeFileSync('src/components/fs/FSVoucherEntry.tsx', content);
console.log("Voucher Entry UI synced with Feedback.");
