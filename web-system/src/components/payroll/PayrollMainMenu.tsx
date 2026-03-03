interface PayrollMainMenuProps {
  onSelectType: (type: 'regular' | 'casual') => void
}

export default function PayrollMainMenu({ onSelectType }: PayrollMainMenuProps) {
  return (
    <div className="card" style={{ maxWidth: 900 }}>
      {/* ── Heading ── */}
      <div style={{ marginBottom: 20, paddingBottom: 14, borderBottom: '2px solid var(--border)' }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>
          Payroll System
        </h2>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
          Select payroll type to begin. Use the ribbon above for timecard entry, computation, and reports.
        </p>
      </div>

      {/* ── Type selection ── */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div
          className="info-card"
          onClick={() => onSelectType('regular')}
          style={{ cursor: 'pointer', borderLeft: '3px solid var(--primary)', transition: 'all var(--t-base)' }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={e => (e.currentTarget.style.transform = '')}
        >
          <h4>Regular Employees</h4>
          <ul className="feature-list" style={{ marginBottom: 14 }}>
            <li>Monthly salary computation</li>
            <li>Full benefits coverage (SSS, PHIC, Pag-ibig)</li>
            <li>13th month pay & leave credits</li>
            <li>Withholding tax</li>
          </ul>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}>
            Select Regular →
          </button>
        </div>

        <div
          className="info-card"
          onClick={() => onSelectType('casual')}
          style={{ cursor: 'pointer', borderLeft: '3px solid var(--accent)', transition: 'all var(--t-base)' }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={e => (e.currentTarget.style.transform = '')}
        >
          <h4>Casual Employees</h4>
          <ul className="feature-list" style={{ marginBottom: 14 }}>
            <li>Daily or project-based pay</li>
            <li>Basic statutory coverage</li>
            <li>Pro-rated benefits</li>
            <li>Flexible scheduling</li>
          </ul>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}>
            Select Casual →
          </button>
        </div>
      </div>

      {/* ── Period info bar ── */}
      <div style={{
        display: 'flex', gap: 24, padding: '10px 14px',
        background: 'var(--background)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', fontSize: 12, flexWrap: 'wrap',
        borderLeft: '3px solid var(--border-strong)'
      }}>
        <div>
          <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em' }}>Period</span>
          <div style={{ fontWeight: 700, marginTop: 2 }}>February 2026</div>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em' }}>Status</span>
          <div style={{ fontWeight: 700, marginTop: 2 }}>In Progress</div>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em' }}>Last Posted</span>
          <div style={{ fontWeight: 700, marginTop: 2 }}>Feb 15, 2026</div>
        </div>
      </div>
    </div>
  )
}
