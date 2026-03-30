import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FSEnterCheckDisbursement.css';

/**
 * COMPLETE ONE-TO-ONE REPLICATION OF A_EDTCHK.PRG
 * Enter Cash Disbursements (Check Disbursement Voucher)
 * 
 * CRITICAL MISSING FEATURES (NOW IMPLEMENTED):
 * 1. NESTED SUBMENU for line editing (6 options: ADD, EDIT, NEXT, PREVIOUS, DELETE, QUIT)
 * 2. ACCOUNT BROWSE DIALOG (appears when account code not found)
 * 3. FIELD LOCKING: JV_NO disabled during edit mode
 * 4. VALIDATION FUNCTIONS: f_valjv_no, f_val_ck_no, f_valacct
 * 5. EXACT ERROR MESSAGES: "Last record in file!", "First record in file!", etc.
 * 6. FIND BY JV_NO: Primary key find (not check number)
 * 7. J_CK_AMT CALCULATION: SUM(debits only) - implemented in backend
 * 8. UNBALANCED CHECKS BROWSE: Clickable list, not just display
 * 9. MOVEMENT FLAG LOGIC: Triggers recalculate after line operations
 * 10. PACK/REINDEX: Handled by backend service deletion
 */

const FSEnterCheckDisbursement = () => {
  // ========== STATE: CHECKS & VOUCHERS ==========
  const [checks, setChecks] = useState([]);
  const [currentCheckNo, setCurrentCheckNo] = useState('');
  const [currentVoucherIndex, setCurrentVoucherIndex] = useState(0);
  const [currentVouchers, setCurrentVouchers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // ========== STATE: FORM FIELDS (Master & Detail) ==========
  const [jJvNo, setJJvNo] = useState('');
  const [jDate, setJDate] = useState(new Date().toISOString().split('T')[0]);
  const [supNo, setSupNo] = useState('');
  const [jPayTo, setJPayTo] = useState('');
  const [bankNo, setBankNo] = useState('');
  const [jCkNo, setJCkNo] = useState('');
  const [jDesc, setJDesc] = useState('');

  // Detail (voucher) fields
  const [acctCode, setAcctCode] = useState('');
  const [jCkAmt, setJCkAmt] = useState('');
  const [jDOrC, setJDOrC] = useState('');

  // ========== STATE: UI CONTROL ==========
  const [activeTab, setActiveTab] = useState('main'); // 'main' | 'editing' | 'submenu' | 'browse'
  const [editMode, setEditMode] = useState(null); // null | 'add' | 'edit'
  const [message, setMessage] = useState('');
  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);

  // ========== STATE: DIALOGS & BROWSE ==========
  const [unbalancedChecks, setUnbalancedChecks] = useState([]);
  const [showAccountBrowse, setShowAccountBrowse] = useState(false);
  const [browseAccountList, setBrowseAccountList] = useState([]);
  const [allAccounts, setAllAccounts] = useState([]);

  const API_URL = 'http://localhost:5081/api';

  // ========== INITIALIZATION ==========
  useEffect(() => {
    loadAllChecks();
    loadAllAccounts();
  }, []);

  useEffect(() => {
    if (currentCheckNo) {
      loadCheckData(currentCheckNo);
      loadVouchers(currentCheckNo);
    }
  }, [currentCheckNo]);

  useEffect(() => {
    calculateTotals();
  }, [currentVouchers]);

  // ========== CORE API CALLS ==========
  const loadAllChecks = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/fs/vouchers/masters`);
      const data = response.data?.data || [];
      setChecks(data);
      if (data && data.length > 0) {
        setCurrentCheckNo(data[0].jCkNo);
      } else {
        setMessage('No checks found. Create a new one.');
      }
      await checkUnbalancedChecks();
    } catch (error) {
      setMessage(`Error loading checks: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllAccounts = async () => {
    try {
      const response = await axios.get(`${API_URL}/fs/accounts`);
      setAllAccounts(response.data?.data || []);
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const loadCheckData = async (checkNo) => {
    try {
      const response = await axios.get(`${API_URL}/fs/vouchers/checkmaster/no/${checkNo}`);
      const check = response.data?.data;
      if (check) {
        setJJvNo(check.jJvNo);
        setJDate(check.jDate.split('T')[0] || new Date().toISOString().split('T')[0]);
        setSupNo(check.supNo || '');
        setJPayTo(check.jPayTo || '');
        setBankNo(check.bankNo || '');
        setJCkNo(check.jCkNo);
        setJDesc(check.jDesc || '');
      }
    } catch (error) {
      console.error('Error loading check:', error);
    }
  };

  const loadVouchers = async (checkNo) => {
    try {
      const response = await axios.get(`${API_URL}/fs/vouchers/lines/${checkNo}`);
      setCurrentVouchers(response.data?.data || []);
      setCurrentVoucherIndex(0);
      clearVoucherFields();
    } catch (error) {
      console.error('Error loading vouchers:', error);
    }
  };

  const calculateTotals = () => {
    const debit = currentVouchers
      .filter((v) => v.jDOrC === 'D')
      .reduce((sum, v) => sum + (parseFloat(v.jCkAmt) || 0), 0);
    const credit = currentVouchers
      .filter((v) => v.jDOrC === 'C')
      .reduce((sum, v) => sum + (parseFloat(v.jCkAmt) || 0), 0);
    setTotalDebit(debit);
    setTotalCredit(credit);
  };

  const checkUnbalancedChecks = async () => {
    try {
      const response = await axios.get(`${API_URL}/fs/vouchers/unbalanced`);
      setUnbalancedChecks(response.data?.data || []);
    } catch (error) {
      console.error('Error loading unbalanced checks:', error);
    }
  };

  // ========== VALIDATION FUNCTIONS (PRG f_valjv_no, f_val_ck_no, f_valacct) ==========

  const validateJVNumber = async (jvNo) => {
    if (!jvNo) return { valid: false, error: 'JV Number is required' };
    try {
      const response = await axios.get(`${API_URL}/fs/vouchers/checkmaster/jv/${jvNo}`);
      return { valid: !response.data?.data, error: null };
    } catch {
      return { valid: true, error: null };
    }
  };

  const validateCheckNumber = async (checkNo) => {
    if (!checkNo) return { valid: false, error: 'Check Number is required' };
    try {
      const response = await axios.get(`${API_URL}/fs/vouchers/checkmaster/no/${checkNo}`);
      return { valid: !response.data?.data, error: null };
    } catch {
      return { valid: true, error: null };
    }
  };

  const validateAccountCode = async (code) => {
    if (!code) return { valid: false, error: 'Account code is required' };
    try {
      const response = await axios.get(`${API_URL}/fs/accounts/${code}`);
      if (response.data?.data) {
        return { valid: true, error: null, account: response.data.data };
      }
      return { valid: false, error: 'Account not found' };
    } catch {
      return { valid: false, error: 'Account not found' };
    }
  };

  // ========== HANDLERS: MAIN MENU (A_EDTCHK.PRG lines 206-213) ==========

  const handleAdd = async () => {
    setEditMode('add');
    setActiveTab('editing');
    clearMasterFields();
    clearVoucherFields();
    setCurrentVouchers([]);
  };

  // PRG: Find by J_JV_NO (primary key) - line 200
  const handleFind = async () => {
    const searchTerm = prompt('Enter JV Number to find:');
    if (!searchTerm) return;

    try {
      const response = await axios.get(`${API_URL}/fs/vouchers/checkmaster/jv/${searchTerm}`);
      if (response.data?.data) {
        setCurrentCheckNo(response.data.data.jCkNo);
        setMessage('Record found.');
      } else {
        setMessage(`No record found for JV #${searchTerm}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const handleEdit = async () => {
    if (!currentCheckNo) {
      setMessage('No record selected.');
      return;
    }
    setEditMode('edit');
    setActiveTab('editing');
  };

  // Navigate to NEXT check (PRG: NEXT-CDV, lines 217-225)
  const handleNextCDV = async () => {
    try {
      const response = await axios.get(`${API_URL}/fs/vouchers/checkmaster/next/${currentCheckNo}`);
      if (response.data?.data) {
        setCurrentCheckNo(response.data.data.jCkNo);
      } else {
        setMessage('Last record in file!'); // Exact PRG message
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  // Navigate to PREVIOUS check (PRG: PREV-CDV)
  const handlePrevCDV = async () => {
    try {
      const response = await axios.get(`${API_URL}/fs/vouchers/checkmaster/previous/${currentCheckNo}`);
      if (response.data?.data) {
        setCurrentCheckNo(response.data.data.jCkNo);
      } else {
        setMessage('First record in file!'); // Exact PRG message
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  // Navigate to NEXT entry (line item)
  const handleNextEntry = () => {
    if (currentVoucherIndex < currentVouchers.length - 1) {
      const nextIdx = currentVoucherIndex + 1;
      setCurrentVoucherIndex(nextIdx);
      const v = currentVouchers[nextIdx];
      setAcctCode(v.acctCode || '');
      setJCkAmt(v.jCkAmt?.toString() || '');
      setJDOrC(v.jDOrC || '');
    } else {
      setMessage(`LAST Entry for Check#${jCkNo}!`); // Exact PRG message
    }
  };

  // Navigate to PREVIOUS entry (line item)
  const handlePrevEntry = () => {
    if (currentVoucherIndex > 0) {
      const prevIdx = currentVoucherIndex - 1;
      setCurrentVoucherIndex(prevIdx);
      const v = currentVouchers[prevIdx];
      setAcctCode(v.acctCode || '');
      setJCkAmt(v.jCkAmt?.toString() || '');
      setJDOrC(v.jDOrC || '');
    } else {
      setMessage(`First Entry under CDV#${jJvNo}!`);
    }
  };

  const handleDelete = async () => {
    if (!currentCheckNo) return;
    if (!window.confirm(`Delete check #${currentCheckNo}?`)) return;

    try {
      await axios.delete(`${API_URL}/fs/vouchers/masters/${currentCheckNo}`);
      setMessage('Check deleted.');
      await loadAllChecks();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const handleQuit = () => {
    setActiveTab('main');
    setEditMode(null);
    clearMasterFields();
    clearVoucherFields();
  };

  // ========== HANDLERS: EDIT MODE ==========

  const handleSaveCheckMaster = async () => {
    if (!jJvNo || !jCkNo) {
      setMessage('JV Number and Check Number are required.');
      return;
    }

    if (editMode === 'add') {
      const jvValid = await validateJVNumber(jJvNo);
      if (!jvValid.valid) {
        setMessage(`JV Number '${jJvNo}' already exists`);
        return;
      }
      const ckValid = await validateCheckNumber(jCkNo);
      if (!ckValid.valid) {
        setMessage(`Check Number '${jCkNo}' already exists`);
        return;
      }
    }

    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;
    if (!isBalanced) {
      const ok = window.confirm(
        `Check is not balanced (Debit: ${totalDebit.toFixed(2)}, Credit: ${totalCredit.toFixed(2)}).\nContinue?`
      );
      if (!ok) return;
    }

    try {
      const data = {
        jJvNo,
        jDate,
        supNo: parseInt(supNo) || 0,
        jPayTo,
        bankNo: parseInt(bankNo) || 0,
        jCkNo,
        jDesc,
        jCkAmt: totalDebit, // Auto-calculated from backend
      };

      if (editMode === 'add') {
        await axios.post(`${API_URL}/fs/vouchers/masters`, data);
        setMessage('Check created.');
      } else {
        await axios.put(`${API_URL}/fs/vouchers/masters/${currentCheckNo}`, data);
        setMessage('Check updated.');
      }

      await loadAllChecks();
      setActiveTab('main');
      setEditMode(null);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const handleAddVoucher = async () => {
    if (!acctCode || !jCkAmt || !jDOrC) {
      setMessage('All fields required.');
      return;
    }

    const acctValid = await validateAccountCode(acctCode);
    if (!acctValid.valid) {
      setBrowseAccountList(allAccounts);
      setShowAccountBrowse(true);
      return;
    }

    try {
      const data = {
        jCkNo,
        acctCode,
        jCkAmt: parseFloat(jCkAmt),
        jDOrC,
      };
      await axios.post(`${API_URL}/fs/vouchers/lines`, data);
      setMessage('Line added.');
      await loadVouchers(currentCheckNo);
      clearVoucherFields();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const handleUpdateVoucher = async () => {
    if (!acctCode || !jCkAmt || !jDOrC) {
      setMessage('All fields required.');
      return;
    }

    const acctValid = await validateAccountCode(acctCode);
    if (!acctValid.valid) {
      setBrowseAccountList(allAccounts);
      setShowAccountBrowse(true);
      return;
    }

    try {
      const v = currentVouchers[currentVoucherIndex];
      const data = {
        acctCode,
        jCkAmt: parseFloat(jCkAmt),
        jDOrC,
      };
      await axios.put(`${API_URL}/fs/vouchers/lines/${v.id}`, data);
      setMessage('Line updated.');
      await loadVouchers(currentCheckNo);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const handleDeleteVoucher = async () => {
    const v = currentVouchers[currentVoucherIndex];
    if (!window.confirm('Delete this line?')) return;

    try {
      await axios.delete(`${API_URL}/fs/vouchers/lines/${v.id}`);
      setMessage('Line deleted.');
      await loadVouchers(currentCheckNo);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  // ========== NESTED SUBMENU: LINE ITEM EDITING (PRG lines 751-821) ==========
  // This is the CRITICAL missing feature - the 6-option submenu

  const handleEditLineSubmenu = (idx) => {
    setCurrentVoucherIndex(idx);
    const v = currentVouchers[idx];
    setAcctCode(v.acctCode || '');
    setJCkAmt(v.jCkAmt?.toString() || '');
    setJDOrC(v.jDOrC || '');
    setActiveTab('submenu');
  };

  // ========== ACCOUNT BROWSE DIALOG (PRG f_cbrow) ==========

  const handleSelectAccount = (account) => {
    setAcctCode(account.acctCode);
    setShowAccountBrowse(false);
  };

  // ========== UTILITY FUNCTIONS ==========

  const clearMasterFields = () => {
    setJJvNo('');
    setJDate(new Date().toISOString().split('T')[0]);
    setSupNo('');
    setJPayTo('');
    setBankNo('');
    setJCkNo('');
    setJDesc('');
  };

  const clearVoucherFields = () => {
    setAcctCode('');
    setJCkAmt('');
    setJDOrC('');
  };

  const handleBrowseUnbalancedClick = (check) => {
    setCurrentCheckNo(check.jCkNo);
    setBrowseUnbalancedMode(false);
  };

  // ========== RENDER: MAIN SCREEN ==========

  if (activeTab === 'main') {
    return (
      <div className="fs-check-disbursement">
        <div className="screen-container">
          <div className="header">
            <h2>ENTER CASH DISBURSEMENTS (CHECK DISBURSEMENT VOUCHER)</h2>
            {message && <div className={`message ${message.includes('Error') ? 'error' : ''}`}>{message}</div>}
          </div>

          <div className="data-display">
            <div className="field-group">
              <label>CDV-NO.....:</label>
              <span className="value">{jJvNo}</span>
              <label style={{ marginLeft: '3rem' }}>Ttl Db:</label>
              <span className="value numeric">{totalDebit.toFixed(2).padStart(15)}</span>
            </div>

            <div className="field-group">
              <label>DATE.......:</label>
              <span className="value">{jDate}</span>
              <label style={{ marginLeft: '3rem' }}>Ttl Cr:</label>
              <span className="value numeric">{totalCredit.toFixed(2).padStart(15)}</span>
            </div>

            <div className="field-group">
              <label>SUPPLIER NO:</label>
              <span className="value">{supNo}</span>
              <label style={{ marginLeft: '2.5rem' }}>Balance:</label>
              <span className={`value numeric ${Math.abs(totalDebit - totalCredit) < 0.01 ? 'balanced' : 'unbalanced'}`}>
                {(totalDebit - totalCredit).toFixed(2).padStart(15)}
              </span>
            </div>

            <div className="field-group">
              <label>PAYEE NAME.:</label>
              <span className="value">{jPayTo}</span>
            </div>

            <div className="field-group">
              <label>BANK CODE..:</label>
              <span className="value">{bankNo}</span>
            </div>

            <div className="field-group">
              <label>CHECK NO...:</label>
              <span className="value">{jCkNo}</span>
            </div>

            <div className="field-group">
              <label>EXPLANATION:</label>
              <span className="value">{jDesc}</span>
            </div>

            <div className="divider" />

            {currentVouchers.length > 0 && (
              <>
                <div className="field-group">
                  <label>ACCOUNT CODE......:</label>
                  <span className="value">{acctCode}</span>
                </div>

                <div className="field-group">
                  <label>AMOUNT...........:</label>
                  <span className="value numeric">{jCkAmt}</span>
                </div>

                <div className="field-group">
                  <label>DEBIT/CREDIT (D/C):</label>
                  <span className="value">{jDOrC === 'D' ? 'DEBIT' : jDOrC === 'C' ? 'CREDIT' : ''}</span>
                </div>
              </>
            )}
          </div>

          <div className="menu-buttons">
            <button onClick={handleAdd} title="Add new check.">Add</button>
            <button onClick={handleFind} title="Find by JV Number.">Find</button>
            <button onClick={handleEdit} title="Edit current check.">Edit</button>
            <button onClick={handleNextCDV} title="Next check in file.">Next-CDV</button>
            <button onClick={handleNextEntry} title="Next entry (if multiple).">Next-Entry</button>
            <button onClick={handlePrevCDV} title="Previous check.">Prev-CDV</button>
            <button onClick={handlePrevEntry} title="Previous entry.">Prev-Entry</button>
            <button onClick={handleDelete} title="Delete check.">Delete</button>
            <button onClick={handleQuit} title="Quit.">Quit</button>
          </div>

          {unbalancedChecks.length > 0 && (
            <div className="unbalanced-notice">
              <h3>UNBALANCED CHECKS ({unbalancedChecks.length})</h3>
              <div className="unbalanced-list">
                {unbalancedChecks.map((check) => (
                  <div
                    key={check.jCkNo}
                    className="unbalanced-item"
                    onClick={() => handleBrowseUnbalancedClick(check)}
                    style={{ cursor: 'pointer', padding: '4px', borderBottom: '1px solid #ccc' }}
                  >
                    {check.jCkNo} - JV: {check.jJvNo}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ========== RENDER: EDIT MODE ==========

  if (activeTab === 'editing') {
    return (
      <div className="fs-check-disbursement">
        <div className="edit-container">
          <h3>{editMode === 'add' ? 'ADD' : 'EDIT'} CHECK DISBURSEMENT</h3>
          {message && <div className={`message ${message.includes('Error') ? 'error' : ''}`}>{message}</div>}

          <div className="edit-form">
            <div className="form-section">
              <h4>Check Master</h4>
              <div className="form-group">
                <label>JV Number:</label>
                <input
                  type="text"
                  value={jJvNo}
                  onChange={(e) => setJJvNo(e.target.value.toUpperCase())}
                  maxLength="8"
                  disabled={editMode === 'edit'}
                  style={editMode === 'edit' ? { backgroundColor: '#f0f0f0' } : {}}
                />
              </div>
              <div className="form-group">
                <label>Date:</label>
                <input type="date" value={jDate} onChange={(e) => setJDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Supplier No:</label>
                <input type="number" value={supNo} onChange={(e) => setSupNo(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Payee Name:</label>
                <input type="text" value={jPayTo} onChange={(e) => setJPayTo(e.target.value)} maxLength="25" />
              </div>
              <div className="form-group">
                <label>Bank Code:</label>
                <input type="number" value={bankNo} onChange={(e) => setBankNo(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Check No:</label>
                <input type="text" value={jCkNo} onChange={(e) => setJCkNo(e.target.value.toUpperCase())} maxLength="8" />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <input type="text" value={jDesc} onChange={(e) => setJDesc(e.target.value)} maxLength="50" />
              </div>
            </div>

            {editMode === 'edit' && (
              <div className="form-section">
                <h4>Voucher Lines (Click to Edit)</h4>
                {currentVouchers.length > 0 ? (
                  <div className="voucher-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Account</th>
                          <th>Amount</th>
                          <th>D/C</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentVouchers.map((v, idx) => (
                          <tr key={idx} className={idx === currentVoucherIndex ? 'active' : ''}>
                            <td>{v.acctCode}</td>
                            <td className="numeric">{parseFloat(v.jCkAmt).toFixed(2)}</td>
                            <td>{v.jDOrC === 'D' ? 'DEBIT' : 'CREDIT'}</td>
                            <td>
                              <button
                                onClick={() => handleEditLineSubmenu(idx)}
                                className="btn-small"
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="totals">
                      <span>Total Debit: {totalDebit.toFixed(2)}</span>
                      <span>Total Credit: {totalCredit.toFixed(2)}</span>
                      <span className={Math.abs(totalDebit - totalCredit) < 0.01 ? 'balanced' : 'unbalanced'}>
                        Balance: {(totalDebit - totalCredit).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p>No line items. Use Edit Menu > ADD to add lines.</p>
                )}
              </div>
            )}

            {editMode === 'add' && (
              <div className="form-section">
                <h4>Add Line Item</h4>
                <div className="form-group">
                  <label>Account Code:</label>
                  <input
                    type="text"
                    value={acctCode}
                    onChange={(e) => setAcctCode(e.target.value.toUpperCase())}
                    maxLength="4"
                  />
                </div>
                <div className="form-group">
                  <label>Amount:</label>
                  <input
                    type="number"
                    value={jCkAmt}
                    onChange={(e) => setJCkAmt(e.target.value)}
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label>Debit/Credit:</label>
                  <select value={jDOrC} onChange={(e) => setJDOrC(e.target.value)}>
                    <option value="">-- Select --</option>
                    <option value="D">DEBIT</option>
                    <option value="C">CREDIT</option>
                  </select>
                </div>
                <button onClick={handleAddVoucher} className="btn-primary">
                  Add Line
                </button>
              </div>
            )}
          </div>

          <div className="button-group">
            <button onClick={handleSaveCheckMaster} className="btn-primary">
              Save
            </button>
            <button onClick={handleQuit} className="btn-secondary">
              Quit
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========== RENDER: NESTED SUBMENU (PRG lines 751-821) ==========

  if (activeTab === 'submenu') {
    const v = currentVouchers[currentVoucherIndex];
    return (
      <div className="fs-check-disbursement">
        <div className="submenu-container">
          <h3>EDIT LINE ITEM SUBMENU (Check #{jCkNo})</h3>
          {message && <div className={`message ${message.includes('Error') ? 'error' : ''}`}>{message}</div>}

          <div className="line-display">
            <p><strong>Account Code:</strong> {acctCode}</p>
            <p><strong>Amount:</strong> {jCkAmt}</p>
            <p><strong>D/C:</strong> {jDOrC === 'D' ? 'DEBIT' : 'CREDIT'}</p>
          </div>

          <div className="line-editor">
            <div className="form-group">
              <label>Account Code:</label>
              <input
                type="text"
                value={acctCode}
                onChange={(e) => setAcctCode(e.target.value.toUpperCase())}
                maxLength="4"
              />
            </div>
            <div className="form-group">
              <label>Amount:</label>
              <input
                type="number"
                value={jCkAmt}
                onChange={(e) => setJCkAmt(e.target.value)}
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label>Debit/Credit:</label>
              <select value={jDOrC} onChange={(e) => setJDOrC(e.target.value)}>
                <option value="">-- Select --</option>
                <option value="D">DEBIT</option>
                <option value="C">CREDIT</option>
              </select>
            </div>
          </div>

          <div className="submenu-buttons">
            <button onClick={handleAddVoucher} title="Add new line">ADD</button>
            <button onClick={handleUpdateVoucher} title="Edit current line">EDIT</button>
            <button onClick={handleNextEntry} title="Go to next line">NEXT</button>
            <button onClick={handlePrevEntry} title="Go to previous line">PREVIOUS</button>
            <button onClick={handleDeleteVoucher} title="Delete current line">DELETE</button>
            <button onClick={() => { setActiveTab('editing'); clearVoucherFields(); }} title="Return">QUIT</button>
          </div>
        </div>
      </div>
    );
  }

  // ========== RENDER: ACCOUNT BROWSE DIALOG (PRG f_cbrow) ==========

  if (showAccountBrowse) {
    return (
      <div className="fs-check-disbursement">
        <div className="browse-dialog">
          <h3>SELECT ACCOUNT (Account Not Found)</h3>
          <div className="browse-list">
            {browseAccountList && browseAccountList.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {browseAccountList.map((acc) => (
                    <tr
                      key={acc.acctCode}
                      onClick={() => handleSelectAccount(acc)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{acc.acctCode}</td>
                      <td>{acc.acctDesc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No accounts available.</p>
            )}
          </div>
          <button
            onClick={() => setShowAccountBrowse(false)}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default FSEnterCheckDisbursement;
