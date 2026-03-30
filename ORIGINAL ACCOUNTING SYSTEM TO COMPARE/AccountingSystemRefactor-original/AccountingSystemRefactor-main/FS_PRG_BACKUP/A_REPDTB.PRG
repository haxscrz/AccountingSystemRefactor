/*
Program Name: Print Transaction Entries
Program Code: a_repjnl.prg
Date: Feb 07, 2000
*/

function f_a_repdtb(m_which)
m_prevscrn:=savescreen(7,11,12,69)
while .t.

   m_dpath:=dpath
   m_fr_date := dtoc(date())
   m_fr_date := ctod(subs(m_fr_date,1,2)+'/01/'+subs(m_fr_date,7,4))-1

   if ! f_choose('Select Database:','Current Month','Old Database')
      setcolor(m_cmes)
      @24,19 say 'ENTER PERIOD TO PROCESS (MMYYYY) :'
      m_period:=space(6)
      while .t.
         @24,54 get m_period pict '999999' valid m_period > '002000'
         read
         if f_esc()
            exit
         endif
         if subs(m_period,1,2) < '01' .or. subs(m_period,1,2) > '13'
            f_err('Invalid Period.  Please check!',.t.)
            loop
         endif
         if subs(m_period,3,4) < '2000' .or. subs(m_period,3,4) > '3000'
            f_err('Invalid Period.  Please check!',.t.)
            loop
         endif
         if ! file('&m_period\accounts.dbf')
            f_err('There is no backup on that period!',.t.)
            loop
         endif
         m_fr_date:=f_lastday(val(subs(m_period,1,2)),val(subs(m_period,3,4)))
         exit
      end while

      if f_esc()
         exit
      endif

      dpath:=m_period
      f_a_reindex()

   endif


   f_setting()

   select 1
   if ! net_use('&dpath\accounts',.f.,5,.f.,'')
      exit
	endif
   set index to &dpath\accounts

   select 2
   if ! net_use('&dpath\pournals',.t.,5,.f.,'')
      exit
	endif
   set index to &dpath\pournal2
   if ! fil_lock(5)
      exit
   endif

   f_drawbox( 7,11,11,67,1,3)

   setcolor(m_cnor)
   @ 9,23 say 'Enter Period Ending :'
   @ 9,45 get m_fr_date valid dtoc(m_fr_date)!='  /  /    '
   read

   if f_esc()
      exit
   endif

   if m_which==1
      m_fname:='DT'+subs(dtoc(m_fr_date),1,2)+subs(dtoc(m_fr_date),4,2)+subs(dtoc(m_fr_date),9,2)
   else
      m_fname:='TB'+subs(dtoc(m_fr_date),1,2)+subs(dtoc(m_fr_date),4,2)+subs(dtoc(m_fr_date),9,2)
   endif

   m_spool:=.t.

   setcolor(m_cnor)
   if ! f_askspool(m_fname)
		m_spool:=.f.
		if f_esc()
			exit
		endif
		set print on
		set device to print
   endif

	if f_esc()
		exit
	endif

   m_crow:=60
   m_page:=0
   m_line:=0
   m_pict:='999,999,999.99'
   s1:=space(1)
   s2:=space(2)
   m_there_is_x:=.f.

   select accounts

   if eof()
      m_page++
      f_dtbhead(m_page,m_fr_date,m_which)
      ?'No records to print...'
      exit
   endif

   m_tdb_ttl  := m_tcr_ttl:= m_tctr := 0

   while ! eof()

      if ! (open_bal!=0 .or. cur_debit!=0 .or. cur_credit !=0)
         skip
         loop
      endif

      if m_crow>58
         m_page++
         m_crow:=f_dtbhead(m_page,m_fr_date,m_which)
      endif

      m_acct_code := acct_code
      m_acct_desc := f_acctdesc(acct_code)
      m_open_bal  := open_bal
      m_cur_debit := cur_debit
      m_cur_credit:= cur_credit
		m_formula   := formula

      //12345  123456789012345678901234567890 999,999,999.99  12/12/1234  12345678  999,999,999.99  999,999,999.99  999,999,999.99

      ?m_acct_code+space(3)+m_acct_desc+s1+tran(open_bal,m_pict)+s2
      m_crow++

      if m_which==1
         select pournals
         seek m_acct_code

         m_ctr:=m_db_ctr:=m_cr_ctr:=0
         m_db_ttl:=m_cr_ttl:=0

         if ! eof()

            while acct_code==m_acct_code .and. ! eof()

               if m_crow>58
                  m_page++
                  m_crow:=f_dtbhead(m_page,m_fr_date,m_which)
               endif

               m_ctr++
               if m_ctr > 1
                  ?space(54)
                  m_crow++
               endif

               ??dtoc(j_date)+space(2)+f_ljust(j_jv_no)+s2

               if upper(j_d_or_c)=='D'
                  ??tran(j_ck_amt,'999,999,999.99')+space(18)
                  m_db_ttl += j_ck_amt
                  m_db_ctr ++
               else
                  ??space(16)+tran(j_ck_amt,'999,999,999.99')+s2
                  m_cr_ttl += j_ck_amt
                  m_cr_ctr ++
               endif

               skip

            end while

            if m_ctr > 1

               if m_db_ctr > 1 .or. m_cr_ctr > 1

                  ?space(66)+'Totals->'+tran(m_db_ttl,'9,999,999,999.99')
                  m_crow++

                  if m_db_ttl != m_cur_debit
                     ??' x'
                     m_there_is_x:=.t.
                  else
                     ??'  '
                  endif

                  ??tran(m_cr_ttl,'999,999,999.99')

                  if m_cr_ttl != m_cur_credit
                     ??' x'
                     m_there_is_x:=.t.
                  else
                     ??'  '
                  endif

                  m_crow++
                  /*
                  if m_tdb_ttl != m_tcr_ttl
                     ?space(65)+'Balance->'+tran(m_db_ttl-m_cr_ttl,'9,999,999,999.99')+space(18)
                     m_crow++
                  endif
                  */
               else
                  ?space(108)
                  m_crow++

               endif

            endif

         else
            ??space(54)

         endif
			
			if m_formula == 'DC'
	         ??tran(m_open_bal+m_db_ttl-m_cr_ttl,'999,999,999.99')+' *'
			else
  	         ??tran(m_open_bal-m_db_ttl+m_cr_ttl,'999,999,999.99')+' *'
			endif
         m_tdb_ttl += m_db_ttl
         m_tcr_ttl += m_cr_ttl
         m_tctr += m_ctr

      else
         ??tran(cur_debit,'999,999,999.99')
         ??tran(cur_credit,'9,999,999,999.99')
			if m_formula == 'DC'
   	      ??tran(m_open_bal+cur_debit-cur_credit,'9,999,999,999.99')
			else
	         ??tran(m_open_bal-cur_debit+cur_credit,'9,999,999,999.99')
			endif

         m_tdb_ttl += m_cur_debit
         m_tcr_ttl += m_cur_credit

      endif

      ?
      m_crow++

      select accounts
      skip

   end while  //! eof()

   if m_crow+3>58
      m_page++
      m_crow:=f_dtbhead(m_page,m_fr_date,m_which)
   endif

   if m_which==1
      ?space(63)+'G.Totals ->'+tran(m_tdb_ttl,'9,999,999,999.99');
         +tran(m_tcr_ttl,'9,999,999,999.99')
      if m_tdb_ttl != m_tcr_ttl
         ?space(63)+'Balance  ->'+tran(m_tdb_ttl-m_tcr_ttl,'9,999,999,999.99')
      endif
      ?
      ?'No. of Transactions Reported : '+ltrim(tran(m_tctr,m_pict))

   else
      ?space(41)+'G.Totals ->'+tran(m_tdb_ttl,'9,999,999,999.99');
         +tran(m_tcr_ttl,'9,999,999,999.99')
      if m_tdb_ttl != m_tcr_ttl
         ?space(41)+'Balance  ->'+tran(m_tdb_ttl-m_tcr_ttl,'9,999,999,999.99')
      endif

   endif

   if m_crow+3>58
      m_page++
      m_crow:=f_dtbhead(m_page,m_fr_date,m_which)
   endif

   ?
   if m_there_is_x
      ?'Note: An "x" after the Total Debit or Total Credit means that'
      ?'      the amount does not tally with the total amount in Master'
      ?'      File.  You may need to Post the Transctions!'
      ?
   endif

   ?'---end of report---'

   ?chr(12)

	if ! m_spool
		set printer to
		set device to screen
		set print off
   else
      set alternate off
		set alternate to
		set device to screen
		set console on
	endif

	exit

end while
dpath:=m_dpath
restscreen(7,11,12,69,m_prevscrn)
dbcloseall()
return nil


function f_dtbhead(_m_page,_m_fr_date,_m_which)
if _m_page>1
   ?chr(12)  //Eject then cancel condense mode
endif
if _m_which==1
   ?m_company+space(114-len(m_company))+'Page '+tran(_m_page,'999')
   ?'Detailed Trial Balance for Period Ending '+dtoc(_m_fr_date)
else
   ?m_company+space(92-len(m_company))+'Page '+tran(_m_page,'999')
   ?'Trial Balance for Period Ending '+dtoc(_m_fr_date)
endif
?'Run Date: '+dtoc(date())
?
if _m_which==1
   ?'ACCT#  DESCRIPTION                     BEG.BALANCE    TRAN.DATE   REFERENCE  DEBIT AMOUNT   CREDIT AMOUNT   ENDING BALANCE'
   ?'-----  ------------------------------  -------------  ----------  ---------  -------------  --------------  --------------'
   //12345  123456789012345678901234567890 999,999,999.99  12/12/1234  12345678  999,999,999.99  999,999,999.99  999,999,999.99
   //                                                                 TOTALS ->
   //                                                                 Balance->
else
   ?'ACCT#  DESCRIPTION                     BEG.BALANCE     DEBIT AMOUNT   CREDIT AMOUNT   ENDING BALANCE'
   ?'-----  ------------------------------  -------------   -------------  --------------  --------------'
   //12345  123456789012345678901234567890 999,999,999.99  999,999,999.99  999,999,999.99  999,999,999.99
endif

return(6)
