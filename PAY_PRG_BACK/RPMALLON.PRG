* PAYROLL SYSTEM
* Program Name : Monthly Loan Deductions Report
* Program Code : Rpmonlon.prg
* Author       : SVC
* Date Started : Jan. 24, 1995
* Date Finished: Jan. 24, 1995
******************************************************

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
	stor 0 to m_d_loan1,m_d_loan2,m_d_loan3,m_d_loan4,m_d_loan5
	stor 0 to m_t_loan1,m_t_loan2,m_t_loan3,m_t_loan4,m_t_loan5
	select master
	do whil .not. eof()
		if m_crow>58
			do p_mlnall
		endif
		m_ln_amt1=m_sln
		m_ln_amt2=m_sscal
		m_ln_amt3=m_hln
		m_ln_amt4=m_coln
		m_ln_amt5=m_comln
		if m_ln_amt1<=0.and.m_ln_amt2<=0.and.m_ln_amt3<=0.and.m_ln_amt4<=0.and.m_ln_amt5<=0
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
		if m_crow+3>58
			do p_mlnall
		endif
		?
		?'Dept.No.: '+m_dep_no+' - '+m_dep_nm
		?
		m_crow=m_crow+3
		do whil dep_no=m_dep_no .and. .not. eof()
			if m_crow+2>58
				do p_mlnall
			endi
			m_ln_amt1=m_sln
			m_ln_amt2=m_sscal
			m_ln_amt3=m_hln
			m_ln_amt4=m_coln
			m_ln_amt5=m_comln
			if m_ln_amt1<=0.and.m_ln_amt2<=0.and.m_ln_amt3<=0.and.m_ln_amt4<=0.and.m_ln_amt5<=0
				skip
				loop
			endif
			m_emp_no=alltrim(emp_no)+space(7-len(alltrim(emp_no)))
			m_emp_nm=alltrim(emp_nm)+space(35-len(alltrim(emp_nm)))
			?m_emp_no+m_emp_nm+tran(m_ln_amt1,'99,999,999.99')+'   ';
			 +tran(m_ln_amt2,'99,999,999.99')+'   ';
			 +tran(m_ln_amt3,'99,999,999.99')+'   ';
			 +tran(m_ln_amt4,'99,999,999.99')+'   '+tran(m_ln_amt5,'99,999,999.99')
			m_crow=m_crow+1
			m_d_loan1=m_d_loan1+m_ln_amt1
			m_d_loan2=m_d_loan2+m_ln_amt2
			m_d_loan3=m_d_loan3+m_ln_amt3
			m_d_loan4=m_d_loan4+m_ln_amt4
			m_d_loan5=m_d_loan5+m_ln_amt5
			skip
		enddo
		if dep_no#m_dep_no
			if m_crow+4>58
				do p_mlnall
			endi
			?
			?repl('-',120)
			?space(18)+'DEPARTMENT TOTAL... :  '+tran(m_d_loan1,'999,999,999.99');
			 +'  '+tran(m_d_loan2,'999,999,999.99')+'  ';
			 +tran(m_d_loan3,'999,999,999.99')+'  ';
			 +tran(m_d_loan4,'999,999,999.99')+'  ';
			 +tran(m_d_loan5,'999,999,999.99')
			?repl('-',120)
			m_crow=m_crow+4
			m_t_loan1=m_t_loan1+m_d_loan1
			m_t_loan2=m_t_loan2+m_d_loan2
			m_t_loan3=m_t_loan3+m_d_loan3
			m_t_loan4=m_t_loan4+m_d_loan4
			m_t_loan5=m_t_loan5+m_d_loan5
			m_d_loan1=0
			m_d_loan2=0
			m_d_loan3=0
			m_d_loan4=0
			m_d_loan5=0
		endif
	enddo
	if m_crow+3>58
		do p_mlnall
	endi
	?space(23)+'GRAND TOTAL... :  '+tran(m_t_loan1,'999,999,999.99')+'  ';
	 +tran(m_t_loan2,'999,999,999.99')+'  '+tran(m_t_loan3,'999,999,999.99');
	 +'  '+tran(m_t_loan4,'999,999,999.99')+'  '+tran(m_t_loan5,'999,999,999.99')
	?repl('=',120)
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
endd
clos all
set colo to (m_oldcol)
rele all
retu



proc p_mlnall
m_page=m_page+1
if m_page>1
	?chr(12)
endi
?m_company
??' LOAN DEDUCTIONS REPORT'
?'For the month of '+m_pres_mo+' '+m_pres_yr
?
?alltrim(m_head)+spac(30-len(alltrim(m_head)))+space(82)+'Page '+str(m_page,3)
? repl('=',120)
?'EMP#   EMPLOYEE NAME                        SSS SALARY     SSS CALAMITY       HOUSING    COMPANY SALARY   MULTI-PURPOSE'
? repl('=',120)
* 1234   12345678901234567890123456789012   99,999,999.99
m_crow=8
m_nextpg=.f.
return



text

EMP#   EMPLOYEE NAME                        SSS SALARY     SSS CALAMITY       HOUSING    COMPANY SALARY   MULTI-PURPOSE
1234   12345678901234567890123456789012   99,999,999.99   99,999,999.99   99,999,999.99   99,999,999.99   99,999,999.99

                  DEPARTMENT TOTAL... :  999,999,999.99

                       GRAND TOTAL... :  999,999,999.99  999,999,999.99  999,999,999.99  999,999,999.99  999,999,999.99


endtext