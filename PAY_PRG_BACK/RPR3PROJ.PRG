* PAYROLL SYSTEM
* Program Name : Quarterly REports Generation
* Program Code : Rppayqtr.prg
* Author       : SVC
* Date Started : June 21, 1994
* Date Finished: June 23, 1994
******************************************************

para m_qtrrep
m_oldcol=setcolor()
m_qtrscrn=savescreen(9,21,15,56)
set colo to (m_cnor)
do whil .t.
   f_bcln()
	m_spool=.t.
	m_page=0
	m_crow=60
	m_fig='99,999,999.99'
	f_setting()
   m_curmonth := .t.

	if f_choose('Select:','CURENT MONTH','PREV MONTH')
      m_curmonth := .t.
	else
      m_curmonth := .f.
	endif

	if lastkey()=27
		exit
	endif

   if m_curmonth
   	sele 1
   	if .not. net_use('&dpath\sys_id',.t.,5)
   		exit
   	endi
   	if .not. fil_lock(5)
   		exit
   	endi
   	sele 2
   	if .not. net_use('&dpath\master',.t.,5)
   		exit
   	endi
   	set inde to &dpath\mbynm
   	rein
   	go top
   	sele 3
   	if .not. net_use('&dpath\history',.t.,5)
   		exit
   	endi
   	set inde to &dpath\hbyemp
   	rein

   else


   	f_drawbox(9,22,14,56,1,3)
	   set colo to (m_cnor)


      @ 10, 25 say "ENTER THE BACKUP PERIOD "
      @ 12, 25 say "MONTH   :"
      @ 13, 25 say "YEAR    :"

      m_month = month(date()) -1

      if month(date()) = 1
         m_year = year(date()) - 1
      else
         m_year = year(date())
      endif

      @ 12, 36 get m_month pict '99' valid m_month>0 .and. m_month <13
      @ 13, 36 get m_year picture "9999"
      read

   	if lastkey()=27
	   	exit
   	endif

   	m_pres_mo=subs(str(100+m_month,3),2,2)
	   m_year=subs(str(m_year,4),3,2)

   	m_period=m_year+m_pres_mo+"02"

	   fname_mas='MA'+m_period+'.dbf'
	   fname_his='HI'+m_period+'.dbf'
	   fname_tim='TM'+m_period+'.dbf'
	   fname_sys='SY'+m_period+'.dbf'

   	sele 1
   	use &bpath\&fname_sys alias sys_id

   	sele 2
   	use &bpath\&fname_mas alias master
   	index on emp_nm to &bpath\mbynm
   	rein
   	go top

   	sele 3
   	use &bpath\&fname_his alias history
   	index on emp_no to &bpath\hbyemp
   	rein

   endif


   sele sys_id
   m_pres_mo=str(month(ctod(subs(str(100+pres_mo,3),2,2)+'/01/'+subs(str(year(end_date),4),3,2))),2)
   do case
   	case m_pres_mo$' 1~ 2~ 3'
   		m_quarter=1
   	case m_pres_mo$' 4~ 5~ 6'
   		m_quarter=2
   	case m_pres_mo$' 7~ 8~ 9'
   		m_quarter=3
   	case m_pres_mo$'10~11~12'
   		m_quarter=4
   endc
   m_month= pres_mo
   m_year=str(year(beg_date),4)

   if m_curmonth

   	*Confirm Quarter and Year
   	f_drawbox(9,22,14,56,1,3)
   	set colo to (m_cnor)

      @ 10, 25 say "ENTER THE APPLICABLE PERIOD "
      @ 12, 25 say "MONTH   :"
      @ 13, 25 say "YEAR    :"

      @ 12, 36 get m_month pict '99' valid m_month>0 .and. m_month <13
      @ 13, 36 get m_year picture "9999" valid m_year>=str(year(beg_date-1),4)
      read

	   if lastkey()=27
   		exit
   	endi

   endif

   m_mon  = substr(str(100+m_month,3),2,2)

	m_sfname='NR3001DK'

   if .not. f_xaskspool()
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

	m_ss1=0
	m_ss2=0
	m_ss3=0
	m_med1=0
	m_med2=0
	m_med3=0
	m_ec1=0
	m_ec2=0
	m_ec3=0
	m_ncompany=subs(alltrim(m_company)+spac(30-len(alltrim(m_company))),1,30)
	m_id=alltrim((strtran(m_comp_sss,'-','',1)))
	m_id=m_id+spac(10-len(m_id))
	m_newhire=ctod(subs(str(100+(m_quarter*3-2),3),2,2)+'/01/'+m_year)
	sele 2
	set rela to emp_no into history
	go top

	?'00'+m_ncompany+m_mon+m_year+m_id+spac(30)

	do whil .not. eof()

      if m_month=1 .or. m_month=4 .or. m_month=7 .or. m_month=10
   		if ss_ee1+med_ee1+ec_er1=0
	   		skip
		   	loop
   		endif
      elseif m_month=2 .or. m_month=5 .or. m_month=8 .or. m_month=11
   		if ss_ee2+med_ee2+ec_er2=0
	   		skip
		   	loop
   		endif
      else
   		if ss_ee3+med_ee3+ec_er3=0
	   		skip
		   	loop
   		endif
      endif

		//m_d_emp=dtoc(history->date_emp)
		if left(dtoc(history->date_emp),3) = "  /"
         m_d_emp = space(10)
      else
   		m_d_emp = subs(dtoc(history->date_emp),1,2) + "/" + subs(dtoc(history->date_emp),4,2) + "/" + str(year(history->date_emp),4)
      endif

		do case
			case emp_type$'Rr'
				m_remarks='2'
			case m_d_emp#'  /  /  '.and.ctod(m_d_emp)>m_newhire
				m_remarks='1'
			othe
				m_remarks='N'
		endc

      m_emp_nm:=strtran(emp_nm,"¤","N")
      m_emp_nm:=strtran(m_emp_nm,"¥","N")
      m_emp_nm:=strtran(m_emp_nm,"-"," ")
      m_emp_nm:=strtran(m_emp_nm,"."," ")
      m_emp_nm:=strtran(m_emp_nm,","," ")

		?'20'+subs(m_emp_nm,1,31)+subs(sss,1,2)+subs(sss,4,7)+subs(sss,12,1)

      if m_month=1 .or. m_month=4 .or. m_month=7 .or. m_month=10
   		??tran(ss_ee1+ss_er1,'99999.99')+tran(0,            '99999.99')+tran(0,            '99999.99')
      elseif m_month=2 .or. m_month=5 .or. m_month=8 .or. m_month=11
   		??tran(0,            '99999.99')+tran(ss_ee2+ss_er2,'99999.99')+tran(0,            '99999.99')
      else
   		??tran(0,            '99999.99')+tran(0,            '99999.99')+tran(ss_ee3+ss_er3,'99999.99')
      endif

      if m_month=1 .or. m_month=4 .or. m_month=7 .or. m_month=10
	   	//??tran(med_ee1+med_er1,'999.99')+tran(0,'999.99')+tran(0,'999.99')
	   	??tran(0,'999.99')+tran(0,'999.99')+tran(0,'999.99')
      elseif m_month=2 .or. m_month=5 .or. m_month=8 .or. m_month=11
   		//??tran(0,'999.99')+tran(med_ee2+med_er2,'999.99')+tran(0,'999.99')
   		??tran(0,'999.99')+tran(0,'999.99')+tran(0,'999.99')
      else
   		//??tran(0,'999.99')+tran(0,'999.99')+tran(med_ee3+med_er3,'999.99')
   		??tran(0,'999.99')+tran(0,'999.99')+tran(0,'999.99')
      endif

      if m_month=1 .or. m_month=4 .or. m_month=7 .or. m_month=10
   		??tran(ec_er1,'999.99')+tran(0,     '999.99')+tran(0,     '999.99')
      elseif m_month=2 .or. m_month=5 .or. m_month=8 .or. m_month=11
		   ??tran(0,     '999.99')+tran(ec_er2,'999.99')+tran(0,     '999.99')
      else
   		??tran(0,     '999.99')+tran(0,     '999.99')+tran(ec_er3,'999.99')
      endif

      ??space(6)

		??m_remarks

   	??subs(m_d_emp,1,2)+subs(m_d_emp,4,2)+subs(m_d_emp,7,4)

		m_ss1=m_ss1+ss_ee1+ss_er1
		m_ss2=m_ss2+ss_ee2+ss_er2
		m_ss3=m_ss3+ss_ee3+ss_er3
      /*
		m_med1=m_med1+med_ee1+med_er1
		m_med2=m_med2+med_ee2+med_er2
		m_med3=m_med3+med_ee3+med_er3
      */
		m_ec1=m_ec1+ec_er1
		m_ec2=m_ec2+ec_er2
		m_ec3=m_ec3+ec_er3

		skip

	endd

	?'99 '

   if m_month=1 .or. m_month=4 .or. m_month=7 .or. m_month=10
	   ??tran(m_ss1,'99999999.99')+' '+tran(0,    '99999999.99')+' '+tran(0,    '99999999.99')
   elseif m_month=2 .or. m_month=5 .or. m_month=8 .or. m_month=11
   	??tran(0,    '99999999.99')+' '+tran(m_ss2,'99999999.99')+' '+tran(0,    '99999999.99')
   else
   	??tran(0,    '99999999.99')+' '+tran(0,    '99999999.99')+' '+tran(m_ss3,'99999999.99')
   endif

   ??' '

   if m_month=1 .or. m_month=4 .or. m_month=7 .or. m_month=10
   	??tran(0,'999999.99')+' '+tran(0,'999999.99')+' '+tran(0,'999999.99')
   elseif m_month=2 .or. m_month=5 .or. m_month=8 .or. m_month=11
	   ??tran(0,'999999.99')+' '+tran(0,'999999.99')+' '+tran(0,'999999.99')
   else
   	??tran(0,'999999.99')+' '+tran(0,'999999.99')+' '+tran(0,'999999.99')
   endif

   ??' '

   if m_month=1 .or. m_month=4 .or. m_month=7 .or. m_month=10
   	??tran(m_ec1,'999999.99')+' '+tran(    0,'999999.99')+' '+tran(    0,'999999.99')
   elseif m_month=2 .or. m_month=5 .or. m_month=8 .or. m_month=11
	   ??tran(    0,'999999.99')+' '+tran(m_ec2,'999999.99')+' '+tran(    0,'999999.99')
   else
   	??tran(    0,'999999.99')+' '+tran(    0,'999999.99')+' '+tran(m_ec3,'999999.99')
   endif

   ??spac(20)

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

restscreen(9,21,15,56,m_qtrscrn)
clos all
set colo to (m_oldcol)
rele all
retu


