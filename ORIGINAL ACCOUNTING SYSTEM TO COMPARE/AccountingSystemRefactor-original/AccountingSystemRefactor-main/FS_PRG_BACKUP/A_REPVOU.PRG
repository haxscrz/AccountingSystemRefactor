/*
Program Name: Print Individual Check Voucher
Program Code: a_repvou.prg
Date: Feb 08, 2000
*/

function f_a_repvou()
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

   m_pglen := 66

   setcolor(m_cnor)
   @13,15 say 'CDV Date Range : From: 12/12/1234  To: 12/12/1234'
   @14,15 say "Lines per Page :"
   @13,38 get m_fr_date valid dtoc(m_fr_date)!='  /  /    '
   @13,54 get m_to_date valid dtoc(m_to_date)!='  /  /    '
   @14,32 get m_pglen pict "99" valid m_pglen > 0
   read

   if lastkey()==27
      exit
   endif

   m_fname:='V'+subs(dtoc(date()),1,2)+subs(dtoc(date()),4,2)+subs(dtoc(date()),9,2)

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
      f_vouhead(m_page)
      ?'No records to print...'
      exit
   endif

   m_db_gttl  := m_cr_gttl:= 0

   select checkmas
   set softseek on
   seek dtos(m_fr_date)
   set softseek off

	?chr(27)+chr(67)+chr(m_pglen)

   while j_date <= m_to_date .and. ! eof()

      if m_crow>58
         m_page++
         m_crow:=f_vouhead(m_page)
      endif

      select checkmas

      ?f_rjust(j_jv_no)+space(2)+dtoc(j_date)+space(3)+str(sup_no,2)+space(2)+j_pay_to+space(3)+str(bank_no,2)+space(3)+f_rjust(j_ck_no)

      m_crow++

      m_j_ck_no := j_ck_no
      m_j_desc  := j_desc
      m_db_ttl  := m_cr_ttl:= 0

      select checkvou
      seek m_j_ck_no

      while j_ck_no== m_j_ck_no .and. ! eof()

         //if m_crow>58
         if m_crow > (m_pglen - 4)
            m_page++
            m_crow:=f_vouhead(m_page)
         endif

         if acct_code != space(4)

            ?space(70)+acct_code+space(2)+f_acctdesc(acct_code)+space(1)
            //?str(m_crow,3)+space(67)+acct_code+space(2)+f_acctdesc(acct_code)+space(1)

            if upper(j_d_or_c)=='D'
               ??tran(j_ck_amt,'999,999,999.99')
               m_db_ttl += j_ck_amt
            else
               ??space(15)+tran(j_ck_amt,'999,999,999.99')
               m_cr_ttl += j_ck_amt
            endif

            m_crow++

         endif

         skip

      end while

      ?space(107)+'============== =============='
      ?space( 97)+'Totals -> '+tran(m_db_ttl,'999,999,999.99')+' '+tran(m_cr_ttl,'999,999,999.99')

      if round(m_db_ttl,2) != round(m_cr_ttl,2)
         ?space(37)+'*** WARNING!!!  TOTAL DEBIT IS NOT EQUAL TO TOTAL CREDIT! ***'
         m_crow++
      endif

      m_crow += 2

      if m_crow < 24
         for i:=m_crow to 22
            ?
         next i
      elseif m_crow > m_pglen - 10
         ?chr(12)
      endif

      ?replicate('-',136)
      ?'EXPLANATION:Remarks: '+m_j_desc
      ?
      ?replicate('-',136)
      ?"PREPARED BY:                |  APPROVED BY:                |  PAYMENT RECEIVED BY:        |  DATE RELEASED:      |  PAYEE'S O/R-NO.:"
      ?replicate('-',136)
      ?'                            |                              |                              |                      |'
      ?'                            |                              |                              |                      |'
      ?'                            |                              |                              |                      |'
      ?replicate('-',136)

      m_crow := 60

      select checkmas

      skip

   end while  //! eof()

   ??chr(12)

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


function f_vouhead(_m_page)
if _m_page>1
   ??chr(12)  //Eject then cancel condense mode
   ?m_company+space(128-len(m_company))+'Page '+tran(_m_page,'999')
else
   ??m_company+space(128-len(m_company))+'Page '+tran(_m_page,'999')
endif
?'Check Disbursement Voucher'
?
?'CDV No.   Date       Sup#  Payee                      Bnk#  Check No. Acct# Account Description            Debit          Credit'
?'--------  ---------- ----  -------------------------  ----  --------  ----- ------------------------------ -------------- --------------'
//12345678  12/34/1234   99  1234567890123456789012345   99   12345678
//                                                                      1234  123456789012345678901234567890 999,999,999.99 999,999,999.99
//                                                                                                           ============== ==============
//                                                                                                 Totals -> 999,999,999.99 999,999,999.99
return(5)
