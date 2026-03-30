* Program Name : System ID File Maintenance
* Program Code : Systedit.prg
* Description  : This program allows the user maintain the system ID file.
* Author : Sonny V. Cruz
* Date   : June  09, 1994
*******************************************************************************

m_old_col=setcolor()
do whil .t.
	save scre to m_prevscrn
	f_setting()
	sele 3
	if .not. net_use('&dpath\sys_id',.t.,5)
		exit
	endi
	if .not. fil_lock(5)
		exit
	endi
	f_drawbox(3,15,21,62,5,3)
	set colo to (m_crev)
	@ 3,16 say '    PAYROLL STATUS INFORMATION MAINTENANCE    '
	set colo to (m_cnor)
	@ 4,19 say    'NO. OF EMPLOYEES ON RECORD... :'
	@ 5,19 say 'PRESENT MONTH................ :'
	@ 6,19 say 'PRESENT HALF (1st or 2nd HALF :'
*	@ 7,19 say 'NO. OF WEEKS THIS MONTH.(4-5) :'
	@ 8,19 say 'LAST DATE PROCESSED.......... :'
	@ 9,19 say 'LAST DATE POSTED............. :'
	@10,19 say 'DATE COVERED (Beginning)..... :'
	@11,19 say '             (Ending)........ :'
	@12,19 say 'NO. OF TIMECARDS ENTERED..... :'
	@13,19 say 'NO. OF TIMECARDS PROCESSED... :'
	@14,19 say 'NO. OF TIMECARDS POSTED...... :'
	@15,19 say 'MONTHLY FLAG................. :'
	@16,19 say 'QUARTER FLAG................. :'
*	@17,19 say 'PAG-IBIG PREMIUM PER PERIOD.. :'
	@18,19 say 'UNION DUES................... :'
	@19,19 say 'UNION DEATH.................. :'
	@20,19 say 'TTL WORKING HOURS THIS PERIOD :'
	do whil .t.
		@ 4,51 say emp_ctr pict '9,999'
		@ 5,51 say pres_mo pict '99'
		@ 6,51 say pay_type pict '9'
		@ 8,51 say prc_date pict '99/99/99'
		@ 9,51 say upd_date pict '99/99/99'
		@10,51 say beg_date pict '99/99/99'
		@11,51 say end_date pict '99/99/99'
		@12,51 say trn_ctr pict '9,999'
		@13,51 say trn_prc pict '9,999'
		@14,51 say trn_upd pict '9,999'
		@15,51 say mon_flag pict '99'
		@16,51 say qtr_flag pict '9'
*		@17,51 say hdmf_pre pict '9,999.99'
		@18,51 say uniondues pict '9,999.99'
		@19,51 say uniondet pict '9,999.99'
		@20,51 say workhours pict '999.99'
		if f_choose('Select:','EDIT','EXIT')
			m_emp_ctr=emp_ctr
			m_pres_mo=pres_mo
			m_pay_type=pay_type
			m_prc_date=prc_date
			m_upd_date=upd_date
			m_beg_date=beg_date
			m_end_date=end_date
			m_trn_ctr=trn_ctr
			m_trn_prc=trn_prc
			m_trn_upd=trn_upd
			m_mon_flag=mon_flag
			m_qtr_flag=qtr_flag
			m_uniondues=uniondues
			m_uniondet=uniondet
			m_workhours=workhours
			do whil .t.
				*@ 4,51 get m_emp_ctr pict '9,999'
				@ 5,51 get m_pres_mo pict '99' vali m_pres_mo<13 .and. m_pres_mo>0
				@ 6,51 get m_pay_type pict '9' vali m_pay_type<4 .and. m_pay_type>0
				@ 8,51 get m_prc_date pict '99/99/99'
				@ 9,51 get m_upd_date pict '99/99/99'
				@10,51 get m_beg_date pict '99/99/99'
				@11,51 get m_end_date pict '99/99/99'
				*@12,51 get m_trn_ctr pict '9,999' vali m_trn_ctr<=m_emp_ctr
				@13,51 get m_trn_prc pict '9,999' vali m_trn_prc<=m_trn_ctr
				@14,51 get m_trn_upd pict '9,999' vali m_trn_upd<=m_trn_ctr
				@15,51 get m_mon_flag pict '99' vali m_mon_flag<13 .and. m_mon_flag>0
				@16,51 get m_qtr_flag pict '9' vali m_qtr_flag<5 .and. m_qtr_flag>0
				@18,51 get m_uniondues pict '9,999.99'
				@19,51 get m_uniondet pict '9,999.99'
				@20,51 get m_workhours pict '999.99'
				read
				if lastkey()=27
					exit
				endif
				if .not. (month(m_beg_date)=m_pres_mo.or.month(m_end_date)=m_pres_mo)
					f_err('Invalid Month ! It does not correspond to payroll period.',.t.)
					loop
				endif
				if .not. f_ask('Data correct ?')
					loop
				endi
				if f_ask('Save ?')
					if recc()>1 .or. recc()=0
						zap
						appe blan
					endi
					repl emp_ctr with m_emp_ctr, pres_mo with m_pres_mo,;
						pay_type with m_pay_type, prc_date with m_prc_date,;
						upd_date with m_upd_date, beg_date with m_beg_date,;
						end_date with m_end_date, trn_ctr with m_trn_ctr,;
						trn_prc with m_trn_prc,	trn_upd with m_trn_upd,;
						mon_flag with m_mon_flag, qtr_flag with m_qtr_flag,;
						uniondues with m_uniondues,;
						uniondet with m_uniondet, workhours with m_workhours
				endi
				exit
			endd
		else
			exit
		endi
	endd
	exit	
endd
clos all
rest scre from m_prevscrn
retu
