/*
Program Name: Print Check Voucher Summary
Program Code: a_repvsm.prg
Date: Feb 07, 2000
*/

function f_a_repvsm()
m_prevscrn:=savescreen(10,11,16,69)
while .t.

   m_dpath:=dpath
   m_fr_date:=m_to_date:=date()
   m_advance := .f.

   m_oldcol:=setcolor()
   setcolor(m_cmes)
   f_bcln()
   tone(800,1)
   /*
       8                  27              43             58
       Select Database:   Current-Month   Advance-Data   Old-Database
   */
   @24, 8 say    'Select Database:'
   @24,27 prompt 'Current-Month'
   @24,43 prompt 'Advance-Data'
   @24,58 prompt 'Old-Database'
   menu to m_chosen
   setcolor(m_oldcol)

   do case
      case m_chosen==2 //Advance Data
         m_advance:=.t.
      case m_chosen==3 //Old Database
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

   endcase

   f_setting()

   select 3
   if ! net_use('&dpath\accounts',.f.,5,.f.,'')
      exit
	endif
   set index to &dpath\accounts

   if m_advance
      select 2
      if ! net_use('&dpath\acheckvo',.f.,5,.f.,'checkvou')
         exit
	   endif
      set index to &dpath\acheckvo

      select 1
      if ! net_use('&dpath\acheckma',.f.,5,.f.,'checkmas')
         exit
   	endif
      set index to &dpath\acheckm2

   else
      select 2
      if ! net_use('&dpath\checkvou',.f.,5,.f.,'')
         exit
   	endif
      set index to &dpath\checkvou

      select 1
      if ! net_use('&dpath\checkmas',.f.,5,.f.,'')
         exit
	   endif
      set index to &dpath\checkma2
   endif


   f_drawbox(11,11,15,67,1,3)

   setcolor(m_cnor)
   @13,15 say 'CDV Date Range - From:             To:           '
   @13,38 get m_fr_date valid dtoc(m_fr_date)!='  /  /    '
   @13,54 get m_to_date valid dtoc(m_to_date)!='  /  /    '
   read

   if lastkey()==27
      exit
   endif

   m_fname:='CV'+subs(dtoc(date()),1,2)+subs(dtoc(date()),4,2)+subs(dtoc(date()),9,2)

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

	if lastkey()=27
		exit
	endif

   m_crow:=60
   m_page:=0
   s1:=space(1)

   select checkmas

   if eof()
      m_page++
      f_vsmhead(m_page,m_fr_date,m_to_date)
      ?'No records to print...'
      exit
   endif

   m_db_gttl  := m_cr_gttl:= 0

   select checkmas
   set softseek on
   seek dtos(m_fr_date)
   set softseek off

   while j_date <= m_to_date .and. ! eof()

      if m_crow>58
         m_page++
         m_crow:=f_vsmhead(m_page,m_fr_date,m_to_date)
      endif

      select checkmas

      //if j_date >= m_fr_date .and. j_date <= m_to_date

         ?dtoc(j_date)+space(2)+f_rjust(j_jv_no)+space(2)+j_pay_to+space(2)+str(sup_no,2)+space(5)+str(bank_no,2)+space(22)+f_rjust(j_ck_no)

         m_crow++

         m_j_ck_no := j_ck_no
         m_j_desc  := j_desc
         m_db_ttl  := m_cr_ttl:= 0

         select checkvou
         seek m_j_ck_no

         while j_ck_no== m_j_ck_no .and. ! eof()

            if m_crow>58
               m_page++
               m_crow:=f_vsmhead(m_page,m_fr_date,m_to_date)
            endif

            ?space(22)+acct_code+space(2)+f_acctdesc(acct_code)+space(1)

            if upper(j_d_or_c)=='D'
               ??tran(j_ck_amt,'999,999,999.99')
               m_db_ttl += j_ck_amt
            else
               ??space(15)+tran(j_ck_amt,'999,999,999.99')
               m_cr_ttl += j_ck_amt
            endif

            m_crow++

            skip

         end while

         ?space(49)+'Totals -> '+tran(m_db_ttl,'999,999,999.99')
            ??tran(m_cr_ttl,' 999,999,999.99')
         ?'Remarks: '+m_j_desc
         if round(m_db_ttl,2) != round(m_cr_ttl,2)
            m_crow++
            ?space(22)+'***** WARNING!!! TOTAL CREDIT IS NOT EQUAL TO TOTAL DEBIT! *****'
            ?
         else
            ?
         endif


         m_crow += 3

         m_db_gttl += m_db_ttl
         m_cr_gttl += m_cr_ttl

      //endif

      select checkmas

      skip

   end while  //! eof()

   ?repl('-',88)
   ?'GRAND TOTALS -->'+space(43)+tran(m_db_gttl,'999,999,999.99')
   ??tran(m_cr_gttl,' 999,999,999.99')

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


function f_vsmhead(_m_page,_m_fr_date,_m_to_date)
if _m_page>1
   ?chr(12)  //Eject then cancel condense mode
endif
?m_company+space(80-len(m_company))+'Page '+tran(_m_page,'999')
?'Check Disbursement Register'
?'For Dates: '+dtoc(_m_fr_date)+' to '+dtoc(_m_to_date)
?
?'Date        CDV No.   Payee               Supplier#  Bank#                     Check No.'
?'                      Acct# Description                     Debit          Credit'
?'----------  --------  ------------------------------------  -------------  -------------'
//12/34/1234  12345678  1234567890123456789012345  99     99                      12345678
//                      1234  123456789012345678901234567890 999,999,999.99 999,999,999.99
//                                                 Totals ->
//                      ***** WARNING!!! TOTAL CREDIT IS NOT EQUAL TO TOTAL DEBIT! *****
//GRAND TOTALS ->                                            9
return(7)


function f_acctdesc(_m_acct_code)
local _m_oldarea:=select(), _m_oldrec:=recno(), _m_return:=space(30)
select accounts
seek _m_acct_code
if ! eof()
   _m_return:=alltrim(acct_desc)+space(30-len(alltrim(acct_desc)))
endif
select(_m_oldarea)
dbgoto(_m_oldrec)
return(_m_return)
