﻿import { useState, useEffect } from 'react'
import axios from 'axios'

interface Account {
  acctCode: string
  acctDesc: string
  openBal: number
  curDebit: number
  curCredit: number
  glReport: string
  glEffect: string
  formula: string
  initialize: boolean
}

export default function FSChartOfAccounts() {
  const API_BASE = '/api/fs'
  const [accounts, setAccounts] = useState<Account[]>([])
  const [currentAccountIndex, setCurrentAccountIndex] = useState(0)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'main' | 'editing'>('main')
  const [editMode, setEditMode] = useState<'add' | 'edit' | null>(null)
  const [showFindDialog, setShowFindDialog] = useState(false)
  const [findCode, setFindCode] = useState('')

  // Form state
  const [acctCode, setAcctCode] = useState('')
  const [acctDesc, setAcctDesc] = useState('')
  const [openBal, setOpenBal] = useState('0.00')
  const [curDebit, setCurDebit] = useState('0.00')
  const [curCredit, setCurCredit] = useState('0.00')
  const [glReport, setGlReport] = useState('')
  const [glEffect, setGlEffect] = useState('')
  const [formula, setFormula] = useState('DC')
  const [initialize, setInitialize] = useState(false)

  useEffect(() => {
    loadAllAccounts()
  }, [])

  useEffect(() => {
    if (accounts.length > 0 && currentAccountIndex >= 0 && currentAccountIndex < accounts.length) {
      displayAccount(accounts[currentAccountIndex])
    }
  }, [currentAccountIndex, accounts])

  const loadAllAccounts = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get(`${API_BASE}/accounts`)
      const data = response.data?.data || response.data || []
      setAccounts(data)
      if (data.length > 0) {
        setCurrentAccountIndex(0)
        displayAccount(data[0])
      }
      setMessage('')
    } catch (error: any) {
      setMessage(`Error loading accounts: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const displayAccount = (account: Account) => {
    setAcctCode(account.acctCode || '')
    setAcctDesc(account.acctDesc || '')
    setOpenBal(parseFloat(String(account.openBal || 0)).toFixed(2))
    setCurDebit(parseFloat(String(account.curDebit || 0)).toFixed(2))
    setCurCredit(parseFloat(String(account.curCredit || 0)).toFixed(2))
    setGlReport(account.glReport || '')
    setGlEffect(account.glEffect || '')
    setFormula(account.formula || 'DC')
    setInitialize(account.initialize === true || account.initialize === 'Y' as any)
  }

  const clearDisplay = () => {
    setAcctCode('')
    setAcctDesc('')
    setOpenBal('0.00')
    setCurDebit('0.00')
    setCurCredit('0.00')
    setGlReport('')
    setGlEffect('')
    setFormula('DC')
    setInitialize(false)
  }

  const handleFind = async () => {
    if (!findCode.trim()) {
      setMessage('Please enter an account code')
      return
    }
    try {
      const response = await axios.get(`${API_BASE}/accounts/navigation/seek/${findCode}`)
      const account = response.data?.data
      if (account) {
        const index = accounts.findIndex(a => a.acctCode === account.acctCode)
        if (index >= 0) {
          setCurrentAccountIndex(index)
          setMessage('')
        }
      } else {
        setMessage(`No account found with code >= "${findCode}"`)
      }
    } catch (error: any) {
      setMessage(`Find failed: ${error.message}`)
    }
    setShowFindDialog(false)
    setFindCode('')
  }

  const handleNext = () => {
    if (accounts.length === 0) {
      setMessage('No accounts to navigate')
      return
    }
    if (currentAccountIndex >= accounts.length - 1) {
      setMessage('This is the last record!')
      return
    }
    setCurrentAccountIndex(currentAccountIndex + 1)
  }

  const handlePrevious = () => {
    if (accounts.length === 0) {
      setMessage('No accounts to navigate')
      return
    }
    if (currentAccountIndex <= 0) {
      setMessage('This is the first record!')
      return
    }
    setCurrentAccountIndex(currentAccountIndex - 1)
  }

  const handleFirst = () => {
    if (accounts.length === 0) {
      setMessage('No accounts')
      return
    }
    setCurrentAccountIndex(0)
  }

  const handleLast = () => {
    if (accounts.length === 0) {
      setMessage('No accounts')
      return
    }
    setCurrentAccountIndex(accounts.length - 1)
  }

  const handleAdd = () => {
    clearDisplay()
    setEditMode('add')
    setActiveTab('editing')
  }

  const handleEdit = () => {
    if (accounts.length === 0 || !acctCode) {
      setMessage('No account selected to edit')
      return
    }
    setEditMode('edit')
    setActiveTab('editing')
  }

  const handleSave = async () => {
    if (!acctCode.trim()) {
      setMessage('Account Code is required')
      return
    }
    if (!acctDesc.trim()) {
      setMessage('Account Description is required')
      return
    }
    if (!['CD', 'DC'].includes(formula.toUpperCase())) {
      setMessage('Formula must be either CD or DC')
      return
    }

    const accountData = {
      acctCode: acctCode.toUpperCase(),
      acctDesc: acctDesc,
      openBal: parseFloat(openBal) || 0,
      curDebit: parseFloat(curDebit) || 0,
      curCredit: parseFloat(curCredit) || 0,
      glReport: glReport.toUpperCase(),
      glEffect: glEffect.toUpperCase(),
      formula: formula.toUpperCase(),
      initialize: initialize
    }

    try {
      if (editMode === 'add') {
        const response = await axios.post(`${API_BASE}/accounts`, accountData)
        setMessage(`Account ${accountData.acctCode} added successfully`)
        setAccounts([...accounts, response.data?.data || accountData as Account])
      } else if (editMode === 'edit') {
        await axios.put(`${API_BASE}/accounts/${acctCode}`, accountData)
        const updatedAccounts = accounts.map(a => 
          a.acctCode === acctCode ? { ...a, ...accountData } : a
        )
        setAccounts(updatedAccounts)
        setMessage(`Account ${accountData.acctCode} updated successfully`)
      }
      setActiveTab('main')
      setEditMode(null)
    } catch (error: any) {
      setMessage(`Error saving account: ${error.response?.data?.message || error.message}`)
    }
  }

  const handleDelete = async () => {
    if (!acctCode) {
      setMessage('No account selected to delete')
      return
    }
    if (!window.confirm(`Are you sure you want to delete account ${acctCode}?`)) {
      return
    }
    try {
      await axios.delete(`${API_BASE}/accounts/${acctCode}`)
      const updatedAccounts = accounts.filter(a => a.acctCode !== acctCode)
      setAccounts(updatedAccounts)
      if (updatedAccounts.length > 0) {
        if (currentAccountIndex >= updatedAccounts.length) {
          setCurrentAccountIndex(updatedAccounts.length - 1)
        } else {
          displayAccount(updatedAccounts[currentAccountIndex])
        }
      } else {
        clearDisplay()
      }
      setMessage(`Account ${acctCode} deleted successfully`)
    } catch (error: any) {
      setMessage(`Error deleting account: ${error.message}`)
    }
  }

  const handleCancel = () => {
    setActiveTab('main')
    setEditMode(null)
    if (accounts.length > 0) {
      displayAccount(accounts[currentAccountIndex])
    }
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2>Chart of Accounts Maintenance</h2>
          <p className="subtitle">Manage account codes, balances and settings</p>
          {isLoading && <span style={{ color: '#00bb00', marginLeft: '10px' }}>Loading...</span>}
        </div>
      </div>

      {message && (
        <div style={{
          padding: '10px 15px',
          marginBottom: '15px',
          border: `1px solid ${message.includes('Error') ? '#cc0000' : '#00cc00'}`,
          backgroundColor: message.includes('Error') ? '#ffebee' : '#e8f5e9',
          color: message.includes('Error') ? '#8b0000' : '#1b5e20',
          borderRadius: '4px'
        }}>
          {message}
        </div>
      )}

      {activeTab === 'main' && (
        <>
          {accounts.length > 0 && (
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Account Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Code</label>
                    <div style={{ padding: '8px', backgroundColor: '#f5f5f5', border: '1px solid #ddd' }}>{acctCode}</div>
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Description</label>
                    <div style={{ padding: '8px', backgroundColor: '#f5f5f5', border: '1px solid #ddd' }}>{acctDesc}</div>
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Opening Balance</label>
                    <div style={{ padding: '8px', backgroundColor: '#f5f5f5', border: '1px solid #ddd' }}>{parseFloat(openBal).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                  </div>
                </div>
                <div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Report Code</label>
                    <div style={{ padding: '8px', backgroundColor: '#f5f5f5', border: '1px solid #ddd' }}>{glReport}</div>
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Effect Code</label>
                    <div style={{ padding: '8px', backgroundColor: '#f5f5f5', border: '1px solid #ddd' }}>{glEffect}</div>
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Formula</label>
                    <div style={{ padding: '8px', backgroundColor: '#f5f5f5', border: '1px solid #ddd' }}>{formula}</div>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f9f9f9', borderTop: '1px dashed #ddd', fontSize: '12px', textAlign: 'right' }}>
                Account {currentAccountIndex + 1} of {accounts.length}
              </div>
            </div>
          )}

          {accounts.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              <p>No accounts in system</p>
              <p style={{ color: '#666' }}>Click ADD to create the first account</p>
            </div>
          )}

          <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <button className="btn btn-primary" onClick={handleAdd}>ADD</button>
            <button className="btn btn-secondary" onClick={() => setShowFindDialog(true)}>FIND</button>
            <button className="btn btn-secondary" onClick={handleEdit} disabled={!acctCode}>EDIT</button>
            <button className="btn btn-secondary" onClick={handleFirst} disabled={accounts.length === 0}>FIRST</button>
            <button className="btn btn-secondary" onClick={handlePrevious} disabled={accounts.length === 0}>PREV</button>
            <button className="btn btn-secondary" onClick={handleNext} disabled={accounts.length === 0}>NEXT</button>
            <button className="btn btn-secondary" onClick={handleLast} disabled={accounts.length === 0}>LAST</button>
            <button className="btn btn-danger" onClick={handleDelete} disabled={!acctCode}>DELETE</button>
          </div>

          {/* Find Dialog */}
          {showFindDialog && (
            <div className="modal-overlay" onClick={() => setShowFindDialog(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3 className="modal-title">Find Account by Code</h3>
                  <button onClick={() => setShowFindDialog(false)} className="modal-close">—</button>
                </div>
                <div className="form-group">
                  <label className="form-label">Account Code (Soft-Seek):</label>
                  <input
                    type="text"
                    className="form-input"
                    value={findCode}
                    onChange={(e) => setFindCode(e.target.value.toUpperCase())}
                    maxLength={4}
                    placeholder="Enter account code"
                    autoFocus
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button className="btn btn-secondary" onClick={() => setShowFindDialog(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleFind}>Find</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'editing' && (
        <div className="card">
          <h3>{editMode === 'add' ? 'Add New Account' : 'Edit Account'}</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">Account Code <span style={{ color: 'red' }}>*</span></label>
              <input
                type="text"
                className="form-input"
                value={acctCode}
                onChange={(e) => setAcctCode(e.target.value.toUpperCase())}
                maxLength={4}
                disabled={editMode === 'edit'}
                placeholder="4-char code"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description <span style={{ color: 'red' }}>*</span></label>
              <input
                type="text"
                className="form-input"
                value={acctDesc}
                onChange={(e) => setAcctDesc(e.target.value)}
                maxLength={30}
                placeholder="Account description"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Opening Balance</label>
              <input
                type="number"
                className="form-input"
                value={openBal}
                onChange={(e) => setOpenBal(e.target.value)}
                step="0.01"
                placeholder="0.00"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Current Debit</label>
              <input
                type="number"
                className="form-input"
                value={curDebit}
                onChange={(e) => setCurDebit(e.target.value)}
                step="0.01"
                placeholder="0.00"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Current Credit</label>
              <input
                type="number"
                className="form-input"
                value={curCredit}
                onChange={(e) => setCurCredit(e.target.value)}
                step="0.01"
                placeholder="0.00"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Report Code</label>
              <input
                type="text"
                className="form-input"
                value={glReport}
                onChange={(e) => setGlReport(e.target.value.toUpperCase())}
                maxLength={4}
                placeholder="Report code"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Effect Code</label>
              <input
                type="text"
                className="form-input"
                value={glEffect}
                onChange={(e) => setGlEffect(e.target.value.toUpperCase())}
                maxLength={3}
                placeholder="Effect code"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Formula <span style={{ color: 'red' }}>*</span></label>
              <select
                className="form-input"
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
              >
                <option value="DC">DC (Debit - Credit)</option>
                <option value="CD">CD (Credit - Debit)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Initialize at Year-End</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={initialize}
                  onChange={(e) => setInitialize(e.target.checked)}
                />
                {initialize ? 'YES' : 'NO'}
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button className="btn btn-secondary" onClick={handleCancel}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>Save</button>
          </div>
        </div>
      )}

      <table className="data-table" style={{ marginTop: '20px', display: accounts.length > 0 ? 'table' : 'none' }}>
        <thead>
          <tr>
            <th>Code</th>
            <th>Description</th>
            <th style={{ textAlign: 'right' }}>Open Bal</th>
            <th style={{ textAlign: 'right' }}>Cur Debit</th>
            <th style={{ textAlign: 'right' }}>Cur Credit</th>
            <th>Formula</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map(account => (
            <tr key={account.acctCode}>
              <td><strong>{account.acctCode}</strong></td>
              <td>{account.acctDesc}</td>
              <td style={{ textAlign: 'right' }}>{parseFloat(String(account.openBal || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              <td style={{ textAlign: 'right' }}>{parseFloat(String(account.curDebit || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              <td style={{ textAlign: 'right' }}>{parseFloat(String(account.curCredit || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              <td>{account.formula}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

