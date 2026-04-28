import { useState } from 'react'
import PageHeader from '../PageHeader'

const SECTIONS = [
  { id: 'overview', icon: 'dashboard', title: 'System Overview', color: 'text-blue-600' },
  { id: 'cdv', icon: 'receipt_long', title: 'Check Disbursement (CDV)', color: 'text-violet-600' },
  { id: 'advance', icon: 'forward_to_inbox', title: 'Advance CDV', color: 'text-amber-600' },
  { id: 'transfer', icon: 'compare_arrows', title: 'Transfer Advance CDB', color: 'text-emerald-600' },
  { id: 'post', icon: 'publish', title: 'Post All Transactions', color: 'text-sky-600' },
  { id: 'monthend', icon: 'lock_clock', title: 'Month-End Processing', color: 'text-red-600' },
  { id: 'journals', icon: 'receipt', title: 'Journal Vouchers', color: 'text-indigo-600' },
  { id: 'receipts', icon: 'payments', title: 'Cash Receipts & Sales Book', color: 'text-teal-600' },
  { id: 'backup', icon: 'save', title: 'Backup Database', color: 'text-orange-600' },
  { id: 'faq', icon: 'help', title: 'FAQ & Troubleshooting', color: 'text-pink-600' },
]

function Callout({ type, children }: { type: 'info'|'warning'|'danger'|'tip', children: React.ReactNode }) {
  const map = {
    info:    { bg: 'bg-blue-50 border-blue-200',   icon: 'info',    text: 'text-blue-800' },
    warning: { bg: 'bg-amber-50 border-amber-200', icon: 'warning', text: 'text-amber-800' },
    danger:  { bg: 'bg-red-50 border-red-200',     icon: 'error',   text: 'text-red-700' },
    tip:     { bg: 'bg-emerald-50 border-emerald-200', icon: 'lightbulb', text: 'text-emerald-800' },
  }[type]
  return (
    <div className={`flex gap-3 px-4 py-3 rounded-xl border text-sm ${map.bg} ${map.text} my-3`}>
      <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">{map.icon}</span>
      <div>{children}</div>
    </div>
  )
}

function Step({ n, title, children }: { n: number, title: string, children: React.ReactNode }) {
  return (
    <div className="flex gap-4 my-3">
      <div className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</div>
      <div><p className="font-semibold text-sm text-on-surface">{title}</p><div className="text-sm text-on-surface-variant mt-0.5">{children}</div></div>
    </div>
  )
}

function SectionCard({ id, title, children }: { id: string, title: string, children: React.ReactNode }) {
  return (
    <div id={id} className="bg-white border border-outline-variant/15 rounded-2xl shadow-sm overflow-hidden scroll-mt-6">
      <div className="px-6 py-4 border-b border-outline-variant/10">
        <h2 className="font-headline font-bold text-base text-on-surface">{title}</h2>
      </div>
      <div className="px-6 py-5 space-y-2 text-sm text-on-surface-variant leading-relaxed">{children}</div>
    </div>
  )
}

function Screenshot({ src, caption }: { src: string, caption: string }) {
  return (
    <figure className="my-4 rounded-xl overflow-hidden border border-outline-variant/20 shadow-sm">
      <img src={src} alt={caption} className="w-full object-cover" loading="lazy" />
      <figcaption className="px-4 py-2 text-xs text-on-surface-variant/70 bg-surface-container border-t border-outline-variant/10 italic">
        {caption}
      </figcaption>
    </figure>
  )
}



export default function FSManual() {
  const [active, setActive] = useState('overview')
  const [search, setSearch] = useState('')

  const filtered = SECTIONS.filter(s => !search || s.title.toLowerCase().includes(search.toLowerCase()))

  const scrollTo = (id: string) => {
    setActive(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb="HELP / USER MANUAL"
        title="Financial Statements — User Manual"
        subtitle="Complete guide for accountants: data entry, processing, month-end close, and troubleshooting."
      />

      <div className="flex gap-5 items-start">
        {/* ── Sidebar TOC ── */}
        <aside className="w-56 shrink-0 sticky top-4 bg-white border border-outline-variant/15 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-3 py-3 border-b border-outline-variant/10">
            <div className="flex items-center gap-1.5 px-2.5 py-2 bg-surface-container rounded-xl w-full min-w-0">
              <span className="material-symbols-outlined text-[15px] text-on-surface-variant shrink-0">search</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
                className="min-w-0 flex-1 text-sm bg-transparent outline-none text-on-surface placeholder:text-on-surface-variant/50" />
            </div>
          </div>
          <nav className="py-2 max-h-[70vh] overflow-y-auto">
            {filtered.map(s => (
              <button key={s.id} onClick={() => scrollTo(s.id)}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors
                  ${active === s.id ? 'bg-primary/8 text-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container'}`}>
                <span className={`material-symbols-outlined text-[16px] ${active === s.id ? 'text-primary' : s.color}`}>{s.icon}</span>
                {s.title}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Content ── */}
        <div className="flex-1 min-w-0 space-y-5">

          <SectionCard id="overview" title="1. System Overview">
            <Screenshot src="/manual/fiscal_narrative.png" caption="Fiscal Narrative dashboard — shows active period, unposted transaction counts, and Advance CDV status for the current company." />
            <p>The <strong className="text-on-surface">Financial Statements (FS) module</strong> is the core accounting engine. It manages all check disbursements, journal entries, receipts, and month-end closing. Every action follows a strict <strong>lifecycle</strong>:</p>
            <div className="my-4 flex flex-col gap-1">
              {[
                ['1', 'Enter transactions', 'CDVs, journals, receipts during the active period'],
                ['2', 'Post All Transactions', 'Lock entries into the permanent journal ledger'],
                ['3', 'Month-End Processing', 'Roll balances forward and open the next period'],
                ['4', 'Repeat', 'New period begins — enter new transactions'],
              ].map(([n, title, desc]) => (
                <div key={n} className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/10">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">{n}</span>
                  <div><span className="font-semibold text-on-surface">{title}</span> — <span className="text-on-surface-variant">{desc}</span></div>
                </div>
              ))}
            </div>
            <Callout type="info">The <strong>Active Fiscal Period</strong> shown in the top-right of the Fiscal Narrative controls which month all transactions belong to. You cannot enter transactions for a closed period.</Callout>
            <p><strong className="text-on-surface">Key Concepts:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Unposted</strong> — Transaction entered but not yet locked into GL. Can be edited or deleted.</li>
              <li><strong>Posted</strong> — Transaction is locked into the permanent ledger (fs_pournals). Cannot be undone without re-opening period.</li>
              <li><strong>Advance CDV</strong> — A check entered in the current period but dated for a future period. Protected from clearing during month-end.</li>
            </ul>
          </SectionCard>

          <SectionCard id="cdv" title="2. Check Disbursement (CDV)">
            <Screenshot src="/manual/cdv_entry.png" caption="Check Disbursement entry form — fill in the header (Check No, Date, Bank, Pay To) then add account distribution lines below." />
            <p>A <strong className="text-on-surface">Check Disbursement Voucher (CDV)</strong> records money paid out via check. Use <strong>Data Entry → Check Disbursement</strong>.</p>
            <Step n={1} title="Open Check Disbursement">Click <em>Check Disbursement</em> in the sidebar under Data Entry.</Step>
            <Step n={2} title="Fill in the header">Enter: Check No, Date (must fall within the active period), Bank, and Pay To.</Step>
            <Step n={3} title="Add account lines">For each line: Account Code, Description, Amount, and DR/CR side.</Step>
            <Step n={4} title="Save">Click Save. The voucher appears as Unposted in the dashboard count.</Step>
            <Callout type="warning"><strong>Date Rule:</strong> If the check date is <em>after</em> the current period end date, the system treats it as an Advance CDV automatically. Use <em>Enter Advance CDB</em> for this instead.</Callout>
            <Callout type="tip">The Check Disbursement Register (Detailed) report shows all CDVs for a date range. Use it to verify entries before posting.</Callout>
            <p><strong className="text-on-surface">Common Fields:</strong></p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse mt-2">
                <thead><tr className="bg-surface-container">{['Field','Required','Description'].map(h=><th key={h} className="text-left px-3 py-2 border border-outline-variant/15 font-semibold">{h}</th>)}</tr></thead>
                <tbody>{[
                  ['Check No','Yes','Unique identifier. Format: 183026 or CDV183026'],
                  ['Check Date','Yes','Must be within active period for regular CDV'],
                  ['Bank','Yes','Select from master file (File → Banks)'],
                  ['Pay To','Yes','Payee name — usually from Suppliers master'],
                  ['Account Code','Yes','Chart of Accounts code for debit/credit side'],
                  ['Amount','Yes','Peso amount of the transaction line'],
                ].map(r=><tr key={r[0]} className="border-b border-outline-variant/10">{r.map((c,i)=><td key={i} className={`px-3 py-2 border border-outline-variant/10 ${i===0?'font-medium text-on-surface':''}`}>{c}</td>)}</tr>)}</tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard id="advance" title="3. Advance CDV — Enter Advance CDB">
            <Screenshot src="/manual/advance_cdv.png" caption="Enter Advance CDB form — identical to the regular CDV form but allows dates beyond the current period end." />
            <p>An <strong className="text-on-surface">Advance CDV</strong> is a check <em>entered during February</em> but <em>dated in March or beyond</em>. It is used to pre-record future disbursements without disturbing the current period's books.</p>
            <Callout type="info">Go to <strong>Processing → Enter Advance CDB</strong> to create an advance check. This is identical to the regular CDV form but the date is allowed to exceed the period end.</Callout>
            <p><strong className="text-on-surface">How the system protects Advance CDVs:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>All advance checks are automatically prefixed with <code className="bg-surface-container px-1 rounded">ADV</code> (e.g., <code className="bg-surface-container px-1 rounded">ADV183026</code>).</li>
              <li>They are <strong>excluded</strong> from the "Total Unposted" count on the dashboard — they don't clutter February's books.</li>
              <li>During Month-End Processing, the ZAP logic <strong>skips</strong> all ADV-prefixed checks — they survive the close.</li>
              <li>They also appear in the <strong>Advance CDVs</strong> panel showing their target month.</li>
            </ul>
            <Callout type="warning"><strong>Do NOT use the regular CDV form</strong> for future-dated checks. Using a date beyond the period end in the regular form will flag it as advance automatically, but it's cleaner to use Enter Advance CDB.</Callout>
            <p><strong className="text-on-surface">Scenario — Entering a March advance check while in February:</strong></p>
            <Step n={1} title="Go to Processing → Enter Advance CDB">Active period is February 2026.</Step>
            <Step n={2} title="Set the check date to March 5, 2026">The system accepts dates beyond Feb 28.</Step>
            <Step n={3} title="Complete all account lines and save">The check is saved as ADV183026 (ADV prefix added automatically).</Step>
            <Step n={4} title="Verify in the Advance CDVs panel">On the Fiscal Narrative dashboard, the Advance CDVs widget shows this check under "Target Period: Mar 2026".</Step>
            <Step n={5} title="After February Month-End, go to Transfer Advance CDB">Now in March — see next section.</Step>
          </SectionCard>

          <SectionCard id="transfer" title="4. Transfer Advance CDB">
            <Screenshot src="/manual/transfer_advance.png" caption="Transfer Advance CDB page — click Transfer Now to strip the ADV prefix from checks dated within the current period." />
            <p>After closing February and opening March, your Advance CDVs dated in March still have the <code className="bg-surface-container px-1 rounded">ADV</code> prefix. Use <strong>Transfer Advance CDB</strong> to activate them for the current period.</p>
            <Callout type="danger"><strong>Run this at the very start of a new period</strong> — before entering any new transactions. Do not run it if the advance CDVs are for a future period.</Callout>
            <Step n={1} title="Confirm you are in the correct period">Fiscal Narrative shows March 2026 as active.</Step>
            <Step n={2} title="Go to Processing → Transfer Advance CDB">Review the description — it tells you how many advance CDVs exist for this period.</Step>
            <Step n={3} title='Click "Transfer Now"'>The system strips the ADV prefix from all checks dated within March 2026. ADV183026 becomes 183026.</Step>
            <Step n={4} title="Verify on the dashboard">Check Disbursements count on the Fiscal Narrative now includes the transferred checks.</Step>
            <Callout type="tip">Advance CDVs for April will NOT be transferred — the system filters by current period dates only. They stay as ADV-prefixed until you advance to April.</Callout>
            <p><strong className="text-on-surface">What gets updated:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li><code className="bg-surface-container px-1 rounded">fs_checkmas</code> — ADV prefix stripped from j_ck_no and j_jv_no</li>
              <li><code className="bg-surface-container px-1 rounded">fs_checkvou</code> — FK updated to match the new check number</li>
              <li>Dashboard count — checks now appear in the Unposted total</li>
            </ul>
          </SectionCard>

          <SectionCard id="post" title="5. Post All Transactions">
            <Screenshot src="/manual/posting.png" caption="Post All Transactions — shows a pre-posting summary with counts per transaction type. Click POST TRANSACTIONS to lock them into the ledger." />
            <p><strong className="text-on-surface">Posting</strong> permanently locks all unposted transactions into the General Ledger. Use <strong>Processing → Post All Transactions</strong>.</p>
            <Callout type="danger"><strong>This is irreversible.</strong> Once posted, transactions cannot be edited or deleted from the current period. Always review the Fiscal Narrative counts before posting.</Callout>
            <p><strong className="text-on-surface">What gets posted:</strong></p>
            <div className="grid grid-cols-2 gap-2 my-3">
              {[
                ['Check Disbursements','fs_checkmas → fs_pournals'],
                ['Journal Vouchers','fs_journals → fs_pournals'],
                ['Cash Receipts','fs_cashrcpt → fs_pournals'],
                ['Sales Book','fs_salebook → fs_pournals'],
                ['Purchase Book','fs_purcbook → fs_pournals'],
                ['Adjustments','fs_adjstmnt → fs_pournals'],
              ].map(([label, detail]) => (
                <div key={label} className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/10">
                  <p className="font-semibold text-xs text-on-surface">{label}</p>
                  <p className="text-[11px] text-on-surface-variant font-mono mt-0.5">{detail}</p>
                </div>
              ))}
            </div>
            <Callout type="info"><strong>Advance CDVs are excluded from posting.</strong> The ADV prefix marks them as belonging to a future period — they will not be locked into the current GL.</Callout>
            <p><strong className="text-on-surface">Pre-posting checklist:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Verify all CDV amounts and account codes are correct</li>
              <li>Confirm journal entries are balanced (debits = credits)</li>
              <li>Run the Check Disbursement Register to spot any duplicates</li>
              <li>Ensure Advance CDVs are correctly prefixed with ADV</li>
            </ul>
          </SectionCard>

          <SectionCard id="monthend" title="6. Month-End Processing">
            <Screenshot src="/manual/month_end.png" caption="Month-End Processing — a 2-step wizard requiring period confirmation before executing the irreversible close." />
            <p><strong className="text-on-surface">Month-End Processing</strong> closes the current fiscal period, rolls all account balances forward, and prepares the system for the next month. Go to <strong>File → Month-End Processing</strong>.</p>
            <Callout type="danger"><strong>This cannot be undone.</strong> Ensure all transactions are posted and all Advance CDVs are correctly set before proceeding.</Callout>
            <p><strong className="text-on-surface">Step-by-step:</strong></p>
            <Step n={1} title="Post all transactions first">Run Post All Transactions. Dashboard should show 0 unposted.</Step>
            <Step n={2} title="Navigate to File → Month-End Processing">Review Current Period Information — confirm the period shown is correct.</Step>
            <Step n={3} title='Type the period code to confirm'>Enter the period in M/YYYY format (e.g., <code className="bg-surface-container px-1 rounded">2/2026</code> for February 2026). Click Confirm.</Step>
            <Step n={4} title='Click "Close Period Now"'>A styled confirmation modal appears — review the list of operations, then click Yes, Close Period.</Step>
            <Step n={5} title="Wait for completion">The processing log shows each step. On success, the active period advances to the next month.</Step>
            <Step n={6} title="Transfer Advance CDVs for the new period">If any ADV checks are dated in the new month, run Transfer Advance CDB immediately.</Step>
            <p><strong className="text-on-surface">What happens during Month-End:</strong></p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Balance Roll-Forward</strong> — Each account's closing balance becomes the new opening balance</li>
              <li><strong>DC/CD Formula Logic</strong> — Debit/credit normal balances are recalculated per account type</li>
              <li><strong>ZAP (Clear Tables)</strong> — All current-period transaction tables are cleared. ADV-prefixed checks are preserved.</li>
              <li><strong>Period Advance</strong> — fs_sys_id is updated: pres_mo increments (Dec wraps to Jan of next year)</li>
            </ul>
            <Callout type="warning"><strong>Year-End (December):</strong> During the December close, all expense and income accounts marked for initialization are reset to zero — this is the annual P&amp;L close.</Callout>
          </SectionCard>

          <SectionCard id="journals" title="7. Journal Vouchers">
            <p><strong className="text-on-surface">Journal Vouchers (JV)</strong> record non-check accounting entries — depreciation, accruals, reclassifications, etc. Use <strong>Data Entry → Journal Vouchers</strong>.</p>
            <p>Each JV must be <strong>balanced</strong> — total debits must equal total credits before saving.</p>
            <Step n={1} title="Enter JV Number">Format: YY-MMXXX (e.g., 26-02001 for February 2026, first JV).</Step>
            <Step n={2} title="Set Date">Must be within the active period.</Step>
            <Step n={3} title="Add Account Lines">Alternate debits and credits. The running balance must reach zero.</Step>
            <Step n={4} title="Save">JV appears in the Journal Vouchers count on the dashboard.</Step>
            <Callout type="info">The JV number format <code className="bg-surface-container px-1 rounded">26-02001</code> means: Year 2026, Period 02 (February), Sequence 001. This is purely a label — the system does not enforce this format.</Callout>
            <p><strong className="text-on-surface">Other journal types (same form, different register):</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Cash Receipts</strong> — Record money received (collections, deposits)</li>
              <li><strong>Sales Book</strong> — Record sales on account or cash sales</li>
              <li><strong>Purchase Book</strong> — Record purchases from suppliers</li>
              <li><strong>Adjustments</strong> — Period-end adjustments and corrections</li>
            </ul>
          </SectionCard>

          <SectionCard id="receipts" title="8. Cash Receipts &amp; Sales Book">
            <p>These are specialized journal registers. Both use the same entry form as Journal Vouchers but are stored in separate tables for reporting purposes.</p>
            <p><strong className="text-on-surface">Cash Receipts</strong> — Use for any inflow of cash: customer payments, loan proceeds, refunds received.</p>
            <p><strong className="text-on-surface">Sales Book</strong> — Use for recording sales transactions, whether cash or on account.</p>
            <Callout type="tip">These registers feed directly into the <strong>Cash Receipts Transactions</strong> and <strong>Sales Book Journals</strong> reports under Query/Report.</Callout>
          </SectionCard>

          <SectionCard id="backup" title="9. Backup Database">
            <p>Use <strong>File → Backup Database</strong> to download a local copy of the entire database. This is a complete SQLite snapshot including all companies.</p>
            <Step n={1} title="Click Backup Database in the File tab sidebar">A progress bar appears in the bottom-right corner.</Step>
            <Step n={2} title="Wait for download to complete">The file is saved as: <code className="bg-surface-container px-1 rounded">accounting_backup_gian_YYYYMMDD_HHMM.db</code></Step>
            <Step n={3} title="Store the file safely">Keep backups in a secure folder. Label them with the period they cover.</Step>
            <Callout type="warning"><strong>Backup before Month-End.</strong> Since month-end processing cannot be undone, always download a backup immediately before running it.</Callout>
            <Callout type="info"><strong>Restoring from backup</strong> requires IT/superadmin intervention — the backup file must be uploaded to the server and the connection string updated. Contact your system administrator.</Callout>
            <p><strong className="text-on-surface">What the backup contains:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>All companies (not just the currently selected one)</li>
              <li>All transaction data: checkmas, journals, cashrcpt, salebook, pournals</li>
              <li>All master files: chart of accounts, banks, suppliers, signatories</li>
              <li>System configuration: fs_sys_id (active period per company)</li>
            </ul>
          </SectionCard>

          <SectionCard id="faq" title="10. FAQ &amp; Troubleshooting">
            {[
              {
                q: 'Why does the dashboard show 0 transactions after month-end?',
                a: 'This is expected — month-end clears all transaction tables. You are now in a new period with no entries yet. If you have Advance CDVs for this month, run Transfer Advance CDB first.',
              },
              {
                q: 'Why is my ADV check showing as ADVCDV183041?',
                a: 'This was a bug in an earlier version where the ADV prefix was stacked on top of the CDV prefix. It has been corrected — all checks should now show as ADV183026 format (ADV + number only). If you see ADVCDV, contact the administrator to run the fix script.',
              },
              {
                q: 'My check is dated in the current period but shows in the Advance CDV panel.',
                a: 'A check is flagged as advance if its date exceeds the period end date (e.g., Feb 28). If the date is correct and it should be current-period, the period end date in fs_sys_id may be wrong. Contact your administrator.',
              },
              {
                q: 'Can I edit a transaction after posting?',
                a: 'No. Posted transactions are locked. To correct an error, you must enter a reversing Journal Voucher in the current period, then enter the correct transaction.',
              },
              {
                q: 'What happens to Advance CDVs when I run month-end?',
                a: 'Advance CDVs (ADV prefix) are completely preserved. The ZAP operation skips them. After the close, run Transfer Advance CDB to activate the ones dated in the new period.',
              },
              {
                q: 'The active period shows March but my data is from February.',
                a: 'The active period is stored in fs_sys_id. If it shows the wrong month, contact the administrator — a startup period correction can be applied to reset it to the correct period.',
              },
              {
                q: 'Can I run month-end if there are unposted transactions?',
                a: 'Technically yes — the backend will auto-post them as part of month-end. But best practice is to post first, review the results, then run month-end.',
              },
              {
                q: 'How do I know which period a journal belongs to?',
                a: 'Look at the JV number prefix: 26-02001 = Year 2026, Period 02 (February). Also check the j_date field — it should fall within the period dates.',
              },
            ].map(({ q, a }) => (
              <FAQItem key={q} q={q} a={a} />
            ))}
          </SectionCard>

        </div>
      </div>
    </div>
  )
}

function FAQItem({ q, a }: { q: string, a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-outline-variant/15 rounded-xl overflow-hidden my-2">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors">
        <span>{q}</span>
        <span className={`material-symbols-outlined text-[18px] text-on-surface-variant transition-transform ${open ? 'rotate-180' : ''}`}>expand_more</span>
      </button>
      {open && <div className="px-4 pb-4 pt-1 text-sm text-on-surface-variant border-t border-outline-variant/10 leading-relaxed">{a}</div>}
    </div>
  )
}
