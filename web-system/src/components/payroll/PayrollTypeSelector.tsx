interface Props {
  onSelect: (type: 'regular' | 'casual') => void
}

export default function PayrollTypeSelector({ onSelect }: Props) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      background: 'var(--background)',
      minHeight: 'calc(100vh - 64px)',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          display: 'inline-block',
          width: 48, height: 48,
          background: 'var(--primary)',
          borderRadius: 4,
          marginBottom: 16,
        }} />
        <h2 style={{
          fontSize: 22,
          fontWeight: 900,
          letterSpacing: '-0.03em',
          color: 'var(--text)',
          marginBottom: 6,
        }}>
          Select Payroll Type
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 380 }}>
          Choose the employee group to process. This determines the data files,
          rates, and reports used throughout the session.
        </p>
      </div>

      {/* Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 24,
        width: '100%',
        maxWidth: 640,
      }}>
        {/* Regular */}
        <button
          onClick={() => onSelect('regular')}
          style={{
            background: 'var(--surface)',
            border: '2px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '32px 28px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all var(--t-base)',
            position: 'relative',
            overflow: 'hidden',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget
            el.style.borderColor = 'var(--primary)'
            el.style.transform = 'translateY(-3px)'
            el.style.boxShadow = '0 8px 24px rgba(15,91,102,0.15)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget
            el.style.borderColor = 'var(--border)'
            el.style.transform = ''
            el.style.boxShadow = ''
          }}
        >
          {/* Accent bar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: 4, background: 'var(--primary)',
          }} />

          <div style={{
            fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: 'var(--primary)',
            marginBottom: 10, marginTop: 4,
          }}>
            Regular Employees
          </div>

          <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 16 }}>
            Monthly Payroll
          </div>

          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {['Monthly salary computation', 'Full SSS / PHIC / Pag-Ibig coverage', '13th month pay & leave credits', 'Withholding tax'].map(item => (
              <li key={item} style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--primary)', fontWeight: 800, marginTop: 1 }}>›</span>
                {item}
              </li>
            ))}
          </ul>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingTop: 16, borderTop: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>RANK/ data files</span>
            <span style={{
              fontSize: 12, fontWeight: 800, color: 'var(--primary)',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              Select →
            </span>
          </div>
        </button>

        {/* Casual */}
        <button
          onClick={() => onSelect('casual')}
          style={{
            background: 'var(--surface)',
            border: '2px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '32px 28px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all var(--t-base)',
            position: 'relative',
            overflow: 'hidden',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget
            el.style.borderColor = 'var(--accent)'
            el.style.transform = 'translateY(-3px)'
            el.style.boxShadow = '0 8px 24px rgba(27,123,127,0.15)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget
            el.style.borderColor = 'var(--border)'
            el.style.transform = ''
            el.style.boxShadow = ''
          }}
        >
          {/* Accent bar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: 4, background: 'var(--accent)',
          }} />

          <div style={{
            fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: 'var(--accent)',
            marginBottom: 10, marginTop: 4,
          }}>
            Casual Employees
          </div>

          <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 16 }}>
            Daily / Project Pay
          </div>

          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {['Daily or project-based computation', 'Basic statutory coverage', 'Pro-rated benefits', 'Flexible scheduling'].map(item => (
              <li key={item} style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 800, marginTop: 1 }}>›</span>
                {item}
              </li>
            ))}
          </ul>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingTop: 16, borderTop: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>casl/ data files</span>
            <span style={{
              fontSize: 12, fontWeight: 800, color: 'var(--accent)',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              Select →
            </span>
          </div>
        </button>
      </div>

      {/* Footer note */}
      <p style={{ marginTop: 32, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
        You can switch types any time using the <strong>Switch Type</strong> button in the header.
      </p>
    </div>
  )
}
