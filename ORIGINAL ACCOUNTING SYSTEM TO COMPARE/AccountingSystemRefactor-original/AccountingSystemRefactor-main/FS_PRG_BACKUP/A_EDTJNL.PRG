/*
Program Name : A_EDTJNL.PRG
Description  : Edit Transactions
Author       : SVC
Date         : Feb 8, 2000
*/

function f_a_edtjnl(m_which)
m_prevscrn:=savescreen(6,4,20,77)

while .t.
   f_setting()

   do case
      case m_which==1 //Cash Receipts
         m_dfile:='cashrcpt'
         m_ifile:='cashrcpt'
      case m_which==2 //Sales Book
         m_dfile:='salebook'
         m_ifile:='salebook'
      case m_which==3 //Journal Voucher
         m_dfile:='journals'
         m_ifile:='journals'
      case m_which==4 //Purchase Book
         m_dfile:='purcbook'
         m_ifile:='purcbook'
      case m_which==5 //Adjustments
         m_dfile:='adjstmnt'
         m_ifile:='adjstmnt'
   endcase

   select 2
   if ! net_use('&dpath\&m_dfile',.f.,5,.f.,'TRANS')
      exit
   endif
   set index to &dpath\&m_ifile

   select 1
   if ! net_use('&dpath\accounts',.f.,5,.t.,'')
   	exit
   endif
   set index to &dpath\accounts

   select TRANS

   m_j_jv_no:=space(8)
   m_j_date:=date()
   m_j_ck_amt:=0
   m_j_acct_code:=space(4)
   m_j_d_or_c:=space(1)

   m_deleted:=.f.

	f_drawbox( 7,6,19,72,1,3)
	f_drawbox(15,6,19,72,1,3)

   setcolor(m_cnor)
   f_clnmes()

   @ 9,11 say 'REFERENCE......... :'
   @10,11 say 'DATE.............. :'
   @11,11 say 'ACCOUNT CODE...... :'
   @12,11 say 'AMOUNT............ :'
   @13,11 say 'DEBIT/CREDIT (D/C) :'
   @16,11 say 'TOTAL DEBIT....... :'
   @17,11 say 'TOTAL CREDIT...... :'
   @18,11 say 'BALANCE........... :'

   m_balance:=f_checktotal()

   while .t.

      f_disptran()

      select TRANS

      setcolor(m_cmen)
      @24,10 prompt ' ADD '      mess 'Edit record on display.'
      @24,17 prompt ' FIND '     mess 'Find a record to display.'
      @24,25 prompt ' EDIT '     mess 'Edit record on display.'
      @24,33 prompt ' NEXT '     mess 'Go to the next record in file.'
      @24,41 prompt ' PREVIOUS ' mess 'Go to the previous record in file.'
      @24,53 prompt ' DELETE '   mess 'Delete this record.'
      @24,63 prompt ' QUIT '     mess 'Return to previous program.'
      menu to m_sel
      setcolor(m_cnor)

   	if f_esc()
   	 	exit
   	endif

      do case

         case m_sel==1 //Add
            f_addtran()

         case m_sel==2 //Find
            select trans
            m_j_date:=j_date
            m_oldrec:=recno()
            @10,32 get m_j_date
            read

            if lastkey() != 27
               set softseek on
               seek dtos(m_j_date)
               set softseek off
               if eof()
                  f_err('There are no records beyond that date!',.t.)
                  dbgoto(m_oldrec)
               endif
            endif

         case m_sel==3 //Edit
            f_edttran()

         case m_sel==4 //Next
            select trans
            skip
            if eof()
               f_err('Last record in file!',.t.)
               skip -1
            endif

         case m_sel==5 //Previous
            select trans
            skip -1
            if bof()
               f_err('First record in file!',.t.)
            endif

         case m_sel==6 //Delete
            if f_ask('This will delete this transaction. Are you sure?')
               select trans
               if fil_lock(5)
                  delete
                  unlock
                  skip
                  if eof()
                     skip -1
                  endif
                  m_balance:=f_checktotal()
               endif
            endif

         otherwise
            if ! m_balance
               //if f_ask('Total DEBIT is not equal to Total CREDIT!  Exit anyway ?')
               f_err('Total DEBIT is not equal to Total CREDIT!  Exit NOT Allowed !',.t.)
               //   exit
               //endif
            else
               exit
            endif

      endcase

   end while

   exit

end while

restscreen(6,4,20,77,m_prevscrn)
dbcloseall()

if m_deleted

   while .t.

      f_mess('Removing deleted records!',.f.)

      if ! net_use('&dpath\&m_dfile',.t.,5,.f.,'')
         exit
      endif
      set index to &dpath\&m_ifile1, &dpath\&m_ifile2
      pack

      exit

   end while

endif

dbcloseall()
return nil


function f_disptran()
select trans
if ! eof()
 	@ 9,32 say j_jv_no
   @10,32 say j_date
   @11,32 say acct_code
   @12,32 say j_ck_amt pict '99,999,999.99'
   do case
      case j_d_or_c=='D'
         @13,32 say 'DEBIT '
      case j_d_or_c=='C'
         @13,32 say 'CREDIT'
      otherwise
         @13,32 say space(6)
   end case
   @11,38 say f_acctdesc(acct_code)

endif
return nil


function f_addtran()
@ 9,32 clear to 13,70
m_j_jv_no:=space(8)
while .t.
   m_j_ck_amt:=0
   m_j_date:=date()
   m_acct_code:=space(4)
   m_j_d_or_c:=space(1)

   while .t.
     	@ 9,32 get m_j_jv_no pict '@!'
      @10,32 get m_j_date valid dtoc(m_j_date)!='  /  /    '
      @11,32 get m_acct_code valid f_trnacct_code(m_acct_code)
      @12,32 get m_j_ck_amt pict '99,999,999.99' valid m_j_ck_amt!=0
      @13,32 get m_j_d_or_c pict '!' valid m_j_d_or_c$'DC'
      read

      if f_esc()
         exit
      endif

      do case
         case m_j_d_or_c=='D'
            @13,32 say 'DEBIT '
         case m_j_d_or_c=='C'
            @13,32 say 'CREDIT'
         otherwise
            @13,32 say space(6)
      end case

      if f_ask('Data Correct?')

         if f_ask('Save?')

            select trans
            if fil_lock(5)
               append blank
               replace j_jv_no with m_j_jv_no, j_date with m_j_date,;
                  acct_code with m_acct_code, j_ck_amt with m_j_ck_amt,;
                  j_d_or_c with m_j_d_or_c
               unlock

               m_balance:=f_checktotal()

            endif

         endif

         exit

      endif

   end while

   if ! f_ask('Add another transaction ?')
      exit
   endif

end while
return nil


function f_edttran()
while .t.
   select trans
   m_j_jv_no  := j_jv_no
   m_j_date   := j_date
   m_acct_code:= acct_code
   m_j_ck_amt := j_ck_amt
   m_j_d_or_c := j_d_or_c

   while .t.
     	@ 9,32 get m_j_jv_no pict '@!'
      @10,32 get m_j_date valid dtoc(m_j_date)!='  /  /    '
      @11,32 get m_acct_code valid f_trnacct_code(m_acct_code)
      @12,32 get m_j_ck_amt pict '99,999,999.99' valid m_j_ck_amt!=0
      @13,32 get m_j_d_or_c pict '!' valid m_j_d_or_c$'DC'
      read

      if lastkey()=27
         exit
      endif

      if f_ask('Data Correct?')

         if f_ask('Save?')

            select trans
            if rec_lock(5)
               replace j_jv_no with m_j_jv_no, j_date with m_j_date,;
                  acct_code with m_acct_code, j_ck_amt with m_j_ck_amt,;
                  j_d_or_c with m_j_d_or_c

               unlock

               m_balance:=f_checktotal()

            endif

         endif

      endif

      exit

   end while

   exit

end while
return nil


function f_trnacct_code(_m_acct_code)
local _m_oldarea:=select(), _m_oldrec:=recno(), _m_return:=.t.
select accounts
seek _m_acct_code
if ! eof()
   @11,38 say acct_desc
   _m_return:=.t.
else
   //@11,38 say space(30)
   //f_err('Invalid Account Code!',.f.)
   //_m_return:=.f.
   dbgotop()
   m_brow_fields={"acct_code","acct_desc"}
   m_brow_head  ={"ACCT.#","DESCRIPTION"}
   f_cbrow(11,15,20,55,m_brow_fields,m_brow_head)
   if eof() .or. lastkey()=27
      _m_return:=.f.
   else
      m_acct_code:=acct_code
      @11,38 say subs(acct_desc,1,30)
      _m_return:=.t.
   endif
endif
select(_m_oldarea)
dbgoto(_m_oldrec)
return(_m_return)


function f_checktotal()
local _m_oldarea:=select(), _m_oldrec:=recno(), _m_return:=.f.
select trans
dbgotop()
_m_db_ttl:=_m_cr_ttl:=0
while ! eof()
   if j_d_or_c=='D'
      _m_db_ttl+=j_ck_amt
   else
      _m_cr_ttl+=j_ck_amt
   endif
   skip
end while
@16,32 say tran(_m_db_ttl,'99,999,999.99')
@17,32 say tran(_m_cr_ttl,'99,999,999.99')
@18,32 say tran(_m_db_ttl-_m_cr_ttl,'99,999,999.99')
if round(_m_db_ttl,2) == round(_m_cr_ttl,2)
   _m_return := .t.
endif
select(_m_oldarea)
dbgoto(_m_oldrec)
return(_m_return)
