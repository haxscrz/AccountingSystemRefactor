import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type CompanyCode } from '../config/companies'

interface CompanyState {
  selectedCompanyCode: CompanyCode | null
  setSelectedCompany: (code: CompanyCode) => void
  clearSelectedCompany: () => void
}

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set) => ({
      selectedCompanyCode: null,
      setSelectedCompany: (code: CompanyCode) => set({ selectedCompanyCode: code }),
      clearSelectedCompany: () => set({ selectedCompanyCode: null })
    }),
    {
      name: 'company-storage'
    }
  )
)
