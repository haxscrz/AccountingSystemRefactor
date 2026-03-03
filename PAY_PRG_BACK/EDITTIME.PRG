* Program Name : Timecard Data Entry
* Program Code : Edittime.prg
* Description  : This program allows the user to add/edit/delete timecard file.
* Author : Sonny V. Cruz
* Date   : March 15, 1994
*******************************************************************************

m_old_col=setcolor()
do while .t.
	save scre to m_prevscrn
	f_setting()
	select 1
	if .not. net_use('&dpath\tmcard',.f.,5)
		exit
	endif
	set inde to &dpath\tbyemp,&dpath\tbydep,&dpath\tbynm
	select 2
	if .not. net_use('&dpath\master',.f.,5)
		exit
	endif
	set inde to &dpath\mbyemp
	select 3
	if .not. net_use('&dpath\sys_id',.f.,5)
		exit
	endif
	select 4
	if .not. net_use('&opath\taxtab',.f.,5)
		exit
	endif
	set inde to &opath\tax
	select sys_id
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
	select tmcard
	m_ph='999.99'
	m_pa='999999.99'
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
	m_m_othp3=0
   m_m_othp4=0
	m_m_basic=0
	m_m_leave=0
	m_emp_no='      '
	m_emp_nm=spac(32)
	m_dep_no=spac(2)
	m_status=spac(3)
	m_pgbg_member=.f.
	m_withbonus=.f.
   m_bonusgiven = .f.
	m_sss_member=.t.
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
	m_abort=.f.
	m_pack=.f.
   m_needcompute := .f.
	f_drawbox(3,3,22,75,5,3)
	set colo to (m_cnor)

	@ 5,4 to 5,74
	@ 4,7 say 'EMP# :      -                                         DEP# :   '
	@ 6,7 say 'A> REGULAR HRS... [         ]       Q> '+m_st_ln1+  ' [         ]'
	@ 7,7 say 'B> ABSENT HRS.... [         ]       R> '+m_st_ln2+  ' [         ]'
	@ 8,7 say 'C> REG.OT HRS.... [         ]       S> '+m_st_ln3+  ' [         ]'
	@ 9,7 say 'D> SP.HOL.HRS.... [         ]       T> '+m_st_ln4+  ' [         ]'
	@10,7 say 'E> SP.HOL.OT.HRS. [         ]       U> '+m_st_ln5+  ' [         ]'
	@11,7 say 'F> LGL.HOL.HRS... [         ]       V> '+m_st_ded1 +' [         ]'
	@12,7 say 'G> LGL.HOL.OT.HRS [         ]       W> '+m_st_ded2 +' [         ]'
	@13,7 say 'H> NSD........... [         ]       X> '+m_st_ded3 +' [         ]'
	@14,7 say 'I> VL DAYS USED.. [         ]       Y> '+m_st_ded4 +' [         ]'
	@15,7 say 'J> SL DAYS USED.. [         ]       Z> '+m_st_ded5 +' [         ]'
	@16,7 say 'K> CTPA/SEA...... [         ]      AA> '+m_st_ded6 +' [         ]'
	@17,7 say 'L> TAXABLE O.PAY2 [         ]      AB> '+m_st_ded7 +' [         ]'
	@18,7 say 'M> NON-TAX O.PAY1 [         ]      AC> '+m_st_ded8 +' [         ]'
	@19,7 say 'N> NON-TAX O.PAY2 [         ]      AD> '+m_st_ded9 +' [         ]'
	@20,7 say 'O> VL DAYS-ENCASH [         ]      AE> ADDITIONAL TAX [         ]'
	@21,7 say 'P> SL DAYS-ENCASH [         ]      AF> INCL.13th.. Y=Yes N=No [ ]'
   @22,41 say                                  ' AG> 13TH MONTH.... [         ]'
	f_bcln()
	do p_tmdisp
	do while .t.
	   *   11     18      26        36      44          56       65
      *  [A]dd  [E]dit  [D]elete  [N]ext  [P]revious  [F]ind  e[X]it
		@23,10 say '[A]dd  [E]dit  [D]elete  [N]ext  [P]revious  [F]ind  e[X]it'
		set colo to w+
		@23,11 say 'A'
		@23,18 say 'E'
		@23,26 say 'D'
		@23,36 say 'N'
		@23,44 say 'P'
		@23,56 say 'F'
		@23,65 say 'X'
		set colo to
		f_sayit('Press A, E, D, N, P, F or X')
		set curs off
		m_proc=upper(chr(inkey(0)))
		set curs on
		if lastkey()=27
			exit
		endif
		f_bcln()
		do case
			case m_proc='A'
				m_oldrec=recno()
				m_abort=.f.
				do while .t.
               @6,26 clear to 21,34
               @6,62 clear to 20,70
               @21,70 say ' '
               @22,62 say '         '

					do p_tminit
					do p_tmgets with 'A'
					if m_abort
						goto m_oldrec
						exit
					endif
					if .not. f_ask('Add new entry ?')
						exit
					endif
				enddo
			case m_proc='E'
				if trn_flag$'Uu'
					f_err('Record already posted.  Edit Denied !',.f.)
				else
					m_emp_no=emp_no
					m_emp_nm=emp_nm
					m_dep_no=dep_no
					m_reg_hrs=reg_hrs
					m_abs_hrs=abs_hrs
					m_rot_hrs=rot_hrs
					m_sphp_hrs=sphp_hrs
					m_spot_hrs=spot_hrs
					m_lghp_hrs=lghp_hrs
					m_lgot_hrs=lgot_hrs
					m_nsd_hrs=nsd_hrs
					m_vl_used=vl_used
               m_vleave=vl_used
					m_sl_used=sl_used
               m_sleave=sl_used
					m_oth_pay1=oth_pay1
					m_oth_pay2=oth_pay2
					m_oth_pay3=oth_pay3
					m_oth_pay4=oth_pay4
					m_lv_hrs=lv_hrs
					m_ls_hrs=ls_hrs
					m_sln_ded=sln_ded
					m_hdmf_ded=hdmf_ded
					m_comp_ded=comp_ded
					m_comd_ded=comd_ded
					m_cal_ded=cal_ded
					m_pgbg_ee=pgbg_ee
					m_pgbg_ee=pgbg_er
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
					m_withbonus=withbonus
					m_bonus=bonus
					do p_tmgets with 'E'
				endif
			case m_proc='D'
				if fil_lock(5)
					if f_ask('DELETE this record.  Are you sure ?')
						m_needback=.t.
						dele
						skip -1
						unlo
						m_pack=.t.
					endif
				endif
			case m_proc='N'
				skip
				if eof()
					skip -1
					f_err('This is the last record !',.f.)
				endif
			case m_proc='P'
				skip -1
				if bof()
					f_err('This is the first record !',.f.)
				endif
			case m_proc='F'
				m_oldrec=recno()
				@4,14 get m_emp_no pict '999999'
				read
				if lastkey()<>27
					set soft on
					seek m_emp_no
					set soft off
					if eof()
						f_err('No record beyond that employee number !',.f.)
						go m_oldrec
					endif
				endif
			case m_proc='X'
				exit
		endc
		do p_tmdisp
	enddo
	if m_pack
		select tmcard
		use
		if net_use('&dpath\tmcard',.t.,5)
			if fil_lock(5)
				set inde to
				f_mess('Packing files.  Please wait...',.f.)
				pack
				f_mess('Rebuilding index files.  Please wait...',.f.)
				set inde to &dpath\tbyemp,&dpath\tbydep,&dpath\tbynm
				rein
			endif
		endif
	endif
	select tmcard
	m_recc=recc()
	select sys_id
	if fil_lock(5)
		repl trn_ctr with m_recc, needbackup with m_needbackup
      if m_needcompute
         if trn_ctr<=trn_prc
            replace trn_prc with trn_ctr - 1
         endif
      endif
		unlo
	endif
	exit
enddo
clos all
rest scre from m_prevscrn
return

proc p_tmdisp
@ 4,14 say emp_no
@ 4,24 say emp_nm
@ 4,68 say dep_no
@ 6,29 say reg_hrs pict m_ph
@ 7,29 say abs_hrs pict m_ph
@ 8,29 say rot_hrs pict m_ph
@ 9,29 say sphp_hrs pict m_ph
@10,29 say spot_hrs pict m_ph
@11,29 say lghp_hrs pict m_ph
@12,29 say lgot_hrs pict m_ph
@13,29 say nsd_hrs pict m_ph
@14,28 say vl_used pict '99.9999'
@15,28 say sl_used pict '99.9999'
@16,26 say oth_pay1 pict m_pa
@17,26 say oth_pay3 pict m_pa
@18,26 say oth_pay2 pict m_pa
@19,26 say oth_pay4 pict m_pa
@20,29 say lv_hrs pict m_ph
@21,29 say ls_hrs pict m_ph
@ 6,62 say sln_ded pict m_pa
@ 7,62 say cal_ded pict m_pa
@ 8,62 say hdmf_ded pict m_pa
@ 9,62 say comp_ded pict m_pa
@10,62 say comd_ded pict m_pa
@11,62 say oth_ded1 pict m_pa
@12,62 say oth_ded2 pict m_pa
@13,62 say oth_ded3 pict m_pa
@14,62 say oth_ded4 pict m_pa
@15,62 say oth_ded5 pict m_pa
@16,62 say oth_ded6 pict m_pa
@17,62 say oth_ded7 pict m_pa
@18,62 say oth_ded8 pict m_pa
@19,62 say oth_ded9 pict m_pa
@20,62 say oth_ded10 pict m_pa
@21,70 say m_withbonus pict 'Y'
@22,62 say bonus pict m_pa
*ssphp_hrs/sspot_hrs/slghp_hrs/slgot_hrs/sun_hrs/sot_hrs/nsd1_hrs/nsd2_hrs
return

proc p_tminit
m_emp_no='      '
m_emp_nm=spac(32)
m_dep_no=spac(2)
stor 0 to m_reg_hrs, m_abs_hrs, m_rot_hrs, m_sphp_hrs, m_spot_hrs, m_lghp_hrs,;
	m_lgot_hrs, m_oth_pay1, m_oth_pay2, m_oth_pay3, m_lv_hrs, m_ls_hrs,;
	m_vl_used, m_sl_used, m_comp_ded, m_comd_ded, m_cal_ded, m_nsd_hrs,;
	m_sln_ded, m_hdmf_ded, m_oth_ded1, m_oth_ded2, m_oth_ded3, m_oth_ded4,;
	m_oth_ded5, m_oth_ded6, m_oth_ded7, m_oth_ded8, m_oth_ded9, m_oth_ded0,;
	m_oth_pay4, m_bonus, m_bonustax, m_vl_avail, m_sl_avail, m_vac_lv, m_sik_lv,;
	m_vleave, m_sleave, m_vl_used, m_sl_used
m_withbonus=.f.
return

func fsayreghrs
para _m_abs_hrs
if _m_abs_hrs>m_workhours
	m_reg_hrs=0
else
	m_reg_hrs=m_workhours-_m_abs_hrs
endif
@ 6,29 say m_reg_hrs pict m_ph
return(.t.)

proc p_tmgets
para _m_which
m_abort=.f.
do while .t.
	if _m_which='A'
		@ 4,14 get m_emp_no pict '999999' vali vt_empno(m_emp_no)
	else
		m_oldarea=select()
		select master
		seek m_emp_no
		if .not. eof()
			m_emp_nm=emp_nm
			m_dep_no=dep_no
			m_rate=b_rate
			m_cola=cola
			m_y_basic=y_basic
         if y_bonus > 0
            m_bonusgiven = .t.
         else
            m_bonusgiven = .f.
         endif
			m_emp_stat=emp_stat
			m_status=upper(status)
			m_pgbg_member=pgbg
			m_sss_member=sss_member
			m_vac_lv=vac_lv
			m_sik_lv=sik_lv
			m_vl_avail=vac_lv-vac_used
			m_sl_avail=sik_lv-sik_used
		else
			f_err('Invalid Employee number !',.f.)
			exit
		endif
		select (m_oldarea)
	endif
	if m_daily_wage
		@ 6,29 get m_reg_hrs pict m_ph vali m_reg_hrs >= 0
		@ 7,29 say space(6)
	else
		@ 7,29 get m_abs_hrs pict m_ph vali fsayreghrs(m_abs_hrs)
	endif
   read
	if lastkey()=27
		exit
	endif
	m_oth_pay1=(m_reg_hrs+m_sphp_hrs)*m_cola
	@ 8,29 get m_rot_hrs pict m_ph
	@ 9,29 get m_sphp_hrs pict m_ph
	@10,29 get m_spot_hrs pict m_ph
	@11,29 get m_lghp_hrs pict m_ph
	@12,29 get m_lgot_hrs pict m_ph
	@13,29 get m_nsd_hrs pict m_ph
	@14,28 get m_vleave pict '99.9999' valid f_chkvl(m_vleave,m_vl_avail)
	@15,28 get m_sleave pict '99.9999' valid f_chksl(m_sleave,m_sl_avail)
	read

	@16,26 get m_oth_pay1 pict m_pa
	@17,26 get m_oth_pay3 pict m_pa
	@18,26 get m_oth_pay2 pict m_pa
	@19,26 get m_oth_pay4 pict m_pa
	m_lv_hrs=m_vleave
	m_ls_hrs=m_sleave
	@20,29 get m_lv_hrs pict m_ph
	@21,29 get m_ls_hrs pict m_ph
	* ssphp_hrs/sspot_hrs/slghp_hrs/slgot_hrs/sun_hrs/sot_hrs/nsd1_hrs/nsd2_hrs
	read
	m_vl_used=m_vleave
	m_sl_used=m_sleave
	if lastkey()=27
		if f_ask('Abort data entry?')
			m_abort=.t.
			exit
		else
			loop
		endif
	endif
	* compute gross
	m_grs_pay=0
	m_max_ded=0
	m_tot_ded=0
	do p_compgross
	do p_compsmtax
	@ 6,62 get m_sln_ded pict m_pa
	@ 7,62 get m_cal_ded pict m_pa
	@ 8,62 get m_hdmf_ded pict m_pa
	@ 9,62 get m_comp_ded pict m_pa
	@10,62 get m_comd_ded pict m_pa
	@11,62 get m_oth_ded1 pict m_pa
	@12,62 get m_oth_ded2 pict m_pa
	@13,62 get m_oth_ded3 pict m_pa
	@14,62 get m_oth_ded4 pict m_pa
	@15,62 get m_oth_ded5 pict m_pa
	@16,62 get m_oth_ded6 pict m_pa
	@17,62 get m_oth_ded7 pict m_pa
	@18,62 get m_oth_ded8 pict m_pa
	@19,62 get m_oth_ded9 pict m_pa
	@20,62 get m_oth_ded0 pict m_pa
	@21,70 get m_withbonus pict 'Y'
	read

   if m_withbonus .and. m_bonusgiven
      f_err("13th Mo already given",.t.)
      @21,70 say "N"
      m_withbonus =.f.
   endif

	m_tot_ded=m_sln_ded+m_hdmf_ded+m_sss_de+m_med_de+m_pgbg_ee+m_tax_ded;
		+m_oth_ded1+m_oth_ded2+m_oth_ded3+m_oth_ded4+m_oth_ded5+m_oth_ded6;
		+m_oth_ded7+m_oth_ded8+m_oth_ded9+m_oth_ded0+m_comp_ded+m_comd_ded;
		+m_cal_ded
	if lastkey()=27
		if f_ask('Abort data entry?')
			m_abort=.t.
			exit
		else
			loop
		endif
	endif
	if .not. f_ask('Data correct ?')
		loop
	else
		if m_grs_pay-m_tot_ded < 0
         if ! m_withbonus
   			f_err('Net pay is less than 0 (zero) !',.t.)
	   		loop
         endif
		endif
	endif
	* Save
	if f_ask('Save ?')
		select sys_id
		if fil_lock(5)
			select master
			if fil_lock(5)
			   select tmcard
				if fil_lock(5)
					if _m_which='A'
	   	   		appe blank
               endif
               m_needcompute := .t.
					repl emp_no with m_emp_no, dep_no with m_dep_no,;
						emp_nm with m_emp_nm, reg_hrs with m_reg_hrs,;
						rot_hrs with m_rot_hrs,	sphp_hrs with m_sphp_hrs,;
						spot_hrs with m_spot_hrs, lghp_hrs with m_lghp_hrs,;
						lgot_hrs with m_lgot_hrs, abs_hrs with m_abs_hrs,;
						nsd_hrs with m_nsd_hrs, vl_used with m_vl_used,;
						sl_used with m_sl_used,;
						oth_pay1 with m_oth_pay1, oth_pay2 with m_oth_pay2,;
						oth_pay3 with m_oth_pay3, lv_hrs with m_lv_hrs,;
						ls_hrs with m_ls_hrs, sln_ded with m_sln_ded,;
						hdmf_ded with m_hdmf_ded, comp_ded with m_comp_ded,;
						comd_ded with m_comd_ded, cal_ded with m_cal_ded,;
						pgbg_ee with m_pgbg_ee,	pgbg_er with m_pgbg_er,;
						oth_ded1 with m_oth_ded1, oth_ded2 with m_oth_ded2,;
						oth_ded3 with m_oth_ded3, oth_ded4 with m_oth_ded4,;
						oth_ded5 with m_oth_ded5, oth_ded6 with m_oth_ded6,;
				      oth_ded7 with m_oth_ded7, oth_ded8 with m_oth_ded8,;
						oth_ded9 with m_oth_ded9, oth_ded10 with m_oth_ded0,;
						trn_flag with 'Y', oth_pay4 with m_oth_pay4,;
						withbonus with m_withbonus, bonus with m_bonus,;
						bonustax with m_bonustax
					repl reg_pay with m_reg_pay, rot_pay with m_rot_pay,;
						sphp_pay with m_sphp_pay, spot_pay with m_spot_pay,;
						lghp_pay with m_lghp_pay, lgot_pay with m_lgot_pay,;
						lv_pay with m_lv_pay, lv2_pay with m_lv2_pay,;
						ls_pay with m_ls_pay, grs_pay with m_grs_pay,;
						net_pay with m_grs_pay-m_tot_ded, abs_ded with m_abs_ded,;
						tot_ded with m_tot_ded, sss_ee with m_sss_de, sss_er with m_sss_dr,;
						med_ee with m_med_de, med_er with m_med_dr,;
						ec_er with m_ec_dr, tax_ee with m_tax_ded,;
						nsd_pay with m_nsd_pay
						*sun_hrs/sot_hrs/nsd1_hrs/nsd2_hrs/ssphp_hrs/sspot_hrs
						*slghp_hrs/slgot_hrs/ssphp_pay/sspot_pay/slghp_pay
						*slgot_pay/sun_pay/sot_pay/nsd1_pay/nsd2_pay
				      select master
				      repl trn_flag with 'Y'
						m_needbackup=.t.
				endif
			endif
		endif
		unlo all
	endif
	exit
enddo
select tmcard
return

func vt_empno
para _m_emp_no
m_oldarea=select()
select master
seek _m_emp_no
if .not. eof()
	m_vl_avail=vac_lv-vac_used
	m_sl_avail=sik_lv-sik_used
	select tmcard
	seek _m_emp_no
	if .not. eof()
		f_err('Timecard Already Entered !',.f.)
		select (m_oldarea)
		return(.f.)
	else
		select master
		@ 4,24 say emp_nm
		@ 4,68 say dep_no
		m_emp_nm=emp_nm
		m_dep_no=dep_no
		m_rate=b_rate
		m_cola=cola
		m_status=upper(status)
		m_pgbg_member=pgbg
		m_sss_member=sss_member
		m_emp_stat=emp_stat
		m_y_basic=y_basic
      if y_bonus > 0
         m_bonusgiven := .t.
      else
         m_bonusgiven := .f.
      endif
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
*		if union .and. (str(m_pres_wk,1)$'15'.or.(m_pres_wk=4.and.m_no_of_week=4))
*			m_oth_ded1=m_uniondues
*		else
*			m_oth_ded1=0
*			if union .and. (str(m_pres_wk,1)$'23'.or.(m_pres_wk=4.and.m_no_of_week=5))
*				m_oth_ded2=m_uniondet
*			else		
*				m_oth_ded2=0
*			endif
*		endif
		m_m_gross=m_gross
		m_m_pgee=m_pgee
		m_m_pger=m_pger
		m_m_ssee=m_ssee
		m_m_sser=m_sser
		m_m_medee=m_medee
		m_m_meder=m_meder
		m_m_ecer=m_ecer
		m_m_othp1=m_othp1
		m_m_othp2=m_othp2
		m_m_othp3=m_othp3
      m_m_othp4=m_othp4
		m_m_leave=m_leave
		m_m_basic=m_basic
		m_m_leave=m_leave
		select (m_oldarea)
		return(.t.)
	endif
else
	f_err('Invalid Employee Number !',.f.)
	select (m_oldarea)
	return(.f.)
endif

*Computation for Daily Waged Employees
proc p_compgross
* This routine computes the gross income
* hourly rate
if m_daily_wage
	m_hrate = (m_rate/8)
	* regular pay (basic payxhrs worked)
	m_reg_pay  = round(m_reg_hrs*m_hrate,2)
else
	m_hrate = (m_rate/240)
	* regular pay (basic payxhrs worked)
	m_reg_pay = round((m_rate/2)-(m_abs_hrs*m_hrate),2)
	m_abs_ded = round(m_abs_hrs*m_hrate,2)
endif
* reg. ot pay
m_rot_pay  = round(m_rot_hrs*m_hrate*m_reot_r,2)
* sp.hol.pay
m_sphp_pay = round(m_sphp_hrs*m_hrate*m_sphp_r,2)
* sp.hol.ot.pay
m_spot_pay = round(m_spot_hrs*m_hrate*m_spot_r,2)
* lg.hol. pay
m_lghp_pay = round(m_lghp_hrs*m_hrate*m_lghp_r,2)
* lg.hol.ot.pay
m_lgot_pay = round(m_lgot_hrs*m_hrate*m_lgot_r,2)
* nsd pay
m_nsd_pay = round(m_nsd_hrs*m_hrate*m_nsd_r,2)
if m_lv_hrs>10
	m_lv_pay = round((10*8*m_hrate),2)
	m_lv2_pay= round(((m_lv_hrs-10)*8*m_hrate),2)
else
	m_lv_pay = round((m_lv_hrs*8*m_hrate),2)
	m_lv2_pay = 0
endif
m_ls_pay = round(((m_ls_hrs*8)*m_hrate),2)
* plus other pay
* gross pay
m_grs_pay=round(m_reg_pay+m_rot_pay+m_sphp_pay+m_spot_pay+m_lghp_pay+;
	m_lgot_pay+m_nsd_pay+m_lv_pay+m_lv2_pay+m_ls_pay+m_oth_pay1+;
	m_oth_pay2+m_oth_pay3+m_oth_pay4,2)
m_bonus=0
m_bonustax=0
if m_withbonus
	***
	if m_emp_stat='C'
		m_bon_net=(m_y_basic+m_reg_pay)/12
	else
		if m_daily_wage
			m_bon_net=m_rate*m_bon_days
		else
			m_bon_net=m_rate*m_bon_mont
		endif
	endif
	m_btax=0
	if m_bon_net>m_tax_bon
		m_taxable=(m_bon_net-m_tax_bon)/2  &&divide by 2 bec.tax table is semi-monthly
	   if subs(m_status,1,3) <> space(3)
	   	select taxtab
  			seek m_status
			if .not. eof()
				m_peso=peso
				m_percent=percent
				m_salary=salary
		      do while m_taxable>salary.and.m_status=exemption.and..not.eof()
					if m_taxable>=salary
						m_peso=peso
						m_percent=percent
						m_salary=salary
					endif
					skip
				enddo
	         if m_salary=-1
	            m_btax=0
	         else
	         	m_btax=(m_peso+((m_taxable-m_salary)*(val(m_percent)/100)))*2
	         endif
			else
				f_err('Please check tax status of '+m_emp_no+' '+m_emp_nm,.t.)
	      endif
		else
			f_err('Please check tax status of '+m_emp_no+' '+m_emp_nm,.t.)
		endif
		select tmcard
	endif
	m_bonus=m_bon_net
	m_bonustax=m_btax
	***
endif
return

proc p_compsmtax
do while .t.
	* This routine computes the sss & pag-ibig premium, medicare and the tax
	m_sss_de = 0
	m_sss_dr = 0
	m_med_de = 0
	m_med_dr = 0
	m_ec_dr  = 0
	m_pgbg_ee= 0
	m_pgbg_er= 0


	if m_status != spac(3)

	m_nontax=m_oth_pay2+m_oth_pay4+m_m_othp2+m_m_othp4    &&+m_lv_pay+m_m_leave
	m_grs=m_m_gross+m_grs_pay-m_nontax
	m_pgregpay=m_reg_pay+m_oth_pay1
   //As per Tess 080-09-2001
	//m_pgmonpay=m_m_basic+m_reg_pay+m_m_othp1+m_oth_pay1
	m_pgmonpay=m_m_gross+m_grs_pay
	if m_pgbg_member .and. m_pgregpay > 0
		if m_pgmonpay <= m_pg_lower
			m_pgbg_ee=round(m_pgmonpay*m_pg_lwper-m_m_pgee,2)
			m_pgbg_er=round(m_pgmonpay*m_pg_hiper-m_m_pger,2)
		else
			if m_pgmonpay > m_pg_higher
				m_pgbg_ee=round(m_pg_higher*m_pg_hiper-m_m_pgee,2)
				m_pgbg_er=round(m_pg_higher*m_pg_hiper-m_m_pger,2)
			else
				m_pgbg_ee=round(m_pgmonpay*m_pg_hiper-m_m_pgee,2)
				m_pgbg_er=round(m_pgmonpay*m_pg_hiper-m_m_pger,2)
			endif
		endif
	else
		m_pgbg_ee=0
		m_pgbg_er=0
	endif
	&& m_oth_pay2 is non taxable and not included in SSS premium computation
	* Compute SSS, Medicare and Employer's Contribution
	do case
		case .not. m_sss_member
			m_sss_de = 0
			m_sss_dr = 0
			m_ec_dr  = 0

		case m_grs_pay-m_oth_pay2-m_oth_pay4<=0 .or. m_grs<=0
			m_sss_de = 0
			m_sss_dr = 0
			m_ec_dr  = 0
			m_pgbg_ee= 0
			m_pgbg_er= 0
			m_sln_ded= 0
			m_cal_ded=0
			m_hdmf_ded=0
			m_comp_ded=0
			m_comd_ded=0
			m_oth_ded1=0
			m_oth_ded2=0
			m_oth_ded3=0
			m_oth_ded4=0
			m_oth_ded5=0
			m_oth_ded6=0
			m_oth_ded7=0
			m_oth_ded8=0
			m_oth_ded9=0
			m_oth_ded0=0

   	case m_grs < 1000
			m_sss_de =  0.00
			m_sss_dr =  0.00
			m_ec_dr  =  0.00

      case m_grs < 1250
      	m_sss_de =  36.30 - m_m_ssee
      	m_sss_dr =  73.70 - m_m_sser
      	m_ec_dr  =  10.00 - m_m_ecer

      case m_grs < 1750
      	m_sss_de =  54.50 - m_m_ssee
      	m_sss_dr = 110.50 - m_m_sser
      	m_ec_dr  =  10.00 - m_m_ecer

      case m_grs < 2250
      	m_sss_de =  72.70 - m_m_ssee
      	m_sss_dr = 147.30 - m_m_sser
      	m_ec_dr  =  10.00 - m_m_ecer

      case m_grs < 2750
      	m_sss_de =  90.80 - m_m_ssee
      	m_sss_dr = 184.20 - m_m_sser
      	m_ec_dr  =  10.00 - m_m_ecer

      case m_grs < 3250
      	m_sss_de = 109.00 - m_m_ssee
      	m_sss_dr = 221.00 - m_m_sser
      	m_ec_dr  =  10.00 - m_m_ecer

      case m_grs < 3750
      	m_sss_de = 127.20 - m_m_ssee
      	m_sss_dr = 257.80 - m_m_sser
      	m_ec_dr  =  10.00 - m_m_ecer

      case m_grs < 4250
      	m_sss_de = 145.30 - m_m_ssee
      	m_sss_dr = 294.70 - m_m_sser
      	m_ec_dr  =  10.00 - m_m_ecer

      case m_grs < 4750
      	m_sss_de = 163.50 - m_m_ssee
      	m_sss_dr = 331.50 - m_m_sser
      	m_ec_dr  =  10.00 - m_m_ecer

      case m_grs < 5250
      	m_sss_de = 181.70 - m_m_ssee
      	m_sss_dr = 368.30 - m_m_sser
      	m_ec_dr  =  10.00 - m_m_ecer

      case m_grs < 5750
      	m_sss_de = 199.80 - m_m_ssee
      	m_sss_dr = 405.20 - m_m_sser
      	m_ec_dr  =  10.00 - m_m_ecer

      case m_grs < 6250
      	m_sss_de = 218.00 - m_m_ssee
      	m_sss_dr = 442.00 - m_m_sser
      	m_ec_dr  =  10.00 - m_m_ecer

      case m_grs < 6750
      	m_sss_de = 236.20 - m_m_ssee
      	m_sss_dr = 478.80 - m_m_sser
      	m_ec_dr  =  10.00 - m_m_ecer

      case m_grs < 7250
      	m_sss_de = 254.30 - m_m_ssee
      	m_sss_dr = 515.70 - m_m_sser
      	m_ec_dr  =  10.00 - m_m_ecer

      case m_grs < 7750
      	m_sss_de = 272.50 - m_m_ssee
      	m_sss_dr = 552.50 - m_m_sser
      	m_ec_dr  =  10.00 - m_m_ecer

      case m_grs < 8250
      	m_sss_de = 290.70 - m_m_ssee
      	m_sss_dr = 589.30 - m_m_sser
      	m_ec_dr  =  10.00 - m_m_ecer

      case m_grs < 8750
      	m_sss_de = 308.80 - m_m_ssee
      	m_sss_dr = 626.20 - m_m_sser
      	m_ec_dr  =  10.00 - m_m_ecer

      case m_grs < 9250
      	m_sss_de = 327.00 - m_m_ssee
      	m_sss_dr = 663.00 - m_m_sser
      	m_ec_dr  =  10.00 - m_m_ecer

      case m_grs < 9750
      	m_sss_de = 345.20 - m_m_ssee
      	m_sss_dr = 699.80 - m_m_sser
      	m_ec_dr  =  10.00 - m_m_ecer

      case m_grs < 10250
      	m_sss_de = 363.30 - m_m_ssee
      	m_sss_dr = 736.70 - m_m_sser
      	m_ec_dr  =  10.00 - m_m_ecer

      case m_grs < 10750
      	m_sss_de = 381.50 - m_m_ssee
      	m_sss_dr = 773.50 - m_m_sser
      	m_ec_dr  =  10.00 - m_m_ecer

      case m_grs < 11250
      	m_sss_de = 399.70 - m_m_ssee
      	m_sss_dr = 810.30 - m_m_sser
      	m_ec_dr  =  10.00 - m_m_ecer

      case m_grs < 11750
      	m_sss_de = 417.80 - m_m_ssee
      	m_sss_dr = 847.20 - m_m_sser
      	m_ec_dr  =  10.00 - m_m_ecer

      case m_grs < 12250
      	m_sss_de = 436.00 - m_m_ssee
         m_sss_dr = 884.00 - m_m_sser
      	m_ec_dr  = 10     - m_m_ecer

      case m_grs < 12750
      	m_sss_de = 454.20 - m_m_ssee
         m_sss_dr = 920.80 - m_m_sser
      	m_ec_dr  = 10     - m_m_ecer

      case m_grs < 13250
      	m_sss_de = 472.30 - m_m_ssee
         m_sss_dr = 957.70 - m_m_sser
      	m_ec_dr  = 10     - m_m_ecer

      case m_grs < 13750
      	m_sss_de = 490.50 - m_m_ssee
         m_sss_dr = 994.50 - m_m_sser
      	m_ec_dr  = 10     - m_m_ecer

      case m_grs < 14250
      	m_sss_de = 508.70 - m_m_ssee
         m_sss_dr = 1031.30 - m_m_sser
      	m_ec_dr  = 10     - m_m_ecer

      case m_grs < 14750
      	m_sss_de = 526.80 - m_m_ssee
         m_sss_dr =1068.20 - m_m_sser
      	m_ec_dr  = 10     - m_m_ecer

      case m_grs < 15250
      	m_sss_de = 545.00 - m_m_ssee
         m_sss_dr =1105.00 - m_m_sser
      	m_ec_dr  = 30     - m_m_ecer

      case m_grs < 15750
      	m_sss_de = 563.20 - m_m_ssee
         m_sss_dr =1141.80 - m_m_sser
      	m_ec_dr  = 30     - m_m_ecer

      otherwise
      	m_sss_de = 581.30 - m_m_ssee
         m_sss_dr =1178.70 - m_m_sser
      	m_ec_dr  = 30     - m_m_ecer

	endcase

   do case
      case m_grs_pay - m_oth_pay2-m_oth_pay4  <= 0 .or. m_grs = 0
         m_med_de = 0
         m_med_dr = 0

   	case m_grs < 9000
   		m_med_de = 100.00 - m_m_medee
      	m_med_dr = 100.00 - m_m_meder

      case m_grs < 10000
   		m_med_de = 112.50 - m_m_medee
   		m_med_dr = 112.50 - m_m_meder

   	case m_grs < 11000
   		m_med_de = 125.00 - m_m_medee
   		m_med_dr = 125.00 - m_m_meder

      case m_grs < 12000
      	m_med_de := 137.50 - m_m_medee
      	m_med_dr := 137.50 - m_m_meder

      case m_grs < 13000
      	m_med_de := 150.00 - m_m_medee
      	m_med_dr := 150.00 - m_m_meder

      case m_grs < 14000
      	m_med_de := 162.50 - m_m_medee
      	m_med_dr := 162.50 - m_m_meder

      case m_grs < 15000
      	m_med_de := 175.00 - m_m_medee
      	m_med_dr := 175.00 - m_m_meder

      case m_grs < 16000
      	m_med_de := 187.50 - m_m_medee
      	m_med_dr := 187.50 - m_m_meder

      case m_grs < 17000
      	m_med_de := 200.00 - m_m_medee
      	m_med_dr := 200.00 - m_m_meder

      case m_grs < 18000
      	m_med_de := 212.50 - m_m_medee
      	m_med_dr := 212.50 - m_m_meder

      case m_grs < 19000
      	m_med_de := 225.00 - m_m_medee
      	m_med_dr := 225.00 - m_m_meder

      case m_grs < 20000
      	m_med_de := 237.50 - m_m_medee
      	m_med_dr := 237.50 - m_m_meder

      case m_grs < 21000
      	m_med_de := 250.00 - m_m_medee
      	m_med_dr := 250.00 - m_m_meder

      case m_grs < 22000
      	m_med_de := 262.50 - m_m_medee
      	m_med_dr := 262.50 - m_m_meder

      case m_grs < 23000
      	m_med_de := 275.00 - m_m_medee
      	m_med_dr := 275.00 - m_m_meder

      case m_grs < 24000
      	m_med_de := 287.50 - m_m_medee
      	m_med_dr := 287.50 - m_m_meder

      case m_grs < 25000
      	m_med_de := 300.00 - m_m_medee
      	m_med_dr := 300.00 - m_m_meder

      case m_grs < 26000
      	m_med_de := 312.50 - m_m_medee
      	m_med_dr := 312.50 - m_m_meder

      case m_grs < 27000
      	m_med_de := 325.00 - m_m_medee
      	m_med_dr := 325.00 - m_m_meder

      case m_grs < 28000
      	m_med_de := 337.50 - m_m_medee
      	m_med_dr := 337.50 - m_m_meder

      case m_grs < 29000
         m_med_de := 350.00 - m_m_medee
         m_med_dr := 350.00 - m_m_meder

      case m_grs < 30000
         m_med_de :=362.50 - m_m_medee
         m_med_dr :=362.50 - m_m_meder

      case m_grs < 31000
         m_med_de := 375.00 - m_m_medee
         m_med_dr := 375.00 - m_m_meder

      case m_grs < 32000
         m_med_de := 387.50 - m_m_medee
         m_med_dr := 387.50 - m_m_meder

      case m_grs < 33000
         m_med_de := 400.00 - m_m_medee
         m_med_dr := 400.00 - m_m_meder

      case m_grs < 34000
         m_med_de := 412.50 - m_m_medee
         m_med_dr := 412.50 - m_m_meder

      case m_grs < 35000
         m_med_de := 425.00 - m_m_medee
         m_med_dr := 425.00 - m_m_meder

      otherwise
         m_med_de := 437.50 - m_m_medee
         m_med_dr := 437.50 - m_m_meder

   endcase

	if m_tot_ded+m_sss_de+m_med_de<=m_grs_pay
		m_tot_ded=m_tot_ded+m_sss_de+m_med_de
	else
		m_sss_de=0
		m_med_de=0
		exit
	endif

   endif

	* Compute Tax
	if m_status <> spac(3)

		//m_grs_p1 = m_grs_pay-m_oth_pay2-m_oth_pay4-m_lv_pay  &&   (remove SSS Ben and VL for tax purposes)
      // (remove SSS Ben and VL, SSS/Medicare/Pag-ibig Premium for tax purposes)
		m_grs_p1 = m_grs_pay-m_oth_pay2-m_oth_pay4-m_lv_pay-m_sss_de-m_med_de-m_pgbg_ee

      if m_grs_p1 <= 0
			m_tax_ded = 0
		else
			select taxtab
			seek m_status
			if .not. eof()
				m_peso=peso
				m_percent=percent
				m_salary=salary
				do while m_grs_p1 > salary .and. m_status=exemption.and. .not. eof()
					if m_grs_p1 >= salary
						m_peso=peso
						m_percent=percent
						m_salary=salary
					endif
					skip
				enddo
				if m_salary = -1
					m_tax_ded=0
				else
					m_tax_ded = m_peso + ((m_grs_p1-m_salary)*(val(m_percent)/100))
				endif
			endif
		endif
		m_tax_ded = round(m_tax_ded,2)
	else
		m_tax_ded = 0
	endif
	if m_tot_ded+m_tax_ded<=m_grs_pay
		m_tot_ded=m_tot_ded+m_tax_ded
	else
		m_tax_ded=0
		exit
	endif
	if _m_which='A'
		if m_tot_ded+m_pgbg_ee<=m_grs_pay
			m_tot_ded=m_tot_ded+m_pgbg_ee
		else
			m_pgbg_ee=0
			exit
		endif
		if m_sln_ded>0
			if m_tot_ded+m_sln_ded<=m_grs_pay
				m_tot_ded=m_tot_ded+m_sln_ded
			else
				m_sln_ded=0
				exit
			endif
		endif
		if m_cal_ded>0
			if m_tot_ded+m_cal_ded<=m_grs_pay
				m_tot_ded=m_tot_ded+m_cal_ded
			else
				m_cal_ded=0
				exit
			endif
		endif
		if m_hdmf_ded>0
			if m_tot_ded+m_hdmf_ded<=m_grs_pay
				m_tot_ded=m_tot_ded+m_hdmf_ded
			else
				m_hdmf_ded=0
				exit
			endif
		endif
		if m_comp_ded>0
			if m_tot_ded+m_comp_ded<=m_grs_pay
				m_tot_ded=m_tot_ded+m_comp_ded
			else
				m_comp_ded=0
				exit
			endif
		endif
		if m_comd_ded>0
			if m_tot_ded+m_comd_ded<=m_grs_pay
				m_tot_ded=m_tot_ded+m_comd_ded
			else
				m_comd_ded=0
				exit
			endif
		endif
		if m_tot_ded+m_oth_ded1<=m_grs_pay
			m_tot_ded=m_tot_ded+m_oth_ded1
		else
			m_oth_ded1=0
			exit
		endif
		if m_tot_ded+m_oth_ded2<=m_grs_pay
			m_tot_ded=m_tot_ded+m_oth_ded2
		else
			m_oth_ded2=0
			exit
		endif
		if m_tot_ded+m_oth_ded3<=m_grs_pay
			m_tot_ded=m_tot_ded+m_oth_ded3
		else
			m_oth_ded3=0
			exit
		endif
		if m_tot_ded+m_oth_ded4<=m_grs_pay
			m_tot_ded=m_tot_ded+m_oth_ded4
		else
			m_oth_ded4=0
			exit
		endif
		if m_tot_ded+m_oth_ded5<=m_grs_pay
			m_tot_ded=m_tot_ded+m_oth_ded5
		else
			m_oth_ded5=0
			exit
		endif
		if m_tot_ded+m_oth_ded6<=m_grs_pay
			m_tot_ded=m_tot_ded+m_oth_ded6
		else
			m_oth_ded6=0
			exit
		endif
		if m_tot_ded+m_oth_ded7<=m_grs_pay
			m_tot_ded=m_tot_ded+m_oth_ded7
		else
			m_oth_ded7=0
			exit
		endif
		if m_tot_ded+m_oth_ded8<=m_grs_pay
			m_tot_ded=m_tot_ded+m_oth_ded8
		else
			m_oth_ded8=0
			exit
		endif
		if m_tot_ded+m_oth_ded9<=m_grs_pay
			m_tot_ded=m_tot_ded+m_oth_ded9
		else
			m_oth_ded9=0
			exit
		endif
		if m_tot_ded+m_oth_ded0<=m_grs_pay
			m_tot_ded=m_tot_ded+m_oth_ded0
		else
			m_oth_ded0=0
			exit
		endif
	endif
	exit
enddo
return


function f_chkvl(_m_vleave,_m_vl_avail)
if _m_vleave <= m_vl_avail
   return (.t.)
else
   f_err('Available V/L is only '+ltrim(str(_m_vl_avail,6,2))+' !',.t.)
   return (.f.)
endif

function f_chksl(_m_vleave,_m_vl_avail)
if _m_vleave <= m_vl_avail
   return (.t.)
else
   f_err('Available S/L is only '+ltrim(str(_m_vl_avail,6,2))+' !',.t.)
   return (.f.)
endif
