import './RibbonNav.css'
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
    setBodyOpen(false)   // collapse immediately on item click
    item.onClick()
  }

  return (
    <div
      className="ribbon"
      onMouseLeave={() => setBodyOpen(false)}
    >
      {/* ── Tab strip ── */}
      <div className="ribbon-tabs" onMouseEnter={() => setBodyOpen(true)}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`ribbon-tab${activeTab === tab.id ? ' active' : ''}`}
            onMouseEnter={() => { setBodyOpen(true); onTabChange(tab.id) }}
            onClick={() => { onTabChange(tab.id); setBodyOpen(true) }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Content panels ── */}
      <div className={`ribbon-body${bodyOpen ? ' ribbon-body--open' : ''}`}>
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`ribbon-content${activeTab === tab.id ? ' active' : ''}`}
          >
          {(groups[tab.id] ?? []).map((group, idx) => (
            <div key={idx} className="ribbon-group">
              <div className="ribbon-group-items">
                {group.items.map((item, itemIdx) => (
                  <button
                    key={itemIdx}
                    className={`ribbon-item${
                      selectedItemKey === `${tab.id}:${group.title}:${item.label}` ? ' active' : ''
                    }`}
                    onClick={() => handleItemClick(item, tab.id, group.title)}
                    disabled={item.disabled}
                    title={item.label}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {/* Label at bottom — Word style */}
              <div className="ribbon-group-title">{group.title}</div>
            </div>
          ))}
        </div>
      ))}
      </div>
    </div>
  )
}
