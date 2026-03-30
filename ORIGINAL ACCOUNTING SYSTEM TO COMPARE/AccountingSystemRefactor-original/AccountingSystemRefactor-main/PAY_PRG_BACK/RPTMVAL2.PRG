* PAYROLL SYSTEM
* Program Name : Timecard Validation Report Generation
* Program Code : Rptmvali.prg
* Author : SVC
* Date Started : May 26, 1994
* Date Finished: May 26, 1994

m_oldcol=setcolor()
set colo to (m_cnor)
do whil .t.
   f_bcln()
	m_spool=.t.
	m_page=0
	m_nextpg=.t.
	m_crow=60
	m_fig=' 999,999.99'
	f_setting()
	do whil .t.
		sele 1
		if .not. net_use('&dpath\sys_id',.t.,5)
			exit
		endi
		if .not. fil_lock(5)
			exit
		endi
		m_d1 = dtoc(beg_date)
		m_d2 = dtoc(end_date)	
		sele 3
		if .not. net_use('&dpath\dept',.t.,5)
			exit
		endi
		set inde to &dpath\dbydep
		rein
		sele 2
		if .not. net_use('&dpath\tmcard',.t.,5)
			exit
		endi
		set inde to &dpath\tbydep
		rein
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
		stor 0 to m_t_reg, m_t_abs, m_t_rot, m_t_sphp, m_t_spot, m_t_lghp,;
			m_t_lgot, m_t_lv, m_t_ls, m_t_pay1, m_t_pay2, m_t_pay3, m_t_pay4,;
			m_t_sln, m_t_hdmf, m_t_ded1, m_t_ded2, m_t_ded3, m_t_ded4, m_t_ded5,;
			m_t_ded6, m_t_ded7, m_t_ded8, m_t_ded9, m_t_ded10,;
			m_t_nsd, m_t_uvl, m_t_usl, m_t_cal_ln, m_t_comp_ln, m_t_comd_ln
		stor 0 to m_d_reg, m_d_abs, m_d_rot, m_d_sphp, m_d_spot, m_d_lghp,;
			m_d_lgot, m_d_lv, m_d_ls, m_d_pay1, m_d_pay2, m_d_pay3, m_d_pay4,;
			 m_d_sln, m_d_hdmf, m_d_ded1, m_d_ded2, m_d_ded3, m_d_ded4, m_d_ded5,;
			m_d_ded6, m_d_ded7, m_d_ded8, m_d_ded9, m_d_ded10,;
			m_d_nsd, m_d_uvl, m_d_usl, m_d_cal_ln, m_d_comp_ln, m_d_comd_ln
		m_fig='99999999.99'
		do whil .not. eof()
			if m_crow>58
				do p_valihead
			endi
			m_dep_no=dep_no
			sele dept
			seek m_dep_no
			if .not. eof()
				m_dep_nm=dep_nm
			else
				m_dep_nm=''
			endi
			sele tmcard
			if m_crow+6>58
				do p_valihead
			endi
			?
			?'Dept.No.: '+m_dep_no+' - '+m_dep_nm
			?
			m_crow=m_crow+3
			do whil dep_no=m_dep_no .and. .not. eof()
				if m_crow+2>58
					do p_valihead
				endi
				m_emp_no=alltrim(emp_no)+space(6-len(alltrim(emp_no)))
				?m_emp_no+' '+emp_nm+' '+tran(reg_hrs,m_fig);
					+tran(rot_hrs,m_fig)+tran(sphp_hrs,m_fig)+tran(spot_hrs,m_fig);
					+tran(lghp_hrs,m_fig)+tran(lgot_hrs,m_fig)+tran(nsd_hrs,m_fig)
					if withbonus
						??'YES'
					else
						??'NO '
					endif
					??+space(8);
				   +tran(vl_used,'999999.9999')+tran(sl_used,'999999.9999');
					+tran(lv_hrs,m_fig)+tran(ls_hrs,m_fig)
				m_d_reg=m_d_reg+reg_hrs
				m_d_abs=m_d_abs+abs_hrs
				m_d_rot=m_d_rot+rot_hrs
				m_d_sphp=m_d_sphp+sphp_hrs
				m_d_spot=m_d_spot+spot_hrs
				m_d_lghp=m_d_lghp+lghp_hrs
				m_d_lgot=m_d_lgot+lgot_hrs
				m_d_lv=m_d_lv+lv_hrs
				m_d_ls=m_d_ls+ls_hrs
				m_d_pay1=m_d_pay1+oth_pay1
				m_d_pay2=m_d_pay2+oth_pay2
				m_d_pay3=m_d_pay3+oth_pay3
				m_d_pay4=m_d_pay3+oth_pay4
				m_d_sln=m_d_sln+sln_ded
				m_d_hdmf=m_d_hdmf+hdmf_ded
				m_d_ded1=m_d_ded1+oth_ded1
				m_d_ded2=m_d_ded2+oth_ded2
				m_d_ded3=m_d_ded3+oth_ded3
				m_d_ded4=m_d_ded4+oth_ded4
				m_d_ded5=m_d_ded5+oth_ded5
				m_d_ded6=m_d_ded6+oth_ded6
				m_d_ded7=m_d_ded7+oth_ded7
				m_d_ded8=m_d_ded8+oth_ded8
				m_d_ded9=m_d_ded9+oth_ded9
				m_d_ded10=m_d_ded10+oth_ded10
				m_d_nsd=m_d_nsd+nsd_hrs
				m_d_uvl=m_d_uvl+vl_used
				m_d_usl=m_d_usl+sl_used
				m_d_cal_ln=m_d_cal_ln+cal_ded
				m_d_comp_ln=m_d_comp_ln+comp_ded
				m_d_comd_ln=m_d_comd_ln+comd_ded
				skip
				m_crow=m_crow+2
			enddo
			if m_crow+6>58
				do p_valihead
			endi				
			?
			?repl('=',174)
			?spac(19)+'DEPARTMENT TOTAL...  ';
				+tran(m_d_reg,m_fig)+tran(m_d_rot,m_fig);
				+tran(m_d_sphp,m_fig)+tran(m_d_spot,m_fig)+tran(m_d_lghp,m_fig);
				+tran(m_d_lgot,m_fig)+tran(m_d_nsd,m_fig)+space(11);
				+tran(m_d_uvl,m_fig)+tran(m_d_usl,m_fig);
				+tran(m_d_lv,m_fig)+tran(m_d_ls,m_fig)
			?repl('=',174)
			?
			m_crow=m_crow+6
			m_t_reg=m_t_reg+m_d_reg
			m_t_abs=m_t_abs+m_d_abs
			m_t_rot=m_t_rot+m_d_rot
			m_t_sphp=m_t_sphp+m_d_sphp
			m_t_spot=m_t_spot+m_d_spot
			m_t_lghp=m_t_lghp+m_d_lghp
			m_t_lgot=m_t_lgot+m_d_lgot
			m_t_lv=m_t_lv+m_d_lv
			m_t_ls=m_t_ls+m_d_ls
			m_t_pay1=m_t_pay1+m_d_pay1
			m_t_pay2=m_t_pay2+m_d_pay2
			m_t_pay3=m_t_pay3+m_d_pay3
			m_t_pay4=m_t_pay4+m_d_pay4
			m_t_sln=m_t_sln+m_d_sln
			m_t_hdmf=m_t_hdmf+m_d_hdmf
			m_t_ded1=m_t_ded1+m_d_ded1
			m_t_ded2=m_t_ded2+m_d_ded2
			m_t_ded3=m_t_ded3+m_d_ded3
			m_t_ded4=m_t_ded4+m_d_ded4
			m_t_ded5=m_t_ded5+m_d_ded5
			m_t_ded6=m_t_ded6+m_d_ded6
			m_t_ded7=m_t_ded7+m_d_ded7
			m_t_ded8=m_t_ded8+m_d_ded8
			m_t_ded9=m_t_ded9+m_d_ded9
			m_t_ded10=m_t_ded10+m_d_ded10
			m_t_nsd=m_t_nsd+m_d_nsd
			m_t_uvl=m_t_uvl+m_d_uvl
			m_t_usl=m_t_usl+m_d_usl
			m_t_cal_ln=m_t_cal_ln+m_d_cal_ln
			m_t_comp_ln=m_t_comp_ln+m_d_comp_ln
			m_t_comd_ln=m_t_comd_ln+m_d_comd_ln
			stor 0 to m_d_reg, m_d_abs, m_d_rot, m_d_sphp, m_d_spot, m_d_lghp,;
				m_d_lgot, m_d_lv, m_d_ls, m_d_pay1, m_d_pay2, m_d_pay3, m_d_pay4,;
				m_d_sln, m_d_hdmf, m_d_ded1, m_d_ded2, m_d_ded3, m_d_ded4,;
				m_d_ded5, m_d_ded6, m_d_ded7, m_d_ded8, m_d_ded9, m_d_ded10,;
				m_d_nsd, m_d_uvl, m_d_usl, m_d_cal_ln, m_d_comp_ln, m_d_comd_ln
		enddo
		?
		?repl('=',174)
		m_fig='99999999.99'
		?spac(24)+'GRAND TOTAL...  ';
			+tran(m_t_reg,m_fig)+tran(m_t_abs,m_fig)+tran(m_t_rot,m_fig);
			+tran(m_t_sphp,m_fig)+tran(m_t_spot,m_fig)+tran(m_t_lghp,m_fig);
			+tran(m_t_lgot,m_fig)+tran(m_t_nsd,m_fig)+space(11);
			+tran(m_t_uvl,m_fig)+tran(m_t_usl,m_fig);
			+tran(m_t_lv,m_fig)+tran(m_t_ls,m_fig)
		?repl('=',174)
		?
		exit
	endd
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

proc p_valihead
m_page=m_page+1
if m_page>1
	?chr(12)
endi
?m_company
?'T I M E C A R D    V A L I D A T I O N'
?'Payroll Period: '+m_d1+' - '+m_d2
?
?alltrim(m_head)+spac(30-len(alltrim(m_head)))+spac(150)+'Page '+str(m_page,3)
?repl('=',174)
?'EMP#   EMPLOYEE NAME                     REG-HRS    ROT-HRS    SPHP-HRS   SPOT-HRS   LGHP-HRS   LGOT_HRS   NSD-HRS    WITH-BONUS   VL-USED    SL-USED    VL-ENCSH   SL-ENCSH'  
?repl('=',174)
m_crow=10
m_nextpg=.f.
return
