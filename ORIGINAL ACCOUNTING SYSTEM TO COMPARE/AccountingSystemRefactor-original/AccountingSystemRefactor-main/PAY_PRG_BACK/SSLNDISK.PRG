/*
This program creates a text file containing the SSS Loan Payments
Authored by: Sonny C.
Date: April 4, 2000
*/

m_prevscrn:=savescreen(7,22,20,62)
m_oldcol:=setcolor()
setcolor(m_cnor)
while .t.

	f_setting()

	select 1
	if ! net_use('&dpath\sys_id',.t.,5)
		exit
	endif
	if ! fil_lock(5)
		exit
	endif

	select 2
	if ! net_use('&dpath\history',.t.,5)
		exit
	endif
   set index to &dpath\hbyemp

	select 3
	if ! net_use('&dpath\master',.t.,5)
		exit
	endif

   select master
   index on sss to &dpath\mbysss
   set index to &dpath\mbysss
   dbgotop()

   set relation to emp_no into history

   select sys_id

	m_pres_mo:=subs(str(100+month(ctod(subs(str(100+pres_mo,3),2,2)+'/01/'+subs(str(year(end_date),4),3,2))),3),2,2)
   m_month := m_pres_mo
	m_year  := str(year(beg_date),4)
   m_which := ' '
   m_sbr_no:=space(10)
   m_sbr_date:=ctod('  /  /  ')
   m_sbr_amt :=0

   //Confirm Month and Year
   f_bcln()
   f_drawbox(7,22,19,62,1,3)
	setcolor(m_cnor)

   while .t.

      @ 8,24 say 'SELECT THE PERIOD'
      @10,24 say 'MONTH   :'
      @11,24 say 'YEAR    :'
      @13,24 say 'SALARY/CALAMITY/SAL&CAL LOAN'
      @14,24 say "S/C/All :"
      @16,24 say "SBR No  :"
      @17,24 say "SBR Date:"
      @18,24 say "SBR Amt :"

      @10,36 get m_month pict '99' vali m_month > '00' .and. m_month < '13'
      @11,36 get m_year pict '9999' vali m_year >= str(year(beg_date-1),4)
      @14,36 get m_which picture '!'
      @16,36 get m_sbr_no picture '@!'
      @17,36 get m_sbr_date
      @18,36 get m_sbr_amt picture '999,999,999.99'
      read

      if lastkey()==27
         exit
      endif

      if f_ask('Are the data correct?')
         exit
      endif

   end while

   if lastkey() = 27
      exit
   endif

   m_month:= substr(str(100+val(m_month),3),2,2)
   m_appl_month:=m_month+'-'+m_year
   m_year := substr(m_year,3,2)

   do case
      case m_which=='S'
         m_sfname := subs(m_compcode,1,2)+"IS"+m_year+m_month+'.TXT'
         m_sfname2:= subs(m_compcode,1,2)+"TS"+m_year+m_month+'.TXT'
      case m_which=='C'
         m_sfname := subs(m_compcode,1,2)+"IC"+m_year+m_month+'.TXT'
         m_sfname2:= subs(m_compcode,1,2)+"TC"+m_year+m_month+'.TXT'
      case m_which=='A'
         m_sfname := subs(m_compcode,1,2)+"IL"+m_year+m_month+'.TXT'
         m_sfname2:= subs(m_compcode,1,2)+"TL"+m_year+m_month+'.TXT'
   endcase

   m_ncompany = substr(alltrim(m_company) + space(30 - len(alltrim(m_company))),1,30)
   m_id = alltrim(strtran(m_comp_sss,"-","",1))
   m_id = m_id + space(10 - len(m_id))

   select master
   goto top

   set console off
   set alternate to &tpath\&m_sfname
   set alternate on

   ? "00" + m_id + m_ncompany + m_year + m_month

   m_ctr=0      //Stores the number of employees included in the report
                //If the employee has both Salary and Calamity Loans then
                //he will have 2 entries and be counted twice

   m_pen_total:=0  //Stores the total Penalties
   m_ln_total :=0  //Stores the total Salary and Calamity loan payments

   while ! eof()

      m_l_date    :=subs(dtos(l_date) ,3,6)
      m_ss_cal_dte:=subs(dtos(ss_cal_dte),3,6)

      /*
      Oct 9, 2014
      m_sln_amt:=subs( str(1000000+sln_amt/1.12,7), 2,6)
      m_cln_amt:=subs( str(1000000+ss_cal_ln/1.12,7), 2,6)
      */

      m_sln_amt:=subs( str(1000000+sln_amt,7), 2,6)
      m_cln_amt:=subs( str(1000000+ss_cal_ln,7), 2,6)

      m_emp_nm :=subs(alltrim(emp_nm)+space(32-len(alltrim(emp_nm))),1,32)

      if m_which$'SA'
         //salary loan
         if m_sln > 0
            m_penalty:=0
            ? '10' + substr(sss,1,2) + substr(sss,4,7) + substr(sss,12,1) + substr(m_emp_nm,1,32);
               +'S'+m_l_date+m_sln_amt
            ?? subs( str(10000000+m_penalty*100,8),2,7)
            ?? subs( str(10000000+abs(m_sln)*100,8),2,7)
            ?? iif(m_sln < 0,'-',' ')
            m_pen_total:=m_penalty
            m_ln_total+=m_sln
            m_ctr++
         endif
      endif

      if m_which$'CA'
         //Calamity Loan
         if m_sscal > 0
            m_penalty:=0
            ? "10" + substr(sss,1,2) + substr(sss,4,7) + substr(sss,12,1) + substr(m_emp_nm,1,32);
               +'C'+m_ss_cal_dte+m_cln_amt
            ?? subs( str(10000000+m_penalty*100,8),2,7)
            ?? subs( str(10000000+abs(m_sscal)*100,8),2,7)
            ?? iif(m_sscal < 0,'-',' ')
            m_pen_total:=m_penalty
            m_ln_total+=m_sscal
            m_ctr++
         endif
      endif

      skip

   end while

   ? "99"+subs(str(10000+m_ctr,5),2,4)
   ??subs(str(1000000000+m_pen_total*100,10),2,9)
   ??subs(str(1000000000+m_ln_total*100,10),2,9)

   set alternate off
   set alternate to

   set alternate to &tpath\&m_sfname2
   set alternate on

   set century on

   select master
   dbgotop()
   m_crow := 60
   m_page := 0
   m_lnhead1:= m_company+space(f_center('LMS Diskette',116)-len(m_company))+'LMS Diskette'
   m_lnhead1:= m_lnhead1 + space( 97-len(m_lnhead1)) + dtoc(date()) + ' ' + time()
   m_lnhead2:= space(f_center("Detailed Listing of Employees' Loans",116))+"Detailed Listing of Employees' Loans"
   m_lnhead2:= m_lnhead2 + space(109-len(m_lnhead2)) + 'Page '


   m_ctr=0  //Stores the number of employees included in the report
            //If the employee has both Salary and Calamity Loans then
            //he will have 2 entries and be counted twice

   m_pen_total:=0  //Stores the total Penalties
   m_ln_total :=0  //Stores the total Salary and Calamity loan payments

   m_p_cnt := m_p_ptl := m_p_ltl := 0

   while ! eof()
      if m_crow > 55
         m_page ++
         if m_page > 1
            ?
            ?
            ?space(13)+'Page Total: Count = '+tran(m_p_cnt,'99999')+space(35)+tran(m_p_ptl,'999,999.99')+'  '+tran(m_p_ltl,'999,999.99')+'  '+tran(m_p_ptl+m_p_ltl,'999,999.99')
            ??chr(12)
         endif
         ?m_lnhead1
         ?m_lnhead2+tran(m_page,'99')
         ?space(f_center('Billing Month: '+m_appl_month,116))+'Billing Month: '+m_appl_month
         ?'                                              Loan  Loan        Loan        Penalty  Amort.'
         ?'SSS Number   Name                             Type  Date        Amount      Amount   Amount      Total       Remarks'
         ?'------------ -------------------------------- ----  ----------  ----------  -------  ----------  ----------  -------'
         //12-4567890-1 12345678901234512345678901234512  S    12/12/1234  999,999.99   999.99  999,999.99  999,999.99  X
         m_crow := 6
         m_p_cnt := m_p_ptl := m_p_ltl := 0
      endif

      m_l_date    :=dtoc(l_date)
      m_ss_cal_dte:=dtoc(ss_cal_dte)

      /*
      Oct 9, 2014
      m_sln_amt:=tran(sln_amt/1.12,'999,999.99')
      m_cln_amt:=tran(ss_cal_ln/1.12,'999,999.99')
      */

      m_sln_amt:=tran(sln_amt,'999,999.99')
      m_cln_amt:=tran(ss_cal_ln,'999,999.99')


      m_emp_nm :=subs(alltrim(emp_nm)+space(32-len(alltrim(emp_nm))),1,32)

      if m_which$'SA'
         //salary loan
         if m_sln > 0
            m_penalty:=0
            ? substr(sss,1,12) + ' ' + m_emp_nm + '  '  ;
               +'S    '+m_l_date+'  '+m_sln_amt + ' '   ;
               + tran(m_penalty,'9,999.99') ;
               + tran(m_sln,'9,999,999.99') ;
               + tran(m_penalty + m_sln,'9,999,999.99')
            if emp_type = 'A'
               ??'  H'
            else
               ??'  T'
            endif

            m_pen_total:=m_penalty
            m_ln_total+=m_sln
            m_p_cnt ++
            m_p_ptl += m_penalty
            m_p_ltl += m_sln
            m_ctr++

         endif
      endif

      if m_which$'CA'
         //Calamity Loan
         if m_sscal > 0
            m_penalty:=0

            ? substr(sss,1,12) + ' ' + m_emp_nm + '  '  ;
               +'C    '+m_ss_cal_dte +m_cln_amt + ' '   ;
               + tran(m_penalty,'9,999.99') ;
               + tran(m_sscal,'9,999,999.99') ;
               + tran(m_penalty + m_sscal,'9,999,999.99')
            if emp_type = 'A'
               ??'  H'
            else
               ??'  T'
            endif

            m_pen_total:=m_penalty
            m_ln_total+=m_sscal
            m_p_cnt ++
            m_p_ptl += m_penalty
            m_p_ltl += m_sscal
            m_ctr++
         endif
      endif

      skip

   end while

   if m_p_cnt > 0
         ?
         ?
         ?space(13)+'Page Total: Count = '+tran(m_p_cnt,'99999')+space(35)+tran(m_p_ptl,'999,999.99')+'  '+tran(m_p_ltl,'999,999.99')+'  '+tran(m_p_ptl+m_p_ltl,'999,999.99')
   endif
   ?space(12)+'Grand Total: Count = '+tran(m_ctr,'99999')+space(35)+tran(m_pen_total,'999,999.99')+'  '+tran(m_ln_total,'999,999.99')+'  '+tran(m_pen_total+m_ln_total,'999,999.99')
   ?chr(12)

   set century on

   ?space(f_center(m_company,80))+m_company
   ?space(f_center(m_comp_addr,80))+m_comp_addr
   ?
   ?space(5)+'TRANSMITTAL LIST'
   ?
   ?space(8)+'ER ID No.                              : '+m_comp_sss
   ?space(8)+'Applicable Month                       : '+m_appl_month
   ?space(8)+'Total No. of Records                   : '+ltrim(tran(m_ctr,'99,999,999'))
   ?space(8)+'Total Amount Paid                      : '+ltrim(tran(m_pen_total+m_ln_total,'999,999,999.99'))
   ?
   ?space(5)+'REMITTANCE'
   ?
   ?space(8)+'Amount Paid                            : '+ltrim(tran(m_sbr_amt,'999,999,999.99'))
   ?space(8)+'Trans/SBR No.(Attached 2 photo copies) : '+m_sbr_no
   ?space(8)+'Date Paid                              : '+dtoc(m_sbr_date)
   ?
   ?
   ?space(51)+'Certified Correct:'
   ?
   ?
   ?space(44)+repl('_',33)
   ?space(44)+'Company Authorized Representative'
   ?space(5)+repl('_',72)
   ?
   ?space(5)+'To Be Filled Up By SSS Personnel'
   ?
   ?space(16)+'Received By :  '+repl('_',33)
   ?space(41)+'Printed Name'
   ?
   ?space(28)+':  '+repl('_',33)
   ?space(42)+'Signature'
   ?
   ?space(28)+':  '+repl('_',33)
   ?space(45)+'Date'
   ?space(5)+'Remarks:'
   ?space(5)+repl('_',72)
   ?space(5)+repl('_',72)
   ?space(5)+repl('_',72)
   ?
   ?
   ?space(5)+'Diskette returned to ER:'
   ?
   ?space(16)+'Received By :  '+repl('_',33)
   ?space(41)+'Printed Name'
   ?
   ?space(28)+':  '+repl('_',33)
   ?space(42)+'Signature'
   ?
   ?space(28)+':  '+repl('_',33)
   ?space(45)+'Date'
   ?
   ?space(5)+'Other Documents:    (Specify)'
   ?space(5)+'1.  DISKETTE'
   ?space(5)+'2.  INVALID ENTRIES'
   ?space(5)+'3.  TRANSMITTAL/RECEIPT'+chr(12)

   set alternate off
   set alternate to
   set console on

   f_mess('Processing Completed.',.f.)
   inkey(2)

   exit

end while
restscreen(7,22,20,62,m_prevscrn)
dbcloseall()
setcolor(m_oldcol)
return nil
