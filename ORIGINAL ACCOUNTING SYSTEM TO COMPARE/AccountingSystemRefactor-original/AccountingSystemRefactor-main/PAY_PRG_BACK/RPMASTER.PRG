* PAYROLL SYSTEM
* Program Name : Employee Master File Report Generation
* Program Code : Rpmaster.prg
* Author : SVC
* Date Started : May 24, 1994
* Date Finished: May 24, 1994
*******************************************************

para m_which
m_oldcol=setcolor()
setcolor(m_cnor)

while .t.
   m_asof := date()
   f_bcln()

   setcolor(m_cmes)

   do case
		case m_which=1
			@24,16 say 'Employee Master List as of :' get m_asof vali dtoc(m_asof)#'  /  /  '
		case m_which=2
			@24,16 say 'Employee Personal Information as of :' get m_asof vali dtoc(m_asof)#'  /  /  '
		case m_which=3
			@24,21 say 'Employee Basic Rate as of :' get m_asof vali dtoc(m_asof)#'  /  /  '
		case m_which=4
			@24,20 say 'Employee Loan Balance as of :' get m_asof vali dtoc(m_asof)#'  /  /  '
		case m_which=5
			@24,20 say 'Employee VL/SL Balance as of :' get m_asof vali dtoc(m_asof)#'  /  /  '
	endcase

   read

   if f_esc()
      exit
   endif

	m_spool := m_nextpg:= .t.
	m_page  := m_crow  := 0

	m_s2 := spac(2)
	m_s3 := space(3)
	m_s4 := space(4)
	m_s5 := space(5)
	m_s6 := space(6)
	m_s7 := space(7)

	f_setting()

	do case

		case m_which=1
			do rpmasper

		case m_which=2
			do rpmasper

		case m_which=3
			do rpmasrat

		case m_which=4
			do rpmaslon

		case m_which=5
			do rpmaslvs
	endcase

	if m_spool
	   set alternate off
   	set alternate to

	else
	   set print off
   	set device to screen
	endif

	set console on
	exit

end while
dbcloseall()
setcolor(m_oldcol)
return


* Program Name : Rpmasper
* Program Description : Print Employee Personal Information
proc Rpmasper
while .t.

	if m_which = 1

		m_soldc := setcolor()

		f_bcln()
		setcolor(m_cmes)

		tone(800,1)
		@24,4 say 'EMPLOYEE STATUS:'
		@24,21 prompt 'RGLR'
		@24,26 prompt 'CASL'
		@24,31 prompt 'CONF'
		@24,36 prompt 'EXEC'
		@24,41 prompt 'ALL'
		menu to m_selstat

		if f_esc()
			exit
		endif

		f_bcln()
		@24, 4 say 'SCOPE:'
		@24,11 prompt 'ALL'
		@24,15 prompt 'NEW'
		@24,19 prompt 'RESIGNED'
		@24,28 prompt 'RANGE'
		menu to m_scope
		if f_esc()
			exit
		endif

		do case
			case m_selstat=1
				m_stat:='R'
				m_head:='REGULAR EMPLOYEES'
			case m_selstat=1
				m_stat:='C'
				m_head:='CASUAL EMPLOYEES'
			case m_selstat=1
				m_stat:='F'
				m_head:='CONFIDENTIAL EMPLOYEES'
			case m_selstat=1
				m_stat:='E'
				m_head:='EXECUTIVE EMPLOYEES'
			otherwise
				m_stat:='RCFE'
				m_head:='ALL EMPLOYEES'
		endcase

		do case
			case m_scope=2
				m_head := m_head+' - NEW EMPLOYEES'
			case m_scope=3
				m_head := m_head+' - RESIGNED EMPLOYEES'
			case m_scope=4
				m_fr_emp := m_to_emp := space(6)
				@24,53 say 'FROM:         TO:       '
				@24,59 get m_fr_emp pict '999999'
				@24,71 get m_to_emp pict '999999'
				read
				if f_esc()
					exit
				endif
		endcase
		setcolor(m_soldc)

	endif

	select 1
	if ! net_use('&dpath\history',.t.,5)
		exit
	endif
   set index to &dpath\hbyemp
	if ! fil_lock(5)
		exit
	endif

	select 2
	if ! net_use('&dpath\dept',.t.,5)
		exit
	endif
	set index to &dpath\dbydep
	reindex

	select 3
	if ! net_use('&dpath\master',.t.,5)
		exit
	endif

	select 4
	if ! net_use('&dpath\sys_id',.t.,5)
		exit
	endif
	m_beg_date := beg_date
	use

	select master
	set relation to emp_no into history, to dep_no into dept
	if f_choose('Arranged by:','EMP.NUMBER','EMP.NAME')
   	set index to &dpath\mbyemp
	else
		set index to &dpath\mbynm
	endif
	if f_esc()
		exit
	endif
	reindex

   if ! f_askspool()
		m_spool := .f.
		if f_esc()
			exit
		endif
		set print on
		set device to print
		set console off
   endif

	if f_esc()
		exit
	endif

	if m_which = 1
		m_crow := 60

		while ! eof()

			if m_crow>58.and.m_nextpg

				m_page ++

				if m_page>1
					?repl('=',162)
					?chr(12)
				endif

				?m_company
				?'E M P L O Y E E   M A S T E R   L I S T'
				?'as of '+dtoc(m_asof)
				?m_head
				?spac(155)+'Page'+str(m_page,3)
				?repl('=',162)
            ?'EMP#   EMPLOYEE NAME                       DEP#  '
            ??'ADDRESS                                       STAT  PAG-IBIG '
            ??'NO.   SSS NO.       T.I.N.       DT.HIRED    SALARY'
				?repl('=',162)
				m_crow   := 9
				m_nextpg := .f.
			endif

			if master->emp_stat$m_stat

				m_print:=.f.

				do case
					case m_scope=1
						m_print:=.t.
					case m_scope=2.and.history->date_emp>m_beg_date
						m_print:=.t.
					case m_scope=3.and.master->emp_type='R'
						m_print:=.t.
					case m_scope=4.and.(emp_no>=m_fr_emp.and.emp_no<=m_to_emp)
						m_print:=.t.
				endcase

				if master->dep_no='05'
					skip
					loop
				endif

				if m_print
					?f_p_emp_no(emp_no)+emp_nm+m_s4+dep_no+'-'+SUBS(dept->dep_nm,1,1);
						+m_s2+SUBS(history->address,1,43)+m_s2+m_s2+subs(master->status,1,5);
						+m_s2+master->pgbg_no+m_s2+master->sss+m_s2+master->tan;
						+m_s2+dtoc(history->date_emp)+tran(master->b_rate,' 999,999.99')
					m_crow ++
				endif

			endif

			m_print := .t.

			skip

			if m_crow+3>58
				m_nextpg=.t.
			endif

		end while

		?repl('=',162)

	else

		while ! eof()

			if m_nextpg
				m_page++
				if m_page>1
					?chr(12)
				endif
				?m_company
				?'E M P L O Y E E   P E R S O N A L   I N F O R M A T I O N   L I S T'
				?'as of '+dtoc(m_asof)
				?m_head
				?spac(240)+'Page '+str(m_page,3)
				?repl('=',248)
				*                                                                       T.I.N.        BIRTHDAY    STATUS           NAME OF SPOUSE                  EDUCATIONAL ATTAINMENT                  TEL.NO.     MEDICAL HISTORY'
				*EMP#   EMPLOYEE NAME                     DEPARTMENT                    SSS NO.       DATE HIRED  RELIGION         POSITION                        ADDRESS'
				*9999   12345678901234567890123456789012  12-1234567890123456789012345  123-123-123   12/12/12    HF0              123456789012345678901234567890  12345678901234567890                    1234567890  12345678901234567890123456789012345678901234567890
				*                                                                       99-9999999-9  12/12/12    123456789012345  123456789012345678901234567890  12345678901234567890123456789012345678901234567890  12345678901234567890123456789012345678901234567890
				*?spac(71)+'T.I.N.        BIRTHDAY    STATUS           NAME OF SPOUSE                  EDUCATIONAL ATTAINMENT                  TEL.NO.     MEDICAL HISTORY'
				*?'EMP#   EMPLOYEE NAME                     DEPARTMENT                    SSS NO.       DATE HIRED  RELIGION         POSITION                        ADDRESS'
				?'                                        DEPARTMENT                   SALARY     PAG-IBIG NO.   SSS NO.       BIRTHDAY    TEL.NO.          NAME OF SPOUSE                  EDUC. ATTAINMENT      MEDICAL HISTORY'
				?'EMP#   EMPLOYEE NAME                    POSITION                     TAX STAT.  ACCT.NO.       TIN NO.       DATE HIRED  RELIGION         ADDRESS'
				?
				?repl('=',248)
				m_crowv := 9
				m_nextpg=.f.
			endif
			?f_p_emp_no(emp_no)+m_s3+emp_nm+m_s2+dep_no+'-'+dept->dep_nm+m_s2;
			   +tran(master->b_rate,'999999.99')+m_s2+master->pgbg_no+m_s2;
			   +master->sss+m_s2+dtoc(history->birthd)+m_s4+history->tel_no;
			   +m_s7+history->spouse+m_s2+history->educ+m_s2+history->med1
			?space(40)+history->position+m_s5+master->status+m_s2+master->acct_no+m_s3;
			   +master->tan+m_s3+dtoc(history->date_emp)+m_s4+history->relig+m_s2+history->address+m_s4;
			   +history->med2

			skip
			m_crow += 2

			if m_crow>58
				m_nextpg=.t.
			endif

		end while

		?repl('=',248)
	endif

	?chr(12)

	exit
end while
return

* Program Name : Rpmasrat
* Program Description : Print Employee Rate
proc Rpmasrat
while .t.
	select 1
	if ! net_use('&dpath\history',.t.,5)
		exit
	endif
	set index to &dpath\hbyemp
	if ! fil_lock(5)
		exit
	endif
	reindex

	select 2
	if ! net_use('&dpath\dept',.t.,5)
		exit
	endif
	set inde to &dpath\dbydep
	reindex

	select 3
	if ! net_use('&dpath\master',.t.,5)
		exit
	endif

	if f_choose('Arranged by:','EMP.NUMBER','EMP.NAME')
		set inde to &dpath\mbyemp
	else
		set index to &dpath\mbynm
	endif
	if f_esc()
		exit
	endif
	reindex
	set rela to emp_no into history

   if ! f_askspool()
		m_spool := .f.
		if f_esc()
			exit
		endif
		set print on
		set device to print
		set console off
   endif

	m_tot_rate := 0

	dbgotop()

	whil ! eof()

		if m_nextpg

			m_page ++

			if m_page>1
				?chr(12)
			endif

			?m_company
			?'E M P L O Y E E   S A L A R Y   R A T E S'
			?'as of '+dtoc(m_asof)
			?m_head
			?spac(149)+'Page '+str(m_page,3)
			?repl('=',157)
			*EMP#   N A M E                          TAX STAT.  POSITION                         HIRED     TRANSF.     SALARY
			*1234   12345678901234567890123456789012    123     123456789012345678901234567890  12/12/12  12/12/12  99,999.99
			?'EMP#   N A M E                          TAX STAT.  T.I.N.        SSS            PAG-IBIG        POSITION                         HIRED     TRANSF.     SALARY'
			* 1234   12345678901234567890123456789012    123     123-678-012   567890123456   1234567890123   123456789012345678901234567890  12/12/12  12/12/12  99,999.99
			?repl('=',157)
			m_crow := 8
			m_nextpg := .f.

		endif

		?f_p_emp_no(emp_no)+emp_nm+spac(4)+alltrim(status);
			+space(3-len(alltrim(status)))+spac(5);
			+tan+spac(3)+sss+spac(3)+pgbg_no+space(3);
			+history->position+m_s2+dtoc(history->date_emp)+m_s2;
			+dtoc(history->date_sep)+tran(b_rate,'9,999,999.99')

		m_tot_rate += b_rate

		skip

		m_crow ++

		if m_crow>58
			m_nextpg := .t.
		endif

	end while

	?
	?spac(126)+'TOTAL BASIC RATE : '+tran(m_tot_rate,'9,999,999.99')
	?repl('=',157)
	?

	exit

end while
return

* Program Name : Rpmaslon
* Program Description : Print Employee Loan balances

proc Rpmaslon
while .t.
	select 1
	if ! net_use('&dpath\master',.t.,5)
		exit
	endif
	set index to &dpath\mbyemp
   if ! f_askspool()
		m_spool := .f.
		if f_esc()
			exit
		endif
		set print on
		set device to print
		set console off
   endif

	m_tot_sln := m_tot_sbl := m_tot_hln := m_tot_hbl := m_tot_scln := ;
		m_tot_scbl := m_tot_cln := m_tot_cbl := m_tot_cmln := m_tot_cmbl := 0

	whil ! eof()

		if m_nextpg

			m_page ++

			if m_page>1
				?chr(12)
			endif

			?m_company
			?'E M P L O Y E E   L O A N   B A L A N C E S'
			?'as of '+dtoc(m_asof)
			?m_head
			?spac(172)+'Page '+str(m_page,3)
			?repl('=',181)
			?spac(48)+'---- SSS SALARY LOAN ----  --- SSS CALAMITY LOAN ---  ----- PAG-IBIG LOAN -----  ----- COMPANY LOAN ------  ---- COMMODITY LOAN -----'
			?'EMP#   NAME                             DEPT#      AMOUNT      BALANCE        AMOUNT      BALANCE        AMOUNT      BALANCE        AMOUNT      BALANCE        AMOUNT      BALANCE'
			 *1234   12345678901234567890123456789012  12    9,999,999.99 9,999,999.99  9,999,999.99 9,999,999.99  9,999,999.99 9,999,999.99  9,999,999.99 9,999,999.99  9,999,999.99 9,999,999.99
			?repl('=',181)
			m_crow=9
			m_nextpg=.f.
		endif
		if sln_bal+hln_bal+ss_cal_bal+co_ln_bal+com_ln_bal>0
			?f_p_emp_no(emp_no)+emp_nm+m_s2+dep_no+spac(5)+tran(sln_amt,'9,999,999.99');
				+' '+tran(sln_bal,'9,999,999.99')+m_s2+tran(ss_cal_ln,'9,999,999.99');
				+' '+tran(ss_cal_bal,'9,999,999.99')+m_s2+tran(hln_amt,'9,999,999.99');
				+' '+tran(hln_bal,'9,999,999.99')+m_s2+tran(co_ln,'9,999,999.99');
				+' '+tran(co_ln_bal,'9,999,999.99')+m_s2+tran(com_ln,'9,999,999.99');
				+' '+tran(com_ln_bal,'9,999,999.99')
			m_tot_sln=m_tot_sln+sln_amt
			m_tot_sbl=m_tot_sbl+sln_bal
			m_tot_scln=m_tot_scln+ss_cal_ln
			m_tot_scbl=m_tot_scbl+ss_cal_bal
			m_tot_hln=m_tot_hln+hln_amt
			m_tot_hbl=m_tot_hbl+hln_bal
			m_tot_cln=m_tot_cln+co_ln
			m_tot_cbl=m_tot_cbl+co_ln_bal
			m_tot_cmln=m_tot_cmln+com_ln
			m_tot_cmbl=m_tot_cmbl+com_ln_bal
			m_crow=m_crow+1
		endif
		skip
		if m_crow>58
			m_nextpg=.t.
		endif
	endd
	?
	?spac(39)+'TOTAL :';
		+tran(m_tot_sln, '999,999,999.99')+tran(m_tot_sbl, '99,999,999.99');
		+tran(m_tot_scln,'999,999,999.99')+tran(m_tot_scbl,'99,999,999.99');
		+tran(m_tot_hln, '999,999,999.99')+tran(m_tot_hbl, '99,999,999.99');
		+tran(m_tot_cln, '999,999,999.99')+tran(m_tot_cbl, '99,999,999.99');
		+tran(m_tot_cmln,'999,999,999.99')+tran(m_tot_cmbl,'99,999,999.99')
	?repl('=',181)
	?
	exit
enddo
return


/*
Program Name : Rpmaslvs
Program Description : Print Employee VL/SL Balance
*/

proc rpmaslvs
while .t.

	select 3
	if ! net_use('&dpath\master',.t.,5)
		exit
	endif
	if f_choose('Arranged by:','By EMPLOYEE #','By EMPLOYEE NAME')
		set index to &dpath\mbyemp
	else
		set index to &dpath\mbynm
	endif

	if f_esc()
		exit
	endif

	reindex

   if ! f_askspool()
		m_spool := .f.
		if f_esc()
			exit
		endif
		set print on
		set device to print
		set console off
   endif

	m_t_vl := m_t_vl_u := 0
	m_t_sl := m_t_sl_u := 0

	dbgotop()

	while ! eof()

		if m_nextpg

			m_page ++

			if m_page > 1
				?chr(12)
			endif

			?m_company
			?'E M P L O Y E E   V L / S L   B A L A N C E'
			?'as of '+dtoc(m_asof)
			?m_head
			?spac(90)+'Page '+str(m_page,3)
			?replicate('=',98)
			?'EMP#   EMPLOYEE NAME                       V.LEAVE  VL-USED  VL-BAL.     S.LEAVE  SL-USED  SL-BAL.'
			* 1234   12345678901234567890123456789012    1234567  1234567  1234567     1234567  1234567  1234567
			?replicate('=',98)
			m_crow   := 8
			m_nextpg := .f.
		endif

		if emp_stat!='C' .and. emp_type='A'
			?f_p_emp_no(emp_no)+emp_nm+space(3)+tran(vac_lv,'999.9999 ')+tran(vac_used,'999.9999  ')+tran(vac_lv-vac_used,'999.9999   ')+tran(sik_lv,'999.9999 ')+tran(sik_used,'999.9999 ')+tran(sik_lv-sik_used,'999.9999')
			m_t_vl   += vac_lv
			m_t_vl_u += vac_used
			m_t_sl   += sik_lv
			m_t_sl_u += sik_used
			m_crow ++
			if m_crow>58
				m_nextpg := .t.
			endif
		endif

		skip

	end while
	?
	?space(27)+'GRAND TOTAL: '+tran(m_t_vl,'99999.9999')+tran(m_t_vl_u,'9999.9999')+tran(m_t_vl-m_t_vl_u,'99999.9999')+tran(m_t_sl,'999999.9999')+tran(m_t_sl_u,'9999.9999')+tran(m_t_sl-m_t_sl_u,'9999.9999')
	?replicate('=',98)
	?
	exit
end while
return

