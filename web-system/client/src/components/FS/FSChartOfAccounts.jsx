import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FSChartOfAccounts.css';

/**
 * Chart of Accounts Editor - Complete Account Master File Management
 * Based on A_EDTCOD.PRG (Editcode.prg - Account Decodes File - Option 2)
 * 
 * Features:
 * - Add new accounts
 * - Find/browse accounts with soft-seek
 * - Edit account details
 * - Delete accounts
 * - Navigate through accounts (Next/Previous/First/Last)
 * - All 9 fields from fs_accounts table
 */
const FSChartOfAccounts = () => {
  const API_BASE = 'http://localhost:5081/api/fs';

  // Main Display State
  const [accounts, setAccounts] = useState([]);
  const [currentAccountCode, setCurrentAccountCode] = useState('');
  const [currentAccountIndex, setCurrentAccountIndex] = useState(0);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Account Data State
  const [acctCode, setAcctCode] = useState('');
  const [acctDesc, setAcctDesc] = useState('');
  const [openBal, setOpenBal] = useState('0.00');
  const [curDebit, setCurDebit] = useState('0.00');
  const [curCredit, setCurCredit] = useState('0.00');
  const [glReport, setGlReport] = useState('');
  const [glEffect, setGlEffect] = useState('');
  const [formula, setFormula] = useState('DC');
  const [initialize, setInitialize] = useState(false);

  // UI State
  const [activeTab, setActiveTab] = useState('main');
  const [editMode, setEditMode] = useState(null); // null, 'add', or 'edit'
  const [findCode, setFindCode] = useState('');
  const [showFindDialog, setShowFindDialog] = useState(false);

  // Load all accounts on startup
  useEffect(() => {
    loadAllAccounts();
  }, []);

  // Update display when currentAccountIndex changes
  useEffect(() => {
    if (accounts.length > 0 && currentAccountIndex >= 0 && currentAccountIndex < accounts.length) {
      displayAccount(accounts[currentAccountIndex]);
    }
  }, [currentAccountIndex, accounts]);

  /**
   * Load all accounts from database
   */
  const loadAllAccounts = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/accounts`);
      const data = response.data?.data || response.data || [];
      setAccounts(data);
      if (data.length > 0) {
        setCurrentAccountIndex(0);
        displayAccount(data[0]);
      } else {
        clearDisplay();
      }
      setMessage('');
    } catch (error) {
      setMessage(`Error loading accounts: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Display account on main screen
   */
  const displayAccount = (account) => {
    setAcctCode(account.acctCode || '');
    setAcctDesc(account.acctDesc || '');
    setOpenBal(parseFloat(account.openBal || 0).toFixed(2));
    setCurDebit(parseFloat(account.curDebit || 0).toFixed(2));
    setCurCredit(parseFloat(account.curCredit || 0).toFixed(2));
    setGlReport(account.glReport || '');
    setGlEffect(account.glEffect || '');
    setFormula(account.formula || 'DC');
    setInitialize(account.initialize === true || account.initialize === 'Y');
  };

  /**
   * Clear display fields
   */
  const clearDisplay = () => {
    setAcctCode('');
    setAcctDesc('');
    setOpenBal('0.00');
    setCurDebit('0.00');
    setCurCredit('0.00');
    setGlReport('');
    setGlEffect('');
    setFormula('DC');
    setInitialize(false);
  };

  /**
   * Find account by code (soft-seek)
   */
  const handleFind = async () => {
    if (!findCode.trim()) {
      setMessage('Please enter an account code');
      return;
    }

    try {
      const response = await axios.get(`${API_BASE}/accounts/navigation/seek/${findCode}`);
      const account = response.data?.data;
      if (account) {
        const index = accounts.findIndex(a => a.acctCode === account.acctCode);
        if (index >= 0) {
          setCurrentAccountIndex(index);
          setMessage('');
        }
      } else {
        setMessage(`No account found with code >= "${findCode}"`);
      }
    } catch (error) {
      setMessage(`Find failed: ${error.message}`);
    }
    setShowFindDialog(false);
    setFindCode('');
  };

  /**
   * Navigate to next account
   */
  const handleNext = async () => {
    if (accounts.length === 0) {
      setMessage('No accounts to navigate');
      return;
    }

    if (currentAccountIndex >= accounts.length - 1) {
      setMessage('This is the last record!');
      return;
    }

    setCurrentAccountIndex(currentAccountIndex + 1);
  };

  /**
   * Navigate to previous account
   */
  const handlePrevious = async () => {
    if (accounts.length === 0) {
      setMessage('No accounts to navigate');
      return;
    }

    if (currentAccountIndex <= 0) {
      setMessage('This is the first record!');
      return;
    }

    setCurrentAccountIndex(currentAccountIndex - 1);
  };

  /**
   * Navigate to first account
   */
  const handleFirst = async () => {
    if (accounts.length === 0) {
      setMessage('No accounts');
      return;
    }
    setCurrentAccountIndex(0);
  };

  /**
   * Navigate to last account
   */
  const handleLast = async () => {
    if (accounts.length === 0) {
      setMessage('No accounts');
      return;
    }
    setCurrentAccountIndex(accounts.length - 1);
  };

  /**
   * Start adding new account
   */
  const handleAdd = () => {
    setAcctCode('');
    setAcctDesc('');
    setOpenBal('0.00');
    setCurDebit('0.00');
    setCurCredit('0.00');
    setGlReport('');
    setGlEffect('');
    setFormula('DC');
    setInitialize(false);
    setEditMode('add');
    setActiveTab('editing');
  };

  /**
   * Start editing current account
   */
  const handleEdit = () => {
    if (accounts.length === 0 || !acctCode) {
      setMessage('No account selected to edit');
      return;
    }
    setEditMode('edit');
    setActiveTab('editing');
  };

  /**
   * Save account (Add or Edit)
   */
  const handleSave = async () => {
    // Validation
    if (!acctCode.trim()) {
      setMessage('Account Code is required');
      return;
    }
    if (!acctDesc.trim()) {
      setMessage('Account Description is required');
      return;
    }
    if (!['CD', 'DC'].includes(formula.toUpperCase())) {
      setMessage('Formula must be either CD or DC');
      return;
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
    };

    try {
      if (editMode === 'add') {
        const response = await axios.post(`${API_BASE}/accounts`, accountData);
        setMessage(`Account ${accountData.acctCode} added successfully`);
        setAccounts([...accounts, response.data?.data || accountData]);
      } else if (editMode === 'edit') {
        await axios.put(`${API_BASE}/accounts/${acctCode}`, accountData);
        // Update in local array
        const updatedAccounts = accounts.map(a => 
          a.acctCode === acctCode ? { ...a, ...accountData } : a
        );
        setAccounts(updatedAccounts);
        setMessage(`Account ${accountData.acctCode} updated successfully`);
      }
      
      setActiveTab('main');
      setEditMode(null);
    } catch (error) {
      setMessage(`Error saving account: ${error.response?.data?.message || error.message}`);
    }
  };

  /**
   * Delete current account
   */
  const handleDelete = async () => {
    if (!acctCode) {
      setMessage('No account selected to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete account ${acctCode}?`)) {
      return;
    }

    try {
      await axios.delete(`${API_BASE}/accounts/${acctCode}`);
      const updatedAccounts = accounts.filter(a => a.acctCode !== acctCode);
      setAccounts(updatedAccounts);
      
      if (updatedAccounts.length > 0) {
        if (currentAccountIndex >= updatedAccounts.length) {
          setCurrentAccountIndex(updatedAccounts.length - 1);
        } else {
          displayAccount(updatedAccounts[currentAccountIndex]);
        }
      } else {
        clearDisplay();
      }
      
      setMessage(`Account ${acctCode} deleted successfully`);
    } catch (error) {
      setMessage(`Error deleting account: ${error.message}`);
    }
  };

  /**
   * Cancel editing
   */
  const handleCancel = () => {
    setActiveTab('main');
    setEditMode(null);
    if (accounts.length > 0) {
      displayAccount(accounts[currentAccountIndex]);
    }
  };

  return (
    <div className="fs-container fs-chart-of-accounts">
      <div className="fs-header">
        <h2>CHART OF ACCOUNTS MAINTENANCE</h2>
        {isLoading && <span className="fs-loading"> Loading...</span>}
      </div>

      {message && (
        <div className={`fs-message ${message.includes('Error') || message.includes('sure') ? 'error' : 'info'}`}>
          {message}
        </div>
      )}

      {/* MAIN VIEW */}
      {activeTab === 'main' && (
        <div className="fs-main-view">
          {/* Account Display Section */}
          {accounts.length > 0 ? (
            <div className="fs-display-section">
              <div className="fs-field-group">
                <label>ACCOUNT CODE</label>
                <div className="fs-display">{acctCode}</div>
              </div>

              <div className="fs-field-group">
                <label>DESCRIPTION</label>
                <div className="fs-display">{acctDesc}</div>
              </div>

              <div className="fs-fields-row">
                <div className="fs-field-group">
                  <label>OPENING BALANCE</label>
                  <div className="fs-display">{parseFloat(openBal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div className="fs-field-group">
                  <label>CURRENT DEBIT</label>
                  <div className="fs-display">{parseFloat(curDebit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div className="fs-field-group">
                  <label>CURRENT CREDIT</label>
                  <div className="fs-display">{parseFloat(curCredit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
              </div>

              <div className="fs-fields-row">
                <div className="fs-field-group">
                  <label>REPORT CODE</label>
                  <div className="fs-display">{glReport}</div>
                </div>
                <div className="fs-field-group">
                  <label>EFFECT CODE</label>
                  <div className="fs-display">{glEffect}</div>
                </div>
              </div>

              <div className="fs-fields-row">
                <div className="fs-field-group">
                  <label>FORMULA (CD/DC)</label>
                  <div className="fs-display">{formula}</div>
                </div>
                <div className="fs-field-group">
                  <label>INIT. AT YR-END</label>
                  <div className="fs-display">{initialize ? 'Y' : 'N'}</div>
                </div>
              </div>

              <div className="fs-position-indicator">
                Account {currentAccountIndex + 1} of {accounts.length}
              </div>
            </div>
          ) : (
            <div className="fs-no-data">
              <p>No accounts in system</p>
              <p>Click ADD to create the first account</p>
            </div>
          )}

          {/* Menu Buttons */}
          <div className="fs-menu">
            <button className="fs-btn fs-btn-menu" onClick={handleAdd}>ADD</button>
            <button className="fs-btn fs-btn-menu" onClick={() => setShowFindDialog(true)}>FIND</button>
            <button className="fs-btn fs-btn-menu" onClick={handleEdit} disabled={!acctCode}>EDIT</button>
            <button className="fs-btn fs-btn-menu" onClick={handleFirst} disabled={accounts.length === 0}>FIRST</button>
            <button className="fs-btn fs-btn-menu" onClick={handlePrevious} disabled={accounts.length === 0}>PREV</button>
            <button className="fs-btn fs-btn-menu" onClick={handleNext} disabled={accounts.length === 0}>NEXT</button>
            <button className="fs-btn fs-btn-menu" onClick={handleLast} disabled={accounts.length === 0}>LAST</button>
            <button className="fs-btn fs-btn-menu" onClick={handleDelete} disabled={!acctCode}>DELETE</button>
          </div>
        </div>
      )}

      {/* FIND DIALOG */}
      {showFindDialog && (
        <div className="fs-modal-overlay">
          <div className="fs-modal">
            <h3>FIND ACCOUNT BY CODE</h3>
            <div className="fs-field-group">
              <label>Account Code (Soft-Seek):</label>
              <input
                type="text"
                className="fs-input"
                value={findCode}
                onChange={(e) => setFindCode(e.target.value.toUpperCase())}
                maxLength="4"
                placeholder="Enter account code"
                autoFocus
              />
            </div>
            <div className="fs-modal-buttons">
              <button className="fs-btn fs-btn-action" onClick={handleFind}>FIND</button>
              <button className="fs-btn fs-btn-cancel" onClick={() => setShowFindDialog(false)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}

      {/* EDITING VIEW */}
      {activeTab === 'editing' && (
        <div className="fs-editing-view">
          <div className="fs-edit-section">
            <h3>{editMode === 'add' ? 'ADD NEW ACCOUNT' : 'EDIT ACCOUNT'}</h3>

            <div className="fs-form-group">
              <label>Account Code <span className="required">*</span></label>
              <input
                type="text"
                className="fs-input"
                value={acctCode}
                onChange={(e) => setAcctCode(e.target.value.toUpperCase())}
                maxLength="4"
                disabled={editMode === 'edit'}
                placeholder="4-char code (e.g., 1000)"
                autoFocus
              />
            </div>

            <div className="fs-form-group">
              <label>Description <span className="required">*</span></label>
              <input
                type="text"
                className="fs-input"
                value={acctDesc}
                onChange={(e) => setAcctDesc(e.target.value)}
                maxLength="30"
                placeholder="Account description"
              />
            </div>

            <div className="fs-form-group-row">
              <div className="fs-form-group">
                <label>Opening Balance</label>
                <input
                  type="number"
                  className="fs-input"
                  value={openBal}
                  onChange={(e) => setOpenBal(e.target.value)}
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div className="fs-form-group">
                <label>Current Debit</label>
                <input
                  type="number"
                  className="fs-input"
                  value={curDebit}
                  onChange={(e) => setCurDebit(e.target.value)}
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div className="fs-form-group">
                <label>Current Credit</label>
                <input
                  type="number"
                  className="fs-input"
                  value={curCredit}
                  onChange={(e) => setCurCredit(e.target.value)}
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="fs-form-group-row">
              <div className="fs-form-group">
                <label>Report Code</label>
                <input
                  type="text"
                  className="fs-input"
                  value={glReport}
                  onChange={(e) => setGlReport(e.target.value.toUpperCase())}
                  maxLength="4"
                  placeholder="Report code"
                />
              </div>

              <div className="fs-form-group">
                <label>Effect Code</label>
                <input
                  type="text"
                  className="fs-input"
                  value={glEffect}
                  onChange={(e) => setGlEffect(e.target.value.toUpperCase())}
                  maxLength="3"
                  placeholder="Effect code"
                />
              </div>
            </div>

            <div className="fs-form-group-row">
              <div className="fs-form-group">
                <label>Formula <span className="required">*</span></label>
                <select
                  className="fs-input"
                  value={formula}
                  onChange={(e) => setFormula(e.target.value)}
                >
                  <option value="DC">DC (Debit - Credit)</option>
                  <option value="CD">CD (Credit - Debit)</option>
                </select>
              </div>

              <div className="fs-form-group">
                <label>Initialize at Year-End</label>
                <div className="fs-checkbox">
                  <input
                    type="checkbox"
                    checked={initialize}
                    onChange={(e) => setInitialize(e.target.checked)}
                  />
                  <span>{initialize ? 'YES' : 'NO'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="fs-edit-buttons">
            <button className="fs-btn fs-btn-save" onClick={handleSave}>SAVE</button>
            <button className="fs-btn fs-btn-cancel" onClick={handleCancel}>CANCEL</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FSChartOfAccounts;
