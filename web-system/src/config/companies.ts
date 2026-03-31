export type CompanyCode =
  | 'cyberfridge'
  | 'johntrix'
  | 'thermalex'
  | 'gmixteam'
  | 'dynamiq'
  | 'metaleon'
  | '3jcrt'
  | 'gian'
  | 'jimi'
  | 'lmjay'

export interface Company {
  code: CompanyCode
  name: string
}

export const COMPANIES: Company[] = [
  { code: 'cyberfridge', name: 'CYBERFRIDGE GENERAL SERVICES INC' },
  { code: 'johntrix', name: 'JOHNTRIX TECHNICAL SERVICES INC.' },
  { code: 'thermalex', name: 'THERMALEX GENERAL SERVICES INC' },
  { code: 'gmixteam', name: 'GMIXTEAM GENERAL SERVICES INC' },
  { code: 'dynamiq', name: 'DYNAMIQ CIRQUE GENERAL SERVICES INC' },
  { code: 'metaleon', name: 'METALEON GENERAL SERVICES INC' },
  { code: '3jcrt', name: '3JCRT GENERAL SERVICES INC' },
  { code: 'gian', name: 'GIAN GENERAL SERVICES INC' },
  { code: 'jimi', name: 'JIMI GENERAL SERVICES INC' },
  { code: 'lmjay', name: 'LMJAY GENERAL SERVICES INC' }
]

export const COMPANY_HEADER_NAME = 'X-Company-Code'
export const DEFAULT_COMPANY_CODE: CompanyCode = 'cyberfridge'

export function getCompanyByCode(code?: string | null): Company | null {
  if (!code) return null
  return COMPANIES.find((company) => company.code === code) ?? null
}

export function getCompanyNameByCode(code?: string | null): string {
  return getCompanyByCode(code)?.name ?? 'No Company Selected'
}
