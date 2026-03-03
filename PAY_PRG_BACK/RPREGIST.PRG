* PAYROLL SYSTEM
* Program Name : Timecard Validation Report Generation
* Program Code : Rpregist.prg
* Author : SVC
* Date Started : May 26, 1994
* Date Finished: May 31, 1994

m_oldcol=setcolor()
set colo to (m_cnor)
m_abort := .t.
do whil .t.
	set color to (m_cmes)
	f_bcln()
	@24,2 say 'Select Format:'
	@24,17 prompt 'ALL IN ONE'
	@24,29 prompt 'SUMMARIZED DEDUCTIONS'
	@24,52 prompt 'LOANS ONLY'
	@24,64 prompt 'DEDUCTIONS ONLY'
	menu to m_format
	if lastkey()=27
		exit
	endif
 	set color to (m_cnor)
	if f_choose('Select:','INDIVIDUAL','SUMMARY')
		m_individual=.t.
	else
		m_individual=.f.
	endif
	if lastkey()=27
		exit
	endif
	if m_format=2
		if f_ask('Include HOURS ?')
			m_withhrs=.t.
		else
			m_withhrs=.f.
		endif
	endif
	if lastkey()=27
		exit
	endif
   f_bcln()
	m_spool=.t.
	m_page=0
	m_crow=60
	m_fig =  ' 999,999.99'
	m_fig2= '9,999,999.99'
	m_fig3='99,999,999.99'
	m_tig =  ' 999,999.99'
	m_tig2=   ' 99,999.99'
	m_tig3=    ' 9,999.99'
	m_tig4=      '9999.99'
	m_tig5=    '999999.99'
	m_tig8=     '99999.99'
	m_tig6=   '9999999.99'
	m_tig7=  '99999999.99'
	f_setting()
	do whil .t.
		sele 1
		if .not. net_use('&dpath\sys_id',.t.,5)
			exit
		endi
		if .not. fil_lock(5)
			exit
		endif
		if trn_prc!=trn_ctr
			f_err('Please Compute Payroll first...',.t.)
			exit
		endif
		m_d1 = dtoc(beg_date)
		m_d2 = dtoc(end_date)
		sele 2
		if .not. net_use('&dpath\tmcard',.t.,5)
			exit
		endi
		set inde to &dpath\tbydep
		rein
		go top
		sele 3
		if .not. net_use('&dpath\dept',.t.,5)
			exit
		endi
		set inde to &dpath\dbydep
		rein
		sele 2
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
		stor 0 to m_t_reg, m_t_rot, m_t_sphp, m_t_spot, m_t_lghp,;
			m_t_lgot, m_t_lv, m_t_ls, m_t_pay1, m_t_pay2, m_t_pay3, m_t_pay4, m_t_sln,;
			m_t_hdmf, m_t_ded1, m_t_ded2, m_t_ded3, m_t_ded4, m_t_ded5,;
			m_t_ded6, m_t_ded7, m_t_ded8, m_t_ded9, m_t_ded10, m_tl_ded,;
			m_t_net, m_t_tax, m_t_sss, m_t_med, m_t_pgbg, m_t_grs,;
			m_t_nsd, m_t_cal_ded, m_t_comp_ded, m_t_comd_ded, m_t_bonus,;
         m_tlgh_hrs, m_tlgo_hrs

		store 0 to m_treg_hrs, m_trot_hrs, m_tnsd_hrs, m_tsphp_hrs,;
			m_tlghp_hrs, m_tlvls_hrs
		stor 0 to m_g_reg, m_g_rot, m_g_sphp, m_g_spot, m_g_lghp,;
			m_g_lgot, m_g_lv, m_g_ls, m_g_pay1, m_g_pay2, m_g_pay3, m_g_pay4, m_g_sln,;
			m_g_hdmf, m_g_ded1, m_g_ded2, m_g_ded3, m_g_ded4, m_g_ded5,;
			m_g_ded6, m_g_ded7, m_g_ded8, m_g_ded9, m_g_ded10, m_gl_ded,;
			m_g_net, m_g_tax, m_g_sss, m_g_med, m_g_pgbg, m_g_grs,;
			m_g_nsd, m_g_cal_ded, m_g_comp_ded, m_g_comd_ded, m_g_bonus,;
         m_glgh_hrs, m_glgo_hrs

	store 0 to m_greg_hrs, m_grot_hrs, m_gnsd_hrs, m_gsphp_hrs,;
		m_glghp_hrs, m_glvls_hrs
      m_abort := .f.
		do whil .not. eof()
			if m_crow>58
				do p_reghead
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
			if m_crow+3>58
				do p_reghead
			endi
			if m_individual
				?
				?'Dept.No.: '+m_dep_no+' - '+m_dep_nm
				?
				m_crow=m_crow+3
			endi
			*else
			*	?
			*	?m_dep_no+spac(5)+m_dep_nm+spac(8)
			*	m_crow=m_crow+2
			*endi
			do whil dep_no=m_dep_no .and. .not. eof()
				if m_crow+2>58
					do case
						case m_format=1
							?repl('=',255)
						case m_format=2
							if m_withhrs
								?repl('=',270)
							else
								?repl('=',268)
							endif
						case m_format=3
							?repl('=',106)
						case m_format=4
							?repl('=',161)
					endcase
					do p_reghead
				endi
				if m_individual
					m_emp_no=alltrim(emp_no)+space(6-len(alltrim(emp_no)))
					do case
						case m_format=1
							?m_emp_no+' '+emp_nm+' '+ttrn(reg_pay,m_fig);
								+ttrn(rot_pay,m_fig)+ttrn(sphp_pay,m_fig);
								+ttrn(spot_pay,m_fig)+ttrn(lghp_pay,m_fig)+ttrn(lgot_pay,m_fig);
								+ttrn(nsd_pay,'9999,999.99')+'   '+ttrn(tax_ee,m_fig)+ttrn(sss_ee,m_fig)+ttrn(med_ee,m_fig);
								+ttrn(pgbg_ee,m_fig)+ttrn(sln_ded,m_fig)+ttrn(cal_ded,m_fig);
								+ttrn(hdmf_ded,m_fig)+ttrn(comp_ded,m_fig)+ttrn(comd_ded,m_fig);
								+ttrn(oth_ded1,' '+m_fig)
							?spac(40)+ttrn(lv_pay+lv2_pay,m_fig)+ttrn(ls_pay,m_fig);
								+ttrn(oth_pay1,m_fig)+ttrn(oth_pay3,m_fig)+ttrn(oth_pay2,m_fig);
								+ttrn(oth_pay4,m_fig)+ttrn(bonus,m_fig)+ttrn(grs_pay+bonus,'999,999,999.99')+ttrn(oth_ded2,m_fig);
								+ttrn(oth_ded3,m_fig)+ttrn(oth_ded4,m_fig);
								+ttrn(oth_ded5,m_fig)+ttrn(oth_ded6,m_fig);
								+ttrn(oth_ded7,m_fig)+ttrn(oth_ded8,m_fig);
								+ttrn(oth_ded9,m_fig)+ttrn(oth_ded10,' '+m_fig);
								+ttrn(tot_ded,m_fig2)+ttrn(net_pay+bonus,m_fig2)
							m_crow=m_crow+2
						case m_format=2
							if m_withhrs
								?m_emp_no+' '+left(emp_nm,26)+' ';
								+tran(reg_hrs,m_tig4)+tran(rot_hrs,m_tig4);
								+tran(nsd_hrs,m_tig4)+tran(sphp_hrs+spot_hrs,m_tig4);
								+tran(lghp_hrs,m_tig4)+tran(lgot_hrs,m_tig4)+tran(lv_hrs+ls_hrs,m_tig4);
								+ttrn(reg_pay,m_tig7)+ttrn(rot_pay,m_tig6);
								+ttrn(nsd_pay,m_tig8)+ttrn(sphp_pay+spot_pay,m_tig8);
								+ttrn(lghp_pay+lgot_pay,m_tig8)+ttrn(lv_pay+lv2_pay+ls_pay,m_tig8);
								+ttrn(oth_pay1,m_tig6)+ttrn(oth_pay3,m_tig6);
								+ttrn(oth_pay2,m_tig5)+ttrn(oth_pay4,m_tig5);
									+ttrn(bonus,m_tig5)+ttrn(grs_pay+bonus,m_tig6)+ttrn(tax_ee,m_tig6);
									+ttrn(sss_ee,m_tig5)+ttrn(med_ee,m_tig5);
									+ttrn(pgbg_ee,m_tig5);
									+ttrn(sln_ded+cal_ded+hdmf_ded+comp_ded+comd_ded,m_tig6);
									+ttrn(oth_ded1+oth_ded2+oth_ded3+oth_ded4+oth_ded5+oth_ded6+oth_ded7+oth_ded8+oth_ded9+oth_ded10,m_tig6);
									+ttrn(tot_ded,m_tig6)+ttrn(net_pay+bonus,m_tig6)
							else
								?m_emp_no+' '+emp_nm;
									+ttrn(reg_pay,' '+m_fig3)+ttrn(nsd_pay,m_fig);
									+ttrn(sphp_pay+spot_pay,m_fig)+ttrn(lghp_pay+lgot_pay,m_fig);
									+ttrn(rot_pay,m_fig)+ttrn(lv_pay+lv2_pay+ls_pay,m_fig);
									+ttrn(oth_pay1,m_fig)+ttrn(oth_pay2,m_fig)+ttrn(oth_pay3,m_fig);
									+ttrn(oth_pay4,m_fig)+ttrn(bonus,m_fig)+ttrn(grs_pay+bonus,' '+m_fig3);
									+ttrn(tax_ee,m_fig)+ttrn(sss_ee,m_fig);
									+ttrn(med_ee,m_fig)+ttrn(pgbg_ee,m_fig);
									+ttrn(sln_ded+cal_ded+hdmf_ded+comp_ded+comd_ded,m_fig);
									+ttrn(oth_ded1+oth_ded2+oth_ded3+oth_ded4+oth_ded5+oth_ded6+oth_ded7+oth_ded8+oth_ded9+oth_ded10,m_fig);
									+ttrn(tot_ded,m_fig)+ttrn(net_pay+bonus,' '+m_fig3)
							endif
							m_crow=m_crow+1
						case m_format=3
							?m_emp_no+' '+emp_nm+' ';
								+ttrn(sln_ded,m_fig)+ttrn(cal_ded,m_fig);
								+ttrn(hdmf_ded,m_fig)+ttrn(comp_ded,m_fig);
								+ttrn(comd_ded,m_fig);
								+ttrn(sln_ded+cal_ded+hdmf_ded+comp_ded+comd_ded,m_fig)
							m_crow=m_crow+1
						case m_format=4
							m_tot_ded=oth_ded1+oth_ded2+oth_ded3+oth_ded4+oth_ded5;
							+oth_ded6+oth_ded7+oth_ded8+oth_ded9+oth_ded10
							?m_emp_no+' '+emp_nm+' ';
								+ttrn(oth_ded1,m_fig)+ttrn(oth_ded2,m_fig);
								+ttrn(oth_ded3,m_fig)+ttrn(oth_ded4,m_fig);
								+ttrn(oth_ded5,m_fig)+ttrn(oth_ded6,m_fig);
								+ttrn(oth_ded7,m_fig)+ttrn(oth_ded8,m_fig);
								+ttrn(oth_ded9,m_fig)+ttrn(oth_ded10,m_fig);
								+ttrn(m_tot_ded,m_fig)
							m_crow=m_crow+1
					endcase
				endif
				m_treg_hrs=m_treg_hrs+reg_hrs
				m_trot_hrs=m_trot_hrs+rot_hrs
				m_tnsd_hrs=m_tnsd_hrs+nsd_hrs
				m_tsphp_hrs=m_tsphp_hrs+sphp_hrs+spot_hrs
				m_tlghp_hrs=m_tlghp_hrs+lghp_hrs+lgot_hrs
				m_tlgh_hrs=m_tlgh_hrs+lghp_hrs
				m_tlgo_hrs=m_tlgo_hrs+lgot_hrs
				m_tlvls_hrs=m_tlvls_hrs+lv_hrs+ls_hrs
				m_t_reg=m_t_reg+reg_pay
				m_t_rot=m_t_rot+rot_pay
				m_t_sphp=m_t_sphp+sphp_pay
				m_t_spot=m_t_spot+spot_pay
				m_t_lghp=m_t_lghp+lghp_pay
				m_t_lgot=m_t_lgot+lgot_pay
				m_t_lv=m_t_lv+lv_pay+lv2_pay
				m_t_ls=m_t_ls+ls_pay
				m_t_pay1=m_t_pay1+oth_pay1
				m_t_pay2=m_t_pay2+oth_pay2
				m_t_pay3=m_t_pay3+oth_pay3
				m_t_pay4=m_t_pay4+oth_pay4
				m_t_bonus=m_t_bonus+bonus
				m_t_grs=m_t_grs+grs_pay
				m_tl_ded=m_tl_ded+tot_ded
				m_t_net=m_t_net+net_pay
				m_t_tax=m_t_tax+tax_ee
				m_t_sss=m_t_sss+sss_ee
				m_t_med=m_t_med+med_ee
				m_t_pgbg=m_t_pgbg+pgbg_ee
				m_t_sln=m_t_sln+sln_ded
				m_t_hdmf=m_t_hdmf+hdmf_ded
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
				m_t_nsd=m_t_nsd+nsd_pay
				m_t_cal_ded=m_t_cal_ded+cal_ded
				m_t_comp_ded=m_t_comp_ded+comp_ded
				m_t_comd_ded=m_t_comd_ded+comd_ded
				skip
				if dep_no#m_dep_no
					if m_crow+6>58
						do case
							case m_format=1
								?repl('=',255)
							case m_format=2
								if m_withhrs
									?repl('=',270)
								else
									?repl('=',268)
								endif
							case m_format=3
								?repl('=',106)
							case m_format=4
								?repl('=',161)
						endcase
						do p_reghead
					endi
					if m_individual
						?
						do case
							case m_format=1
								?repl('-',255)
							case m_format=2
								if m_withhrs
									?repl('-',270)
								else
									?repl('-',268)
								endif
							case m_format=3
								?repl('-',106)
							case m_format=4
								?repl('-',161)
						endcase

						if m_format=2 .and. m_withhrs
   						?spac(13)+'DEPARTMENT TOTAL...'
                  else
   						?spac(19)+'DEPARTMENT TOTAL...'
                  endif
					else
						?
						?m_dep_no+spac(5)+m_dep_nm+space(6)
					endi
					do case
						case m_format=1
							??'  '+ttrn(m_t_reg,m_tig)+ttrn(m_t_rot,m_tig)+ttrn(m_t_sphp,m_tig);
								+ttrn(m_t_spot,m_tig)+ttrn(m_t_lghp,m_tig)+ttrn(m_t_lgot,m_tig);
								+ttrn(m_t_nsd,'9999,999.99')+space(3)+ttrn(m_t_tax,m_tig)+ttrn(m_t_sss,m_tig)+ttrn(m_t_med,m_tig);
								+ttrn(m_t_pgbg,m_tig)+ttrn(m_t_sln,m_tig)+ttrn(m_t_cal_ded,m_tig);
								+ttrn(m_t_hdmf,m_tig)+ttrn(m_t_comp_ded,m_tig)+ttrn(m_t_comd_ded,m_tig);
								+ttrn(m_t_ded1,' '+m_tig)
							?spac(40)+ttrn(m_t_lv,m_tig)+ttrn(m_t_ls,m_tig)+ttrn(m_t_pay1,m_tig);
								+ttrn(m_t_pay3,m_tig)+ttrn(m_t_pay2,m_tig)+ttrn(m_t_pay4,m_tig);
								+ttrn(m_t_bonus,m_tig)+ttrn(m_t_grs+m_t_bonus,'999,999,999.99');
								+ttrn(m_t_ded2,m_tig)+ttrn(m_t_ded3,m_tig);
								+ttrn(m_t_ded4,m_tig)+ttrn(m_t_ded5,m_tig)+ttrn(m_t_ded6,m_tig);
								+ttrn(m_t_ded7,m_tig)+ttrn(m_t_ded8,m_tig)+ttrn(m_t_ded9,m_tig);
								+ttrn(m_t_ded10,' '+m_tig)+ttrn(m_tl_ded,' '+m_tig)+ttrn(m_t_net+bonus,' '+m_tig)

						case m_format=2
							if m_withhrs
								??tran(m_treg_hrs,m_tig5)+tran(m_trot_hrs,m_tig4);
									+tran(m_tnsd_hrs,m_tig4)+tran(m_tsphp_hrs,m_tig4);
									+tran(m_tlgh_hrs,m_tig4)+tran(m_tlgo_hrs,m_tig4)+tran(m_tlvls_hrs,m_tig4);
									+ttrn(m_t_reg,m_tig7)+ttrn(m_t_rot,m_tig6);
									+ttrn(m_t_nsd,m_tig8);
									+ttrn(m_t_sphp+m_t_spot,m_tig8);
									+ttrn(m_t_lghp+m_t_lgot,m_tig8);
									+ttrn(m_t_lv+m_t_ls,m_tig8);
									+ttrn(m_t_pay1,m_tig6)+ttrn(m_t_pay3,m_tig6);
									+ttrn(m_t_pay2,m_tig5)+ttrn(m_t_pay4,m_tig5);
									+ttrn(m_t_bonus,m_tig5)+ttrn(m_t_grs+m_t_bonus,m_tig6);
									+ttrn(m_t_tax,m_tig6)+ttrn(m_t_sss,m_tig5);
									+ttrn(m_t_med,m_tig5)+ttrn(m_t_pgbg,m_tig5);
									+ttrn(m_t_sln+m_t_cal_ded+m_t_hdmf+m_t_comp_ded+m_t_comd_ded,m_tig6);
									+ttrn(m_t_ded1+m_t_ded2+m_t_ded3+m_t_ded4+m_t_ded5+m_t_ded6+m_t_ded7+m_t_ded8+m_t_ded9+m_t_ded10,m_tig6);
									+ttrn(m_tl_ded,m_tig6)+ttrn(m_t_net+m_t_bonus,m_tig6)
							else
								??'  '+ttrn(m_t_reg,m_fig3)+ttrn(m_t_nsd,m_fig);
									+ttrn(m_t_sphp+m_t_spot,m_fig)+ttrn(m_t_lghp+m_t_lgot,m_fig);
									+ttrn(m_t_rot,m_fig)+ttrn(m_t_lv+m_t_ls,m_fig);
									+ttrn(m_t_pay1,m_fig)+ttrn(m_t_pay2,m_fig);
									+ttrn(m_t_pay3,m_fig)+ttrn(m_t_pay4,m_fig);
									+ttrn(m_t_bonus,m_fig)+ttrn(m_t_grs+m_t_bonus,' '+m_fig3);
									+ttrn(m_t_tax,m_fig)+ttrn(m_t_sss,m_fig);
									+ttrn(m_t_med,m_fig)+ttrn(m_t_pgbg,m_fig);
									+ttrn(m_t_sln+m_t_cal_ded+m_t_hdmf+m_t_comp_ded+m_t_comd_ded,m_fig);
									+ttrn(m_t_ded1+m_t_ded2+m_t_ded3+m_t_ded4+m_t_ded5+m_t_ded6+m_t_ded7+m_t_ded8+m_t_ded9+m_t_ded10,m_fig);
									+ttrn(m_tl_ded,m_fig)+ttrn(m_t_net+m_t_bonus,' '+m_fig3)
							endif

						case m_format=3
							??'  '+ttrn(m_t_sln,m_fig)+ttrn(m_t_cal_ded,m_fig);
								+ttrn(m_t_hdmf,m_fig)+ttrn(m_t_comp_ded,m_fig);
								+ttrn(m_t_comd_ded,m_fig);
								+ttrn(m_t_sln+m_t_cal_ded+m_t_hdmf+m_t_comp_ded+m_t_comd_ded,m_fig)

						case m_format=4
							??'  '+ttrn(m_t_ded1,m_fig)+ttrn(m_t_ded2,m_fig);
								+ttrn(m_t_ded3,m_fig)+ttrn(m_t_ded4,m_fig);
								+ttrn(m_t_ded5,m_fig)+ttrn(m_t_ded6,m_fig);
								+ttrn(m_t_ded7,m_fig)+ttrn(m_t_ded8,m_fig);
								+ttrn(m_t_ded9,m_fig)+ttrn(m_t_ded10,m_fig);
								+ttrn(m_t_ded1+m_t_ded2+m_t_ded3+m_t_ded4+m_t_ded5+m_t_ded6+m_t_ded7+m_t_ded8+m_t_ded9+m_t_ded10,m_fig)
					endcase
					if m_individual
						do case
							case m_format=1
								?repl('-',255)
							case m_format=2
								if m_withhrs
									?repl('-',270)
								else
									?repl('-',268)
								endif
							case m_format=3
								?repl('-',106)
							case m_format=4
								?repl('-',161)
						endcase
						m_crow=m_crow+6
					else
						m_crow=m_crow+2
					endi
					m_greg_hrs=m_greg_hrs+m_treg_hrs
					m_grot_hrs=m_grot_hrs+m_trot_hrs
					m_gnsd_hrs=m_gnsd_hrs+m_tnsd_hrs
					m_gsphp_hrs=m_gsphp_hrs+m_tsphp_hrs
					m_glghp_hrs=m_glghp_hrs+m_tlghp_hrs

					m_glgh_hrs=m_glgh_hrs+m_tlgh_hrs
					m_glgo_hrs=m_glgo_hrs+m_tlgo_hrs

					m_glvls_hrs=m_glvls_hrs+m_tlvls_hrs
					m_g_reg=m_g_reg+m_t_reg
					m_g_rot=m_g_rot+m_t_rot
					m_g_sphp=m_g_sphp+m_t_sphp
					m_g_spot=m_g_spot+m_t_spot
					m_g_lghp=m_g_lghp+m_t_lghp
					m_g_lgot=m_g_lgot+m_t_lgot
					m_g_lv=m_g_lv+m_t_lv
					m_g_ls=m_g_ls+m_t_ls
					m_g_pay1=m_g_pay1+m_t_pay1
					m_g_pay2=m_g_pay2+m_t_pay2
					m_g_pay3=m_g_pay3+m_t_pay3
					m_g_pay4=m_g_pay4+m_t_pay4
					m_g_bonus=m_g_bonus+m_t_bonus
					m_g_grs=m_g_grs+m_t_grs
					m_gl_ded=m_gl_ded+m_tl_ded
					m_g_net=m_g_net+m_t_net
					m_g_tax=m_g_tax+m_t_tax
					m_g_sss=m_g_sss+m_t_sss
					m_g_med=m_g_med+m_t_med
					m_g_pgbg=m_g_pgbg+m_t_pgbg
					m_g_sln=m_g_sln+m_t_sln
					m_g_hdmf=m_g_hdmf+m_t_hdmf
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
					m_g_nsd=m_g_nsd+m_t_nsd
					m_g_cal_ded=m_g_cal_ded+m_t_cal_ded
					m_g_comp_ded=m_g_comp_ded+m_t_comp_ded
					m_g_comd_ded=m_g_comd_ded+m_t_comd_ded
					stor 0 to m_t_reg, m_t_rot, m_t_sphp, m_t_spot, m_t_lghp,;
						m_t_lgot, m_t_lv, m_t_ls, m_t_pay1, m_t_pay2, m_t_pay3, m_t_pay4,;
						m_t_sln, m_t_hdmf, m_t_ded1, m_t_ded2, m_t_ded3, m_t_ded4, m_t_ded5,;
						m_t_ded6, m_t_ded7, m_t_ded8, m_t_ded9, m_t_ded10, m_tl_ded,;
						m_t_net, m_t_tax, m_t_sss, m_t_med, m_t_pgbg, m_t_grs,;
						m_t_nsd, m_t_cal_ded, m_t_comp_ded, m_t_comd_ded, m_t_bonus
					store 0 to m_treg_hrs, m_trot_hrs, m_tnsd_hrs, m_tsphp_hrs,;
						m_tlghp_hrs, m_tlvls_hrs, m_tlgh_hrs, m_tlgo_hrs
				endif
			enddo
		enddo
		if m_crow+4>58
			do case
				case m_format=1
					?repl('=',255)
				case m_format=2
					if m_withhrs
						?repl('=',270)
					else
						?repl('=',268)
					endif
				case m_format=3
					?repl('=',106)
				case m_format=4
					?repl('=',161)
			endcase
			do p_reghead
		endi
		if m_individual
			?
		else
			do case
				case m_format=1
					?repl('-',255)
				case m_format=2
					if m_withhrs
						?repl('-',270)
					else
						?repl('-',268)
					endif
				case m_format=3
					?repl('-',106)
				case m_format=4
					?repl('-',161)
			endcase
		endif

		if m_format=2 .and. m_withhrs
		   ?spac(18)+'GRAND TOTAL...'
      else
		   ?spac(24)+'GRAND TOTAL...'
      endif

		do case
			case m_format=1
				??'  '+tran(m_g_reg,m_tig)+tran(m_g_rot,m_tig)+tran(m_g_sphp,m_tig);
					+tran(m_g_spot,m_tig)+tran(m_g_lghp,m_tig)+tran(m_g_lgot,m_tig);
					+tran(m_g_nsd,'9999,999.99')+space(3)+tran(m_g_tax,m_tig)+tran(m_g_sss,m_tig)+tran(m_g_med,m_tig);
					+tran(m_g_pgbg,m_tig)+tran(m_g_sln,m_tig)+tran(m_g_cal_ded,m_tig);
					+tran(m_g_hdmf,m_tig)+tran(m_g_comp_ded,m_tig)+tran(m_g_comd_ded,m_tig);
					+tran(m_g_ded1,' '+m_tig)
				?spac(40)+tran(m_g_lv,m_tig)+tran(m_g_ls,m_tig)+tran(m_g_pay1,m_tig);
					+tran(m_g_pay3,m_tig)+tran(m_g_pay2,m_tig)+tran(m_g_pay4,m_tig);
					+tran(m_g_bonus,m_tig)+tran(m_g_grs+m_g_bonus,'999,999,999.99');
					+tran(m_g_ded2,m_tig)+tran(m_g_ded3,m_tig);
					+tran(m_g_ded4,m_tig)+tran(m_g_ded5,m_tig)+tran(m_g_ded6,m_tig);
					+tran(m_g_ded7,m_tig)+tran(m_g_ded8,m_tig)+tran(m_g_ded9,m_tig);
					+tran(m_g_ded10,' '+m_tig)+tran(m_gl_ded,' '+m_tig)+tran(m_g_net+m_g_bonus,' '+m_tig)

			case m_format=2
				if m_withhrs
					??tran(m_greg_hrs,m_tig5)+tran(m_grot_hrs,m_tig4);
						+tran(m_gnsd_hrs,m_tig4)+tran(m_gsphp_hrs,m_tig4);
						+tran(m_glgh_hrs,m_tig4)+tran(m_glgo_hrs,m_tig4)+tran(m_glvls_hrs,m_tig4);
						+ttrn(m_g_reg,m_tig7)+ttrn(m_g_rot,m_tig6);
						+ttrn(m_g_nsd,m_tig5)+ttrn(m_g_sphp+m_g_spot,m_tig8);
						+ttrn(m_g_lghp+m_g_lgot,m_tig8)+ttrn(m_g_lv+m_g_ls,m_tig5);
						+ttrn(m_g_pay1,m_tig8)+ttrn(m_g_pay3,m_tig6);
						+ttrn(m_g_pay2,m_tig5)+ttrn(m_g_pay4,m_tig5);
						+ttrn(m_g_bonus,m_tig5)+ttrn(m_g_grs+m_g_bonus,m_tig6);
						+ttrn(m_g_tax,m_tig6)+ttrn(m_g_sss,m_tig5);
						+ttrn(m_g_med,m_tig5)+ttrn(m_g_pgbg,m_tig5);
						+ttrn(m_g_sln+m_g_cal_ded+m_g_hdmf+m_g_comp_ded+m_g_comd_ded,m_tig6);
						+ttrn(m_g_ded1+m_g_ded2+m_g_ded3+m_g_ded4+m_g_ded5+m_g_ded6+m_g_ded7+m_g_ded8+m_t_ded9+m_g_ded10,m_tig6);
						+ttrn(m_gl_ded,m_tig6)+ttrn(m_g_net+m_g_bonus,m_tig6)
				else
					??'  '+ttrn(m_g_reg,m_fig3)+ttrn(m_g_nsd,m_fig);
						+ttrn(m_g_sphp+m_g_spot,m_fig)+ttrn(m_g_lghp+m_g_lgot,m_fig);
						+ttrn(m_g_rot,m_fig)+ttrn(m_g_lv+m_g_ls,m_fig);
						+ttrn(m_g_pay1,m_fig)+ttrn(m_g_pay2,m_fig);
						+ttrn(m_g_pay3,m_fig)+ttrn(m_g_pay4,m_fig);
						+ttrn(m_g_bonus,m_fig);
						+ttrn(m_g_grs+m_g_bonus,' '+m_fig3);
						+ttrn(m_g_tax,m_fig)+ttrn(m_g_sss,m_fig);
						+ttrn(m_g_med,m_fig)+ttrn(m_g_pgbg,m_fig);
						+ttrn(m_g_sln+m_g_cal_ded+m_g_hdmf+m_g_comp_ded+m_g_comd_ded,m_fig);
						+ttrn(m_g_ded1+m_g_ded2+m_g_ded3+m_g_ded4+m_g_ded5+m_g_ded6+m_g_ded7+m_g_ded8+m_g_ded9+m_g_ded10,m_fig);
						+ttrn(m_gl_ded,m_fig)+ttrn(m_g_net+m_g_bonus,' '+m_fig3)
				endif

			case m_format=3
				??'  '+ttrn(m_g_sln,m_fig)+ttrn(m_g_cal_ded,m_fig);
					+ttrn(m_g_hdmf,m_fig)+ttrn(m_g_comp_ded,m_fig);
					+ttrn(m_g_comd_ded,m_fig);
					+ttrn(m_g_sln+m_g_cal_ded+m_g_hdmf+m_g_comp_ded+m_g_comd_ded,m_fig)

			case m_format=4
				??'  '+ttrn(m_g_ded1,m_fig)+ttrn(m_g_ded2,m_fig);
					+ttrn(m_g_ded3,m_fig)+ttrn(m_g_ded4,m_fig);
					+ttrn(m_g_ded5,m_fig)+ttrn(m_g_ded6,m_fig);
					+ttrn(m_g_ded7,m_fig)+ttrn(m_g_ded8,m_fig);
					+ttrn(m_g_ded9,m_fig)+ttrn(m_g_ded10,m_fig);
					+ttrn(m_g_ded1+m_g_ded2+m_g_ded3+m_g_ded4+m_g_ded5+m_g_ded6+m_g_ded7+m_g_ded8+m_g_ded9+m_g_ded10,m_fig)
		endcase
		do case
			case m_format=1
				?repl('=',255)
			case m_format=2
				if m_withhrs
					?repl('=',270)
				else
					?repl('=',268)
				endif
			case m_format=3
				?repl('=',106)
			case m_format=4
				?repl('=',161)
		endcase
		?
		exit
	enddo

   if ! m_abort

   	if lastkey()=27
   		exit
   	endif
   	if m_individual .and. str(m_format,1)$'12'
   		m_tig='99,999,999.99'
   		?chr(12)
   		?
   		?m_company
   		?'P A Y R O L L   S U M M A R Y'
   		?'Payroll Period: '+m_d1+' - '+m_d2
   		?
   		?m_head
   		?repl('=',45)
   		?'EARNINGS'
   		?'========'
   		?'    REGULAR PAY................ '+tran(m_g_reg,m_tig)
   		?'    REGULAR OT................. '+tran(m_g_rot,m_tig)
   		?'    SPECIAL HOLIDAY............ '+tran(m_g_sphp,m_tig)
   		?'    SPECIAL HOLIDAY OT......... '+tran(m_g_spot,m_tig)
   		?'    LEGAL HOLIDAY.............. '+tran(m_g_lghp,m_tig)
   		?'    LEGAL HOLIDAY OT........... '+tran(m_g_lgot,m_tig)
   		?'    NIGHT SHIFT DIFFERENTIAL... '+tran(m_g_nsd,m_tig)
   		?'    V.LEAVE ENCASHMENT......... '+tran(m_g_lv,m_tig)
   		?'    S.LEAVE ENCASHMENT......... '+tran(m_g_ls,m_tig)
   		?'    TAXABLE PAY-1.............. '+tran(m_g_pay1,m_tig)
   		?'    TAXABLE PAY-2.............. '+tran(m_g_pay3,m_tig)
   		?'    NON-TAXABLE PAY-1.......... '+tran(m_g_pay2,m_tig)
   		?'    NON-TAXABLE PAY-2.......... '+tran(m_g_pay4,m_tig)
   		?'    BONUS...................... '+tran(m_g_bonus,m_tig)
   		?'    GROSS PAY.................. '+tran(m_g_grs+m_g_bonus,m_tig)
   		?
   		?'DEDUCTIONS'
   		?'=========='
   		?'    TAX WITHHELD............... '+tran(m_g_tax,m_tig)
   		?'    SSS PREMIUM................ '+tran(m_g_sss,m_tig)
   		?'    MEDICARE PREMIUM........... '+tran(m_g_med,m_tig)
   		?'    PAG-IBIG PREMIUM........... '+tran(m_g_pgbg,m_tig)
   		?'    '+m_rt_ln1+' PAYMENTS........ '+tran(m_g_sln,m_tig)
   		?'    '+m_rt_ln2+' PAYMENTS........ '+tran(m_g_cal_ded,m_tig)
   		?'    '+m_rt_ln3+' PAYMENTS........ '+tran(m_g_hdmf,m_tig)
   		?'    '+m_rt_ln4+' PAYMENTS........ '+tran(m_g_comp_ded,m_tig)
   		?'    '+m_rt_ln5+' PAYMENTS........ '+tran(m_g_comd_ded,m_tig)
   		?'    '+m_st_ded1 +'............. '+tran(m_g_ded1,m_tig)
   		?'    '+m_st_ded2 +'............. '+tran(m_g_ded2,m_tig)
   		?'    '+m_st_ded3 +'............. '+tran(m_g_ded3,m_tig)
   		?'    '+m_st_ded4 +'............. '+tran(m_g_ded4,m_tig)
   		?'    '+m_st_ded5 +'............. '+tran(m_g_ded5,m_tig)
   		?'    '+m_st_ded6 +'............. '+tran(m_g_ded6,m_tig)
   		?'    '+m_st_ded7 +'............. '+tran(m_g_ded7,m_tig)
   		?'    '+m_st_ded8 +'............. '+tran(m_g_ded8,m_tig)
   		?'    '+m_st_ded9 +'............. '+tran(m_g_ded9,m_tig)
   		?'    '+m_st_ded10+'............. '+tran(m_g_ded10,m_tig)
   		?'    TOTAL DEDUCTIONS........... '+tran(m_gl_ded,m_tig)
   		?'    NET PAY.................... '+tran(m_g_net+m_g_bonus,m_tig)
   		?
   		?repl('=',45)
   		?chr(12)
   	endif
   	if m_spool
   	   set alte off
      	set alte to
   	else
   	   set print off
      	set devi to scre
   	endi
   	set cons on

   endif
	exit

enddo
close all
set color to (m_oldcol)
release all
return

proc p_reghead
m_page=m_page+1
if m_page>1
	?chr(12)
endi
?m_company
?'P A Y R O L L   R E G I S T E R'
?'Payroll Period: '+m_d1+' - '+m_d2
?
do case
	case m_format=1
		?alltrim(m_head)+spac(30-len(alltrim(m_head)))+spac(205)+'Page '+str(m_page,3)
		?repl('=',255)
		if m_individual
			?'EMP#   EMPLOYEE NAME  '
		else
			?'DEPT#  DEPARTMENT NAME'
		endi
		??'                   REG-PAY    ROT-PAY    SPHP-PAY   SPOT-PAY   LGHP-PAY    LGOT-PAY    NSD-PAY       TAX-DED    SSS-DED    MED-DED    PGBG-DED   '+m_rt_ln1+' '+m_rt_ln2+' '+m_rt_ln3+' '+m_rt_ln4+' '+m_rt_ln5+' '+m_rt_ded1
		?'                                         VL-PAY     SL-PAY     TXBLE-PAY1 TXBLE-PAY2 NTAX-PAY3   NTAX-PAY4   BONUS        GROSS PAY   '+m_rt_ded2+' '+m_rt_ded3+' '+m_rt_ded4+' '+m_rt_ded5+' '+m_rt_ded6+' '+m_rt_ded7;
		+' '+m_rt_ded8+' '+m_rt_ded9+' '+m_rt_ded10+' TOTAL-DED    NET-PAY'
		?repl('=',255)
		m_crow=8
	case m_format=2
		if m_withhrs
			?alltrim(m_head)+spac(30-len(alltrim(m_head)))+spac(230)+'Page '+str(m_page,3)
			?repl('=',270)
		else
			?alltrim(m_head)+spac(30-len(alltrim(m_head)))+spac(208)+'Page '+str(m_page,3)
			?repl('=',268)
		endif
		if m_individual
			?'EMP#   EMPLOYEE NAME  '
		else
			?'DEPT#  DEPARTMENT NAME'
		endi
		if m_withhrs
         /*
         ??'                   REG.HR OT-HRS NSD.HR SPH.HR LGH.HR LV.DYS    REG.PAY    OT.PAY  '
			??'NSD-PAY   SPH.PAY  LGH.PAY   LV.PAY TxblePay1 TxblePay2 Ntax-Pay1 Ntax-Pay2 BONUS     GROSS-PAY   '
			??'TAX-DED  SSS-DED  MED-DED  PBG-DED  LOAN-DED  OTHR-DED TOTAL-DED   NET PAY'

         ??'                   REG.HR OT-HRS NSD.HR SPH.HR LGH.HR LV.DYS    REG.PAY    OT.PAY '
         ??'NSD-PAY SPH.PAY LGH.PAY  LV.PAY TxblePay1 TxblePay2 NtaxPay1 NtaxPay2 BONUS     GROSS-PAY   '
         ??'TAX-DED  SSS-DED  MED-DED  PBG-DED  LOAN-DED  OTHR-DED TOTAL-DED   NET PAY'
         */

         ??'             REG.HR OT-HRS NSD.HR SPH.HR LGH.HR LGH.OT LV.DYS    REG.PAY    OT.PAY '
         ??'NSD-PAY SPH.PAY LGH.PAY  LV.PAY CTPA/SEA  TxblePay2 NtaxPay1 NtaxPay2 13thMo   GROSS-PAY   '
         ??'TAX-DED  SSS-DED  MED-DED  PBG-DED  LOAN-DED  OTHR-DED TOTAL-DED   NET PAY'

			?repl('=',270)
		else
         ??'                     REG-PAY       NSD-PAY    SPH-PAY    LGH-PAY     OT-PAY  SL/VL-PAY  ADJUSTMENT   SSS-BEN   TXBLEPAY2  NON-TAX2    BONUS       GRS-PAY     TAX-DED    SSS-DED    MED-DED   PGBG-DED   LOAN-DED   OTHR-DED   TOTAL-DED    NET PAY'
			?repl('=',268)
		endif
		m_crow=7
	case m_format=3
		?alltrim(m_head)+spac(30-len(alltrim(m_head)))+spac(68)+'Page '+str(m_page,3)
		?repl('=',106)
		if m_individual
			?'EMP#   EMPLOYEE NAME  '
		else
			?'DEPT#  DEPARTMENT NAME'
		endif
		??'                   '+m_rt_ln1+' '+m_rt_ln2+' '+m_rt_ln3+' '+m_rt_ln4+' '+m_rt_ln5+' TOTAL'
		?repl('=',106)
		m_crow=7
	case m_format=4
		?alltrim(m_head)+spac(30-len(alltrim(m_head)))+spac(123)+'Page '+str(m_page,3)
		?repl('=',161)
		if m_individual
			?'EMP#   EMPLOYEE NAME  '
		else
			?'DEPT#  DEPARTMENT NAME'
		endi
		??'                   '+m_rt_ded1+' '+m_rt_ded2+' '+m_rt_ded3+' '+m_rt_ded4+' '+m_rt_ded5+' '+m_rt_ded6+' '+m_rt_ded7+' '+m_rt_ded8+' '+m_rt_ded9+' '+m_rt_ded10+'      TOTAL'
		?repl('=',161)
		m_crow=7
endcase
m_nextpg=.f.
retu

func ttrn
para _m_qty,_m_pic
if _m_qty > val(strtran(_m_pic,",",""))
	return(' '+tran(_m_qty,right('999999999999.99',len(_m_pic)-1)))
else
	return(tran(_m_qty,_m_pic))
endif
