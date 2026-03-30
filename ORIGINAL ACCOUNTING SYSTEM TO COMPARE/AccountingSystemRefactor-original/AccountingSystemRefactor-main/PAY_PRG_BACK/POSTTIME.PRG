* Program Name : Payroll Timecard Posting
* Program Code : Posttime.prg
* Description  : This program post the timecard against the Master File.
* Author       : SVC
* Date Started : June 10, 1994
* Date Finished: June 14, 1994
***************************************************

m_old_col=setcolor()
m_prevscrn=savescreen(8,3,16,76)
do whil .t.
	f_setting()
	sele 1
	if .not. net_use('&dpath\tmcard',.f.,5)
		exit
	endif
	if recc()=0
		f_err('NO Timecard to Post !',.t.)
		exit		
	endif
	set inde to &dpath\tbyemp
	if .not. fil_lock(5)
		exit
	endif
	sele 2
	if .not. net_use('&dpath\master',.f.,5)
		exit
	endif
	set inde to &dpath\mbyemp
	if .not. fil_lock(5)
		exit
	endif
	sele 5
	if .not. net_use('&dpath\premmast',.f.,5)
		exit
	endif
	set inde to &dpath\premmast
	if .not. fil_lock(5)
		exit
	endif
	sele 4
	if .not. net_use('&dpath\dept',.f.,5)
		exit
	endif
	set inde to &dpath\dbydep
	sele 3
	if .not. net_use('&dpath\sys_id',.f.,5)
		exit
	endif
	if .not. fil_lock(5)
		exit
	endif
	if trn_ctr<>trn_prc
		f_err('No. of Emp.in Timecard is not equal to the No. of Emp. Computed',.t.)
		exit
	endif
	if trn_prc=trn_upd
		f_err('Timecard already posted. Check System-ID file.',.t.)
		exit
	endif
	m_pay_type=pay_type
	m_pres_mo=str(pres_mo,2)
	m_addprem=.f.
	if m_pay_type=2
		if .not. f_ask('Posting the 2nd half. Is there a 3rd payroll for this month?')
			m_pres_yr=str(year(beg_date),4)
			*Confirm Month and Year
			m_pstscrn=savescreen(6,21,12,56)
			f_bcln()
			f_drawbox(6,22,11,56,1,3)
			set colo to (m_cnor)
			do while .t.
				@ 7,25 say 'CONFIRM THE PERIOD TO POST'
				@ 9,31 say       'MONTH :'
				@10,31 say       'YEAR  :'
				@ 9,39 get m_pres_mo pict '99' vali val(m_pres_mo)>0.and.val(m_pres_mo)<13
				@10,39 get m_pres_yr pict '9999' vali m_pres_yr >= str(year(beg_date-1),4)
				read
				if lastkey()=27
					exit
				endif
				if f_ask('Period Correct ?')
					exit
				endif
			enddo
			if lastkey()=27
				restscreen(6,21,12,56,m_pstscrn)
				exit
			endif
			m_pres_mo=str(val(m_pres_mo),2)
			m_period=m_pres_yr+subs(str(100+val(m_pres_mo),3),2,2)
			m_addprem=.t.
			restscreen(6,21,12,56,m_pstscrn)
		else
			if .not. f_ask('Are you sure there is a 3rd payroll for this month ?')
				exit
			else
				if .not. f_password(77)
					exit
				endif
			endif
		endif
		if lastkey()=27
			exit
		endif
	endif
	select tmcard
	m_recc=recc()
	go top
	f_drawbox(8,3,15,76,5,3)
	set colo to (m_cnor)
	@10,15 say repl('.',50)
	@11,15 say '0%          25%         50%          75%      100%'
	@13, 6 say 'Posting the Timecard of Emp#      -'
	@14, 6 to 14,73
	m_ctr=0
	do whil .not. eof()
		m_ctr=m_ctr+1
		@ 9,15 say repl(chr(219),int(round(m_ctr/m_recc*50,0)))
		@13,35 say emp_no
		@13,42 say emp_nm
		if trn_flag='U'
			skip
			loop
		endif
		m_emp_no=emp_no
		m_emp_nm=emp_nm
		m_dep_no=dep_no
		m_reg_hrs=reg_hrs
		m_sln_ded=sln_ded
		m_hdmf_ded=hdmf_ded
		m_oth_ded1=oth_ded1
		m_oth_ded2=oth_ded2
		m_oth_ded3=oth_ded3
		m_oth_ded4=oth_ded4
		m_oth_ded5=oth_ded5
		m_oth_ded6=oth_ded6
		m_oth_ded7=oth_ded7
		m_oth_ded8=oth_ded8
		m_oth_ded9=oth_ded9
		m_oth_ded0=oth_ded10
		m_pgbg_ee=pgbg_ee
		m_pgbg_er=pgbg_er
		m_reg_pay=reg_pay
		m_rot_pay=rot_pay
		m_sphp_pay=sphp_pay
		m_spot_pay=spot_pay
		m_lghp_pay=lghp_pay
		m_lgot_pay=lgot_pay
		m_lv_pay=lv_pay
		m_lv2_pay=lv2_pay
		m_ls_pay=ls_pay
		m_oth_pay1=oth_pay1
		m_oth_pay2=oth_pay2   &&(non-taxable)
		m_oth_pay3=oth_pay3
		m_oth_pay4=oth_pay4   &&(non-taxable)
		m_grs_pay=grs_pay
		m_sss_ee=sss_ee
		m_sss_er=sss_er
		m_med_ee=med_ee
		m_med_er=med_er
		m_pgbg_ee=pgbg_ee
		m_pgbg_er=pgbg_er
		m_ec_er=ec_er
		m_tax_ee=tax_ee
		m_tot_ded=tot_ded
		m_net_pay=net_pay
      m_overtime=rot_pay+spot_pay+lgot_pay
      m_holiday=sphp_pay+lghp_pay
      m_otherpay=oth_pay1+oth_pay2+oth_pay3+oth_pay4
		m_deductions=oth_ded1+oth_ded2+oth_ded3+oth_ded4+oth_ded5+oth_ded6;
			+oth_ded7+oth_ded8+oth_ded9+oth_ded10
		m_nsd_pay=nsd_pay
		m_cal_ded=cal_ded
		m_comp_ded=comp_ded
		m_comd_ded=comd_ded
		m_vl_used=vl_used
		m_sl_used=sl_used
		m_bonus=bonus
		m_bonustax=bonustax
		sele master
		seek m_emp_no
		if eof()
			f_err('Employee #'+m_emp_no+' not in Master file.  Please check.',.t.)
			sele tmcard
			skip
			loop
		endif
		repl m_basic with m_basic+m_reg_pay, m_hol with m_hol+m_holiday,;
			m_ot with m_ot+m_overtime, m_leave with m_leave+m_lv_pay,;
			m_leave2 with m_leave2+m_lv2_pay, m_sleave with m_sleave+m_ls_pay,;
			m_othp1 with m_othp1+m_oth_pay1, m_othp2 with m_othp2+m_oth_pay2,;
			m_othp3 with m_othp3+m_oth_pay3, m_othp4 with m_othp4+m_oth_pay4,;
			m_gross with m_gross+m_grs_pay,;
			m_sln with m_sln+m_sln_ded, m_hln with m_hln+m_hdmf_ded,;
			sln_bal with sln_bal-m_sln_ded, hln_bal with hln_bal-m_hdmf_ded,;
			m_ded1 with m_ded1+m_oth_ded1, m_ded2 with m_ded2+m_oth_ded2,;
			m_ded3 with m_ded3+m_oth_ded3, m_ded4 with m_ded4+m_oth_ded4,;
			m_ded5 with m_ded5+m_oth_ded5, m_ded6 with m_ded6+m_oth_ded6,;
			m_ded7 with m_ded7+m_oth_ded7, m_ded8 with m_ded8+m_oth_ded8,;
			m_ded9 with m_ded9+m_oth_ded9, m_ded10 with m_ded10+m_oth_ded0,;
			m_tax with m_tax+m_tax_ee, m_ssee with m_ssee+m_sss_ee,;
			m_sser with m_sser+m_sss_er, m_medee with m_medee+m_med_ee,;
      	m_meder with m_meder+m_med_er, m_pgee with m_pgee+m_pgbg_ee,;
			m_pger with m_pger+m_pgbg_er, m_ecer with m_ecer+m_ec_er,;
			m_tded with m_tded+m_tot_ded, m_netpay with m_netpay+m_net_pay,;
			m_bontot with m_bontot + m_bonus, m_bontax with m_bontax+m_bonustax
		repl m_nsd with m_nsd+m_nsd_pay,;
			ss_cal_bal with ss_cal_bal-m_cal_ded, m_sscal with m_sscal+m_cal_ded,;
			co_ln_bal with co_ln_bal-m_comp_ded, m_coln with m_coln+m_comp_ded,;
			com_ln_bal with com_ln_bal-m_comd_ded, m_comln with m_comln+m_comd_ded,;
			vac_used with vac_used+m_vl_used, sik_used with sik_used+m_sl_used

	   do case
			case m_pres_mo$' 1~ 4~ 7~10'
				repl ss_ee1 with m_ssee, ss_er1 with m_sser,;
					med_ee1 with m_medee, med_er1 with m_meder,;
					pgbg_ee1 with m_pgee, pgbg_er1 with m_pger,;
					ec_er1 with m_ecer, tax_ee1 with m_tax+m_ded10,;
					grs_ee1 with m_gross-m_othp2-m_othp4, sln_pay1 with m_sln,;
					hln_pay1 with m_hln, cal_pay1 with m_sscal,;
					com_pay1 with m_coln, comd_pay1 with m_comln
					if m_bontot > m_tax_bon
						replace grs_ee1 with grs_ee1+(m_bontot-m_tax_bon),;
							tax_ee1 with tax_ee1+m_bontax
					endif
               if grs_ee1 < 0
                  replace grs_ee1 with 0
               endif

			case m_pres_mo$` 2~ 5~ 8~11'
				repl ss_ee2 with m_ssee, ss_er2 with m_sser,;
					med_ee2 with m_medee, med_er2 with m_meder,;
					pgbg_ee2 with m_pgee, pgbg_er2 with m_pger,;
					ec_er2 with m_ecer, tax_ee2 with m_tax+m_ded10,;
					grs_ee2 with m_gross-m_othp2-m_othp4, sln_pay2 with m_sln,;
					hln_pay2 with m_hln, cal_pay2 with m_sscal,;
					com_pay2 with m_coln, comd_pay2 with m_comln
					if m_bontot > m_tax_bon
						replace grs_ee2 with grs_ee2+(m_bontot-m_tax_bon),;
							tax_ee2 with tax_ee2+m_bontax
					endif
               if grs_ee2 < 0
                  replace grs_ee2 with 0
               endif

	      case m_pres_mo$' 3~ 6~ 9~12'
				repl ss_ee3 with m_ssee, ss_er3 with m_sser,;
					med_ee3 with m_medee, med_er3 with m_meder,;
					pgbg_ee3 with m_pgee, pgbg_er3 with m_pger,;
					ec_er3 with m_ecer, tax_ee3 with m_tax+m_ded10,;
					grs_ee3 with m_gross-m_othp2-m_othp4, sln_pay3 with m_sln,;
					hln_pay3 with m_hln, cal_pay3 with m_sscal,;
					com_pay3 with m_coln, comd_pay3 with m_comln
					if m_bontot > m_tax_bon
						replace grs_ee3 with grs_ee3+(m_bontot-m_tax_bon),;
							tax_ee3 with tax_ee3+m_bontax
					endif
               if grs_ee3 < 0
                  replace grs_ee3 with 0
               endif

		endcase

		repl y_basic with y_basic+m_reg_pay, y_hol with y_hol+m_holiday,;
			y_ot with y_ot+m_overtime, y_leave with y_leave+m_lv_pay,;
			y_leave2 with y_leave2+m_lv2_pay, y_sleave with y_sleave+m_ls_pay,;
			y_othp1 with y_othp1+m_oth_pay1, y_othp2 with y_othp2+m_oth_pay2,;
			y_othp3 with y_othp3+m_oth_pay3, y_othp4 with y_othp4+m_oth_pay4,;
			y_gross with y_gross+m_grs_pay,;
			y_sln with y_sln+m_sln_ded, y_hln with y_hln+m_hdmf_ded,;
			y_ded1 with y_ded1+m_oth_ded1, y_ded2 with y_ded2+m_oth_ded2,;
			y_ded3 with y_ded3+m_oth_ded3, y_ded4 with y_ded4+m_oth_ded4,;
			y_ded5 with y_ded5+m_oth_ded5, y_ded6 with y_ded6+m_oth_ded6,;
			y_ded7 with y_ded7+m_oth_ded7, y_ded8 with y_ded8+m_oth_ded8,;
			y_ded9 with y_ded9+m_oth_ded9, y_ded10 with y_ded10+m_oth_ded0,;
			y_tax with y_tax+m_tax_ee, y_tded with y_tded+m_tot_ded,;
         y_netpay with y_netpay+m_netpay, y_nsd with y_nsd+m_nsd_pay,;
			y_sscal with y_sscal+m_cal_ded, y_coln with y_coln+m_comp_ded,;
			y_comln with y_comln+m_comd_ded, y_midbon with m_bonus,;
			y_midtax with m_bonustax, y_sss with y_sss + m_sss_ee,;
		   y_med with y_med + m_med_ee, y_pbg with y_pbg + m_pgbg_ee

		if m_addprem
			m_m_ssee=m_ssee
			m_m_medee=m_medee
			m_m_pgee=m_pgee
			select premmast
			seek m_period+emp_no
			if eof()
				append blank
				replace period with m_period, emp_no with m_emp_no,;
					emp_nm with m_emp_nm
			endif
			replace m_ssee with m_m_ssee, m_medee with m_m_medee,;
	      	m_pgee with m_m_pgee
		endif
		sele tmcard
      repl trn_flag with 'U'
		skip
	enddo
	select sys_id
	if fil_lock(5)
		repl trn_upd with m_ctr
	endif
	@ 9,15 say repl(chr(219),50)
	f_mess('Posting Completed...',.f.)
	inkey(3)
	exit
enddo
restscreen(8,3,16,76,m_prevscrn)
close all
return
