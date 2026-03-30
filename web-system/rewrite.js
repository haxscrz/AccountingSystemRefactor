import fs from 'fs';

function rebuildJournal() {
  let text = fs.readFileSync('src/components/fs/FSJournalEntry.tsx', 'utf8');

  // Fix messaging system
  text = text.replace(/const \[message, setMessage\] = useState\(''\)/, \`const [message, setMessage] = useState({ text: '', type: 'info', field: '' })
  
  const showMsg = (text, type = 'info', field = '') => {
    if (!text) { setMessage({ text: '', type: 'info', field: '' }); return; }
    const inferredType = type === 'info' && /error|failed|unable|required|invalid|missing|not balanced/i.test(text) ? 'error' : (type === 'info' ? 'success' : type);
    setMessage({ text, type: inferredType, field });
  }
  
  useEffect(() => {
    if (message.text) {
      if (message.field) {
        const el = document.getElementById('input_' + message.field);
        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }
      }
      const timer = setTimeout(() => setMessage({ text: '', type: 'info', field: '' }), 4500);
      return () => clearTimeout(timer);
    }
  }, [message]);\`);

  text = text.replace(/setMessage\((`[^`]*`|'[^']*'|"[^"]*"|err.*|found.*|.*Error.*)\)/g, (m, p1) => \`showMsg(\${p1})\`);

  // Allow forceful exit
  text = text.replace(/const handleQuit = \(\) => \{\s*if \(!isBalanced\) \{\s*alert\([^;]+\);\s*return\s*\}\s*window\.history\.back\(\)\s*\}/, \`const handleQuit = () => {
    if (!isBalanced) {
      if(!window.confirm(\\\`UNBALANCED DETECTED!\\\\n\\\\nTotal Debit: \${totalDebit.toFixed(2)}\\\\nTotal Credit: \${totalCredit.toFixed(2)}\\\\nVal: \${(totalDebit - totalCredit).toFixed(2)}\\\\n\\\\nAre you sure you want to EXIT and leave this unbalanced?\\\`)) return;
      window.history.back();
      return;
    }
    window.history.back();
  }\`);

  // Rewrite return block
  // We locate the start of it
  const marker = "if (isLoading) {\\n    return <div className=\\"card\\"><h2>{title}</h2><p style={{ color: '#00bb00' }}>Loading...</p></div>\\n  }\\n\\n  return (";
  const startIdx = text.indexOf(marker);
  if (startIdx === -1) {
     console.log("Journal marker not found");
     return;
  }
  const beforeMarker = text.substring(0, startIdx + marker.length);
  
  const newReturn = \`
    <div className="flex flex-col gap-6 max-w-[1200px] font-sans pb-20">
      <div className="flex flex-col gap-1">
        <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-outline-variant/80">TRANSACTION LEDGER / JOURNALS</div>
        <h1 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">{title}</h1>
        <p className="text-sm font-medium text-on-surface-variant/70 mt-1">{records.length} record{records.length !== 1 ? 's' : ''} · Double-click any row to edit inline</p>
      </div>

      <div className="sticky top-0 z-40 -mt-2 mb-6 p-3 bg-surface-container-lowest/95 backdrop-blur-xl border border-outline-variant/50 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 transition-all">
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
          <button onClick={handleQuit} className={\\\`flex items-center gap-1.5 px-6 py-2 rounded-lg font-bold text-sm shadow-sm transition-all border flex-shrink-0 \${!isBalanced ? 'bg-error-container text-on-error-container border-error hover:bg-error/20' : 'bg-surface-container text-on-surface hover:bg-surface-container-high border-outline-variant/30'}\\\`}>
            <span className="material-symbols-outlined text-[18px]">logout</span>
            QUIT {!isBalanced && '⚠'}
          </button>
        </div>
      </div>

      {message.text && (
        <div className={\\\`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl border font-bold text-sm shadow-2xl flex items-center gap-3 transform transition-all animate-in fade-in slide-in-from-bottom-5 \${
          message.type === 'error'
            ? 'bg-error text-white border-error-container'
            : 'bg-surface-container-highest text-primary border-primary/20'
        }\\\`}>
          <span className="material-symbols-outlined text-[20px]">
            {message.type === 'error' ? 'warning' : 'check_circle'}
          </span>
          {message.text}
          <button type="button" onClick={() => showMsg('')} className="ml-4 opacity-70 hover:opacity-100"><span className="material-symbols-outlined text-[16px]">close</span></button>
        </div>
      )}

      {records.length > 0 && !isBalanced && (
        <div className="px-4 py-3 bg-error-container/50 border border-error/20 rounded-xl flex items-center gap-3 text-error">
          <span className="material-symbols-outlined text-[20px]">warning</span>
          <span className="font-bold text-sm">UNBALANCED — Debit {totalDebit.toLocaleString('en-US',{minimumFractionDigits:2})} ≠ Credit {totalCredit.toLocaleString('en-US',{minimumFractionDigits:2})} (off by {Math.abs(totalDebit - totalCredit).toLocaleString('en-US',{minimumFractionDigits:2})})</span>
        </div>
      )}

      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm flex flex-col mb-10">
        <div className="bg-surface-container-lowest px-5 py-4 border-b border-outline-variant/30 flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          <h4 className="font-headline text-sm font-bold text-primary tracking-[0.1em] flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">list_alt</span>
            LEDGER DISTRIBUTION
          </h4>
          <div className="flex gap-6 text-[11px] font-bold text-on-surface-variant font-mono tracking-wider">
            <span>DEBIT <span className="text-tertiary ml-1 text-sm">{projectedDebit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></span>
            <span>CREDIT <span className="text-error ml-1 text-sm">{projectedCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></span>
            <span className={projectedDebit - projectedCredit !== 0 ? 'text-error' : 'text-emerald-600'}>
              VAR <span className="ml-1 text-sm">{Math.abs(projectedDebit - projectedCredit).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse" style={{ minWidth: '800px' }}>
            <thead className="bg-surface-container-lowest text-[10px] uppercase text-on-surface-variant/50 border-b border-outline-variant/30 font-mono tracking-[0.15em] sticky top-0 z-10">
              <tr>
                <th className="px-5 py-3 font-bold w-[120px] text-on-surface-variant">{refLabel}</th>
                <th className="px-5 py-3 font-bold w-[140px] text-on-surface-variant">Date</th>
                <th className="px-5 py-3 font-bold min-w-[200px] text-on-surface-variant">Account</th>
                <th className="px-5 py-3 font-bold w-[150px] text-right text-on-surface-variant">Debit</th>
                <th className="px-5 py-3 font-bold w-[150px] text-right text-on-surface-variant">Credit</th>
                <th className="px-5 py-3 font-bold w-[80px] text-center text-on-surface-variant">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {records.map((r, idx) => {
                if (editingId === r.id) {
                  return (
                    <tr key={"edit-" + r.id} className="bg-primary/5 border-l-[3px] border-l-primary">
                      <td colSpan={6} className="p-0">
                        <form onSubmit={(e) => { e.preventDefault(); handleSaveInline() }} className="flex items-center w-full px-5 py-2 select-none">
                          <div className="w-[120px] pr-2"><input id="input_lineRef" disabled className="w-full px-2 py-1.5 bg-transparent text-on-surface-variant font-mono font-medium text-sm outline-none" value={editRow.jJvNo} /></div>
                          <div className="w-[140px] pr-2"><input id="input_lineDate" type="date" disabled className="w-full px-2 py-1.5 bg-transparent text-on-surface-variant font-mono text-sm outline-none" value={editRow.jDate} /></div>
                          <div className="min-w-[200px] flex-1 pr-2 flex items-center gap-2">
                            <input id="input_lineAcct" autoFocus required placeholder="ACCT" className={\\\`w-full px-2.5 py-1.5 bg-surface-container-lowest text-on-surface font-mono font-bold text-sm border border-outline-variant/30 rounded focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none uppercase \${message.field==='lineAcct'?'ring-2 ring-error !border-error':''}\\\`} value={editRow.acctCode} onChange={e => setEditRow({...editRow, acctCode: e.target.value.toUpperCase()})} />
                            <button type="button" onClick={() => { setAcctTarget('edit'); setShowAcctBrowse(true) }} className="px-2 py-1 bg-surface-container-lowest hover:bg-surface-variant border border-outline-variant/30 rounded transition-colors text-on-surface-variant"><span className="material-symbols-outlined text-[18px]">more_horiz</span></button>
                          </div>
                          <div className="w-[150px] pr-2"><input id="input_lineDebit" type="number" step="0.01" min="0" placeholder="Debit" className={\\\`w-full px-2 py-1.5 bg-surface-container-lowest text-on-surface font-mono text-sm border border-outline-variant/30 rounded focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none \${message.field==='lineDebit'?'ring-2 ring-error !border-error':''}\\\`} value={editRow.debit} onChange={e => setEditRow({ ...editRow, debit: e.target.value, credit: e.target.value ? '' : editRow.credit })} /></div>
                          <div className="w-[150px] pr-2"><input id="input_lineCredit" type="number" step="0.01" min="0" placeholder="Credit" className={\\\`w-full px-2 py-1.5 bg-surface-container-lowest text-on-surface font-mono text-sm border border-outline-variant/30 rounded focus:border-error focus:ring-1 focus:ring-error outline-none \${message.field==='lineCredit'?'ring-2 ring-error !border-error':''}\\\`} value={editRow.credit} onChange={e => setEditRow({ ...editRow, credit: e.target.value, debit: e.target.value ? '' : editRow.debit })} /></div>
                          <div className="w-[80px] flex justify-center gap-1.5 pl-2">
                            <button type="button" onClick={cancelEdit} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 text-on-surface-variant"><span className="material-symbols-outlined text-[18px]">close</span></button>
                            <button type="submit" disabled={saving} className="w-8 h-8 rounded-full flex items-center justify-center bg-tertiary text-white hover:bg-tertiary/90 shadow-sm"><span className="material-symbols-outlined text-[18px]">{saving ? 'sync' : 'check'}</span></button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  )
                }

                return (
                  <tr key={r.id} onDoubleClick={() => startEdit(r)} className="hover:bg-primary/5 even:bg-black/[0.02] dark:even:bg-white/[0.02] group transition-colors cursor-pointer border-b border-outline-variant/20">
                    <td className="px-5 py-2 font-mono font-bold text-on-surface text-sm uppercase">{r.jJvNo}</td>
                    <td className="px-5 py-2 text-on-surface-variant font-medium text-sm">{displayDate(r.jDate)}</td>
                    <td className="px-5 py-2 font-mono font-medium text-sm text-on-surface">
                      {r.acctCode}
                      <span className="ml-2 text-on-surface-variant/70 text-xs font-sans tracking-wide">{accountLookup.get(r.acctCode.toUpperCase())}</span>
                    </td>
                    <td className="px-5 py-2 text-right font-mono text-sm font-semibold text-tertiary">{r.jDOrC === 'D' ? r.jCkAmt.toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}</td>
                    <td className="px-5 py-2 text-right font-mono text-sm font-semibold text-error">{r.jDOrC === 'C' ? r.jCkAmt.toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}</td>
                    <td className="px-3 py-2">
                      <div className="flex justify-center gap-2 text-on-surface-variant">
                        <button onClick={(e) => { e.stopPropagation(); startEdit(r) }} className="hover:text-primary transition-colors"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(r.id) }} className="hover:text-error transition-colors"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                      </div>
                    </td>
                  </tr>
                )
              })}

              <tr className="bg-tertiary/10 border-t border-tertiary/30 select-none">
                <td colSpan={6} className="p-0">
                  <form onSubmit={(e) => { e.preventDefault(); handleAddRow() }} className="flex items-center w-full px-5 py-2">
                    <div className="w-[120px] pr-2"><input id="input_lineRef" placeholder={refPrefix + "00000"} className="w-full px-2 py-1.5 bg-surface-container-lowest text-on-surface font-mono font-bold text-sm border border-outline-variant/30 rounded focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none uppercase" value={addRow.jJvNo} onChange={e => setAddRow({...addRow, jJvNo: e.target.value})} /></div>
                    <div className="w-[140px] pr-2"><input id="input_lineDate" type="date" className="w-full px-2 py-1.5 bg-surface-container-lowest text-on-surface font-medium text-sm border border-outline-variant/30 rounded focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none" value={addRow.jDate} onChange={e => setAddRow({...addRow, jDate: e.target.value})} /></div>
                    <div className="min-w-[200px] flex-1 pr-2 flex items-center gap-2">
                      <input id="input_lineAcct" placeholder="ACCT" className={\\\`w-full px-2.5 py-1.5 bg-surface-container-lowest text-on-surface font-mono font-bold text-sm border border-outline-variant/30 rounded focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none uppercase \${message.field==='lineAcct'?'ring-2 ring-error !border-error animate-pulse':''}\\\`} value={addRow.acctCode} onChange={e => setAddRow({...addRow, acctCode: e.target.value.toUpperCase()})} />
                      <button type="button" onClick={() => { setAcctTarget('add'); setShowAcctBrowse(true) }} className="px-2 py-1 bg-surface-container-lowest hover:bg-surface-variant border border-outline-variant/30 rounded transition-colors text-on-surface-variant"><span className="material-symbols-outlined text-[18px]">more_horiz</span></button>
                    </div>
                    <div className="w-[150px] pr-2"><input id="input_lineDebit" type="number" step="0.01" min="0" placeholder="Debit" className={\\\`w-full px-2 py-1.5 bg-surface-container-lowest text-on-surface font-mono text-sm border border-outline-variant/30 rounded focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none \${message.field==='lineDebit'?'ring-2 ring-error !border-error':''}\\\`} value={addRow.debit} onChange={e => setAddRow({...addRow, debit: e.target.value, credit: e.target.value ? '' : addRow.credit})} onKeyDown={e => { if (e.key === 'Enter') handleAddRow() }} /></div>
                    <div className="w-[150px] pr-2"><input id="input_lineCredit" type="number" step="0.01" min="0" placeholder="Credit" className={\\\`w-full px-2 py-1.5 bg-surface-container-lowest text-on-surface font-mono text-sm border border-outline-variant/30 rounded focus:border-error focus:ring-1 focus:ring-error outline-none \${message.field==='lineCredit'?'ring-2 ring-error !border-error':''}\\\`} value={addRow.credit} onChange={e => setAddRow({...addRow, credit: e.target.value, debit: e.target.value ? '' : addRow.debit})} onKeyDown={e => { if (e.key === 'Enter') handleAddRow() }}/></div>
                    <div className="w-[80px] pl-2">
                      <button type="button" onClick={handleAddRow} disabled={saving} className="w-full py-1.5 bg-tertiary text-white rounded shadow-sm hover:bg-tertiary/90 transition-all font-bold text-xs flex items-center justify-center gap-1"><span className="material-symbols-outlined text-[16px]">{saving ? 'sync' : 'add'}</span> ADD</button>
                    </div>
                  </form>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="bg-surface-container-low px-5 py-3 border-t border-outline-variant/30 flex justify-between items-center">
            <div className="text-xs font-medium text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">info</span>
              Double-click row to edit inline. Typing Debit auto-clears Credit.
            </div>
            <div className="text-[10px] font-mono font-bold text-on-surface-variant/70 tracking-widest hidden md:block uppercase">
              Ctrl+S: Save | Esc: Cancel Edit | Ctrl+F: Find
            </div>
        </div>
      </div>
      
      {showAcctBrowse && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-outline-variant/20 flex justify-between items-center bg-surface w-full">
              <h3 className="font-headline font-bold text-lg text-on-surface">Select Account</h3>
              <button onClick={() => setShowAcctBrowse(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors"><span className="material-symbols-outlined text-[20px]">close</span></button>
            </div>
            <div className="flex-1 w-full relative overflow-y-auto">
              <FSChartOfAccounts
                standalone
                onSelect={(acct) => {
                  if (acctTarget === 'add') setAddRow({ ...addRow, acctCode: acct.acctCode })
                  else setEditRow({ ...editRow, acctCode: acct.acctCode })
                  setShowAcctBrowse(false)
                }}
              />
            </div>
          </div>
        </div>
      )}

      {showFind && (<div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center"><div className="bg-surface rounded-xl shadow-2xl p-6 w-[360px]"><h3 className="font-headline font-bold text-lg mb-4">Find by Date</h3><input type="date" value={findDate} onChange={e => setFindDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-4 bg-surface-container-lowest" /><div className="flex justify-end gap-2"><button onClick={() => setShowFind(false)} className="px-4 py-2 font-bold text-sm">Cancel</button><button onClick={handleFind} className="px-4 py-2 bg-primary text-white font-bold text-sm rounded-lg hover:bg-primary/90">Find</button></div></div></div>)}

      {showClone && (<div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center"><div className="bg-surface rounded-xl shadow-2xl p-6 w-[400px]"><h3 className="font-headline font-bold text-lg mb-4">Clone Transaction</h3><div className="flex flex-col gap-4"><div><label className="text-xs font-bold mb-1 block">From Ref No.</label><input value={cloneFromRef} onChange={e => setCloneFromRef(e.target.value.toUpperCase())} className="w-full border p-2 rounded-lg font-mono text-sm bg-surface-container-lowest uppercase" /></div><div><label className="text-xs font-bold mb-1 block">To Ref No.</label><input value={cloneToRef} onChange={e => setCloneToRef(e.target.value.toUpperCase())} className="w-full border p-2 rounded-lg font-mono text-sm bg-surface-container-lowest uppercase" /></div><div><label className="text-xs font-bold mb-1 block">New Date</label><input type="date" value={cloneDate} onChange={e => setCloneDate(e.target.value)} className="w-full border p-2 rounded-lg bg-surface-container-lowest" /></div></div><div className="flex justify-end gap-2 mt-6"><button onClick={() => setShowClone(false)} className="px-4 py-2 font-bold text-sm">Cancel</button><button onClick={handleClone} disabled={saving} className="px-4 py-2 bg-primary text-white font-bold text-sm rounded-lg hover:bg-primary/90">{saving ? '...' : 'Clone'}</button></div></div></div>)}

      {showRecycleBin && (<div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center"><div className="bg-surface rounded-2xl shadow-2xl w-full max-w-[800px] max-h-[80vh] flex flex-col"><div className="px-6 py-4 border-b border-outline-variant/20 flex justify-between items-center"><h3 className="font-headline font-bold text-lg text-error flex items-center gap-2"><span className="material-symbols-outlined">delete</span> Recycle Bin</h3><button onClick={() => setShowRecycleBin(false)} className="hover:bg-surface-container-high p-1 rounded-full"><span className="material-symbols-outlined">close</span></button></div><div className="flex-1 overflow-auto p-0"><table className="w-full text-left text-sm"><thead className="bg-surface-container-low text-xs font-bold sticky top-0"><tr><th className="px-4 py-2">Ref</th><th className="px-4 py-2">Date</th><th className="px-4 py-2">Account</th><th className="px-4 py-2 text-right">Debit</th><th className="px-4 py-2 text-right">Credit</th><th className="px-4 py-2 text-center">Action</th></tr></thead><tbody className="divide-y divide-outline-variant/10">{deletedRows.map(r => (<tr key={r.id} className="hover:bg-surface-container-lowest"><td className="px-4 py-2 font-mono uppercase">{r.jJvNo}</td><td className="px-4 py-2">{displayDate(r.jDate)}</td><td className="px-4 py-2 font-mono">{r.acctCode}</td><td className="px-4 py-2 text-right font-mono">{r.jDOrC === 'D' ? r.jCkAmt.toFixed(2) : ''}</td><td className="px-4 py-2 text-right font-mono">{r.jDOrC === 'C' ? r.jCkAmt.toFixed(2) : ''}</td><td className="px-4 py-2 text-center"><button onClick={() => handleRestore(r)} disabled={saving} className="text-primary hover:bg-primary/10 px-3 py-1 rounded font-bold text-xs transition-colors">RESTORE</button></td></tr>))}</tbody></table>{deletedRows.length === 0 && <div className="p-8 text-center text-on-surface-variant italic">Recycle bin is empty</div>}</div></div></div>)}

    </div>
  )
}
\`;

  text = beforeMarker + newReturn;
  fs.writeFileSync('src/components/fs/FSJournalEntry.tsx', text);
}

function buildVoucher() {
  let text = fs.readFileSync('src/components/fs/FSVoucherEntry.tsx', 'utf8');

  // Fix messaging system
  text = text.replace(/const \[message, setMessage\] = useState\(''\)/, \`const [message, setMessage] = useState({ text: '', type: 'info', field: '' })
  
  const showMsg = (text, type = 'info', field = '') => {
    if (!text) { setMessage({ text: '', type: 'info', field: '' }); return; }
    const inferredType = type === 'info' && /error|failed|unable|required|invalid|missing|not balanced/i.test(text) ? 'error' : (type === 'info' ? 'success' : type);
    setMessage({ text, type: inferredType, field });
  }\`);

  // We DO NOT redefine useEffect, there's already one? No, there isn't for message auto-hide!
  text = text.replace(/const \[message, setMessage\] = useState[^\n]+\n[^\n]+\n[^\n]+(\n)?/, match => match + \`
  useEffect(() => {
    if (message.text) {
      if (message.field) {
        const el = document.getElementById('input_' + message.field);
        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }
      }
      const timer = setTimeout(() => setMessage({ text: '', type: 'info', field: '' }), 4500);
      return () => clearTimeout(timer);
    }
  }, [message]);
\`);

  text = text.replace(/setMessage\((`[^`]*`|'[^']*'|"[^"]*"|err.*|.*Error.*)\)/g, (m, p1) => \`showMsg(\${p1})\`);

  text = text.replace(/const handleQuit = \(\) => \{\s*if \(!isLineBalanced\) \{\s*setShowUnbalanced\(true\);\s*return;\s*\}\s*window\.history\.back\(\)\s*\}/, \`const handleQuit = () => {
    if (!isLineBalanced) {
      setShowUnbalanced(true);
      return;
    }
    window.history.back();
  }\`);

  // Update Unbalanced modal buttons
  const oldModalBtns = '<div style={{ marginTop: \\'20px\\', display: \\'flex\\', justifyContent: \\'flex-end\\' }}>\\n            <button type="button" onClick={() => setShowUnbalanced(false)} style={{ padding: \\'6px 12px\\' }}>\\n              Return to Fix\\n            </button>\\n          </div>';
  const newModalBtns = \`<div className="bg-surface px-6 py-4 border-t border-outline-variant/20 flex justify-between gap-3 items-center">
            <button onClick={() => window.history.back()} className="px-5 py-2.5 bg-error/10 hover:bg-error/20 text-error font-bold text-sm rounded-lg transition-colors border border-error/20 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">logout</span> Force Exit Anyway
            </button>
            <button onClick={() => setShowUnbalanced(false)} className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white shadow-sm font-bold text-sm rounded-lg transition-colors">
              Return to Fix
            </button>
          </div>\`;
  text = text.replace(oldModalBtns, newModalBtns);

  // Replace {message} with the Toast
  const oldToastMsg = '{message && (\\n        <div style={{ padding: \\'10px\\', marginBottom: \\'15px\\', backgroundColor: \\'#e0e0e0\\', border: \\'1px solid #999\\' }}>\\n          <strong>System Message:</strong> {message}\\n        </div>\\n      )}';
  const newToastMsg = \`{message.text && (
        <div className={\\\`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl border font-bold text-sm shadow-2xl flex items-center gap-3 transform transition-all animate-in fade-in slide-in-from-bottom-5 \${
          message.type === 'error'
            ? 'bg-error text-white border-error-container'
            : 'bg-surface-container-highest text-primary border-primary/20'
        }\\\`}>
          <span className="material-symbols-outlined text-[20px]">
            {message.type === 'error' ? 'warning' : 'check_circle'}
          </span>
          {message.text}
          <button type="button" onClick={() => showMsg('')} className="ml-4 opacity-70 hover:opacity-100"><span className="material-symbols-outlined text-[16px]">close</span></button>
        </div>
      )}\`;
  text = text.replace(oldToastMsg, newToastMsg);

  // Add IDs and replace styles for errors IF they exist. Voucher is still mostly using style={}, we will add classes.
  text = text.replace(/<input\\s+style=\{\s*\{([^}]+)\}\s*\}\s*value=\{masterForm\.vDate\}/g, \`<input style={{ $1 }} id="input_masterDate" className={message.field === 'masterDate' ? 'ring-2 ring-error !border-error animate-pulse' : ''} value={masterForm.vDate}\`);
  text = text.replace(/<input\\s+style=\{\s*\{([^}]+)\}\s*\}\s*placeholder="Payee Name"\\s+value=\{masterForm\.vPayee\}/g, \`<input style={{ $1 }} id="input_masterPayee" placeholder="Payee Name" className={message.field === 'masterPayee' ? 'ring-2 ring-error !border-error animate-pulse' : ''} value={masterForm.vPayee}\`);
  text = text.replace(/<input\\s+type="number"\\s+style=\{\s*\{([^}]+)\}\s*\}\s*value=\{masterForm\.vAmount\}/g, \`<input type="number" style={{ $1 }} id="input_masterAmount" className={message.field === 'masterAmount' ? 'ring-2 ring-error !border-error animate-pulse' : ''} value={masterForm.vAmount}\`);
  
  text = text.replace(/<input([^>]+)id="input_lineAcct"([^>]+)className=\{\`\\\$\{message\.field[^}]+\}\`/g, \`<input$1id="input_lineAcct"$2\`); // clean if running again
  text = text.replace(/<input\\s+style=\{\{\\s*\.\.\.lineInput\([^>]+\)\\s*\}\}\\s*placeholder="ACCT"\\s*id="input_lineAcct"\\s*value=\{addLineRow\.acctCode\}\\s*className=\{\`\\\$\{message\.field[^>]+\`\\s*\+\\s*list="voucher-account-list"/gi, 
     \`<input style={{ ...lineInput('#86efac'), textAlign: 'left', width: '70px', fontFamily: 'monospace' }} placeholder="ACCT" id="input_lineAcct" value={addLineRow.acctCode} className={message.field === 'lineAcct' ? 'ring-2 ring-error !border-error animate-pulse' : ''} list="voucher-account-list"\`);

  text = text.replace(/<input\\s+style=\{\s*\{\s*\.\.\.lineInput\('#86efac'\)\\s*\}\}\\s*placeholder="ACCT"\\s*list="voucher-account-list"\\s*value=\{addLineRow\.acctCode\}/, \`<input style={{ ...lineInput('#86efac') }} id="input_lineAcct" placeholder="ACCT" list="voucher-account-list" value={addLineRow.acctCode} className={message.field === 'lineAcct' ? 'ring-2 ring-error !border-error animate-pulse' : ''}\`);
  text = text.replace(/<input\\s+type="number"\\s+style=\{\{\\s*\.\.\.lineInput\('#86efac'\)\\s*\}\}\\s*value=\{addLineRow\.debit\}/, \`<input type="number" style={{ ...lineInput('#86efac') }} id="input_lineDebit" value={addLineRow.debit} className={message.field === 'lineDebit' ? 'ring-2 ring-error !border-error' : ''}\`);
  text = text.replace(/<input\\s+type="number"\\s+style=\{\{\\s*\.\.\.lineInput\('#86efac'\)\\s*\}\}\\s*value=\{addLineRow\.credit\}/, \`<input type="number" style={{ ...lineInput('#86efac') }} id="input_lineCredit" value={addLineRow.credit} className={message.field === 'lineCredit' ? 'ring-2 ring-error !border-error' : ''}\`);

  // Replace manual string validations with typed fields
  text = text.replace(/showMsg\('Voucher Date is required'\)/g, "showMsg('Voucher Date is required', 'error', 'masterDate')");
  text = text.replace(/showMsg\('Payee is required'\)/g, "showMsg('Payee is required', 'error', 'masterPayee')");
  text = text.replace(/showMsg\('Amount must be > 0'\)/g, "showMsg('Amount must be > 0', 'error', 'masterAmount')");
  text = text.replace(/showMsg\('Account Code is required'\)/g, "showMsg('Account Code is required', 'error', 'lineAcct')");
  text = text.replace(/showMsg\('Please enter either a Debit or Credit amount'\)/g, "showMsg('Please enter either a Debit or Credit amount', 'error', 'lineDebit')");

  fs.writeFileSync('src/components/fs/FSVoucherEntry.tsx', text);
}

rebuildJournal();
buildVoucher();

console.log("Rewrite completed successfully!");
