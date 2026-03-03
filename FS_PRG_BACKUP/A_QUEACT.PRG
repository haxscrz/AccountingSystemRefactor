/*
Program Name: Chart of Accounts
Program Code: A_QUEACT.PRG
Date: Feb 8, 2000
*/

function f_a_queact(m_which)
m_oldcol:=setcolor()
m_oldscreen:=savescreen(5,0,22,79)
while .t.
   select 1
   do case
      case m_which==1  //Chart of Accounts
         if ! net_use('&dpath\accounts',.f.,5,.t.,'')
            exit
         endif
         set index to &dpath\accounts

        	m_brow_fields:={"acct_code","open_bal","cur_debit","cur_credit","end_bal"}
         m_brow_head  :={"ACCT.CODE","OPEN.BAL.","TTL.DEBIT","TTL.CREDIT","END.BAL."}

         m_lookfor:=space(4)

      case m_which==2  //Check Disbursement Voucher
         if ! net_use('&dpath\checkmas',.f.,5,.t.,'')
            exit
         endif
         set index to &dpath\checkmas

        	m_brow_fields:={"j_jv_no","j_ck_no","j_ck_amt","j_pay_to","bank_no","sup_no","j_desc"}
         m_brow_head  :={"CDV NO.","CHECK NO.","CHK.AMT.","PAYEE","BC","SUP#","EXPLANATION"}

         m_lookfor:=space(8)

      case str(m_which,1)$'34567'
         do case
            case m_which==3 //Cash Receipts
               m_dfile:='cashrcpt'
               m_ifile:='cashrcpt'
            case m_which==4 //Sales Book
               m_dfile:='salebook'
               m_ifile:='salebook'
            case m_which==5 //Journal Voucher
               m_dfile:='journals'
               m_ifile:='journals'
            case m_which==6 //Purchase Book
               m_dfile:='purcbook'
               m_ifile:='purcbook'
            case m_which==7 //Adjustments
               m_dfile:='adjstmnt'
               m_ifile:='adjstmnt'
         endcase

         if ! net_use('&dpath\&m_dfile',.f.,5,.f.,'TRANS')
            exit
         endif
         set index to &dpath\&m_ifile

        	m_brow_fields:={"j_date","j_jv_no","acct_code","j_ck_amt","j_d_or_c"}
         m_brow_head  :={"Date","Reference","Acct#","Amount","Debit(D)/Credit(C)"}

         m_lookfor:=space(8)

      otherwise
         exit

   end case

   f_drawbox(5,0,21,77,1,3)

   while .t.

      do case
         case m_which=1
            @24,27 say 'Enter Account Code :' get m_lookfor pict '@!'
         case m_which=2
            @24,27 say 'Enter CDV No. :' get m_lookfor pict '@!'
         otherwise
            @24,27 say 'Enter Date    :' get m_lookfor pict '@!'
      end case

      read

      if lastkey() == 27
         exit
      endif

      set softseek on
      seek m_lookfor
      set softseek off

      if eof()
         dbgotop()
      endif

      f_cbrow(6,1,20,75,m_brow_fields,m_brow_head)

   end while

   exit

end while
restscreen(5,0,22,79,m_oldscreen)
dbcloseall()
setcolor(m_oldcol)
return nil
