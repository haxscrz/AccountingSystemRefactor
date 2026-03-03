* Program Name : Payroll Timecard Initialization
* Program Code : Mastrate.prg
* Description  : This program allows user to adjust the basic rates
*              : of employees according to specified conditions
* Author       : SVC
* Date Started : June 23, 1994
* Date Finished: June 23, 1994
***************************************************

m_old_col=setcolor()
do whil .t.
	m_prevscrn=savescreen(8,5,16,73)
	f_setting()
	sele 1
	if .not. net_use('&dpath\master',.t.,5)
		exit
	endi
	if .not. fil_lock(5)
		exit
	endi
	sele 2
	if .not. net_use('&dpath\dept',.t.,5)
		exit
	endi
	set inde to &dpath\dbydep
	if .not. fil_lock(5)
		exit
	endi
	f_bcln()
	f_drawbox(8,6,15,73,1,3)
	set colo to (m_cnor)
	@ 9,9 say 'ADJ.THE SALARY RATE OF EMPLOYEES WITH THE FOLLOWING CONDITIONS'
	@10,7 to 10,72
	@11,9 say 'DEPARTMENT.. :'
	@12,9 say 'UNION....... :'
	@13,9 say 'SALARY RANGE :'
	@14,9 say 'INC/DEC AMNT :'
	m_fr_dept='  '
	m_to_dept='  '
	m_fr_salary=0
	m_to_salary=0
	m_amount=0
	do whil .t.
		@11,24 prom 'ALL'
		@11,29 prom 'SPECIFIC'
		menu to m_w_dept
		do case
			case m_w_dept=0
				exit
			case m_w_dept=1
				@11,40 say spac(15)
				m_fr_dept='00'
				m_to_dept='99'
			case m_w_dept=2
				@11,40 say 'FROM :    TO   '
				@11,47 get m_fr_dept pict '99' vali f_valdept(m_fr_dept)
				@11,53 get m_to_dept pict '99' vali f_valdept(m_to_dept)
				read
				if lastkey()=27
					exit
				endi
		endc

		@12,24 prom 'ALL'
		@12,29 prom 'MEMBER ONLY'
		@12,42 prom 'NON-MEMBER ONLY'
		menu to m_w_union
		if m_w_union=0
			exit
		endi
		
		@13,24 prom 'ALL'
		@13,29 prom 'SPECIFIC'
		menu to m_w_salary
		do case
			case m_w_salary=0
				exit
			case m_w_salary=1
				@11,40 say spac(31)
				m_fr_salary=0
				m_to_salary=999999.99
			case m_w_salary=2
				@13,40 say 'FROM :            TO           '
				@13,47 get m_fr_salary pict '999,999.99' vali m_fr_salary>=0
				@13,61 get m_to_salary pict '999,999.99' vali m_to_salary>=m_fr_salary
				read
				if lastkey()=27
					exit
				endi
		endc

		@14,24 get m_amount pict '999,999.99'
		read
		if lastkey()=27
			exit
		endi
		if f_ask('Conditions and figures correct ?')
			exit
		endi
		@11,24 clea to 14,70
		if m_w_dept=1
			m_fr_dept='  '
			m_to_dept='  '
		endi
		if m_w_salary=1
			m_fr_salary=0
			m_to_salary=0
		endi
	endd
	if lastkey()=27
		exit
	endi
	do whil .t.
		f_mess("Press 'B' to begin salary adjustment, 'Esc' to Abort.",.f.)
		m_inkey=inkey(0)
		if chr(m_inkey)$'Bb' .or. lastkey()=27
			exit
		endi
	endd
	if lastkey()=27
		exit
	endi
	sele master
	go top
	do whil .not. eof()	
		if (dep_no>=m_fr_dept.and.dep_no<=m_to_dept).and.(b_rate>=m_fr_salary.and.b_rate<=m_to_salary)
			do case
				case m_w_union=1 && All employees
					if b_rate+m_amount>0
						repl b_rate with b_rate+m_amount
					else
						repl b_rate with 0
					endi
				case m_w_union=2 && Union members only
					if union
						if b_rate+m_amount>0
							repl b_rate with b_rate+m_amount
						else
							repl b_rate with 0
						endi
					endi
				case m_w_union=3 && Non-union members
					if .not. union
						if b_rate+m_amount>0
							repl b_rate with b_rate+m_amount
						else
							repl b_rate with 0
						endi
					endi
			endc
		endi
		skip
	endd
	f_mess('Adjustment Completed...',.f.)
	inke(3)
	exit
endd
if lastkey()=27
	f_mess('Adjustment Aborted...',.f.)
	inke(3)
endi
restscreen(8,5,16,73,m_prevscrn)
clos all
set colo to (m_old_col)
retu

func f_valdept
para _m_dept_no
m_oldarea=select()
sele dept
seek _m_dept_no
if .not. eof()
	retu(.t.)
else
	f_err('Invalid Department Number !',.f.)
	retu(.f.)
endi

text
BY DEPARTMENT FROM 99 TO 99 (INCLUSIVE)
UNION MEMBER? Y/N/ALL
SALARY RANGE  FROM 99,999.99 TO 99,999.99
     6  9              24   29         40     47    53   58 61          73
8    --------------------------------------------------------------------
9    |  ADJ.THE SALARY RATE OF EMPLOYEES WITH THE FOLLOWING CONDITIONS  |
0    --------------------------------------------------------------------
1    |  DEPARTMENT.. : ALL  SPECIFIC   FROM : 99 TO 99                  |
2    |  UNION....... : ALL  MEMBER ONLY  NON-MEMBER ONLY                |
3    |  SALARY RANGE : ALL  SPECIFIC   FROM : 999,999.99 TO 999,999.99  |
4    |  INC/DEC AMNT : 999,999.99                                       |
5    --------------------------------------------------------------------
11,24,14,70
savescreen(8,5,16,73)
endt