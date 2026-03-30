/*
Program Name : Append Data Records
Program Code : Appetime.prg
Description  : This program allows the user to add/edit/delete timecard file.
Author : Sonny V. Cruz
Date   : Dec 11, 2000
*/

m_old_col:=setcolor()
while .t.
	save scre to m_prevscrn
	f_setting()

   f_bcln()

   m_filename:=space(40)

   while .t.
      @24,0 say 'ENTER DATA FILENAME:' get m_filename pict '@!' valid m_filename!=space(40)
      read
      if lastkey()=27
         exit
      endif
      if ! file('&m_filename')
	      f_err('&m_filename '+'file does not exist !',.t.)
         loop
      endif
      if f_ask('Filename:'+alltrim(m_filename)+' Are you sure?')
         exit
      endif
      if lastkey()=27
         exit
      endif
   end while
   if lastkey()=27
      exit
   endif

	select 1
	if ! net_use('&dpath\tmcard',.f.,5)
		exit
	endif
	set inde to &dpath\tbyemp,&dpath\tbydep,&dpath\tbynm
   if ! fil_lock(5)
      exit
   endif

   if ! eof()
      if ! f_ask('Timecard File is not Empty!  Overwrite existing records?')
         exit
      endif
   endif

	select 5
	if ! net_use('&dpath\master',.f.,5)
		exit
	endif
	set inde to &dpath\mbyemp, &dpath\mbynm, &dpath\mbydep
   if ! fil_lock(5)
      exit
   endif

	select 7
	if ! net_use('&dpath\history',.f.,5)
		exit
	endif
	set inde to &dpath\hbyemp, &dpath\hbynm, &dpath\hbydep
   if ! fil_lock(5)
      exit
   endif

	select 6
	if .not. net_use('&opath\taxtab',.f.,5)
		exit
	endif
	set inde to &opath\tax

	select 3
	if ! net_use('&dpath\sys_id',.f.,5)
		exit
	endif

	m_pay_type=pay_type
	m_uniondues=uniondues
	m_uniondet=uniondet
	m_needbackup=needbackup
	m_workhours=workhours
	m_pg_lower=pg_lower
	m_pg_higher=pg_higher
	m_pg_lwper=pg_lwper
	m_pg_hiper=pg_hiper
	m_bon_days=bon_days
	m_bon_mont=bon_mont

	m_m_gross=0
	m_m_ssee=0
	m_m_sser=0
	m_m_medee=0
	m_m_meder=0
	m_m_pgee=0
	m_m_pger=0
	m_m_ecer=0
	m_m_othp1=0
	m_m_othp2=0
	m_m_basic=0
	m_m_leave=0
	m_emp_no='      '
	m_emp_nm=spac(32)
	m_dep_no=spac(2)
	m_status=spac(3)
	m_pgbg_member=.f.
	m_withbonus=.f.
	m_sss_member=.t.
   emp_type := ' '
   emp_stat := ' '

	stor 0 to m_reg_hrs, m_abs_hrs, m_rot_hrs, m_sphp_hrs, m_spot_hrs,;
		m_lghp_hrs, m_lgot_hrs, m_oth_pay1, m_oth_pay2, m_oth_pay3, m_lv_hrs,;
		m_ls_hrs, m_sln_ded, m_hdmf_ded, m_oth_ded1, m_oth_ded2, m_oth_ded3,;
		m_oth_ded4, m_oth_ded5, m_oth_ded6, m_oth_ded7, m_oth_ded8, m_oth_ded9,;
		m_oth_ded0, m_rate, m_tax_ded, m_vl_used, m_sl_used, m_comp_ded,;
		m_comd_ded, m_cal_ded, m_nsd_hrs, m_cola, m_oth_pay4,;
		m_bonus, m_bonustax, m_vl_avail, m_sl_avail, m_vac_lv, m_sik_lv, m_vleave, m_sleave
	stor 0 to m_reg_pay, m_rot_pay, m_sphp_pay, m_spot_pay, m_lghp_pay,;
		m_lgot_pay, m_lv_pay, m_lv2_pay, m_ls_pay, m_grs_pay, m_net_pay,;
		m_abs_ded, m_tot_ded, m_sss_de, m_sss_dr, m_med_de, m_med_dr,;
		m_pgbg_ee, m_pgbg_er, m_ec_dr, m_tax_ee, m_nsd_pay

   m_file:=alltrim(m_filename)

   if rat('\',m_file) > 0
      m_mastpath := subs(m_file,1,rat('\',m_file)-1)
   else
      if rat(':',m_file) > 0
         m_mastpath := subs(m_file,1,rat(':',m_file)-1)
      endif
   endif

   @0,0 say m_mastpath+'  '

   //Update Masterfile First
   select 8
	if net_use('&m_mastpath\mastfile',.f.,5)
      dbgotop()
      while ! eof()
         m_emp_no      :=emp_no
         m_emp_nm      :=emp_nm
         m_mname       :=mname
         m_dep_no      :=dep_no
         m_b_rate      :=b_rate
         m_status      :=status
         m_tan         :=tan
         m_phic        :=phic
         m_sss         :=sss
         m_pgbg_no     :=pgbg_no
         m_sss_member  :=sss_member
         m_pgbg        :=pgbg
         m_emp_type    :=emp_type
         m_emp_stat    :=emp_stat
         m_acct_no     :=acct_no
         m_vac_lv      :=vac_lv
         m_vac_used    :=vac_used
         m_sik_lv      :=sik_lv
         m_sik_used    :=sik_used

         m_position    :=position
         m_position    :=position
         m_date_emp    :=date_emp
         m_date_sep    :=date_sep
         m_birthd      :=birthd
         m_spouse      :=spouse
         m_address     :=address
         m_tel_no      :=tel_no
         m_relig       :=relig
         m_educ        :=educ
         m_med1        :=med1
         m_med2        :=med2

         select master
         seek m_emp_no

         if eof()
            append blank
            if m_emp_type = " "
               replace emp_type with "A"
            else
               replace emp_type with m_emp_type
            endif
         endif

         replace emp_no with m_emp_no, emp_nm with m_emp_nm,;
            dep_no   with m_dep_no  , mname with m_mname,;
            b_rate   with m_b_rate  , status     with m_status    ,;
            tan      with m_tan     , sss        with m_sss       ,;
            phic     with m_phic    , pgbg_no    with m_pgbg_no   ,;
            acct_no  with m_acct_no , sss_member with m_sss_member,;
            pgbg     with m_pgbg    , vac_lv     with m_vac_lv    ,;
            vac_used with m_vac_used, sik_lv     with m_sik_lv    ,;
            sik_used with m_sik_used, emp_stat with m_emp_stat

         select history
         seek m_emp_no
         if eof()
            append blank
         endif

         replace emp_no   with m_emp_no,   emp_nm   with m_emp_nm,;
            dep_no   with m_dep_no,   position with m_position,;
            date_emp with m_date_emp, date_sep with m_date_sep,;
            birthd   with m_birthd,   spouse   with m_spouse,;
            address  with m_address,  tel_no   with m_tel_no,;
            relig    with m_relig,    educ     with m_educ,;
            med1     with m_med1,     med2     with m_med2

         select mastfile
         skip

      end while
	endif

   select 4
	if ! net_use('&m_file',.f.,5)
		exit
	endif
   dbgotop()

   _m_which:='A'

	while ! eof()
      m_emp_no   := emp_no
      m_emp_nm   := emp_nm
      m_reg_hrs  := reg_hrs
      m_rot_hrs  := rot_hrs
      m_sphp_hrs := sun_hrs+sphp_hrs + ssphp_hrs
      m_spot_hrs := sunot_hrs+spot_hrs + sspot_hrs
      m_lghp_hrs := lghp_hrs + slghp_hrs
      m_lgot_hrs := lgot_hrs + slgot_hrs
      m_nsd_hrs  := nsd_hrs
      if m_daily_wage
      	m_abs_hrs  := 0
      else
      	m_abs_hrs  := m_workhours-m_reg_hrs
      endif
      if m_abs_hrs < 0
         m_abs_hrs:=0
      endif
		m_vl_used := vl_used
		m_sl_used := sl_used
      m_oth_ded1:= oth_ded1

		m_sln_ded:=m_hdmf_ded:=m_comp_ded:=m_comd_ded:=m_cal_ded:=0

      select master
      seek m_emp_no
      if ! eof()
         m_emp_nm:=emp_nm
         m_dep_no:=dep_no

      	m_vl_avail=vac_lv-vac_used
      	m_sl_avail=sik_lv-sik_used
      	m_rate=b_rate
      	m_cola=cola
      	m_status=upper(status)
      	m_pgbg_member=pgbg
      	m_sss_member=sss_member
      	m_emp_stat=emp_stat
      	m_y_basic=y_basic
      	if sln_bal > 0 .and. sln_trm>0
      		m_sln_ded = sln_amt/sln_trm
      		if m_sln_ded > sln_bal
      			m_sln_ded = sln_bal
      		endif
      	else
      		m_sln_ded=0
      	endif
      	if ss_cal_bal > 0 .and. ss_cal_trm>0
      		m_cal_ded = ss_cal_ln/ss_cal_trm
      		if m_cal_ded > ss_cal_bal
      			m_cal_ded = ss_cal_bal
      		endif
      	else
      		m_cal_ded=0
      	endif
      	if pgbg
      		if hln_bal > 0 .and. hln_trm>0
      			m_hdmf_ded= hln_amt/hln_trm
      			if m_hdmf_ded > hln_bal
      				m_hdmf_ded = hln_bal
      			endif
      		else
      			m_hdmf_ded=0
      		endif
      	else
      		m_hdmf_ded=0
      	endif
      	if co_ln_bal > 0 .and. co_ln_trm>0
      		m_comp_ded = co_ln/co_ln_trm
      		if m_comp_ded > co_ln_bal
      			m_comp_ded = co_ln_bal
      		endif
      	else
      		m_comp_ded=0
      	endif
      	if com_ln_bal > 0 .and. com_ln_trm>0
      		m_comd_ded = com_ln/com_ln_trm
      		if m_comd_ded > com_ln_bal
      			m_comd_ded = com_ln_bal
      		endif
      	else
      		m_comd_ded=0
      	endif
      	m_m_gross=m_gross
      	m_m_ssee=m_ssee
      	m_m_sser=m_sser
      	m_m_medee=m_medee
      	m_m_meder=m_meder
      	m_m_pgee=m_pgee
      	m_m_pger=m_pger
      	m_m_ecer=m_ecer
      	m_m_othp1=m_othp1
      	m_m_othp2=m_othp2
	   	m_m_othp3=m_othp3
		   m_m_othp4=m_othp4
      	m_m_leave=m_leave
   		m_y_basic=y_basic
      	m_m_basic=m_basic
      	m_m_leave=m_leave
   		m_status=status
   		m_pgbg_member=pgbg
	   	m_sss_member=sss_member
		   m_emp_stat=emp_stat
	      //Compute gross
      	m_grs_pay:=m_max_ded:=m_tot_ded:=0
         m_withbonus:=.f.
      	do p_compgross
      	do p_compsmtax

      	m_tot_ded:=m_sln_ded+m_hdmf_ded+m_sss_de+m_med_de+m_pgbg_ee+m_tax_ded;
      		+m_comp_ded+m_comd_ded+m_cal_ded

      else
         f_mess('Employee No. '+m_emp_no+' not in Master File!',.t.)
         select master
         append blank
         replace emp_no with m_emp_no, emp_nm with m_emp_nm
         m_dep_no:='  '

         select history
         append blank
         replace emp_no with m_emp_no, emp_nm with m_emp_nm

      endif

      select tmcard
      seek m_emp_no
      if eof()
         append blank
      endif

	   replace emp_no with m_emp_no, dep_no with m_dep_no,;
	      emp_nm with m_emp_nm, reg_hrs with m_reg_hrs,;
        	rot_hrs with m_rot_hrs,	sphp_hrs with m_sphp_hrs,;
        	spot_hrs with m_spot_hrs, lghp_hrs with m_lghp_hrs,;
        	lgot_hrs with m_lgot_hrs, abs_hrs with m_abs_hrs,;
        	nsd_hrs with m_nsd_hrs, oth_ded1 with m_oth_ded1

		replace sln_ded with m_sln_ded, hdmf_ded with m_hdmf_ded,;
			comp_ded with m_comp_ded, comd_ded with m_comd_ded,;
			cal_ded with m_cal_ded

		replace vl_used with m_vl_used, sl_used with m_sl_used,;
              lv_hrs  with m_vl_used, ls_hrs  with m_sl_used

      select 4
      skip

	end while

	select tmcard
	m_recc=recc()
	select sys_id
	if fil_lock(5)
		repl trn_ctr with m_recc, needbackup with m_needbackup
		unlo
	endif

   f_mess('Append Completed!',.t.)

	exit
end while
dbcloseall()
rest scre from m_prevscrn
return
