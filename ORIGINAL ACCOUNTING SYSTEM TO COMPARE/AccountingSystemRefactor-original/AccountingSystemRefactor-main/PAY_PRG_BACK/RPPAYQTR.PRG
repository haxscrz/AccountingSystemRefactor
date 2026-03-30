* PAYROLL SYSTEM
* Program Name : Quarterly REports Generation
* Program Code : Rppayqtr.prg
* Author       : SVC
* Date Started : June 21, 1994
* Date Finished: June 23, 1994
******************************************************

para m_qtrrep
m_oldcol=setcolor()
m_qtrscrn=savescreen(9,21,15,56)
set colo to (m_cnor)
do whil .t.
   f_bcln()
	m_spool=.t.
	m_page=0
	m_crow=60
	m_fig='99,999,999.99'
	f_setting()
	sele 1
	if .not. net_use('&dpath\sys_id',.t.,5)
		exit
	endi
	if .not. fil_lock(5)
		exit
	endi
	sele 2
	if .not. net_use('&dpath\master',.t.,5)
		exit
	endi
	set inde to &dpath\mbydep,&dpath\mbynm
	rein
	go top
	sele 3
	if .not. net_use('&dpath\dept',.t.,5)
		exit
	endi
	set inde to &dpath\dbydep
	rein
	sele sys_id
	m_pres_mo=str(month(ctod(subs(str(100+pres_mo,3),2,2)+'/01/'+subs(str(year(end_date),4),3,2))),2)
	do case
		case m_pres_mo$' 1~ 2~ 3'
			m_quarter=1
		case m_pres_mo$' 4~ 5~ 6'
			m_quarter=2
		case m_pres_mo$' 7~ 8~ 9'
			m_quarter=3
		case m_pres_mo$'10~11~12'
			m_quarter=4
	endc
	m_year=str(year(beg_date),4)
	*Confirm Quarter and Year
	f_bcln()
	f_drawbox(9,22,14,56,1,3)
	set colo to (m_cnor)
	@10,25 say 'SELECT THE APPLICABLE QUARTER'
	@12,25 say 'QUARTER :'
	@13,25 say 'YEAR    :'
	@12,36 prom '1st'
	@12,41 prom '2nd'
	@12,46 prom '3rd'
	@12,51 prom '4th'
	menu to m_quarter
	if lastkey()=27
		exit
	endi
	@13,36 get m_year pict '9999' vali m_year >= str(year(beg_date-1),4)
	read
	if lastkey()=27
		exit
	endi
	do case
		case m_quarter=1
			m_cquarter = '1st quarter of '+m_year
			m_mn1='  JANUARY'
			m_mn2=' FEBRUARY'
			m_mn3='    MARCH'
		case m_quarter=2
			m_cquarter = '2nd quarter of '+m_year
			m_mn1='    APRIL'
			m_mn2='      MAY'
			m_mn3='     JUNE'
		case m_quarter=3
			m_cquarter = '3rd quarter of '+m_year
			m_mn1='     JULY'
			m_mn2='   AUGUST'
			m_mn3='SEPTEMBER'
		case m_quarter=4
			m_cquarter = '4th quarter of '+m_year
			m_mn1='  OCTOBER'
			m_mn2=' NOVEMBER'
			m_mn3=' DECEMBER'
		othe
			exit
	endc
	if f_choose('ARRANGED BY:','DEPARTMENT','EMPLOYEE NAME')
		m_by_dep=.t.
	else
		m_by_dep=.f.
		select master
		set order to 2
	endif
	go top
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
	?chr(27)+chr(33)+chr(4)	
	do case
		case m_qtrrep=1  && QUARTERLY SSS, MEDICARE, EC AND MATERNITY
			do p_repsss
		case m_qtrrep=2  && QUARTERLY PAG-IBIG PREMIUM
			do p_reppbg
		case m_qtrrep=3  && QUARTERLY WITHHOLDING TAX
			do p_reptax
		case m_qtrrep=4  && QUARTERLY SSS LOAN PAYMENTS
			do p_repsln
		case m_qtrrep=5  && QUARTERLY SSS LOAN PAYMENTS USNING SSS-FORMS
			do p_repslf
		case m_qtrrep=6  && QUARTERLY PAG-IBIG LOAN PAYMENTS
			do p_rephln
	endc
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
restscreen(9,21,15,56,m_qtrscrn)
clos all
set colo to (m_oldcol)
rele all
retu


proc p_repsss
store 0 to m_t_grs1, m_t_grs2, m_t_grs3
store 0 to m_pt_grs1, m_pt_grs2, m_pt_grs3
store 0 to m_t_sss1, m_t_sss2, m_t_sss3, m_t_med1, m_t_med2,;
	m_t_med3, m_t_ecr1, m_t_ecr2, m_t_ecr3, m_ttl
store 0 to m_pt_sss1, m_pt_sss2, m_pt_sss3, m_pt_med1, m_pt_med2,;
	m_pt_med3, m_pt_ecr1, m_pt_ecr2, m_pt_ecr3, m_pttl
store 0 to m_g_sss1, m_g_sss2, m_g_sss3, m_g_med1, m_g_med2, m_g_med3,;
	m_g_ecr1, m_g_ecr2, m_g_ecr3, m_gtl, m_g_grs1, m_g_grs2, m_g_grs3
m_fig='99999999.99'
sele master
if m_by_dep
	do whil .not. eof()
		if m_crow>58
			do p_qtrhead
		endi
		if ss_ee1+ss_er1+ss_ee2+ss_er2+ss_ee3+ss_er3+med_ee1+med_er1+med_ee2+med_er2+med_ee3+med_er3+ec_er1+ec_er2+ec_er3<=0
			skip
			loop
		endi
		m_dep_no=dep_no
		sele dept
		seek m_dep_no
		if .not. eof()
			m_dep_nm=dep_nm
		else
			m_dep_nm=''
		endi
		sele master
		if m_crow+3>58
			do p_qtrhead
		endi
		?
		?'Dept.No.: '+m_dep_no+' - '+m_dep_nm
		?
		m_crow=m_crow+3
		m_ctr=0
		do whil dep_no=m_dep_no .and. .not. eof()
			if m_crow+2>58
				do p_qtrhead
			endi
			if ss_ee1+ss_er1+ss_ee2+ss_er2+ss_ee3+ss_er3+med_ee1+med_er1+med_ee2+med_er2+med_ee3+med_er3+ec_er1+ec_er2+ec_er3<=0
				skip
				loop
			endi
			m_emp_no=alltrim(emp_no)+space(7-len(alltrim(emp_no)))
			m_emp_nm=alltrim(emp_nm)+space(34-len(alltrim(emp_nm)))
			?m_emp_no+m_emp_nm+sss+'  ';
				+tran(grs_ee1,m_fig)+tran(grs_ee2,m_fig)+tran(grs_ee3,m_fig);
				+'   '+tran(ss_ee1+ss_er1,m_fig)+tran(ss_ee2+ss_er2,m_fig);
				+tran(ss_ee3+ss_er3,m_fig)+'   '+tran(med_ee1+med_er1,m_fig);
				+tran(med_ee2+med_er2,m_fig)+tran(med_ee3+med_er3,m_fig)+'   ';
				+tran(ec_er1,m_fig)+tran(ec_er2,m_fig)+tran(ec_er3,m_fig)+'   ';
				+tran(ss_ee1+ss_er1+ss_ee2+ss_er2+ss_ee3+ss_er3+med_ee1+med_er1;
				+med_ee2+med_er2+med_ee3+med_er3+ec_er1+ec_er2+ec_er3,'999,999,999.99')
			m_crow=m_crow+1
			m_t_grs1=m_t_grs1+grs_ee1
			m_t_grs2=m_t_grs2+grs_ee2
			m_t_grs3=m_t_grs3+grs_ee3
			m_t_sss1=m_t_sss1+ss_ee1+ss_er1
			m_t_sss2=m_t_sss2+ss_ee2+ss_er2
			m_t_sss3=m_t_sss3+ss_ee3+ss_er3
			m_t_med1=m_t_med1+med_ee1+med_er1
			m_t_med2=m_t_med2+med_ee2+med_er2
			m_t_med3=m_t_med3+med_ee3+med_er3
			m_t_ecr1=m_t_ecr1+ec_er1
			m_t_ecr2=m_t_ecr2+ec_er2
			m_t_ecr3=m_t_ecr3+ec_er3
			m_ttl=m_ttl+ss_ee1+ss_er1+ss_ee2+ss_er2+ss_ee3+ss_er3;
				+med_ee1+med_er1+med_ee2+med_er2+med_ee3+med_er3;
				+ec_er1+ec_er2+ec_er3
			m_ctr=m_ctr+1
			skip
		enddo
		if m_ctr>0
			if m_crow+6>58
				do p_qtrhead
			endif
			?
			?repl('-',215)
			?spac(34)+'DEPARTMENT TOTAL...  ';
				+tran(m_t_grs1,m_fig)+tran(m_t_grs2,m_fig)+tran(m_t_grs3,m_fig);
				+'   '+tran(m_t_sss1,m_fig)+tran(m_t_sss2,m_fig)+tran(m_t_sss3,m_fig);
				+'   '+tran(m_t_med1,m_fig)+tran(m_t_med2,m_fig)+tran(m_t_med3,m_fig);
				+'   '+tran(m_t_ecr1,m_fig)+tran(m_t_ecr2,m_fig)+tran(m_t_ecr3,m_fig);
				+'   '+tran(m_ttl,'999,999,999.99')
			?repl('-',215)
			m_crow=m_crow+4
		endif
		m_g_grs1=m_g_grs1+m_t_grs1
		m_g_grs2=m_g_grs2+m_t_grs2
		m_g_grs3=m_g_grs3+m_t_grs3
		m_g_sss1=m_g_sss1+m_t_sss1
		m_g_sss2=m_g_sss2+m_t_sss2
		m_g_sss3=m_g_sss3+m_t_sss3
		m_g_med1=m_g_med1+m_t_med1
		m_g_med2=m_g_med2+m_t_med2
		m_g_med3=m_g_med3+m_t_med3
		m_g_ecr1=m_g_ecr1+m_t_ecr1
		m_g_ecr2=m_g_ecr2+m_t_ecr2
		m_g_ecr3=m_g_ecr3+m_t_ecr3
		m_gtl=m_gtl+m_ttl
		stor 0 to m_t_sss1, m_t_sss2, m_t_sss3, m_t_med1, m_t_med2,;
			m_t_med3, m_t_ecr1, m_t_ecr2, m_t_ecr3, m_ttl
	enddo
	if m_crow+3>58
		do p_qtrhead
	endi
	?spac(39)+'GRAND TOTAL...  ';
		+tran(m_g_grs1,m_fig)+tran(m_g_grs2,m_fig)+tran(m_g_grs3,m_fig);
		+'   '+tran(m_g_sss1,m_fig)+tran(m_g_sss2,m_fig)+tran(m_g_sss3,m_fig);
		+'   '+tran(m_g_med1,m_fig)+tran(m_g_med2,m_fig)+tran(m_g_med3,m_fig);
		+'   '+tran(m_g_ecr1,m_fig)+tran(m_g_ecr2,m_fig)+tran(m_g_ecr3,m_fig);
		+'   '+tran(m_gtl,'999,999,999.99')
	?repl('=',215)
	?
else
	do whil .not. eof()
		if m_crow>58
			do p_qtrhead
		endi
		if ss_ee1+ss_er1+ss_ee2+ss_er2+ss_ee3+ss_er3+med_ee1+med_er1+med_ee2+med_er2+med_ee3+med_er3+ec_er1+ec_er2+ec_er3<=0
			skip
			loop
		endi
		m_emp_nm=alltrim(emp_nm)+space(34-len(alltrim(emp_nm)))
		?space(7)+m_emp_nm+sss+'  ';
			+tran(grs_ee1,m_fig)+tran(grs_ee2,m_fig)+tran(grs_ee3,m_fig)+'   ';
			+tran(ss_ee1+ss_er1,m_fig)+tran(ss_ee2+ss_er2,m_fig);
			+tran(ss_ee3+ss_er3,m_fig)+'   '+tran(med_ee1+med_er1,m_fig);
			+tran(med_ee2+med_er2,m_fig)+tran(med_ee3+med_er3,m_fig)+'   ';
			+tran(ec_er1,m_fig)+tran(ec_er2,m_fig)+tran(ec_er3,m_fig)+'   ';
			+tran(ss_ee1+ss_er1+ss_ee2+ss_er2+ss_ee3+ss_er3+med_ee1+med_er1;
			+med_ee2+med_er2+med_ee3+med_er3+ec_er1+ec_er2+ec_er3,'999,999,999.99')
		m_crow=m_crow+1
		m_t_grs1=m_t_grs1+grs_ee1
		m_t_grs2=m_t_grs2+grs_ee2
		m_t_grs3=m_t_grs3+grs_ee3
		m_t_sss1=m_t_sss1+ss_ee1+ss_er1
		m_t_sss2=m_t_sss2+ss_ee2+ss_er2
		m_t_sss3=m_t_sss3+ss_ee3+ss_er3
		m_t_med1=m_t_med1+med_ee1+med_er1
		m_t_med2=m_t_med2+med_ee2+med_er2
		m_t_med3=m_t_med3+med_ee3+med_er3
		m_t_ecr1=m_t_ecr1+ec_er1
		m_t_ecr2=m_t_ecr2+ec_er2
		m_t_ecr3=m_t_ecr3+ec_er3
		m_ttl=m_ttl+ss_ee1+ss_er1+ss_ee2+ss_er2+ss_ee3+ss_er3;
			+med_ee1+med_er1+med_ee2+med_er2+med_ee3+med_er3;
			+ec_er1+ec_er2+ec_er3
		m_pt_grs1=m_pt_grs1+grs_ee1
		m_pt_grs2=m_pt_grs2+grs_ee2
		m_pt_grs3=m_pt_grs3+grs_ee3
		m_pt_sss1=m_pt_sss1+ss_ee1+ss_er1
		m_pt_sss2=m_pt_sss2+ss_ee2+ss_er2
		m_pt_sss3=m_pt_sss3+ss_ee3+ss_er3
		m_pt_med1=m_pt_med1+med_ee1+med_er1
		m_pt_med2=m_pt_med2+med_ee2+med_er2
		m_pt_med3=m_pt_med3+med_ee3+med_er3
		m_pt_ecr1=m_pt_ecr1+ec_er1
		m_pt_ecr2=m_pt_ecr2+ec_er2
		m_pt_ecr3=m_pt_ecr3+ec_er3
		m_pttl=m_pttl+ss_ee1+ss_er1+ss_ee2+ss_er2+ss_ee3+ss_er3;
			+med_ee1+med_er1+med_ee2+med_er2+med_ee3+med_er3;
			+ec_er1+ec_er2+ec_er3
		skip
		if m_crow+3>58 .or. eof()
			?
			?spac(39)+' PAGE TOTAL...  ';
				+tran(m_pt_grs1,m_fig)+tran(m_pt_grs2,m_fig)+tran(m_pt_grs3,m_fig);
				+'   '+tran(m_pt_sss1,m_fig)+tran(m_pt_sss2,m_fig)+tran(m_pt_sss3,m_fig);
				+'   '+tran(m_pt_med1,m_fig)+tran(m_pt_med2,m_fig)+tran(m_pt_med3,m_fig);
				+'   '+tran(m_pt_ecr1,m_fig)+tran(m_pt_ecr2,m_fig)+tran(m_pt_ecr3,m_fig);
				+'   '+tran(m_pttl,m_fig)
			?
			store 0 to m_pt_grs1, m_pt_grs2, m_pt_grs3
			store 0 to m_pt_sss1, m_pt_sss2, m_pt_sss3, m_pt_med1, m_pt_med2,;
				m_pt_med3, m_pt_ecr1, m_pt_ecr2, m_pt_ecr3, m_pttl
			m_crow=m_crow+3
		endif
	enddo
	if m_crow+3>58
		do p_qtrhead
	endi
	?repl('=',215)
	?spac(39)+'GRAND TOTAL...  ';
		+tran(m_t_grs1,m_fig)+tran(m_t_grs2,m_fig)+tran(m_t_grs3,m_fig);
		+'   '+tran(m_t_sss1,m_fig)+tran(m_t_sss2,m_fig)+tran(m_t_sss3,m_fig);
		+'   '+tran(m_t_med1,m_fig)+tran(m_t_med2,m_fig)+tran(m_t_med3,m_fig);
		+'   '+tran(m_t_ecr1,m_fig)+tran(m_t_ecr2,m_fig)+tran(m_t_ecr3,m_fig);
		+'   '+tran(m_ttl,'999,999,999.99')
	?repl('=',215)
	?
endif
return

proc p_reppbg
stor 0 to m_t_sss1, m_t_sss2, m_t_sss3, m_ttl
stor 0 to m_g_sss1, m_g_sss2, m_g_sss3, m_gtl
m_fig='99,999,999.99'
sele master
if m_by_dep
do whil .not. eof()
	if m_crow>58
		do p_qtrhead
	endi
	if pgbg_ee1+pgbg_er1+pgbg_ee2+pgbg_er2+pgbg_ee3+pgbg_er3<=0
		skip
		loop
	endi
	m_dep_no=dep_no
	sele dept
	seek m_dep_no
	if .not. eof()
		m_dep_nm=dep_nm
	else
		m_dep_nm=''
	endi
	sele master
	if m_crow+3>58
		do p_qtrhead
	endi
	?
	?'Dept.No.: '+m_dep_no+' - '+m_dep_nm
	?
	m_crow=m_crow+3
	m_ctr=0
	do whil dep_no=m_dep_no .and. .not. eof()
		if m_crow+2>58
			do p_qtrhead
		endi
		if pgbg_ee1+pgbg_er1+pgbg_ee2+pgbg_er2+pgbg_ee3+pgbg_er3<=0
			skip
			loop
		endi
		m_emp_no=alltrim(emp_no)+space(7-len(alltrim(emp_no)))
		m_emp_nm=alltrim(emp_nm)+space(34-len(alltrim(emp_nm)))
		?m_emp_no+m_emp_nm+alltrim(pgbg_no)+spac(18-len(alltrim(pgbg_no)));
			+tran(pgbg_ee1+pgbg_er1,m_fig)+'  '+tran(pgbg_ee2+pgbg_er2,m_fig);
			+'  '+tran(pgbg_ee3+pgbg_er3,m_fig)+spac(5);
			+tran(pgbg_ee1+pgbg_er1+pgbg_ee2+pgbg_er2+pgbg_ee3+pgbg_er3,'9'+m_fig)
		m_crow=m_crow+1
		m_t_sss1=m_t_sss1+pgbg_ee1+pgbg_er1
		m_t_sss2=m_t_sss2+pgbg_ee2+pgbg_er2
		m_t_sss3=m_t_sss3+pgbg_ee3+pgbg_er3
		m_ttl=m_ttl+pgbg_ee1+pgbg_er1+pgbg_ee2+pgbg_er2+pgbg_ee3+pgbg_er3
		m_ctr=m_ctr+1
		skip
	enddo
	if m_ctr>0
		if m_crow+6>58
			do p_qtrhead
		endi
		?
		?repl('-',124)
		?spac(38)+'DEPARTMENT TOTAL...  ';
			+tran(m_t_sss1,m_fig)+'  '+tran(m_t_sss2,m_fig);
			+'  '+tran(m_t_sss3,m_fig)+spac(5)+tran(m_ttl,'9'+m_fig)
		?repl('-',124)
		m_crow=m_crow+4
	endif
	m_g_sss1=m_g_sss1+m_t_sss1
	m_g_sss2=m_g_sss2+m_t_sss2
	m_g_sss3=m_g_sss3+m_t_sss3
	m_gtl=m_gtl+m_ttl
	stor 0 to m_t_sss1, m_t_sss2, m_t_sss3, m_ttl
enddo
if m_crow+3>58
	do p_qtrhead
endi
?spac(43)+'GRAND TOTAL...  ';
	+tran(m_g_sss1,m_fig)+'  '+tran(m_g_sss2,m_fig)+'  '+tran(m_g_sss3,m_fig);
	+spac(5)+tran(m_gtl,'9'+m_fig)
?repl('=',124)
?
else
do whil .not. eof()
	if m_crow>58
		do p_qtrhead
	endi
	if pgbg_ee1+pgbg_er1+pgbg_ee2+pgbg_er2+pgbg_ee3+pgbg_er3<=0
		skip
		loop
	endi
	m_emp_nm=alltrim(emp_nm)+space(34-len(alltrim(emp_nm)))
	?space(7)+m_emp_nm+alltrim(pgbg_no)+spac(18-len(alltrim(pgbg_no)));
		+tran(pgbg_ee1+pgbg_er1,m_fig)+'  '+tran(pgbg_ee2+pgbg_er2,m_fig);
		+'  '+tran(pgbg_ee3+pgbg_er3,m_fig)+spac(5);
		+tran(pgbg_ee1+pgbg_er1+pgbg_ee2+pgbg_er2+pgbg_ee3+pgbg_er3,'9'+m_fig)
	m_crow=m_crow+1
	m_t_sss1=m_t_sss1+pgbg_ee1+pgbg_er1
	m_t_sss2=m_t_sss2+pgbg_ee2+pgbg_er2
	m_t_sss3=m_t_sss3+pgbg_ee3+pgbg_er3
	m_ttl=m_ttl+pgbg_ee1+pgbg_er1+pgbg_ee2+pgbg_er2+pgbg_ee3+pgbg_er3
	skip
enddo
if m_crow+3>58
	do p_qtrhead
endi
?repl('=',124)
?spac(43)+'GRAND TOTAL...  ';
	+tran(m_t_sss1,m_fig)+'  '+tran(m_t_sss2,m_fig)+'  '+tran(m_t_sss3,m_fig);
	+spac(5)+tran(m_ttl,'9'+m_fig)
?repl('=',124)
?
endif
retu

proc p_reptax
stor 0 to m_t_sss1, m_t_sss2, m_t_sss3, m_ttl
stor 0 to m_g_sss1, m_g_sss2, m_g_sss3, m_gtl
m_fig='99,999,999.99'
sele master
if m_by_dep
do whil .not. eof()
	if m_crow>58
		do p_qtrhead
	endi
	if tax_ee1+tax_ee2+tax_ee3<=0
		skip
		loop
	endi
	m_dep_no=dep_no
	sele dept
	seek m_dep_no
	if .not. eof()
		m_dep_nm=dep_nm
	else
		m_dep_nm=''
	endi
	sele master
	if m_crow+3>58
		do p_qtrhead
	endi
	?
	?'Dept.No.: '+m_dep_no+' - '+m_dep_nm
	?
	m_crow=m_crow+3
	m_ctr=0
	do whil dep_no=m_dep_no .and. .not. eof()
		if m_crow+2>58
			do p_qtrhead
		endi
		if tax_ee1+tax_ee2+tax_ee3<=0
			skip
			loop
		endi
		m_emp_no=alltrim(emp_no)+space(7-len(alltrim(emp_no)))
		m_emp_nm=alltrim(emp_nm)+space(34-len(alltrim(emp_nm)))
		?m_emp_no+m_emp_nm+tan+'  '+subs(status,1,3)+spac(9);
			+tran(tax_ee1,m_fig)+'  '+tran(tax_ee2,m_fig)+'  '+tran(tax_ee3,m_fig);
			+spac(5)+tran(tax_ee1+tax_ee2+tax_ee3,'9'+m_fig)
		m_crow=m_crow+1
		m_t_sss1=m_t_sss1+tax_ee1
		m_t_sss2=m_t_sss2+tax_ee2
		m_t_sss3=m_t_sss3+tax_ee3
		m_ttl=m_ttl+tax_ee1+tax_ee2+tax_ee3
		m_ctr=m_ctr+1
		skip
	enddo
	if m_ctr>0
		if m_crow+6>58
			do p_qtrhead
		endi
		?
		?repl('-',131)
		?spac(45)+'DEPARTMENT TOTAL...  ';
			+tran(m_t_sss1,m_fig)+'  '+tran(m_t_sss2,m_fig);
			+'  '+tran(m_t_sss3,m_fig)+spac(5)+tran(m_ttl,'9'+m_fig)
		?repl('-',131)
		m_crow=m_crow+4
	endif
	m_g_sss1=m_g_sss1+m_t_sss1
	m_g_sss2=m_g_sss2+m_t_sss2
	m_g_sss3=m_g_sss3+m_t_sss3
	m_gtl=m_gtl+m_ttl
	stor 0 to m_t_sss1, m_t_sss2, m_t_sss3, m_ttl
enddo
if m_crow+3>58
	do p_qtrhead
endi
?spac(50)+'GRAND TOTAL...  ';
	+tran(m_g_sss1,m_fig)+'  '+tran(m_g_sss2,m_fig)+'  '+tran(m_g_sss3,m_fig);
	+spac(5)+tran(m_gtl,'9'+m_fig)
?repl('=',131)
?
else
do whil .not. eof()
	if m_crow>58
		do p_qtrhead
	endi
	if tax_ee1+tax_ee2+tax_ee3<=0
		skip
		loop
	endi
	m_emp_nm=alltrim(emp_nm)+space(34-len(alltrim(emp_nm)))
	?space(7)+m_emp_nm+tan+'  '+subs(status,1,3)+spac(9);
		+tran(tax_ee1,m_fig)+'  '+tran(tax_ee2,m_fig)+'  '+tran(tax_ee3,m_fig);
		+spac(5)+tran(tax_ee1+tax_ee2+tax_ee3,'9'+m_fig)
	m_crow=m_crow+1
	m_t_sss1=m_t_sss1+tax_ee1
	m_t_sss2=m_t_sss2+tax_ee2
	m_t_sss3=m_t_sss3+tax_ee3
	m_ttl=m_ttl+tax_ee1+tax_ee2+tax_ee3
	skip
enddo
if m_crow+3>58
	do p_qtrhead
endi
?repl('=',131)
?spac(50)+'GRAND TOTAL...  ';
	+tran(m_t_sss1,m_fig)+'  '+tran(m_t_sss2,m_fig)+'  '+tran(m_t_sss3,m_fig);
	+spac(5)+tran(m_ttl,'9'+m_fig)
?repl('=',131)
?
endif
retu

proc p_repsln
stor 0 to m_t_sss1, m_t_sss2, m_t_sss3, m_ttl
stor 0 to m_g_sss1, m_g_sss2, m_g_sss3, m_gtl
m_fig='99,999,999.99'
sele master
if m_by_dep
do whil .not. eof()
	if m_crow>58
		do p_qtrhead
	endi
	if sln_pay1+sln_pay2+sln_pay3<=0
		skip
		loop
	endi
	m_dep_no=dep_no
	sele dept
	seek m_dep_no
	if .not. eof()
		m_dep_nm=dep_nm
	else
		m_dep_nm=''
	endi
	sele master
	if m_crow+3>58
		do p_qtrhead
	endi
	?
	?'Dept.No.: '+m_dep_no+' - '+m_dep_nm
	?
	m_crow=m_crow+3
	m_ctr=0
	do whil dep_no=m_dep_no .and. .not. eof()
		if m_crow+2>58
			do p_qtrhead
		endi
		if sln_pay1+sln_pay2+sln_pay3<=0
			skip
			loop
		endi
		m_emp_no=alltrim(emp_no)+space(7-len(alltrim(emp_no)))
		m_emp_nm=alltrim(emp_nm)+space(34-len(alltrim(emp_nm)))
		?m_emp_no+m_emp_nm+sss+spac(6);
			+tran(sln_pay1,m_fig)+'  '+tran(sln_pay2,m_fig)+'  ';
			+tran(sln_pay3,m_fig)+spac(5);
			+tran(sln_pay1+sln_pay2+sln_pay3,'9'+m_fig)
		m_crow=m_crow+1
		m_t_sss1=m_t_sss1+sln_pay1
		m_t_sss2=m_t_sss2+sln_pay2
		m_t_sss3=m_t_sss3+sln_pay3
		m_ttl=m_ttl+sln_pay1+sln_pay2+sln_pay3
		m_ctr=m_ctr+1
		skip
	enddo
	if m_ctr>0
		if m_crow+6>58
			do p_qtrhead
		endi
		?
		?repl('-',124)
		?spac(38)+'DEPARTMENT TOTAL...  ';
			+tran(m_t_sss1,m_fig)+'  '+tran(m_t_sss2,m_fig);
			+'  '+tran(m_t_sss3,m_fig)+spac(5)+tran(m_ttl,'9'+m_fig)
		?repl('-',124)
		m_crow=m_crow+4
	endif
	m_g_sss1=m_g_sss1+m_t_sss1
	m_g_sss2=m_g_sss2+m_t_sss2
	m_g_sss3=m_g_sss3+m_t_sss3
	m_gtl=m_gtl+m_ttl
	stor 0 to m_t_sss1, m_t_sss2, m_t_sss3, m_ttl
enddo
if m_crow+3>58
	do p_qtrhead
endi
?spac(43)+'GRAND TOTAL...  ';
	+tran(m_g_sss1,m_fig)+'  '+tran(m_g_sss2,m_fig)+'  '+tran(m_g_sss3,m_fig);
	+spac(5)+tran(m_gtl,'9'+m_fig)
?repl('=',124)
?
else
do whil .not. eof()
	if m_crow>58
		do p_qtrhead
	endi
	if sln_pay1+sln_pay2+sln_pay3<=0
		skip
		loop
	endi
	m_emp_nm=alltrim(emp_nm)+space(34-len(alltrim(emp_nm)))
	?space(7)+m_emp_nm+sss+spac(6);
		+tran(sln_pay1,m_fig)+'  '+tran(sln_pay2,m_fig)+'  ';
		+tran(sln_pay3,m_fig)+spac(5);
		+tran(sln_pay1+sln_pay2+sln_pay3,'9'+m_fig)
	m_crow=m_crow+1
	m_t_sss1=m_t_sss1+sln_pay1
	m_t_sss2=m_t_sss2+sln_pay2
	m_t_sss3=m_t_sss3+sln_pay3
	m_ttl=m_ttl+sln_pay1+sln_pay2+sln_pay3
	skip
enddo
if m_crow+3>58
	do p_qtrhead
endi
?repl('=',124)
?spac(43)+'GRAND TOTAL...  ';
	+tran(m_t_sss1,m_fig)+'  '+tran(m_t_sss2,m_fig)+'  '+tran(m_t_sss3,m_fig);
	+spac(5)+tran(m_ttl,'9'+m_fig)
?repl('=',124)
?
endif
retu

proc p_repslf
m_crow=12
m_page=1
m_gtot_amt=0
m_spac1=spac(f_center(m_company,41))
m_spac2=spac(41-len(m_company)-len(m_spac1))
sele master
set orde to 2
go top
do whil .not. eof()
	?
	?
   ?
   ?
	?
   ?chr(27)+chr(33)+chr(40)
	??m_spac1+m_company+m_spac2+str(m_page,2)
	?spac(7)+m_comp_sss+spac(26)+str(m_quarter,1)
	?chr(27)+chr(33)+chr(4)
	?
   ?
   ?
	do whil m_crow<42 .and. .not. eof()
		m_tot_amt=sln_pay1+sln_pay2+sln_pay3
		m_slntrm=sln_trm
		if m_tot_amt=0
			skip
			loop
		endi
		?spac(5)+sss+spac(10)+Emp_nm+spac(15)+dtoc(l_date);
			+spac(5)+tran(sln_amt,'999,999.99')+spac(36);
			+tran(m_tot_amt,'999,999.99')
		m_gtot_amt=m_gtot_amt+m_tot_amt
		m_crow=m_crow+1  
		skip
		if m_crow=42 
			exit
		endi
	endd
	if eof()
		?spac(133)+repl('-',10)
		?spac(133)+tran(m_gtot_amt,'999,999.99')
		m_crow=m_crow+2
	endi
	if m_crow<42
		do whil m_crow<43
			m_crow=m_crow+1
			?
		endd
	endi
	?
	?
	?chr(27)+chr(33)+chr(8)
	?spac(79)+rtrim(m_comp_sign)
	?spac(79)+rtrim(m_compstit)
  	m_page=m_page+1
   m_crow=12
	?
	?
   ?
	?
	?
endd
retu

proc p_rephln
stor 0 to m_t_sss1, m_t_sss2, m_t_sss3, m_ttl
stor 0 to m_g_sss1, m_g_sss2, m_g_sss3, m_gtl
m_fig='99,999,999.99'
sele master
if m_by_dep
do whil .not. eof()
	if m_crow>58
		do p_qtrhead
	endi
	if hln_pay1+hln_pay2+hln_pay3<=0
		skip
		loop
	endi
	m_dep_no=dep_no
	sele dept
	seek m_dep_no
	if .not. eof()
		m_dep_nm=dep_nm
	else
		m_dep_nm=''
	endi
	sele master
	if m_crow+3>58
		do p_qtrhead
	endi
	?
	?'Dept.No.: '+m_dep_no+' - '+m_dep_nm
	?
	m_crow=m_crow+3
	m_ctr=0
	do whil dep_no=m_dep_no .and. .not. eof()
		if m_crow+2>58
			do p_qtrhead
		endi
		if hln_pay1+hln_pay2+hln_pay3<=0
			skip
			loop
		endi
		m_emp_no=alltrim(emp_no)+space(7-len(alltrim(emp_no)))
		m_emp_nm=alltrim(emp_nm)+space(34-len(alltrim(emp_nm)))
		?m_emp_no+m_emp_nm+alltrim(pgbg_no)+spac(18-len(alltrim(pgbg_no)));
			+tran(hln_pay1,m_fig)+'  '+tran(hln_pay2,m_fig)+'  ';
			+tran(hln_pay3,m_fig)+spac(5);
			+tran(hln_pay1+hln_pay2+hln_pay3,'9'+m_fig)
		m_crow=m_crow+1
		m_t_sss1=m_t_sss1+hln_pay1
		m_t_sss2=m_t_sss2+hln_pay2
		m_t_sss3=m_t_sss3+hln_pay3
		m_ttl=m_ttl+hln_pay1+hln_pay2+hln_pay3
		m_ctr=m_ctr+1
		skip
	enddo
	if m_ctr>0
		if m_crow+6>58
			do p_qtrhead
		endi
		?
		?repl('-',124)
		?spac(38)+'DEPARTMENT TOTAL...  ';
			+tran(m_t_sss1,m_fig)+'  '+tran(m_t_sss2,m_fig);
			+'  '+tran(m_t_sss3,m_fig)+spac(5)+tran(m_ttl,'9'+m_fig)
		?repl('-',124)
		m_crow=m_crow+4
	endif
	m_g_sss1=m_g_sss1+m_t_sss1
	m_g_sss2=m_g_sss2+m_t_sss2
	m_g_sss3=m_g_sss3+m_t_sss3
	m_gtl=m_gtl+m_ttl
	stor 0 to m_t_sss1, m_t_sss2, m_t_sss3, m_ttl
enddo
if m_crow+3>58
	do p_qtrhead
endi
?spac(43)+'GRAND TOTAL...  ';
	+tran(m_g_sss1,m_fig)+'  '+tran(m_g_sss2,m_fig)+'  '+tran(m_g_sss3,m_fig);
	+spac(5)+tran(m_gtl,'9'+m_fig)
?repl('=',124)
?
else
do whil .not. eof()
	if m_crow>58
		do p_qtrhead
	endi
	if hln_pay1+hln_pay2+hln_pay3<=0
		skip
		loop
	endi
	m_emp_nm=alltrim(emp_nm)+space(34-len(alltrim(emp_nm)))
	?space(7)+m_emp_nm+alltrim(pgbg_no)+spac(18-len(alltrim(pgbg_no)));
		+tran(hln_pay1,m_fig)+'  '+tran(hln_pay2,m_fig)+'  ';
		+tran(hln_pay3,m_fig)+spac(5);
		+tran(hln_pay1+hln_pay2+hln_pay3,'9'+m_fig)
	m_crow=m_crow+1
	m_t_sss1=m_t_sss1+hln_pay1
	m_t_sss2=m_t_sss2+hln_pay2
	m_t_sss3=m_t_sss3+hln_pay3
	m_ttl=m_ttl+hln_pay1+hln_pay2+hln_pay3
	skip
enddo
if m_crow+3>58
	do p_qtrhead
endi
?repl('=',124)
?spac(43)+'GRAND TOTAL...  ';
	+tran(m_t_sss1,m_fig)+'  '+tran(m_t_sss2,m_fig)+'  '+tran(m_t_sss3,m_fig);
	+spac(5)+tran(m_ttl,'9'+m_fig)
?repl('=',124)
?
endif
retu

proc p_qtrhead
m_page=m_page+1
if m_page>1
	?chr(12)
endi
?m_company
?'Business Address : '+ltrim(m_comp_addr)
?'Company SSS I.D. NO. : '+m_comp_sss
do case
	case m_qtrrep=1
		?'QUARTERLY SSS, MEDICARE, EC & MATERNITY REPORT'
		?'For the '+m_cquarter
		?
		?alltrim(m_head)+spac(30-len(alltrim(m_head)))+spac(177)+'Page '+str(m_page,3)
		?repl('=',215)
		?'                                                      |-----GROSS COMPENSATION INCOME-----|-------------S---S---S-------------|-------------MEDICARE--------------|----------EC & MATERNITY-----------|               |'
		if m_by_dep
		?'EMP#   EMPLOYEE NAME                     SSS NUMBER   |  '+m_mn1+'  '+m_mn2+'  '+m_mn3+'  |  '+m_mn1+'  '+m_mn2+'  '+m_mn3+'  |  '+m_mn1+'  '+m_mn2+'  '+m_mn3+'  |  '+m_mn1+'  '+m_mn2+'  '+m_mn3+'  |    TOTAL      |'
		else
		?'       EMPLOYEE NAME                     SSS NUMBER   |  '+m_mn1+'  '+m_mn2+'  '+m_mn3+'  |  '+m_mn1+'  '+m_mn2+'  '+m_mn3+'  |  '+m_mn1+'  '+m_mn2+'  '+m_mn3+'  |  '+m_mn1+'  '+m_mn2+'  '+m_mn3+'  |    TOTAL      |'		
		endif
	   * 1234   12345678901234567890123456789012  123456789012  99999999.9999999999.9999999999.99   99999999.9999999999.9999999999.99   99999999.9999999999.9999999999.99   999,999,999.99
		?repl('=',215)
	case m_qtrrep=2
		?'QUARTERLY PAG-IBIG REPORT'
		?'For the '+m_cquarter
		?
		?alltrim(m_head)+spac(30-len(alltrim(m_head)))+spac(86)+'Page '+str(m_page,3)
		?repl('=',124)
		?'                                                        |-------------- PAG-IBIG PREMIUM ---------------|                  |'
		if m_by_dep
			?'EMP#   EMPLOYEE NAME                     PAG-IBIG NO.   |      '+m_mn1+'      '+m_mn2+'      '+m_mn3+'  |      TOTAL       |'
		else
			?'       EMPLOYEE NAME                     PAG-IBIG NO.   |      '+m_mn1+'      '+m_mn2+'      '+m_mn3+'  |      TOTAL       |'
		endif
		?repl('=',124)
	case m_qtrrep=3
		?'QUARTERLY WITHHOLDING TAX REPORT'
		?'For the '+m_cquarter
		?
		?alltrim(m_head)+spac(30-len(alltrim(m_head)))+spac(93)+'Page '+str(m_page,3)
		?repl('=',131)
		?'                                                               |--------------- WITHHOLDING TAX ---------------|                  |'
		if m_by_dep
			?'EMP#   EMPLOYEE NAME                     T I N        STATUS   |      '+m_mn1+'      '+m_mn2+'      '+m_mn3+'  |      TOTAL       |'
		else
			?'       EMPLOYEE NAME                     T I N        STATUS   |      '+m_mn1+'      '+m_mn2+'      '+m_mn3+'  |      TOTAL       |'		
		endif
		* 1234   12345678901234567890123456789012  999-999-999  132         99,999,999.99  99,999,999.99  99,999,999.99     999,999,999.99 
		?repl('=',131)
	case m_qtrrep=4
		?'QUARTERLY SSS LOAN PAYMENTS'
		?'For the '+m_cquarter
		?
		?alltrim(m_head)+spac(30-len(alltrim(m_head)))+spac(86)+'Page '+str(m_page,3)
		?repl('=',124)
		?'                                                        |--------------- P A Y M E N T S ---------------|      TOTAL       |'
		if m_by_dep
			?'EMP#   EMPLOYEE NAME                     SSS NUMBER     |      '+m_mn1+'      '+m_mn2+'      '+m_mn3+'  |      PAYMENT     |'
		else
			?'       EMPLOYEE NAME                     SSS NUMBER     |      '+m_mn1+'      '+m_mn2+'      '+m_mn3+'  |      PAYMENT     |'
		endif
		   * 1234   12345678901234567890123456789012  999-999-9991      99,999,999.99  99,999,999.99  99,999,999.99     999,999,999.99

		?repl('=',124)
	case m_qtrrep=6
		?'QUARTERLY PAG-IBIG LOAN PAYMENTS'
		?'For the '+m_cquarter
		?
		?alltrim(m_head)+spac(30-len(alltrim(m_head)))+spac(86)+'Page '+str(m_page,3)
		?repl('=',124)
		?'                                                        |--------------- P A Y M E N T S ---------------|      TOTAL       |'
		if m_by_dep
			?'EMP#   EMPLOYEE NAME                     PAG-IBIG NO.   |      '+m_mn1+'      '+m_mn2+'      '+m_mn3+'  |      PAYMENT     |'
		else
			?'       EMPLOYEE NAME                     PAG-IBIG NO.   |      '+m_mn1+'      '+m_mn2+'      '+m_mn3+'  |      PAYMENT     |'
		endif
		   * 1234   12345678901234567890123456789012  999-999-9991      99,999,999.99  99,999,999.99  99,999,999.99     999,999,999.99
		?repl('=',124)
endc
m_crow=8
m_nextpg=.f.
retu
