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
	m_fig=' 999,999.99'
	m_tig='99999999.99'
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
	if .not. fil_lock(5)
		exit
	endi
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
	 	net_pay with 0, emp_ctr with 0, oth_pay4 with 0, cal_loan with 0,;
		comp_loan with 0, commodloan with 0, bontot with 0, bontax with 0
	stor 0 to m_t_basic, m_t_hol, m_t_ot, m_t_lv, m_t_ls, m_t_pay1, m_t_pay2,;
		m_t_pay3, m_t_sse, m_t_ssr, m_t_mede, m_t_medr, m_t_pgee, m_t_pger,;
		m_t_ecer, m_t_grs, m_t_tax, m_t_sln, m_t_hln, m_t_ded1, m_t_ded2,;
		m_t_ded3, m_t_ded4, m_t_ded5, m_t_ded6, m_t_ded7, m_t_ded8,	m_t_ded9,;
		m_t_ded10, m_tl_ded, m_t_net, m_t_pay4, m_t_cal, m_t_comp, m_t_comd
	stor 0 to m_g_basic, m_g_hol, m_g_ot, m_g_lv, m_g_ls, m_g_pay1, m_g_pay2,;
		m_g_pay3, m_g_sse, m_g_ssr, m_g_mede, m_g_medr, m_g_pgee, m_g_pger,;
		m_g_ecer, m_g_grs, m_g_tax, m_g_sln, m_g_hln, m_g_ded1, m_g_ded2,;
		m_g_ded3, m_g_ded4, m_g_ded5, m_g_ded6, m_g_ded7, m_g_ded8,	m_g_ded9,;
		m_g_ded10, m_gl_ded, m_g_net, m_ctr, m_g_pay4, m_g_cal, m_g_comp, m_g_comd
	sele master
	?chr(27)+chr(33)+chr(5)
	do whil .not. eof()
		if m_crow>58
			do p_monhead
		endi
		if m_gross<=0
			skip
			loop
		endi
		m_dep_no=dep_no
		sele dept
		seek m_dep_no
		if .not. eof()
			m_dep_nm=dep_nm
		else
			m_dep_nm='Undefined Department'
		endi
		sele master
		if m_crow+3>58
			do p_monhead
		endi
		?
		?'Dept.No.: '+m_dep_no+' - '+m_dep_nm
		?
		m_crow=m_crow+3
		do whil dep_no=m_dep_no .and. .not. eof()
			if m_crow+2>58
				do p_monhead
			endi
			if m_gross<=0
				skip
				loop
			endi
			m_emp_no=alltrim(emp_no)+space(6-len(alltrim(emp_no)))
			?m_emp_no+'   '+emp_nm+' '+tran(m_basic,m_fig);
				+tran(m_hol,m_fig)+tran(m_ot,m_fig)+tran(m_leave+m_leave2,m_fig);
				+tran(m_sleave,m_fig)+tran(m_othp1,m_fig)+tran(m_othp3,m_fig);
				+tran(m_othp2,m_fig)+tran(m_othp4,m_fig);
				+tran(m_ssee,m_fig)+tran(m_sser,m_fig);
				+tran(m_medee,m_fig)+tran(m_meder,m_fig)+tran(m_pgee,m_fig);
				+tran(m_pger,m_fig)+tran(m_ecer,m_fig)+tran(m_tax,m_fig)+tran(m_gross,m_fig)
			?spac(40)+tran(m_sln,m_fig)+tran(m_sscal,m_fig)+tran(m_hln,m_fig);
				+tran(m_coln,m_fig)+tran(m_comln,m_fig);
				+tran(m_ded1,m_fig)+tran(m_ded2,m_fig)+tran(m_ded3,m_fig);
				+tran(m_ded4,m_fig)+tran(m_ded5,m_fig)+tran(m_ded6,m_fig);
				+tran(m_ded7,m_fig)+tran(m_ded8,m_fig)+tran(m_ded9,m_fig);
				+tran(m_ded10,m_fig)+tran(m_tded,m_fig)+tran(m_netpay,m_fig)
			m_ctr=m_ctr+1
			m_crow=m_crow+2
			m_t_basic=m_t_basic+m_basic
			m_t_hol=m_t_hol+m_hol
			m_t_ot=m_t_ot+m_ot
			m_t_lv=m_t_lv+m_leave+m_leave2
			m_t_ls=m_t_ls+m_sleave
			m_t_pay1=m_t_pay1+m_othp1
			m_t_pay2=m_t_pay2+m_othp2
			m_t_pay3=m_t_pay3+m_othp3
			m_t_pay4=m_t_pay4+m_othp4
			m_t_sse=m_t_sse+m_ssee
			m_t_ssr=m_t_ssr+m_sser
			m_t_mede=m_t_mede+m_medee
			m_t_medr=m_t_medr+m_meder
			m_t_pgee=m_t_pgee+m_pgee
			m_t_pger=m_t_pger+m_pger
			m_t_ecer=m_t_ecer+m_ecer
			m_t_grs=m_t_grs+m_gross
			m_t_tax=m_t_tax+m_tax
			m_t_sln=m_t_sln+m_sln
			m_t_cal=m_t_cal+m_sscal
			m_t_hln=m_t_hln+m_hln
			m_t_comp=m_t_comp+m_coln
			m_t_comd=m_t_comd+m_comln
			m_t_ded1=m_t_ded1+m_ded1
			m_t_ded2=m_t_ded2+m_ded2
			m_t_ded3=m_t_ded3+m_ded3
			m_t_ded4=m_t_ded4+m_ded4
			m_t_ded5=m_t_ded5+m_ded5
			m_t_ded6=m_t_ded6+m_ded6
			m_t_ded7=m_t_ded7+m_ded7
			m_t_ded8=m_t_ded8+m_ded8
			m_t_ded9=m_t_ded9+m_ded9
			m_t_ded10=m_t_ded10+m_ded10
			m_tl_ded=m_tl_ded+m_tded
			m_t_net=m_t_net+m_netpay
			skip
			if dep_no#m_dep_no
				if m_crow+6>58
					do p_monhead
				endi
				?
				?repl('-',238)
				?spac(19)+'DEPARTMENT TOTAL...  ';
					+tran(m_t_basic,m_tig)+tran(m_t_hol,m_tig)+tran(m_t_ot,m_tig);
					+tran(m_t_lv,m_tig)+tran(m_t_ls,m_tig)+tran(m_t_pay1,m_tig);
					+tran(m_t_pay3,m_tig)+tran(m_t_pay2,m_tig)+tran(m_t_pay4,m_tig);
					+tran(m_t_sse,m_tig)+tran(m_t_ssr,m_tig)+tran(m_t_mede,m_tig);
					+tran(m_t_medr,m_tig)+tran(m_t_pgee,m_tig)+tran(m_t_pger,m_tig);
					+tran(m_t_ecer,m_tig)+tran(m_t_tax,m_tig)+tran(m_t_grs,m_tig)
				?spac(40)+tran(m_t_sln,m_tig)+tran(m_t_cal,m_tig)+tran(m_t_hln,m_tig);
					+tran(m_t_comp,m_tig)+tran(m_t_comd,m_tig)+tran(m_t_ded1,m_tig)+tran(m_t_ded2,m_tig);
					+tran(m_t_ded3,m_tig)+tran(m_t_ded4,m_tig)+tran(m_t_ded5,m_tig);
					+tran(m_t_ded6,m_tig)+tran(m_t_ded7,m_tig)+tran(m_t_ded8,m_tig);
					+tran(m_t_ded9,m_tig)+tran(m_t_ded10,m_tig);
					+tran(m_tl_ded,m_tig)+tran(m_t_net,m_tig)
				?repl('-',238)
				m_crow=m_crow+6
				m_g_basic=m_g_basic+m_t_basic
				m_g_hol=m_g_hol+m_t_hol
				m_g_ot=m_g_ot+m_t_ot
				m_g_lv=m_g_lv+m_t_lv
				m_g_ls=m_g_ls+m_t_ls
				m_g_pay1=m_g_pay1+m_t_pay1
				m_g_pay2=m_g_pay2+m_t_pay2
				m_g_pay3=m_g_pay3+m_t_pay3
				m_g_pay4=m_g_pay4+m_t_pay4
				m_g_sse=m_g_sse+m_t_sse
				m_g_ssr=m_g_ssr+m_t_ssr
				m_g_mede=m_g_mede+m_t_mede
				m_g_medr=m_g_medr+m_t_medr
				m_g_pgee=m_g_pgee+m_t_pgee
				m_g_pger=m_g_pger+m_t_pger
				m_g_ecer=m_g_ecer+m_t_ecer
				m_g_grs=m_g_grs+m_t_grs
				m_g_tax=m_g_tax+m_t_tax
				m_g_sln=m_g_sln+m_t_sln
				m_g_cal=m_g_cal+m_t_cal
				m_g_hln=m_g_hln+m_t_hln
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
				sele dept
				repl reg_pay with m_t_basic, ot_pay with m_t_ot,;
					hol_pay with m_t_hol, oth_pay1 with m_t_pay1,;
					oth_pay2 with m_t_pay2, oth_pay3 with m_t_pay3,;
					oth_pay4 with m_t_pay4,;
					lvenc_pay with m_t_lv, lsenc_pay with m_t_ls,;
					grs_pay with m_t_grs, tax with m_t_tax, sss_ee with m_t_sse,;
					sss_er with m_t_ssr, med_ee with m_t_mede,;
					med_er with m_t_medr, pgbg_ee with m_t_pgee,;
					pgbg_er with m_t_pger, ec_er with m_t_ecer,;
					sss_loan with m_t_sln, cal_loan with m_t_cal,;
					pbg_loan with m_t_hln, comp_loan with m_t_comp,;
					commodloan with m_t_comd,;
					oth_ded1 with m_t_ded1, oth_ded2 with m_t_ded2,;
					oth_ded3 with m_t_ded3, oth_ded4 with m_t_ded4,;
					oth_ded5 with m_t_ded5, oth_ded6 with m_t_ded6,;
					oth_ded7 with m_t_ded7, oth_ded8 with m_t_ded8,;
					oth_ded9 with m_t_ded9, oth_ded10 with m_t_ded10,;
					net_pay with m_t_net, emp_ctr with m_ctr
				sele master
				stor 0 to m_t_basic, m_t_hol, m_t_ot, m_t_lv, m_t_ls, m_t_pay1,;
					m_t_pay2, m_t_pay3, m_t_sse, m_t_ssr, m_t_mede, m_t_medr,;
					m_t_pgee, m_t_pger, m_t_ecer, m_t_grs, m_t_tax, m_t_sln,;
					m_t_hln, m_t_ded1, m_t_ded2, m_t_ded3, m_t_ded4, m_t_ded5,;
					m_t_ded6, m_t_ded7, m_t_ded8,	m_t_ded9, m_t_ded10, m_tl_ded,;
					m_t_net, m_ctr, m_t_pay4, m_t_cal, m_t_comp, m_t_comd
			endif
		enddo
	enddo
	if m_crow+3>58
		do p_monhead
	endif
	?spac(24)+'GRAND TOTAL...  ';
		+tran(m_g_basic,m_tig)+tran(m_g_hol,m_tig)+tran(m_g_ot,m_tig);
		+tran(m_g_lv,m_tig)+tran(m_g_ls,m_tig)+tran(m_g_pay1,m_tig);
		+tran(m_g_pay3,m_tig)+tran(m_g_pay2,m_tig)+tran(m_g_pay4,m_tig);
		+tran(m_g_sse,m_tig)+tran(m_g_ssr,m_tig)+tran(m_g_mede,m_tig);
		+tran(m_g_medr,m_tig)+tran(m_g_pgee,m_tig)+tran(m_g_pger,m_tig);
		+tran(m_g_ecer,m_tig)+tran(m_g_tax,m_tig)+tran(m_g_grs,m_tig)
	?spac(40)+tran(m_g_sln,m_tig)+tran(m_g_cal,m_tig)+tran(m_g_hln,m_tig);
		+tran(m_g_comp,m_tig)+tran(m_g_comd,m_tig)+tran(m_g_ded1,m_tig);
		+tran(m_g_ded2,m_tig);
		+tran(m_g_ded3,m_tig)+tran(m_g_ded4,m_tig)+tran(m_g_ded5,m_tig);
		+tran(m_g_ded6,m_tig)+tran(m_g_ded7,m_tig)+tran(m_g_ded8,m_tig);
		+tran(m_g_ded9,m_tig)+tran(m_g_ded10,m_tig);
		+tran(m_gl_ded,m_tig)+tran(m_g_net,m_tig)
	?repl('=',238)
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

proc p_monhead
m_page=m_page+1
if m_page>1
	?chr(12)
endi
?m_company
?'M O N T H L Y    P A Y R O L L    R E C A P I T U L A T I O N'
?'For the month of '+m_pres_mo+' '+m_pres_yr
?
?alltrim(m_head)+spac(30-len(alltrim(m_head)))+spac(200)+'Page '+str(m_page,3)
?repl('=',238)
* ?'EMP#   EMPLOYEE NAME                     REG-PAY    HOL-PAY    OT-PAY     VL-PAY     SL-PAY     TXBLE-PAY1 TXBLE-PAY2 NTAX-PAY1  NTAX-PAY2  SS-EE      SSS-ER     MED-EE     MED-ER     PGBG-EE    PGBG-ER    GROSS PAY'
* ?'                                         EC-ER      TAX-DED    SSLN-DED   PBGLN-DED  '+m_rt_ded1+' '+m_rt_ded2+' '+m_rt_ded3+' '+m_rt_ded4+' '+m_rt_ded5+' '+m_rt_ded6+' '+m_rt_ded7+' '+m_rt_ded8+' '+m_rt_ded9+' '+m_rt_ded10+' '+'TOTAL-DED  NET-PAY'
?'EMP#   EMPLOYEE NAME                     REG-PAY    HOL-PAY    OT-PAY     VL-PAY     SL-PAY     TXBLE-PAY1 TXBLE-PAY2 NTAX-PAY1  NTAX-PAY2  SS-EE      SSS-ER     MED-EE     MED-ER     PGBG-EE    PGBG-ER    EC-ER      TAX-DED    GROSS PAY'
?'                                         '+m_rt_ln1+' '+m_rt_ln2+' '+m_rt_ln3+' '+m_rt_ln4+' '+m_rt_ln5+' '+m_rt_ded1+' '+m_rt_ded2+' '+m_rt_ded3+' '+m_rt_ded4+' '+m_rt_ded5+' '+m_rt_ded6+' '+m_rt_ded7+' '+m_rt_ded8+' '+m_rt_ded9+' '+m_rt_ded10
??' '+'TOTAL-DED  NET-PAY'
?repl('=',238)
m_crow=8
m_nextpg=.f.
return
