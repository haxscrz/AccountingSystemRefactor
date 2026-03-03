* Non-taxable Summary
* Rptaxnon.prg

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
	if f_choose('Print Report:','BY EMP#','BY DEPARTMENT')
		set index to &dpath\mbyemp
		m_by_emp_no=.t.
	else
		set index to &dpath\mbydep
		select 2
	  	if .not. net_use('&dpath\dept',.f.,5)
			exit
		endi
		set index to &dpath\dbydep
		select 1
		set relation to dep_no into dept
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
	m_d_nontax =0
	m_g_nontax =0
	m_p='99,999,999.99'
	m_p2='9,999,999.99'
	do while .not. eof()
		if m_crow>58
			do p_ntxshthd
		endif
		if y_gross=0
			skip
			loop
		endif
		if .not. m_by_emp_no
			if dep_no<>m_dep_no
				if m_d_nontax>0
					if m_crow+3 > 58
						do p_ntxshthd
					endif
					?repl('-',78)
					?space(48)+'DEPT. TOTAL : '+tran(m_d_nontax,m_p)
					m_crow=m_crow+1
				endif
				?
				?'Department: '+ltrim(dept->dep_nm)
				?
				m_d_taxable=0
				m_d_nontax =0
				m_d_taxdue =0
				m_d_tltax  =0
				m_d_tbtax  =0
				m_dep_no=dep_no
				m_crow=m_crow+3
			endif
		endif
		m_emp_nm = alltrim(emp_nm)
		m_lspac=int((32-len(m_emp_nm))/2)
		m_emp_nm1 =m_emp_nm+space(32-len(m_emp_nm))
		m_emp_no=alltrim(emp_no)+space(6-len(alltrim(emp_no)))
		if y_bonus>m_tax_bon
			m_nontax =m_tax_bon+y_othp2+y_leave
		else
			m_nontax =y_bonus+y_othp2+y_leave
		endif
		?m_emp_no+'  '+m_emp_nm1+'  '+tan+'  '+status+space(6)+tran(m_nontax,m_p)
		m_d_nontax =m_d_nontax +m_nontax
		m_g_nontax =m_g_nontax +m_nontax
		m_crow = m_crow + 1
		m_ctr=m_ctr+1
		skip
	enddo
	?repl('=',78)
	if .not. m_by_emp_no .and. m_ctr>0
		if m_d_nontax>0
			if m_crow+3>58
				do p_ntxshthd
			endif
			?repl('-',78)
			?space(48)+'DEPT. TOTAL : '+tran(m_d_nontax,m_p)
			m_crow=m_crow+2
		endif
	endif
	if m_ctr>0
		if m_crow+5>58
			do p_ntxshthd
		endif
		?
		?repl('=',78)
		?space(48)+'GRAND TOTAL : '+tran(m_g_nontax,m_p)
		?repl('=',78)
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

proc p_ntxshthd
m_page=m_page+1
if m_page>1
	?chr(12)
endif
?alltrim(m_company)
*?'YEAR-END TAX RECONCILIATION WORKSHEET'
?'ALPHA-LIST OF NON-TAXABLE FOR THE YEAR '+m_year
?'From JANUARY to '+m_month+', '+m_year
?'TIN NO.: '+m_comp_tin
?
?ltrim(m_head)+space(70-len(alltrim(m_head)))+'Page '+str(m_page,2)
?repl('=',78)
?"                                                            ! NON-TAXABLE    !"
?"EMP#            N A M E                 T.I.N.      STATUS  ! GROSS EARNINGS !"
*123456 12345678901234567890123456789012 12345678901  123      99,999,999.99   !"
?repl('=',78)
m_crow=10
return
