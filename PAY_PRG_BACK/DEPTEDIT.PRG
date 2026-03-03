* Program Name : Department File Maintenance
* Program Code : Deptedit.prg
* Date : April 3, 1994
* Author : SVC

m_old_col=setcolor()
do whil .t.
	f_setting()
	sele 1
	if .not. net_use('&dpath\dept',.t.,5)
		exit
	endi
	set inde to &dpath\dbydep
	go top
	m_pack=.f.
	m_fig='999,999.99'
	m_dscrn=savescreen(2,2,23,76)
	f_drawbox(2,3,22,76,5,3)
	m_dep_no='  '
	m_dep_nm=spac(25)
	stor 0 to m_reg_pay, m_ot_pay, m_hol_pay, m_oth_pay1, m_oth_pay3,;
		m_lvenc_pay, m_lsenc_pay, m_grs_pay, m_tax, m_oth_pay2, m_sss_ee,;
		m_sss_er, m_med_ee, m_med_er, m_pgbg_ee, m_pgbg_er, m_ec_er, m_pbg_loan,;
		m_sss_loan, m_cal_loan, m_comp_loan, m_commodloan,;
		m_oth_ded1, m_oth_ded2, m_oth_ded3, m_oth_ded4, m_oth_ded5,;
		m_oth_ded6, m_oth_ded7, m_oth_ded8, m_oth_ded9, m_oth_ded0, m_emp_ctr,;
		m_net_pay,m_bontot,m_bontax
	set colo to (m_cnor)
	@ 3,6 say 'DEPT#:    -'
	@ 4,6 say "TTL BASIC PAY...... :               TTL "+m_st_ln2+  "  :"
	@ 5,6 say 'TTL OVERTIME PAY... :               TTL '+m_st_ln3+  '  :'
	@ 6,6 say 'TTL HOLIDAY PAY.... :               TTL '+m_st_ln4+  '  :'
	@ 7,6 say 'TTL ADJUSTMENTS.... :               TTL '+m_st_ln5+  '  :'
	@ 8,6 say 'TTL OTHER EARNINGS. :               TTL '+m_st_ded1 +'  :'
	@ 9,6 say 'TTL ENCASHED VL PAY :               TTL '+m_st_ded2 +'. :'
	@10,6 say 'TTL ENCASHED SL PAY :               TTL '+m_st_ded3 +'. :'
	@11,6 say 'TTL GRS PAY W/O 13TH:               TTL '+m_st_ded4 +'. :'
	@12,6 say 'TTL TAX W/O 13TH TAX:               TTL '+m_st_ded5 +'. :'
	@13,6 say 'TTL SSS BEN/NON TAX :               TTL '+m_st_ded6 +'. :'
	@14,6 say "TTL SSS PREM. ('EE) :               TTL "+m_st_ded7 +'. :'
	@15,6 say "TTL SSS PREM. ('ER) :               TTL "+m_st_ded8 +'. :'
	@16,6 say "TTL MEDICARE  ('EE) :               TTL "+m_st_ded9 +'. :'
	@17,6 say "TTL MEDICARE  ('ER) :               TTL "+m_st_ded10+'. :'
	@18,6 say "TTL PAG-IBIG  ('EE) :               NET PAY W/O BONUS.. :"
	@19,6 say "TTL PAG-IBIG  ('ER) :               BONUS.............. :"
	@20,6 say "TTL EC        ('ER) :               BONUS TAX.......... :"
	@21,6 say "TTL "+m_st_ln1+  "  :               NO. OF EMPLOYEES... :"
	f_bcln()
	do p_deptdisp
	do whil .t.
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
		endi
		f_bcln()
		do case
			case m_proc='A'
				do whil .t.
					do p_deptinit
					do p_deptgets with 'A'
					if .not. f_ask('Add new entry ?')
						exit
					endi
				endd
			case m_proc='E'
				m_dep_no=right(space(3)+alltrim(dep_no),2)
				m_dep_nm=dep_nm
				m_reg_pay=reg_pay
				m_ot_pay=ot_pay
				m_hol_pay=hol_pay
				m_oth_pay1=oth_pay1
				m_oth_pay3=oth_pay3
				m_lvenc_pay=lvenc_pay
				m_lsenc_pay=lsenc_pay
				m_grs_pay=grs_pay
				m_tax=tax
				m_oth_pay2=oth_pay2
				m_sss_ee=sss_ee
				m_sss_er=sss_er
				m_med_ee=med_ee
				m_med_er=med_er
				m_pgbg_ee=pgbg_ee
				m_pgbg_er=pgbg_er
				m_ec_er=ec_er
				m_pbg_loan=pbg_loan
				m_sss_loan=sss_loan
				m_cal_loan=cal_loan
				m_comp_loan=comp_loan
				m_commodloan=commodloan
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
				m_bontot=bontot
				m_bontax=bontax
				m_emp_ctr=emp_ctr
				m_net_pay=net_pay
				do p_deptgets with 'E'
			case m_proc='D'
				if fil_lock(5)
					if f_ask('DELETE this record.  Are you sure ?')
						dele
						skip -1
						unlo
						m_pack=.t.
					endi
				endi
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
				@4,13 get m_dep_no pict '@!' vali m_dep_no#spac(2)
				read
				m_dep_no=right(space(3)+alltrim(m_dep_no),2)
				if lastkey()<>27
					set soft on
					seek m_dep_no
					set soft off
					if eof()
						f_err('No record beyond that Department Number !',.f.)
						go m_oldrec
					endi
				endi
			case m_proc='X'
				exit	
		endc
		do p_deptdisp
	endd
	if m_pack
		if fil_lock(5)
			set inde to
			f_mess('Packing files.  Please wait...',.f.)
			pack
			f_mess('Rebuilding index files.  Please wait...',.f.)
			rein
		endi
	endi
	exit
endd
restscreen(2,2,23,76,m_dscrn)
set colo to (m_old_col)
clos all
rele all
retu

proc p_deptgets
para _m_a_or_e
m_o_dep_no=m_dep_no
do whil .t.
	@ 3,13 get m_dep_no pict '99' vali m_dep_no#spac(2)
	@ 3,18 get m_dep_nm pict '@!'  vali m_dep_nm#spac(25)
	@ 4,28 get m_reg_pay pict m_fig
	@ 5,28 get m_ot_pay pict m_fig
	@ 6,28 get m_hol_pay pict m_fig
	@ 7,28 get m_oth_pay1 pict m_fig
	@ 8,28 get m_oth_pay3 pict m_fig
	@ 9,28 get m_lvenc_pay pict m_fig
	@10,28 get m_lsenc_pay pict m_fig
	@11,28 get m_grs_pay pict m_fig
	@12,28 get m_tax pict m_fig
	@13,28 get m_oth_pay2 pict m_fig
	@14,28 get m_sss_ee pict m_fig
	@15,28 get m_sss_er pict m_fig
	@16,28 get m_med_ee pict m_fig
	@17,28 get m_med_er pict m_fig
	@18,28 get m_pgbg_ee pict m_fig
	@19,28 get m_pgbg_er pict m_fig
	@20,28 get m_ec_er pict m_fig
	@21,28 get m_sss_loan pict m_fig
	@ 4,64 get m_cal_loan pict m_fig
	@ 5,64 get m_pbg_loan pict m_fig
	@ 6,64 get m_comp_loan pict m_fig
	@ 7,64 get m_commodloan pict m_fig
	@ 8,64 get m_oth_ded1 pict m_fig
	@ 9,64 get m_oth_ded2 pict m_fig
	@10,64 get m_oth_ded3 pict m_fig
	@11,64 get m_oth_ded4 pict m_fig
	@12,64 get m_oth_ded5 pict m_fig
	@13,64 get m_oth_ded6 pict m_fig
	@14,64 get m_oth_ded7 pict m_fig
	@15,64 get m_oth_ded8 pict m_fig
	@16,64 get m_oth_ded9 pict m_fig
	@17,64 get m_oth_ded0 pict m_fig
	@18,64 get m_net_pay pict m_fig
	@19,64 get m_bontot  pict m_fig
	@20,64 get m_bontax  pict m_fig
	@21,64 get m_emp_ctr pict m_fig
	read
	if lastkey()=27
		exit
	endi
	m_dep_no=right(space(3)+alltrim(m_dep_no),2)
	if m_o_dep_no<>m_dep_no
		m_oldrec=recno()
		seek m_dep_no
		if .not. eof()
			f_err('That Department Number already exists !  Changes not accepted.',.f.)
			m_dep_no=m_o_dep_no
			goto m_oldrec
			loop
		endi
		goto m_oldrec
	endi
	if f_ask('Data Correct ?')
		if f_ask('Save ?')
			if fil_lock(5)
				if _m_a_or_e='A'
					appe blan
				endi
				repl dep_no with m_dep_no, dep_nm with m_dep_nm,;
					reg_pay with m_reg_pay, ot_pay with m_ot_pay,;
					hol_pay with m_hol_pay, oth_pay1 with m_oth_pay1,;
					oth_pay3 with m_oth_pay3, lvenc_pay with m_lvenc_pay,;
					lsenc_pay with m_lsenc_pay, grs_pay with m_grs_pay,;
					tax with m_tax, oth_pay2 with m_oth_pay2,;
					sss_ee with m_sss_ee, sss_er with m_sss_er,;
					med_ee with m_med_ee, med_er with m_med_er,;
					pgbg_ee with m_pgbg_ee, pgbg_er with m_pgbg_er,;
					ec_er with m_ec_er, pbg_loan with m_pbg_loan,;
					sss_loan with m_sss_loan, oth_ded1 with m_oth_ded1,;
					oth_ded2 with m_oth_ded2, oth_ded3 with m_oth_ded3,;
					oth_ded4 with m_oth_ded4, oth_ded5 with m_oth_ded5,;
					oth_ded6 with m_oth_ded6, oth_ded7 with m_oth_ded7,;
					oth_ded8 with m_oth_ded8, oth_ded9 with m_oth_ded9,;
					oth_ded10 with m_oth_ded0, emp_ctr with m_emp_ctr,;
					net_pay with m_net_pay, bontot with m_bontot,;
					bontax with m_bontax, cal_loan with m_cal_loan,;
					comp_loan with m_comp_loan, commodloan with m_commodloan
			endi
		endi
		exit
	endi
endd
retu

proc p_deptinit
m_dep_no='  '
m_dep_nm=spac(25)
stor 0 to m_reg_pay, m_ot_pay, m_hol_pay, m_oth_pay1, m_oth_pay3, m_lvenc_pay,;
m_lsenc_pay, m_grs_pay, m_tax, m_oth_pay2, m_sss_ee, m_sss_er, m_med_ee,;
m_med_er, m_pgbg_ee, m_pgbg_er, m_ec_er, m_pbg_loan, m_sss_loan, m_oth_ded1,;
m_oth_ded2, m_oth_ded3, m_oth_ded4, m_oth_ded5, m_oth_ded6, m_oth_ded7,;
m_oth_ded8, m_oth_ded9, m_oth_ded0, m_emp_ctr, m_net_pay,;
m_cal_loan, m_comp_loan, m_commodloan, m_bontot, m_bontax
return

proc p_deptdisp
@ 3,13 say dep_no
@ 3,18 say dep_nm
@ 4,28 say tran(reg_pay,m_fig)
@ 5,28 say tran(ot_pay,m_fig)
@ 6,28 say tran(hol_pay,m_fig)
@ 7,28 say tran(oth_pay1,m_fig)
@ 8,28 say tran(oth_pay3,m_fig)
@ 9,28 say tran(lvenc_pay,m_fig)
@10,28 say tran(lsenc_pay,m_fig)
@11,28 say tran(grs_pay,m_fig)
@12,28 say tran(tax,m_fig)
@13,28 say tran(oth_pay2,m_fig)
@14,28 say tran(sss_ee,m_fig)
@15,28 say tran(sss_er,m_fig)
@16,28 say tran(med_ee,m_fig)
@17,28 say tran(med_er,m_fig)
@18,28 say tran(pgbg_ee,m_fig)
@19,28 say tran(pgbg_er,m_fig)
@20,28 say tran(ec_er,m_fig)
@21,28 say tran(sss_loan,m_fig)
@ 4,64 say tran(cal_loan,m_fig)
@ 5,64 say tran(pbg_loan,m_fig)
@ 6,64 say tran(comp_loan,m_fig)
@ 7,64 say tran(commodloan,m_fig)
@ 8,64 say tran(oth_ded1,m_fig)
@ 9,64 say tran(oth_ded2,m_fig)
@10,64 say tran(oth_ded3,m_fig)
@11,64 say tran(oth_ded4,m_fig)
@12,64 say tran(oth_ded5,m_fig)
@13,64 say tran(oth_ded6,m_fig)
@14,64 say tran(oth_ded7,m_fig)
@15,64 say tran(oth_ded8,m_fig)
@16,64 say tran(oth_ded9,m_fig)
@17,64 say tran(oth_ded10,m_fig)
@18,64 say tran(net_pay,m_fig)
@19,64 say tran(bontot,m_fig)
@20,64 say tran(bontax,m_fig)
@21,64 say tran(emp_ctr,m_fig)
return
