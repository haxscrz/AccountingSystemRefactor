* Program Name : Timecard Query
* Program Code : Quertime.prg
* Description  : This program allows the user to view the timecard file.
* Author : Sonny V. Cruz
* Date   : July 04, 1994
*******************************************************************************

m_old_col=setcolor()
do whil .t.
	save scre to m_prevscrn
	f_setting()
	sele 2
	if .not. net_use('&dpath\sys_id',.f.,5)
		exit
	endi
	m_needbackup=needbackup
	sele 1
	if .not. net_use('&dpath\tmcard',.f.,5)
		exit
	endi
	set inde to &dpath\tbyemp,&dpath\tbydep,&dpath\tbynm
	m_fig='999,999.99'
	m_emp_no='      '
	m_emp_nm=spac(32)
	m_dep_no=spac(2)
	m_pack=.f.
	f_drawbox(3,2,22,75,5,3)
	set colo to (m_cnor)
	@ 3,7 say 'EMP# :      -                                         DEP# :   '
	@ 4,7 say 'A> REGULAR PAY... [          ]     S> W/HOLDING TAX. [          ]'
	@ 5,7 say 'B> OVERTIME...... [          ]     T> SSS PREMIUM... [          ]'
	@ 6,7 say 'C> SP.HOL PAY.... [          ]     U> MED PREMIUM... [          ]'
	@ 7,7 say 'D> SP.HOL.OT.PAY. [          ]     V> PBG PREMIUM... [          ]'
	@ 8,7 say 'E> LGL.HOL.PAY... [          ]     W> '+m_st_ded1 +' [          ]'
	@ 9,7 say 'F> LGL.HOL.OT.PAY [          ]     X> '+m_st_ded2 +' [          ]'
	@10,7 say 'G> TAXABLE O.PAY1 [          ]     Y> '+m_st_ded3 +' [          ]'
	@11,7 say 'H> TAXABLE O.PAY2 [          ]     Z> '+m_st_ded4 +' [          ]'
	@12,7 say 'I> NON-TAX O.PAY1 [          ]    AA> '+m_st_ded5 +' [          ]'
	@13,7 say 'J> NON-TAX O.PAY2 [          ]    AB> '+m_st_ded6 +' [          ]'
	@14,7 say 'K> VL ENCASHMENT. [          ]    AC> '+m_st_ded7 +' [          ]'
	@15,7 say 'L> SL ENCASHMENT. [          ]    AD> '+m_st_ded8 +' [          ]'
   @16,7 say 'M> GROSS PAY..... [          ]    AE> '+m_st_ded9 +' [          ]'
   @17,7 say 'N> '+m_st_ln1+  ' [          ]    AF> '+m_st_ded10+' [          ]'
   @18,7 say 'O> '+m_st_ln2+  ' [          ]    AG> TOTAL DED..... [          ]'
   @19,7 say 'P> '+m_st_ln3+  ' [          ]    AH> BONUS......... [          ]'
	@20,7 say 'Q> '+m_st_ln4+  ' [          ]    AI> BONUS TAX..... [          ]'
	@21,7 say 'R> '+m_st_ln5+  ' [          ]    AJ> NET PAY....... [          ]'
	f_bcln()
	do p_paydisp
	do whil .t.
		@23,11 say '[N]ext   [P]revious   [F]ind   [E]dit   [D]elete   e[X]it'
		set colo to w+
		@23,12 say 'N'
		@23,21 say 'P'
		@23,34 say 'F'
		@23,43 say 'E'
		@23,52 say 'D'
		@23,64 say 'X'
		set colo to
		f_sayit('Press N, P, F, E, D, or X')
		set curs off
		m_proc=''
		do whil m_proc=''
			m_proc=upper(chr(inkey(0)))
			if m_proc$'NPFEDX'.or.lastkey()=27
				exit
			else
				m_proc=''
			endi
		endd
		set curs on
		if lastkey()=27
			exit
		endi
		f_bcln()
		do case
			case m_proc='N'
				skip
				if eof()
					skip -1
					f_err('This is the last record !',.f.)
				endi
			case m_proc='P'
				skip -1
				if bof()
					f_err('This is the first record !',.f.)
				endi
			case m_proc='F'
				m_oldrec=recno()
				@3,14 get m_emp_no pict '999999'
				read
				if lastkey()<>27
					set soft on
					seek m_emp_no
					set soft off
					if eof()
						f_err('No record beyond that employee number !',.f.)
						go m_oldrec
					endi
				endi
			case m_proc='E'
				if trn_flag$'UY'
					if trn_flag='U'
						f_err('Timecard already posted.  Edit denied !',.t.)
					else
						f_err('Timecard not yet computed.  Edit denied !',.t.)
					endif
				else
					m_reg_pay=reg_pay
					m_rot_pay=rot_pay
					m_sphp_pay=sphp_pay
					m_spot_pay=spot_pay
					m_lghp_pay=lghp_pay
					m_lgot_pay=lgot_pay
					m_oth_pay1=oth_pay1
					m_oth_pay2=oth_pay2
					m_oth_pay3=oth_pay3
					m_oth_pay4=oth_pay4
					m_lv_pay=lv_pay+lv2_pay
					m_ls_pay=ls_pay
					m_grs_pay=grs_pay
					m_sln_ded=sln_ded
					m_hdmf_ded=hdmf_ded
					m_comp_ded=comp_ded
					m_comd_ded=comd_ded
					m_cal_ded=cal_ded
					m_tax_ee=tax_ee
					m_sss_ee=sss_ee
					m_med_ee=med_ee
					m_pgbg_ee=pgbg_ee
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
					m_tot_ded=tot_ded
					m_net_pay=net_pay
					m_bonus=bonus
					m_bonustax=bonustax
					do while .t.
						@ 4,26 get m_reg_pay pict m_fig
						@ 5,26 get m_rot_pay pict m_fig
						@ 6,26 get m_sphp_pay pict m_fig
						@ 7,26 get m_spot_pay pict m_fig
						@ 8,26 get m_lghp_pay pict m_fig
						@ 9,26 get m_lgot_pay pict m_fig
						@10,26 get m_oth_pay1 pict m_fig
						@11,26 get m_oth_pay3 pict m_fig
						@12,26 get m_oth_pay2 pict m_fig
						@13,26 get m_oth_pay4 pict m_fig
						@14,26 get m_lv_pay pict m_fig
						@15,26 get m_ls_pay pict m_fig
						*@16,26 get m_grs_pay pict m_fig
						@17,26 get m_sln_ded pict m_fig
						@18,26 get m_cal_ded pict m_fig
						@19,26 get m_hdmf_ded pict m_fig
						@20,26 get m_comp_ded pict m_fig
						@21,26 get m_comd_ded pict m_fig
						@ 4,61 get m_tax_ee pict m_fig
						@ 5,61 get m_sss_ee pict m_fig
						@ 6,61 get m_med_ee pict m_fig
						@ 7,61 get m_pgbg_ee pict m_fig
						@ 8,61 get m_oth_ded1 pict m_fig
						@ 9,61 get m_oth_ded2 pict m_fig
						@10,61 get m_oth_ded3 pict m_fig
						@11,61 get m_oth_ded4 pict m_fig
						@12,61 get m_oth_ded5 pict m_fig
						@13,61 get m_oth_ded6 pict m_fig
						@14,61 get m_oth_ded7 pict m_fig
						@15,61 get m_oth_ded8 pict m_fig
						@16,61 get m_oth_ded9 pict m_fig
						@17,61 get m_oth_ded0 pict m_fig
						*@18,61 get m_tot_ded pict m_fig
						*@19,61 get m_net_pay pict m_fig
						@19,61 get m_bonus    pict m_fig
						@20,61 get m_bonustax pict m_fig
						read
						m_grs_pay=round(m_reg_pay+m_rot_pay+m_sphp_pay+m_spot_pay+m_lghp_pay;
							+m_lgot_pay+m_lv_pay+m_ls_pay+m_oth_pay1+m_oth_pay2+m_oth_pay3;
							+m_oth_pay4+m_bonus,2)
						m_tot_ded=round(m_sln_ded+m_hdmf_ded+m_sss_ee+m_med_ee+m_pgbg_ee+m_tax_ee;
							+m_oth_ded1+m_oth_ded2+m_oth_ded3+m_oth_ded4+m_oth_ded5;
							+m_oth_ded6+m_oth_ded7+m_oth_ded8+m_oth_ded9+m_oth_ded0;
							+m_comp_ded+m_comd_ded+m_cal_ded+m_bonustax,2)
						m_net_pay=round(m_grs_pay-m_tot_ded+m_bonus-m_bonustax,2)
						@16,26 say m_grs_pay pict m_fig
						@18,61 say m_tot_ded pict m_fig
						@21,61 say m_net_pay pict m_fig
						if m_net_pay<0
							f_err('Net PAY can never be less than zero !',.t.)
							loop
						endif
						if .not. f_ask('Data correct ?')
							loop
						endif
						if f_ask('Save ?')
							sele tmcard
							if fil_lock(5)
								repl oth_pay1 with m_oth_pay1, oth_pay2 with m_oth_pay2,;
									oth_pay3 with m_oth_pay3, sln_ded with m_sln_ded,;
									hdmf_ded with m_hdmf_ded, oth_ded1 with m_oth_ded1,;
									oth_ded2 with m_oth_ded2, oth_ded3 with m_oth_ded3,;
									oth_ded4 with m_oth_ded4, oth_ded5 with m_oth_ded5,;
									oth_ded6 with m_oth_ded6, oth_ded7 with m_oth_ded7,;
									oth_ded8 with m_oth_ded8, oth_ded9 with m_oth_ded9,;
									oth_ded10 with m_oth_ded0, trn_flag with 'P',;
									comp_ded with m_comp_ded, comd_ded with m_comd_ded,;
									cal_ded with m_cal_ded, oth_pay4 with m_oth_pay4
								repl reg_pay with m_reg_pay, rot_pay with m_rot_pay,;
									sphp_pay with m_sphp_pay, spot_pay with m_spot_pay,;
									lghp_pay with m_lghp_pay, lgot_pay with m_lgot_pay
									if m_lv_pay>(lv_pay+lv2_pay) .and. lv_pay>0
										repl lv2_pay with m_lv_pay-lv_pay
									else
										if m_lv_pay>lv_pay
											repl lv2_pay with m_lv_pay-lv_pay
										else
											repl lv_pay with m_lv_pay, lv2_pay with 0
										endif
									endif
								repl ls_pay with m_ls_pay, grs_pay with m_grs_pay,;
									net_pay with m_net_pay, tot_ded with m_tot_ded,;
									sss_ee with m_sss_ee, med_ee with m_med_ee,;
									tax_ee with m_tax_ee, pgbg_ee with m_pgbg_ee,;
									bonus with m_bonus, bonustax with m_bonustax
							endif
							unlock all
						endif
						exit
					enddo
				endif
			case m_proc='D'
				if fil_lock(5)
					if f_ask('DELETE this record.  Are you sure ?')
						m_needback=.t.
						dele
						skip -1
						unlo
						m_pack=.t.
					endi
				endi
			case m_proc='X'
				exit	
		endc
		do p_paydisp
	endd
	if m_pack
		sele tmcard
		use
		if net_use('&dpath\tmcard',.t.,5)
			if fil_lock(5)
				set inde to
				f_mess('Packing files.  Please wait...',.f.)
				pack
				f_mess('Rebuilding index files.  Please wait...',.f.)
				set inde to &dpath\tbyemp,&dpath\tbydep,&dpath\tbynm
				rein
			endi
		endi
	endi
	sele tmcard
	m_recc=recc()
	sele sys_id
	if fil_lock(5)
		repl trn_ctr with m_recc, needbackup with m_needbackup
		unlo
	endi
	exit	
endd
clos all
rest scre from m_prevscrn
retu

proc p_paydisp
set color to (m_crev)
@ 3,14 say emp_no
@ 3,21 say emp_nm
@ 3,68 say dep_no
@ 4,26 say tran(reg_pay,m_fig)
@ 5,26 say tran(rot_pay,m_fig)
@ 6,26 say tran(sphp_pay,m_fig)
@ 7,26 say tran(spot_pay,m_fig)
@ 8,26 say tran(lghp_pay,m_fig)
@ 9,26 say tran(lgot_pay,m_fig)
@10,26 say tran(oth_pay1,m_fig)
@11,26 say tran(oth_pay3,m_fig)
@12,26 say tran(oth_pay2,m_fig)
@13,26 say tran(oth_pay4,m_fig)
@14,26 say tran(lv_pay+lv2_pay,m_fig)
@15,26 say tran(ls_pay,m_fig)
@16,26 say tran(grs_pay,m_fig)
@17,26 say tran(sln_ded,m_fig)
@18,26 say tran(cal_ded,m_fig)
@19,26 say tran(hdmf_ded,m_fig)
@20,26 say tran(comp_ded,m_fig)
@21,26 say tran(comd_ded,m_fig)
@ 4,61 say tran(tax_ee,m_fig)
@ 5,61 say tran(sss_ee,m_fig)
@ 6,61 say tran(med_ee,m_fig)
@ 7,61 say tran(pgbg_ee,m_fig)
@ 8,61 say tran(oth_ded1,m_fig)
@ 9,61 say tran(oth_ded2,m_fig)
@10,61 say tran(oth_ded3,m_fig)
@11,61 say tran(oth_ded4,m_fig)
@12,61 say tran(oth_ded5,m_fig)
@13,61 say tran(oth_ded6,m_fig)
@14,61 say tran(oth_ded7,m_fig)
@15,61 say tran(oth_ded8,m_fig)
@16,61 say tran(oth_ded9,m_fig)
@17,61 say tran(oth_ded10,m_fig)
@18,61 say tran(tot_ded,+m_fig)
@19,61 say tran(bonustax,m_fig)
@20,61 say tran(net_pay,m_fig)
@21,61 say tran(bonus,m_fig)
set color to (m_cnor)
return
