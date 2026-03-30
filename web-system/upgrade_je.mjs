import fs from 'fs';

let content = fs.readFileSync('src/components/fs/FSJournalEntry.tsx', 'utf8');

// Replace Ribbon
content = content.replace(
  /<div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-surface-container-low border border-outline-variant\/20 rounded-xl shadow-sm">\s*<div className="flex flex-wrap gap-2">\s*<button onClick=\{\(\) => \{ setCloneFromRef\(addRow\.jJvNo \|\| ''\); setCloneToRef\(''\); setCloneDate\(today\); setShowClone\(true\) \}\} className="flex items-center gap-1\.5 px-4 py-2 bg-surface-container text-on-surface border border-outline-variant\/30 rounded-lg font-bold text-sm hover:bg-surface-container-high transition-colors text-tertiary">\s*<span className="material-symbols-outlined text-\[18px\]">file_copy<\/span> CLONE\s*<\/button>\s*<button onClick=\{\(\) => \{ setFindDate\(''\); setShowFind\(true\) \}\} className="flex items-center gap-1\.5 px-4 py-2 bg-surface-container text-on-surface border border-outline-variant\/30 rounded-lg font-bold text-sm hover:bg-surface-container-high transition-colors">\s*<span className="material-symbols-outlined text-\[18px\]">search<\/span> FIND\s*<\/button>\s*<button onClick=\{\(\) => \{ void loadDeletedRows\(\); setShowRecycleBin\(true\) \}\} className="flex items-center gap-1\.5 px-4 py-2 bg-surface-container text-on-surface border border-outline-variant\/30 rounded-lg font-bold text-sm hover:bg-surface-container-high transition-colors text-outline-variant">\s*<span className="material-symbols-outlined text-\[18px\]">delete_sweep<\/span> BIN\s*<\/button>\s*<\/div>\s*<div className="flex gap-2">\s*<button onClick=\{handleQuit\} className=\{`flex items-center gap-1\.5 px-5 py-2 rounded-lg font-bold text-sm shadow-sm transition-all border flex-shrink-0 \$\{!isBalanced \? 'bg-error-container text-on-error-container border-error hover:bg-error\/20' : 'bg-surface-container-highest text-on-surface hover:bg-surface-container-high border-outline-variant\/30'\}`\}>\s*<span className="material-symbols-outlined text-\[18px\]">logout<\/span>\s*QUIT \{\!isBalanced && '⚠'\}\s*<\/button>\s*<\/div>\s*<\/div>/g,
  `<div className="sticky top-0 z-40 -mt-2 mb-6 p-3 bg-surface-container-lowest/85 backdrop-blur-xl border border-outline-variant/30 rounded-2xl shadow-[0_8px_24px_var(--shadow-color)] [--shadow-color:rgba(23,28,31,0.06)] flex flex-wrap items-center justify-between gap-3 transition-all">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => { setCloneFromRef(addRow.jJvNo || ''); setCloneToRef(''); setCloneDate(today); setShowClone(true) }} className="flex items-center gap-1.5 px-3 py-2 bg-transparent text-on-surface hover:bg-surface-container-low rounded-lg font-bold text-sm transition-colors text-tertiary">
            <span className="material-symbols-outlined text-[18px]">file_copy</span> CLONE
          </button>
          <button onClick={() => { setFindDate(''); setShowFind(true) }} className="flex items-center gap-1.5 px-3 py-2 bg-transparent text-on-surface hover:bg-surface-container-low rounded-lg font-bold text-sm transition-colors">
            <span className="material-symbols-outlined text-[18px]">search</span> FIND
          </button>
          <div className="w-px h-6 bg-outline-variant/20 mx-1"></div>
          <button onClick={() => { void loadDeletedRows(); setShowRecycleBin(true) }} className="flex items-center gap-1.5 px-3 py-2 bg-transparent text-on-surface-variant hover:bg-surface-container-low rounded-lg font-bold text-sm transition-colors">
            <span className="material-symbols-outlined text-[18px]">delete_sweep</span> BIN
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={handleQuit} className={\`flex items-center gap-1.5 px-6 py-2 rounded-lg font-bold text-sm shadow-sm transition-all border flex-shrink-0 \${!isBalanced ? 'bg-error-container text-on-error-container border-error hover:bg-error/20' : 'bg-surface-container text-on-surface hover:bg-surface-container-high border-outline-variant/30'}\`}>
            <span className="material-symbols-outlined text-[18px]">logout</span>
            QUIT {!isBalanced && '⚠'}
          </button>
        </div>
      </div>`
);

// Replace Main Grid Header
content = content.replace(
  /<div className="bg-surface-container-lowest border border-outline-variant\/20 rounded-2xl overflow-hidden shadow-sm">\s*<div className="bg-surface-container-low px-5 py-3 border-b border-outline-variant\/20 flex flex-col md:flex-row md:justify-between md:items-center gap-2">\s*<h4 className="font-headline text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">\s*<span className="material-symbols-outlined text-\[18px\]">format_list_bulleted<\/span>\s*Journal Entries\s*<\/h4>\s*<div className="flex gap-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">\s*<span>Debit: <span className="font-mono text-tertiary ml-1">\{projectedDebit\.toLocaleString\('en-US', \{ minimumFractionDigits: 2 \}\)\}<\/span><\/span>\s*<span>Credit: <span className="font-mono text-error ml-1">\{projectedCredit\.toLocaleString\('en-US', \{ minimumFractionDigits: 2 \}\)\}<\/span><\/span>\s*<span className=\{projectedDebit - projectedCredit !== 0 \? 'text-error' : 'text-emerald-600'\}>\s*Var: <span className="font-mono ml-1">\{\(projectedDebit - projectedCredit\)\.toLocaleString\('en-US', \{ minimumFractionDigits: 2 \}\)\}<\/span>\s*<\/span>\s*<\/div>\s*<\/div>/g,
  `<div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm flex flex-col mb-10">
        <div className="bg-surface-container-lowest px-5 py-4 border-b border-outline-variant/30 flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          <h4 className="font-headline text-sm font-bold text-primary tracking-[0.1em] flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">list_alt</span>
            LEDGER DISTRIBUTION
          </h4>
          <div className="flex gap-6 text-[11px] font-bold text-on-surface-variant font-mono tracking-wider">
            <span>DEBIT <span className="text-tertiary ml-1 text-sm">{projectedDebit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></span>
            <span>CREDIT <span className="text-error ml-1 text-sm">{projectedCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></span>
            <span className={projectedDebit - projectedCredit !== 0 ? 'text-error' : 'text-emerald-600'}>
              VAR <span className="ml-1 text-sm">{(projectedDebit - projectedCredit).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </span>
          </div>
        </div>`
);

// Replace Thead
content = content.replace(
  /<thead className="bg-surface-container\/30 text-\[10px\] uppercase text-on-surface-variant\/70 border-b border-outline-variant\/20 font-mono tracking-widest">\s*<tr>\s*<th className="px-4 py-2\.5 font-bold w-\[120px\]">\{refLabel\}<\/th>\s*<th className="px-4 py-2\.5 font-bold w-\[140px\]">Date<\/th>\s*<th className="px-4 py-2\.5 font-bold min-w-\[200px\]">Account<\/th>\s*<th className="px-4 py-2\.5 font-bold w-\[150px\] text-right text-tertiary">Debit<\/th>\s*<th className="px-4 py-2\.5 font-bold w-\[150px\] text-right text-error">Credit<\/th>\s*<th className="px-4 py-2\.5 font-bold w-\[100px\] text-center">Action<\/th>\s*<\/tr>\s*<\/thead>/g,
  `<thead className="bg-surface-container-lowest text-[10px] uppercase text-on-surface-variant/50 border-b border-outline-variant/30 font-mono tracking-[0.15em] sticky top-0 z-10">
              <tr>
                <th className="px-5 py-3 font-bold w-[120px] text-on-surface-variant">{refLabel}</th>
                <th className="px-5 py-3 font-bold w-[140px] text-on-surface-variant">Date</th>
                <th className="px-5 py-3 font-bold min-w-[200px] text-on-surface-variant">Account</th>
                <th className="px-5 py-3 font-bold w-[150px] text-right text-on-surface-variant">Debit</th>
                <th className="px-5 py-3 font-bold w-[150px] text-right text-on-surface-variant">Credit</th>
                <th className="px-5 py-3 font-bold w-[80px] text-center text-on-surface-variant">Action</th>
              </tr>
            </thead>`
);

// Replace Data tr class
content = content.replace(
  /<tr key=\{r\.id\} onDoubleClick=\{\(\) => startEdit\(r\)\} className="hover:bg-surface-container-lowest\/50 group transition-colors cursor-pointer">/g,
  `<tr key={r.id} onDoubleClick={() => startEdit(r)} className="hover:bg-primary/5 even:bg-black/[0.02] dark:even:bg-white/[0.02] group transition-colors cursor-pointer border-none">`
);

// Replace Data dt padding for seamless grid
content = content.replace(/<td className="px-5 py-3 font-mono font-bold text-on-surface text-sm">/g, '<td className="px-5 py-2 font-mono font-bold text-on-surface text-sm">');
content = content.replace(/<td className="px-5 py-3 text-on-surface-variant font-medium">/g, '<td className="px-5 py-2 text-on-surface-variant font-medium text-sm">');
content = content.replace(/<td className="px-5 py-3 text-right font-mono font-semibold text-tertiary">/g, '<td className="px-5 py-2 text-right font-mono text-sm font-semibold text-tertiary">');
content = content.replace(/<td className="px-5 py-3 text-right font-mono font-semibold text-error">/g, '<td className="px-5 py-2 text-right font-mono text-sm font-semibold text-error">');

// Replace Add Row
content = content.replace(
  /<tr className="bg-emerald-50\/50 border-t-2 border-emerald-500\/30">/g,
  `<tr className="bg-tertiary/10 border-t border-tertiary/30">`
);

content = content.replace(
  /className="w-full px-2 py-1\.5 bg-white text-on-surface font-mono font-bold text-sm border border-emerald-500\/40 rounded focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all uppercase placeholder:text-emerald-800\/30"/g,
  `className="w-full px-2 py-1.5 bg-surface-container-lowest text-on-surface font-mono font-bold text-sm border border-outline-variant/30 rounded focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none transition-all uppercase placeholder:text-on-surface-variant/30"`
);

content = content.replace(
  /className="w-full px-2 py-1\.5 bg-white text-on-surface font-medium text-sm border border-emerald-500\/40 rounded focus:border-emerald-600 focus:ring-1 outline-none transition-all"/g,
  `className="w-full px-2 py-1.5 bg-surface-container-lowest text-on-surface font-medium text-sm border border-outline-variant/30 rounded focus:border-tertiary focus:ring-1 outline-none transition-all"`
);

content = content.replace(
  /className="flex-1 px-2\.5 py-1\.5 bg-white text-on-surface font-mono font-bold text-sm border border-emerald-500\/40 rounded focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all uppercase placeholder:text-emerald-800\/30"/g,
  `className="flex-1 px-2.5 py-1.5 bg-surface-container-lowest text-on-surface font-mono font-bold text-sm border border-outline-variant/30 rounded focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none transition-all uppercase placeholder:text-on-surface-variant/30"`
);

content = content.replace(
  /className="px-2 py-1 bg-white hover:bg-emerald-50 rounded border border-emerald-500\/40 transition-colors flex items-center justify-center text-emerald-800"/g,
  `className="px-2 py-1 bg-surface-container-lowest hover:bg-surface-variant rounded border border-outline-variant/30 transition-colors flex items-center justify-center text-on-surface-variant"`
);

content = content.replace(
  /'bg-white border-emerald-500\/40 focus:border-tertiary focus:ring-1 placeholder:text-emerald-800\/30'/g,
  `'bg-surface-container-lowest border-outline-variant/30 focus:border-tertiary focus:ring-1 placeholder:text-on-surface-variant/30'`
);

content = content.replace(
  /'bg-white border-emerald-500\/40 focus:border-error focus:ring-1 placeholder:text-emerald-800\/30'/g,
  `'bg-surface-container-lowest border-outline-variant/30 focus:border-error focus:ring-1 placeholder:text-on-surface-variant/30'`
);

content = content.replace(
  /className="w-full py-1\.5 bg-emerald-600 text-white rounded shadow-sm hover:bg-emerald-700 hover:-translate-y-0\.5 transition-all font-bold text-xs flex items-center justify-center gap-1"/g,
  `className="w-full py-1.5 bg-tertiary text-white rounded shadow-sm hover:bg-tertiary/90 hover:-translate-y-0.5 transition-all font-bold text-xs flex items-center justify-center gap-1"`
);

content = content.replace(
  /<td className="px-5 py-4 text-right font-mono font-bold text-tertiary text-lg border-t-2 border-outline-variant\/20">/g,
  `<td className="px-5 py-4 text-right font-mono font-bold text-tertiary text-lg border-t border-outline-variant/30">`
);

content = content.replace(
  /<td className="px-5 py-4 text-right font-mono font-bold text-error text-lg border-t-2 border-outline-variant\/20">/g,
  `<td className="px-5 py-4 text-right font-mono font-bold text-error text-lg border-t border-outline-variant/30">`
);
content = content.replace(
  /<td colSpan=\{3\} className="px-5 py-3 border-t-2 border-outline-variant\/20">/g, // if I missed anything
  ''
);

fs.writeFileSync('src/components/fs/FSJournalEntry.tsx', content);

console.log("Applied replaces successfully!");
