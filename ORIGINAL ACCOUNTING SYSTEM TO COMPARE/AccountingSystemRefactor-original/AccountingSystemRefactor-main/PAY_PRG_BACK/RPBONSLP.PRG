* PAYROLL SYSTEM
* Program Name : Bonus Payslip Printing
* Program Code : Rbonslp.prg
* Author : SVC
* Date Started : Dec.06, 1994
* Date Finished: 

para m_which
m_oldcol=setcolor()
set colo to (m_cnor)
do whil .t.
   f_bcln()
	m_spool=.t.
	m_page=0
	m_nextpg=.t.
	m_crow=60
	m_h='999.99'
	m_a='999,999.99'
	f_setting()
	sele 1
	if .not. net_use('&dpath\sys_id',.t.,5)
		exit
	endi
	if .not. fil_lock(5)
		exit
	endi
	m_d1 = dtoc(beg_date)
	m_d2 = dtoc(end_date)	
	*m_wk = str(pres_wk,1)
	m_year=str(year(beg_date),4)
	sele 2
	if .not. net_use('&dpath\master',.t.,5)
		exit
	endi
	set inde to &dpath\mbyemp
	rein
	go top
	sele 3
	if .not. net_use('&dpath\dept',.t.,5)
		exit
	endi
	set inde to &dpath\dbydep
	rein
	sele 4
	if .not. net_use('&dpath\tmcard',.t.,5)
		exit
	endi
	set inde to &dpath\tbyemp
	rein
	sele 2
	if m_which=2 && SELECTED PAY SLIPS
		*ASK USER TO ENTER 2 EMPLOYEE NUMBERS
		m_emp_no1=spac(6)
		m_emp_no2=spac(6)
		m_rppayslp=savescreen(13,4,18,73)
		f_drawbox(13,5,18,73,1,3)
		@15, 8 say 'PRINT PAYSLIP FROM EMP#:'
		@16,24 say 'TO EMP#:'
		do while .t.
			@15,33 get m_emp_no1 pict '999999' vali f_valno(m_emp_no1,15)
			@16,33 get m_emp_no2 pict '999999' vali f_valno(m_emp_no2,16)
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
			do p_bpslip
			?CHR(27)+CHR(18)
			do p_bssum
		case m_which=2 && SELECTED PAY SLIPS
			do p_bpslip
		case m_which=3 && PAY SLIP SUMMARY ONLY
			do p_bssum
		case m_which=4
			do p_bapslip
			do p_bassum
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
if m_which=2
	restscreen(13,4,18,73,m_rppayslp)
	rele m_rppayslp
endi
clos all
set colo to (m_oldcol)
rele all
retu

func f_valno
para _m_emp_no,_m_row
_m_oldarea=sele()
sele master
seek _m_emp_no
if .not. eof()
	@_m_row,39 say emp_nm
	sele (_m_oldarea)
	retu(.t.)
else
	f_err('Employee not in timecard file !',.f.)
	sele (_m_oldarea)
	retu(.f.)
endi

function f_ctr_ttl
para _m_co,_m_spc
_m_co=alltrim(_m_co)
_m_spc1=int((_m_spc-len(_m_co))/2)
_m_spc2=(_m_spc-_m_spc1-len(_m_co))
retu(space(_m_spc1)+_m_co+space(_m_spc2))

proc p_bpslip
m1_company=f_ctr_ttl(m_company,59)
m2_company=f_ctr_ttl(m_company,41)
do whil emp_no<=m_emp_no2 .and. .not. eof()
	m_dep_no=dep_no
	sele dept
	seek m_dep_no
	if .not. eof()
		m_dep_nm=alltrim(dep_nm)+space(25-len(alltrim(dep_nm)))
	else
		m_dep_nm=spac(25)
	endi
	sele master
*	m_spc1=int((32-len(alltrim(emp_nm)))/2)
*	m_emp_nm=spac(m_spc1)+upper(alltrim(emp_nm))+spac(32-m_spc1-len(alltrim(emp_nm)))
   mBON = STR(Y_BONUS,8,2)
   mTAX = STR(Y_BTAX,8,2)
   mCA  = STR(Y_MIDBON,8,2)
   mNET1 =STR(VAL(mBON)-VAL(mTAX),8,2)
   mNET = STR(VAL(mBON)-(VAL(mTAX)+VAL(mCA)),8,2)
	mEMP_NM = ltrim(rtrim(EMP_NM))
	m_lspac=int((32-len(mEMP_NM))/2)
	mEMP_NM1 =mEMP_NM+spac(32-len(mEMP_NM))
	mEMP_NM2 =spac(m_lspac)+mEMP_NM+spac(32-len(mEMP_NM)-m_lspac)
	mEMP_NO=LTRIM(RTRIM(EMP_NO))+SPAC(6-LEN(LTRIM(RTRIM(EMP_NO))))
*	if m_tax_bon>0
		do p_bslip2
*	else
*		do p_bslip1	
*	endif
	skip
endd
return

proc p_bslip2
*     0....,....1....,....2....,....3....,....4....,....5....,....6....,....7....,....8....,
   ? '!'+space(59)+'!'+space(24)+'!'+space(41)+'!'
   ? '!'+m1_company+'!'+space(24)+'!'+m2_company+'!'
   ? '!'+space(59)+'!'+space(24)+'!      13th Month P A Y S L I P           !'
   ? '!  EMP.NO. :  ' + mEMP_NO  + SPACE(40) + '!       M e r r y        !'+space(41)+'!'
   ? '!  NAME    :  ' + mEMP_NM1 + SPACE(14) + '!   C h r i s t m a s    !'+space(41)+'!'
   ? '!  DEPT.NO.: ' + m_dep_no +' - '+m_dep_nm +SPACE(17) + '!' + SPACE(24) + '!        *** RECEIPT OF PAY ***           !'
   ? '!'+space(59)+'!          >O<           !'+space(41)+'!'
   ? '!'+space(59)+'!          ***           !       This is to acknowledge receipt    !'
   ? '!  '+repl('*',54)+'   !         *o*o*          !    of the amount of  P'+mNET+ '          !'
   ? '!'+space(59)+'!        *o*o*o*         !    representing 13th Month Pay for      !'
   ? '!            13th Month Pay  '   + mBON   +   space(22) + ' !       *o*o*o*o*        !    the year '+m_year+'.                       !'
   ? '!            Less : Tax      '   + mTAX   +   space(22) + ' !      *o*o*o*o*o*       !'+space(41)+'!'
   ? '!                          --------------                   !     *o*o*o*o*o*o*      !'+space(41)+'!'
   ? '!                            '   + mNET1+     space(22) + ' !    *o*o*o*o*o*o*o*     !              I.D. #'+mEMP_NO+'               !'
   ? '!            Less : C/A      '   + mCA  +     SPACE(22) + ' !   *o*o*o*o*o*o*o*o*    !'+space(41)+'!'
   ? '!                          --------------                   !          ***           !     '+    mEMP_NM2                +'    !'
   ? '!            NET PAY         '   + mNET +     SPACE(22) + ' !'+space(24)+'!     '+repl('-',32)+'    !'
   ? '!'+space(59)+'!       H a p p y        !         (Sign Over Printed Name)        !'
   ? '!  '+repl('*',54)+'   !   N e w     Y e a r    !'+space(41)+'!'
   ? '!'+space(59)+'!'+space(24)+'!     '+repl('-',32)+'    !'
   ? '!'+space(59)+'!'+space(24)+'!'+space(17)+'(DATE)'+space(18)+'!'
   ? repl('-',128)
return

proc p_bssum
sele master
go top
stor 0 to m_t_grs, m_t_ded, m_t_net
?chr(27)+chr(24)+chr(18)
do whil .not. eof()
	if m_nextpg
		m_page=m_page+1
		if m_page>1.or.m_crow>58
			?chr(12)
		endi
		?m_company
		?'13 T H   M O N T H   P A Y S L I P   S U M M A R Y'
		?'For the Year '+m_year
		?
		?alltrim(m_head)+spac(30-len(alltrim(m_head)))+spac(38)+'Page '+str(m_page,2)
		?repl('=',75)
		?'EMP#   EMPLOYEE NAME                     GROSS PAY   TOTAL-DED.  NET-PAY'
		?repl('=',75)
		m_crow=8
		m_nextpg=.f.
	endi
	m_emp_nm =alltrim(emp_nm)+spac(32-len(alltrim(emp_nm)))
	m_emp_no =alltrim(emp_no)+spac(6-len(alltrim(emp_no)))
	?m_emp_no+' '+m_emp_nm+'  '+tran(y_bonus,m_a)+'  '+tran(y_btax+y_midbon,m_a)+'  '+tran(y_bonus-y_btax-y_midbon,m_a)
	m_t_grs=m_t_grs+y_bonus
	m_t_ded=m_t_ded+y_btax+y_midbon
	m_t_net=m_t_net+y_bonus-y_btax-y_midbon
	skip
	if eof()=.t.
		m_crow=60
	endif	
	m_crow=m_crow+1
	if m_crow>58
		m_nextpg=.t.
	endi
endd
?spac(39)+repl('  ----------',3)
?spac(24)+'GRAND TOTAL :  '+tran(m_t_grs,'9,999,999.99')+tran(m_t_ded,'9,999,999.99')+tran(m_t_net,'9,999,999.99')
?
?repl('=',75)
retu

***
proc p_bapslip
m1_company=f_ctr_ttl(m_company,59)
m2_company=f_ctr_ttl(m_company,41)
select tmcard
go top
do while .not. eof()
	if .not. withbonus
		skip
		loop
	endif
	m_dep_no=dep_no
	sele dept
	seek m_dep_no
	if .not. eof()
		m_dep_nm=alltrim(dep_nm)+space(25-len(alltrim(dep_nm)))
	else
		m_dep_nm=spac(25)
	endi
	select tmcard
   mBON = STR(BONUS,8,2)
   mTAX = STR(BONUSTAX,8,2)
   mNET =STR(BONUS-BONUSTAX,8,2)
	mEMP_NM = ltrim(rtrim(EMP_NM))
	m_lspac=int((32-len(mEMP_NM))/2)
	mEMP_NM1 =mEMP_NM+space(32-len(mEMP_NM))
	mEMP_NM2 =spac(m_lspac)+mEMP_NM+spac(32-len(mEMP_NM)-m_lspac)
	mEMP_NO=LTRIM(RTRIM(EMP_NO))+SPAC(6-LEN(LTRIM(RTRIM(EMP_NO))))
	do p_baslip2
	skip
enddo
return

proc p_baslip2
*     0....,....1....,....2....,....3....,....4....,....5....,....6....,....7....,....8....,
   ? '!'+space(59)+'!'+space(24)+'!'+space(41)+'!'
   ? '!'+m1_company+'!'+space(24)+'!'+m2_company+'!'
   ? '!'+space(59)+'!'+space(24)+'!      13th Month P A Y S L I P           !'
   ? '!  EMP.NO. :  ' + mEMP_NO  + SPACE(40) + '!       M e r r y        !'+space(41)+'!'
   ? '!  NAME    :  ' + mEMP_NM1 + SPACE(14) + '!   C h r i s t m a s    !'+space(41)+'!'
   ? '!  DEPT.NO.: ' + m_dep_no +' - '+m_dep_nm +SPACE(17) + '!' + SPACE(24) + '!        *** RECEIPT OF PAY ***           !'
   ? '!'+space(59)+'!          >O<           !'+space(41)+'!'
   ? '!'+space(59)+'!          ***           !       This is to acknowledge receipt    !'
   ? '!  '+repl('*',54)+'   !         *o*o*          !    of the amount of  P'+mNET+ '          !'
   ? '!'+space(59)+'!        *o*o*o*         !    representing 13th Month Pay for      !'
   ? '!            13th Month Pay  '   + mBON   +   space(22) + ' !       *o*o*o*o*        !    the year '+m_year+'.                       !'
   ? '!            Less : Tax      '   + mTAX   +   space(22) + ' !      *o*o*o*o*o*       !'+space(41)+'!'
   ? '!                          --------------                   !     *o*o*o*o*o*o*      !'+space(41)+'!'
   ? '!            NET PAY         '   + mNET +     space(22) + ' !    *o*o*o*o*o*o*o*     !              I.D. #'+mEMP_NO+'               !'
   ? '!                                                           !   *o*o*o*o*o*o*o*o*    !'+space(41)+'!'
   ? '!                                                           !          ***           !     '+    mEMP_NM2                +'    !'
   ? '!                                                           !'+space(24)+'!     '+repl('-',32)+'    !'
   ? '!'+space(59)+'!       H a p p y        !         (Sign Over Printed Name)        !'
   ? '!  '+repl('*',54)+'   !   N e w     Y e a r    !'+space(41)+'!'
   ? '!'+space(59)+'!'+space(24)+'!     '+repl('-',32)+'    !'
   ? '!'+space(59)+'!'+space(24)+'!'+space(17)+'(DATE)'+space(18)+'!'
   ? repl('-',128)
return

proc p_bassum
sele tmcard
go top
stor 0 to m_t_grs, m_t_ded, m_t_net
?chr(27)+chr(24)+chr(18)
do whil .not. eof()
	if m_nextpg
		m_page=m_page+1
		if m_page>1.or.m_crow>58
			?chr(12)
		endi
		?m_company
		?'ADVANCE 13 T H   M O N T H   P A Y S L I P   S U M M A R Y'
		?'For the Year '+m_year
		?
		?alltrim(m_head)+spac(30-len(alltrim(m_head)))+spac(38)+'Page '+str(m_page,2)
		?repl('=',75)
		?'EMP#   EMPLOYEE NAME                     GROSS PAY   TAX DED.    NET-PAY'
		?repl('=',75)
		m_crow=8
		m_nextpg=.f.
	endif
	if .not. withbonus
		skip
		loop
	endif
	m_emp_nm =alltrim(emp_nm)+spac(32-len(alltrim(emp_nm)))
	m_emp_no =alltrim(emp_no)+spac(6-len(alltrim(emp_no)))
	?m_emp_no+' '+m_emp_nm+'  '+tran(bonus,m_a)+'  '+tran(bonustax,m_a)+'  '+tran(bonus-bonustax,m_a)
	m_t_grs=m_t_grs+bonus
	m_t_ded=m_t_ded+bonustax
	m_t_net=m_t_net+bonus-bonustax
	skip
	if eof()=.t.
		m_crow=60
	endif	
	m_crow=m_crow+1
	if m_crow>58
		m_nextpg=.t.
	endif
enddo
?spac(39)+repl('  ----------',3)
?spac(24)+'GRAND TOTAL :  '+tran(m_t_grs,'9,999,999.99')+tran(m_t_ded,'9,999,999.99')+tran(m_t_net,'9,999,999.99')
?
?repl('=',75)
return
