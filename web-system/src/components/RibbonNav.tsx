import { useState } from 'react'

interface RibbonItem {
  label: string
  onClick: () => void
  disabled?: boolean
}

interface RibbonGroup {
  title: string
  items: RibbonItem[]
}

interface RibbonTab {
  id: string
  label: string
}

interface RibbonNavProps {
  tabs: RibbonTab[]
  groups: Record<string, RibbonGroup[]>
  activeTab: string
  onTabChange: (tabId: string) => void
}

export default function RibbonNav({ tabs, groups, activeTab, onTabChange }: RibbonNavProps) {
  const [selectedItemKey, setSelectedItemKey] = useState<string>('')
  const [bodyOpen, setBodyOpen] = useState(false)

  const handleItemClick = (item: RibbonItem, tabId: string, groupTitle: string) => {
    if (item.disabled) return
    setSelectedItemKey(`${tabId}:${groupTitle}:${item.label}`)
    setBodyOpen(false)
    item.onClick()
  }

  return (
    <div 
      className="relative z-40 bg-white/60 backdrop-blur-xl border-b border-outline-variant/20 shadow-sm"
      onMouseLeave={() => setBodyOpen(false)}
    >
      {/* ── Tab strip ── */}
      <div 
        className="flex items-end px-6 pt-3 gap-2"
        onMouseEnter={() => setBodyOpen(true)}
      >
        {tabs.map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              className={`relative px-5 py-2.5 text-sm font-headline tracking-wide font-semibold rounded-t-lg transition-colors
                ${isActive ? 'text-primary bg-white border-t border-x border-outline-variant/20 pb-3' : 'text-on-surface-variant hover:text-on-surface hover:bg-black/5'}
              `}
              onMouseEnter={() => { setBodyOpen(true); onTabChange(tab.id) }}
              onClick={() => { onTabChange(tab.id); setBodyOpen(true) }}
            >
              {tab.label}
              {isActive && <div className="absolute -bottom-px left-0 right-0 h-0.5 bg-white z-10" />}
            </button>
          )
        })}
      </div>

      {/* ── Mega-Menu Content panels ── */}
      <div 
        className={`absolute left-0 right-0 bg-white border-b border-outline-variant/20 shadow-lg overflow-hidden transition-all duration-300 origin-top
          ${bodyOpen ? 'opacity-100 max-h-[400px] border-t-0' : 'opacity-0 max-h-0 pointer-events-none'}
        `}
      >
        <div className="px-6 py-5">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`flex gap-8 transition-opacity duration-200 ${activeTab === tab.id ? 'opacity-100 block' : 'opacity-0 hidden'}`}
            >
              {(groups[tab.id] ?? []).map((group, idx) => (
                <div key={idx} className="flex flex-col relative pr-8 after:content-[''] after:absolute after:right-0 after:top-2 after:bottom-2 after:w-px after:bg-outline-variant/20 last:after:hidden last:pr-0">
                  <div className="flex flex-wrap gap-2 mb-4 max-w-[280px]">
                    {group.items.map((item, itemIdx) => {
                      const isSelected = selectedItemKey === `${tab.id}:${group.title}:${item.label}`
                      return (
                        <button
                          key={itemIdx}
                          className={`group flex items-center justify-center px-4 py-2 text-[13px] font-medium rounded-md transition-all border
                            ${isSelected 
                              ? 'bg-primary border-primary text-white shadow-md' 
                              : item.disabled 
                                ? 'bg-surface-container-lowest border-outline-variant/10 text-outline-variant/50 cursor-not-allowed opacity-60' 
                                : 'bg-surface-container-lowest border-outline-variant/20 text-on-surface hover:border-primary/40 hover:bg-primary/5 hover:text-primary'}
                          `}
                          onClick={() => handleItemClick(item, tab.id, group.title)}
                          disabled={item.disabled}
                          title={item.label}
                        >
                          {item.label}
                        </button>
                      )
                    })}
                  </div>
                  {/* Label at bottom */}
                  <div className="mt-auto pt-2 text-[10px] font-bold tracking-widest uppercase text-on-surface-variant/50 text-center">
                    {group.title}
                  </div>
                </div>
              ))}
              
              {!(groups[tab.id] ?? []).length && (
                <div className="text-sm text-on-surface-variant italic py-6">
                  No actions available for this tab.
                </div>
              )}
            </div>
          ))}
        </div>
        {/* Ribbon Footer Glow */}
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary/10 to-transparent"></div>
      </div>
    </div>
  )
}
