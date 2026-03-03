* Tax Reconciliation Report
* Rptaxsht.prg

do while .t.
	m_resigned=.f.
	if f_choose(' SELECT : ', ' ALL EMPLOYEES ',' RESIGNED EMPLOYEES ')
		m_resigned=.f.
	else
		m_resigned=.t.
	endif

   m_oldcol  := setcolor()
   m_qtrscrn := savescreen(12,18,15,61)
   setcolor(m_cnor)
   while .t.
      f_bcln()
      m_spool := .t.

      f_setting()

      select 7
      if !net_use("&dpath\history",.t.,5)
         exit
      endif
      set index to &dpath\hbyemp
      reindex

      select 6
      if !net_use("&opath\exmp2007",.t.,5)
         exit
      endif
      index on status to &opath\exmp2007
      set index to &opath\exmp2007


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

      select sys_id
      m_year = str(year(beg_date),4)

      if trn_upd==trn_prc
         m_posted:=.t.
      else
         m_posted:=.f.
         if f_choose('Select Format:','TAX RECONCILIATION REPORT','ALPHALIST')
            m_reconformat := .t.
         else
            m_reconformat := .f.
         endif
      endif

      m_beg_date := beg_date
      if month(beg_date) > month(end_date)
         m_month:=cmon(beg_date)
      else
         m_month:=cmon(end_date)
      endif

      select master

   	if f_choose('Print Report:','BY EMP#','BY EMP. NAME')
   		set index to &dpath\mbyemp
         reindex
         dbgotop()
   		m_by_emp_no:=.t.

   	else
   		select master
   		set index to &dpath\mbynm
   		reindex
   		dbgotop()
   		m_by_emp_no:=.f.

   	endif
   	if f_esc()
   		exit
   	endif

      f_drawbox(12,18,14,59,1,3)
      @13,21 say "Print Alpha List For The Year :"
      @13,53 get m_year picture "9999" valid m_year>=str(year(m_beg_date-1),4)
      read

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
      f_taxsht()

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

   exit

end while
restscreen(12,18,15,61,m_qtrscrn)
dbcloseall()
setcolor(m_oldcol)
return nil



function f_taxsht()
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
   m_tjandec:=m_tjannov:=m_tdectax:=m_tref:=m_tadjstd:=m_taddl:=0
   m_tgrstax :=0
   m_tgrsntax:=0

   if m_posted

	   while ! eof()

	   	if y_gross+y_othergrs+y_bonus<=0
	   		skip
	   		loop
	   	endif

   		if m_resigned
	   		if val(dep_no)!=5
		   		skip
			   	loop
   			endif
	   	endif

	      m_ctr ++
         if m_crow > 58
            m_page++
            if m_page > 1
               ??chr(12)
            endif
            ?m_company+space(234-len(m_company))+'Page '+str(m_page,2)
            ?'TIN : '+alltrim(m_comp_tin)
            ?'YEAR-END TAX RECONCILIATION REPORT'
            ?'From JANUARY to '+m_month+', '+m_year
            ?
            ?'                                                                  <--------G R O S S   C O M P E N S A T I O N   I N C O M E---------------------->'
            ?'                                                                  <------------NON-TAXABLE--------------> <-------------TAXABLE INCOME------------>'
            ?'                                                                                SSS,GSIS,PHIC'
            ?'     TAXPAYER                                                                   & PAG-IBIG   SALRIES&OTHR               SALARIES&OTHR TTL TAXABLE   GROSS                       (NET) TAXABLE'
            ?'SEQ. IDENTIFICATION NAME OF EMPLOYEES                             13th MNTH PAY CONTRIBTIONS FORMS OF     13TH MNTH PAY FORMS OF      COMPENSATION  COMPENSATION  AMOUNT OF     COMPENSATION    TOTAL        TOTAL TAX'
            ?'NO.  NUMBER         LAST NAME      FIRST NAME     MIDDLE NAME     &OTHR BENFITS & UNION DUES COMPENSATION &OTHR BENFITS COMPENSATION  INCOME        INCOME        EXEMPTION     INCOME          TAX DUE      WITHHELD   TAX REFUND   ADDL TAX'
            ?'---- -------------- --------------------------------------------- ------------- ------------ ------------ ------------- ------------- ------------- ------------- ------------- ------------- ------------ ------------ ------------ ------------'
            //1234 123-456-789    12345678901234512345678901234512              99,999,999.99 9,999,999.99 9,999,999.99 99,999,999.99 99,999,999.99 99,999,999.99 99,999,999.99 99,999,999.99 99,999,999.99 9,999,999.99 9,999,999.99 9,999,999.99 9,999,999.99
            m_crow:=11
         endif

         //m_premiums:=y_sss+y_med+y_pbg+y_dues
         m_premiums:=y_sss+y_med+y_pbg

         adjust_ntx:=0
         adjust_grs:=0
         add_exmp:=0
         sap_exmp:=0

         //99,999,999.99 9,999,999.99 9,999,999.99 99,999,999.99 99,999,999.99 99,999,999.99 9,999,999.99 9,999,999.99 9,999,999.99 9,999,999.99 9,999,999.99 99,999,999.99

         m_crow++

         m_y_bonus := y_bonus + y_midbon
         m_y_btax  := y_btax  + y_midtax

         ?tran(m_ctr,'9999')+s1
         ??alltrim(tan)+space(15-len(alltrim(tan)))
         //??emp_nm+s1
         ??subs(emp_nm,1,30)+mname+s1

         m_grs_taxble_income:=0
         m_grs_nontaxble_income:=0

         //Print NON-TAXABLE PAY

         ??tran(if(m_y_bonus>m_nontaxbon,m_nontaxbon,m_y_bonus),m_pict)
         m_t13th += if(m_y_bonus>m_nontaxbon,m_nontaxbon,m_y_bonus)

         m_grs_nontaxble_income += if(m_y_bonus>m_nontaxbon,m_nontaxbon,m_y_bonus)

         //Premiums
         ??tran(m_premiums,m_pict)
         m_tsss += m_premiums

         m_grs_nontaxble_income += m_premiums

         //Other Non-Taxable Pay
         //??tran(y_othp2+y_othp4+y_leave+y_premium,m_pict)+s1
         ??tran(Y_OTHP1+y_othp2+y_othp4+y_leave+y_premium,m_pict)+s1
         //m_tsal += y_othp2 + y_othp4 + y_leave + y_premium
         m_tsal += Y_OTHP1 + y_othp2 + y_othp4 + y_leave + y_premium

         //m_grs_nontaxble_income += y_othp2 + y_othp4 + y_leave + y_premium
         m_grs_nontaxble_income += Y_OTHP1 + y_othp2 + y_othp4 + y_leave + y_premium

         m_tgrsntax += m_grs_nontaxble_income

         //Print TAXABLE PAY
         ??tran(if(m_y_bonus>m_nontaxbon,m_y_bonus-m_nontaxbon,0),m_pict)+s1
         m_tnt13th += if(m_y_bonus>m_nontaxbon,m_y_bonus-m_nontaxbon,0)

         m_grs_taxble_income += if(m_y_bonus>m_nontaxbon,m_y_bonus-m_nontaxbon,0)

         //??tran(y_gross+y_othergrs-y_othp2-y_othp4-y_leave-m_premiums,m_pict)
         ??tran(y_gross+y_othergrs-Y_OTHP1-y_othp2-y_othp4-y_leave-m_premiums,m_pict)
         //m_tntsal += y_gross+y_othergrs - (y_othp2+y_othp4+y_leave+m_premiums)
         m_tntsal += y_gross+y_othergrs - (Y_OTHP1+y_othp2+y_othp4+y_leave+m_premiums)

         //m_grs_taxble_income += y_gross+y_othergrs- (y_othp2+y_othp4+y_leave+m_premiums)
         m_grs_taxble_income += y_gross+y_othergrs- (Y_OTHP1+y_othp2+y_othp4+y_leave+m_premiums)

         ??tran(m_grs_taxble_income,'9'+m_pict)

         m_tgrstax += m_grs_taxble_income

         ??tran(m_grs_taxble_income+m_grs_nontaxble_income,'9'+m_pict)

         ??tran(per_exmp+add_exmp+sap_exmp,'9'+m_pict)
         m_texemp += per_exmp+add_exmp+sap_exmp

         //Taxable Compensation Income?space(66)+
         if m_grs_taxble_income > per_exmp+add_exmp+sap_exmp
            ??tran(m_grs_taxble_income-(per_exmp+add_exmp+sap_exmp),'9'+m_pict)
         else  //Zero
            ??tran(0,'9'+m_pict)  //Taxable Compensation Income
         endif

         m_tprem += 0

         ??tran(tax_due,m_pict)
         m_taxdue  := tax_due
         m_ttaxdue += tax_due

         //Total Tax w/held
         m_novtax := (y_tax+y_ded10+m_y_btax+y_othertax)
         ??tran(m_novtax,m_pict)
         m_tjannov += m_novtax

         if m_novtax < m_taxdue
            m_addl_tax := m_taxdue - m_novtax
            m_tax_refund := 0
         else
            m_addl_tax := 0
            m_tax_refund := m_novtax - m_taxdue
         endif

         ??tran(m_tax_refund, m_pict)
         m_tref += m_tax_refund

         ??tran(m_addl_tax,m_pict)
         m_taddl+= m_addl_tax

	      skip

	   end while

   else  //Not yet posted

      if ! m_reconformat

         //ALPHALIST FORMAT

	      while ! eof()

            m_emp_no := emp_no
            m_y_gross:= y_gross+y_othergrs
            m_y_bonus:= y_bonus+y_midbon
            m_y_sss  := y_sss
            m_y_med  := y_med
            m_y_pbg  := y_pbg
            m_y_othp1 :=y_othp1
            m_y_othp2 :=y_othp2
            m_y_othp4 :=y_othp4
            m_y_leave :=y_leave
            m_y_tax   :=y_tax
            m_y_btax  :=y_btax+y_midtax
            m_y_ded10 :=y_ded10+y_othertax

            select tmcard
            seek m_emp_no
            if (! eof()) .and. (trn_flag!='U')
               m_y_gross += grs_pay
               m_y_bonus += bonus
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
               m_y_btax  += bonustax

            endif

            select master

	      	if m_y_gross+m_y_bonus<=0
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

            //Print NON-TAXABLE PAY

            ??tran(if(m_y_bonus>m_nontaxbon,m_nontaxbon,m_y_bonus),m_pict)
            m_t13th += if(m_y_bonus>m_nontaxbon,m_nontaxbon,m_y_bonus)

            ??tran(m_premiums,m_pict)
            m_tsss += m_premiums

            //Other Non-Taxable Pay
            //??tran(m_y_othp2+m_y_othp4+m_y_leave,m_pict)+s1
            ??tran(M_Y_OTHP1+m_y_othp2+m_y_othp4+m_y_leave,m_pict)+s1
            //m_tsal += m_y_othp2+m_y_othp4+m_y_leave
            m_tsal += M_Y_OTHP1+m_y_othp2+m_y_othp4+m_y_leave

            //Print TAXABLE PAY

            ??tran(if(m_y_bonus>m_nontaxbon,m_y_bonus-m_nontaxbon,0),m_pict)+s1
            m_tnt13th += if(m_y_bonus>m_nontaxbon,m_y_bonus-m_nontaxbon,0)

            //??tran(m_y_gross-(m_y_othp2+m_y_othp4+m_y_leave+m_premiums),m_pict)
            ??tran(m_y_gross-(M_Y_OTHP1+m_y_othp2+m_y_othp4+m_y_leave+m_premiums),m_pict)
            //m_tntsal += m_y_gross-(m_y_othp2+m_y_othp4+m_y_leave+m_premiums)
            m_tntsal += m_y_gross-(M_Y_OTHP1+m_y_othp2+m_y_othp4+m_y_leave+m_premiums)

            ??s1+tran(per_exmp+add_exmp+sap_exmp,m_pict)
            m_texemp += per_exmp+add_exmp+sap_exmp

            ??tran(y_premium,m_pict)  //Health or Hospital Insurance
            m_tprem += y_premium

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
               m_tax_refund := m_taxdue - m_dectax - m_novtax
            endif

            ??tran(m_dectax + m_addl_tax, m_pict)
            m_tdectax += m_dectax + m_addl_tax

            ??tran(m_tax_refund*(-1),m_pict)
            m_tref += m_tax_refund

            ??' '+tran(m_taxdue,m_pict)
            m_tadjstd += m_taxdue

	         skip

	      end while

      else

         //Tax Recon Format
         //NOT YET POSTED

	      while ! eof()

            m_emp_no := emp_no
            m_y_gross:= y_gross + y_othergrs
            m_y_bonus:= y_bonus+y_midbon
            m_y_sss  := y_sss
            m_y_med  := y_med
            m_y_pbg  := y_pbg
            m_y_othp1 :=y_othp1
            m_y_othp2 :=y_othp2
            m_y_othp4 :=y_othp4+y_premium
            m_y_leave :=y_leave
            m_y_tax   :=y_tax
            m_y_btax  :=y_btax+y_midtax
            m_y_ded10 :=y_ded10+y_othertax

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

   		   if m_resigned
	   		   if val(dep_no)!=5
		   		   skip
			   	   loop
   			   endif
	      	endif

   	      m_ctr ++
            if m_crow > 58
               m_page++
               if m_page > 1
                  ??chr(12)
               endif
               ?m_company+space(234-len(m_company))+'Page '+str(m_page,2)
               ?'TIN : '+alltrim(m_comp_tin)
               ?'YEAR-END TAX RECONCILIATION REPORT'
               ?'From JANUARY to '+m_month+', '+m_year
               ?
               ?'                                                                  <--------G R O S S   C O M P E N S A T I O N   I N C O M E---------------------->'
               ?'                                                                  <------------NON-TAXABLE--------------> <-------------TAXABLE INCOME------------>'
               ?'                                                                                SSS,GSIS,PHIC'
               ?'     TAXPAYER                                                                   & PAG-IBIG   SALRIES&OTHR               SALARIES&OTHR TTL TAXABLE   GROSS                       (NET) TAXABLE'
               ?'SEQ. IDENTIFICATION NAME OF EMPLOYEES                             13th MNTH PAY CONTRIBTIONS FORMS OF     13TH MNTH PAY FORMS OF      COMPENSATION  COMPENSATION  AMOUNT OF     COMPENSATION    TOTAL        TOTAL TAX'
               ?'NO.  NUMBER         LAST NAME      FIRST NAME     MIDDLE NAME     &OTHR BENFITS & UNION DUES COMPENSATION &OTHR BENFITS COMPENSATION  INCOME        INCOME        EXEMPTION     INCOME          TAX DUE      WITHHELD   TAX REFUND   ADDL TAX'
               ?'---- -------------- --------------------------------------------- ------------- ------------ ------------ ------------- ------------- ------------- ------------- ------------- ------------- ------------ ------------ ------------ ------------'
               //1234 123-456-789    12345678901234512345678901234512              99,999,999.99 9,999,999.99 9,999,999.99 99,999,999.99 99,999,999.99 99,999,999.99 99,999,999.99 99,999,999.99 99,999,999.99 9,999,999.99 9,999,999.99 9,999,999.99 9,999,999.99
               m_crow:=11
            endif

            //m_premiums:=y_sss+y_med+y_pbg+y_dues
            m_premiums:=m_y_sss+m_y_med+m_y_pbg

            adjust_ntx:=0
            adjust_grs:=0
            add_exmp:=0
            sap_exmp:=0

            m_crow++

            ?tran(m_ctr,'9999')+s1
            ??alltrim(tan)+space(15-len(alltrim(tan)))
            ??subs(emp_nm,1,30)+mname+s1

            m_grs_taxble_income:=0
            m_grs_nontaxble_income:=0

            //Print NON-TAXABLE PAY

            ??tran(if(m_y_bonus>m_nontaxbon,m_nontaxbon,m_y_bonus),m_pict)
            m_t13th += if(m_y_bonus>m_nontaxbon,m_nontaxbon,m_y_bonus)

            m_grs_nontaxble_income += if(y_bonus>m_nontaxbon,m_nontaxbon,m_y_bonus)

            //Premiums
            ??tran(m_premiums,m_pict)
            m_tsss += m_premiums

            m_grs_nontaxble_income += m_premiums

            //Other Non-Taxable Pay
            //??tran(m_y_othp2+m_y_othp4+m_y_leave,m_pict)+s1
            ??tran(M_Y_OTHP1+m_y_othp2+m_y_othp4+m_y_leave,m_pict)+s1
            //m_tsal += m_y_othp2 + m_y_othp4 + m_y_leave
            m_tsal += M_Y_OTHP1 + m_y_othp2 + m_y_othp4 + m_y_leave
            //m_y_othp4 already includes y_premium

            //m_grs_nontaxble_income += m_y_othp2 + m_y_othp4 + m_y_leave
            m_grs_nontaxble_income += M_Y_OTHP1 + m_y_othp2 + m_y_othp4 + m_y_leave

            m_tgrsntax += m_grs_nontaxble_income

            //Print TAXABLE PAY
            ??tran(if(m_y_bonus>m_nontaxbon,m_y_bonus-m_nontaxbon,0),m_pict)+s1
            m_tnt13th += if(m_y_bonus>m_nontaxbon,m_y_bonus-m_nontaxbon,0)

            m_grs_taxble_income += if(m_y_bonus>m_nontaxbon,m_y_bonus-m_nontaxbon,0)

            //??tran(m_y_gross-m_y_othp2-m_y_othp4-m_y_leave-m_premiums,m_pict)
            ??tran(m_y_gross-M_Y_OTHP1-m_y_othp2-m_y_othp4-m_y_leave-m_premiums,m_pict)
            //m_tntsal += m_y_gross- (m_y_othp2+m_y_othp4+m_y_leave+m_premiums)
            m_tntsal += m_y_gross- (M_Y_OTHP1+m_y_othp2+m_y_othp4+m_y_leave+m_premiums)
            //m_y_gross already includes y_othergrs

            //m_grs_taxble_income += m_y_gross- (m_y_othp2+m_y_othp4+m_y_leave+m_premiums)
            m_grs_taxble_income += m_y_gross- (M_Y_OTHP1+m_y_othp2+m_y_othp4+m_y_leave+m_premiums)

            ??tran(m_grs_taxble_income,'9'+m_pict)

            m_tgrstax += m_grs_taxble_income

            ??tran(m_grs_taxble_income+m_grs_nontaxble_income,'9'+m_pict)

            ??tran(per_exmp+add_exmp+sap_exmp,'9'+m_pict)
            m_texemp += per_exmp+add_exmp+sap_exmp

            //Taxable Compensation Income?space(66)+
            if m_grs_taxble_income > per_exmp+add_exmp+sap_exmp
               ??tran(m_grs_taxble_income-(per_exmp+add_exmp+sap_exmp),'9'+m_pict)
            else  //Zero
               ??tran(0,'9'+m_pict)  //Taxable Compensation Income
            endif

            m_tprem += 0

            ??tran(tax_due,m_pict)
            m_taxdue  := tax_due
            m_ttaxdue += tax_due

            //Total Tax w/held
            m_novtax := (m_y_tax+m_y_ded10+m_y_btax)
            //m_y_ded10 already includes y_othertax

            ??tran(m_novtax,m_pict)
            m_tjannov += m_novtax

            if m_novtax < m_taxdue
               m_addl_tax := m_taxdue - m_novtax
               m_tax_refund := 0
            else
               m_addl_tax := 0
               m_tax_refund := m_novtax - m_taxdue
            endif

            ??tran(m_tax_refund, m_pict)
            m_tref += m_tax_refund

            ??tran(m_addl_tax,m_pict)
            m_taddl+= m_addl_tax

	         skip

   	   end while

      endif

   endif

   if m_ctr > 0
      ?space(66)+'------------- ------------ ------------ ------------- ------------- ------------- ------------- ------------- ------------- ------------ ------------ ------------ ------------'
      ?space(53)+'GRAND TOTAL: '
      ??tran(m_t13th,m_pict)
      ??tran(m_tsss,m_pict)
      ??tran(m_tsal,m_pict)
      ??s1
      ??tran(m_tnt13th,m_pict)+S1
      ??tran(m_tntsal,m_pict)
      ??tran(m_tnt13th+m_tntsal,'9'+m_pict)
      ??tran(m_tgrsntax+m_tgrstax,'9'+m_pict)
      ??s1
      ??tran(m_texemp,m_pict)
      ??tran(m_tgrstax-m_texemp,'9'+m_pict)
      ??tran(m_ttaxdue,m_pict)
      ??tran(m_tjannov,m_pict)
      ??tran(m_tref,m_pict)
      ??tran(m_taddl,m_pict)
      ?chr(12)
   else
      ?'No records to print'
      ??chr(12)

	endif
   exit

end while
select(_m_oldarea)
return nil


proc p_txshthd
m_page=m_page+1
if m_page>1
	?chr(12)
endif
?alltrim(m_company)
*?'YEAR-END TAX RECONCILIATION WORKSHEET'
?'ALPHA-LIST OF INCOME TAX WITHHELD FOR THE YEAR '+m_year
?'From JANUARY to '+m_month+', '+m_year
?'TIN NO.: '+m_comp_tin
?
?ltrim(m_head)+space(171-len(alltrim(m_head)))+'Page '+str(m_page,2)
?repl('=',178)
*?"                                                            !------------GROSS  EARNINGS----------------!---------------------------EXEMPTIONS------------------------------!    TAX DUE    !----------------TAX WITHHELD---------------!   TAX REFUND/"
*?"EMP#            N A M E                 T.I.N.      STATUS  !   TAXABLE      NON-TAXABLE      TOTAL     !  PERSONAL    ADDITIONAL     SPECIAL    BONUS-RA7833     TOTAL     !    THEREON    !    INCOME            BONUS       TOTAL    !       (ADD'L)"
* 123456 12345678901234567890123456789012 12345678901  123      99,999,999.99 99,999,999.99 99,999,999.99   9,999,999.99 9,999,999.99 9,999,999.99 9,999,999.99 99,999,999.99   99,999,999.99   99,999,999.99 99,999,999.99 99,999,999.99   99,999,999.99
*?"                                                            !------------GROSS  EARNINGS----------------!---------------------------EXEMPTIONS------------------------------!    TAX DUE    !----------------TAX WITHHELD---------------!   TAX REFUND/"
*?repl('=',247)
?"                                                            ! TAXABLE        !--------------------EXEMPTIONS----------------------!    TAX DUE    !                !   TAX REFUND/"
?"EMP#            N A M E                 T.I.N.      STATUS  ! GROSS EARNINGS !  PERSONAL    ADDITIONAL     SPECIAL        TOTAL   !    THEREON    !  TAX WITHHELD  !       (ADD'L)"
*123456 12345678901234567890123456789012 12345678901  123      99,999,999.99   9,999,999.99 9,999,999.99 9,999,999.99 99,999,999.99    99,999,999.99    99,999,999.99   99,999,999.99
?repl('=',178)
m_crow=10
return

proc rptaxref
do while .t.
	select 1
  	if .not. net_use('&dpath\sys_id',.f.,5)
		exit
	endi
	m_month = upper(cmonth(ctod(subs(str(100+pres_mo,3),2,2)+'/01/99')))
	m_year=str(year(beg_date),4)
  	if .not. net_use('&dpath\master',.f.,5)
		exit
	endi
	set index to &dpath\mbyemp
	m_oldcol=setcolor()
	set color to (m_cnor)
	m_taxscrn=savescreen(18,22,20,56)
	f_drawbox(18,22,20,55,1,3)
	@19,25 say 'TAX REFUND FOR THE YEAR' get m_year pict '9999' vali m_year>'1993'
	read
	set color to (m_oldcol)
	restscreen(18,22,20,56,m_taxscrn)
	release m_taxscrn
	if lastkey()=27
		exit
	endif
	set color to (m_cmes)
	if f_choose('Print Report:','WITH ACCT.NO.','WITHOUT ACCT.NO.')
		m_withacct=.t.
	else
		m_withacct=.f.
	endif
	if lastkey()=27
		exit
	endif
	m_spool=.t.
   if .not. f_askspool()
		m_spool=.f.
		if lastkey()=27
			exit
		endi
		set print on
		set devi to print
		set cons off
   endi
	m_page=0
	m_crow=60
	m_dep_no=space(2)
	m_ctr=0
	m_p='99,999,999.99'
	m_g_tax_ref=0
	do while .not. eof()
		if m_crow>58
			do p_txrefhd
		endif
		if tax_ref<=0
			skip
			loop
		endif
		m_emp_nm = alltrim(emp_nm)
		m_lspac=int((32-len(m_emp_nm))/2)
		m_emp_nm1 =m_emp_nm+space(32-len(m_emp_nm))
		m_emp_no=alltrim(emp_no)+space(6-len(alltrim(emp_no)))
		if m_withacct
			?m_emp_no+' '+m_emp_nm1+'  '+acct_no+'  '+tran(tax_ref,m_p)
		else
			?m_emp_no+' '+m_emp_nm1+'    '+tran(tax_ref,m_p)
		endif
		m_g_tax_ref=m_g_tax_ref+tax_ref
		m_crow = m_crow + 1
		m_ctr=m_ctr+1
		skip
	enddo
	if m_ctr>0
		if m_crow+3>58
			do p_txrefhd
		endif
		if m_withacct
			?repl('=',68)
			?space(37)+"TOTAL TAX REFUND: "+tran(m_g_tax_ref,m_p)
			?repl('=',68)
		else
			?repl('=',56)
			?space(24)+"TOTAL TAX REFUND: "+tran(m_g_tax_ref,m_p)
			?repl('=',56)
		endif
	endif
	?
	?'Total Number of Employees :'+str(m_ctr,7)
	?chr(12)
	if m_spool
	   set alte off
   	set alte to
	else
	   set print off
   	set devi to scre
	endi
	set cons on
	exit
enddo
close all
return

proc p_txrefhd
m_page=m_page+1
if m_page>1
	?chr(12)
endif
?alltrim(m_company)
?'List of Employees with TAX REFUND for the Year '+m_year
?
if m_withacct
	?ltrim(m_head)+space(61-len(alltrim(m_head)))+'Page '+str(m_page,2)
	?repl('=',68)
  	?'EMP#   EMPLOYEE NAME                     ACCT.NO.         TAX REFUND'
	* 123456 12345678901234567890123456789012  123456789012  99,999,999.99
	?repl('=',68)
else
	?ltrim(m_head)+space(49-len(alltrim(m_head)))+'Page '+str(m_page,2)
	?repl('=',56)
  	?'EMP#   EMPLOYEE NAME                          TAX REFUND'
	* 123456 12345678901234567890123456789012    99,999,999.99
	?repl('=',56)
endif
m_crow=9
return

* TAX REFUND DENOMINATION BREAKDOWN

proc rptaxden
do while .t.
	select 1
  	if .not. net_use('&dpath\master',.f.,5)
		exit
	endi
	m_oldcol=setcolor()
	set color to (m_cnor)
	m_taxscrn=savescreen(18,22,20,56)
	f_drawbox(18,22,20,55,1,3)
	m_year = ltrim(str(year(date())-1,4))
	@19,25 say 'TAX REFUND FOR THE YEAR' get m_year pict '9999' vali m_year>'1993'
	read
	set color to (m_oldcol)
	restscreen(18,22,20,56,m_taxscrn)
	release m_taxscrn
	if lastkey()=27
		exit
	endif
	set color to (m_cmes)
	if f_ask('Denomination with P500.00 bill ?')
		m_with500=.t.
	else
		m_with500=.f.
	endif
	m_spool=.t.
   if .not. f_askspool()
		m_spool=.f.
		if lastkey()=27
			exit
		endi
		set print on
		set device to print
		set console off
   endi
	store 0 to bb,b1,b2,b3,b4,b5,b6,b7,b8,b9,b10,b11,b12
	go top
	do while .not. eof()
		if tax_ref > 0
      	store 0 to a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,aa,cc
	 		store 0 to c1,c2,c3,c4,c5,c6,c7,c8,c8,c10,c11,c12
			m_amt = (tax_ref)*100 + .005
			if m_with500
				aa = int(m_amt/50000)
	  	      bb = bb + aa
	     	   cc = m_amt-(aa*50000)
	         a1 = int(cc/10000)
	  	      b1 = b1 + a1
	     	   c1 = cc-(a1*10000)
			else
	         a1 = int(m_amt/10000)
	  	      b1 = b1 + a1
	     	   c1 = m_amt-(a1*10000)
			endi
	      a2 = int(c1/5000)
			b2 = b2 + a2
	      c2 = c1 - (a2*5000)
	      a3 = int(c2/2000)
	      b3 = b3 + a3
	      c3 = c2 - (a3*2000)
	      a4 = int(c3/1000)
	      b4 = b4 + a4
	      c4 = c3 - (a4*1000)
	      a5 = int(c4/500)
	      b5 = b5 + a5
	      c5 = c4 - (a5*500)
	      a6 = int(c5/200)
	      b6 = b6 + a6
	      c6 = c5 - (a6*200)
   	   a7 = int(c6/100)
	      b7 = b7 + a7
	      c7 = c6 - (a7*100)
	      a8 = int(c7/50)
	      b8 = b8 + a8
	      c8 = c7 - (a8*50)
	      a9 = int(c8/25)
	      b9 = b9 + a9
	      c9 = c8 - (a9*25)
	      a10= int(c9/10)
	      b10= b10 + a10
	      c10= c9 - (a10*10)
	      a11= int(c10/5)
	      b11= b11 + a11
	      c11= c10 - (a11*5)
	      a12= int(c11)
	      b12= b12 + a12
	   endif
	   skip
	endd
	use
	xa = '999,999'
	xb = '999,999,999.99'
	m_total=bb*500+b1*100+b2*50+b3*20+b4*10+b5*5+b6*2+b7*1+b8*0.50+b9*0.25;
	+b10*0.10+b11*0.05+b12*0.01
	?
	?ltrim(m_company)
	?'TAX REFUND Denomination Breakdown'
	?'For the Year '+m_year
	?
	?m_head
	?repl('=',67)
	?' DENOMINATION               NO. OF PCS.                     AMOUNT'
	?repl('=',67)
	if bb>0
		?'   P500.00'+space(19)+tran(bb,xa)+space(16)+tran(bb*500,xb)
	endif
	if b1>0
		?'    100.00'+space(19)+tran(b1,xa)+space(16)+tran(b1*100,xb)
	endif
	if b2>0
		?'     50.00'+space(19)+tran(b2,xa)+space(16)+tran(b2*50,xb)
	endif
	if b3>0
		?'     20.00'+space(19)+tran(b3,xa)+space(16)+tran(b3*20,xb)
	endif
	if b4>0
		?'     10.00'+space(19)+tran(b4,xa)+space(16)+tran(b4*10,xb)
	endif
	if b5>0
		?'      5.00'+space(19)+tran(b5,xa)+space(16)+tran(b5*5,xb)
	endif
	if b6>0
		?'      2.00'+space(19)+tran(b6,xa)+space(16)+tran(b6*2,xb)
	endif
	if b7>0
		?'      1.00'+space(19)+tran(b7,xa)+space(16)+tran(b7,xb)
	endif
	if b8>0
		?'      0.50'+space(19)+tran(b8,xa)+space(16)+tran(b8*0.50,xb)
	endif
	if b9>0
		?'      0.25'+space(19)+tran(b9,xa)+space(16)+tran(b9*0.25,xb)
	endif
	if b10>0
		?'      0.10'+space(19)+tran(b10,xa)+space(16)+tran(b10*0.10,xb)
	endif
	if b11>0
		?'      0.05'+space(19)+tran(b11,xa)+space(16)+tran(b11*0.05,xb)
	endif
	if b12>0
		?'      0.01'+space(19)+tran(b12,xa)+space(16)+tran(b12*0.01,xb)
	endif	
	?space(52)+'--------------'
	?space(52)+tran(m_total,xb)
	?space(52)+'=============='
	?chr(12)
	?
	if m_spool
	   set alte off
   	set alte to
	else
	   set print off
   	set devi to scre
	endi
	set cons on
	exit
enddo
close all
retu

proc rptaxslp
m_oldcol=setcolor()
set colo to (m_cnor)
do whil .t.
	f_setting()
	sele 1
	if .not. net_use('&dpath\sys_id',.t.,5)
		exit
	endif
	if .not. fil_lock(5)
		exit
	endif
	m_year = str(year(beg_date),4)
	sele 2
	if .not. net_use('&dpath\master',.t.,5)
		exit
	endif
	set inde to &dpath\mbyemp
	rein
	go top
	sele 3
	if .not. net_use('&dpath\dept',.t.,5)
		exit
	endif
	set inde to &dpath\dbydep
	rein
	m_oldcol=setcolor()
	set color to (m_cnor)
	m_taxscrn=savescreen(18,18,20,60)
	f_drawbox(18,18,20,59,1,3)
	@19,21 say 'TAX REFUND PAYSLIP FOR THE YEAR' get m_year pict '9999' vali m_year>'1993'
	read
	set color to (m_oldcol)
	restscreen(18,18,20,60,m_taxscrn)
	release m_taxscrn
	if lastkey()=27
		exit
	endif
	if f_choose('SPECIFY SCOPE:','ALL PAYSLIPS','SELECTED PAYSLIPS')
		m_selected=.f.
	else
		m_selected=.t.
	endif
   f_bcln()
	m_spool=.t.
	m_page=0
	m_nextpg=.t.
	m_crow=60
	m_h='999.99'
	m_a='999,999.99'
	sele 2
	if m_selected && SELECTED PAY SLIPS
		*ASK USER TO ENTER 2 EMPLOYEE NUMBERS
		m_emp_no1=spac(6)
		m_emp_no2=spac(6)
		m_rppayslp=savescreen(13,4,18,73)
		f_drawbox(13,5,18,73,1,3)
		@15, 8 say 'PRINT PAYSLIP FROM EMP#:'
		@16,24 say 'TO EMP#:'
		do whil .t.
			@15,33 get m_emp_no1 pict '999999' vali f_valempnm(m_emp_no1,15)
			@16,33 get m_emp_no2 pict '999999' vali f_valempnm(m_emp_no2,16)
			read
			if lastkey()=27
				exit
			endif
			if m_emp_no2<m_emp_no1
				f_err('Invalid range.  Please check.',.f.)
				loop
			else
				if f_ask('Range correct ?')
					exit
				endif
			endif
		enddo
		if lastkey()=27
			exit
		endif
		seek m_emp_no1
	endif
   if .not. f_askspool()
		m_spool=.f.
		if lastkey()=27
			exit
		endif
		set print on
		set devi to print
		set cons off
   endif
	if m_selected
		do p_refslip
	else
		go bott
		m_emp_no2=emp_no
		go top
		do p_refslip
	endif
	if m_spool
	   set alte off
   	set alte to
	else
	   set print off
   	set devi to scre
	endif
	set cons on
	exit
endd
if m_selected
	restscreen(13,4,18,73,m_rppayslp)
	rele m_rppayslp
endif
clos all
set colo to (m_oldcol)
rele all
retu

proc p_refslip
m_spac1=spac(f_center(m_company,99))
m_spac2=spac(99-len(m_company)-len(m_spac1))
m_spac3=spac(f_center(m_company,42)-1)
m_spac4=spac(42-len(m_company)-len(m_spac3))
m_a='99,999,999.99'
do whil emp_no<=m_emp_no2 .and. .not. eof()
	m_dep_no=dep_no
	sele dept
	seek m_dep_no
	if .not. eof()
		if len(alltrim(dep_nm))>25
			m_dep_nm=subs(alltrim(dep_nm),1,25)
		else
			m_dep_nm=alltrim(dep_nm)+space(25-len(alltrim(dep_nm)))
		endif
	else
		m_dep_nm=spac(25)
	endif
	sele master
	m_spc1=int((32-len(alltrim(emp_nm)))/2)
	m_emp_nm=spac(m_spc1)+upper(alltrim(emp_nm))+spac(32-m_spc1-len(alltrim(emp_nm)))
	m_emp_no=ltrim(rtrim(emp_no))+spac(6-len(ltrim(rtrim(emp_no))))
	//m_gross=y_gross-y_othp2-y_leave
	m_gross=y_gross-Y_OTHP1-y_othp2-y_leave
	m_tot_tax=y_tax+y_btax+y_ded10
	//m_taxable=y_gross-y_othp2-y_leave
	m_taxable=y_gross-Y_OTHP1-y_othp2-y_leave
	m_bon_w_tax=0
	m_bon_wo_tax=0
	if y_bonus+y_midbon > m_tax_bon
		//m_nontax =m_tax_bon+y_othp2+y_leave
		m_nontax =m_tax_bon+Y_OTHP1+y_othp2+y_leave
		m_taxable=m_taxable+y_bonus+y_midbon-m_tax_bon
		m_bon_w_tax=y_bonus+y_midbon-m_tax_bon
	else
		//m_nontax =y_bonus+y_midbon+y_othp2+y_leave
		m_nontax =y_bonus+y_midbon+Y_OTHP1+y_othp2+y_leave
		m_bon_wo_tax=y_bonus+y_midbon
	endif
	m_totexmp=per_exmp+add_exmp+sap_exmp+m_bon_wo_tax
	m_taxable=m_taxable-(per_exmp+add_exmp+sap_exmp)
	?'!'+m_spac1+m_company+m_spac2+'!'+m_spac3+m_company+m_spac4+'!'
	?'!'+space(35)+'TAX REFUND  FOR THE YEAR '+m_year+space(35)+'!'+space(13)+m_year+' TAX REFUND'+space(14)+'!'
	?'!'+space(99)+'!'+space(42)+'!'
	?'!    EMP. NO.: '+m_emp_no+space(31)+'DEPT. NO.: '+subs(dep_no,1,2)+' - '+alltrim(m_dep_nm)+spac(25-len(alltrim(m_dep_nm)))+space(7)+'!'+space(42)+'!'
	?'!    NAME    : '+upper(alltrim(emp_nm))+spac(32-len(alltrim(emp_nm)))+space(53)+'!          *** RECEIPT OF PAY ***          !'
	?'!'+repl('-',99)+'!'+space(42)+'!'
	?'!    GROSS INCOME ...............:'+tran(y_gross,m_a)+'   !   EXEMPTIONS:                                   !                                          !'
	?'!    Add -13th MONTH & BONUS.....:'+tran(y_bonus+y_midbon,m_a)+'   !   ^^^^^^^^^^^                                   !        This is to acknowledge receipt    !'
	?'!                                 -------------   !     PERSONAL EXEMPTION.........:'+tran(per_exmp,m_a)+'   !   of the amount of  P'+tran(tax_ref,m_a)+'       !'
	?'!    TOTAL INCOME................:'+tran(y_gross+y_bonus+y_midbon,m_a)+'   !     ADDITIONAL EXEMPTION.......:'+tran(add_exmp,m_a)+'   !   representing tax refund for the year   !'
	?'!    Less-NON-TAXABLE INCOME.....:'+tran(Y_OTHP1+y_othp2+y_leave,m_a)+'   !     SPECIAL EXEMPTION..........:'+tran(sap_exmp,m_a)+'   !   '+m_year+'.                                  !'
	?'!                                 -------------   !     BONUS EXEMPTION(R.A.7833)..:'+tran(m_bon_wo_tax,m_a)+'   !                                          !'
	?'!    TOTAL.......................:'+tran(y_gross-Y_OTHP1-y_othp2-y_leave,m_a)+'   !                                 -------------   !        EMP. NO.: '+m_emp_no+'                  !'
	?'!    Less-EXEMPTIONS.............:'+tran(m_totexmp,m_a)+'   !     TOTAL EXEMPTIONS...........:'+tran(m_totexmp,m_a)+'   !                                          !'
	?'!                                 -------------   !-------------------------------------------------!                                          !'
	?'!    TAXABLE INCOME..............:'+tran(m_taxable,m_a)+'   !   TAX WITHHELD:                                 !     '+m_emp_nm                    +'     !'
	?'!    TAX DUE.....................:'+tran(tax_due,m_a)+'   !     FROM INCOME................:'+tran(y_tax+y_ded10,m_a)+'   !     --------------------------------     !'
	?'!    TOTAL TAX WITHHELD..........:'+tran(m_tot_tax,m_a)+'   !     FROM 13th MONTH & BONUS....:'+tran(y_btax+y_midtax,m_a)+'   !        (Sign Over Printed Name)          !'
	?'!                                 -------------   !                                 -------------   !                                          !'
	?'!    *** TAX REFUND *** .........:'+tran(tax_ref,m_a)+'   !     TOTAL TAX WITHHELD.........:'+tran(m_tot_tax,m_a)+'   !     --------------------------------     !'
	?'!                                 ^^^^^^^^^^^^^   !                                                 !                  (Date)                  !'
	?repl('.',144)
	skip
endd
return

proc rptaxbir
do while .t.
	select 1
  	if .not. net_use('&dpath\sys_id',.f.,5)
		exit
	endi
	m_year=str(year(beg_date),4)
  	if .not. net_use('&dpath\master',.f.,5)
		exit
	endi
	set index to &dpath\mbynm
	m_oldcol=setcolor()
	set color to (m_cnor)
	m_taxscrn=savescreen(18,22,21,56)
	f_drawbox(18,22,20,55,1,3)
	@19,25 say 'TAX REPORT FOR THE YEAR' get m_year pict '9999' vali m_year>'1993'
	read
	set color to (m_oldcol)
	restscreen(18,22,21,56,m_taxscrn)
	release m_taxscrn
	if lastkey()=27
		exit
	endif
	if lastkey()=27
		exit
	endif
	m_spool=.t.
   if .not. f_askspool()
		m_spool=.f.
		if lastkey()=27
			exit
		endi
		set print on
		set devi to print
		set cons off
   endi
	m_page=0
	m_crow=60
	m_dep_no=space(2)
	m_ctr=0
	m_p='99,999,999.99'
	m_p2='9,999,999.99'
	m_tot_tax=0
	m_tot_grs=0
	do while .not. eof()
		if m_crow>58
			do p_txbirhd
		endif
		if y_gross=0
			skip
			loop
		endif
		m_emp_nm = alltrim(emp_nm)+space(32-len(alltrim(emp_nm)))
		m_tan=alltrim(subs(alltrim(tan),1,11))
		m_tan=m_tan+space(11-len(m_tan))
		m_status=alltrim(subs(alltrim(status),1,3))
		m_tan=m_tan+space(3-len(m_status))
		m_taxable=y_gross-Y_OTHP1-y_othp2-y_leave
		m_bon_w_tax=0
		m_bon_wo_tax=0
		if y_bonus+y_midbon>m_tax_bon
			m_taxable=m_taxable+y_bonus+y_midbon-m_tax_bon
			m_bon_w_tax=y_bonus+y_midbon-m_tax_bon
		else
			m_bon_wo_tax=y_bonus+y_midbon
		endif
	   if tax_ref > 0
   	   m_tax=tax_due
	   else
   		m_tax=y_tax+y_btax+y_midtax+y_ded10
   	endif
		?m_emp_nm+'  '+m_tan+'   '+m_status+'  '+tran(m_taxable,m_p)+' ';
		+tran(m_bon_wo_tax+per_exmp+add_exmp+sap_exmp,m_p2)+' ';
		+tran(m_tax,m_p)
		m_tot_grs=m_tot_grs+m_taxable
		m_tot_tax=m_tot_tax+m_tax
		m_crow = m_crow + 1
		m_ctr=m_ctr+1
		skip
	enddo
	if m_ctr>0
		if m_crow+4>58
			do p_txbirhd
		endif
		?repl('-',92)
		?space(37)+'GRAND TOTAL  :  '+tran(m_tot_grs,m_p2)+space(13)+tran(m_tot_tax,m_p2)
	endif
	?
	?'Total Number of Employees :'+str(m_ctr,7)
	?chr(12)
	if m_spool
	   set alte off
   	set alte to
	else
	   set print off
   	set devi to scre
	endif
	set cons on
	exit
enddo
close all
return

proc p_txbirhd
m_page=m_page+1
if m_page>1
	?chr(12)
endif
?alltrim(m_company)
?'INCOME TAX WITHHELD REPORT'
?'FISCAL YEAR '+m_year
?
?ltrim(m_head)+space(85-len(alltrim(m_head)))+'Page '+str(m_page,2)
?repl('=',92)
?'EMPLOYEE NAME                       T.I.N.    STATUS     GROSS PAY    EXEMPTION   TAX W/HELD'
* 12345678901234567890123456789012  999-999-999   123  99,999,999.99 9,999,999.99 9,999,999.99'
?repl('=',92)
m_crow=8
return

*  Program Name:  TAX_FRM.PRG
*  Description:  Print BIR W2 form

proc rptaxfrm
do while .t.
	select 1
  	if .not. net_use('&dpath\sys_id',.f.,5)
		exit
	endi
	m_month = upper(cmonth(ctod(subs(str(100+pres_mo,3),2,2)+'/01/99')))
	m_year=str(year(beg_date),4)
	select 2
  	if .not. net_use('&dpath\master',.f.,5)
		exit
	endi
	set index to &dpath\mbyemp
	select 3
  	if .not. net_use('&dpath\history',.f.,5)
		exit
	endi
	set index to &dpath\hbyemp
	select 2
	set rela to emp_no into history
	m_oldcol=setcolor()
	set color to (m_cnor)
	m_taxscrn=savescreen(18,22,20,57)
	f_drawbox(18,22,20,56,1,3)
	@19,25 say 'BIR W2 FORM FOR THE YEAR' get m_year pict '9999' vali m_year>'1993'
	read
	set color to (m_oldcol)
	restscreen(18,22,20,57,m_taxscrn)
	release m_taxscrn
	if lastkey()=27
		exit
	endif	
	if f_choose('SPECIFY SCOPE:','ALL EMPLOYEES','SELECTED EMPLOYEES')
		m_selected=.f.
	else
		m_selected=.t.
	endif
	sele 2
	if m_selected && SELECTED PAY SLIPS
		*ASK USER TO ENTER 2 EMPLOYEE NUMBERS
		m_emp_no1=spac(6)
		m_emp_no2=spac(6)
		m_rppayslp=savescreen(13,4,18,73)
		f_drawbox(13,5,18,73,1,3)
		@15, 8 say 'PRINT W2 FORM FROM EMP#:'
		@16,24 say 'TO EMP#:'
		do whil .t.
			@15,33 get m_emp_no1 pict '999999' vali f_valempnm(m_emp_no1,15)
			@16,33 get m_emp_no2 pict '999999' vali f_valempnm(m_emp_no2,16)
			read
			if lastkey()=27
				exit
			endif
			if m_emp_no2<m_emp_no1
				f_err('Invalid range.  Please check.',.f.)
				loop
			else
				if f_ask('Range correct ?')
					exit
				endif
			endif
		endd
		if lastkey()=27
			exit
		endif
		seek m_emp_no1
	endif
	m_spool=.t.
   if .not. f_askspool()
		m_spool=.f.
		if lastkey()=27
			exit
		endif
		set print on
		set devi to print
		set cons off
   endif
	if m_selected
		do p_taxw2frm
	else
		go bott
		m_emp_no2=emp_no
		go top
		do p_taxw2frm
	endif
	if m_spool
	   set alte off
   	set alte to
	else
	   set print off
   	set devi to scre
	endif
	set cons on
	exit
endd
if m_selected
	restscreen(13,4,18,73,m_rppayslp)
	rele m_rppayslp
endif
clos all
set colo to (m_oldcol)
rele all
retu

proc p_taxw2frm
m_spac1=spac(f_center(alltrim(m_comp_sign),24))
m_spac2=spac(24-len(alltrim(m_comp_sign))-len(m_spac1))
m_spac3=spac(f_center(alltrim(m_compstit),24))
m_spac4=spac(24-len(alltrim(m_compstit))-len(m_spac3))
m_spac5=spac(f_center(alltrim(m_compstin),24))
m_spac6=spac(24-len(alltrim(m_compstin))-len(m_spac5))
m_comp_nm=alltrim(m_company)+space(73-len(alltrim(m_company)))
m_comp_ad=alltrim(m_comp_addr)+space(73-len(alltrim(m_comp_addr)))
m_comp_ti=alltrim(m_comp_tin)+space(73-len(alltrim(m_comp_tin)))
m_a='9,999,999.99'
do whil emp_no<=m_emp_no2 .and. .not. eof()
	sele master
	m_spc1=int((32-len(alltrim(emp_nm)))/2)
	m_emp_nm=spac(m_spc1)+upper(alltrim(emp_nm))+spac(32-m_spc1-len(alltrim(emp_nm)))
	m_emp_no=ltrim(rtrim(emp_no))+spac(6-len(ltrim(rtrim(emp_no))))
	m_gross=y_gross-Y_OTHP1-y_othp2-y_leave
	m_tot_tax=y_tax+y_btax+y_midtax+y_ded10
	m_taxable=y_gross-Y_OTHP1-y_othp2-y_leave
	m_bon_w_tax=0
	m_bon_wo_tax=0
	if y_bonus+y_midbon>m_tax_bon
		m_nontax =m_tax_bon+Y+OTHP1+y_othp2+y_leave
		m_taxable=m_taxable+y_bonus+y_midbon-m_tax_bon
		m_bon_w_tax=y_bonus+y_midbon-m_tax_bon
	else
		m_nontax =y_bonus+y_midbon+Y_OTHP1+y_othp2+y_leave
		m_bon_wo_tax=y_bonus+y_midbon
	endif
	m_totexmp=per_exmp+add_exmp+sap_exmp+m_bon_wo_tax
	mLNAME=ALLTRIM(EMP_NM)+SPAC(32-LEN(ALLTRIM(EMP_NM)))
	mCNAME1=INT((32-LEN(ALLTRIM(EMP_NM)))/2)
	mCNAME=SPAC(mCNAME1)+ALLTRIM(EMP_NM)+SPAC(32-mCNAME1-LEN(ALLTRIM(EMP_NM)))
   mTAN = ALLTRIM(TAN)+SPAC(20-LEN(ALLTRIM(TAN)))
	mCTAN1=INT((32-LEN(ALLTRIM(TAN)))/2)
	mCTAN= SPACE(mCTAN1)+ALLTRIM(TAN)+SPACE(32-mCTAN1-LEN(ALLTRIM(TAN)))
	mADD = alltrim(HISTORY->ADDRESS)+space(73-len(alltrim(HISTORY->ADDRESS)))
   mGROSS = (Y_GROSS-Y_OTHP1-Y_OTHP2-Y_LEAVE) + (Y_BONUS+Y_MIDBON)            &&  Y_OTHP2 is the non-taxable earning
   mEXEMP = PER_EXMP+ADD_EXMP+SAP_EXMP
	mTAXINC=TAX_INC
	mTAX = TAX_DUE
   ? chr(27) + chr(80)
   ? 'BIR FORM W-2                 Republika ng Pilipinas'
   ? 'REVISED: OCT.,1991           Kagawaran ng Pananalapi'
   ? chr(27) + chr(69) + space(26) + 'KAWANIHAN NG RENTAS INTERNAS'
   ? '               CERTIFICATE OF INCOME TAX WITHHELD ON COMPENSATION'
   ? '                           For the Calendar Year ' + m_year
   ? chr(20)+chr(27)+chr(70)+chr(27)+chr(80)+chr(15)+space(5)+repl('=',124)
   ? spac(5) + '|                                    E M P L O Y E E                                   |          COMPENSATION PAID         |'
   ? spac(5) + '|--------------------------------------------------------------------------------------|-------------------|----------------|'
   ? spac(5) + '|  TAXPAYER IDENTIFICATION NUMBER :  '+mTAN            +'                              |                   |                |'
   ? spac(5) + '|  NAME    :  '+chr(27)+chr(33)+chr(20)+mLNAME+chr(27)+chr(33)+chr(4)+'                                         |  R E G U L A R:   |                |'
   ? spac(5) + '|  ADDRESS :  '+mADD                                          +'|                   |                |'
   ? spac(5) + '|======================================================================================|  BASIC SALARY     | P'+tran(y_gross-Y_OTHP1-y_othp2-y_leave,'9,999,999.99')+'  |'
   ? spac(5) + '|                                    E M P L O Y E R                                   |  REPRESENTATION   |                |'
   ? spac(5) + '|--------------------------------------------------------------------------------------|  TRANSPORTATION   |                |'
   ? spac(5) + '|  T.I.N.  :  '+m_comp_ti+'|  COST OF LIVING   |                |'
   ? spac(5) + '|  NAME    :  '+m_comp_nm+'|  HOUSING          |                |'
   ? spac(5) + '|  ADDRESS :  '+m_comp_ad+'|  OTHERS(13th Mo.) |  '+TRAN(Y_BONUS+Y_MIDBON,'9,999,999.99')+'  |'
   ? spac(5) + '|======================================================================================|                   |                |'
   ? spac(5) + '|            We declare under the penalties of perjury that this certificate has been  |                   |                |'
   ? spac(5) + '|  made in good faith, verified by us, and to the best of our knowledge and belief,is  |  SUPPLEMENTARY:   |                |'
   ? spac(5) + '|  true and correct, pursuant to the provisions of the National Internal Revenue Code  |                   |                |'
   ? spac(5) + '|  as amended, and the regulations issued under authority thereof:                     |  BONUS            |                |'
   ? spac(5) + '|                                                                                      |  COMMISSION       |                |'
   ? spac(5) + '|------------------------                                                              |  PROFIT SHARING   |                |'
   ? spac(5) + '|   STAMP OF RECEIVING  |                                                              |  FEES INCLUDING   |                |'
   ? spac(5) + "|      OFFICE/DATE      |                                                              |   DIRECTOR'S FEES |                |"
   ? spac(5) + '|      OF  RECEIPT      |                                                              |  OTHERS (Specify) |                |'
   ? spac(5) + '|         .....         |                                                              |                   |                |'
   ? spac(5) + '|       ..:   :..       |                                                              |                   |                |'
   ? spac(5) + '|        .     .        |  '+m_spac1+alltrim(m_comp_sign)+m_spac2+'  '+mCNAME                      +'  |-------------------|----------------|'
   ? spac(5) + '|         .   .         |  ------------------------  --------------------------------  |                   |                |'
   ? spac(5) + '|           .           |      E M P L O Y E R               E M P L O Y E E           |  TOTAL INCOME     | P'+TRAN(mGROSS, '9,999,999.99')+'  |'
   ? spac(5) + '|                       |        (Signature)                   (Signature)             |  LESS: EXEMPTIONS |  '+TRAN(mEXEMP, '9,999,999.99')+'  |'
   ? spac(5) + "|                       |                                                              |  ADD'L EXEMPTION  |                |"
   ? spac(5) + '|                       |  '+m_spac3+alltrim(m_compstit)+m_spac4+'                                    |    UNDER R.A.7833 | P'+tran(m_bon_wo_tax,'9,999,999.99')+'  |'
   ? spac(5) + '|                       |  '+m_spac5+alltrim(m_compstin)+m_spac6+'  '+mCTAN                       +'  |  TAXABLE INCOME   | P'+TRAN(mTAXINC,'9,999,999.99')+'  |'
   ? spac(5) + '|                       |  ------------------------  --------------------------------  |  TAX DUE          | P'+TRAN(mTAX,   '9,999,999.99')+'  |'
   ? spac(5) + '|                       |  Position/Designation/TIN               T.I.N.               |  TAX WITHHELD     | P'+TRAN(mTAX,   '9,999,999.99')+'  |'
   ? spac(5) + '|                       |                                                              |                   |                |'
   ? spac(5) + '============================================================================================================================='
   ?
   ? '.....................................................................................................................................'
   ? chr(18) + chr(27) + chr(80)
	?chr(12)
	skip
enddo
? chr(27) + chr(64)
return

/*
do while .t.
	m_resigned=.f.
	if f_choose(' SELECT : ', ' ALL EMPLOYEES ',' RESIGNED EMPLOYEES ')
		m_resigned=.f.
	else
		m_resigned=.t.
	endif
	select 4
  	if .not. net_use('&dpath\tmcard',.f.,5)
		exit
	endi
	set index to &dpath\tbyemp
	select 1
  	if .not. net_use('&dpath\sys_id',.f.,5)
		exit
	endi
	m_month = upper(cmonth(ctod(subs(str(100+pres_mo,3),2,2)+'/01/99')))
	m_year=str(year(beg_date),4)

	select 1
  	if .not. net_use('&dpath\master',.t.,5)
		exit
	endi
	m_oldcol=setcolor()
	set color to (m_cnor)
	m_taxscrn=savescreen(18,22,20,56)
	f_drawbox(18,22,20,55,1,3)
	@19,25 say 'TAX REPORT FOR THE YEAR' get m_year pict '9999' vali m_year>'1993'
	read
	set color to (m_oldcol)
	restscreen(18,22,20,56,m_taxscrn)
	release m_taxscrn
	if lastkey()=27
		exit
	endif
	if f_choose('Print Report:','BY EMP#','BY EMP. NAME')
		set index to &dpath\mbyemp
		m_by_emp_no=.t.
	else
		select master
		set index to &dpath\mbynm
		reindex
		go top
		m_by_emp_no=.f.
	endif
	if lastkey()=27
		exit
	endif
	m_spool=.t.
   if .not. f_askspool()
		m_spool=.f.
		if lastkey()=27
			exit
		endi
		set print on
		set devi to print
		set cons off
   endif
	if lastkey()=27
		exit
	endif
	m_page=0
	m_crow=60
	m_dep_no=space(2)
	m_ctr=0
	m_tax_add=0
	m_tax_fer=0
	m_d_taxable=0
	m_d_nontax =0
	m_d_taxdue =0
	m_d_tltax  =0
	m_d_tbtax  =0
	m_g_taxable=0
	m_g_nontax =0
	m_g_taxdue =0
	m_g_tltax  =0
	m_g_tbtax  =0
	m_p='99,999,999.99'
	m_p2='9,999,999.99'
	do while .not. eof()
		if m_crow>58
			do p_txshthd
		endif
		if y_gross=0
			skip
			loop
		endif
		if m_resigned
			if dep_no<>'05'
				skip
				loop
			endif
		endif
		m_empl_no=emp_no
		m_marec_no=recno()
		m_emp_nm=emp_nm
		sele master
		go top
		seek m_empl_no
		if .not. foun()
			sele master
			go top
			seek m_emp_nm
			if .not. foun()
				goto m_marec_no
				skip
				loop
			endif
		endif
		sele master
		goto m_marec_no
		m_status=alltrim(status)
		m_emp_nm = alltrim(emp_nm)
		m_lspac=int((32-len(m_emp_nm))/2)
		m_emp_nm1 =m_emp_nm+space(32-len(m_emp_nm))
		m_emp_no=alltrim(emp_no)+space(6-len(alltrim(emp_no)))
		m_taxable=m_y_gross-M_Y_OTHP1-m_y_othp2-m_y_othp4-m_y_leave - (m_y_sss+m_y_med+m_y_pbg)
		m_bon_w_tax=0
		m_bon_wo_tax=0
		if y_bonus>m_tax_bon
			m_nontax =m_tax_bon+M_Y_OTHP1+m_y_othp2+m_y_othp4+m_y_leave+(m_y_sss+m_y_med+m_y_pbg)
			m_taxable=m_taxable+y_bonus-m_tax_bon
			m_bon_w_tax=y_bonus-m_tax_bon
		else
			m_nontax =y_bonus  +Y_OTHP1+y_othp2+y_othp4+y_leave+(y_sss+y_med+y_pbg)
			m_bon_wo_tax=y_bonus
		endif

		if m_status<>'OJT'

			?m_emp_no+'  '+m_emp_nm1+'  '+tan+'  '+status+space(6)+tran(m_taxable,m_p)+'  ';
			+tran(per_exmp,m_p2)+' '+tran(add_exmp,m_p2)+' '+tran(sap_exmp,m_p2)+' ';
			+tran(per_exmp+add_exmp+sap_exmp,m_p2);
			+'   '+tran(tax_due,m_p)+'   '+tran(y_tax+y_ded10+y_btax+y_midtax,m_p)+'  '

			if tax_ref < 0
				m_tax_add=m_tax_add+tax_ref
				??tran(-tax_ref,'(99,999,999.99)')
			else
				m_tax_fer=m_tax_fer+tax_ref
				??' '+tran(tax_ref,m_p)
			endif
			m_d_taxable += m_taxable
			m_d_nontax  += m_nontax
			m_d_taxdue  += tax_due
			m_d_tltax   += y_tax+y_ded10
			m_d_tbtax   += y_btax+y_midtax
			m_g_taxable += m_taxable
			m_g_nontax  += m_nontax
			m_g_taxdue  += tax_due
			m_g_tltax   += y_tax+y_ded10
			m_g_tbtax   += y_btax+y_midtax
			m_crow ++
			m_ctr  ++

		endif
		skip
	enddo
	if .not. m_by_emp_no .and. m_ctr>0
		if m_d_taxable>0
			if m_crow+3>58
				do p_txshthd
			endif
			?repl('-',178)
			?space(48)+'DEPT. TOTAL : '+tran(m_d_taxable,m_p)+' ';
			+space(55)+tran(m_d_taxdue,m_p)+'   '+tran(m_d_tltax+m_d_tbtax,m_p)
			m_crow=m_crow+2
		endif
	endif
	?repl('=',178)
	if m_ctr>0
		if m_crow+5>58
			do p_txshthd
		endif
		?
		?space(147)+"TOTAL ADD'L TAX : "+tran(m_tax_add*(-1),m_p)
		?space(147)+"TOTAL TAX REFUND: "+tran(m_tax_fer,m_p)
		?
		?repl('=',178)
		?space(50)+'GRAND TOTAL : '+tran(m_g_taxable,m_p)+' ';
		+space(55)+tran(m_g_taxdue,m_p)+'   '+tran(m_g_tltax+m_g_tbtax,m_p)
		?repl('=',178)
	endif
	?'Total Number of Employees :'+str(m_ctr,7)
	?chr(12)
	if m_spool
	   set alte off
   	set alte to
	else
	   set print off
   	set devi to scre
	endi
	set cons on
	exit
enddo
close all
return



	      	if m_y_gross+m_y_bonus<=0
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

            //Print NON-TAXABLE PAY

            ??tran(if(m_y_bonus>m_nontaxbon,m_nontaxbon,m_y_bonus),m_pict)
            m_t13th += if(m_y_bonus>m_nontaxbon,m_nontaxbon,m_y_bonus)

            ??tran(m_premiums,m_pict)
            m_tsss += m_premiums

            //Other Non-Taxable Pay
            ??tran(M_Y_OTHP1+m_y_othp2+m_y_othp4+m_y_leave,m_pict)+s1
            m_tsal += M_Y_OTHP1+m_y_othp2+m_y_othp4+m_y_leave

            //Print TAXABLE PAY

            ??tran(if(m_y_bonus>m_nontaxbon,m_y_bonus-m_nontaxbon,0),m_pict)+s1
            m_tnt13th += if(m_y_bonus>m_nontaxbon,m_y_bonus-m_nontaxbon,0)

            ??tran(m_y_gross-(M_Y_OTHP1+m_y_othp2+m_y_othp4+m_y_leave+m_premiums),m_pict)
            m_tntsal += m_y_gross-(M_Y_OTHP1+m_y_othp2+m_y_othp4+m_y_leave+m_premiums)

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
            m_dectax := (m_ded10+m_tax+m_y_btax+y_midtax)+(m_cur_tax+m_cur_ded10)

            if m_dectax + m_novtax < m_taxdue
               m_addl_tax := m_taxdue - m_dectax - m_novtax
               m_tax_refund := 0
            else
               m_addl_tax := 0
               m_tax_refund := m_taxdue - m_dectax - m_novtax
            endif

            ??tran(m_dectax + m_addl_tax, m_pict)
            m_tdectax += m_dectax + m_addl_tax

            ??tran(m_tax_refund*(-1),m_pict)
            m_tref += m_tax_refund

            ??' '+tran(m_taxdue,m_pict)
            m_tadjstd += m_taxdue

*/
