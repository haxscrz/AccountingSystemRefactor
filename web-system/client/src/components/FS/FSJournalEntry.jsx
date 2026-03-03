import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FSJournalEntry.css';

/**
 * Journal Entry Editor - Handles all 5 Journal Types
 * Based on A_EDTJNL.PRG (A_EDTJNL.PRG - Edit Transactions)
 * 
 * Types:
 * 1 = Cash Receipts (cashrcpt table)
 * 2 = Sales Book (salebook table)
 * 3 = Journal Voucher (journals table)
 * 4 = Purchase Book (purcbook table)
 * 5 = Adjustments (adjstmnt table)
 * 
 * Features:
 * - Add new transactions
 * - Find/browse transactions
 * - Edit transaction details
 * - Delete transactions
 * - Navigate through transactions (Next/Previous/First/Last)
 * - Mandatory balance validation (must be balanced to exit)
 * - Real-time total calculations
 */
const FSJournalEntry = ({ journalType = 3 }) => {
  const API_BASE = 'http://localhost:5081/api/fs';

  // Journal type labels
  const JOURNAL_TYPES = {
    1: 'CASH RECEIPTS',
    2: 'SALES BOOK',
    3: 'JOURNAL VOUCHER',
    4: 'PURCHASE BOOK',
    5: 'ADJUSTMENTS'
  };

  const TABLE_NAMES = {
    1: 'cashrcpt',
    2: 'salebook',
    3: 'journals',
    4: 'purcbook',
    5: 'adjstmnt'
  };

  // Main Display State
  const [transactions, setTransactions] = useState([]);
  const [currentTransIndex, setCurrentTransIndex] = useState(0);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Transaction Data State
  const [jJvNo, setJJvNo] = useState('');
  const [jDate, setJDate] = useState('');
  const [acctCode, setAcctCode] = useState('');
  const [jCkAmt, setJCkAmt] = useState('0.00');
  const [jDOrC, setJDOrC] = useState('D');

  // Totals State
  const [totalDebit, setTotalDebit] = useState('0.00');
  const [totalCredit, setTotalCredit] = useState('0.00');
  const [balance, setBalance] = useState('0.00');
  const [isBalanced, setIsBalanced] = useState(false);

  // UI State
  const [activeTab, setActiveTab] = useState('main');
  const [editMode, setEditMode] = useState(null); // null, 'add', or 'edit'
  const [findDate, setFindDate] = useState('');
  const [showFindDialog, setShowFindDialog] = useState(false);

  // Load all transactions on startup and when journal type changes
  useEffect(() => {
    loadAllTransactions();
  }, [journalType]);

  // Update display when currentTransIndex changes
  useEffect(() => {
    if (transactions.length > 0 && currentTransIndex >= 0 && currentTransIndex < transactions.length) {
      displayTransaction(transactions[currentTransIndex]);
    }
  }, [currentTransIndex, transactions]);

  // Calculate totals when transactions change
  useEffect(() => {
    calculateTotals();
  }, [transactions]);

  /**
   * Load all transactions from database for the current journal type
   */
  const loadAllTransactions = async () => {
    setIsLoading(true);
    try {
      const tableName = TABLE_NAMES[journalType];
      const response = await axios.get(`${API_BASE}/${tableName}`);
      const data = response.data?.data || response.data || [];
      setTransactions(data);
      if (data.length > 0) {
        setCurrentTransIndex(0);
        displayTransaction(data[0]);
      } else {
        clearDisplay();
      }
      setMessage('');
    } catch (error) {
      setMessage(`Error loading transactions: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Display transaction on main screen
   */
  const displayTransaction = (trans) => {
    setJJvNo(trans.jJvNo || '');
    setJDate(trans.jDate ? new Date(trans.jDate).toISOString().split('T')[0] : '');
    setAcctCode(trans.acctCode || '');
    setJCkAmt(parseFloat(trans.jCkAmt || 0).toFixed(2));
    setJDOrC(trans.jDOrC || 'D');
  };

  /**
   * Clear display fields
   */
  const clearDisplay = () => {
    setJJvNo('');
    setJDate('');
    setAcctCode('');
    setJCkAmt('0.00');
    setJDOrC('D');
  };

  /**
   * Calculate totals and balance
   */
  const calculateTotals = () => {
    let debit = 0;
    let credit = 0;

    transactions.forEach(trans => {
      const amount = parseFloat(trans.jCkAmt) || 0;
      if (trans.jDOrC === 'D') {
        debit += amount;
      } else {
        credit += amount;
      }
    });

    const debitStr = debit.toFixed(2);
    const creditStr = credit.toFixed(2);
    const balanceVal = debit - credit;
    const balanceStr = balanceVal.toFixed(2);

    setTotalDebit(debitStr);
    setTotalCredit(creditStr);
    setBalance(balanceStr);
    setIsBalanced(Math.abs(balanceVal) < 0.01); // Account for floating point errors
  };

  /**
   * Find transaction by date (soft-seek)
   */
  const handleFind = () => {
    if (!findDate.trim()) {
      setMessage('Please enter a date (YYYY-MM-DD)');
      return;
    }

    const searchDate = new Date(findDate).toISOString().split('T')[0];
    const index = transactions.findIndex(t => {
      const transDate = t.jDate ? new Date(t.jDate).toISOString().split('T')[0] : '';
      return transDate >= searchDate;
    });

    if (index >= 0) {
      setCurrentTransIndex(index);
      setMessage('');
    } else {
      setMessage(`No transaction found with date >= "${findDate}"`);
    }

    setShowFindDialog(false);
    setFindDate('');
  };

  /**
   * Navigate to next transaction
   */
  const handleNext = () => {
    if (transactions.length === 0) {
      setMessage('No transactions to navigate');
      return;
    }

    if (currentTransIndex >= transactions.length - 1) {
      setMessage('Last record in file!');
      return;
    }

    setCurrentTransIndex(currentTransIndex + 1);
  };

  /**
   * Navigate to previous transaction
   */
  const handlePrevious = () => {
    if (transactions.length === 0) {
      setMessage('No transactions to navigate');
      return;
    }

    if (currentTransIndex <= 0) {
      setMessage('First record in file!');
      return;
    }

    setCurrentTransIndex(currentTransIndex - 1);
  };

  /**
   * Navigate to first transaction
   */
  const handleFirst = () => {
    if (transactions.length === 0) {
      setMessage('No transactions');
      return;
    }
    setCurrentTransIndex(0);
  };

  /**
   * Navigate to last transaction
   */
  const handleLast = () => {
    if (transactions.length === 0) {
      setMessage('No transactions');
      return;
    }
    setCurrentTransIndex(transactions.length - 1);
  };

  /**
   * Start adding new transaction
   */
  const handleAdd = () => {
    setJJvNo('');
    setJDate(new Date().toISOString().split('T')[0]);
    setAcctCode('');
    setJCkAmt('0.00');
    setJDOrC('D');
    setEditMode('add');
    setActiveTab('editing');
  };

  /**
   * Start editing current transaction
   */
  const handleEdit = () => {
    if (transactions.length === 0 || !jJvNo) {
      setMessage('No transaction selected to edit');
      return;
    }
    setEditMode('edit');
    setActiveTab('editing');
  };

  /**
   * Save transaction (Add or Edit)
   */
  const handleSave = async () => {
    // Validation
    if (!jJvNo.trim()) {
      setMessage('Reference is required');
      return;
    }
    if (!jDate.trim()) {
      setMessage('Date is required');
      return;
    }
    if (!acctCode.trim()) {
      setMessage('Account Code is required');
      return;
    }
    if (parseFloat(jCkAmt) === 0) {
      setMessage('Amount must be greater than zero');
      return;
    }
    if (!['D', 'C'].includes(jDOrC)) {
      setMessage('Debit/Credit must be D or C');
      return;
    }

    const tableName = TABLE_NAMES[journalType];
    const transData = {
      jJvNo: jJvNo.toUpperCase(),
      jDate: new Date(jDate),
      acctCode: acctCode.toUpperCase(),
      jCkAmt: parseFloat(jCkAmt) || 0,
      jDOrC: jDOrC.toUpperCase()
    };

    try {
      if (editMode === 'add') {
        const response = await axios.post(`${API_BASE}/${tableName}`, transData);
        setMessage(`Transaction added successfully`);
        setTransactions([...transactions, response.data?.data || transData]);
      } else if (editMode === 'edit') {
        const currentId = transactions[currentTransIndex].id;
        await axios.put(`${API_BASE}/${tableName}/${currentId}`, transData);
        // Update in local array
        const updatedTrans = transactions.map((t, i) => 
          i === currentTransIndex ? { ...t, ...transData } : t
        );
        setTransactions(updatedTrans);
        setMessage(`Transaction updated successfully`);
      }

      setActiveTab('main');
      setEditMode(null);
    } catch (error) {
      setMessage(`Error saving transaction: ${error.response?.data?.message || error.message}`);
    }
  };

  /**
   * Delete current transaction
   */
  const handleDelete = async () => {
    if (!jJvNo) {
      setMessage('No transaction selected to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete this transaction?`)) {
      return;
    }

    try {
      const tableName = TABLE_NAMES[journalType];
      const currentId = transactions[currentTransIndex].id;
      await axios.delete(`${API_BASE}/${tableName}/${currentId}`);
      
      const updatedTrans = transactions.filter((_, i) => i !== currentTransIndex);
      setTransactions(updatedTrans);
      
      if (updatedTrans.length > 0) {
        if (currentTransIndex >= updatedTrans.length) {
          setCurrentTransIndex(updatedTrans.length - 1);
        } else {
          displayTransaction(updatedTrans[currentTransIndex]);
        }
      } else {
        clearDisplay();
      }
      
      setMessage('Transaction deleted successfully');
    } catch (error) {
      setMessage(`Error deleting transaction: ${error.message}`);
    }
  };

  /**
   * Cancel editing
   */
  const handleCancel = () => {
    setActiveTab('main');
    setEditMode(null);
    if (transactions.length > 0) {
      displayTransaction(transactions[currentTransIndex]);
    }
  };

  /**
   * Attempt to quit - check balance
   */
  const handleQuit = () => {
    if (!isBalanced) {
      setMessage('BALANCE NOT ZERO - Cannot exit! Total Debit must equal Total Credit.');
      return;
    }
    // In a real app, this would exit. For now, just show success
    setMessage('All transactions balanced. Ready to post.');
  };

  return (
    <div className="fs-container fs-journal-entry">
      <div className="fs-header">
        <h2>{JOURNAL_TYPES[journalType]}</h2>
        {isLoading && <span className="fs-loading"> Loading...</span>}
      </div>

      {message && (
        <div className={`fs-message ${message.includes('Error') || message.includes('Cannot') ? 'error' : 'info'}`}>
          {message}
        </div>
      )}

      {/* Balance Status */}
      {activeTab === 'main' && (
        <div className={`fs-balance-box ${isBalanced ? 'balanced' : 'unbalanced'}`}>
          <div className="fs-balance-item">
            <span className="fs-label">TOTAL DEBIT</span>
            <span className="fs-value">{parseFloat(totalDebit).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="fs-balance-item">
            <span className="fs-label">TOTAL CREDIT</span>
            <span className="fs-value">{parseFloat(totalCredit).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className={`fs-balance-item fs-balance ${isBalanced ? 'balanced' : ''}`}>
            <span className="fs-label">BALANCE</span>
            <span className="fs-value">{parseFloat(balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      )}

      {/* MAIN VIEW */}
      {activeTab === 'main' && (
        <div className="fs-main-view">
          {/* Transaction Display Section */}
          {transactions.length > 0 ? (
            <div className="fs-display-section">
              <div className="fs-field-group">
                <label>REFERENCE</label>
                <div className="fs-display">{jJvNo}</div>
              </div>

              <div className="fs-field-group">
                <label>DATE</label>
                <div className="fs-display">{jDate}</div>
              </div>

              <div className="fs-field-group">
                <label>ACCOUNT CODE</label>
                <div className="fs-display">{acctCode}</div>
              </div>

              <div className="fs-field-group">
                <label>AMOUNT</label>
                <div className="fs-display">{parseFloat(jCkAmt).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              </div>

              <div className="fs-field-group">
                <label>DEBIT/CREDIT</label>
                <div className="fs-display">{jDOrC === 'D' ? 'DEBIT' : 'CREDIT'}</div>
              </div>

              <div className="fs-position-indicator">
                Transaction {currentTransIndex + 1} of {transactions.length}
              </div>
            </div>
          ) : (
            <div className="fs-no-data">
              <p>No transactions in this journal</p>
              <p>Click ADD to create the first transaction</p>
            </div>
          )}

          {/* Menu Buttons */}
          <div className="fs-menu">
            <button className="fs-btn fs-btn-menu" onClick={handleAdd}>ADD</button>
            <button className="fs-btn fs-btn-menu" onClick={() => setShowFindDialog(true)}>FIND</button>
            <button className="fs-btn fs-btn-menu" onClick={handleEdit} disabled={!jJvNo}>EDIT</button>
            <button className="fs-btn fs-btn-menu" onClick={handleFirst} disabled={transactions.length === 0}>FIRST</button>
            <button className="fs-btn fs-btn-menu" onClick={handlePrevious} disabled={transactions.length === 0}>PREV</button>
            <button className="fs-btn fs-btn-menu" onClick={handleNext} disabled={transactions.length === 0}>NEXT</button>
            <button className="fs-btn fs-btn-menu" onClick={handleLast} disabled={transactions.length === 0}>LAST</button>
            <button className="fs-btn fs-btn-menu" onClick={handleDelete} disabled={!jJvNo}>DELETE</button>
            <button className={`fs-btn fs-btn-menu fs-btn-quit ${isBalanced ? 'balanced' : ''}`} onClick={handleQuit}>QUIT</button>
          </div>
        </div>
      )}

      {/* FIND DIALOG */}
      {showFindDialog && (
        <div className="fs-modal-overlay">
          <div className="fs-modal">
            <h3>FIND TRANSACTION BY DATE</h3>
            <div className="fs-field-group">
              <label>Date (Soft-Seek):</label>
              <input
                type="date"
                className="fs-input"
                value={findDate}
                onChange={(e) => setFindDate(e.target.value)}
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
            <h3>{editMode === 'add' ? 'ADD NEW TRANSACTION' : 'EDIT TRANSACTION'}</h3>

            <div className="fs-form-group">
              <label>Reference <span className="required">*</span></label>
              <input
                type="text"
                className="fs-input"
                value={jJvNo}
                onChange={(e) => setJJvNo(e.target.value.toUpperCase())}
                maxLength="8"
                placeholder="JV Number"
                autoFocus
              />
            </div>

            <div className="fs-form-group">
              <label>Date <span className="required">*</span></label>
              <input
                type="date"
                className="fs-input"
                value={jDate}
                onChange={(e) => setJDate(e.target.value)}
              />
            </div>

            <div className="fs-form-group">
              <label>Account Code <span className="required">*</span></label>
              <input
                type="text"
                className="fs-input"
                value={acctCode}
                onChange={(e) => setAcctCode(e.target.value.toUpperCase())}
                maxLength="4"
                placeholder="4-char account code"
              />
            </div>

            <div className="fs-form-group">
              <label>Amount <span className="required">*</span></label>
              <input
                type="number"
                className="fs-input"
                value={jCkAmt}
                onChange={(e) => setJCkAmt(e.target.value)}
                step="0.01"
                min="0.01"
                placeholder="0.00"
              />
            </div>

            <div className="fs-form-group">
              <label>Debit/Credit <span className="required">*</span></label>
              <select
                className="fs-input"
                value={jDOrC}
                onChange={(e) => setJDOrC(e.target.value)}
              >
                <option value="D">DEBIT</option>
                <option value="C">CREDIT</option>
              </select>
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

export default FSJournalEntry;
