/*
Program Name: Month-end Closing
Program Code: A_MNTEND.PRG
Date: Feb 14, 2000
Note: This program zaps all transaction files.
*/

function f_a_mntend()
m_prevscrn:=savescreen(0,0,24,79)
m_oldcol:=setcolor()
while .t.
   f_setting()

   if ! f_ask('Remove all transactions and reset the Beg.Bal.?')
      exit
   endif

   m_month := subs(str(100+val(subs(dtoc(date()),1,2))-1,3),2,2)

   if m_month == '12'
      m_year  := str(year(date())-1,4)
   else
      m_year  := str(year(date()),4)
   endif

   f_drawbox(11,11,15,67,1,3)

   f_mess('Period to Close refers to the Month/Year of Transaction Records',.f.)

   setcolor(m_cbrg)
   @13,15 say ' Enter Period to Close :   Month-     Year-      '
   @13,48 get m_month valid m_month > '00' .and. m_month < '13'
   @13,58 get m_year  valid m_year >= str(year(date()),4)
   read

   if lastkey()==27
      exit
   endif

   if val(m_month)==m_lastmonth
      if ! f_ask('This is the last month of the Fiscal Year.  Sure?')
         loop
      else
         if ! f_ask('Will Initialize all Expense Accounts to Zero.  Sure?')
            loop
         endif
      endif
   endif

   m_sfname:='ACCT'+subs(m_year,3,2)+m_month

   setcolor(m_cmes)
	f_bcln()
	@24,4 say 'ENTER BACKUP FILENAME :'
	tone(800,1)
	m_sfname=upper(alltrim(m_sfname))+spac(8-len(alltrim(m_sfname)))
	@24,28 get m_sfname pict '@K!' vali m_sfname#spac(8)
	read

	if f_esc()
		exit
	endif
	tone(800,1)

   m_correct := .f.

	@24,45 say 'Is the filename correct ? 'get m_correct pict 'Y'
	read

	if f_esc()
		exit
	endif

	if ! m_correct
		loop
	endif

	m_sfname=alltrim(m_sfname)
	n_sfname=m_sfname+'.ZIP'

   m_correct:=.f.

	if file('&bpath\&n_sfname')
		f_bcln()
	   tone(800,1)
		@24,16 say m_sfname+'.ZIP'+' already exists. Overwrite (Y/N) ?' get m_correct pict 'Y'
		read
	endif

   if f_esc()
		exit
	endif

	f_bcln()

   m_prevscr2:=savescreen(0,0,24,79)

   clear
   @ 8,26 say 'CREATING BACKUP FILES!'
   run &bpath\backup.bat &n_sfname

   restscreen(0,0,24,79,m_prevscr2)

   f_mess('Backup Completed.  Initializing Transaction Files...',.f.)
   inkey(2)

   f_setting()

   select 1
   if ! net_use('&dpath\accounts',.t.,5,.f.,'')
      exit
	endif
   set index to &dpath\accounts
   if ! fil_lock(5)
      exit
   endif

   select 2
   if ! net_use('&dpath\checkmas',.t.,5,.f.,'')
      exit
	endif
   set index to &dpath\checkmas, &dpath\checkma2, &dpath\checkma3
   if ! fil_lock(5)
      exit
   endif

   select 3
   if ! net_use('&dpath\checkvou',.t.,5,.f.,'')
      exit
	endif
   set index to &dpath\checkvou, &dpath\checkvo2
   if ! fil_lock(5)
      exit
   endif

   select 4
   if ! net_use('&dpath\cashrcpt',.t.,5,.f.,'')
      exit
	endif
   set index to &dpath\cashrcpt
   if ! fil_lock(5)
      exit
   endif

   select 5
   if ! net_use('&dpath\salebook',.t.,5,.f.,'')
      exit
	endif
   set index to &dpath\salebook
   if ! fil_lock(5)
      exit
   endif

   select 6
   if ! net_use('&dpath\journals',.t.,5,.f.,'')
      exit
	endif
   set index to &dpath\journals
   if ! fil_lock(5)
      exit
   endif

   select 7
   if ! net_use('&dpath\purcbook',.t.,5,.f.,'')
      exit
	endif
   set index to &dpath\purcbook
   if ! fil_lock(5)
      exit
   endif

   select 8
   if ! net_use('&dpath\adjstmnt',.t.,5,.f.,'')
      exit
	endif
   set index to &dpath\adjstmnt
   if ! fil_lock(5)
      exit
   endif

   select 9
   if ! net_use('&dpath\pournals',.t.,5,.f.,'')
      exit
	endif
   set index to &dpath\pournals, &dpath\pournal2
   if ! fil_lock(5)
      exit
   endif

   f_mess('Resetting Beginning Balances.  Please wait...',.f.)

   select accounts
   seek '3150'
   if ! eof()
      m_cur_earn := cur_debit - cur_credit
      replace cur_debit with 0, cur_credit with 0, open_bal with 0,;
         end_bal with 0

      if m_month == '12'
         seek '3140'
         if ! eof()
            replace open_bal with open_bal + m_cur_earn, cur_debit with 0,;
               cur_credit with 0
            replace end_bal with open_bal

         endif
      endif

   endif

   dbgotop()
   while ! eof()
      if acct_code$'3140~3150'
         skip
         loop
      endif
      if formula != 'DC'
         replace open_bal with open_bal+cur_credit-cur_debit
      else
         replace open_bal with open_bal+cur_debit-cur_credit
      endif
      replace cur_debit with 0, cur_credit with 0, end_bal with open_bal

      if val(m_month)==m_lastmonth
         replace end_bal with 0
      endif

      skip
   end while

   f_mess('Deleting Checks Issued Transactions File.  Please wait...',.f.)
   select checkmas
   zap

   f_mess('Deleting Checks Transactions File.  Please wait...',.f.)
   select checkvou
   zap

   f_mess('Deleting Cash Receipt Transactions File.  Please wait...',.f.)
   select cashrcpt
   zap

   f_mess('Deleting Sales Book Summary File.  Please wait...',.f.)
   select salebook
   zap

   f_mess('Deleting Journal Voucher Transactions File.  Please wait...',.f.)
   select journals
   zap

   f_mess('Deleting Purchse Book Transaction File.  Please wait...',.f.)
   select purcbook
   zap

   f_mess('Deleting Adjustment Transactions File.  Please wait...',.f.)
   select adjstmnt
   zap

   f_mess('Deleting Posted Transactions File.  Please wait...',.f.)
   select pournals
   zap

   f_bcln()
   f_mess('Month-end Processing Done!',.f.)
   inkey(2)

   exit

end while

dbcloseall()

setcolor(m_oldcol)
restscreen(0,0,24,79,m_prevscrn)

return nil
