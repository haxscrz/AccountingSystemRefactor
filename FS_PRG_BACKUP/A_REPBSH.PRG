/*
Program Name: Print Transaction Entries
Program Code: a_repbsh.prg
Date: Feb 22, 2000
*/

function f_a_repbsh()
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

   select 3
   if ! net_use('&dpath\schedule',.t.,5,.f.,'')
      exit
	endif
   set index to &dpath\schedule
   reindex

   select 2
   if ! net_use('&dpath\effects',.t.,5,.f.,'')
      exit
	endif
   set index to &dpath\effects
   reindex

   select 1
   if ! net_use('&dpath\accounts',.t.,5,.f.,'')
      exit
	endif
   set index to &dpath\accounts
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

   m_fname:='BS'+subs(dtoc(m_fr_date),1,2)+subs(dtoc(m_fr_date),4,2)+subs(dtoc(m_fr_date),9,2)

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
   m_pict:='9,999,999,999.99'
   s1:=space(1)
   s2:=space(2)
   m_there_is_x:=.f.

   select effects
   replace all gl_amt with 0

   select accounts

   while ! eof()

      if subs(gl_report,1,1)=='B'  //Balance Sheet
         m_acct_code := acct_code
         if formula!='DC'
            m_end_bal   := open_bal + cur_credit - cur_debit
         else
            m_end_bal   := open_bal + cur_debit - cur_credit
         endif
         m_gl_report := gl_report
         m_gl_effect := gl_effect

         select effects
         seek m_gl_report+m_gl_effect
         if ! eof()
            replace gl_amt with gl_amt + m_end_bal
         else
            f_err('Account Code# '+m_acct_code+' has invalid Balance Sheet Code.  Pls EDIT !',.t.)
            m_there_is_x:=.f.
            exit
         endif
      endif

      select accounts
      skip

   end while

   if m_there_is_x
      exit
   endif

   select effects
   dbgotop()

   if eof()
      m_page++
      f_bshhead(m_page,m_fr_date,1)
      ?'No records to print...'
      exit

   endif

   m_ttl_asset := 0

   seek 'BA'

   while subs(gl_report,1,2) == 'BA' .and. ! eof()

      if m_crow>58
         m_page++
         m_crow:=f_bshhead(m_page,m_fr_date,1)
      endif

      m_type:=subs(gl_report,3,1)
      m_asset := 0

      do case
         case m_type == 'C'
            ?'CURRENT ASSETS :'
         case m_type == 'F'
            ?'FIXED ASSETS :'
         case m_type == 'O'
            ?'OTHER ASSETS :'
      endcase

      ?

      m_crow += 2

      m_ctr := 0

      while subs(gl_report,1,2) == 'BA' .and. subs(gl_report,3,1)==m_type .and. ! eof()

         if m_crow>58
            m_page++
            m_crow:=f_bshhead(m_page,m_fr_date,1)
         endif

         if gl_amt != 0
            if m_type=='F' .and. 'DEPRECIATION'$gl_head
               ?space(3)+gl_head+s2+tran(-gl_amt,m_pict)
               m_asset -= gl_amt
            else
               ?space(3)+gl_head+s2+tran(gl_amt,m_pict)
               m_asset += gl_amt
            endif
            m_ctr ++
            m_crow ++
         endif

         skip

      end while

      ?space(30)+'---------------- ----------------'

      m_crow ++

      do case
         case m_type == 'C'
            ?space(3)+'TOTAL CURRENT ASSETS :'
         case m_type == 'F'
            ?space(3)+'TOTAL FIXED ASSETS :  '
         case m_type == 'O'
            ?space(3)+'TOTAL OTHER ASSETS :  '
      endcase

      ??space(22)+tran(m_asset,m_pict)
      ?
      ?

      m_crow += 3

      m_ttl_asset += m_asset

   end while

   if m_crow>58
      m_page++
      m_crow:=f_bshhead(m_page,m_fr_date,1)
   endif

   ?space(30)+'---------------- ---------------- ----------------'

   ?'TOTAL ASSETS :'+space(50)+tran(m_ttl_assets,m_pict)

   //LIABILITIES AND S.EQUITY
   m_page++
   m_crow:=f_bshhead(m_page,m_fr_date,2)

   m_ttl_liabi := 0

   seek 'BLC'

   if ! eof()

      ?'LIABILITIES :'
      ?
      m_crow += 2

      while subs(gl_report,1,3) == 'BLC' .and. ! eof()

         if m_crow>58
            m_page++
            m_crow:=f_bshhead(m_page,m_fr_date,2)
         endif

         m_type:=subs(gl_report,4,1)
         m_liabi := 0

         do case
            case m_type == 'C'
               ?space(3)+'CURRENT LIABILITIES :'
            case m_type == 'D'
               ?space(3)+"DEFERRED :"
            otherwise
               ?space(3)+'OTHERS !!!'
         endcase

         ?

         m_crow += 2

         m_ctr := 0

         while subs(gl_report,1,2) == 'BL' .and. subs(gl_report,3,1)==m_type .and. ! eof()

            if m_crow>58
               m_page++
               m_crow:=f_bshhead(m_page,m_fr_date,1)
            endif

            if gl_amt != 0
               //?space(6)+gl_head+tran(gl_amt,m_pict)
               ?space(6)+gl_head+tran(gl_amt,'9999,999,999.99')
               m_liabi += gl_amt
               m_ctr ++
               m_crow ++
            endif

            skip

         end while

      end while

      ?space(30)+'---------------- ----------------'

      m_crow ++

      do case
         case m_type == 'C'
            ?space(6)+'TOTAL CURRENT LIABILITIES : '
         case m_type == 'F'
            ?space(6)+'TOTAL DEFERRED LIABILITIES :'
         case m_type == 'O'
            ?space(6)+'TOTAL OTHER LIABILITIES :   '
      endcase

      ??space(13)+tran(m_liabi,m_pict)

      ?

      m_crow += 2

      m_ttl_liabi += m_liabi

   endif

   if m_crow>58
      m_page++
      m_crow:=f_bshhead(m_page,m_fr_date,2)
   endif

   m_ttl_equity:= 0

   seek 'BLS'

   if ! eof()

      ?
      ?"STOCKHOLDER'S EQUITY :"
      m_crow += 3

      while subs(gl_report,1,3) == 'BLS' .and. ! eof()

         if m_crow>58
            m_page++
            m_crow:=f_bshhead(m_page,m_fr_date,2)
         endif

         m_type:=subs(gl_report,4,1)
         m_equity:= 0

         ?

         m_crow ++

         m_ctr := 0

         while subs(gl_report,1,3) == 'BLS' .and. subs(gl_report,4,1)==m_type .and. ! eof()

            if m_crow>58
               m_page++
               m_crow:=f_bshhead(m_page,m_fr_date,1)
            endif

            if gl_amt != 0
               if 'SUBSCRIPTION'$gl_head
                  ?space(3)+gl_head+s2+tran(-gl_amt,m_pict)
                  m_equity-= gl_amt
               else
                  ?space(3)+gl_head+s2+tran(gl_amt,m_pict)
                  m_equity+= gl_amt
               endif
               m_ctr ++
               m_crow ++
            endif

            skip

         end while

         ?space(30)+'---------------- ----------------'

         m_crow ++

         do case
            case m_type == 'C'
               ?space(3)+'PAID-UP CAPITAL :'
            case m_type == 'E'
               ?space(3)+'TOTAL EARNINGS : '
         endcase

         ??space(27)+tran(m_equity,m_pict)

         ?

         m_crow += 2

         m_ttl_equity += m_equity

      end while

   endif

   if m_crow>58
      m_page++
      m_crow:=f_bshhead(m_page,m_fr_date,2)
   endif

   ?space(30)+'---------------- ---------------- ----------------'

   ?'TOTAL LIABILITY & S.EQUITY :'+space(36)+tran(m_ttl_liabi+m_ttl_equity,m_pict)


   //SUBSIDIARY SCHEDULES

   m_page++
   m_crow:=f_bshhead(m_page,m_fr_date,3)

   select schedule
   dbgotop()

   while ! eof()
      m_gl_head := gl_head
      ?gl_head
      m_total:=0
      m_ctr  :=0

      while gl_head == m_gl_head .and. ! eof()
         m_acct_code := acct_code

         select accounts
         seek m_acct_code

         if ! eof()
            if formula == 'CD'
               m_end_bal := open_bal - cur_debit + cur_credit
            else
               m_end_bal := open_bal + cur_debit - cur_credit
            endif
            if m_end_bal != 0
               ?space(3)+acct_desc+tran(m_end_bal,'999,999,999,999.99')
               m_total += m_end_bal
               m_ctr++
            endif
         endif

         select schedule
         skip

      end while

      if m_ctr > 1
         ?space(35)+'----------------'
         ?space(35)+tran(m_total,'9,999,999,999.99')
      endif
      ?
      ?
   end while
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


function f_bshhead(_m_page,_m_fr_date,_m_which)
if _m_page>1
   ?chr(12)  //Eject then cancel condense mode
endif
?m_company+space(72-len(m_company))+'Page '+tran(_m_page,'999')
?'Balance Sheet for Period Ending '+dtoc(_m_fr_date)
?'Run Date: '+dtoc(date())
?
do case
   case _m_which==1
      ?space(27)+replicate('-',19)
      ?space(27)+'*** A S S E T S ***'
      ?space(27)+replicate('-',19)
   case _m_which==2
      ?space(12)+replicate('-',48)
      ?space(12)+'*** L I A B I L I T I E S  &  S. E Q U I T Y ***'
      ?space(12)+replicate('-',48)
   case _m_which==3
      ?space(12)+replicate('-',48)
      ?space(12)+'*** S U B S I D I A R Y     S C H E D U L E  ***'
      ?space(12)+replicate('-',48)
endcase
?
return(8)


/*

                          -------------------
                          *** A S S E T S ***
                          -------------------
            ------------------------------------------------
            *** L I A B I L I T I E S  &  S. E Q U I T Y ***
            ------------------------------------------------


CURRENT ASSETS:
123123456789012345678901234599,999,999,999.99')
   1234567890123456789012345x9,999,999,999.99
   1234567890123456789012345 9,999,999,999.99 9,999,999,999.99 9,999,999,999.99
                             ---------------- ---------------- ----------------
   Total Current Assets :xx12345678901234567890199,999,999,999.99


FIXED ASSETS:
   1234567890123456789012345  99,999,999,999.99
   1234567890123456789012345  99,999,999,999.99
   1234567890123456789012345  99,999,999,999.99
   1234567890123456789012345  99,999,999,999.99
                              ---------------- ----------------
   Total Fixed Assets :                      999,999,999,999.99


OTHER ASSETS:
   1234567890123456789012345  999,999,999.99
   1234567890123456789012345  999,999,999.99
   1234567890123456789012345  999,999,999.99
   1234567890123456789012345  999,999,999.99
                              -------------- --------------
   1234567890123456789012345   999,999,999.99
                             ---------------- ----------------
   Total Other Assets:                        9,999,999,999.99


                              ----------------- -----------------
                             ---------------- ---------------- ----------------
   Total Current Assets :   99,999,999,999.9999,999,999,999.9999,999,999,999.99
                              -------------- -------------- --------------
   TOTAL ASSETS :                                           999,999,999.99
                                         9,999,999,999.99

*/
