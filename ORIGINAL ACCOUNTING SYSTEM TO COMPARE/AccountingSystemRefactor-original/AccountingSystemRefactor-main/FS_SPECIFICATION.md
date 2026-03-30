# FS ACCOUNTING SYSTEM - EXACT FIELD & OPERATION SPECIFICATION
## Based on Original A_EDTCOD.PRG, A_EDTCHK.PRG, A_EDTJNL.PRG, A_POSTNG.PRG, A_MNTEND.PRG

---

## 1. CHART OF ACCOUNTS (A_EDTCOD.PRG - m_which==2)

### Database Table: `accounts`

### Fields (9 TOTAL - from A_EDTCOD.PRG lines 63-69, 336-345):
1. **acct_code** (CharField, max 4) - Account Code - PRIMARY KEY
2. **acct_desc** (CharField, max 30) - Description  
3. **open_bal** (DecimalField) - Opening Balance - Format: 99,999,999,999.99
4. **cur_debit** (DecimalField) - Current Period Debit - Format: 99,999,999,999.99
5. **cur_credit** (DecimalField) - Current Period Credit - Format: 99,999,999,999.99
6. **gl_report** (CharField, max 4) - Report Code
7. **gl_effect** (CharField, max 3) - Report Group / Effect Code
8. **formula** (CharField, max 2) - Formula: must be 'DC' (default - Debit/Credit) or 'CD' (Credit/Debit)
9. **initialize** (BooleanField) - Y/N flag to initialize (reset) at fiscal year-end

### Calculated/Derived Fields (NOT STORED):
- **end_bal** (Calculated as per formula)
  - If formula == 'DC': end_bal = open_bal + cur_debit - cur_credit
  - If formula == 'CD': end_bal = open_bal + cur_credit - cur_debit

### Operations:
- **ADD** - Create new account (validate duplicate check, require all inputs)
- **FIND** - Soft-seek by account code  
- **EDIT** - Edit existing account
- **NEXT** - Navigate to next record
- **PREVIOUS** - Navigate to previous record
- **DELETE** - Delete account record
- **QUIT** - Exit

### Validation Rules:
- Account code must not already exist (on ADD)
- Account code must be 4 chars
- Formula must be 'DC' or 'CD'
- Description cannot be empty

---

## 2. CHECK DISBURSEMENT VOUCHER (A_EDTCHK.PRG)

### Database Tables:
- **checkmas** (Check Master) - 8 FIELDS
- **checkvou** (Check Voucher/Details) - 4 FIELDS

### CHECK MASTER (checkmas) - EXACT DISPLAY ORDER FROM A_EDTCHK.PRG LINES 180-187:

**Screen Display Order:**
```
@ 7,21 say 'CDV-NO..... :'          → j_jv_no
@ 8,21 say 'DATE....... :'          → j_date
@ 9,21 say 'SUPPLIER NO :'          → sup_no
@10,21 say 'PAYEE NAME. :'          → j_pay_to
@11,21 say 'BANK CODE.. :'          → bank_no
@12,21 say 'CHECK NO... :'          → j_ck_no
@13,21 say 'EXPLANATION :'          → j_desc
(No direct field display)           → j_ck_amt (CALCULATED from line items)

Calculated Display:
@ 7,59 say 'Ttl Db :' (Total Debit = sum of checkvou.j_ck_amt WHERE j_d_or_c='D')
@ 8,59 say 'Ttl Cr :' (Total Credit = sum of checkvou.j_ck_amt WHERE j_d_or_c='C')
@ 9,59 say 'Balance:' (Balance = Ttl Db - Ttl Cr)
```

**Fields (8 TOTAL):**
1. **j_jv_no** (CharField, max 8) - JV/CDV Number (PRIMARY for lookups)
2. **j_date** (DateField) - Check Date
3. **sup_no** (IntegerField) - Supplier Number (0-99)
4. **j_pay_to** (CharField, max 25) - Payee Name
5. **bank_no** (IntegerField) - Bank Code (0-99)
6. **j_ck_no** (CharField, max 8) - Check Number (PHYSICAL CHECK)
7. **j_desc** (CharField, max 50) - Explanation/Description
8. **j_ck_amt** (DecimalField) - Check Amount - **NOTE: CALCULATED, not directly input** (DEPRECATED - USE CHECKVOU TOTALS)

### CHECK VOUCHER/DETAIL (checkvou) - 4 FIELDS (from A_EDTCHK.PRG lines 515-522):

```
@15,28 say 'ACCOUNT CODE...... :'  → acct_code
@16,28 say 'AMOUNT............ :'  → j_ck_amt
@17,28 say 'DEBIT/CREDIT (D/C) :' → j_d_or_c
```

**Fields (4 TOTAL):**
1. **j_ck_no** (CharField, max 8) - Link to checkmas - FOREIGN KEY
2. **acct_code** (CharField, max 4) - Account Code
3. **j_ck_amt** (DecimalField) - Amount (format: 99,999,999.99)
4. **j_d_or_c** (CharField, max 1) - 'D' (Debit) or 'C' (Credit) - REQUIRED, must validate $'DC'

### Operations: (from A_EDTCHK.PRG lines 193-255)

**Main Menu:**
- **Add** - Create new check master + prompt for line items
- **Find** - Soft-seek by JV Number
- **Edit** - Edit check header, then submenu for line items
- **Next-CDV** - Skip to next check master record
- **Next-Entry** - Skip to next voucher line under SAME check
- **Prev-CDV** - Go to previous check master record
- **Prev-Entry** - Go to previous voucher line under SAME check
- **Delete** - Delete check master AND cascading delete all voucher lines for that check
- **Quit** - Exit (check for unbalanced checks, warn user)

**Edit Submenu (when in a check):**
- **ADD** - Add new voucher line item
- **EDIT** - Edit current voucher line
- **NEXT** - Go to next voucher line under same check
- **PREVIOUS** - Go to previous voucher line under same check
- **DELETE** - Delete voucher line
- **QUIT** - Exit (don't exit if check is unbalanced - warning only)

### Validation Rules:
- j_jv_no cannot be duplicate (on ADD)
- j_ck_no cannot be duplicate (on ADD)
- j_pay_to cannot be empty/spaces
- j_ck_no cannot be empty/spaces
- j_d_or_c must be 'D' or 'C'
- j_ck_amt must not be 0
- acct_code must be valid (exist in accounts table)
- **BALANCE REQUIREMENT**: Total Debit MUST equal Total Credit (soft validation - warn if exit unbalanced)
- Track unbalanced checks in array and show at exit if any exist

### Auto-Calculation:
- j_ck_amt in checkmas = SUM(checkvou.j_ck_amt WHERE j_ck_no == this check)
- Ttl Db = SUM(checkvou.j_ck_amt WHERE j_ck_no == this && j_d_or_c == 'D')
- Ttl Cr = SUM(checkvou.j_ck_amt WHERE j_ck_no == this && j_d_or_c == 'C')
- Balance = Ttl Db - Ttl Cr
- On adding/editing line item, AUTO-RECOMPUTE check amount immediately

---

## 3. JOURNAL ENTRIES - 5 TYPES (A_EDTJNL.PRG)

### **ALL 5 TYPES USE IDENTICAL 5-FIELD STRUCTURE:**

Each type manages a different transaction source but same data:

1. **Type 1: Cash Receipts** (`cashrcpt` table)
2. **Type 2: Sales Book** (`salebook` table)
3. **Type 3: Journal Vouchers** (`journals` table)
4. **Type 4: Purchase Book** (`purcbook` table)
5. **Type 5: Adjustments** (`adjstmnt` table)

### Screen Display (from A_EDTJNL.PRG lines 59-65):
```
@ 9,11 say 'REFERENCE......... :'  → j_jv_no
@10,11 say 'DATE.............. :'  → j_date
@11,11 say 'ACCOUNT CODE...... :'  → acct_code
@12,11 say 'AMOUNT............ :'  → j_ck_amt
@13,11 say 'DEBIT/CREDIT (D/C) :' → j_d_or_c

@16,11 say 'TOTAL DEBIT....... :'  (Calculated)
@17,11 say 'TOTAL CREDIT...... :'  (Calculated)
@18,11 say 'BALANCE........... :'  (Calculated)
```

### Fields (5 TOTAL - SAME FOR ALL TYPES):
1. **j_jv_no** (CharField, max 8) - Reference/JV Number
2. **j_date** (DateField) - Transaction Date (soft-seek by date)
3. **acct_code** (CharField, max 4) - Account Code
4. **j_ck_amt** (DecimalField, format 99,999,999.99) - Amount
5. **j_d_or_c** (CharField, max 1) - 'D' or 'C'

### Operations (from A_EDTJNL.PRG lines 74-112):
- **ADD** - Create new journal entry
- **FIND** - Soft-seek by DATE
- **EDIT** - Edit existing entry
- **NEXT** - Navigate to next record
- **PREVIOUS** - Navigate to previous record
- **DELETE** - Delete transaction
- **QUIT** - Exit

### Validation Rules:
- j_jv_no required (not empty)
- j_date required (valid date)
- acct_code required (must exist in accounts)
- j_ck_amt must not be 0
- j_d_or_c must be 'D' or 'C'
- **MANDATORY BALANCE**: Total Debit MUST equal Total Credit
- **Cannot exit if unbalanced** (hardcoded requirement - line 196) ← THIS IS CRITICAL!

### Calculated Totals:
- TOTAL DEBIT = SUM(j_ck_amt WHERE j_d_or_c == 'D')
- TOTAL CREDIT = SUM(j_ck_amt WHERE j_d_or_c == 'C')
- BALANCE = TOTAL DEBIT - TOTAL CREDIT (must = 0)

---

## 4. TRANSACTION POSTING (A_POSTNG.PRG)

### Source Tables → Destination Table:
All transactions from these sources:
- checkvou (Check Vouchers)
- cashrcpt (Cash Receipts)
- salebook (Sales Book)
- journals (Journal Vouchers)
- purcbook (Purchase Book)
- adjstmnt (Adjustments)

Post to: **pournals** (Posted Journals/History)

### Posting Logic (from A_POSTNG.PRG f_postcheck & f_posttran):

For EACH transaction entry:
1. Copy to pournals table with fields:
   - j_jv_no (from j_jv_no or j_ck_no)
   - j_ck_amt (same amount)
   - acct_code (same code)
   - j_d_or_c (same D/C)
   - j_date (same date)

2. Update accounts table for matching acct_code:
   - If j_d_or_c == 'D': cur_debit += j_ck_amt
   - If j_d_or_c == 'C': cur_credit += j_ck_amt

3. Clear current period before posting:
   - REPLACE ALL cur_debit=0, cur_credit=0 (in accounts)

4. Calculate end_bal AFTER all postings (from A_POSTNG.PRG lines 117-122):
```
   while ! eof()
      if formula != 'DC'
         replace end_bal with open_bal+cur_credit-cur_debit
      else
         replace end_bal with open_bal+cur_debit-cur_credit
      endif
      skip
   end while
```

### Notes:
- Uses checkma3.ndx index (by j_ck_no for checks)
- Progress bar shows posting status (% complete)
- Clears pournals (ZAP) before reposting

---

## 5. MONTH-END CLOSE PROCESSING (A_MNTEND.PRG)

### Workflow:

1. **User Input:**
   - Confirm: "Remove all transactions and reset Beg.Bal?"
   - Period to Close: Month (01-12) / Year
   - Fiscal Year-End Check: If month==12, ask "This is last month of fiscal year. Sure?"
   - Backup filename: User enters, system creates ZIP backup

2. **Backup Phase:**
   - Create ZIP file backup of all transaction files
   - Uses backup.bat script

3. **Account Reset Phase** (from A_MNTEND.PRG lines 138-182):

   **Special handling for account 3150:**
   ```
   seek '3150'
   if ! eof()
      m_cur_earn = cur_debit - cur_credit
      replace cur_debit=0, cur_credit=0, open_bal=0, end_bal=0
      
      if month==12 (year-end):
         seek '3140'
         if ! eof()
            replace open_bal = open_bal + m_cur_earn
            replace cur_debit=0, cur_credit=0
            replace end_bal = open_bal
         endif
      endif
   endif
   ```

   **For ALL other accounts (NOT 3140, NOT 3150):**
   ```
   while ! eof()
      if acct_code NOT IN ('3140', '3150')
         if formula != 'DC'
            replace open_bal = open_bal + cur_credit - cur_debit
         else
            replace open_bal = open_bal + cur_debit - cur_credit
         endif
         
         replace cur_debit=0, cur_credit=0
         replace end_bal = open_bal
         
         if month==12 (year-end):
            replace end_bal = 0
         endif
      endif
      skip
   end while
   ```

4. **Transaction Clearing** (from A_MNTEND.PRG lines 184-226):
   - **ZAP (delete all records):**
     - checkmas
     - checkvou
     - cashrcpt
     - salebook
     - journals
     - purcbook
     - adjstmnt
     - pournals

### Notes:
- Account 3150 is SPECIAL (Retained Earnings or similar)
- Account 3140 is where 3150 earnings flow to (year-end)
- Month == 12 triggers fiscal year-end special handling
- Cannot exit month-end if operations fail (file locks required)

---

## 6. MENU STRUCTURE (ACCTNG.PRG)

### Main Menu - 4 Ribbon Tabs:

1. **MAIN MENU**
   - ENTER CASH DISBURSEMENT (Check Vouchers)
   - ENTER CASH RECEIPTS
   - [others...]

2. **FILE MAINTENANCE**
   - CHART OF ACCOUNTS SETUP
   - Check Disbursement Maintenance
   - Cash Receipts Maintenance
   - Sales Book Maintenance
   - Journal Vouchers Maintenance
   - Purchase Book Maintenance
   - Adjustments Maintenance

3. **QUERY**
   - Chart of Accounts
   - Check Disbursements
   - [transaction queries...]

4. **REPORT GENERATION**
   - Trial Balance
   - Income Statement
   - Balance Sheet

---

## 7. KEY IMPLEMENTATION NOTES

### Critical Differences from Current Implementation:

1. ✗ **SUP_NO is NOT in legacy fs_checkmas.json** - DO NOT ADD
   - PRG code has it, but data export doesn't
   - May need to handle as optional/deprecated

2. ✗ **j_ck_amt field in checkmas** - Should NOT be directly input
   - It's AUTO-CALCULATED from checkvou totals
   - Recalculated whenever checkvou changes

3. ✗ **Balance checking** - HARDCODED requirement
   - Journals: CANNOT EXIT if unbalanced
   - Checks: WARN if unbalanced, can exit but show warning list

4. ✗ **Formula field validation** - Only 'DC' or 'CD'
   - Not 'CD~DC', just plain values
   - 'DC' is default (Debit/Credit means add debits, subtract credits)
   - 'CD' means Credit/Debit opposite

5. ✗ **Soft-seek navigation** - Required for:
   - Chart of Accounts: by acct_code
   - Check Disbursements: by j_jv_no
   - Journals: by j_date

6. ✗ **Account 3150 special handling** - Hard-coded logic
   - Account code '3150' specifically
   - Account code '3140' specifically
   - Month-end logic depends on these codes

7. ✗ **Navigation operations** - Must implement:
   - NEXT/PREVIOUS at transaction level
   - NEXT/PREVIOUS at sub-item level (for checks)
   - Proper EOF/BOF handling with error messages

8. ✗ **Calculated fields** - NOT stored in DB:
   - end_bal (calculated from formula + balances)
   - Check totals (calculated from checkvou lines)
   - Journal totals (calculated from journal entries)

---

## SUMMARY OF DIFFERENCES FROM CURRENT CODE

| Feature | Required | Current Status |
|---------|----------|-----------------|
| Chart of Accounts - 9 fields | ✓ | ✓ Added initialize |
| Check Master - 8 fields | ✓ | ✗ Missing SUP_NO (data doesn't have it) |
| Check Voucher - 4 fields | ✓ | ✓ Correct |
| Journal - 5 fields × 5 types | ✓ | ✓ Structure correct |
| j_ck_amt calculation | ✓ | ✗ Not auto-calculated from lines |
| Balance validation | ✓ | ✗ Only optional warning |
| Soft-seek navigation | ✓ | ✗ Not implemented |
| NEXT/PREV navigation | ✓ | ✗ Not implemented |
| Account 3150 special logic | ✓ | ✗ Not implemented |
| Posting logic | Partial | ✓ FSPosting exists |
| Month-end backup + reset | ✓ | ✗ Not implemented |
| Cascade delete (check + lines) | ✓ | ✓ Implemented |

