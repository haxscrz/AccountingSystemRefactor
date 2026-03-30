import fs from 'fs';

let text = fs.readFileSync('src/components/fs/FSJournalEntry.tsx', 'utf8');

text = text.replace("const [message, setMessage] = useState('')", "const [message, setMessage] = useState({ text: '', type: 'info', field: '' })\n  const showMsg = (text: string, type = 'info', field = '') => {\n    if (!text) { setMessage({ text: '', type: 'info', field: '' }); return; }\n    const inferredType = type === 'info' && /error|failed|unable|required|invalid|missing|Please/i.test(text) ? 'error' : (type === 'info' ? 'success' : type);\n    setMessage({ text, type: inferredType, field });\n  }\n\n  useEffect(() => {\n    if (message.text) {\n      if (message.field) {\n        const el = document.getElementById('input_' + message.field);\n        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }\n      }\n      const timer = setTimeout(() => setMessage({ text: '', type: 'info', field: '' }), 4500);\n      return () => clearTimeout(timer);\n    }\n  }, [message]);");

text = text.replace(/setMessage\((`[^`]*`|'[^']*'|"[^"]*"|err.*|.*Error.*)\)/g, (m, p1) => `showMsg(${p1})`);

fs.writeFileSync('src/components/fs/FSJournalEntry.tsx', text);
console.log("Journal message fix applied.");
