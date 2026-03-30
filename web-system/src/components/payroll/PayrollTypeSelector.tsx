interface PayrollTypeSelectorProps {
  onSelect: (type: 'regular' | 'casual') => void
}

export default function PayrollTypeSelector({ onSelect }: PayrollTypeSelectorProps) {
  return (
    <div className="flex-grow flex flex-col items-center justify-center min-h-full px-10 py-16">
      {/* Page Header */}
      <div className="text-center mb-16 max-w-xl">
        <h1 className="text-display-md font-headline font-bold text-primary mb-4 tracking-tight">
          Select Payroll Type
        </h1>
        <p className="text-body-md text-on-surface-variant leading-relaxed">
          Choose the processing environment for this session.
        </p>
      </div>

      {/* Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">

        {/* Regular Payroll */}
        <button
          onClick={() => onSelect('regular')}
          className="group text-left bg-white border border-outline-variant/20 rounded-2xl p-8 shadow-sm hover:shadow-lg hover:border-primary/30 hover:-translate-y-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mb-6 shadow-md group-hover:bg-primary/90 transition-colors">
            <span className="material-symbols-outlined text-white text-2xl">badge</span>
          </div>
          <div className="font-headline font-bold text-xl text-on-surface mb-2">Regular Payroll</div>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Standard monthly/bi-monthly processing for permanent staff. Includes full benefits integration, leave management, and tax compliance reporting for salaried employees.
          </p>
          <div className="mt-6 flex items-center gap-2 text-primary font-semibold text-sm group-hover:gap-3 transition-all">
            <span>Select Regular</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </div>
        </button>

        {/* Casual Payroll */}
        <button
          onClick={() => onSelect('casual')}
          className="group text-left bg-white border border-outline-variant/20 rounded-2xl p-8 shadow-sm hover:shadow-lg hover:border-secondary/30 hover:-translate-y-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-secondary/30"
        >
          <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center mb-6 shadow-md group-hover:bg-secondary/90 transition-colors">
            <span className="material-symbols-outlined text-white text-2xl">work_history</span>
          </div>
          <div className="font-headline font-bold text-xl text-on-surface mb-2">Casual Payroll</div>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Daily or weekly processing for seasonal or project-based workers. Optimized for rapid entry, piece-rate calculations, and short-term contract compliance.
          </p>
          <div className="mt-6 flex items-center gap-2 text-secondary font-semibold text-sm group-hover:gap-3 transition-all">
            <span>Select Casual</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </div>
        </button>
      </div>

      {/* Footer note */}
      <p className="mt-12 text-xs text-on-surface-variant/50 tracking-wide">
        You can switch type at any time from the sidebar.
      </p>
    </div>
  )
}
