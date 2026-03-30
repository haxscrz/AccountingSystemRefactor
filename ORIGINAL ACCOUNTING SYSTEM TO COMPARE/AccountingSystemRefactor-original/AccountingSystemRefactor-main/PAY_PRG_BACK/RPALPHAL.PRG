/*
Program Code: Rpalphal.prg
Program Func:This program prints the Alpha-List
Author: Sonny C.
Date  : Aug.10, 2000
*/

//function f_rpalphal()
   m_oldcol  := setcolor()
   m_qtrscrn := savescreen(12,18,19,61)
   setcolor(m_cnor)
   while .t.
      f_bcln()
      m_spool := .t.

      f_setting()

      select 7
      if !net_use("&opath\exmp2007",.t.,5)
         exit
      endif
      index on status to &opath\exmp2007
      set index to &opath\exmp2007

      select 6
      if !net_use("&dpath\history",.t.,5)
         exit
      endif
      set index to &dpath\hbyemp
      reindex

      select 5
      if !net_use("&dpath\tmcard",.t.,5)
         exit
      endif
      set index to &dpath\tbyemp
      reindex

      select 4
      if !net_use("&opath\exmption",.t.,5)
         exit
      endif
      set index to &opath\exmption
      reindex

      select 3
      if !net_use("&opath\taxdue",.t.,5)
         exit
      endif

      select 2
      if !net_use("&dpath\sys_id",.t.,5)
         exit
      endif
      if !fil_lock(5)
         exit
      endif

      select 1
      if !net_use("&dpath\master",.t.,5)
         exit
      endif
      set index to &dpath\mbynm
      reindex
      dbgotop()

      select sys_id
      m_year = str(year(beg_date),4)

      if trn_upd==trn_prc
         m_posted:=.t.
      else
         m_posted:=.f.
      endif

      f_drawbox(12,18,18,59,1,3)
      @13,21 say "Print Alpha List For The Year :"
      @13,53 get m_year picture "9999" valid m_year>=str(year(beg_date-1),4)
      read

      if f_esc()
         exit
      endif

      @15,21 say 'Select:'
      @15,30 prompt 'ALL EMPLOYEES'
      @16,30 prompt 'ACTIVE EMPLOYEES'
      @17,30 prompt 'RESIGNED EMPLOYEES'
      menu to m_select

      if f_esc()
         exit
      endif

      if !f_askspool()
         m_spool := .f.
         if f_esc()
            exit
         endif
         set print on
         set device to print
         set console off
      endif

      //f_compute_tax(m_posted)
      f_comp_tax(m_posted)
      f_print_alpha(m_select)

      if m_spool
         set alternate off
         set alternate to
      else
         set print off
         set device to screen
      endif
      set console on

      exit

   end while

   restscreen(12,18,19,61,m_qtrscrn)
   dbcloseall()
   setcolor(m_oldcol)
   return nil


***************************************
function f_print_alpha(_m_select)
local _m_oldarea:=select()

select master
dbgotop()

while ! eof()

   s1:=space(1)
	m_ctr:=0
   m_crow:=60
   m_pict:='99,999,999.99'
   m_page:=0
   m_t13th:=m_tsss:=m_tsal:=m_tnt13th:=m_tntsal:=m_texemp:=m_tprem:=m_ttaxdue:=;
   m_tjandec:=m_tjannov:=m_tdectax:=m_tref:=m_tadjstd:=0
   m_g_4a := m_g_4b := m_g_4c := m_g_4d := m_g_4e := m_g_4f := m_g_4g :=;
   m_g_4h := m_g_4i := m_g_4j := m_g_5b := m_g_6  := m_g_7  := m_g_8  :=;
   m_g_9  := m_g_10a:= m_g_10b:= m_g_11 := 0

   if m_posted

	   while ! eof()

	   	if y_gross+y_bonus+y_othergrs+y_midbon <= 0
	   		skip
	   		loop
	   	endif

		   if status=='OJT'
            skip
            loop
         endif

         do case

            case _m_select == 1 //All Employees

       	      m_ctr ++
               if m_crow > 58
                  m_page++
                  if m_page > 1
                     ??chr(12)
                  endif

                  ?m_company+space(239-len(m_company))+'Page '+str(m_page,2)
                  ?'TIN : '+alltrim(m_comp_tin)
                  ?'ALPHALIST OF EMPLOYEES AS OF DECEMBER 31 WITH NO PREVIOUS EMPLOYER WITHIN THE YEAR ('+m_year+')'
                  ?
                  /*
                  ?'                                                                  <--------G R O S S   C O M P E N S A T I O N   I N C O M E-------->'
                  ?'                                                                  <------------NON-TAXABLE--------------> <--------TAXABLE---------->                                                      <--YEAR-END ADJUSTMENT-->'
                  ?'                                                                                SSS,GSIS,PHIC                                                       PREM PAID ON                           AMOUNT       OVER'
                  ?'     TAXPAYER                                                                   & PAG-IBIG   SALRIES&OTHR               SALARIES&OTHR               HEALTH &/OR                            WITHHELD     WITHHELD     AMOUNT OF TAX'
                  ?'SEQ. IDENTIFICATION NAME OF EMPLOYEES                             13th MNTH PAY CONTRIBTIONS FORMS OF     13TH MNTH PAY FORMS OF      AMOUNT OF     HOSPITAL       TAX DUE    TAX WITHHELD AND PAID FOR TAX REFUNDED WITHHELD'
                  ?'NO.  NUMBER         LAST NAME      FIRST NAME     MIDDLE NAME     &OTHR BENFITS & UNION DUES COMPENSATION &OTHR BENFITS COMPENSATION  EXEMPTION     INSURANCE     (JAN-DEC)     (JAN-NOV)  IN DECEMBER  TO EMPLOYEE  AS ADJUSTED'
                  ?'---- -------------- --------------------------------------------- ------------- ------------ ------------ ------------- ------------- ------------- ------------ ------------ ------------ ------------ ------------ -------------'
                  //1234 123-456-789    12345678901234512345678901234512              99,999,999.99 9,999,999.99 9,999,999.99 99,999,999.99 99,999,999.99 99,999,999.99 9,999,999.99 9,999,999.99 9,999,999.99 9,999,999.99 9,999,999.99 99,999,999.99
                  */
                  ?'                                                                   <--- GROSS COMPENSATION INCOME------------------------------------------------------------------------------------------------------------>'
                  ?'                                                                                 <---NON-TAXABLE-----------------------------------------------------> <---TAXABLE-------------------------------------------> <---EXEMPTION---->                                                         <---YEAR-END ADJUSTMENT--->'
                  ?'                                                                                                             SSS,GSIS,PHIC SALARIES      TOTAL                                     SALARIES      TOTAL                            PREM PAID ON  NET                                       AMOUNT        OVER'
                  ?'                                                                   GROSS         13th MONTH                  & PAG-IBIG    & OTHER       NON-TAXABLE                 13th MONTH    & OTHER       TAXABLE                          HEALTH &/OR   TAXABLE                                   WITHHELD      WITHHELD      AMOUNT OF TAX'
                  ?'SEQ.               <--------------NAME OF EMPLOYEES--------------> COMPENSATION  PAY & OTHER   DE MINIMIS    CONTRIBTIONS  FORMS OF      EXEMPT                      PAY & OTHER   FORMS OF      COMPENSATION       AMOUNT OF     HOSPITAL      COMPENSATION  TAX DUE       TAX WITHHELD  AND PAID FOR  TAX REFUNDED  WITHHELD      SUBSTITUTED'
                  ?'NO.  TIN           LAST NAME       FIRST NAME      MIDDLE NAME     INCOME        BENEFITS      BENEFITS      & UNION DUES  COMPENSATION  COMP. INCOME  BASIC SALARY  BENEFITS      COMPENSATION  INCOME        CODE EXEMPTION     INSURANCE     INCOME        (JAN-DEC)     (JAN-NOV)     IN DECEMBER   TO EMPLOYEE   AS ADJUSTED   FILING'
                  ?'(1)  (2)           (3a)            (3b)            (3c)            4(a)          4(b)          4(c)          4(d)          4(e)          4(f)          4(g)          4(h)          4(i)          4(j)          (5a) (5b)          (6)           (7)           (8)           (9)           10A=(8)-(9)   10b=(9)-(8)   11=(9)+(10a)  (12)'
                  ?'---- ------------- ------------------------------- --------------- ------------- ------------- ------------- ------------- ------------- ------------- ------------- ------------- ------------- ------------- ---- ------------- ------------- ------------- ------------- ------------- ------------- ------------- ------------- -----------'
                  //1234 123-456-789-- 123456789012345 123456789012345 123456789012345 99,999,999.99 99,999,999.99 99,999,999.99 99,999,999.99 99,999,999.99 99,999,999.99 99,999,999.99 99,999,999.99 99,999,999.99 99,999,999.99 9999 99,999,999.99 99,999,999.99 99,999,999.99 99,999,999.99 99,999,999.99 99,999,999.99 99,999,999.99 99,999,999.99 9

                  m_crow:=12
               endif

            case _m_select == 2 //Active Employees
               if emp_type == 'R' //Resigned
                  skip
                  loop
               endif

       	      m_ctr ++
               if m_crow > 58
                  m_page++
                  if m_page > 1
                     ??chr(12)
                  endif

                  ?m_company+space(239-len(m_company))+'Page '+str(m_page,2)
                  ?'TIN : '+alltrim(m_comp_tin)
                  ?'ALPHALIST OF EMPLOYEES AS OF DECEMBER 31 WITH NO PREVIOUS EMPLOYER WITHIN THE YEAR ('+m_year+')'
                  ?
                  /*
                  ?'                                                                  <--------G R O S S   C O M P E N S A T I O N   I N C O M E-------->'
                  ?'                                                                  <------------NON-TAXABLE--------------> <--------TAXABLE---------->                                                      <--YEAR-END ADJUSTMENT-->'
                  ?'                                                                                SSS,GSIS,PHIC                                                       PREM PAID ON                           AMOUNT       OVER'
                  ?'     TAXPAYER                                                                   & PAG-IBIG   SALRIES&OTHR               SALARIES&OTHR               HEALTH &/OR                            WITHHELD     WITHHELD     AMOUNT OF TAX'
                  ?'SEQ. IDENTIFICATION NAME OF EMPLOYEES                             13th MNTH PAY CONTRIBTIONS FORMS OF     13TH MNTH PAY FORMS OF      AMOUNT OF     HOSPITAL       TAX DUE    TAX WITHHELD AND PAID FOR TAX REFUNDED WITHHELD'
                  ?'NO.  NUMBER         LAST NAME      FIRST NAME     MIDDLE NAME     &OTHR BENFITS & UNION DUES COMPENSATION &OTHR BENFITS COMPENSATION  EXEMPTION     INSURANCE     (JAN-DEC)     (JAN-NOV)  IN DECEMBER  TO EMPLOYEE  AS ADJUSTED'
                  ?'---- -------------- --------------------------------------------- ------------- ------------ ------------ ------------- ------------- ------------- ------------ ------------ ------------ ------------ ------------ -------------'
                  */
                  //1234 123-456-789    12345678901234512345678901234512              99,999,999.99 9,999,999.99 9,999,999.99 99,999,999.99 99,999,999.99 99,999,999.99 9,999,999.99 9,999,999.99 9,999,999.99 9,999,999.99 9,999,999.99 99,999,999.99

                  ?'                                                                   <--- GROSS COMPENSATION INCOME------------------------------------------------------------------------------------------------------------>'
                  ?'                                                                                 <---NON-TAXABLE-----------------------------------------------------> <---TAXABLE-------------------------------------------> <---EXEMPTION---->                                                         <---YEAR-END ADJUSTMENT--->'
                  ?'                                                                                                             SSS,GSIS,PHIC SALARIES      TOTAL                                     SALARIES      TOTAL                            PREM PAID ON  NET                                       AMOUNT        OVER'
                  ?'                                                                   GROSS         13th MONTH                  & PAG-IBIG    & OTHER       NON-TAXABLE                 13th MONTH    & OTHER       TAXABLE                          HEALTH &/OR   TAXABLE                                   WITHHELD      WITHHELD      AMOUNT OF TAX'
                  ?'SEQ.               <--------------NAME OF EMPLOYEES--------------> COMPENSATION  PAY & OTHER   DE MINIMIS    CONTRIBTIONS  FORMS OF      EXEMPT                      PAY & OTHER   FORMS OF      COMPENSATION       AMOUNT OF     HOSPITAL      COMPENSATION  TAX DUE       TAX WITHHELD  AND PAID FOR  TAX REFUNDED  WITHHELD      SUBSTITUTED'
                  ?'NO.  TIN           LAST NAME       FIRST NAME      MIDDLE NAME     INCOME        BENEFITS      BENEFITS      & UNION DUES  COMPENSATION  COMP. INCOME  BASIC SALARY  BENEFITS      COMPENSATION  INCOME        CODE EXEMPTION     INSURANCE     INCOME        (JAN-DEC)     (JAN-NOV)     IN DECEMBER   TO EMPLOYEE   AS ADJUSTED   FILING'
                  ?'(1)  (2)           (3a)            (3b)            (3c)            4(a)          4(b)          4(c)          4(d)          4(e)          4(f)          4(g)          4(h)          4(i)          4(j)          (5a) (5b)          (6)           (7)           (8)           (9)           10A=(8)-(9)   10b=(9)-(8)   11=(9)+(10a)  (12)'
                  ?'---- ------------- ------------------------------- --------------- ------------- ------------- ------------- ------------- ------------- ------------- ------------- ------------- ------------- ------------- ---- ------------- ------------- ------------- ------------- ------------- ------------- ------------- ------------- -----------'
                  //1234 123-456-789-- 123456789012345 123456789012345 123456789012345 99,999,999.99 99,999,999.99 99,999,999.99 99,999,999.99 99,999,999.99 99,999,999.99 99,999,999.99 99,999,999.99 99,999,999.99 99,999,999.99 9999 99,999,999.99 99,999,999.99 99,999,999.99 99,999,999.99 99,999,999.99 99,999,999.99 99,999,999.99 99,999,999.99 9


                  m_crow:=12
               endif

            case _m_select == 3 //Resigned Employees
               if emp_type != 'R' //Resigned
                  skip
                  loop
               endif

	            m_ctr ++
               if m_crow > 58
                  m_page++
                  if m_page > 1
                     ??chr(12)
                  endif

                  ?m_company+space(239-len(m_company))+'Page '+str(m_page,2)
                  ?'TIN : '+alltrim(m_comp_tin)
                  ?'ALPHALIST OF EMPLOYEES TERMINATED BEFORE DECEMBER 31 ('+m_year+')'
                  ?
                  /*
                  ?'                                                                                        <--------G R O S S   C O M P E N S A T I O N   I N C O M E-------->'
                  ?'                                                                                        <------------NON-TAXABLE--------------> <--------TAXABLE---------->                                                      <--YEAR-END ADJUSTMENT-->'
                  ?'                                                                                                      SSS,GSIS,PHIC                                                       PREM PAID ON                           AMOUNT       OVER'
                  ?'     TAXPAYER                                                                                         & PAG-IBIG   SALRIES&OTHR               SALARIES&OTHR               HEALTH &/OR                            WITHHELD     WITHHELD     AMOUNT OF TAX'
                  ?'SEQ. IDENTIFICATION NAME OF EMPLOYEES                             EMPLOYMENT EMPLOYMENT 13th MNTH PAY CONTRIBTIONS FORMS OF     13TH MNTH PAY FORMS OF      AMOUNT OF     HOSPITAL       TAX DUE    TAX WITHHELD AND PAID FOR TAX REFUNDED WITHHELD'
                  ?'NO.  NUMBER         LAST NAME      FIRST NAME     MIDDLE NAME     FROM       TO         &OTHR BENFITS & UNION DUES COMPENSATION &OTHR BENFITS COMPENSATION  EXEMPTION     INSURANCE     (JAN-DEC)     (JAN-NOV)  IN DECEMBER  TO EMPLOYEE  AS ADJUSTED'
                  ?'---- -------------- --------------------------------------------- ---------- ---------- ------------- ------------ ------------ ------------- ------------- ------------- ------------ ------------ ------------ ------------ ------------ -------------'
                  */
                  ?'                                                                                         <--- GROSS COMPENSATION INCOME------------------------------------------------------------------------------------------------------------>'
                  ?'                                                                                                       <---NON-TAXABLE-----------------------------------------------------> <---TAXABLE-------------------------------------------> <---EXEMPTION---->                                                         <---YEAR-END ADJUSTMENT--->'
                  ?'                                                                                                                                   SSS,GSIS,PHIC SALARIES      TOTAL                                     SALARIES      TOTAL                            PREM PAID ON  NET                                       AMOUNT        OVER'
                  ?'                                                                                         GROSS         13th MONTH                  & PAG-IBIG    & OTHER       NON-TAXABLE                 13th MONTH    & OTHER       TAXABLE                          HEALTH &/OR   TAXABLE                                   WITHHELD      WITHHELD      AMOUNT OF TAX'
                  ?'SEQ.               <--------------NAME OF EMPLOYEES--------------> EMPLOYMENT EMPLOYMENT COMPENSATION  PAY & OTHER   DE MINIMIS    CONTRIBTIONS  FORMS OF      EXEMPT                      PAY & OTHER   FORMS OF      COMPENSATION       AMOUNT OF     HOSPITAL      COMPENSATION  TAX DUE       TAX WITHHELD  AND PAID FOR  TAX REFUNDED  WITHHELD      SUBSTITUTED'
                  ?'NO.  TIN           LAST NAME       FIRST NAME      MIDDLE NAME     FROM       TO         INCOME        BENEFITS      BENEFITS      & UNION DUES  COMPENSATION  COMP. INCOME  BASIC SALARY  BENEFITS      COMPENSATION  INCOME        CODE EXEMPTION     INSURANCE     INCOME        (JAN-DEC)     (JAN-NOV)     IN DECEMBER   TO EMPLOYEE   AS ADJUSTED   FILING'
                  ?'(1)  (2)           (3a)            (3b)            (3c)                                  4(a)          4(b)          4(c)          4(d)          4(e)          4(f)          4(g)          4(h)          4(i)          4(j)          (5a) (5b)          (6)           (7)           (8)           (9)           10A=(8)-(9)   10b=(9)-(8)   11=(9)+(10a)  (12)'
                  ?'---- ------------- ------------------------------- --------------- ---------- ---------- ------------- ------------- ------------- ------------- ------------- ------------- ------------- ------------- ------------- ------------- ---- ------------- ------------- ------------- ------------- ------------- ------------- ------------- ------------- -----------'
                  m_crow:=12
               endif

         endcase

         adjust_ntx:=0
         adjust_grs:=0
         add_exmp:=0
         sap_exmp:=0

         //99,999,999.99 9,999,999.99 9,999,999.99 99,999,999.99 99,999,999.99 99,999,999.99 9,999,999.99 9,999,999.99 9,999,999.99 9,999,999.99 9,999,999.99 99,999,999.99

         m_crow++

         //(1) SEQ.NO
         ?tran(m_ctr,'9999')+s1

         //(2) TIN
         ??alltrim(tan)+space(13-len(alltrim(tan)))+s1

         //(3a) LAST NAME
         ??subs(emp_nm,1,15) + s1

         //(3b) FIRST NAME
         ??subs(emp_nm,16,15) + s1

         //(3c) MIDDLE NAME
         ??alltrim(mname)+space(15-len(alltrim(mname)))+s1

         if _m_select == 3 //Resigned Employees
            ??f_2hiredresign(emp_no)
         endif

         m_y_bonus := y_bonus + y_midbon
         m_y_btax  := y_btax  + y_midtax

         //4(a) GROSS COMPENSATION INCOME
         m_4a := y_gross + y_othergrs + m_y_bonus
         ??tran(m_4a,m_pict)+s1
         m_g_4a += m_4a

         if m_y_bonus > m_nontaxbon
            m_4b := m_nontaxbon
            m_4h := m_y_bonus - m_nontaxbon
         else
            m_4b := m_y_bonus
            m_4h := 0
         endif

         //Print NON-TAXABLE PAY

         //4(b) 13th MONTH PAY & OTHER BENEFITS
         ??tran(m_4b,m_pict)+s1
         m_g_4b += m_4b

         //4(c) DE MINIMIS BENEFITS
         m_4c := deminimis
         ??tran(m_4c,m_pict)+s1
         m_g_4c += m_4c

         //4(d) SSS,GSIS,PHIC & PAG-IBIG CONTRIBUTIONS & UNION DUES
         m_4d := y_sss + y_med + y_pbg
         ??tran(m_4d,m_pict) + s1
         m_g_4d += m_4d

         //Other Non-Taxable Pay
         //??tran(y_othp2+y_othp4+y_leave,m_pict)+s1
         //m_tsal += Y_OTHP1 + y_othp2 + y_othp4 + y_leave
         //Changes as per Tess Hernandez - 1/4/2002

         //4(e) SALARIES & OTHER FORMS OF COMPENSATION
         m_4e := Y_OTHP1 + y_othp2 + y_othp4
         ??tran(m_4e,m_pict) + s1
         m_g_4e += m_4e

         //4(f) TOTAL NON-TAXABLE EXEMPT COMP. INCOME
         m_4f := m_4b + m_4c + m_4d + m_4e
         ??tran(m_4f,m_pict)+s1
         m_g_4f += m_4f

         //Print TAXABLE PAY

         //4(g) TAXABLE BASIC SALARY
         //4c = deminimis, 4d = premiums, 4e = Y_OTHP1 + y_othp2 + y_othp4
         m_4i = y_othp3
         m_4g := y_gross-(m_4c+m_4d+m_4e+m_4i)+y_othergrs
         ??tran(m_4g,m_pict) + s1
         m_g_4g += m_4g

         //4(h) TAXABLE 13TH MONTH & OTHER BENEFITS
         ??tran(m_4h,m_pict) + s1
         m_g_4h += m_4h

         //4(i) TAXABLE SALARIES & OTHER FORMS OF COMPENSATION
         ??tran(m_4i,m_pict) + s1
         m_g_4i += m_4i

         //4(j) TOTAL TAXABLE COMPENSATION INCOME
         m_4j := m_4g + m_4h + m_4i
         ??tran(m_4j,m_pict)+s1
         m_g_4j += m_4j

         //5(a) EXEMPTION CODE

         m_status := STATUS

         if m_status = "ME0"
            m_status = "M"
         elseif m_status = "ME1"
            m_status = "M1"
         elseif m_status = "ME2"
            m_status = "M2"
         elseif m_status = "ME3"
            m_status = "M3"
         elseif m_status = "ME4"
            m_status = "M4"
         elseif m_status = "S0"
            m_status = "S"
         elseif m_status = "HF0"
            m_status = "S"
         elseif m_status = "HF1"
            m_status = "S1"
         elseif m_status = "HF2"
            m_status = "S2"
         elseif m_status = "HF3"
            m_status = "S3"
         elseif m_status = "HF4"
            m_status = "S4"
         endif

         m_5a := m_status

         //5a EXEMPTION CODE
         ??m_5a + space(4 - len(m_5a)) +s1

         //5b EXEMPTION AMOUNT
         m_5b = per_exmp + add_exmp + sap_exmp
         ??tran(m_5b,m_pict) + s1
         m_g_5b += m_5b

         //6 HEALTH PREMIUM
         m_6 := y_premium
         ??tran(m_6,m_pict) + s1
         m_g_6 += m_6

         //7 NET TAXABLE COMPENSATION INCOME
         m_7 := m_4j - m_5b - m_6
         if m_7 < 0
            m_7 := 0
         endif
         ??tran(m_7,m_pict) + s1
         m_g_7 += m_7

         //8 TAX DUE
         m_8 := tax_due
         ??tran(m_8,m_pict) + s1
         m_g_8 += m_8

         //9 TAX WITHHELD
         //Jan to Nov. Tax w/held = total tax w/held less dec tax w/held
         //m_novtax := (y_tax+y_ded10-m_ded10-m_tax) + y_othertax
         m_9 := y_tax + y_ded10 + y_othertax
         ??tran(m_9,m_pict) + s1
         m_g_9 += m_9

         //10a AMOUNT WITHHELD AND PAID FOR IN DECEMBER
         //10b OVER WITHHELD TAX REFUNDED TO EMPLOYEE

         if m_8 > m_9
            m_10a := m_8 - m_9
            m_10b := 0
         else
            m_10a := 0
            m_10b := m_9 - m_8
         endif

         ??tran(m_10a,m_pict) + s1
         m_g_10a += m_10a

         ??tran(m_10B,m_pict) + s1
         m_g_10b += m_10b

         //11 AMOUNT OF TAX WITHHELD AS ADJUSTED
         m_11 := m_9 + m_10a
         ??tran(m_11,m_pict) + s1
         m_g_11 += m_11

         ??"Y"

	      skip

	   end while

   else  //Not yet posted

	   while ! eof()

		   if status=='OJT'
            skip
            loop
         endif

         do case

            case _m_select == 1 //All Employees

       	      m_ctr ++
               if m_crow > 58
                  m_page++
                  if m_page > 1
                     ??chr(12)
                  endif
                  ?m_company+space(239-len(m_company))+'Page '+str(m_page,2)
                  ?'TIN : '+alltrim(m_comp_tin)
                  ?'ALPHALIST OF EMPLOYEES AS OF DECEMBER 31 WITH NO PREVIOUS EMPLOYER WITHIN THE YEAR ('+m_year+')'
                  ?
                  ?'                                                                  <--------G R O S S   C O M P E N S A T I O N   I N C O M E-------->'
                  ?'                                                                  <------------NON-TAXABLE--------------> <--------TAXABLE---------->                                                      <--YEAR-END ADJUSTMENT-->'
                  ?'                                                                                SSS,GSIS,PHIC                                                       PREM PAID ON                           AMOUNT       OVER'
                  ?'     TAXPAYER                                                                   & PAG-IBIG   SALRIES&OTHR               SALARIES&OTHR               HEALTH &/OR                            WITHHELD     WITHHELD     AMOUNT OF TAX'
                  ?'SEQ. IDENTIFICATION NAME OF EMPLOYEES                             13th MNTH PAY CONTRIBTIONS FORMS OF     13TH MNTH PAY FORMS OF      AMOUNT OF     HOSPITAL       TAX DUE    TAX WITHHELD AND PAID FOR TAX REFUNDED WITHHELD'
                  ?'NO.  NUMBER         LAST NAME      FIRST NAME     MIDDLE NAME     &OTHR BENFITS & UNION DUES COMPENSATION &OTHR BENFITS COMPENSATION  EXEMPTION     INSURANCE     (JAN-DEC)     (JAN-NOV)  IN DECEMBER  TO EMPLOYEE  AS ADJUSTED'
                  ?'---- -------------- --------------------------------------------- ------------- ------------ ------------ ------------- ------------- ------------- ------------ ------------ ------------ ------------ ------------ -------------'
                  //1234 123-456-789    12345678901234512345678901234512              99,999,999.99 9,999,999.99 9,999,999.99 99,999,999.99 99,999,999.99 99,999,999.99 9,999,999.99 9,999,999.99 9,999,999.99 9,999,999.99 9,999,999.99 99,999,999.99
                  m_crow:=11
               endif

            case _m_select == 2 //Active Employees
               if emp_type == 'R' //Resigned
                  skip
                  loop
               endif

       	      m_ctr ++
               if m_crow > 58
                  m_page++
                  if m_page > 1
                     ??chr(12)
                  endif
                  ?m_company+space(239-len(m_company))+'Page '+str(m_page,2)
                  ?'TIN : '+alltrim(m_comp_tin)
                  ?'ALPHALIST OF EMPLOYEES AS OF DECEMBER 31 WITH NO PREVIOUS EMPLOYER WITHIN THE YEAR ('+m_year+')'
                  ?
                  ?'                                                                  <--------G R O S S   C O M P E N S A T I O N   I N C O M E-------->'
                  ?'                                                                  <------------NON-TAXABLE--------------> <--------TAXABLE---------->                                                      <--YEAR-END ADJUSTMENT-->'
                  ?'                                                                                SSS,GSIS,PHIC                                                       PREM PAID ON                           AMOUNT       OVER'
                  ?'     TAXPAYER                                                                   & PAG-IBIG   SALRIES&OTHR               SALARIES&OTHR               HEALTH &/OR                            WITHHELD     WITHHELD     AMOUNT OF TAX'
                  ?'SEQ. IDENTIFICATION NAME OF EMPLOYEES                             13th MNTH PAY CONTRIBTIONS FORMS OF     13TH MNTH PAY FORMS OF      AMOUNT OF     HOSPITAL       TAX DUE    TAX WITHHELD AND PAID FOR TAX REFUNDED WITHHELD'
                  ?'NO.  NUMBER         LAST NAME      FIRST NAME     MIDDLE NAME     &OTHR BENFITS & UNION DUES COMPENSATION &OTHR BENFITS COMPENSATION  EXEMPTION     INSURANCE     (JAN-DEC)     (JAN-NOV)  IN DECEMBER  TO EMPLOYEE  AS ADJUSTED'
                  ?'---- -------------- --------------------------------------------- ------------- ------------ ------------ ------------- ------------- ------------- ------------ ------------ ------------ ------------ ------------ -------------'
                  //1234 123-456-789    12345678901234512345678901234512              99,999,999.99 9,999,999.99 9,999,999.99 99,999,999.99 99,999,999.99 99,999,999.99 9,999,999.99 9,999,999.99 9,999,999.99 9,999,999.99 9,999,999.99 99,999,999.99
                  m_crow:=11
               endif

            case _m_select == 3 //Resigned Employees
               if emp_type != 'R' //Resigned
                 skip
                 loop
               endif

	            m_ctr ++
               if m_crow > 58
                  m_page++
                  if m_page > 1
                     ??chr(12)
                  endif
                  ?m_company+space(239-len(m_company))+'Page '+str(m_page,2)
                  ?'TIN : '+alltrim(m_comp_tin)
                  ?'ALPHALIST OF EMPLOYEES TERMINATED BEFORE DECEMBER 31 ('+m_year+')'
                  ?
                  ?'                                                                                        <--------G R O S S   C O M P E N S A T I O N   I N C O M E-------->'
                  ?'                                                                                        <------------NON-TAXABLE--------------> <--------TAXABLE---------->                                                      <--YEAR-END ADJUSTMENT-->'
                  ?'                                                                                                      SSS,GSIS,PHIC                                                       PREM PAID ON                           AMOUNT       OVER'
                  ?'     TAXPAYER                                                                                         & PAG-IBIG   SALRIES&OTHR               SALARIES&OTHR               HEALTH &/OR                            WITHHELD     WITHHELD     AMOUNT OF TAX'
                  ?'SEQ. IDENTIFICATION NAME OF EMPLOYEES                             EMPLOYMENT EMPLOYMENT 13th MNTH PAY CONTRIBTIONS FORMS OF     13TH MNTH PAY FORMS OF      AMOUNT OF     HOSPITAL       TAX DUE    TAX WITHHELD AND PAID FOR TAX REFUNDED WITHHELD'
                  ?'NO.  NUMBER         LAST NAME      FIRST NAME     MIDDLE NAME     FROM       TO         &OTHR BENFITS & UNION DUES COMPENSATION &OTHR BENFITS COMPENSATION  EXEMPTION     INSURANCE     (JAN-DEC)     (JAN-NOV)  IN DECEMBER  TO EMPLOYEE  AS ADJUSTED'
                  ?'---- -------------- --------------------------------------------- ---------- ---------- ------------- ------------ ------------ ------------- ------------- ------------- ------------ ------------ ------------ ------------ ------------ -------------'
                  m_crow:=11
               endif
         endcase

         m_emp_no := emp_no
         m_y_gross:= y_gross
         m_y_bonus:= y_bonus+y_midbon
         m_y_sss  := y_sss
         m_y_med  := y_med
         m_y_pbg  := y_pbg
         m_y_othp1 :=y_othp1
         m_y_othp2 :=y_othp2
         m_y_othp4 :=y_othp4
         m_y_leave :=y_leave
         m_y_tax   :=y_tax
         m_y_btax  :=y_btax +y_midtax
         m_y_ded10 :=y_ded10
         m_cur_tax := 0
         m_cur_ded10:= 0

         select tmcard
         seek m_emp_no
         if (! eof()) .and. (trn_flag!='U')
            m_y_gross += grs_pay
            m_y_sss   += sss_ee
            m_y_med   += med_ee
            m_y_pbg   += pgbg_ee
            m_y_othp1 += oth_pay1
            m_y_othp2 += oth_pay2
            m_y_othp4 += oth_pay4
            m_y_leave += lv_pay
            m_y_tax   += tax_ee
            m_y_ded10 += oth_ded10
            m_cur_tax := tax_ee
            m_cur_ded10:= oth_ded10
            m_y_bonus += bonus
            m_y_btax  += bonustax
         endif

         select master

	   	if m_y_gross+m_y_bonus<=0
	   		skip
	   		loop
	   	endif

         //m_premiums:=y_sss+y_med+y_pbg+y_dues
         m_premiums:=m_y_sss+m_y_med+m_y_pbg

         adjust_ntx:=0
         adjust_grs:=0
         add_exmp:=0
         sap_exmp:=0

         //99,999,999.99 9,999,999.99 9,999,999.99 99,999,999.99 99,999,999.99 99,999,999.99 9,999,999.99 9,999,999.99 9,999,999.99 9,999,999.99 9,999,999.99 99,999,999.99

         m_crow++

         ?tran(m_ctr,'9999')+s1
         ??alltrim(tan)+space(15-len(alltrim(tan)))
         //??emp_nm+s1
         ??subs(emp_nm,1,30)+mname+s1

         if _m_select == 3 //Resigned Employees
            ??f_2hiredresign(emp_no)
         endif

         //Print NON-TAXABLE PAY

         ??tran(if(m_y_bonus>m_nontaxbon,m_nontaxbon,m_y_bonus),m_pict)
         m_t13th += if(m_y_bonus>m_nontaxbon,m_nontaxbon,m_y_bonus)

         ??tran(m_premiums,m_pict)
         m_tsss += m_premiums

         //Other Non-Taxable Pay
         //??tran(m_y_othp2+m_y_othp4+m_y_leave,m_pict)+s1
         //m_tsal += m_y_othp2+m_y_othp4+m_y_leave
         //1/4/2002 as per Tess
         ??tran(M_Y_OTHP1+m_y_othp2+m_y_othp4,m_pict)+s1
         m_tsal += M_Y_OTHP1+m_y_othp2+m_y_othp4

         //Print TAXABLE PAY

         ??tran(if(m_y_bonus>m_nontaxbon,m_y_bonus-m_nontaxbon,0),m_pict)+s1
         m_tnt13th += if(m_y_bonus>m_nontaxbon,m_y_bonus-m_nontaxbon,0)

         //??tran(m_y_gross-(m_y_othp2+m_y_othp4+m_y_leave+m_premiums),m_pict)
         //m_tntsal += m_y_gross-(m_y_othp2+m_y_othp4+m_y_leave+m_premiums)
         //as per Tess H.
         ??tran(m_y_gross-(M_Y_OTHP1+m_y_othp2+m_y_othp4+m_premiums),m_pict)
         m_tntsal += m_y_gross-(M_Y_OTHP1+m_y_othp2+m_y_othp4+m_premiums)

         ??s1+tran(per_exmp+add_exmp+sap_exmp,m_pict)
         m_texemp += per_exmp+add_exmp+sap_exmp

         ??tran(0,m_pict)  //Health or Hospital Insurance
         m_tprem += 0

         ??tran(tax_due,m_pict)
         m_taxdue  := tax_due
         m_ttaxdue += tax_due

         //Jan to Nov. Tax w/held = total tax w/held less posted dec tax w/held
         //less current payroll tax
         m_novtax := m_y_tax+m_y_ded10-(m_ded10+m_tax)-(m_cur_tax + m_cur_ded10)
         ??tran(m_novtax,m_pict)
         m_tjannov += m_novtax

         //Dec. Tax w/held = Dec. tax w/held + Bonus Tax + Current Tax
         m_dectax := (m_ded10+m_tax+m_y_btax)+(m_cur_tax+m_cur_ded10)

         if m_dectax + m_novtax < m_taxdue
            m_addl_tax := m_taxdue - m_dectax - m_novtax
            m_tax_refund := 0
         else
            m_addl_tax := 0
            m_tax_refund := m_dectax + m_novtax - m_taxdue
         endif

         ??tran(m_dectax + m_addl_tax, m_pict)
         m_tdectax += m_dectax + m_addl_tax

         ??tran(m_tax_refund,m_pict)
         m_tref += m_tax_refund

         ??' '+tran(m_taxdue,m_pict)
         m_tadjstd += m_taxdue

	      skip

	   end while

   endif

   if m_ctr > 0
      if _m_select==3
         ?space(89)+"------------- ------------- ------------- ------------- ------------- ------------- ------------- ------------- ------------- -------------      ------------- ------------- ------------- ------------- ------------- ------------- ------------- -------------"
         ?space(76)+'GRAND TOTAL: '
      else
         //?space(67)+'------------- ------------ ------------ ------------- ------------- ------------- ------------ ------------ ------------ ------------ ------------ -------------'
         ?space(67)+"------------- ------------- ------------- ------------- ------------- ------------- ------------- ------------- ------------- -------------      ------------- ------------- ------------- ------------- ------------- ------------- ------------- -------------"
         ?space(54)+'GRAND TOTAL: '
      endif

      ??tran(m_g_4a,m_pict) + s1
      ??tran(m_g_4b,m_pict) + s1
      ??tran(m_g_4c,m_pict) + s1
      ??tran(m_g_4d,m_pict) + s1
      ??tran(m_g_4e,m_pict) + s1
      ??tran(m_g_4f,m_pict) + s1
      ??tran(m_g_4g,m_pict) + s1
      ??tran(m_g_4h,m_pict) + s1
      ??tran(m_g_4i,m_pict) + s1
      ??tran(m_g_4j,m_pict) + space(6)
      ??tran(m_g_5b,m_pict) + s1
      ??tran(m_g_6,m_pict) + s1
      ??tran(m_g_7,m_pict) + s1
      ??tran(m_g_8,m_pict) + s1
      ??tran(m_g_9,m_pict) + s1
      ??tran(m_g_10a,m_pict) + s1
      ??tran(m_g_10b,m_pict) + s1
      ??tran(m_g_11,m_pict)
      ?chr(12)
   else
      ?'No records to print'
      ??chr(12)

	endif
   exit

end while
select(_m_oldarea)
return nil

/*
function f_comptaxdue(_m_txble_income)
local _m_oldarea:=select(),_m_return:=0
select taxdue
dbgotop()
if eof()
   f_err('Taxdue Database File has no record!',.t.)
else
   while ! eof()
      if _m_txble_income > greaterdan .and. _m_txble_income <= lesorequal
         _m_return:= base_tax + ((_m_txble_income - in_xces_of) * percnt_tax)
         exit
      endif
      skip
   end while
endif
select(_m_oldarea)
return(_m_return)
*/


function f_comptaxdue(cAmount)
local cYTaxDue := 0
cYTaxDue = 0
If cAmount < 250000
    cYTaxDue = 0
ElseIf cAmount < 400000
    cYTaxDue = Round((cAmount - 250000) * 0.2, 2)
ElseIf cAmount < 800000
    cYTaxDue = Round(30000 + (cAmount - 400000) * 0.25, 2)
ElseIf cAmount < 2000000
    cYTaxDue = Round(130000 + (cAmount - 800000) * 0.3, 2)
ElseIf cAmount < 8000000
    cYTaxDue = Round(490000 + (cAmount - 2000000) * 0.32, 2)
Else
    cYTaxDue = Round(2410000 + (cAmount - 8000000) * 0.35, 2)
End If
return(cYTaxDue)


function f_2hiredresign(_m_emp_no)
local _m_oldarea:=select(), _m_return:=''
select history
seek _m_emp_no
if ! eof()
   if dtos(date_emp) != space(8)
      _m_return := subs(dtoc(date_emp),1,6)+str(year(date_emp),4)+' '
   else
      _m_return := '  /  /     '
   endif
   if dtos(date_sep) != space(8)
      _m_return += subs(dtoc(date_sep),1,6)+str(year(date_sep),4)+' '
   else
      _m_return += '  /  /     '
   endif
else
   _m_return := '                      '
endif
select (_m_oldarea)
return(_m_return)
