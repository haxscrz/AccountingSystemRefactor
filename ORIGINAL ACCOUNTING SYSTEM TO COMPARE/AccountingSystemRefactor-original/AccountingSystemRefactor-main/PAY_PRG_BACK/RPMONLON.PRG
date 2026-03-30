* PAYROLL SYSTEM
* Program Name : Monthly Loan Deductions Report
* Program Code : Rpmonlon.prg
* Author       : SVC
* Date Started : Jan. 24, 1995
* Date Finished: Jan. 24, 1995
******************************************************

para m_which
m_oldcol=setcolor()
set colo to (m_cnor)
do while .t.
   f_bcln()
	m_spool=.t.
	m_page=0
	m_crow=60
	m_fig='999,999.99'
	f_setting()
	select 1
	if .not. net_use('&dpath\sys_id',.t.,5)
		exit
	endif
	if .not. fil_lock(5)
		exit
	endif
	m_pres_mo=alltrim(cmonth(ctod(subs(str(100+pres_mo,3),2,2)+'/01/'+subs(str(year(end_date),4),3,2))))
	m_pres_yr=str(year(beg_date),4)
	select 2
	if .not. net_use('&dpath\master',.t.,5)
		exit
	endif
	set inde to &dpath\mbydep
	sele 3
	if .not. net_use('&dpath\dept',.t.,5)
		exit
	endi
	set inde to &dpath\dbydep
	rein
	rein
	go top
	if .not. f_askspool()
		m_spool=.f.
		if lastkey()=27
			exit
		endif
		set print on
		set devi to print
		set cons off
	endif
	if lastkey()=27
		exit
	endif
	stor 0 to m_d_loan, m_t_loan
	select master
	do whil .not. eof()
		m_mastrec=recno()
		if m_crow>58
			do p_mlnhead
		endif
		do case
			case m_which='SLR'
				m_loan_amt=m_sln
			case m_which='CAL'
				m_loan_amt=m_sscal
			case m_which='HSE'
				m_loan_amt=m_hln
			case m_which='COM'
				m_loan_amt=m_coln
			case m_which='COD'
				m_loan_amt=m_comln
		endcase
		if m_loan_amt<=0
			skip
			loop
		endif
		m_dep_no=dep_no
		sele dept
		seek m_dep_no
		if .not. eof()
			m_dep_nm=dep_nm
		else
			m_dep_nm=''
		endif
		sele master
		goto m_mastrec
		if m_crow+3>58
			do p_mlnhead
		endif
		?
		?'Dept.No.: '+m_dep_no+' - '+m_dep_nm
		?
		m_crow=m_crow+3
		m_d_loan=0
		do whil dep_no=m_dep_no .and. .not. eof()
			if m_crow+2>58
				do p_mlnhead
			endi
			do case
				case m_which='SLR'
					m_loan_amt=m_sln
				case m_which='CAL'
					m_loan_amt=m_sscal
				case m_which='HSE'
					m_loan_amt=m_hln
				case m_which='COM'
					m_loan_amt=m_coln
				case m_which='COD'
					m_loan_amt=m_comln
			endcase
			if m_loan_amt<=0
				skip
				loop
			endif
			m_emp_no=alltrim(emp_no)+space(7-len(alltrim(emp_no)))
			m_pgbg_no=pgbg_no
			m_emp_nm=alltrim(emp_nm)+space(35-len(alltrim(emp_nm)))
			if m_which='HSE'
				?m_pgbg_no+' '+m_emp_nm+tran(m_loan_amt,'99,999,999.99')
			else
				?m_emp_no+m_emp_nm+tran(m_loan_amt,'99,999,999.99')
			endif		
			m_crow=m_crow+1
			m_d_loan=m_d_loan+m_loan_amt
			skip
		enddo
		if dep_no#m_dep_no
			if m_crow+4>58
				do p_mlnhead
			endi
			?
			if m_which='HSE'
				?repl('-',62)
				?space(25)+'DEPARTMENT TOTAL... :  '+tran(m_d_loan,'999,999,999.99')
				?repl('-',62)
			else
				?repl('-',55)
				?space(18)+'DEPARTMENT TOTAL... :  '+tran(m_d_loan,'999,999,999.99')
				?repl('-',55)
			endif
			m_crow=m_crow+4
			m_t_loan=m_t_loan+m_d_loan
			m_d_loan=0
		endif
	enddo
	if m_crow+3>58
		do p_msshead
	endi
	if m_which='HSE'
		?space(30)+'GRAND TOTAL... :  '+tran(m_t_loan,'999,999,999.99')
		?repl('=',62)
		?
	else
		?space(23)+'GRAND TOTAL... :  '+tran(m_t_loan,'999,999,999.99')
		?repl('=',55)
		?
	endi	
	if m_spool
	   set alte off
   	set alte to
	else
	   set print off
   	set devi to scre
	endi
	set cons on
	exit
endd
clos all
set colo to (m_oldcol)
rele all
retu

proc p_mlnhead
m_page=m_page+1
if m_page>1
	?chr(12)
endi
?m_company
?m_comp_addr
?m_comp_sss
?
do case
	case m_which='SLR'
		?'SSS SALARY'
	case m_which='CAL'
		?'SSS CALAMITY'
	case m_which='HSE'
		?'PAG-IBIG SALARY'
	case m_which='COM'
		?'COMPANY SALARY'
	case m_which='COD'
		?'MULTI-PURPOSE'
endcase
??' LOAN DEDUCTIONS REPORT'
?'For the month of '+m_pres_mo+' '+m_pres_yr
?
?alltrim(m_head)+spac(30-len(alltrim(m_head)))+space(24)+'Page '+str(m_page,3)
if m_which='HSE'
	? repl('=',62)
	?'COMPANY ID   EMPLOYEE NAME                              AMOUNT'
	? repl('=',62)
else
	? repl('=',55)
	?'EMP#   EMPLOYEE NAME                          AMOUNT'
	? repl('=',55)
	* 1234   12345678901234567890123456789012   99,999,999.99
endif
m_crow=10
m_nextpg=.f.
return
