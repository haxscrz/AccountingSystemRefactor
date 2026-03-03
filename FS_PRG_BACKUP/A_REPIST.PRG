/*
Program Name: Print Transaction Entries
Program Code: a_repist.prg
Date: Feb 07, 2000
*/

function f_a_repist()
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
   /*
   select 2
   if ! net_use('&dpath\effects',.f.,5,.f.,'')
      exit
	endif
   set index to &dpath\effects
   */
   select 1
   if ! net_use('&dpath\accounts',.t.,5,.f.,'')
      exit
	endif
   set index to &dpath\accounts

   f_drawbox( 7,11,11,67,1,3)

   setcolor(m_cnor)
   @ 9,23 say 'Enter Period Ending :'
   @ 9,45 get m_fr_date valid dtoc(m_fr_date)!='  /  /    '
   read

   if f_esc()
      exit
   endif

   m_fname:='IS'+subs(dtoc(m_fr_date),1,2)+subs(dtoc(m_fr_date),4,2)+subs(dtoc(m_fr_date),9,2)

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
   //m_pict:='999,999,999.99'
   m_pict:='9,999,999,999.99'
   s1:=space(1)
   s2:=space(2)
   m_there_is_x:=.f.

   select accounts

   if eof()
      m_page++
      f_isthead(m_page,m_fr_date)
      ?'No records to print...'
      exit
   endif

   m_tdb_ttl := m_gdb_ttl := m_tcr_ttl := m_gcr_ttl := m_per_ttl := 0
   m_gdb_open := m_gcr_open := 0
   m_inc_rat1:=m_inc_rat2:=0
   m_exp_rat1:=m_exp_rat2:=0

   while ! eof()
      if subs(gl_report,1,2) == 'IS'
         if subs(gl_effect,1,1) == 'I'
            /*
            m_tdb_ttl += (cur_debit - cur_credit) * -1
            m_gdb_ttl += (open_bal + cur_debit - cur_credit) * -1
            m_gdb_open+= - open_bal
            if formula != 'DC'
               m_tdb_ttl += cur_credit-cur_debit
               m_gdb_ttl += -(open_bal+cur_credit-cur_debit)
            else
               m_tdb_ttl += cur_debit - cur_credit
               m_gdb_ttl += -(open_bal -cur_credit+cur_debit)
            endif
            m_gdb_open   += - open_bal
            */

            if formula != 'DC'
               m_tdb_ttl += cur_credit - cur_debit
               m_gdb_ttl += open_bal + cur_credit - cur_debit
            else
               m_tdb_ttl += cur_debit - cur_credit
               m_gdb_ttl += open_bal + cur_debit - cur_credit
            endif
            m_gdb_open   += open_bal

         else
            /*
            m_tcr_ttl += cur_debit - cur_credit
            m_gcr_ttl += open_bal + cur_debit - cur_credit
            m_gcr_open+= open_bal
            */

            if formula != 'DC'
               m_tcr_ttl += cur_credit - cur_debit
               m_gcr_ttl += open_bal + cur_credit - cur_debit
            else
               m_tcr_ttl += cur_debit - cur_credit
               m_gcr_ttl += open_bal + cur_debit - cur_credit
            endif
            m_gcr_open   += open_bal

         endif
      endif
      skip
   end while

   if m_crow>58
      m_page++
      m_crow:=f_isthead(m_page,m_fr_date)
   endif

   ?
   ?'GROSS INCOME'

   m_crow += 2

   dbgotop()

   while ! eof()

      if m_crow>58
         m_page++
         m_crow:=f_isthead(m_page,m_fr_date)
      endif

      if subs(gl_report,1,2) == 'IS' .and. subs(gl_effect,1,1) == 'I'
         if cur_debit!=0 .or. cur_credit!=0 .or. open_bal!=0

            //m_db_ttl := (cur_debit - cur_credit) * -1
            if formula != 'DC'
               m_db_ttl := cur_credit - cur_debit
            else
               m_db_ttl := cur_debit - cur_credit
            endif
            m_db_per := (m_db_ttl/m_tdb_ttl)*100
            m_inc_rat1 += m_db_per

            //m_td_ttl := (-open_bal+m_db_ttl)
            m_td_ttl := open_bal+m_db_ttl
            m_td_per := m_td_ttl*100/m_gdb_ttl
            m_inc_rat2 += m_td_per

            ?space(7)+ acct_desc;
               +s1+tran(m_db_ttl,m_pict);
               +tran(m_db_per,'99999.99');
               +s1+tran(m_td_ttl,m_pict);
               +tran(m_td_per,'99999.99')
         endif
      endif

      skip

   end while

   ?space(39)+'---------------  ------  ---------------  ------'

   ?'    GROSS INCOME BEFORE MO.VAR:      ';
      +s1+tran(m_tdb_ttl  , m_pict);
      +tran(m_inc_rat1  ,'99999.99');
      +s1+tran(m_gdb_open+m_tdb_ttl,m_pict);
      +tran(m_inc_rat2,'99999.99')
   ?
   ?
   ?'MFG OVERHEAD VARIANCE'

   m_crow += 2

   dbgotop()

   while ! eof()

      if m_crow>58
         m_page++
         m_crow:=f_isthead(m_page,m_fr_date)
      endif

      if subs(gl_report,1,2) == 'IS' .and. subs(gl_effect,1,1) == 'O'

         if cur_debit!=0 .or. cur_credit!=0 .or. open_bal!=0
            //m_db_ttl := cur_debit - cur_credit
            if formula != 'DC'
               m_db_ttl := cur_credit - cur_debit
            else
               m_db_ttl := cur_debit - cur_credit
            endif
            m_db_per := (m_db_ttl/m_tdb_ttl)*100
            m_exp_rat1 += m_db_per

            m_td_ttl := (open_bal+m_db_ttl)
            m_td_per := m_td_ttl*100/m_gdb_ttl
            m_exp_rat2 += m_td_per

            ?space(7)+ acct_desc;
               +s1+tran(m_db_ttl,m_pict);
               +tran(m_db_per,'99999.99');
               +s1+tran(m_td_ttl,m_pict);
               +tran(m_td_per,'99999.99')
         endif
      endif

      skip

   end while


   //?space(38)+'--------------  ------  --------------  ------'
   ?space(39)+'---------------  ------  ---------------  ------'

   ?'    TOTAL MFG OVERHEAD VAR:          ';
      +s1+tran(m_tcr_ttl, m_pict);
      +tran(m_exp_rat1,'99999.99');
      +s1+tran(m_gcr_open+m_tcr_ttl,m_pict);
      +tran(m_exp_rat2,'99999.99')
   ?
   //?space(38)+'--------------  ------  --------------  ------'
   ?space(39)+'---------------  ------  ---------------  ------'
   ?'    TOTAL NET INCOME:                ';
      +s1+tran(m_tdb_ttl-m_tcr_ttl, m_pict);
      +tran(m_inc_rat1-m_exp_rat1,'99999.99');
      +s1+tran(m_gdb_open+m_tdb_ttl-m_gcr_open-m_tcr_ttl,m_pict);
      +tran(m_inc_rat1-m_exp_rat2,'99999.99')
   ?
   //?space(38)+'==============  ======  ==============  ======'
   ?space(39)+'===============  ======  ===============  ======'
   ?
   ?
   ?'---end of report---'

   ?chr(12)

	select accounts
	seek '3150'  //Current Earnings

	if ! eof()
		replace cur_credit with m_gdb_open+m_tdb_ttl-m_gcr_open-m_tcr_ttl
	endif

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


function f_isthead(_m_page,_m_fr_date)
if _m_page>1
   ?chr(12)  //Eject then cancel condense mode
endif
?m_company+space(79-len(m_company))+'Page '+tran(_m_page,'999')
?'Income Statement for Period Ending '+dtoc(_m_fr_date)
?'Run Date: '+dtoc(date())
?
?'ACCT#  DESCRIPTION                       THIS MONTH     RATIO       TO DATE      RATIO'
?'-----  ------------------------------  ---------------  ------  ---------------  ------'
//12345  123456789012345678901234567890 9,999,999,999.99  999.99 9,999,999,999.99  999.99
return(6)
