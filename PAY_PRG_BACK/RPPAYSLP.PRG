* PAYROLL SYSTEM
* Program Name : Payslip printing
* Program Code : Rppayslp.prg
* Author : SVC
* Date Started : June 01, 1994
* Date Finished: June 02, 1994

para m_which
m_oldcol:=setcolor()
setcolor(m_cnor)
save screen to _m_prevscrn
do whil .t.
   f_bcln()
	m_spool=.t.
	m_page=0
	m_nextpg=.t.
	m_crow=60
	m_h='999.99'
	m_a='999,999.99'
	m_a1='9,999,999.99'
	m_a2='999,999,999.99'
	f_setting()
	sele 1
	if .not. net_use('&dpath\sys_id',.t.,5)
		exit
	endi
	if .not. fil_lock(5)
		exit
	endi
   if trn_prc!=trn_ctr
	   f_err('Please Compute Payroll first...',.t.)
		exit
	endif
	m_d1 = dtoc(beg_date)
	m_d2 = dtoc(end_date)
	sele 3
	if .not. net_use('&dpath\dept',.t.,5)
		exit
	endi
	set inde to &dpath\dbydep
	rein
	sele 4
	if .not. net_use('&dpath\master',.t.,5)
		exit
	endi
	set inde to &dpath\mbyemp
	sele 2
	if .not. net_use('&dpath\tmcard',.t.,5)
		exit
	endi
	set inde to &dpath\tbyemp
	rein
	set rela to emp_no into master
	go top
	m_postflag=.t.
	if m_which=2 && SELECTED PAY SLIPS
		*ASK USER TO ENTER 2 EMPLOYEE NUMBERS
		m_emp_no1=spac(6)
		m_emp_no2=spac(6)
		m_rppayslp=savescreen(13,4,18,73)
		f_drawbox(13,5,18,73,1,3)
		@15, 8 say 'PRINT PAYSLIP FROM EMP#:'
		@16,24 say 'TO EMP#:'
		do whil .t.
			@15,33 get m_emp_no1 pict '999999' vali f_valempnm(m_emp_no1,15)
			@16,33 get m_emp_no2 pict '999999' vali f_valempnm(m_emp_no2,16)
			read
			if lastkey()=27
				exit
			endi
			if m_emp_no2<m_emp_no1
				f_err('Invalid range.  Please check.',.f.)
				loop
			else
				if f_ask('Range correct ?')
					exit
				endi
			endi
		endd
		if lastkey()=27
			exit
		endi
		seek m_emp_no1
	endi
	if f_choose('SELECT PRINTING :',' BEFORE POSTING ',' AFTER POSTING ')
		m_postflag=.f.
	else
		m_postflag=.t.
	endif
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
	do case
		case m_which=1 && ALL PAY SLIPS W/ SUMMARY
			go bott
			m_emp_no2=emp_no
			go top
			do p_pslip
			?chr(12)
			do p_ssum with 1
		case m_which=2 && SELECTED PAY SLIPS
			do p_pslip
		case m_which=3 && PAY SLIP SUMMARY ONLY
			do p_ssum with 1
		case m_which=4 && PAY SLIP SUMMARY ONLY
			do p_ssum with 2
	endcase
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
rest screen from _m_prevscrn
dbcloseall()
setcolor(m_oldcol)
rele all
return

func f_valempnm
para _m_emp_no,_m_row
_m_oldarea=sele()
sele 2
seek _m_emp_no
if .not. eof()
	@_m_row,39 say emp_nm
	sele (_m_oldarea)
	retu(.t.)
else
	f_err('Employuee not in file !',.f.)
	sele (_m_oldarea)
	retu(.f.)
endi

proc p_pslip
m_crow=5
m_spac1=spac(f_center(m_company,99))
m_spac2=spac(99-len(m_company)-len(m_spac1))
m_spac3=spac(f_center(m_company,42)-1)
m_spac4=spac(42-len(m_company)-len(m_spac3))
do whil emp_no<=m_emp_no2 .and. .not. eof()
	m_dep_no=dep_no
	m_y_gross=master->y_gross
	m_y_tax=master->y_tax
	m_y_sln=master->y_sln
	m_y_hln=master->y_hln
	m_y_sscal=master->y_sscal
	m_y_coln=master->y_coln
	m_y_comln=master->y_comln
	sele dept
	seek m_dep_no
	if .not. eof()
		if len(alltrim(dep_nm))>25
			m_dep_nm=subs(alltrim(dep_nm),1,25)
		else
			m_dep_nm=alltrim(dep_nm)+space(25-len(alltrim(dep_nm)))
		endif
	else
		m_dep_nm=spac(25)
	endi
	sele tmcard
	m_spc1=int((32-len(alltrim(emp_nm)))/2)
	m_emp_nm=spac(m_spc1)+upper(alltrim(emp_nm))+spac(32-m_spc1-len(alltrim(emp_nm)))
	m_emp_no=alltrim(emp_no)+space(6-len(alltrim(emp_no)))
	m_b_rate=master->b_rate
	if .not.m_postflag
		m_calbal=master->ss_cal_bal-cal_ded
		m_houbal=master->hln_bal-hdmf_ded
		m_salbal=master->co_ln_bal-comp_ded
		m_slnbal=master->sln_bal-sln_ded
		m_mulbal=master->com_ln_bal-comd_ded
		m_y_gross=master->y_gross+grs_pay
		m_y_tax=master->y_tax+tax_ee
	else
		m_calbal=master->ss_cal_bal
		m_houbal=master->hln_bal
		m_salbal=master->co_ln_bal
		m_slnbal=master->sln_bal
		m_mulbal=master->com_ln_bal
		m_y_gross=master->y_gross
		m_y_tax=master->y_tax
	endif
	m_nsdper=0
	m_nsdiff=0
	m_nsd_hrs=nsd_hrs
	m_nsdper=(m_b_rate/8)*.10
	m_nsdiff=m_nsd_hrs*m_nsdper
	?'!'+m_spac1+m_company+m_spac2+'!'+m_spac3+m_company+m_spac4+'!'
	?'!                               P A Y S L I P  '+m_d1+' to '+m_d2+'                                 !              P A Y S L I P               !'
	?'!    EMP. NO.: '+m_emp_no+'                               DEPT. NO.: '+subs(dep_no,1,2)+' - '+alltrim(m_dep_nm)+spac(25-len(alltrim(m_dep_nm)))+'       !                                          !'
	?'!    NAME    : '+upper(alltrim(emp_nm))+spac(32-len(alltrim(emp_nm)))+'     RATE : '+tran(m_b_rate,m_a)+'                               !                                          !'
	?'!-------------------------------------------E-A-R-N-I-N-G-S-----------------------------------------!          *** RECEIPT OF PAY ***          !'
	?'! REGULAR  HRS/PAY:   '+tran(reg_hrs ,m_h)+'    '+tran(reg_pay ,m_a)+'       VL-ENC DAYS/PAY....:   '+tran(lv_hrs,m_h)+'    '+tran(lv_pay+lv2_pay,m_a)+'        !                                          !'
	?'! REG.  OT HRS/PAY:   '+tran(rot_hrs ,m_h)+'    '+tran(rot_pay ,m_a)+'       SL-ENC DAYS/PAY....:   '+tran(ls_hrs,m_h)+'    '+tran(ls_pay        ,m_a)+'        !        This is to acknowledge receipt    !'
	//?'! SPCL.HOL HRS/PAY:   '+tran(sphp_hrs,m_h)+'    '+tran(sphp_pay,m_a)+'       TAXABLE-PAY1.......:             '+tran(oth_pay1,m_a)+'        !   of the amount of  P'+tran(net_pay+bonus,m_a)+'          !'
	?'! SUN/SPL HRS/PAY:    '+tran(sphp_hrs,m_h)+'    '+tran(sphp_pay,m_a)+'       CTPA/SEA...........:             '+tran(oth_pay1,m_a)+'        !   of the amount of  P'+tran(net_pay+bonus,m_a)+'          !'
	?'! SUN/SPL OT HRS/PAY: '+tran(spot_hrs,m_h)+'    '+tran(spot_pay,m_a)+'       TAXABLE-PAY2.......:             '+tran(oth_pay3,m_a)+'        !   representing salary for the period     !'
	?'! LGL.HOL  HRS/PAY:   '+tran(lghp_hrs,m_h)+'    '+tran(lghp_pay,m_a)+'       NON-TAX-PAY1&PAY2..:             '+tran(oth_pay2+oth_pay4,m_a)+'        !   '+m_d1+' to '+m_d2+'.                  !'
	?'! LGL.H.OT HRS/PAY:   '+tran(lgot_hrs,m_h)+'    '+tran(lgot_pay,m_a)+'       13TH MONTH PAY.....:             '+tran(bonus,m_a)+'        !                                          !'
	?'! NSDIFF. HRS /PAY:   '+tran(m_nsd_hrs,m_h)+'    '+tran(m_nsdiff,m_a)+'                           GROSS PAY:   '+tran(grs_pay+bonus,m_a)+'        !     EMP. NO.: '+m_emp_no+'                     !'
	?'!------------------------------D-E-D-U-C-T-I-O-N-S-------------------------------LOAN-BALANCES------!                                          !'
	?'! GRS TO DT :'+tran(m_y_gross,m_a2)  +'        :          '+'   TAX TO DATE:'+tran(m_y_tax,'9999,999.99')+'  ! SS-CALBAL: '+tran(m_calbal,m_a1)+' !                                          !'
	?'! TAX...... :'+tran(tax_ee+bonustax,m_a)    +'  '+m_rt_ln4 +': '+tran(comp_ded,m_a)+'   '+m_rt_ded6+': '+tran(oth_ded6,m_a)+'  ! PBG.SALBAL:'+tran(m_houbal,m_a1)+' !                                          !'
	?'! SSS PREM. :'+tran(sss_ee,m_a)    +'  '+m_rt_ln5 +': '+tran(comd_ded,m_a)+'   '+m_rt_ded7+': '+tran(oth_ded7,m_a)         +'  ! MULT-PBAL :'+tran(m_mulbal,m_a1)+' !     '+           m_emp_nm                    +'     !'
	?'! PHILHEALTH:'+tran(med_ee,m_a)    +'  '+m_rt_ded1+': '+tran(oth_ded1,m_a)+'   '+m_rt_ded8+': '+tran(oth_ded8,m_a)         +'  ! SS-SALBAL :'+tran(m_slnbal,m_a1)+' !     --------------------------------     !'
	?'! PGBG PREM :'+tran(pgbg_ee,m_a)   +'  '+m_rt_ded2+': '+tran(oth_ded2,m_a)+'   '+m_rt_ded9+': '+tran(oth_ded9,m_a)         +'  ! SAL_LNBAL :'+tran(m_salbal,m_a1)+' !         (Sign Over Printed Name)         !'
	?'! PAGIBIG LN:'+tran(hdmf_ded,m_a)+'  '+m_rt_ded3+': '+tran(oth_ded3,m_a)+'   '+m_rt_ded10+': '+tran(oth_ded10,m_a)+'  !                         !                                          !'
	?'! '+m_rt_ln1+':'+tran(sln_ded,m_a) +'  '+m_rt_ded4+': '+tran(oth_ded4,m_a)+'               ----------  !             ----------- !     --------------------------------     !'
	?'! '+m_rt_ln2+':'+tran(cal_ded,m_a) +'  '+m_rt_ded5+': '+tran(oth_ded5,m_a)+'   TOTAL DED.: '+tran(tot_ded,m_a)+'  ! NET PAY  :   '+tran(net_pay+bonus,m_a)+'  !                  (Date)                  !'
	?repl('.',144)
	m_crow=m_crow+22
	skip
endd

proc p_ssum
para m_withatm
m_pass=1
m_total=0
do while .t.
	m_page=0
	sele tmcard
	go top
	stor 0 to m_t_grs, m_t_ded, m_t_net
	?chr(27)+chr(24)+chr(18)
	do while .not. eof()
		if m_nextpg
			m_page=m_page+1
			if m_page>1.or.m_crow>58
				?chr(12)
			endi
			?m_company
			?'P A Y S L I P   S U M M A R Y'
			?'Payroll Period: '+m_d1+' - '+m_d2
			?
			if m_withatm=1
				?alltrim(m_head)+spac(30-len(alltrim(m_head)))+spac(38)+'Page '+str(m_page,2)
				?repl('=',75)
				?'EMP#   EMPLOYEE NAME                     GROSS PAY   TOTAL-DED.  NET-PAY'
				?repl('=',75)
			else
				?alltrim(m_head)+spac(30-len(alltrim(m_head)))+spac(34)+'Page '+str(m_page,2)
				?repl('=',71)
				?'EMP#   EMPLOYEE NAME                      ACCOUNT NUMBER       NET-PAY'
				?repl('=',71)
			endif
			m_crow=8
			m_nextpg=.f.
		endif
		if m_withatm=1
			m_emp_no=alltrim(emp_no)+space(6-len(alltrim(emp_no)))
			?m_emp_no+' '+subs(emp_nm,1,32)+'  '+tran(grs_pay+bonus,m_a)+'  '+tran(tot_ded,m_a)+'  '+tran(net_pay+bonus,m_a)
			m_t_grs=m_t_grs+grs_pay+bonus
			m_t_ded=m_t_ded+tot_ded
			m_t_net=m_t_net+net_pay+bonus
		else
			if m_pass=1
				if dep_no<>'16'
					m_emp_no=emp_no
					select 4  &&master
					seek m_emp_no
					if .not. eof()
						m_acct_no=alltrim(acct_no)+repl('.',17-len(alltrim(acct_no)))
					else
						m_acct_no=repl('.',17)
					endif
					select tmcard
					?m_emp_no+' '+subs(emp_nm,1,32)+'   '+m_acct_no+'  '+tran(net_pay+bonus,m_a)
					m_total=m_total+net_pay+bonus
				endif
			else
				if dep_no='16'
					m_emp_no=emp_no
					select 4  &&master
					seek m_emp_no
					if .not. eof()
						m_acct_no=alltrim(acct_no)+repl('.',17-len(alltrim(acct_no)))
					else
						m_acct_no=repl('.',17)
					endif
					select tmcard
					m_emp_no=alltrim(emp_no)+space(6-len(alltrim(emp_no)))
					?m_emp_no+' '+subs(emp_nm,1,32)+'   '+m_acct_no+'  '+tran(net_pay+bonus,m_a)
				endif
			endif
		endif
		skip
		if eof()
			m_crow=60
		endif
		m_crow=m_crow+1
		if m_crow>58
			m_nextpg=.t.
		endi
	enddo
	if m_withatm=1
		?spac(39)+repl('  ----------',3)
		?spac(24)+'GRAND TOTAL :  '+tran(m_t_grs,'9,999,999.99')+tran(m_t_ded,'9,999,999.99')+tran(m_t_net,'9,999,999.99')
	endif
	?
	if m_withatm=1
		?repl('=',75)
		exit
	else
		?repl('=',71)
		if m_pass=2
			exit
		else
			*?spac(61)+'----------'
			?spac(48)+'T O T A L'+'    '+tran(m_total,'999,999.99')
			?spac(61)+'=========='
			?
			m_pass=2
			m_nextpg=.t.
			exit
		endif
	endif
enddo
return


/*
	?'!'+m_spac1+m_company+m_spac2+'!'+m_spac3+m_company+m_spac4+'!'
	?'!                                        P A Y S L I P                                              !              P A Y S L I P               !'
	?'!                                     '+m_d1+' to '+m_d2+'                                          !                                          !'
	?'!    EMP. NO.: '+m_emp_no+'                               DEPT. NO.: '+subs(dep_no,1,2)+' - '+alltrim(m_dep_nm)+spac(25-len(alltrim(m_dep_nm)))+'       !                                          !'
	?'!    NAME    : '+upper(alltrim(emp_nm))+spac(32-len(alltrim(emp_nm)))+'                                                     !          *** RECEIPT OF PAY ***          !'
	?'!-------------------------------------------E-A-R-N-I-N-G-S-----------------------------------------!                                          !'
	?'! REGULAR  HRS/PAY:   '+tran(reg_hrs ,m_h)+'    '+tran(reg_pay ,m_a)+'       VL-ENC DAYS/PAY....:   '+tran(lv_hrs,m_h)+'    '+tran(lv_pay+lv2_pay,m_a)+'        !        This is to acknowledge receipt    !'
	?'! REG.  OT HRS/PAY:   '+tran(rot_hrs ,m_h)+'    '+tran(rot_pay ,m_a)+'       SL-ENC DAYS/PAY....:   '+tran(ls_hrs,m_h)+'    '+tran(ls_pay        ,m_a)+'        !   of the amount of  P'+tran(net_pay,m_a)+'          !'
	?'! SPCL.HOL HRS/PAY:   '+tran(sphp_hrs,m_h)+'    '+tran(sphp_pay,m_a)+'       TAXABLE-PAY1.......:             '+tran(oth_pay1,m_a)+'        !   representing salary for the period     !'
	?'! SPCL. OT HRS/PAY:   '+tran(spot_hrs,m_h)+'    '+tran(spot_pay,m_a)+'       TAXABLE-PAY2.......:             '+tran(oth_pay3,m_a)+'        !   '+m_d1+' to '+m_d2+'.                  !'
	?'! LGL.HOL  HRS/PAY:   '+tran(lghp_hrs,m_h)+'    '+tran(lghp_pay,m_a)+'       NON-TAX-PAY1.......:             '+tran(oth_pay2,m_a)+'        !                                          !'
	?'! LGL.H.OT HRS/PAY:   '+tran(lgot_hrs,m_h)+'    '+tran(lgot_pay,m_a)+'       NON-TAX-PAY2.......:             '+tran(oth_pay4,m_a)+'        !     EMP. NO.: '+m_emp_no+'                     !'
	?'! N.SHFT.D.HRS/PAY:                                                  GROSS PAY:   '+tran(grs_pay,m_a)+'        !                                          !'
	?'!------------------------------D-E-D-U-C-T-I-O-N-S-------------------------------LOAN-BALANCES------!                                          !'
	?'! GRS TO DT :'+tran(m_y_gross,m_a2)  +'                   '+'TX TO DATE :'+tran(m_y_tax,m_a2)+'  ! SS-CALBAL: '+tran(m_calbal,m_a1)+' !                                          !'
	?'! TAX...... :'+tran(tax_ee,m_a)    +'  '+m_rt_ln4 +': '+tran(comp_ded,m_a)+'   '+m_rt_ded6+': '+tran(oth_ded6,m_a)+'  ! HOUS.BAL : '+tran(m_houbal,m_a1)+' !                                          !'
	?'! SSS PREM. :'+tran(sss_ee,m_a)    +'  '+m_rt_ln5 +': '+tran(comd_ded,m_a)+'   '+m_rt_ded7+': '+tran(oth_ded7,m_a)+'  ! MULT-PBAL: '+tran(m_mulbal,m_a1)+' !     '+           m_emp_nm                    +'     !'
	?'! MEDICARE. :'+tran(med_ee,m_a)    +'  '+m_rt_ded1+': '+tran(oth_ded1,m_a)+'   '+m_rt_ded8+': '+tran(oth_ded8,m_a)+'  ! SS-SALBAL: '+tran(m_slnbal,m_a1)+' !     --------------------------------     !'
	?'! PGBG PREM :'+tran(pgbg_ee,m_a)   +'  '+m_rt_ded2+': '+tran(oth_ded2,m_a)+'   '+m_rt_ded9+': '+tran(oth_ded9,m_a)+'  ! SAL_LNBAL: '+tran(m_salbal,m_a1)+' !         (Sign Over Printed Name)         !'
	?'! '+m_rt_ln3+':'+tran(hdmf_ded,m_a)+'  '+m_rt_ded3+': '+tran(oth_ded3,m_a)+'   '+m_rt_ded10+': '+tran(oth_ded10,m_a)+'  !                                    !                                          !'
	?'! '+m_rt_ln1+':'+tran(sln_ded,m_a) +'  '+m_rt_ded4+': '+tran(oth_ded4,m_a)+'               ----------  !             ----------  !     --------------------------------     !'
	?'! '+m_rt_ln2+':'+tran(cal_ded,m_a) +'  '+m_rt_ded5+': '+tran(oth_ded5,m_a)+'   TOTAL DED.: '+tran(tot_ded,m_a)+'  !  NET PAY  : '+tran(net_pay,m_a)+'  !                  (Date)                  !'
*/
