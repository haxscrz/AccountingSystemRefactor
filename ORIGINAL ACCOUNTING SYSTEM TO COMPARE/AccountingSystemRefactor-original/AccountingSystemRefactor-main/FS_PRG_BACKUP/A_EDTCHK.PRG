/*
Program Name : A_EDTCHK.PRG
Description  : Edit Check Disbursement Voucher
Author       : SVC
Date         : Feb 6, 2000
*/

function f_a_edtchk(m_which)
m_prevscrn:=savescreen(6,4,20,77)

while .t.
   f_setting()

   a_notbalanced:={}

   if m_which==1
      select 5
      if ! net_use('&dpath\checkmas',.f.,5,.f.,'')
         exit
      endif

      if eof()
         use
         if f_ask('Transfer CDB Entries created in advance?')
            f_xfercdb()
         endif
      endif

      select 5
      if ! net_use('&dpath\checkmas',.f.,5,.f.,'')
         exit
      endif
      set index to &dpath\checkmas, &dpath\checkma2, &dpath\checkma3

      select 4
      if ! net_use('&dpath\checkvou',.f.,5,.f.,'')
         exit
      endif
      set index to &dpath\checkvou, &dpath\checkvo2

      dbgotop()

      while ! eof()
         m_j_ck_no:=j_ck_no

         m_db_ttl:=m_cr_ttl:=0

         while j_ck_no == m_j_ck_no .and. ! eof()
            if j_d_or_c == 'D'
               m_db_ttl += j_ck_amt
            else
               m_cr_ttl += j_ck_amt
            endif
            skip
         end while

         if round(m_db_ttl,2) != round(m_cr_ttl,2)
            if ascan(a_notbalanced,m_j_ck_no) == 0
               aadd(a_notbalanced,m_j_ck_no)
            endif
         endif

      end while

      dbgotop()

   else
      select 5
      if ! net_use('&dpath\acheckma',.f.,5,.f.,'checkmas')
         exit
      endif
      set index to &dpath\acheckma, &dpath\acheckm2, &dpath\acheckm3

      select 4
      if ! net_use('&dpath\acheckvo',.f.,5,.f.,'checkvou')
         exit
      endif
      set index to &dpath\acheckvo, &dpath\acheckv2

      while ! eof()
         m_j_ck_no:=j_ck_no

         m_db_ttl:=m_cr_ttl:=0

         while j_ck_no == m_j_ck_no .and. ! eof()
            if j_d_or_c == 'D'
               m_db_ttl += j_ck_amt
            else
               m_cr_ttl += j_ck_amt
            endif
            skip
         end while

         if round(m_db_ttl,2) != round(m_cr_ttl,2)
            if ascan(a_notbalanced,m_j_ck_no) == 0
               aadd(a_notbalanced,m_j_ck_no)
            endif
         endif

      end while

      dbgotop()

   endif

   select 3
   if ! net_use('&dpath\banks',.f.,5,.t.,'')
      exit
	endif
   set index to &dpath\banks

   select 2
   if ! net_use('&dpath\supplier',.f.,5,.t.,'')
      exit
	endif
   set index to &dpath\supplier

   select 1
   if ! net_use('&dpath\accounts',.f.,5,.t.,'')
   	exit
   endif
   set index to &dpath\accounts

   select checkmas

   m_j_jv_no:=space(8)
   m_j_ck_amt:=0
   m_j_date:=date()
   m_j_pay_to:=space(25)
   m_j_acct_code:=space(4)
   m_j_desc:=space(50)
   m_j_d_or_c:=space(1)
   m_bank_no:=0
   m_sup_no:=0

   if ! eof()
      m_j_ck_no:=j_ck_no
   else
      m_j_ck_no:=space(8)
   endif

   select checkvou
   seek m_j_ck_no

   select checkmas

   m_deleted:=.f.
   m_movement:=.f.

	f_drawbox(6,4,19,75,1,3)
   setcolor(m_cnor)
   f_clnmes()

   @ 7, 7 say 'CDV-NO..... :                               Ttl Db :'
   @ 8, 7 say 'DATE....... :                               Ttl Cr :'
   @ 9, 7 say 'SUPPLIER NO :                               Balance:'
   @10, 7 say 'PAYEE NAME. :'
   @11, 7 say 'BANK CODE.. :'
   @12, 7 say 'CHECK NO... :'
   @13, 7 say 'EXPLANATION :'
   @15, 7 say 'ACCOUNT CODE...... :'
   @16, 7 say 'AMOUNT............ :'
   @17, 7 say 'DEBIT/CREDIT (D/C) :'

   while .t.

      f_dispcheck()

      select checkmas
      f_bcln()

      setcolor(m_cmen)
      @24, 4 prompt 'Add'        mess 'Edit record on display.'
      @24, 9 prompt 'Find'       mess 'Find a record to Display.'
      @24,15 prompt 'Edit'       mess 'Edit record on display.'
      @24,21 prompt 'Next-CDV'   mess 'Go to the next CDV record in file.'
      @24,31 prompt 'Next-Entry' mess 'Go to the next entry under same CDV in file.'
      @24,43 prompt 'Prev-CDV'   mess 'Go to the previous CDV record in file.'
      @24,53 prompt 'Prev-Entry' mess 'Go to the previousentry under same CDV in file.'
      @24,65 prompt 'Delete'     mess 'Delete this record.'
      @24,73 prompt 'Quit'       mess 'Return to previous program.'
      menu to m_sel
      setcolor(m_cnor)

      do case

         case m_sel==1 //Add
            f_addcheck()

         case m_sel==2 //Find
            select checkmas
            m_j_jv_no:=j_jv_no
            m_oldrec:=recno()
            @ 7,21 get m_j_jv_no pict '@!'
            read

            if lastkey() != 27
               set softseek on
               seek m_j_jv_no
               set softseek off
               if eof()
                  f_err('There are no records beyond that number!',.t.)
                  dbgoto(m_oldrec)
               else
                  m_j_ck_no:=j_ck_no
                  select checkvou
                  seek m_j_ck_no
               endif
               select checkmas
            endif

         case m_sel==3 //Edit
            f_edtcheck()

         case m_sel==4 //Next CDV
            select checkmas
            skip
            if eof()
               f_err('Last record in file!',.t.)
               skip -1
            endif

            m_j_ck_no:=j_ck_no

            select checkvou
            seek m_j_ck_no

            select checkmas

         case m_sel==5 //Next Entry
            select checkmas
            m_j_jv_no:=j_jv_no
            m_j_ck_no:=j_ck_no

            select checkvou
            if j_ck_no != m_j_ck_no
               f_err('No Entries under CDV#'+alltrim(m_j_jv_no),.t.)
            else
               skip
               if eof()
                  f_err('Last record in file!',.t.)
                  skip -1
               else
                  if j_ck_no != m_j_ck_no
                     f_err('Last Entry under CDV#'+alltrim(m_j_jv_no),.t.)
                     skip -1
                  endif
               endif
            endif

         case m_sel==6 //Previous CDV
            select checkmas
            skip -1
            if bof()
               f_err('First record in file!',.t.)
            endif
            m_j_ck_no:=j_ck_no
            select checkvou
            seek m_j_ck_no

         case m_sel==7 //Previous Entry
            select checkmas
            m_j_jv_no:=j_jv_no
            m_j_ck_no:=j_ck_no

            select checkvou
            if j_ck_no != m_j_ck_no
               f_err('No Entries under CDV#'+alltrim(m_j_jv_no),.t.)
            else
               skip -1
               if bof() .or. j_ck_no != m_j_ck_no
                  f_err('First Entry under CDV#'+alltrim(m_j_jv_no),.t.)
                  if ! bof()
                     skip
                  endif
               endif
            endif

         case m_sel==8 //Delete
            if f_ask('This will delete check#'+alltrim(j_ck_no)+'. Are you sure?')
               select checkvou
               if fil_lock(5)
                  select checkmas
                  if fil_lock(5)
                     m_j_jv_no := j_jv_no
                     m_j_ck_no := j_ck_no
                     delete
                     skip -1
                     select checkvou
                     seek m_j_ck_no
                     while j_ck_no==m_j_ck_no .and. ! eof()
                        delete
                        skip
                     end while

                     m_ptr:=ascan(a_notbalanced,m_j_jv_no)
                     if m_ptr != 0
                        m_a_size:=len(a_notbalanced)
                        adel(a_notbalanced,m_ptr)
                        asize(a_notbalanced,m_a_size-1)
                     endif

                     m_deleted:=.t.

                  endif
               endif

               select checkmas
               m_j_ck_no := j_ck_no
               select checkvou
               seek m_j_ck_no

            endif

         otherwise
            if len(a_notbalanced) > 0
               m_oldsrcn:=savescreen(8,28,21,52)
            	f_drawbox(8,28,20,50,1,3)
               setcolor(m_crev)
               f_sayit('Press <Esc> to Exit')
               @ 9,31 say 'UNBALANCED CHECKS'
               setcolor(m_cnor)
               while .t.
                  achoice(10,31,19,47,a_notbalanced)
                  if f_esc()
                     exit
                  endif
               end while
               restscreen(8,28,21,52,m_oldsrcn)

            else
               exit
            endif
      endcase

   end while

   if m_movement
      f_ck_recompute()
   endif

   exit

end while

restscreen(6,4,20,77,m_prevscrn)
dbcloseall()

if m_deleted

   while .t.

      f_mess('Removing deleted records!',.f.)

      if ! net_use('&dpath\checkmas',.t.,5,.f.,'')
         exit
      endif
      set index to &dpath\checkmas, &dpath\checkma2, &dpath\checkma3
      pack

      if ! net_use('&dpath\checkvou',.t.,5,.f.,'')
         exit
      endif
      set index to &dpath\checkvou, &dpath\checkvo2
      pack

      exit

   end while

endif

dbcloseall()
return nil


function f_ck_recompute()
while .t.

   f_mess('Recomputing Check amount.  Please wait.',.f.)

   select checkmas
   if fil_lock(5)
      set order to 3  //Checkma3.Ntx By Chk No.

      select checkvou
      if fil_lock(5)

         dbgotop()

         while ! eof()
            m_j_ck_no:=j_ck_no
            m_j_ck_amt := 0

            while j_ck_no == m_j_ck_no .and. ! eof()
               if j_d_or_c == 'D'
                  m_j_ck_amt += j_ck_amt
               endif
               skip
            end while

            select checkmas
            seek m_j_ck_no

            if ! eof()
               replace j_ck_amt with m_j_ck_amt
            endif

            select checkvou

         end while

      endif

   endif

   unlock all

   exit

end while
return nil


function f_dispcheck()
select checkmas
if ! eof()
   m_j_ck_no:=j_ck_no
 	@ 7,21 say j_jv_no
   @ 8,21 say j_date
   @ 9,21 say sup_no pict '99'
   @10,21 say j_pay_to
   @11,21 say bank_no pict '99'
   @12,21 say j_ck_no
   @13,21 say j_desc

   select checkvou
   if j_ck_no == m_j_ck_no
      @15,28 say acct_code
      @16,28 say j_ck_amt pict '99,999,999.99'
      do case
         case j_d_or_c=='D'
            @17,28 say 'DEBIT '
         case j_d_or_c=='C'
            @17,28 say 'CREDIT'
         otherwise
            @17,28 say space(6)
      end case
      if acct_code != space(4)
         f_valacct(acct_code)
      else
         @15,41 say space(30)
      endif
   else
      @15,28 say space(36)
      @16,28 say 0 pict '99,999,999.99'
      @17,28 say space(6)
   endif

   m_vou_recno:= recno()

   m_db_ttl:=m_cr_ttl:=0

   seek m_j_ck_no
   while j_ck_no == m_j_ck_no .and. ! eof()
      if j_d_or_c == 'D'
         m_db_ttl += j_ck_amt
      else
         m_cr_ttl += j_ck_amt
      endif
      skip
   end while

   dbgoto(m_vou_recno)

   @ 7,59 say tran(m_db_ttl,'999,999,999.99')
   @ 8,59 say tran(m_cr_ttl,'999,999,999.99')
   @ 9,59 say tran(m_db_ttl-m_cr_ttl,'999,999,999.99')

endif
return nil


function f_addcheck()
@ 7,21 clear to 13,74
@15,28 clear to 17,74
while .t.
   m_j_jv_no:=m_j_ck_no:=space(8)
   m_j_ck_amt:=0
   m_j_date:=date()
   m_j_pay_to:=space(25)
   m_acct_code:=space(4)
   m_j_desc:=space(50)
   m_j_d_or_c:=space(1)
   m_bank_no:=0
   m_sup_no:=0
   m_db_ttl:=m_cr_ttl:=0

   while .t.
     	@ 7,21 get m_j_jv_no valid f_valjv_no(m_j_jv_no)
      @ 8,21 get m_j_date valid dtoc(m_j_date)!='  /  /    '
      @ 9,21 get m_sup_no pict '99'
      @10,21 get m_j_pay_to pict '@!' valid m_j_pay_to!=space(25)
      @11,21 get m_bank_no pict '99'
      @12,21 get m_j_ck_no pict '@!' valid m_j_ck_no!=space(8)
      @13,21 get m_j_desc pict '@!'
      read

      if lastkey()=27
         exit
      endif

      if f_ask('Data Correct?')

         if f_ask('Save?')

            select checkmas
            if fil_lock(5)
               append blank
               replace j_jv_no with m_j_jv_no, j_date with m_j_date,;
                  sup_no  with m_sup_no, j_pay_to with m_j_pay_to,;
                  bank_no with m_bank_no, j_ck_no with m_j_ck_no,;
                  j_desc  with m_j_desc
               unlock

               m_movement := .t.

               while .t.
                  @15,28 get m_acct_code valid f_valacct(m_acct_code)
                  @16,28 get m_j_ck_amt pict '99,999,999.99' valid m_j_ck_amt!=0
                  @17,28 get m_j_d_or_c pict '!' valid m_j_d_or_c$'DC'
                  read

                  if lastkey()==27
                     exit
                  endif

                  do case
                     case m_j_d_or_c=='D'
                        @17,28 say 'DEBIT '
                     case m_j_d_or_c=='C'
                        @17,28 say 'CREDIT'
                     otherwise
                        @17,28 say space(6)
                  end case

                  if m_acct_code == space(4) .or. m_j_ck_amt == 0 .or. ! m_j_d_or_c$'DC'
                     loop
                  endif

                  if f_ask('Data Correct?')

                     if f_ask('Save?')

                        select checkmas
                        if fil_lock(5)

                           select checkvou
                           if fil_lock(5)

                              append blank
                              replace j_ck_no with m_j_ck_no,;
                                 acct_code with m_acct_code,;
                                 j_ck_amt with m_j_ck_amt,;
                                 j_d_or_c with m_j_d_or_c

                              select checkmas
                              replace j_ck_amt with j_ck_amt + m_j_ck_amt

                              if m_j_d_or_c == 'D'
                                 m_db_ttl += m_j_ck_amt
                              else
                                 m_cr_ttl += m_j_ck_amt
                              endif

                              @ 7,59 say tran(m_db_ttl,'999,999,999.99')
                              @ 8,59 say tran(m_cr_ttl,'999,999,999.99')
                              @ 9,59 say tran(m_db_ttl-m_cr_ttl,'999,999,999.99')

                              m_movement := .t.

                           endif

                        endif

                        select checkvou

                     endif

                  else
                     loop

                  endif

                  if ! f_ask('Add another record under CDV#'+alltrim(m_j_jv_no)+' ?')
                     if round(m_db_ttl,2) != round(m_cr_ttl,2)
                        if f_ask('Total DEBIT is not equal to Total CREDIT!  Exit anyway?')
                           if ascan(a_notbalanced,m_j_jv_no) == 0
                              aadd(a_notbalanced,m_j_jv_no)
                           endif
                           exit
                        endif
                     else
                        m_ptr:=ascan(a_notbalanced,m_j_jv_no)
                        if m_ptr != 0
                           m_a_size:=len(a_notbalanced)
                           adel(a_notbalanced,m_ptr)
                           asize(a_notbalanced,m_a_size-1)
                        endif
                        exit
                     endif
                  endif

                  m_j_ck_amt:=0
                  m_acct_code:=space(4)
                  m_j_d_or_c:=space(1)

               end while

            endif

         endif

         exit

      endif

   end while

   if ! f_ask('Add another CDV ?')
      exit
   endif

end while
return nil


function f_edtcheck()
while .t.
   select checkmas
   m_j_jv_no  := j_jv_no
   m_j_date   := j_date
   m_sup_no   := sup_no
   m_j_pay_to := j_pay_to
   m_bank_no  := bank_no
   m_j_ck_no  := m_oj_ck_no := j_ck_no
   m_j_desc   := j_desc

   select checkvou
   m_acct_code:= acct_code
   m_j_ck_amt := j_ck_amt
   m_j_d_or_c := j_d_or_c
   m_vou_recno:= recno()

   m_db_ttl:=m_cr_ttl:=0

   seek m_j_ck_no
   while j_ck_no == m_j_ck_no .and. ! eof()
      if j_d_or_c == 'D'
         m_db_ttl += j_ck_amt
      else
         m_cr_ttl += j_ck_amt
      endif
      skip
   end while

   dbgoto(m_vou_recno)

   while .t.
     	//@ 7,21 get m_j_jv_no valid f_valjv_no(m_j_jv_no)
      @ 8,21 get m_j_date valid dtoc(m_j_date)!='  /  /    '
      @ 9,21 get m_sup_no pict '99'
      @10,21 get m_j_pay_to pict '@!' valid m_j_pay_to!=space(25)
      @11,21 get m_bank_no pict '99'
      @12,21 get m_j_ck_no pict '@!' valid f_val_ck_no(m_j_jv_no,m_j_ck_no,m_oj_ck_no)
      @13,21 get m_j_desc pict '@!'
      read

      if lastkey()=27
         exit
      endif

      if f_ask('Data Correct?')

         m_ok := .t.

         if f_ask('Save?')

            select checkmas
            if rec_lock(5)

               if m_j_ck_no != m_oj_ck_no
                  select checkvou
                  if fil_lock(5)
                     while .t.
                        seek m_oj_ck_no
                        if eof()
                           exit
                        endif
                        replace j_ck_no with m_j_ck_no
                     end while
                     m_movement := .t.

                  else
                     m_ok := .f.

                  endif

               endif

               if m_ok
                  select checkmas
                  replace j_jv_no with m_j_jv_no, j_date with m_j_date,;
                     sup_no  with m_sup_no, j_pay_to with m_j_pay_to,;
                     bank_no with m_bank_no, j_ck_no with m_j_ck_no,;
                     j_desc  with m_j_desc

                  m_movement := .t.

               endif

               unlock all

            endif

         else
            //Reset Chk No. Value
            m_j_ck_no  := m_oj_ck_no

         endif

         f_bcln()

         select checkvou
         dbgoto(m_vou_recno)

         @14,5 to 18,74

         while .t.
            // -ADD-  -EDIT-  -NEXT-  -PREVIOUS-  -DELETE-  -QUIT-
            setcolor(m_cmen)
            @24,14 prompt ' ADD '      mess 'Edit record on display.'
            @24,21 prompt ' EDIT '     mess 'Edit record on display.'
            @24,29 prompt ' NEXT '     mess 'Go to the next record in file.'
            @24,37 prompt ' PREVIOUS ' mess 'Go to the previous record in file.'
            @24,49 prompt ' DELETE '   mess 'Delete this record.'
            @24,59 prompt ' QUIT '     mess 'Return to previous program.'
            menu to m_sel2
            setcolor(m_cnor)

            do case
               case m_sel2 == 1 .or. m_sel2==2 //Add or Edit
                  if m_sel2 == 1  //Add
                     m_acct_code:=space(4)
                     m_j_ck_amt:=0
                     m_j_d_or_c:=' '
                  else
                     m_acct_code:= acct_code
                     m_j_ck_amt := j_ck_amt
                     m_j_d_or_c := j_d_or_c
                  endif

                  while .t.
                     @15,28 get m_acct_code valid f_valacct(m_acct_code)
                     @16,28 get m_j_ck_amt pict '99,999,999.99' valid m_j_ck_amt!=0
                     @17,28 get m_j_d_or_c pict '!' valid m_j_d_or_c$'DC'
                     read

                     if lastkey()==27
                        exit
                     endif

                     do case
                        case m_j_d_or_c=='D'
                           @17,28 say 'DEBIT '
                        case m_j_d_or_c=='C'
                           @17,28 say 'CREDIT'
                        otherwise
                           @17,28 say space(6)
                     end case

                     if m_acct_code == space(4) .or. m_j_ck_amt == 0 .or. ! m_j_d_or_c$'DC'
                        loop
                     endif

                     if f_ask('Data Correct?')

                        if f_ask('Save?')

                           select checkvou

                           if fil_lock(5)
                              if m_sel2 == 1  //Add
                                 append blank
                              endif
                              replace j_ck_no with m_j_ck_no,;
                                 acct_code with m_acct_code,;
                                 j_ck_amt with m_j_ck_amt,;
                                 j_d_or_c with m_j_d_or_c

                              m_vou_recno:= recno()
                              m_db_ttl:=m_cr_ttl:=0

                              seek m_j_ck_no
                              while j_ck_no == m_j_ck_no .and. ! eof()
                                 if j_d_or_c == 'D'
                                    m_db_ttl += j_ck_amt
                                 else
                                    m_cr_ttl += j_ck_amt
                                 endif
                                 skip
                              end while

                              dbgoto(m_vou_recno)

                              @ 7,59 say tran(m_db_ttl,'999,999,999.99')
                              @ 8,59 say tran(m_cr_ttl,'999,999,999.99')
                              @ 9,59 say tran(m_db_ttl-m_cr_ttl,'999,999,999.99')

                              m_movement := .t.

                           endif

                        endif

                        exit

                     else
                        loop

                     endif

                  end while

               case m_sel2 == 3  //Next
                  select checkvou
                  skip
                  if eof() .or. j_ck_no != m_j_ck_no
                     f_err('LAST Entry for Check#'+alltrim(m_j_ck_no)+'!',.f.)
                     skip -1
                  endif

               case m_sel2 == 4  //Previous
                  select checkvou
                  skip -1
                  if bof() .or. j_ck_no != m_j_ck_no
                     f_err('FIRST Entry for Check#'+alltrim(m_j_ck_no)+'!',.f.)
                     if ! bof()
                        skip
                     endif
                  endif

               case m_sel2 == 5  //Delete
                  select checkvou
                  if rec_lock(5)

                     if j_d_or_c == 'D'
                        m_db_ttl -= j_ck_amt
                     else
                        m_cr_ttl -= j_ck_amt
                     endif

                     @ 7,59 say tran(m_db_ttl,'999,999,999.99')
                     @ 8,59 say tran(m_cr_ttl,'999,999,999.99')
                     @ 9,59 say tran(m_db_ttl-m_cr_ttl,'999,999,999.99')

                     delete
                     unlock

                     m_deleted := .t.

                  endif

                  seek m_j_ck_no

               otherwise
                  if round(m_db_ttl,2) != round(m_cr_ttl,2)
                     if f_ask('Total DEBIT is not equal to Total CREDIT!  Exit anyway?')
                        if ascan(a_notbalanced,m_j_jv_no) == 0
                           aadd(a_notbalanced,m_j_jv_no)
                        endif
                        exit
                     endif
                  else
                     m_ptr:=ascan(a_notbalanced,m_j_jv_no)
                     if m_ptr != 0
                        m_a_size:=len(a_notbalanced)
                        adel(a_notbalanced,m_ptr)
                        asize(a_notbalanced,m_a_size-1)
                     endif
                     exit
                  endif

            endcase

            @15,28 say acct_code
            @16,28 say j_ck_amt pict '99,999,999.99'

            do case
               case j_d_or_c=='D'
                  @17,28 say 'DEBIT '
               case j_d_or_c=='C'
                  @17,28 say 'CREDIT'
               otherwise
                  @17,28 say space(6)
            end case

            if acct_code!=space(4)
               f_valacct(acct_code)
            else
               @15,41 say space(30)
            endif
         end while

         @14, 5 clear to 14,74
         @14, 5 clear to 18, 5
         @18, 5 clear to 18,74
         @14,74 clear to 18,74

         exit

      endif

   end while

   exit

end while
return nil


function f_valjv_no(_m_j_jv_no)
local _m_oldarea:=select(), _m_oldrec:=recno(), _m_return:=.t.
select checkmas
seek _m_j_jv_no
if ! eof()
   f_err('CDV# '+alltrim(_m_j_jv_no)+' already exists!',.f.)
   _m_return:=.f.
else
   m_j_ck_no := _m_j_jv_no
endif
select(_m_oldarea)
dbgoto(_m_oldrec)
return(_m_return)


function f_val_ck_no(_m_j_jv_no,_m_j_ck_no,_m_oj_ck_no)
local _m_oldarea:=select(), _m_oldrec:=recno(), _m_return:=.t.
select checkvou
seek _m_j_ck_no
if ! eof()
   if _m_j_ck_no != _m_oj_ck_no
      f_err('CHK#'+alltrim(_m_j_ck_no)+' already exists under CDV#'+alltrim(_m_j_jv_no)+'!',.f.)
      _m_return:=.f.
   endif
endif
select(_m_oldarea)
dbgoto(_m_oldrec)
return(_m_return)


function f_valacct(_m_acct_code)
local _m_oldarea:=select(), _m_oldrec:=recno(), _m_return:=.t.
select accounts
seek _m_acct_code
if ! eof()
   @15,41 say subs(acct_desc,1,30)
   _m_return:=.t.
else
   dbgotop()
   m_brow_fields={"acct_code","acct_desc"}
   m_brow_head  ={"ACCT.#","DESCRIPTION"}
   f_cbrow(11,15,20,55,m_brow_fields,m_brow_head)
   if eof() .or. lastkey()=27
      _m_return:=.f.
   else
      m_acct_code:=acct_code
      @15,41 say subs(acct_desc,1,30)
      _m_return:=.t.
   endif
endif
select(_m_oldarea)
return(_m_return)


function f_xfercdb()
local _m_prevscrn:=savescreen(11,9,16,71)
while .t.
   select 5
   if ! net_use('&dpath\checkmas',.t.,5,.f.,'')
      exit
   endif
   set index to &dpath\checkmas, &dpath\checkma2, &dpath\checkma3

   select 4
   if ! net_use('&dpath\checkvou',.t.,5,.f.,'')
      exit
   endif
   set index to &dpath\checkvou, &dpath\checkvo2

   select 2
   if ! net_use('&dpath\acheckvo',.t.,5,.f.,'')
      exit
   endif
   set index to &dpath\acheckvo, &dpath\acheckv2

   m_period:=dtoc(date())
   m_fr_date:=ctod(subs(m_period,1,2)+'/01/'+subs(m_period,7,4))
   m_to_date:=f_lastday(val(subs(m_period,1,2)),val(subs(m_period,7,4)))

   f_drawbox(11,9,15,69,1,3)

   setcolor(m_cnor)

   @13,12 say 'Enter CDB dates to transfer :   /  /     to   /  /    '
   @13,42 get m_fr_date valid dtoc(m_fr_date)!='  /  /    '
   @13,56 get m_to_date valid dtoc(m_to_date)!='  /  /    '
   read

   if f_esc()
      f_err('<Esc> key pressed.  Process Aborted !',.t.)
      exit
   endif

   m_ctr:=0

   select checkmas
   append from &dpath\acheckma for j_date >= m_fr_date .and. j_date <= m_to_date

   select 3
   if ! net_use('&dpath\acheckma',.t.,5,.f.,'')
      exit
   endif
   set index to &dpath\acheckma, &dpath\acheckm2, &dpath\acheckm3
   dbgotop()

   while ! eof()

      if j_date >= m_fr_date .and. j_date <= m_to_date

         m_j_ck_no:=j_ck_no
         m_ctr++

         select acheckvo
         seek m_j_ck_no

         while j_ck_no == m_j_ck_no .and. ! eof()
            m_acct_code:=acct_code
            m_j_ck_amt:=j_ck_amt
            m_j_d_or_c:=j_d_or_c

            select checkvou
            append blank
            replace j_ck_no with m_j_ck_no,;
               acct_code  with m_acct_code,;
               j_ck_amt   with m_j_ck_amt,;
               j_d_or_c   with m_j_d_or_c

            select acheckvo
            delete

            skip

         end while

         select acheckma
         delete

      endif

      skip

   end while

   if m_ctr > 0
      select acheckma
      pack
      select acheckvo
      pack
      f_mess(alltrim(str(m_ctr))+' new records added!',.t.)
   else
      f_mess('No new records added!',.t.)
   endif

   exit

end while
restscreen(11,9,16,71,_m_prevscrn)
dbcloseall()
return nil

/*
         7             21                                 59
      CDV-NO..... : 12345678                      Ttl Db :999,999,999.99
@ 7   CDV-NO..... : m_j_jv_no                     Ttl Cr :999,999,999.99
@ 8   DATE....... : m_j_date                      Balance:999,999,999.99
@ 9   SUPPLIER NO : m_sup_no
@10   PAYEE NAME. : m_j_pay_to
@11   BANK CODE.. : m_bank_no
@12   CHECK NO... : m_j_ck_no
@13   EXPLANATION : m_j_desc
         @15                  28
   +5                                                                   74+
     --------------------------------------------------------------------
      ACCOUNT CODE...... : m_acct_code
      AMOUNT............ : m_j_ck_amt
      DEBIT/CREDIT (D/C) : m_j_d_or_c
     --------------------------------------------------------------------
     @14,5 to 18,74
*/
