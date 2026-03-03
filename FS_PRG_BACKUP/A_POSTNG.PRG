/*
Program Code: A_POSTNG.PRG
Program Desc: Reposting of Transactions
Date: Feb 9, 2000
Author: Sonny C.
*/

function f_a_postng()

while .t.

   f_setting()

   select 1
   if ! net_use('&dpath\accounts',.f.,5,.f.,'')
      exit
	endif
   set index to &dpath\accounts
   if ! fil_lock(5)
      exit
   endif

   select 2
   if ! net_use('&dpath\checkmas',.f.,5,.f.,'')
      exit
   endif
   if ! fil_lock(5)
      exit
   endif
   set index to &dpath\checkma3

   select 3
   if ! net_use('&dpath\checkvou',.f.,5,.f.,'')
      exit
   endif
   if ! fil_lock(5)
      exit
   endif
   m_recc:=recc()

   select 4
   if ! net_use('&dpath\cashrcpt',.f.,5,.f.,'')
      exit
   endif
   if ! fil_lock(5)
      exit
   endif
   m_recc+=recc()

   select 5
   if ! net_use('&dpath\salebook',.f.,5,.f.,'')
      exit
   endif
   if ! fil_lock(5)
      exit
   endif
   m_recc+=recc()

   select 6
   if ! net_use('&dpath\journals',.f.,5,.f.,'')
      exit
   endif
   if ! fil_lock(5)
      exit
   endif
   m_recc+=recc()

   select 7
   if ! net_use('&dpath\purcbook',.f.,5,.f.,'')
      exit
   endif
   if ! fil_lock(5)
      exit
   endif
   m_recc+=recc()

   select 8
   if ! net_use('&dpath\adjstmnt',.f.,5,.f.,'')
      exit
   endif
   if ! fil_lock(5)
      exit
   endif
   m_recc+=recc()

   select 9
   if ! net_use('&dpath\pournals',.t.,5,.f.,'')
      exit
	endif
   set index to &dpath\pournals, &dpath\pournal2
   if ! fil_lock(5)
      exit
   endif

   zap

   f_bcln()
   setcolor(m_cmes)
   m_message := 'Re-posting transactions.  Please wait...'
   @24,0 say m_message

   m_bottomline := m_message + space(80-len(m_message))

   select accounts

   replace all cur_debit with 0, cur_credit with 0

   m_ctr:=0

   select checkvou
   dbgotop()
   m_ctr:=f_postcheck(m_ctr,m_recc)

   select cashrcpt
   dbgotop()
   m_ctr:=f_posttran(m_ctr,m_recc)

   select salebook
   dbgotop()
   m_ctr:=f_posttran(m_ctr,m_recc)

   select journals
   dbgotop()
   m_ctr:=f_posttran(m_ctr,m_recc)

   select purcbook
   dbgotop()
   m_ctr:=f_posttran(m_ctr,m_recc)

   select adjstmnt
   dbgotop()
   m_ctr:=f_posttran(m_ctr,m_recc)

   select accounts

   while ! eof()
      if formula != 'DC'
         replace end_bal with open_bal+cur_credit-cur_debit
      else
         replace end_bal with open_bal+cur_debit-cur_credit
      endif
      skip
   end while

   //replace all end_bal with open_bal+cur_debit-cur_credit

   f_bcln()
   f_mess('Re-posting Done!',.f.)
   inkey(2)

   exit

end while
dbcloseall()
return nil


function f_saystatus(_ctr,_recc)
setcolor(m_cerr)
_m_percent  := int(_ctr/_recc * 80 )
@24,0 say subs(m_bottomline,1,_m_percent)
setcolor(m_cmes)
@24,76 say tran(_ctr/_recc * 100,'999%')
return nil


function f_postcheck(_m_ctr,_m_recc)
_m_oldarea:=select()

while ! eof()

   select checkvou
   m_j_ck_no   := j_ck_no
   m_j_ck_amt  := j_ck_amt
   m_acct_code := acct_code
   m_j_d_or_c  := j_d_or_c

   select checkmas
   seek m_j_ck_no
   if ! eof()
      m_j_date    := j_date
   else
      m_j_date    := ctod('  /  /    ')
   endif

   select pournals
   append blank
   replace j_jv_no with m_j_ck_no, j_ck_amt with m_j_ck_amt,;
      acct_code with m_acct_code, j_d_or_c with m_j_d_or_c,;
      j_date with m_j_date

   select accounts
   seek m_acct_code
   if ! eof()
      if m_j_d_or_c=='D'
         replace cur_debit  with cur_debit + m_j_ck_amt
      else
         replace cur_credit with cur_credit + m_j_ck_amt
      endif
   endif

   select checkvou
   skip

   f_saystatus(_m_ctr,_m_recc)
   _m_ctr++

end while
return(_m_ctr)


function f_posttran(_m_ctr,_m_recc)
_m_oldarea:=select()

while ! eof()

   select(_m_oldarea)
   m_j_ck_no   := j_jv_no
   m_j_ck_amt  := j_ck_amt
   m_acct_code := acct_code
   m_j_d_or_c  := j_d_or_c
   m_j_date    := j_date

   select pournals
   append blank
   replace j_jv_no with m_j_ck_no, j_ck_amt with m_j_ck_amt,;
      acct_code with m_acct_code, j_d_or_c with m_j_d_or_c,;
      j_date with m_j_date

   select accounts
   seek m_acct_code
   if ! eof()
      if m_j_d_or_c=='D'
         replace cur_debit  with cur_debit + m_j_ck_amt
      else
         replace cur_credit with cur_credit + m_j_ck_amt
      endif
   endif

   select(_m_oldarea)
   skip

   f_saystatus(_m_ctr,_m_recc)
   _m_ctr++

end while
return(_m_ctr)

