/*
This program creates database file containing the Pag-ibig contributions
Authored by: Sonny C.
Date: Feb. 08, 1998
*/

function f_pgbgdisk()
   m_oldcol = setcolor()
   m_qtrscrn = savescreen(0,0,24,79)
   set color to (m_cnor)
   while .t.
      f_bcln()
      m_spool = .t.
      m_page = 0
      m_crow = 60
      m_fig = "99,999,999.99"

      f_setting()

      select 1
      if !net_use("&dpath\sys_id",.t.,5)
         exit
      endif
      if !fil_lock(5)
         exit
      endif

      select 2
   	if ! net_use('&dpath\master',.t.,5)
   		exit
   	endif
      set index to &dpath\mbyemp
      reindex
      dbgotop()

      select 5
   	if ! net_use('&dpath\history',.t.,5)
   		exit
   	endif
   	set index to &dpath\hbyemp
      reindex

      select master
      set relation to emp_no into history

      select 3
      if ! net_use("&opath\billing",.t.,5)
         exit
      endif
      select 4
      if ! net_use("&opath\cont",.t.,5)
         exit
      endif

      select sys_id
      m_pres_mo := str(month(ctod(substr(str(100 + pres_mo,3),2,2) + "/01/" + ;
         substr(str(year(end_date),4),3,2))),2)
      m_month := subs(str(100+val(m_pres_mo),3),2,2)
      m_year  := str(year(beg_date),4)
      m_period:= m_year+m_month

      f_drawbox(10,12,14,61,1,3)

      setcolor(m_cnor)

      while .t.
         @ 12,15 say "ENTER THE APPLICABLE PERIOD (YYYYMM):" get m_period pict '999999'
         read
         if val(subs(m_period,5,2)) < 1 .or. val(subs(m_period,5,2)) > 13
            f_err('Invalid Period.  Please check!',.f.)
            loop
         endif
         if lastkey() = 27
            exit
         endif
         if f_ask('Data Correct ?')
            exit
         endif
      end while

      if lastkey() = 27
         exit
      endif

      m_fname1 = subs(m_compcode,1,2)+"LP"+subs(M_PERIOD,3,4)+".DBF"
      m_fname2 = subs(m_compcode,1,2)+"PP"+subs(M_PERIOD,3,4)+".DBF"
      m_fname3 = subs(m_compcode,1,2)+"LP"+subs(M_PERIOD,3,4)+".TXT"
      m_fname4 = subs(m_compcode,1,2)+"PP"+subs(M_PERIOD,3,4)+".TXT"

      select billing
      copy structure to &tpath\&m_fname1
      select cont
      copy structure to &tpath\&m_fname2

      select 3  //Billing
      if !net_use("&tpath\&m_fname1",.t.,5)
         exit
      endif
      zap

      select 4  //Contribution
      if !net_use("&tpath\&m_fname2",.t.,5)
         exit
      endif
      zap

      select master
      m_recc = lastrec()
      go top

      f_drawbox(16,3,19,76,5,3)
      set color to (m_cnor)
      @ 17, 15 say replicate(".",50)
      @ 18, 15 say "0%          25%         50%          75%      100%"
      m_ctr = 0

      m_ttl_m_hln:=m_emp_bill:=m_ttl_pgee:=m_ttl_pger:=m_emp_cont:=0

      while ! eof()
         m_ctr = m_ctr + 1
         @17, 15 say replicate(chr(219),int(round(m_ctr / m_recc * 50,0)))

         if m_hln + m_pgee = 0
            skip
            loop
         endif

         m_lastname  := subs(emp_nm,1,15)
         m_firstname := subs(emp_nm,16,15)
         if mname=space(15)
            m_midname  := subs(emp_nm,31,2)
         else
            m_midname  := mname
         endif

         m_eyeeno := emp_no

         if subs(pgbg_no,1,5) # space(5)
            m_hdmfid := pgbg_no
         else
            m_hdmfid := dtoc(history->birthd)
         endif

         m_m_hln  := m_hln
         m_m_pgee := m_pgee
         m_m_pger := m_pger

         if m_m_hln>0
            select 3  //Billing
            append blank
            replace eyerid with m_comp_sss, eyeeno with m_eyeeno,;
               hdmfid with m_hdmfid,;
               lname with m_lastname, fname with m_firstname,;
               mid with m_midname, percov with m_period,;
               amort with m_m_hln

            m_ttl_m_hln += m_m_hln
            m_emp_bill ++

         endif

         if m_m_pgee+m_m_pger > 0
            select 4  //Cont
            append blank
            replace eyerid with m_comp_sss, eyeeno with m_eyeeno,;
               hdmfid with m_hdmfid,;
               lname with m_lastname, fname with m_firstname,;
               mid with m_midname, percov with m_period,;
               peramt1 with m_m_pgee, peramt2 with m_m_pger
            m_ttl_pgee += m_m_pgee
            m_ttl_pger += m_m_pger
            m_emp_cont ++
         endif

         select master
         skip

      end while

      @17, 15 say replicate(chr(219),50)

      f_mess("Spooling the Summary to a text file.",.f.)

      set console off
      set device to print
      set alte to &tpath\&m_fname3
      set alte on

      select 3 //Billing
      dbgotop()

      m_crow := 60
      m_page := 0
      while ! eof()
         if m_crow > 58
            m_crow := 7
            m_page ++
            if m_page > 1
               ??chr(12)
            endif
            ?m_company+space(77-len(m_company))+'Page '+tran(m_page,'99')
            ?'HDMF Loan Monthly Amortization'
            ?'Employer ID: '+m_comp_sss
            ?'Billing Month: '+subs(m_period,5,2)+'-'+subs(m_period,1,4)
            ?
            ?'Co.ID#  HDMF-ID       LAST NAME       FIRST NAME      MIDDLE NAME      AMORTIZATION'
            ?'------  ------------  --------------- --------------- ---------------  -------------'
         endif
/*
Co.ID#  HDMF-ID       LAST NAME       FIRST NAME      MIDDLE NAME      AMORTIZATION'
------  ------------  --------------- --------------- ---------------  -------------'
123456  123456789012  123456789012345 123456789012345 123456789012345  99,999,999.99
                                                               Total: 999,999,999.99
*/
         ?subs(eyeeno,1,6)+'  '+hdmfid+'  '+subs(lname,1,15)+' ';
            +subs(fname,1,15)+' '+subs(mid,1,15)+' '+tran(amort,'999,999,999.99')

         m_crow ++

         skip

      end while

      ?space(70)+'--------------'
      ?space(62)          +'Total : '+tran(m_ttl_m_hln,'999,999,999.99')
      ?space(52)+'No.of Employees : '+ltrim(tran(m_emp_bill ,'999,999'))+chr(12)

      set alte off
      set alte to
      set alte to &tpath\&m_fname4
      set alte on

      select 4 //Contributions
      dbgotop()

      m_crow := 60
      m_page := 0
      while ! eof()
         if m_crow > 58
            m_crow := 7
            m_page ++
            if m_page > 1
               ??chr(12)
            endif
            ?m_company+space(96-len(m_company))+'Page '+tran(m_page,'99')
            ?'HDMF Monthly Contributions'
            ?'Employer ID: '+m_comp_sss
            ?'Period Covered: '+subs(m_period,5,2)+'-'+subs(m_period,1,4)
            ?
            ?"Co.ID#  HDMF-ID       LAST NAME       FIRST NAME      MIDDLE NAME      'EE CONT.  'ER CONT.  TOTAL"
            ?'------  ------------  --------------- --------------- ---------------  ---------- ---------- ----------'
         endif

/*
Co.ID#  HDMF-ID       LAST NAME       FIRST NAME      MIDDLE NAME      'EE CONT.  'ER CONT.  TOTAL
------  ------------  --------------- --------------- ---------------  ---------- ---------- ----------
123456  123456789012  123456789012345 123456789012345 123456789012345  999,999.99 999,999.99 999,999.99
                                                                       ---------- ---------- ----------
                                                                Total: 999,999.99 999,999.99 999,999.99
*/
         ?subs(eyeeno,1,6)+'  '+hdmfid+'  '+subs(lname,1,15)+' ';
            +subs(fname,1,15)+' '+subs(mid,1,15)+'  ';
            +tran(peramt1,'999,999.99')+' ';
            +tran(peramt2,'999,999.99')+' ';
            +tran(peramt1+peramt2,'999,999.99')

         m_crow ++

         skip

      end while

      ?space(71)+'---------- ---------- ----------'
      ?space(63)+'Total : '+tran(m_ttl_pgee,'999,999.99')+' ';
         +tran(m_ttl_pger,'999,999.99')+' ';
         +tran(m_ttl_pgee+m_ttl_pger,'999,999.99')
      ?space(53)+'No.of Employees : '+ltrim(tran(m_emp_cont ,'999,999'))+chr(12)

      set alte off
      set alte to
      set device to screen
      set console on

      f_drawbox(7,13,15,64,1,3)

      @ 8,16 say 'SUMMARY:  Amort. Total Amount : '+tran(m_ttl_m_hln,'999,999,999.99')
      @ 9,33 say 'No. of Emps. : '+tran(m_emp_bill,'999,999')
      @11,16 say 'Contributions:'
      @12,33 say 'Employee     : '+tran(m_ttl_pgee,'999,999,999.99')
      @13,33 say 'Employer     : '+tran(m_ttl_pger,'999,999,999.99')
      @14,33 say 'No. of Emps. : '+tran(m_emp_cont,'999,999')

      dbcloseall()

      f_mess("Databases:"+m_fname1+" & "+m_fname2+", Text Files:"+m_fname3+" & "+m_fname4,.t.)

      exit

   end while
   restscreen(0,0,24,79,m_qtrscrn)
   dbcloseall()
   setcolor(m_oldcol)
   return nil
