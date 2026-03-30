* Program Name : Payroll Timecard Initialization
* Program Code : Inittime.prg
* Description  : This program initializes the Timecard File
*              : for new payroll period.
* Author       : SVC
* Date Started : June 14, 1994
* Date Finished: June 15, 1994
***************************************************

para m_new_year
m_old_col=setcolor()
do whil .t.
	m_prevscrn=savescreen(9,23,18,55)
	f_setting()
	sele 1
	if .not. net_use('&dpath\tmcard',.t.,5)
		exit
	endi
	set inde to &dpath\tbyemp,&dpath\tbydep,&dpath\tbynm
	if .not. fil_lock(5)
		exit
	endi
	m_recctime=recc()
	sele 3
	if .not. net_use('&dpath\sys_id',.t.,5)
		exit
	endi
	if .not. fil_lock(5)
		exit
	endi

   if needbackup
      f_err('Please make a backup first!',.t.)
      exit
   endif

	m_pres_mo=pres_mo
	if (trn_ctr=0 .or. m_recctime=0).and..not.m_new_year
		f_err('No need to Initialize.  No records in Timecard file.',.t.)
		exit
	endif
	if trn_ctr<>trn_prc.and..not.m_new_year
		*f_err('Initialization denied!  Emp.in Timecard not equal to Emp.Computed',.t.)
		f_err('Initialization denied!',.t.)
		exit
	endif
	if trn_prc#trn_upd.and..not.m_new_year
		f_err('Initialization denied!  Timecard not yet posted !',.t.)
		exit
	endif
	sele 2
	if .not. net_use('&dpath\master',.t.,5)
		exit
	endi
	set inde to &dpath\mbyemp
	if .not. fil_lock(5)
		exit
	endi
	sele 4
	if .not. net_use('&dpath\dept',.t.,5)
		exit
	endi
	if .not. fil_lock(5)
		exit
	endi
	*get week #, get start-end payroll period
	sele sys_id
	m_beg_date=end_date+1
   m_end_date=end_date+(end_date-beg_date)+1
	m_workhours=workhours
	m_pay_type=iif(pay_type=1,2,1)
	f_bcln()
	f_drawbox(9,24,17,55,1,3)
	set colo to (m_cnor)
	@10,27 say 'INITIALIZE  TIMECARD  FILE'
	@11,27 to 11,52
	@12,27 say 'BEGINNING DATE : '
	@13,27 say 'ENDING DATE... : '
	@14,27 say '1st/2nd HAL... : '
	@15,27 say 'MONTH......... : '
	@16,27 say 'NO. OF HRS.... : '
	do whil .t.
		@12,45 get m_beg_date vali dtoc(m_beg_date)#'  /  /  '
		@13,45 get m_end_date vali dtoc(m_end_date)#'  /  /  '.and.m_end_date>m_beg_date
		@14,45 get m_pay_type pict '9' vali str(m_pay_type,1)$'123'
		read
		if m_pay_type=1
			m_pres_mo=pres_mo+1
			if m_pres_mo=13
				m_pres_mo=1
			endif
		else
			m_pres_mo=pres_mo
		endif
		@15,45 get m_pres_mo pict '99' vali m_pres_mo>0 .and. m_pres_mo<13 
		@16,45 get m_workhours pict '999' vali m_workhours>0
		read
		if .not. (m_pres_mo=month(m_beg_date).or.m_pres_mo=month(m_end_date))
			f_err('Invalid Month ! It does not correspond to payroll period.',.t.)
			loop
		endif
		if lastkey()=27
			exit
		endi		
		if f_ask('Data correct ?')
			exit
		endi
	endd
	if lastkey()=27
		exit
	endi
	if m_pay_type=1
		f_mess("1st/2nd Half is set to 1, make sure you've printed all the monthly reports.",.t.)
	endi
	do whil .t.
		f_mess("Press 'B' to begin initialization, 'Esc' to Abort.",.f.)
		m_inkey=inkey(0)
		if chr(m_inkey)$'Bb' .or. lastkey()=27
			exit
		endi
	endd
	if lastkey()=27
		exit
	endi
	f_mess('Updating the System-ID file.  Please wait...',.f.)
	repl trn_ctr with 0, trn_prc with 0, trn_upd with 0,;
		beg_date with m_beg_date, end_date with m_end_date,;
		pay_type with m_pay_type, pres_mo with m_pres_mo,;
		prc_date with m_beg_date, upd_date with m_beg_date,;
		mon_flag with m_pres_mo-1, needbackup with .t.
	f_mess('Initializing the Timecard file.  Please wait...',.f.)
	sele tmcard
	zap
	f_mess('Setting-up the Master file.  Please wait...',.f.)
	sele master
   repl all trn_flag with 'N'
   if m_pay_type=1 .or. m_new_year
		f_mess('Initializing the Master file monthly counters.  Please wait...',.f.)
		repl all m_basic with 0, m_hol with 0, m_ot with 0, m_nsd with 0, m_leave with 0,;
			m_leave2 with 0, m_sleave with 0, m_othp1 with 0, m_othp2 with 0,;
			m_othp3 with 0, m_gross with 0, m_sln with 0, m_hln with 0,;
			m_sscal with 0, m_coln with 0, m_comln with 0,;
			m_ded1 with 0, m_ded2 with 0, m_ded3 with 0, m_ded4 with 0,;
			m_ded5 with 0, m_ded6 with 0, m_ded7 with 0, m_ded8 with 0,;
			m_ded9 with 0, m_ded10 with 0, m_tax with 0, m_ssee with 0,;
			m_sser with 0, m_medee with 0, m_meder with 0, m_pgee with 0,;
			m_pger with 0, m_ecer with 0, m_tded with 0, m_netpay with 0,;
			m_bontot with 0, m_bontax with 0, m_othp4 with 0
	endif

	if (str(m_pres_mo,2)$' 1~ 4~ 7~10'.and.m_pay_type=1) .or. m_new_year
		f_mess('Initializing the Master file quarterly counters.  Please wait...',.f.)
		repl all ss_ee1 with 0, ss_er1 with 0, med_ee1 with 0, med_er1 with 0,;
			pgbg_ee1 with 0, pgbg_er1 with 0, ec_er1 with 0, tax_ee1 with 0,;
			grs_ee1 with 0, sln_pay1 with 0, hln_pay1 with 0, cal_pay1 with m_sscal,;
			com_pay1 with m_coln, comd_pay1 with m_comln,;
			ss_ee2 with 0, ss_er2 with 0,	med_ee2 with 0, med_er2 with 0,;
			pgbg_ee2 with 0, pgbg_er2 with 0, ec_er2 with 0, tax_ee2 with 0,;
			grs_ee2 with 0, sln_pay2 with 0, hln_pay2 with 0, cal_pay2 with m_sscal,;
			com_pay2 with m_coln, comd_pay2 with m_comln,;
			ss_ee3 with 0, ss_er3 with 0, med_ee3 with 0, med_er3 with 0,;
			pgbg_ee3 with 0, pgbg_er3 with 0, ec_er3 with 0, tax_ee3 with 0,;
			grs_ee3 with 0, sln_pay3 with 0, hln_pay3 with 0, cal_pay3 with m_sscal,;
			com_pay3 with m_coln, comd_pay3 with m_comln
	endif

	if m_new_year
		f_mess('Initializing the Master file yearly counters.  Please wait...',.f.)
		repl all y_basic with 0, y_hol with 0, y_ot with 0, y_nsd with 0, y_leave with 0,;
			y_leave2 with 0, y_sleave with 0, y_othp1 with 0, y_othp2 with 0,;
			y_othp3 with 0, y_gross with 0, y_sln with 0, y_hln with 0,;
			y_ded1 with 0, y_ded2 with 0, y_ded3 with 0, y_ded4 with 0,;
			y_ded5 with 0, y_ded6 with 0, y_ded7 with 0, y_ded8 with 0,;
			y_ded9 with 0, y_ded10 with 0, y_tax with 0, y_tded with 0,;
         y_netpay with 0, y_midbon with 0, y_midtax with 0,;
			y_sscal with 0, y_coln with 0, y_comln with 0,;
         y_premium with 0, y_othergrs with 0, y_othertax with 0,;
         y_othp4 with 0, y_sss with 0, y_med with 0, y_pbg with 0,;
         y_bonus with 0, y_btax with 0, y_midbon with 0, y_midtax with 0,;
         vac_used with 0, sik_used with 0

	endif
	m_reccmast=recc()
	f_mess('Initializing the Department decode file.  Please wait...',.f.)
 	sele dept  && INITIALIZE DEPARTMENT FILE
	repl all reg_pay with 0, ot_pay with 0, hol_pay with 0, oth_pay1 with 0,;
		oth_pay2 with 0, oth_pay3 with 0, lvenc_pay with 0, lsenc_pay with 0,;
		grs_pay with 0, tax with 0, sss_ee with 0, sss_er with 0, med_ee with 0,;
		med_er with 0, pgbg_ee with 0, pgbg_er with 0, ec_er with 0,;
		sss_loan with 0, pbg_loan with 0, oth_ded1 with 0, oth_ded2 with 0,;
		oth_ded3 with 0, oth_ded4 with 0, oth_ded5 with 0, oth_ded6 with 0,;
		oth_ded7 with 0, oth_ded8 with 0, oth_ded9 with 0, oth_ded10 with 0,;
	 	net_pay with 0, emp_ctr with 0, bontot with 0, bontax with 0,;
		oth_pay4 with 0, cal_loan with 0, comp_loan with 0, commodloan with 0
	sele sys_id
	repl emp_ctr with m_reccmast
	f_mess('Initialization Completed...',.f.)
	inke(3)
	exit
endd
restscreen(9,23,17,55,m_prevscrn)
clos all
set colo to (m_old_col)
retu
