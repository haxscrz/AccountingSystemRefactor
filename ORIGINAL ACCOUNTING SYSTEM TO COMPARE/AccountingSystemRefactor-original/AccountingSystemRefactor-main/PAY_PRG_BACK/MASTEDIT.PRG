/*
Program Name : Employee Master File Maintenance
Program Code : Mastedit.prg
Author       : SVC
Date         : May 18, 1994
*/

while .t.
	save scre to m_prevscrn
	f_setting()
	m_pack=.f.
	sele 1
	if .not. net_use('&dpath\master',.t.,5)
		exit
	endi
	if .not. fil_lock(5)
		exit
	endi
	set inde to &dpath\mbyemp, &dpath\mbydep, &dpath\mbynm
	sele 2
	if .not. net_use('&dpath\history',.t.,5)
		exit
	endi
	if .not. fil_lock(5)
		exit
	endi
	set inde to &dpath\hbyemp, &dpath\hbydep, &dpath\hbynm
	sele 3
	if .not. net_use('&dpath\dept',.f.,5)
		exit
	endi
	set inde to &dpath\dbydep
	sele 4
	if .not. net_use('&opath\taxtab',.f.,5)
		exit
	endi
	set inde to &opath\tax
	sele 5
	if .not. net_use('&dpath\sys_id',.f.,5)
		exit
	endi
	sele 6
	if .not. net_use('&dpath\tmcard',.t.,5)
		exit
	endi
	set inde to &dpath\tbyemp

   select master
   if f_choose("Select records to view:","Active Only","Resigned")
      set filter to emp_type = "A"
   else
      set filter to emp_type <> "A"
   endif

	set rela to emp_no into history, to emp_no into tmcard
   dbgotop()

	m_pic ='99,999.99'
	m_pic2='999,999.99'
	m_pic3=   '9999.99'
	y_pic = '999999.99'
	m_ypic='99999999.99'
	m_pscrn=1
	m_emp_no=space(6)
	m_o_emp_no=space(6)
	m_emp_nm=space(32)
	m_lastnm=space(15)
	m_firstnm=space(15)
	m_middlenm=space(2)
   m_mname := space(15)
	m_dep_no=space(2)
	m_tan=space(11)
	m_status=space(3)
	m_sss=space(12)
	m_phic=space(12)
	m_pgbg_no=space(13)
	store ctod('  /  /  ') to m_l_date, m_date_emp, m_date_sep, m_birthd,;
		m_ss_cal_dte, m_co_ln_dte, m_com_ln_dte, m_hln_dte
	m_emp_type=' '
	m_emp_stat=' '
	store .f. to m_union, m_pgbg, m_sss_member
	store 0 to m_b_rate, m_sln_amt, m_sln_bal, m_sln_trm, m_hln_amt, m_hln_bal,;
		m_hln_trm, m_ss_cal_ln, m_ss_cal_bal, m_ss_cal_trm,;
		m_co_ln, m_co_ln_bal, m_co_ln_trm, m_com_ln, m_com_ln_bal, m_com_ln_trm,;
		m_sik_lv, m_vac_lv, m_sik_used, m_vac_used, m_cola
	store 0 to m_m_basic, m_m_hol, m_m_ot, m_m_nsd, m_m_leave, m_m_leave2,;
		m_m_sleave, m_m_othp1, m_m_othp2, m_m_othp3, m_m_gross, m_m_sln,;
		m_m_hln, m_m_sscal, m_m_coln, m_m_comln,;
		m_m_ded1, m_m_ded2, m_m_ded3, m_m_ded4, m_m_ded5, m_m_ded6,;
		m_m_ded7, m_m_ded8, m_m_ded9, m_m_ded10, m_m_tax, m_m_ssee, m_m_sser,;
		m_m_medee, m_m_meder, m_m_pgee, m_m_pger, m_m_ecer, m_m_tded,;
		m_m_netpay, m_m_bontot, m_m_bontax, m_m_othp4
	store 0 to m_ss_ee1, m_ss_er1, m_med_ee1, m_med_er1, m_pgbg_ee1,;
		m_pgbg_er1, m_ec_er1, m_tax_ee1, m_grs_ee1, m_sln_pay1, m_hln_pay1,;
		m_ss_ee2, m_ss_er2, m_med_ee2, m_med_er2,	m_pgbg_ee2, m_pgbg_er2,;
		m_ec_er2, m_tax_ee2, m_grs_ee2, m_sln_pay2, m_hln_pay2, m_ss_ee3,;
		m_ss_er3, m_med_ee3, m_med_er3, m_pgbg_ee3, m_pgbg_er3, m_ec_er3,;
		m_tax_ee3, m_grs_ee3, m_sln_pay3, m_hln_pay3,;
		m_cal_pay1, m_com_pay1, m_comd_py1,;
		m_cal_pay2, m_com_pay2, m_comd_py2,;
		m_cal_pay3, m_com_pay3, m_comd_py3
	store 0 to m_y_basic, m_y_hol,;
		m_y_ot, m_y_nsd, m_y_leave, m_y_leave2, m_y_sleave, m_y_othp1,;
		m_y_othp2, m_y_othp3, m_y_gross,	m_y_hln, m_y_sln,;
		m_y_sscal, m_y_coln, m_y_comln, m_y_ded1, m_y_ded2,;
		m_y_ded3, m_y_ded4, m_y_ded5, m_y_ded6, m_y_ded7, m_y_ded8, m_y_ded9,;
		m_y_ded10, m_y_tax, m_y_tded, m_y_netpay, m_y_bonus, m_y_btax,;
		m_y_midbon, m_y_midtax, m_y_othp4, m_deminimis
	m_y_sss := m_y_med := m_y_pbg := 0
   m_y_premium:=m_y_othergrs:=m_y_othertax:=0
	stor space(30) to m_position, m_spouse
	stor space(50) to m_address, m_med1, m_med2
	m_acct_no=space(12)
	m_tel_no=space(10)
	m_relig=space(15)
	m_educ=space(20)
	set colo to (m_cnor)
	set key -3 to codehelp
	declare m_depcol[2], m_dephed[2], m_taxcol[1], m_taxhed[1]
	m_depcol[1]="dep_no"
	m_depcol[2]="dep_nm"
	m_dephed[1]="DEP#"
	m_dephed[2]="DEPT.NAME"
	m_taxcol[1]="exemption"
	m_taxhed[1]="STATUS"
	clear
	do p_masscrn
	do p_masdisp
	do while .t.
		*   5           17     24      32        42      50          62       71
		*  [C]ontinue  [A]dd  [E]dit  [D]elete  [N]ext  [P]revious  [F]ind  e[X]it
		set colo to (m_cnor)
		@23, 2 say '> [C]ontinue  [A]dd  [E]dit  [D]elete  [N]ext  [P]revious  [F]ind  e[X]it <'
		set colo to (m_cbrg)
		@23, 5 say 'C'
		@23,17 say 'A'
		@23,24 say 'E'
		@23,32 say 'D'
		@23,42 say 'N'
		@23,50 say 'P'
		@23,62 say 'F'
		@23,71 say 'X'
		set colo to (m_cnor)
		f_sayit('Press C, A, E, D, N, P, F or X')
		set curs off
		m_proc=upper(chr(inkey(0)))
		set curs on
		if lastkey()=27
			exit
		endif
		f_bcln()
		do case
			case m_proc='C'
				@23,1 to 23,78
				do while .t.
					m_pscrn=m_pscrn+1
					if m_pscrn=6
						m_pscrn=1
						do p_masscrn
						do p_masdisp
						exit
					endif
					do p_masscrn
					do p_masdisp
					f_sayit("Press 'C' to Continue, 'Esc' to abort.")
					do while .t.
						m_inkey=inke(0)
						if lastkey()=27 .or. m_inkey=67 .or. m_inkey=99
							exit
						endif
					enddo
					if lastkey()=27
						m_pscrn=5
					endif
				enddo

			case m_proc$'AE'
				m_pscrn=1
				m_prev_rec=recno()
				do p_masinit with m_proc
				do whil .t.
					do p_masscrn
					do	p_masgets with m_proc
					if lastkey()=27
						go m_prev_rec
						exit
					endi
					f_sayit("Press 'C' to Continue,'E' to Edit,'S' to Save, 'Esc' to abort.")
					do whil .t.
						m_inkey=inke(0)
						if lastkey()=27 .or. chr(m_inkey)$'CcEeSs'
							exit
						endif
					enddo
					do case
						case chr(m_inkey)$'CcSs'
							m_pscrn=m_pscrn+1
							if m_pscrn=6 .or. chr(m_inkey)$'Ss'
								if f_ask('Save ?')
									sele history
									if fil_lock(5)
										sele master
										if fil_lock(5)
											f_mess('Saving.  Please wait...',.f.)
											if m_proc='A'
												appe blan
												sele history
												appe blan
												sele master
											else
												go m_prev_rec
											endi
											do p_masinit with 'R'
											if m_proc='A'
												if .not. f_ask('Add another employee ?')
													exit
												endi
											else
												exit
											endi
											m_pscrn=1
											do p_masinit with m_proc
										endi
									endi
								else
									exit
								endi
							endi
						case chr(m_inkey)$'Ee'
							loop
						othe  && lastkey()=27
							exit
					endc
				endd
				m_pscrn=1
				do p_masscrn

			case m_proc='D'
				if f_password(23)
					sele master
					if fil_lock(5)
						sele history
						if fil_lock(5)
							dele
							sele master
							dele
							skip -1
							m_pack=.t.
						endi
						unlo all
						sele master
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
				@3, 6 get m_emp_no pict '999999' vali m_emp_no#space(6)
				read
				if lastkey()<>27
					set soft on
					seek m_emp_no
					set soft off
					if eof()
						f_err('No record beyond that Employee Number !',.f.)
						go m_oldrec
					endi
				endi
			case m_proc='X'
				exit	
		endc
		m_pscrn=1
		do p_masdisp
	endd
	if m_pack
		f_mess('Packing File.  Please wait...',.f.)
		sele master
		pack
		sele history
		pack
	endi
	sele master
	m_recc=recc()
	sele sys_id
	if fil_lock(5)
		if recc()=0
			appe blan
		endi
		repl emp_ctr with m_recc
		unlo
	endi
	exit
endd
rest scre from m_prevscrn
clos all
rele all
retu

proc p_masscrn
do case
	case m_pscrn=1
		set colo to (m_cnor)
		clea
	   @ 1,0 to 23,79
	   @ 4,1 to 4,78
		set colo to (m_crev)
		@0,1 say space(22)+'EMPLOYEE MASTER FILE MAINTENANCE'+space(23)
		set colo to (m_cnor)
/*
		@ 2, 2 say 'EMP.NO. [      ]      NAME [                                ]     DEPT. [  ]'
		@ 3,30 say 'LAST NAME'
		@ 3,45 say 'FIRST NAME'
		@ 3,60 say 'MI'
 EMP.NO. [      ]      NAME [12345678901234512345678901234512]     DEPT. [  ]
                             LAST NAME      FIRST NAME     MI
     EMP#      Last Name      First Name     MI    Middle Name       Dept#
    [123456]  [12345678901234512345678901234512]  [123456789012345]  [12]
     6         16             31             46    52                 71
*/
      @ 2,6 say 'EMP#      Last Name      First Name     MI    Middle Name       Dept#'
      @ 3,5 say '[      ]  [                                ]  [               ]  [  ]'
		@ 5,2 say 'BASIC RATE....... [         ]          COLA PER HOUR [           ]'
		@ 6,2 say 'SSS.............. [            ]       PHIC NO...... [            ]'
		@ 7,2 say 'PAG-IBIG NO...... [             ]'
		@ 8,2 say 'TIN.............. [           ]'
		@ 9,2 say 'TAX STATUS....... [   ]'
		@10,2 say 'ATM ACCOUNT NO... [            ]'
		@11,2 say 'PAG-IBIG MEMBER.. [ ] ->(Y/N)    UNION MEMBER (Y/N)..[ ]  SSS-MEMBER(Y/N).[ ]'
		@12,2 say 'Reg/Cas/conF/Exec [ ] ->("R"-REGULAR/"C"-CASUAL/"F"-CONFIDENTIAL/"E"-EXEC)'
		@13,2 say 'EMPLOYMENT STATUS [ ] ->("A"-ACTIVE/"R"-RESIGNED/"L"-ON INDEFINITE LEAVE)'
		@14,2 say 'VL CREDITS....... [       ]  VL USED [       ]'
		@15,2 say 'SL CREDITS....... [       ]  SL USED [       ]'
		@16,2 say m_st_ln1+     ' [           ]  BAL.[           ] TERM [    ]  LN.DT [  /  /  ]'
		@17,2 say m_st_ln2+     ' [           ]  BAL.[           ] TERM [    ]  LN.DT [  /  /  ]'
		@18,2 say m_st_ln3+     ' [           ]  BAL.[           ] TERM [    ]  LN.DT [  /  /  ]'
		@19,2 say m_st_ln4+     ' [           ]  BAL.[           ] TERM [    ]  LN.DT [  /  /  ]'
		@20,2 say m_st_ln5+     ' [           ]  BAL.[           ] TERM [    ]  LN.DT [  /  /  ]'
		set colo to (m_cnor)

	case m_pscrn=2
		set colo to (m_cnor)
	   @4,0 clear to 23,79
	   @5,0 to 23,79
		set colo to (m_crev)
		@5,32 say ' MONTHLY COUNTERS '
		set colo to (m_cnor)
		@ 7,2 say 'BASIC PAY :            '+m_st_ln4+  ':            TAX WITHHELD. :           '
		@ 8,2 say 'HOL.PAY.. :            '+m_st_ln5+  ':            SSS Employee. :           '
		@ 9,2 say 'O.T.PAY.. :            '+m_st_ded1 +':            SSS Employer. :           '
		@10,2 say 'N.S.D.... :            '+m_st_ded2 +':            MED Employee. :           '
		@11,2 say 'VL-1 PAY. :            '+m_st_ded3 +':            MED Employer. :           '
		@12,2 say 'VL-2 PAY. :            '+m_st_ded4 +':            PAG-IBIG ee.. :           '
		@13,2 say 'SL  PAY.. :            '+m_st_ded5 +':            PAG-IBIG er.. :           '
		@14,2 say 'TAXABLE P1:            '+m_st_ded6 +':            EC & MAT..... :           '
		@15,2 say 'TAXABLE P2:            '+m_st_ded7 +':            TOT.DEDUCTION :           '
		@16,2 say 'NON-TAX P1:            '+m_st_ded8 +':            NET PAY...... :           '
		@17,2 say 'NON-TAX P2:            '+m_st_ded9 +':            BONUS........ :           '
		@18,2 say 'GROSS PAY :            ADDITIONAL TAX:            BONUS TAX.... :           '
		@19,2 say m_rt_ln1+ ':            '
		@20,2 say m_rt_ln2+ ':            '
		@21,2 say m_rt_ln3+ ':            '
		set colo to (m_cnor)
		@6,24 to 22,24
		@6,51 to 22,51
		@20,31 say 'Note: Monthly Gross & Net Pay excludes Bonus'
		@21,31 say '      Monthly Tax Deduction excludes Bonus Tax'

	case m_pscrn=3
		set colo to (m_cnor)
	   @4,0 clear to 23,79
	   @4,0 to 4,79
		set colo to (m_crev)
		@4,31 say ' QUARTERLY COUNTERS '
		set colo to (m_cnor)
		@ 5,1 say 'ÚÄÄÄÄÄÂÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÂÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÂÄÄÄÄÄÄÄÄÄÂÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ¿'
		@ 6,1 say '³MONTH³        SSS        ³     MEDICARE      ³   EC    ³      PAG-IBIG     ³'
		@ 7,1 say 'ÆÍÍÍÍÍØÍÍÍÍÍÍÍÍÍÑÍÍÍÍÍÍÍÍÍØÍÍÍÍÍÍÍÍÍÑÍÍÍÍÍÍÍÍÍØÍÍÍÍÍÍÍÍÍØÍÍÍÍÍÍÍÍÍÑÍÍÍÍÍÍÍÍÍµ'
		@ 8,1 say '³  1  ³         ³         ³         ³         ³         ³         ³         ³'
		@ 9,1 say '³  2  ³         ³         ³         ³         ³         ³         ³         ³'
		@10,1 say '³  3  ³         ³         ³         ³         ³         ³         ³         ³'
		@11,1 say 'ÃÄÄÄÄÄÅÄÄÄÄÄÄÄÄÄÁÄÄÂÄÄÄÄÄÄÁÄÄÄÄÄÂÄÄÄÁÄÄÄÄÄÄÄÄÂÁÄÄÄÄÄÄÄÄÄÁÄÂÄÄÄÄÄÄÄÁÄÄÄÄÂÄÄÄÄÙ'
		@12,1 say '³MONTH³            ³            ³            ³            ³            ³'
		@13,1 say 'ÆÍÍÍÍÍØÍÍÍÍÍÍÍÍÍÍÍÍØÍÍÍÍÍÍÍÍÍÍÍÍØÍÍÍÍÍÍÍÍÍÍÍÍØÍÍÍÍÍÍÍÍÍÍÍÍØÍÍÍÍÍÍÍÍÍÍÍÍµ' 
		@14,1 say '³  1  ³            ³            ³            ³            ³            ³'
		@15,1 say '³  2  ³            ³            ³            ³            ³            ³'
		@16,1 say '³  3  ³            ³            ³            ³            ³            ³'
		@17,1 say 'ÃÄÄÄÄÄÅÄÄÄÄÄÄÄÄÄÄÄÄÅÄÄÄÄÄÄÄÄÄÄÄÄÅÄÄÄÄÄÄÄÄÄÄÄÄÁÄÄÄÄÄÄÄÄÄÄÄÄÁÄÄÄÄÄÄÄÄÄÄÄÄÙ'
		@18,1 say '³MONTH³ TAX W/HELD ³ GRS INCOME ³'
		@19,1 say 'ÆÍÍÍÍÍØÍÍÍÍÍÍÍÍÍÍÍÍØÍÍÍÍÍÍÍÍÍÍÍÍµ Note: Quarterly Gross includes Taxable'
		@20,1 say '³  1  ³            ³            ³       Bonus.'
		@21,1 say '³  2  ³            ³            ³       Quarterly Tax withheld includes'
		@22,1 say '³  3  ³            ³            ³       Tax from Bonus before Year-end.'
		@23,1 say 'ÀÄÄÄÄÄÁÄÄÄÄÄÄÄÄÄÄÄÄÁÄÄÄÄÄÄÄÄÄÄÄÄÙ'
		set colo to n/w
		@ 6, 2 say 'MONTH'
		@ 6, 8 say '        SSS        '
		@ 6,28 say '     MEDICARE      '
		@ 6,48 say '   EC    '
		@ 6,58 say '      PAG-IBIG     '
		@12, 2 say 'MONTH'
		@12, 8 say ' '+m_rt_ln1+' '
		@12,21 say ' '+m_rt_ln2+' '
		@12,34 say ' '+m_rt_ln3+' '
		@12,47 say ' '+m_rt_ln4+' '
		@12,60 say ' '+m_rt_ln5+' '
		@18, 2 say 'MONTH'
		@18, 8 say ' TAX W/HELD '
		@18,21 say ' GRS INCOME '
		set colo to (m_cnor)

	case m_pscrn=4
		set colo to (m_cnor)
	   @4,0 clear to 23,79
	   @5,0 to 23,79
		set colo to (m_crev)
		@5,32 say ' YEARLY  COUNTERS '
		set colo to (m_cnor)
		@ 7,2 say 'BASIC PAY :            '+m_st_ln4+  ':            TAX WITHHELD. :           '
		@ 8,2 say 'HOL.PAY.. :            '+m_st_ln5+  ":            SSS  Employee :           "
		@ 9,2 say 'O.T.PAY.. :            '+m_st_ded1 +":            PHIC Employee :           "
		@10,2 say 'N.S.D.... :            '+m_st_ded2 +":            PGBG Employee :           "
		@11,2 say 'VL-1 PAY. :            '+m_st_ded3 +':            TOT.DEDUCTION :           '
		@12,2 say 'VL-2 PAY. :            '+m_st_ded4 +':            NET PAY...... :           '
		@13,2 say 'SL  PAY.. :            '+m_st_ded5 +':            BONUS........ :           '
		@14,2 say 'TAXABLE P1:            '+m_st_ded6 +':            BONUS TAX.... :           '
		@15,2 say 'TAXABLE P2:            '+m_st_ded7 +":            ADVANCE BONUS :           "
		@16,2 say 'NON-TAX P1:            '+m_st_ded8 +":            ADV.BONUS TAX :           "
		@17,2 say 'NON-TAX P2:            '+m_st_ded9 +":            HEALTH PREMIUM:           "
		@18,2 say "DEMINIMIS :            ADDITIONAL TAX:            OTHR TXBLE GRS:           "
		@19,2 say "GROSS PAY :                                       OTHR TAX WHELD:           "
		@20,2 say m_rt_ln1+ ':            '
		@21,2 say m_rt_ln2+ ':            '
		@22,2 say m_rt_ln3+ ':            '
		set colo to (m_cnor)
		@6,24 to 22,24
		@6,51 to 22,51
		@21,32 say 'Note: Yearly Gross.&Net Pay excludes Bonus.'
		@22,32 say '      Yearly Tax Deduction excludes Bonus Tax.'

	case m_pscrn=5
		set colo to (m_cnor)
	   @4,0 clear to 23,79
	   @5,0 to 23,79
		set colo to (m_crev)
		@5,28 say ' PERSONAL INFORMATION '
		set colo to (m_cnor)
		@ 7, 5 say 'DATE HIRED       [        ]'
		@ 8, 5 say 'DATE RESIGNED    [        ]'
		@ 9, 5 say 'POSITION         [                              ]'
		@10, 5 say 'NAME OF SPOUSE   [                              ]'
		@11, 5 say 'ADDRESS          [                                                  ]'
		@12, 5 say 'TEL.NO.          [          ]'
		@13, 5 say 'DATE OF BIRTH    [        ]'
		@14, 5 say 'RELIGION         [               ]'
		@15, 5 say 'EDUC. ATTAINMENT [                    ]'
		@16, 5 say 'MEDICAL HISTORY  [                                                  ]'
		@17,22 say                  '[                                                  ]'

endcase
return


proc p_masdisp
set color to (m_crev)
do case
	case m_pscrn=1
/*
     6         16             31             46    52                 71
		@2,11 say emp_no pict '999999'
		@2,30 say emp_nm
		@2,75 say dep_no
*/
		@3, 6 say emp_no pict '999999'
		@3,16 say emp_nm
		@3,52 say mname
		@3,71 say dep_no

		@5,21 say b_rate pict m_pic
		@5,56 say cola pict "9999.9999"
		@6,21 say sss pict '99-9999999-9'
		@6,56 say phic
		@7,21 say pgbg_no
		@8,21 say tan pict '999-999-999'
		@9,21 say status pict 'XXX'
		@10,21 say acct_no
		@11,21 say pgbg pict 'Y'
		@11,56 say union pict 'Y'
		@11,77 say sss_member pict 'Y'
		@12,21 say emp_stat pict '!'
		@13,21 say emp_type pict '!'   &&vali emp_type$'ARL' - ACTIVE / RESIGNED / ON INDEFINITE LEAVE
		@14,21 say vac_lv pict '99.9999'
		@14,40 say vac_used pict '99.9999'
		@15,21 say sik_lv pict '99.9999'
		@15,40 say sik_used pict '99.9999'
		@16,18 say sln_amt pict m_ypic
		@16,37 say sln_bal pict m_ypic
		@16,56 say sln_trm pict '9999'
		@16,70 say l_date
		@17,18 say ss_cal_ln pict m_ypic
		@17,37 say ss_cal_bal pict m_ypic
		@17,56 say ss_cal_trm pict '9999'
		@17,70 say ss_cal_dte
		@18,18 say hln_amt pict m_ypic
		@18,37 say hln_bal pict m_ypic
		@18,56 say hln_trm pict '9999'
		@18,70 say hln_dte
		@19,18 say co_ln pict m_ypic
		@19,37 say co_ln_bal pict m_ypic
		@19,56 say co_ln_trm pict '9999'
		@19,70 say co_ln_dte
		@20,18 say com_ln pict m_ypic
		@20,37 say com_ln_bal pict m_ypic
		@20,56 say com_ln_trm pict '9999'
		@20,70 say com_ln_dte

	case m_pscrn=2
		* MONTHLY COUNTERS
		@ 7,13 say m_basic  pict m_ypic
		@ 8,13 say m_hol    pict m_ypic
		@ 9,13 say m_ot     pict m_ypic
		@10,13 say m_nsd    pict m_ypic
		@11,13 say m_leave  pict m_ypic
		@12,13 say m_leave2 pict m_ypic
		@13,13 say m_sleave pict m_ypic
		@14,13 say m_othp1  pict m_ypic
		@15,13 say m_othp3  pict m_ypic
		@16,13 say m_othp2  pict m_ypic  &&non-taxable
		@17,13 say m_othp4  pict m_ypic  &&non-taxable
		@18,13 say m_gross  pict m_ypic
		@19,13 say m_sln    pict m_ypic
		@20,13 say m_sscal  pict m_ypic
		@21,13 say m_hln    pict m_ypic

		@ 7,40 say m_coln   pict m_ypic
		@ 8,40 say m_comln  pict m_ypic
		@ 9,40 say m_ded1   pict m_ypic
		@10,40 say m_ded2   pict m_ypic
		@11,40 say m_ded3   pict m_ypic
		@12,40 say m_ded4   pict m_ypic
		@13,40 say m_ded5   pict m_ypic
		@14,40 say m_ded6   pict m_ypic
		@15,40 say m_ded7   pict m_ypic
		@16,40 say m_ded8   pict m_ypic
		@17,40 say m_ded9   pict m_ypic
		@18,40 say m_ded10  pict m_ypic && TAX COLLECTION

		@ 7,67 say m_tax    pict m_ypic
		@ 8,67 say m_ssee   pict m_ypic
		@ 9,67 say m_sser   pict m_ypic
		@10,67 say m_medee  pict m_ypic
		@11,67 say m_meder  pict m_ypic
		@12,67 say m_pgee   pict m_ypic
		@13,67 say m_pger   pict m_ypic
		@14,67 say m_ecer   pict m_ypic
		@15,67 say m_tded   pict m_ypic
		@16,67 say m_netpay pict m_ypic
		@17,67 say m_bontot pict m_ypic
		@18,67 say m_bontax pict m_ypic

	case m_pscrn=3
		@ 8, 9 say ss_ee1 pict m_pic3
		@ 8,19 say ss_er1 pict m_pic3
		@ 8,29 say med_ee1 pict m_pic3
		@ 8,39 say med_er1 pict m_pic3
		@ 8,49 say ec_er1 pict m_pic3
		@ 8,59 say pgbg_ee1 pict m_pic3
		@ 8,69 say pgbg_er1 pict m_pic3
		@ 9, 9 say ss_ee2 pict m_pic3
		@ 9,19 say ss_er2 pict m_pic3
		@ 9,29 say med_ee2 pict m_pic3
		@ 9,39 say med_er2 pict m_pic3
		@ 9,49 say ec_er2 pict m_pic3
		@ 9,59 say pgbg_ee2 pict m_pic3
		@ 9,69 say pgbg_er2 pict m_pic3
	   @10, 9 say ss_ee3 pict m_pic3
	   @10,19 say ss_er3 pict m_pic3
   	@10,29 say med_ee3 pict m_pic3
	   @10,39 say med_er3 pict m_pic3
	   @10,49 say ec_er3 pict m_pic3
	   @10,59 say pgbg_ee3 pict m_pic3
	   @10,69 say pgbg_er3 pict m_pic3
		@14, 9 say sln_pay1 pict m_pic2
		@14,22 say cal_pay1 pict m_pic2
		@14,35 say hln_pay1 pict m_pic2
		@14,48 say com_pay1 pict m_pic2
		@14,61 say comd_pay1 pict m_pic2
		@15, 9 say sln_pay2 pict m_pic2
		@15,22 say cal_pay2 pict m_pic2
		@15,35 say hln_pay2 pict m_pic2
		@15,48 say com_pay2 pict m_pic2
		@15,61 say comd_pay2 pict m_pic2
		@16, 9 say sln_pay3 pict m_pic2
		@16,22 say cal_pay3 pict m_pic2
	   @16,35 say hln_pay3 pict m_pic2
		@16,48 say com_pay3 pict m_pic2
		@16,61 say comd_pay3 pict m_pic2
		@20, 9 say tax_ee1 pict m_pic2
		@20,22 say grs_ee1 pict m_pic2
		@21, 9 say tax_ee2 pict m_pic2
		@21,22 say grs_ee2 pict m_pic2
	   @22, 9 say tax_ee3 pict m_pic2
	   @22,22 say grs_ee3 pict m_pic2

	case m_pscrn=4
		* YEARLY COUNTERS
		@ 7,13 say y_basic  pict m_ypic
		@ 8,13 say y_hol    pict m_ypic
		@ 9,13 say y_ot     pict m_ypic
		@10,13 say y_nsd    pict m_ypic
		@11,13 say y_leave  pict m_ypic
		@12,13 say y_leave2 pict m_ypic
		@13,13 say y_sleave pict m_ypic
		@14,13 say y_othp1  pict m_ypic
		@15,13 say y_othp3  pict m_ypic
		@16,13 say y_othp2  pict m_ypic
		@17,13 say y_othp4  pict m_ypic
		@18,13 say deminimis pict m_ypic
		@19,13 say y_gross  pict m_ypic
		@20,13 say y_sln    pict m_ypic
		@21,13 say y_sscal  pict m_ypic
		@22,13 say y_hln    pict m_ypic

		@ 7,40 say y_coln   pict m_ypic
		@ 8,40 say y_comln  pict m_ypic
		@ 9,40 say y_ded1   pict m_ypic
		@10,40 say y_ded2   pict m_ypic
		@11,40 say y_ded3   pict m_ypic
		@12,40 say y_ded4   pict m_ypic
		@13,40 say y_ded5   pict m_ypic
		@14,40 say y_ded6   pict m_ypic
		@15,40 say y_ded7   pict m_ypic
		@16,40 say y_ded8   pict m_ypic
		@17,40 say y_ded9   pict m_ypic
		@18,40 say y_ded10  pict m_ypic
		@19,40 say deminimis pict m_ypic

		@ 7,67 say y_tax    pict m_ypic
		@ 8,67 say y_sss    pict m_ypic
		@ 9,67 say y_med    pict m_ypic
		@10,67 say y_pbg    pict m_ypic
		@11,67 say y_tded   pict m_ypic
		@12,67 say y_netpay pict m_ypic
		@13,67 say y_bonus  pict m_ypic
		@14,67 say y_btax   pict m_ypic
		@15,67 say y_midbon pict m_ypic
		@16,67 say y_midtax pict m_ypic
		@17,67 say y_premium  pict m_ypic
		@18,67 say y_othergrs pict m_ypic
		@19,67 say y_othertax pict m_ypic

	case m_pscrn=5
		@ 7,23 say history->date_emp pict '99/99/99'
		@ 8,23 say history->date_sep pict '99/99/99'
		@ 9,23 say history->position
		@10,23 say history->spouse
		@11,23 say history->address
		@12,23 say history->tel_no
		@13,23 say history->birthd pict '99/99/99'
		@14,23 say history->relig
		@15,23 say history->educ
		@16,23 say history->med1
		@17,23 say history->med2

endcase
set color to (m_cnor)
return

func f_valempno
para _m_emp_no, _m_proc
_m_oldarea=select()
sele master
seek _m_emp_no
if .not. eof()
	if _m_proc='A'
		f_err('Employee # '+_m_emp_no+' already exists !',.f.)
		sele (_m_oldarea)
		retu(.f.)
	else
		if _m_proc='E' .and. _m_emp_no#m_o_emp_no
			f_err('Employee # '+_m_emp_no+' already exists !',.f.)
			sele (_m_oldarea)
			retu(.f.)
		endi
	endi
endi
sele (_m_oldarea)
retu(.t.)

func f_valstatus
para _m_status
_m_oldarea=select()
sele taxtab
seek ltrim(_m_status)
if eof()
	f_err('Status '+_m_status+' is invalid !',.f.)
	sele (_m_oldarea)
	retu(.f.)
endi
sele (_m_oldarea)
retu(.t.)

func f_valdepno
para _m_dep_no
_m_oldarea=select()
sele dept
seek space(2-len(alltrim(_m_dep_no)))+alltrim(_m_dep_no)
if eof()
	f_err('Department '+_m_dep_no+' is invalid !',.f.)
	sele (_m_oldarea)
	retu(.f.)
endi
sele (_m_oldarea)
retu(.t.)

proc p_masgets
para _m_which
do whil .t.
	do case
		case m_pscrn=1
			@3, 6 get m_emp_no pict '999999' vali f_valempno(m_emp_no,_m_which)
			@3,16 get m_lastnm pict '@!' vali m_lastnm#space(15)
			@3,31 get m_firstnm pict '@!' vali m_firstnm#space(15)
			@3,46 get m_middlenm pict '@!' vali m_middlenm#space(2)
		   @3,52 get m_mname pict '@!' vali m_mname#space(15)
			@3,71 get m_dep_no pict '!!' vali m_dep_no#'  '.and.f_valdepno(m_dep_no)
			@5,21 say m_b_rate pict m_pic
			@5,56 get m_cola pict "9999.9999"
			@6,21 get m_sss pict '99-9999999-9'
			@6,56 get m_phic pict '@!'
			@7,21 get m_pgbg_no pict '@!'
			@8,21 get m_tan pict '999-999-999'
			@9,21 get m_status pict 'XXX' vali f_valstatus(m_status)
			@10,21 get m_acct_no pict '@!'
			@11,21 get m_pgbg pict 'Y'
			@11,56 get m_union pict 'Y'
			@11,77 get m_sss_member pict 'Y'
			@12,21 get m_emp_stat pict '!' vali m_emp_stat$'RCFE'
			@13,21 get m_emp_type pict '!' vali m_emp_type$'ARL' && - ACTIVE / RESIGNED / ON INDEFINITE LEAVE
			@14,21 get m_vac_lv pict '99.9999'
			@14,40 get m_vac_used pict '99.9999'
			@15,21 get m_sik_lv pict '99.9999'
			@15,40 get m_sik_used pict '99.9999'
			@16,18 get m_sln_amt pict m_ypic
			@16,37 get m_sln_bal pict m_ypic
			@16,56 get m_sln_trm pict '9999'
			@16,70 get m_l_date

			@17,18 get m_ss_cal_ln pict m_ypic
			@17,37 get m_ss_cal_bal pict m_ypic
			@17,56 get m_ss_cal_trm pict '9999'
			@17,70 get m_ss_cal_dte
			@18,18 get m_hln_amt pict m_ypic
			@18,37 get m_hln_bal pict m_ypic
			@18,56 get m_hln_trm pict '9999'
			@18,70 get m_hln_dte
			@19,18 get m_co_ln pict m_ypic
			@19,37 get m_co_ln_bal pict m_ypic
			@19,56 get m_co_ln_trm pict '9999'
			@19,70 get m_co_ln_dte
			@20,18 get m_com_ln pict m_ypic
			@20,37 get m_com_ln_bal pict m_ypic
			@20,56 get m_com_ln_trm pict '9999'
			@20,70 get m_com_ln_dte

		case m_pscrn=2
			* MONTHLY COUNTERS
			@ 7,13 get m_m_basic  pict m_ypic
			@ 8,13 get m_m_hol    pict m_ypic
			@ 9,13 get m_m_ot     pict m_ypic
			@10,13 get m_m_nsd    pict m_ypic
			@11,13 get m_m_leave  pict m_ypic
			@12,13 get m_m_leave2 pict m_ypic
			@13,13 get m_m_sleave pict m_ypic
			@14,13 get m_m_othp1  pict m_ypic
			@15,13 get m_m_othp3  pict m_ypic  &&non-taxable
			@16,13 get m_m_othp2  pict m_ypic
			@17,13 get m_m_othp4  pict m_ypic
			@18,13 say m_m_gross  pict m_ypic
			@19,13 get m_m_sln    pict m_ypic
			@20,13 get m_m_sscal  pict m_ypic
			@21,13 get m_m_hln    pict m_ypic

			@ 7,40 get m_m_coln   pict m_ypic
			@ 8,40 get m_m_comln  pict m_ypic
			@ 9,40 get m_m_ded1   pict m_ypic
			@10,40 get m_m_ded2   pict m_ypic
			@11,40 get m_m_ded3   pict m_ypic
			@12,40 get m_m_ded4   pict m_ypic
			@13,40 get m_m_ded5   pict m_ypic
			@14,40 get m_m_ded6   pict m_ypic
			@15,40 get m_m_ded7   pict m_ypic
			@16,40 get m_m_ded8   pict m_ypic
			@17,40 get m_m_ded9   pict m_ypic
			@18,40 get m_m_ded10  pict m_ypic && TAX COLLECTION

			@ 7,67 get m_m_tax    pict m_ypic
			@ 8,67 get m_m_ssee   pict m_ypic
			@ 9,67 get m_m_sser   pict m_ypic
			@10,67 get m_m_medee  pict m_ypic
			@11,67 get m_m_meder  pict m_ypic
			@12,67 get m_m_pgee   pict m_ypic
			@13,67 get m_m_pger   pict m_ypic
			@14,67 get m_m_ecer   pict m_ypic
			@15,67 say m_m_tded   pict m_ypic
			@16,67 say m_m_netpay pict m_ypic
			@17,67 get m_m_bontot pict m_ypic
			@18,67 get m_m_bontax pict m_ypic

		case m_pscrn=3
			@ 8, 9 get m_ss_ee1 pict m_pic3
			@ 8,19 get m_ss_er1 pict m_pic3
			@ 8,29 get m_med_ee1 pict m_pic3
			@ 8,39 get m_med_er1 pict m_pic3
			@ 8,49 get m_ec_er1 pict m_pic3
			@ 8,59 get m_pgbg_ee1 pict m_pic3
			@ 8,69 get m_pgbg_er1 pict m_pic3
			@14, 9 get m_sln_pay1 pict m_pic2
			@14,22 get m_cal_pay1 pict m_pic2
			@14,35 get m_hln_pay1 pict m_pic2
			@14,48 get m_com_pay1 pict m_pic2
			@14,61 get m_comd_py1 pict m_pic2
			@20, 9 get m_tax_ee1 pict m_pic2
			@20,22 get m_grs_ee1 pict m_pic2

			@ 9, 9 get m_ss_ee2 pict m_pic3
			@ 9,19 get m_ss_er2 pict m_pic3
			@ 9,29 get m_med_ee2 pict m_pic3
			@ 9,39 get m_med_er2 pict m_pic3
			@ 9,49 get m_ec_er2 pict m_pic3
			@ 9,59 get m_pgbg_ee2 pict m_pic3
			@ 9,69 get m_pgbg_er2 pict m_pic3
			@15, 9 get m_sln_pay2 pict m_pic2
			@15,22 get m_cal_pay2 pict m_pic2
			@15,35 get m_hln_pay2 pict m_pic2
			@15,48 get m_com_pay2 pict m_pic2
			@15,61 get m_comd_py2 pict m_pic2
			@21, 9 get m_tax_ee2 pict m_pic2
			@21,22 get m_grs_ee2 pict m_pic2

			@10, 9 get m_ss_ee3 pict m_pic3
			@10,19 get m_ss_er3 pict m_pic3
			@10,29 get m_med_ee3 pict m_pic3
			@10,39 get m_med_er3 pict m_pic3
			@10,49 get m_ec_er3 pict m_pic3
			@10,59 get m_pgbg_ee3 pict m_pic3
			@10,69 get m_pgbg_er3 pict m_pic3
			@16, 9 get m_sln_pay3 pict m_pic2
			@16,22 get m_cal_pay3 pict m_pic2
			@16,35 get m_hln_pay3 pict m_pic2
			@16,48 get m_com_pay3 pict m_pic2
			@16,61 get m_comd_py3 pict m_pic2
			@22, 9 get m_tax_ee3 pict m_pic2
			@22,22 get m_grs_ee3 pict m_pic2

		case m_pscrn=4
			* YEARLY COUNTERS
			@ 7,13 get m_y_basic  pict m_ypic
			@ 8,13 get m_y_hol    pict m_ypic
			@ 9,13 get m_y_ot     pict m_ypic
			@10,13 get m_y_nsd    pict m_ypic
			@11,13 get m_y_leave  pict m_ypic
			@12,13 get m_y_leave2 pict m_ypic
			@13,13 get m_y_sleave pict m_ypic
			@14,13 get m_y_othp1  pict m_ypic
			@15,13 get m_y_othp3  pict m_ypic
			@16,13 get m_y_othp2  pict m_ypic
			@17,13 get m_y_othp4  pict m_ypic
			@18,13 get m_deminimis pict m_ypic
			@19,13 say m_y_gross  pict m_ypic
			@20,13 get m_y_sln    pict m_ypic
			@21,13 get m_y_sscal  pict m_ypic
			@22,13 get m_y_hln    pict m_ypic

			@ 7,40 get m_y_coln   pict m_ypic
			@ 8,40 get m_y_comln  pict m_ypic
			@ 9,40 get m_y_ded1   pict m_ypic
			@10,40 get m_y_ded2   pict m_ypic
			@11,40 get m_y_ded3   pict m_ypic
			@12,40 get m_y_ded4   pict m_ypic
			@13,40 get m_y_ded5   pict m_ypic
			@14,40 get m_y_ded6   pict m_ypic
			@15,40 get m_y_ded7   pict m_ypic
			@16,40 get m_y_ded8   pict m_ypic
			@17,40 get m_y_ded9   pict m_ypic
			@18,40 get m_y_ded10  pict m_ypic

   		@ 7,67 get m_y_tax    pict m_ypic
	   	@ 8,67 get m_y_sss    pict m_ypic
		   @ 9,67 get m_y_med    pict m_ypic
   		@10,67 get m_y_pbg    pict m_ypic
	   	@11,67 say m_y_tded   pict m_ypic
		   @12,67 say m_y_netpay pict m_ypic
   		@13,67 get m_y_bonus  pict m_ypic
	   	@14,67 get m_y_btax   pict m_ypic
		   @15,67 get m_y_midbon pict m_ypic
   		@16,67 get m_y_midtax pict m_ypic
   		@17,67 get m_y_premium  pict m_ypic
	   	@18,67 get m_y_othergrs pict m_ypic
		   @19,67 get m_y_othertax pict m_ypic

		case m_pscrn=5
			@ 7,23 get m_date_emp pict '99/99/99'
			@ 8,23 get m_date_sep pict '99/99/99'
			@ 9,23 get m_position
			@10,23 get m_spouse
			@11,23 get m_address
			@12,23 get m_tel_no
			@13,23 get m_birthd pict '99/99/99'
			@14,23 get m_relig
			@15,23 get m_educ
			@16,23 get m_med1
			@17,23 get m_med2
	endc
	read
	if lastkey()=27
		exit
	endi
	do case
		case m_pscrn=2  &&monthly
			m_m_gross=m_m_basic+m_m_hol+m_m_ot+m_m_nsd+m_m_leave+m_m_leave2;
				+m_m_sleave+m_m_othp1+m_m_othp2+m_m_othp3
			m_m_tded=m_m_sln+m_m_sscal+m_m_hln+m_m_coln+m_m_comln+m_m_ded1;
				+m_m_ded2+m_m_ded3+m_m_ded4+m_m_ded4+m_m_ded5+m_m_ded6+m_m_ded7;
				+m_m_ded8+m_m_ded9+m_m_ded10+m_m_tax+m_m_ssee+m_m_medee+m_pgee
			m_m_netpay=m_m_gross-m_m_tded
			@19,13 say m_m_gross  pict m_ypic
			@15,67 say m_m_tded   pict m_ypic
			@16,67 say m_m_netpay pict m_ypic
		case m_pscrn=4  &&yearly
			m_y_gross=m_y_basic+m_y_hol+m_y_ot+m_y_nsd+m_y_leave+m_y_leave2;
				+m_y_sleave+m_y_othp1+m_y_othp2+m_y_othp3+m_y_othp4+m_deminimis
			m_y_tded=m_y_sln+m_y_sscal+m_y_hln+m_y_coln+m_y_comln+m_y_ded1;
				+m_y_ded2+m_y_ded3+m_y_ded4+m_y_ded4+m_y_ded5+m_y_ded6+m_y_ded7;
				+m_y_ded8+m_y_ded9+m_y_ded10+m_y_tax+m_y_sss+m_y_med+m_y_pbg
			m_y_netpay=m_y_gross-m_y_tded
			@19,13 say m_y_gross  pict m_ypic
			@11,67 say m_y_tded   pict m_ypic
			@12,67 say m_y_netpay pict m_ypic

	endcase
	if m_pscrn=1 .and. m_o_emp_no#m_emp_no
		m_oldrec=recno()
		seek m_emp_no
		if .not. eof() .and. recno()#m_oldrec
			f_err('That Employee already exists !  Changes not accepted.',.f.)
			m_emp_no=m_o_emp_no
			goto m_oldrec
			loop
		endif
		goto m_oldrec
	endif
	if f_ask('Data Correct ?')
		exit
	endif
enddo
return

proc p_masinit
para m_which
do case
	case m_which='A'
		m_emp_no=space(6)
		m_o_emp_no=space(6)
		m_emp_nm=space(32)
		m_lastnm=space(15)
		m_firstnm=space(15)
		m_middlenm=space(2)
      m_mname := space(15)
		m_dep_no=space(2)
		m_tan=space(11)
		m_status=space(3)
		m_sss=space(12)
		m_phic=space(12)
		m_pgbg_no=space(13)
		store ctod('  /  /  ') to m_l_date, m_date_emp, m_date_sep, m_birthd,;
			m_ss_cal_dte, m_co_ln_dte, m_com_ln_dte, m_hln_dte
		m_emp_type=' '
		m_emp_stat=' '
		store .f. to m_union, m_pgbg, m_sss_member
		store 0 to m_b_rate, m_sln_amt, m_sln_bal, m_sln_trm, m_hln_amt, m_hln_bal,;
			m_hln_trm, m_ss_cal_ln, m_ss_cal_bal, m_ss_cal_trm,;
			m_co_ln, m_co_ln_bal, m_co_ln_trm, m_com_ln, m_com_ln_bal, m_com_ln_trm,;
			m_sik_lv, m_vac_lv, m_sik_used, m_vac_used, m_cola
		store 0 to m_m_basic, m_m_hol, m_m_ot, m_m_nsd, m_m_leave, m_m_leave2,;
			m_m_sleave, m_m_othp1, m_m_othp2, m_m_othp3, m_m_othp3, m_m_gross,;
			m_m_sln, m_m_hln, m_m_sscal, m_m_coln, m_m_comln,;
			m_m_ded1, m_m_ded2, m_m_ded3, m_m_ded4, m_m_ded5, m_m_ded6,;
			m_m_ded7, m_m_ded8, m_m_ded9, m_m_ded10, m_m_tax, m_m_ssee, m_m_sser,;
			m_m_medee, m_m_meder, m_m_pgee, m_m_pger, m_m_ecer, m_m_tded,;
			m_m_netpay
		store 0 to m_ss_ee1, m_ss_er1, m_med_ee1, m_med_er1, m_pgbg_ee1,;
			m_pgbg_er1, m_ec_er1, m_tax_ee1, m_grs_ee1, m_sln_pay1, m_hln_pay1,;
			m_ss_ee2, m_ss_er2, m_med_ee2, m_med_er2,	m_pgbg_ee2, m_pgbg_er2,;
			m_ec_er2, m_tax_ee2, m_grs_ee2, m_sln_pay2, m_hln_pay2, m_ss_ee3,;
			m_ss_er3, m_med_ee3, m_med_er3, m_pgbg_ee3, m_pgbg_er3, m_ec_er3,;
			m_tax_ee3, m_grs_ee3, m_sln_pay3, m_hln_pay3,;
			m_cal_pay1, m_com_pay1, m_comd_py1,;
			m_cal_pay2, m_com_pay2, m_comd_py2,;
			m_cal_pay3, m_com_pay3, m_comd_py3
		store 0 to  m_y_basic, m_y_hol,;
			m_y_ot, m_y_nsd, m_y_leave, m_y_leave2, m_y_sleave, m_y_othp1,;
			m_y_othp2, m_y_othp3, m_y_gross,	m_y_hln, m_y_sln,;
			m_y_sscal, m_y_coln, m_y_comln, m_y_ded1, m_y_ded2,;
			m_y_ded3, m_y_ded4, m_y_ded5, m_y_ded6, m_y_ded7, m_y_ded8, m_y_ded9,;
			m_y_ded10, m_y_tax, m_y_tded, m_y_netpay, m_y_bonus, m_y_btax,;
         m_y_sss, m_y_med, m_y_pbg, m_y_othp4, m_deminimis
		store space(30) to m_position, m_spouse
		store space(50) to m_address, m_med1, m_med2
		m_acct_no=space(12)
		m_tel_no=space(10)
		m_relig=space(15)
		m_educ=space(20)

	case m_which='E'
		m_emp_no=emp_no
		m_o_emp_no=emp_no
		m_emp_nm=emp_nm
		m_lastnm=subs(emp_nm,1,15)
		m_firstnm=subs(emp_nm,16,15)
		m_middlenm=subs(emp_nm,31,2)
      m_mname := mname
		m_dep_no=right(space(3)+alltrim(dep_no),2)
		m_tan=tan
		m_status=status
		m_sss=sss
		m_phic=phic
		m_acct_no=acct_no
		m_pgbg_no=pgbg_no
		m_sss_member=sss_member
		m_l_date=l_date
		m_emp_type=emp_type
		m_emp_stat=emp_stat
		m_union=union
		m_pgbg=pgbg
		m_b_rate=b_rate
		m_cola=cola
		m_sik_lv=sik_lv
		m_vac_lv=vac_lv
		m_sik_used=sik_used
		m_vac_used=vac_used
		m_sln_amt=sln_amt
		m_sln_bal=sln_bal
		m_sln_trm=sln_trm
		m_hln_amt=hln_amt
		m_hln_bal=hln_bal
		m_hln_trm=hln_trm
		m_hln_dte=hln_dte
		m_ss_cal_ln=ss_cal_ln
		m_ss_cal_bal=ss_cal_bal
		m_ss_cal_trm=ss_cal_trm
		m_ss_cal_dte=ss_cal_dte
		m_co_ln=co_ln
		m_co_ln_bal=co_ln_bal
		m_co_ln_trm=co_ln_trm
		m_co_ln_dte=co_ln_dte
		m_com_ln=com_ln
		m_com_ln_bal=com_ln_bal
		m_com_ln_trm=com_ln_trm
		m_com_ln_dte=com_ln_dte
		m_m_basic=m_basic
		m_m_hol=m_hol
		m_m_ot=m_ot
		m_m_nsd=m_nsd
		m_m_leave=m_leave
		m_m_leave2=m_leave2
		m_m_sleave=m_sleave
		m_m_othp1=m_othp1
		m_m_othp2=m_othp2
		m_m_othp3=m_othp3
		m_m_othp4=m_othp4
		m_m_gross=m_gross
		m_m_sln=m_sln
		m_m_hln=m_hln
		m_m_sscal=m_sscal
		m_m_coln=m_coln
		m_m_comln=m_comln
		m_m_ded1=m_ded1
		m_m_ded2=m_ded2
		m_m_ded3=m_ded3
		m_m_ded4=m_ded4
		m_m_ded5=m_ded5
		m_m_ded6=m_ded6
		m_m_ded7=m_ded7
		m_m_ded8=m_ded8
		m_m_ded9=m_ded9
		m_m_ded10=m_ded10
		m_m_tax=m_tax
		m_m_ssee=m_ssee
		m_m_sser=m_sser
		m_m_medee=m_medee
		m_m_meder=m_meder
		m_m_pgee=m_pgee
		m_m_pger=m_pger
		m_m_ecer=m_ecer
		m_m_tded=m_tded
		m_m_netpay=m_netpay
		m_m_bontot=m_bontot
		m_m_bontax=m_bontax
		m_ss_ee1=ss_ee1
		m_ss_er1=ss_er1
		m_med_ee1=med_ee1
		m_med_er1=med_er1
		m_pgbg_ee1=pgbg_ee1
		m_pgbg_er1=pgbg_er1
		m_ec_er1=ec_er1
		m_tax_ee1=tax_ee1
		m_grs_ee1=grs_ee1
		m_sln_pay1=sln_pay1
		m_hln_pay1=hln_pay1
		m_cal_pay1=cal_pay1
		m_com_pay1=com_pay1
		m_comd_py1=comd_pay1
		m_ss_ee2=ss_ee2
		m_ss_er2=ss_er2
		m_med_ee2=med_ee2
		m_med_er2=med_er2
		m_pgbg_ee2=pgbg_ee2
		m_pgbg_er2=pgbg_er2
		m_ec_er2=ec_er2
		m_tax_ee2=tax_ee2
		m_grs_ee2=grs_ee2
		m_sln_pay2=sln_pay2
		m_hln_pay2=hln_pay2
		m_cal_pay2=cal_pay2
		m_com_pay2=com_pay2
		m_comd_py2=comd_pay2
		m_ss_ee3=ss_ee3
		m_ss_er3=ss_er3
		m_med_ee3=med_ee3
		m_med_er3=med_er3
		m_pgbg_ee3=pgbg_ee3
		m_pgbg_er3=pgbg_er3
		m_ec_er3=ec_er3
		m_tax_ee3=tax_ee3
		m_grs_ee3=grs_ee3
		m_sln_pay3=sln_pay3
		m_hln_pay3=hln_pay3
		m_cal_pay3=cal_pay3
		m_com_pay3=com_pay3
		m_comd_py3=comd_pay3
		m_y_basic=y_basic
		m_y_hol=y_hol
		m_y_ot=y_ot
		m_y_nsd=y_nsd
		m_y_leave=y_leave
		m_y_leave2=y_leave2
		m_y_sleave=y_sleave
		m_y_othp1=y_othp1
		m_y_othp2=y_othp2
		m_y_othp3=y_othp3
		m_y_othp4=y_othp4
		m_y_gross=y_gross
		m_y_hln=y_hln
		m_y_sln=y_sln
		m_y_sscal=y_sscal
		m_y_coln=y_coln
		m_y_comln=y_comln
		m_y_ded1=y_ded1
		m_y_ded2=y_ded2
		m_y_ded3=y_ded3
		m_y_ded4=y_ded4
		m_y_ded5=y_ded5
		m_y_ded6=y_ded6
		m_y_ded7=y_ded7
		m_y_ded8=y_ded8
		m_y_ded9=y_ded9
		m_y_ded10=y_ded10
		m_y_tax=y_tax
		m_y_tded=y_tded
		m_y_netpay=y_netpay
		m_y_bonus=y_bonus
		m_y_btax=y_btax
		m_y_midbon=y_midbon
		m_y_midtax=y_midtax
		m_y_sss := y_sss
		m_y_med := y_med
		m_y_pbg := y_pbg
		m_y_premium  := y_premium
		m_y_othergrs := y_othergrs
		m_y_othertax := y_othertax
		m_deminimis  := deminimis

		m_date_emp=history->date_emp
		m_date_sep=history->date_sep
		m_birthd=history->birthd
		m_position=history->position
		m_spouse=history->spouse
		m_address=history->address
		m_med1=history->med1
		m_med2=history->med2
		m_tel_no=history->tel_no
		m_relig=history->relig
		m_educ=history->educ

	case m_which='R'
		m_emp_nm=strtran(m_lastnm,',',' ',1)+m_firstnm+alltrim(m_middlenm)
		m_dep_no=right(space(3)+alltrim(m_dep_no),2)
		repl emp_no with alltrim(m_emp_no), emp_nm with m_emp_nm, dep_no with m_dep_no,;
			tan with m_tan, status with m_status, sss with m_sss,pgbg_no with m_pgbg_no,;
			emp_type with m_emp_type, union with m_union, emp_stat with m_emp_stat, acct_no with m_acct_no,;
			pgbg with m_pgbg, b_rate with m_b_rate, cola with m_cola, sss_member with m_sss_member,;
			sik_lv with m_sik_lv, vac_lv with m_vac_lv, sik_used with m_sik_used, vac_used with m_vac_used,;
			sln_amt    with m_sln_amt,     sln_bal    with m_sln_bal,;
			sln_trm    with m_sln_trm,     l_date     with m_l_date,;
			hln_amt    with m_hln_amt,     hln_bal    with m_hln_bal,;
			hln_trm    with m_hln_trm,     hln_dte    with m_hln_dte,;
			ss_cal_ln  with m_ss_cal_ln,   ss_cal_bal with m_ss_cal_bal,;
			ss_cal_trm with m_ss_cal_trm,  ss_cal_dte with m_ss_cal_dte,;
			co_ln      with m_co_ln,       co_ln_bal  with m_co_ln_bal,;
			co_ln_trm  with m_co_ln_trm,   co_ln_dte  with m_co_ln_dte,;
         phic       with m_phic,        mname with m_mname
		repl com_ln with m_com_ln,com_ln_bal with m_com_ln_bal
		repl com_ln_trm with m_com_ln_trm,  com_ln_dte with m_com_ln_dte
		repl m_basic with m_m_basic,	m_hol with m_m_hol,;
			m_ot with m_m_ot, m_nsd with m_m_nsd, m_leave with m_m_leave,;
			m_leave2 with m_m_leave2, m_sleave with m_m_sleave,;
			m_othp1 with m_m_othp1, m_othp2 with m_m_othp2,;
			m_othp3 with m_m_othp3, m_othp4 with m_m_othp4,;
			m_gross with m_m_gross,	m_sln with m_m_sln,;
			m_hln with m_m_hln, m_sscal with m_m_sscal, m_coln with m_m_coln,;
			m_comln with m_m_comln, m_ded1 with m_m_ded1, m_ded2 with m_m_ded2,;
			m_ded3 with m_m_ded3, m_ded4 with m_m_ded4, m_ded5 with m_m_ded5,;
			m_ded6 with m_m_ded6, m_ded7 with m_m_ded7, m_ded8 with m_m_ded8,;
			m_ded9 with m_m_ded9, m_ded10 with m_m_ded10, m_tax with m_m_tax,;
			m_ssee with m_m_ssee, m_sser with m_m_sser, m_medee with m_m_medee,;
			m_meder with m_m_meder, m_pgee with m_m_pgee, m_pger with m_m_pger,;
			m_ecer with m_m_ecer, m_tded with m_m_tded, m_netpay with m_m_netpay,;
			m_bontot with m_m_bontot, m_bontax with m_m_bontax

		repl	ss_ee1 with m_ss_ee1, ss_er1 with m_ss_er1, med_ee1 with m_med_ee1,;
			med_er1 with m_med_er1, pgbg_ee1 with m_pgbg_ee1,;
			pgbg_er1 with m_pgbg_er1, ec_er1 with m_ec_er1,;
			tax_ee1 with m_tax_ee1, grs_ee1 with m_grs_ee1,;
			sln_pay1 with m_sln_pay1, hln_pay1 with m_hln_pay1,;
			cal_pay1 with m_cal_pay1, com_pay1 with m_com_pay1,;
			comd_pay1 with m_comd_py1,;
			ss_ee2 with m_ss_ee2, ss_er2 with m_ss_er2, med_ee2 with m_med_ee2,;
			med_er2 with m_med_er2,	pgbg_ee2 with m_pgbg_ee2,;
			pgbg_er2 with m_pgbg_er2, ec_er2 with m_ec_er2,;
			tax_ee2 with m_tax_ee2,	grs_ee2 with m_grs_ee2,;
			sln_pay2 with m_sln_pay2, hln_pay2 with m_hln_pay2,;
			cal_pay2 with m_cal_pay2, com_pay2 with m_com_pay2,;
			comd_pay2 with m_comd_py2,;
			ss_ee3 with m_ss_ee3, ss_er3 with m_ss_er3, med_ee3 with m_med_ee3,;
			med_er3 with m_med_er3,	pgbg_ee3 with m_pgbg_ee3,;
			pgbg_er3 with m_pgbg_er3, ec_er3 with m_ec_er3,;
			tax_ee3 with m_tax_ee3,	grs_ee3 with m_grs_ee3,;
			sln_pay3 with m_sln_pay3, hln_pay3 with m_hln_pay3,;
			cal_pay3 with m_cal_pay3, com_pay3 with m_com_pay3,;
			comd_pay3 with m_comd_py3

		repl y_basic with m_y_basic, y_hol with m_y_hol, y_ot with m_y_ot,;
			y_nsd with m_y_nsd, y_leave with m_y_leave, y_leave2 with m_y_leave2,;
			y_sleave with m_y_sleave, y_othp1 with m_y_othp1,;
			y_othp2 with m_y_othp2, y_othp3 with m_y_othp3,;
         y_othp4 with m_y_othp4,;
			y_gross with m_y_gross, y_hln with m_y_hln, y_sln with m_y_sln,;
			y_sscal with m_y_sscal, y_coln with m_y_coln, y_comln with m_y_comln,;
			y_ded1 with m_y_ded1, y_ded2 with m_y_ded2, y_ded3 with m_y_ded3,;
			y_ded4 with m_y_ded4, y_ded5 with m_y_ded5, y_ded6 with m_y_ded6,;
			y_ded7 with m_y_ded7, y_ded8 with m_y_ded8, y_ded9 with m_y_ded9,;
			y_ded10 with m_y_ded10,	y_tax with m_y_tax, y_tded with m_y_tded,;
			y_netpay with m_y_netpay, y_bonus with m_y_bonus, y_btax with m_y_btax,;
			y_midbon with m_y_midbon, y_midtax with m_y_midtax,;
         y_sss with m_y_sss, y_med with m_y_med, y_pbg with m_y_pbg,;
         y_premium with m_y_premium, y_othergrs with m_y_othergrs,;
			y_othertax with m_y_othertax, deminimis with m_deminimis

		m_masrec=recno()

		select history
		if eof()
			append blank
		endif
		repl history->emp_no with alltrim(m_emp_no), history->emp_nm with m_emp_nm,;
			history->dep_no with m_dep_no, history->date_emp with m_date_emp,;
			history->date_sep with m_date_sep, history->birthd with m_birthd,;
			history->position with m_position, history->spouse with m_spouse,;
			history->address with m_address, history->med1 with m_med1,;
			history->med2 with m_med2, history->tel_no with m_tel_no,;
			history->relig with m_relig, history->educ with m_educ
		select tmcard
		rlock()
		repl emp_no with alltrim(m_emp_no), dep_no with m_dep_no, emp_nm with m_emp_nm
		unlock
		select master
		goto m_masrec
endcase
return

proc codehelp
do case
	case row()=2 &&.and.col()=75
		*dept
		_m_prevarea=select()
		_m_prevcolr=setcolor()
		select dept
		set color to (m_cnor)
	   _m_prevscrn=savescreen(3,39,15,78)
		@4,40,14,77 box m_border
	   dbedit(5,41,13,76,m_depcol,'','',m_dephed)
	   m_dep_no=dep_no
	   restscreen(3,39,15,78,_m_prevscrn)
		release _m_prevscrn
		select (_m_prevarea)
		set color to (_m_prevcolr)
		*inkey(0)

	case row()=9 &&.and.col()=21
		_m_prevarea=select()
		_m_prevcolr=setcolor()
		select taxtab
		set color to (m_cnor)
	   _m_prevscrn=savescreen(8,27,18,41)
		@9,28,17,40 box m_border
	   dbedit(10,29,16,39,m_taxcol,'','',m_taxhed)
	   m_status=upper(alltrim(exemption))
	   restscreen(8,27,18,41,_m_prevscrn)
		release _m_prevscrn
		select (_m_prevarea)
		set color to (_m_prevcolr)
		*inkey(0)
endcase
return
