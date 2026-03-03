* PAYROLL SYSTEM
* Program Name : Yearly Payroll Recapitulation
* Program Code : Rpmonrec.prg
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
	m_fig='999,999,999.99'
	m_tig='999,999,999.99'
	m_spc=spac(4)
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
	if .not. net_use('&dpath\master',.t.,5)
		exit
	endi
	set inde to &dpath\mbydep
	rein
	go top
	sele 3
	if .not. net_use('&dpath\dept',.t.,5)
		exit
	endi
	set inde to &dpath\dbydep
	rein
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
	sele dept
	repl all reg_pay with 0, ot_pay with 0, hol_pay with 0, oth_pay1 with 0,;
		oth_pay2 with 0, oth_pay3 with 0, lvenc_pay with 0, lsenc_pay with 0,;
		grs_pay with 0, tax with 0, sss_ee with 0, sss_er with 0, med_ee with 0,;
		med_er with 0, pgbg_ee with 0, pgbg_er with 0, ec_er with 0,;
		sss_loan with 0, pbg_loan with 0, oth_ded1 with 0, oth_ded2 with 0,;
		oth_ded3 with 0, oth_ded4 with 0, oth_ded5 with 0, oth_ded6 with 0,;
		oth_ded7 with 0, oth_ded8 with 0, oth_ded9 with 0, oth_ded10 with 0,;
	 	net_pay with 0, emp_ctr with 0
	stor 0 to m_t_basic, m_t_hol, m_t_ot, m_t_lv, m_t_ls, m_t_pay1, m_t_pay2,;
		m_t_pay3, m_t_grs, m_t_tax, m_t_sln, m_t_hln, m_t_ded1, m_t_ded2,;
		m_t_ded3, m_t_ded4, m_t_ded5, m_t_ded6, m_t_ded7, m_t_ded8,	m_t_ded9,;
		m_t_ded10, m_tl_ded, m_t_net, m_t_cal, m_t_comp, m_t_comd
	stor 0 to m_g_basic, m_g_hol, m_g_ot, m_g_lv, m_g_ls, m_g_pay1, m_g_pay2,;
		m_g_pay3, m_g_grs, m_g_tax, m_g_sln, m_g_hln, m_g_ded1, m_g_ded2,;
		m_g_ded3, m_g_ded4, m_g_ded5, m_g_ded6, m_g_ded7, m_g_ded8,	m_g_ded9,;
		m_g_ded10, m_gl_ded, m_g_net,  m_g_cal, m_g_comp, m_g_comd
	sele master
	do whil .not. eof()
		if m_crow>58
			do p_yerhead
		endi
		if y_gross<=0
			skip
			loop
		endi
		m_dep_no=dep_no
		sele dept
		seek m_dep_no
		if foun()
			m_dep_nm=dep_nm
		else
			m_dep_nm=''
		endi
		sele master
		if m_crow+3>58
			do p_yerhead
		endi
		?
		?'Dept.No.: '+m_dep_no+' - '+m_dep_nm
		?
		m_crow=m_crow+3
		do whil dep_no=m_dep_no .and. .not. eof()
			if m_crow+2>58
				do p_yerhead
			endi
			if y_gross<=0
				skip
				loop
			endi
			m_emp_no=alltrim(emp_no)+space(6-len(alltrim(emp_no)))
			?m_emp_no+' '+emp_nm+' '+tran(y_basic,m_fig);
				+tran(y_hol,m_fig)+tran(m_ot,m_fig)+tran(y_leave+y_leave2,m_fig);
				+tran(y_sleave,m_fig)+tran(y_othp1,m_fig)+tran(y_othp3,m_fig);
				+tran(y_othp2,m_fig)+tran(y_sln,m_fig)+tran(y_sscal,m_fig);
				+tran(y_hln,m_fig)+' '+tran(y_gross,m_fig);
				+' '+tran(y_tded,m_fig)+' '+tran(y_netpay,m_fig)
			?spac(40)+tran(y_coln,m_fig)+tran(y_comln,m_fig);
				+tran(y_ded1,m_fig)+tran(y_ded2,m_fig)+tran(y_ded3,m_fig);
				+tran(y_ded4,m_fig)+tran(y_ded5,m_fig)+tran(y_ded6,m_fig);
				+tran(y_ded7,m_fig)+' '+tran(y_ded8,m_fig)+' '+tran(y_ded9,m_fig);
				+' '+tran(y_ded10,m_fig)
			m_crow=m_crow+2
			m_t_basic=m_t_basic+y_basic
			m_t_hol=m_t_hol+y_hol
			m_t_ot=m_t_ot+y_ot
			m_t_lv=m_t_lv+y_leave+y_leave2
			m_t_ls=m_t_ls+y_sleave
			m_t_pay1=m_t_pay1+y_othp1
			m_t_pay2=m_t_pay2+y_othp2
			m_t_pay3=m_t_pay3+y_othp3
			m_t_tax=m_t_tax+y_tax
			m_t_grs=m_t_grs+y_gross
			m_tl_ded=m_tl_ded+y_tded
			m_t_net=m_t_net+y_netpay
			m_t_sln=m_t_sln+y_sln
			m_t_hln=m_t_hln+y_hln
			m_t_cal=m_t_cal+y_sscal
			m_t_comp=m_t_comp+y_coln
			m_t_comd=m_t_comd+y_comln
			m_t_ded1=m_t_ded1+y_ded1
			m_t_ded2=m_t_ded2+y_ded2
			m_t_ded3=m_t_ded3+y_ded3
			m_t_ded4=m_t_ded4+y_ded4
			m_t_ded5=m_t_ded5+y_ded5
			m_t_ded6=m_t_ded6+y_ded6
			m_t_ded7=m_t_ded7+y_ded7
			m_t_ded8=m_t_ded8+y_ded8
			m_t_ded9=m_t_ded9+y_ded9
			m_t_ded10=m_t_ded10+y_ded10

			skip
			if dep_no#m_dep_no
				if m_crow+6>58
					do p_yerhead
				endi
				?
				?repl('-',239)
				?spac(19)+'DEPARTMENT TOTAL...  ';
					+tran(m_t_basic,m_tig)+tran(m_t_hol,m_tig)+tran(m_t_ot,m_tig);
					+tran(m_t_lv,m_tig)+tran(m_t_ls,m_tig)+tran(m_t_pay1,m_tig);
					+tran(m_t_pay2,m_tig)+tran(m_t_pay3,m_tig)+tran(m_t_tax,m_tig);
					+tran(m_t_sln,m_tig)+tran(m_t_cal,m_tig)+tran(m_t_hln,m_tig);
					+' '+tran(m_t_grs,m_tig)+' '+tran(m_gl_ded,m_tig)+' '+tran(m_t_net,m_tig)
				?spac(40)+tran(m_t_comp,m_tig)+tran(m_t_comd,m_tig)+tran(m_t_ded1,m_tig);
					+tran(m_t_ded2,m_tig)+tran(m_t_ded3,m_tig)+tran(m_t_ded4,m_tig);
					+tran(m_t_ded5,m_tig)+tran(m_t_ded6,m_tig)+tran(m_t_ded7,m_tig);
					+' '+tran(m_t_ded8,m_tig)+' '+tran(m_t_ded9,m_tig)+' '+tran(m_t_ded10,m_tig)
				?repl('-',239)
				m_crow=m_crow+6
				m_g_basic=m_g_basic+m_t_basic
				m_g_hol=m_g_hol+m_t_hol
				m_g_ot=m_g_ot+m_t_ot
				m_g_lv=m_g_lv+m_t_lv
				m_g_ls=m_g_ls+m_t_ls
				m_g_pay1=m_g_pay1+m_t_pay1
				m_g_pay2=m_g_pay2+m_t_pay2
				m_g_pay3=m_g_pay3+m_t_pay3
				m_g_grs=m_g_grs+m_t_grs
				m_g_tax=m_g_tax+m_t_tax
				m_g_sln=m_g_sln+m_t_sln
				m_g_hln=m_g_hln+m_t_hln
				m_g_cal=m_g_cal+m_t_cal
				m_g_comp=m_g_comp+m_t_comp
				m_g_comd=m_g_comd+m_t_comd
				m_g_ded1=m_g_ded1+m_t_ded1
				m_g_ded2=m_g_ded2+m_t_ded2
				m_g_ded3=m_g_ded3+m_t_ded3
				m_g_ded4=m_g_ded4+m_t_ded4
				m_g_ded5=m_g_ded5+m_t_ded5
				m_g_ded6=m_g_ded6+m_t_ded6
				m_g_ded7=m_g_ded7+m_t_ded7
				m_g_ded8=m_g_ded8+m_t_ded8
				m_g_ded9=m_g_ded9+m_t_ded9
				m_g_ded10=m_g_ded10+m_t_ded10
				m_gl_ded=m_gl_ded+m_tl_ded
				m_g_net=m_g_net+m_t_net
				stor 0 to m_t_basic, m_t_hol, m_t_ot, m_t_lv, m_t_ls, m_t_pay1,;
					m_t_pay2, m_t_pay3, m_t_grs, m_t_tax, m_t_sln, m_t_hln,;
					m_t_ded1, m_t_ded2, m_t_ded3, m_t_ded4, m_t_ded5, m_t_ded6,;
					m_t_ded7, m_t_ded8,	m_t_ded9, m_t_ded10, m_tl_ded, m_t_net,;
					m_t_comp, m_t_comd, m_t_cal
			endi
		endd
	endd
	if m_crow+3>58
		do p_yerhead
	endi
	?spac(24)+'GRAND TOTAL...  ';
		+tran(m_g_basic,m_tig)+tran(m_g_hol,m_tig)+tran(m_g_ot,m_tig);
		+tran(m_g_lv,m_tig)+tran(m_g_ls,m_tig)+tran(m_g_pay1,m_tig);
		+tran(m_g_pay2,m_tig)+tran(m_g_pay3,m_tig)+tran(m_g_tax,m_tig);
		+tran(m_g_sln,m_tig)+tran(m_g_cal,m_tig)+tran(m_g_hln,m_tig);
		+' '+tran(m_g_grs,m_tig)+' '+tran(m_gl_ded,m_tig)+' '+tran(m_g_net,m_tig)
	?spac(40)+tran(m_g_comp,m_tig)+tran(m_g_comd,m_tig)+tran(m_g_ded1,m_tig);
		+tran(m_g_ded2,m_tig)+tran(m_g_ded3,m_tig)+tran(m_g_ded4,m_tig);
		+tran(m_g_ded5,m_tig)+tran(m_g_ded6,m_tig)+tran(m_g_ded7,m_tig);
		+' '+tran(m_g_ded8,m_tig)+' '+tran(m_g_ded9,m_tig)+' '+tran(m_g_ded10,m_tig)
	?repl('=',239)
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

proc p_yerhead
m_page=m_page+1
if m_page>1
	?chr(12)
endi
?m_company
?'Y E A R L Y    P A Y R O L L    R E C A P I T U L A T I O N'
?'From January to '+m_pres_mo+' '+m_pres_yr
?
?alltrim(m_head)+spac(30-len(alltrim(m_head)))+spac(201)+'Page '+str(m_page,3)
?repl('=',239)
*?'EMP#   EMPLOYEE NAME                       REG-PAY       HOL-PAY       OT-PAY        VL-PAY        SL-PAY        ADJST         SSS-BEN       OTH-PAY       TAX-DED        GROSS PAY      TOTAL-DED      NET-PAY'
*?'                                           SSLN-DED      PBGLN-DED     '+m_rt_ded1+m_spc+m_rt_ded2+m_spc+m_rt_ded3+m_spc+m_rt_ded4+m_spc+m_rt_ded5+m_spc+m_rt_ded6+m_spc+m_rt_ded7+m_spc+' '+m_rt_ded8+m_spc+' '+m_rt_ded9+m_spc+' '+m_rt_ded10
 ?'EMP#   EMPLOYEE NAME                       REG-PAY       HOL-PAY       OT-PAY        VL-PAY        SL-PAY        TXBLE-PAY1    TXBLE-PAY2    NON-TAX-PAY   TAX-DED       '+m_rt_ln1+'    '+m_rt_ln2+'    GROSS PAY      TOTAL-DED      NET-PAY'
 ?'                                           '+m_rt_ln3+'    '+m_rt_ln4+'    '+m_rt_ln5+'    '+m_rt_ded1+m_spc+m_rt_ded2+m_spc+m_rt_ded3+m_spc+m_rt_ded4+m_spc+m_rt_ded5+m_spc+m_rt_ded6+m_spc+m_rt_ded7+m_spc+' '+m_rt_ded8+m_spc+' '+m_rt_ded9;
 +m_spc+' '+m_rt_ded10
?repl('=',239)
m_crow=8
m_nextpg=.f.
return
