* PAYROLL SYSTEM
* Program Name : Monthly Payroll Recapitulation
* Program Code : Rppaymon.prg
* Author       : SVC
* Date Started : June 17, 1994
* Date Finished: June 17, 1994
******************************************************

m_oldcol=setcolor()
set colo to (m_cnor)
do whil .t.
   f_bcln()
	m_spool=.t.
	m_page=0
	m_crow=60
	m_fig='9,999,999.99'
	m_tig='999999999.99'
	f_setting()
	sele 1
	if .not. net_use('&dpath\sys_id',.t.,5)
		exit
	endi
	if .not. fil_lock(5)
		exit
	endi
	m_pres_mo=cmonth(ctod(subs(str(100+pres_mo,3),2,2)+'/01/'+subs(str(year(end_date),4),3,2)))
	m_pres_yr=str(year(beg_date),4)
	sele 2
	if .not. net_use('&dpath\dept',.t.,5)
		exit
	endi
	set inde to &dpath\dbydep
	if .not. fil_lock(5)
		exit
	endi
	reindex
	if f_ask('All Departments in One Page ?')
		m_onepage=.t.
	else
		m_onepage=.f.
	endif
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
	stor 0 to m_t_basic, m_t_hol, m_t_ot, m_t_lv, m_t_ls, m_t_pay1, m_t_pay2,;
		m_t_pay3, m_t_pay4, m_t_sse, m_t_ssr, m_t_mede, m_t_medr, m_t_pgee, m_t_pger,;
		m_t_ecer, m_t_grs, m_t_tax, m_t_sln, m_t_hln, m_t_ded1, m_t_ded2,;
		m_t_ded3, m_t_ded4, m_t_ded5, m_t_ded6, m_t_ded7, m_t_ded8,	m_t_ded9,;
		m_t_ded10, m_tl_ded, m_t_net, m_t_emp, m_t_cal, m_t_comp, m_t_comd
	sele dept
	go top
	if m_onepage
		do p_dsumone
	else
		do p_dsuminv
	endif
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
endd
clos all
set colo to (m_oldcol)
rele all
retu

proc p_dephead
m_page=m_page+1
if m_page>1
	?chr(12)
endi
?m_company
?'MONTHLY SUMMARY OF EARNINGS AND DEDUCTIONS'
?'For the month of '+m_pres_mo+' '+m_pres_yr
?
?alltrim(m_head)+spac(30-len(alltrim(m_head)))+spac(41)+'Page '+str(m_page,3)
?m_dep_no+' - '+m_dep_nm
?repl('=',79)
m_crow=7
retu

procedure p_dsuminv
do whil .not. eof()
	m_dep_no=dep_no
	m_dep_nm=dep_nm
	do p_dephead
	?'     TOTAL BASIC PAY..................................    '+tran(reg_pay,m_fig)
	?'     TOTAL OVERTIME PAY...............................    '+tran(ot_pay,m_fig)
	?'     TOTAL HOLIDAY PAY................................    '+tran(hol_pay,m_fig)
	?'     TOTAL ENCASHED VACATION LEAVE PAY................    '+tran(lvenc_pay,m_fig)
	?'     TOTAL ENCASHED SICK LEAVE PAY....................    '+tran(lsenc_pay,m_fig)
	?'     TOTAL TAXABLE PAY 1..............................    '+tran(oth_pay1,m_fig)
	?'     TOTAL TAXABLE PAY 2..............................    '+tran(oth_pay3,m_fig)
	?'     TOTAL NON-TAXABLE PAY ...........................    '+tran(oth_pay2,m_fig)
	?'     TOTAL NON-TAXABLE PAY 2..........................    '+tran(oth_pay4,m_fig)
	?'     TOTAL GROSS PAY..................................    '+tran(grs_pay,m_fig)
	?'     TOTAL TAX WITHHELD...............................    '+tran(tax,m_fig)
	?"     TOTAL SSS PREMIUM ('EE)..........................    "+tran(sss_ee,m_fig)
	?"     TOTAL SSS PREMIUM ('ER)..........................    "+tran(sss_er,m_fig)
	?"     TOTAL MEDICARE    ('EE)..........................    "+tran(med_ee,m_fig)
	?"     TOTAL MEDICARE    ('ER)..........................    "+tran(med_er,m_fig)
	?"     TOTAL PAG-IBIG    ('EE)..........................    "+tran(pgbg_ee,m_fig)
	?"     TOTAL PAG-IBIG    ('ER)..........................    "+tran(pgbg_er,m_fig)
	?"     TOTAL EC          ('ER)..........................    "+tran(ec_er,m_fig)
	?'     TOTAL '+m_rt_ln1+' DEDUCTIONS......................    '+tran(sss_loan,m_fig)
	?'     TOTAL '+m_rt_ln2+' DEDUCTIONS......................    '+tran(cal_loan,m_fig)
	?'     TOTAL '+m_rt_ln3+' DEDUCTIONS......................    '+tran(pbg_loan,m_fig)
	?'     TOTAL '+m_rt_ln4+' DEDUCTIONS......................    '+tran(comp_loan,m_fig)
	?'     TOTAL '+m_rt_ln5+' DEDUCTIONS......................    '+tran(commodloan,m_fig)
	?'     TOTAL '+m_st_ded1 +'.............................    '+tran(oth_ded1,m_fig)
	?'     TOTAL '+m_st_ded2 +'.............................    '+tran(oth_ded2,m_fig)
	?'     TOTAL '+m_st_ded3 +'.............................    '+tran(oth_ded3,m_fig)
	?'     TOTAL '+m_st_ded4 +'.............................    '+tran(oth_ded4,m_fig)
	?'     TOTAL '+m_st_ded5 +'.............................    '+tran(oth_ded5,m_fig)
	?'     TOTAL '+m_st_ded6 +'.............................    '+tran(oth_ded6,m_fig)
	?'     TOTAL '+m_st_ded7 +'.............................    '+tran(oth_ded7,m_fig)
	?'     TOTAL '+m_st_ded8 +'.............................    '+tran(oth_ded8,m_fig)
	?'     TOTAL '+m_st_ded9 +'.............................    '+tran(oth_ded9,m_fig)
	?'     TOTAL '+m_st_ded10+'.............................    '+tran(oth_ded10,m_fig)
	?'     NO. OF EMPLOYEES.................................    '+tran(emp_ctr,m_fig)
	?repl('=',79)
	?'     N  E  T       P  A  Y............................    '+tran(net_pay,m_fig)
	m_t_basic=m_t_basic+reg_pay
	m_t_ot=m_t_ot+ot_pay
	m_t_hol=m_t_hol+hol_pay
	m_t_pay1=m_t_pay1+oth_pay1
	m_t_pay2=m_t_pay2+oth_pay2
	m_t_pay3=m_t_pay3+oth_pay3
	m_t_pay4=m_t_pay4+oth_pay4
	m_t_lv=m_t_lv+lvenc_pay
	m_t_ls=m_t_ls+lsenc_pay
	m_t_grs=m_t_grs+grs_pay
	m_t_tax=m_t_tax+tax
	m_t_sse=m_t_sse+sss_ee
	m_t_ssr=m_t_ssr+sss_er
	m_t_mede=m_t_mede+med_ee
	m_t_medr=m_t_medr+med_er
	m_t_pgee=m_t_pgee+pgbg_ee
	m_t_pger=m_t_pger+pgbg_er
	m_t_ecer=m_t_ecer+ec_er
	m_t_sln=m_t_sln+sss_loan
	m_t_hln=m_t_hln+pbg_loan
	m_t_cal=m_t_cal+cal_loan
	m_t_comp=m_t_comp+comp_loan
	m_t_comd=m_t_comd+commodloan
	m_t_ded1=m_t_ded1+oth_ded1
	m_t_ded2=m_t_ded2+oth_ded2
	m_t_ded3=m_t_ded3+oth_ded3
	m_t_ded4=m_t_ded4+oth_ded4
	m_t_ded5=m_t_ded5+oth_ded5
	m_t_ded6=m_t_ded6+oth_ded6
	m_t_ded7=m_t_ded7+oth_ded7
	m_t_ded8=m_t_ded8+oth_ded8
	m_t_ded9=m_t_ded9+oth_ded9
	m_t_ded10=m_t_ded10+oth_ded10
	m_t_net=m_t_net+net_pay
	m_t_emp=m_t_emp+emp_ctr
   skip
endd
m_dep_no='00'
m_dep_nm='ALL DEPARTMENTS'
do p_dephead
?'     TOTAL BASIC PAY..................................    '+tran(m_t_basic,m_fig)
?'     TOTAL OVERTIME PAY...............................    '+tran(m_t_ot,m_fig)
?'     TOTAL HOLIDAY PAY................................    '+tran(m_t_hol,m_fig)
?'     TOTAL ENCASHED VACATION LEAVE PAY................    '+tran(m_t_lv,m_fig)
?'     TOTAL ENCASHED SICK LEAVE PAY....................    '+tran(m_t_ls,m_fig)
?'     TOTAL TAXABLE PAY 1..............................    '+tran(m_t_pay1,m_fig)
?'     TOTAL TAXABLE PAY 2..............................    '+tran(m_t_pay3,m_fig)
?'     TOTAL NON-TAXABLE PAY ...........................    '+tran(m_t_pay2,m_fig)
?'     TOTAL NON-TAXABLE PAY 2..........................    '+tran(m_t_pay4,m_fig)
?'     TOTAL GROSS PAY..................................    '+tran(m_t_grs,m_fig)
?'     TOTAL TAX WITHHELD...............................    '+tran(m_t_tax,m_fig)
?"     TOTAL SSS PREMIUM ('EE)..........................    "+tran(m_t_sse,m_fig)
?"     TOTAL SSS PREMIUM ('ER)..........................    "+tran(m_t_ssr,m_fig)
?"     TOTAL MEDICARE    ('EE)..........................    "+tran(m_t_mede,m_fig)
?"     TOTAL MEDICARE    ('ER)..........................    "+tran(m_t_medr,m_fig)
?"     TOTAL PAG-IBIG    ('EE)..........................    "+tran(m_t_pgee,m_fig)
?"     TOTAL PAG-IBIG    ('ER)..........................    "+tran(m_t_pger,m_fig)
?"     TOTAL EC          ('ER)..........................    "+tran(m_t_ecer,m_fig)
?'     TOTAL '+m_rt_ln1+' DEDUCTIONS......................    '+tran(m_t_sln,m_fig)
?'     TOTAL '+m_rt_ln2+' DEDUCTIONS......................    '+tran(m_t_cal,m_fig)
?'     TOTAL '+m_rt_ln3+' DEDUCTIONS......................    '+tran(m_t_hln,m_fig)
?'     TOTAL '+m_rt_ln4+' DEDUCTIONS......................    '+tran(m_t_comp,m_fig)
?'     TOTAL '+m_rt_ln5+' DEDUCTIONS......................    '+tran(m_t_comd,m_fig)
?'     TOTAL '+m_st_ded1 +'.............................    '+tran(m_t_ded1,m_fig)
?'     TOTAL '+m_st_ded2 +'.............................    '+tran(m_t_ded2,m_fig)
?'     TOTAL '+m_st_ded3 +'.............................    '+tran(m_t_ded3,m_fig)
?'     TOTAL '+m_st_ded4 +'.............................    '+tran(m_t_ded4,m_fig)
?'     TOTAL '+m_st_ded5 +'.............................    '+tran(m_t_ded5,m_fig)
?'     TOTAL '+m_st_ded6 +'.............................    '+tran(m_t_ded6,m_fig)
?'     TOTAL '+m_st_ded7 +'.............................    '+tran(m_t_ded7,m_fig)
?'     TOTAL '+m_st_ded8 +'.............................    '+tran(m_t_ded8,m_fig)
?'     TOTAL '+m_st_ded9 +'.............................    '+tran(m_t_ded9,m_fig)
?'     TOTAL '+m_st_ded10+'.............................    '+tran(m_t_ded10,m_fig)
?'     NO. OF EMPLOYEES.................................    '+tran(m_t_emp,m_fig)
?repl('=',79)
?'     N  E  T       P  A  Y............................    '+tran(m_t_net,m_fig)
return


procedure p_dsumone
m_columns=33+((recc()+1)*12)
m_page=1
do while .t.
	?m_company
	?'MONTHLY SUMMARY OF EARNINGS AND DEDUCTIONS'
	?'For the month of '+m_pres_mo+' '+m_pres_yr
	?
	?alltrim(m_head)+spac(30-len(alltrim(m_head)))+space(m_columns-38)+'Page '+str(m_page,3)
	?
	?repl('=',m_columns)
	?'DEPARTMENT NO..................  '
	go top
	do while .not. eof()
		??space(10)+dep_no
		skip
	enddo
	??'    TOTAL'
	?repl('=',m_columns)
	?
	?'TOTAL BASIC PAY................  '
	do p_depinv with 'reg_pay'
	?'TOTAL OVERTIME PAY.............  '
	do p_depinv with 'ot_pay'
	?'TOTAL HOLIDAY PAY..............  '
	do p_depinv with 'hol_pay'
	?'TOTAL ENCASHED VAC. LEAVE PAY..  '
	do p_depinv with 'lvenc_pay'
	?'TOTAL ENCASHED SICK LEAVE PAY..  '
	do p_depinv with 'lsenc_pay'
	?'TOTAL TAXABLE PAY 1............  '
	do p_depinv with 'oth_pay1'
	?'TOTAL TAXABLE PAY 2............  '
	do p_depinv with 'oth_pay3'
	?'TOTAL NON-TAXABLE PAY .........  '
	do p_depinv with 'oth_pay2'
	*?'TOTAL NON-TAXABLE PAY 2........  '
	*do p_depinv with 'oth_pay4'
	?'TOTAL GROSS PAY................  '
	do p_depinv with 'grs_pay'
	?'TOTAL TAX WITHHELD.............  '
	do p_depinv with 'tax'
	?"TOTAL SSS PREMIUM ('EE)........  "
	do p_depinv with 'sss_ee'
	?"TOTAL SSS PREMIUM ('ER)........  "
	do p_depinv with 'sss_er'
	?"TOTAL MEDICARE    ('EE)........  "
	do p_depinv with 'med_ee'
	?"TOTAL MEDICARE    ('ER)........  "
	do p_depinv with 'med_er'
	?"TOTAL PAG-IBIG    ('EE)........  "
	do p_depinv with 'pgbg_ee'
	?"TOTAL PAG-IBIG    ('ER)........  "
	do p_depinv with 'pgbg_er'
	?"TOTAL EC          ('ER)........  "
	do p_depinv with 'ec_er'
	?'TOTAL '+m_rt_ln1+' DEDUCTIONS....  '
	do p_depinv with 'sss_loan'
	?'TOTAL '+m_rt_ln2+' DEDUCTIONS....  '
	do p_depinv with 'cal_loan'
	?'TOTAL '+m_rt_ln3+' DEDUCTIONS....  '
	do p_depinv with 'pbg_loan'
	?'TOTAL '+m_rt_ln4+' DEDUCTIONS....  '
	do p_depinv with 'comp_loan'
	?'TOTAL '+m_rt_ln5+' DEDUCTIONS....  '
	do p_depinv with 'commodloan'
	?'TOTAL '+m_st_ded1 +'...........  '
	do p_depinv with 'oth_ded1'
	?'TOTAL '+m_st_ded2 +'...........  '
	do p_depinv with 'oth_ded2'
	?'TOTAL '+m_st_ded3 +'...........  '
	do p_depinv with 'oth_ded3'
	?'TOTAL '+m_st_ded4 +'...........  '
	do p_depinv with 'oth_ded4'
	?'TOTAL '+m_st_ded5 +'...........  '
	do p_depinv with 'oth_ded5'
	?'TOTAL '+m_st_ded6 +'...........  '
	do p_depinv with 'oth_ded6'
	?'TOTAL '+m_st_ded7 +'...........  '
	do p_depinv with 'oth_ded7'
	?'TOTAL '+m_st_ded8 +'...........  '
	do p_depinv with 'oth_ded8'
	?'TOTAL '+m_st_ded9 +'...........  '
	do p_depinv with 'oth_ded9'
	?'TOTAL '+m_st_ded10+'...........  '
	do p_depinv with 'oth_ded10'
	?'NO. OF EMPLOYEES...............  '
	do p_depinv with 'emp_ctr'
	?repl('=',m_columns)
	?'N  E  T      P  A  Y...........  '
	do p_depinv with 'net_pay'
	?
   exit
endd
return

proc p_depinv
para _m_field_nm
_m_ttl=0
select dept
go top
do while .not. eof()
	??tran(&_m_field_nm,m_fig)
	_m_ttl=_m_ttl+&_m_field_nm
	skip
enddo
??tran(_m_ttl,m_fig)
return
