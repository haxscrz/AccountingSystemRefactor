/*
Program Name: Print Transaction Entries
Program Code: a_repjnl.prg
Date: Feb 07, 2000
*/

function f_a_repjnl(m_which)
m_prevscrn:=savescreen(10,11,16,69)
while .t.

   m_dpath:=dpath
   m_fr_date:=m_to_date:=date()

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
         m_fr_date:=ctod(subs(m_period,1,2)+'/01/'+subs(m_period,3,4))
         m_to_date:=f_lastday(val(subs(m_period,1,2)),val(subs(m_period,3,4)))
         exit
      end while

      if f_esc()
         exit
      endif

      dpath:=m_period
      f_a_reindex()

   endif


   f_setting()

   select 2
   if ! net_use('&dpath\accounts',.f.,5,.f.,'')
      exit
	endif
   set index to &dpath\accounts

   do case
      case m_which==1 //Cash Receipts
         m_dfile:='cashrcpt'
         m_ifile:='cashrcpt'
         m_frsttwo:='CR'
         m_report:='CASH RECEIPTS'
      case m_which==2 //Sales Book
         m_dfile:='salebook'
         m_ifile:='salebook'
         m_frsttwo:='SB'
         m_report:='SALES BOOK'
      case m_which==3 //Journal Voucher
         m_dfile:='journals'
         m_ifile:='journals'
         m_frsttwo:='JV'
         m_report:='JOURNAL VOUCHERS'
      case m_which==4 //Purchase Book
         m_dfile:='purcbook'
         m_ifile:='purcbook'
         m_frsttwo:='PB'
         m_report:='PURCHASE BOOK'
      case m_which==5 //Adjustments
         m_dfile:='adjstmnt'
         m_ifile:='adjstmnt'
         m_frsttwo:='AD'
         m_report:='ADJUSTMENTS'
   endcase

   select 1
   if ! net_use('&dpath\&m_dfile',.f.,5,.f.,'TRANS')
      exit
   endif
   set index to &dpath\&m_ifile

   f_drawbox(11,11,15,67,1,3)

   setcolor(m_cnor)
   @13,15 say 'Tran.Date Range- From: 12/12/1234  To: 12/12/1234'
   @13,38 get m_fr_date valid dtoc(m_fr_date)!='  /  /    '
   @13,54 get m_to_date valid dtoc(m_to_date)!='  /  /    '
   read

   if lastkey()==27
      exit
   endif

   m_fname:=m_frsttwo+subs(dtoc(date()),1,2)+subs(dtoc(date()),4,2)+subs(dtoc(date()),9,2)

   m_spool:=.t.

   setcolor(m_cnor)
   if ! f_askspool(m_fname)
		m_spool:=.f.
		if lastkey()=27
			exit
		endif
		set print on
		set device to print
   endif

	if lastkey()==27
		exit
	endif

   m_crow:=60
   m_page:=0
   m_line:=0
   s1:=space(1)

   select trans

   set softseek on
   seek dtos(m_fr_date)
   set softseek off

   if eof() .or. j_date > m_to_date
      m_page++
      f_trnhead(m_page,m_fr_date,m_to_date)
      ?'No records to print...'
      exit
   endif

   m_db_ttl  := m_cr_ttl:= 0

   while j_date <= m_to_date .and. ! eof()

      if m_crow>58
         m_page++
         m_crow:=f_trnhead(m_page,m_fr_date,m_to_date)
      endif

      m_line++

      ?f_ljust(str(m_line,5))+dtoc(j_date)+space(2)+f_rjust(j_jv_no)+space(3);
         +f_acctdesc(acct_code)+space(2)+acct_code+space(1)

      if upper(j_d_or_c)=='D'
         ??tran(j_ck_amt,'999,999,999.99')
         m_db_ttl += j_ck_amt
      else
         ??space(15)+tran(j_ck_amt,'999,999,999.99')
         m_cr_ttl += j_ck_amt
      endif

      m_crow++

      skip

   end while  //! eof()

   ?space(65)+'-------------- --------------'
   ?space(55)+'Totals -> '+tran(m_db_ttl,'999,999,999.99');
      +tran(m_cr_ttl,' 999,999,999.99')
   ?space(55)+'Balance-> '+tran(m_db_ttl-m_cr_ttl,'999,999,999.99')
   ?
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
restscreen(10,11,16,69,m_prevscrn)
dbcloseall()
return nil


function f_trnhead(_m_page,_m_fr_date,_m_to_date)
if _m_page>1
   ?chr(12)  //Eject then cancel condense mode
endif
?m_company+space(86-len(m_company))+'Page '+tran(_m_page,'999')
?m_report
?'For Dates: '+dtoc(_m_fr_date)+' to '+dtoc(_m_to_date)
?
?'Ln   Date        Reference  Description                    Acct#  Debit          Credit'
?'---  ----------  ---------  ------------------------------------  -------------  -------------'
//123  12/34/1234  12345678   123456789012345678901234567890  1234 999,999,999.99 999,999,999.99
//                                                       Totals ->
//                                                       Balance->
return(6)
