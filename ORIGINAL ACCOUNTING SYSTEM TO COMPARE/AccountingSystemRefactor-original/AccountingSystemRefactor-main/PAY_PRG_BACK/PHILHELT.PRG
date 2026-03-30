/*
PAYROLL SYSTEM
Program Name : Quarterly Philhealth Remittance Report
Program Code : Philhelt.prg
Author       : SVC
Date Started : Aug 23, 1999
Date Finished: Aug 23, 1999
*/

m_prevscrn:=savescreen(7,22,17,62)
m_oldcol:=setcolor()
setcolor(m_cnor)
while .t.

   f_bcln()
	m_spool:=.t.
	m_page:=0
	m_crow:=60
	m_fig:='999,999.99'

	f_setting()

	select 1
	if ! net_use('&dpath\sys_id',.t.,5)
		exit
	endif
	if ! fil_lock(5)
		exit
	endif

	select 2
	if ! net_use('&dpath\history',.t.,5)
		exit
	endif
   set index to &dpath\hbyemp

	select 3
	if ! net_use('&dpath\master',.t.,5)
		exit
	endif
   set index to &dpath\mbynm

   set relation to emp_no into history

   select sys_id

	m_pres_mo:=str(month(ctod(subs(str(100+pres_mo,3),2,2)+'/01/'+subs(str(year(end_date),4),3,2))),2)
   m_month  :=pres_mo

	do case
		case m_pres_mo$' 1~ 2~ 3'
			m_quarter=1
		case m_pres_mo$' 4~ 5~ 6'
			m_quarter=2
		case m_pres_mo$' 7~ 8~ 9'
			m_quarter=3
		case m_pres_mo$'10~11~12'
			m_quarter=4
	endcase

	m_year=str(year(beg_date),4)
   m_pbr_no1:=m_pbr_no2:=m_pbr_no3:=space(15)
	m_pbr_dt1:=m_pbr_dt2:=m_pbr_dt3:=ctod('  /  /    ')
   //Confirm Quarter and Year
   f_bcln()
   f_drawbox(7,22,17,62,1,3)
	setcolor(m_cnor)


   while .t.

      @ 8,24 say 'SELECT THE APPLICABLE QUARTER'
      @10,24 say 'QUARTER :'
      @11,24 say 'YEAR    :'
      @10,36 prom '1st'
      @10,41 prom '2nd'
      @10,46 prom '3rd'
      @10,51 prom '4th'
      menu to m_quarter
      if lastkey()=27
      	exit
      endi

      @11,36 get m_year pict '9999' vali m_year >= str(year(beg_date-1),4)
      read

      if lastkey()==27
         exit
      endif

      set century on

      @12,35 say 'PBR NO.         ISSUE DATE'

      do case
      	case m_quarter=1
      		@13,24 say 'JANUARY  :'
      		@14,24 say 'FEBRUARY :'
      		@15,24 say 'MARCH    :'
      	case m_quarter=2
      		@13,24 say 'APRIL    :'
      		@14,24 say 'MAY      :'
      		@15,24 say 'JUNE     :'
      	case m_quarter=3
      		@13,24 say 'JULY     :'
      		@14,24 say 'AUGUST   :'
      		@15,24 say 'SEPTEMBER:'
      	case m_quarter=4
      		@13,24 say 'OCTOBER  :'
      		@14,24 say 'NOVEMBER :'
      		@15,24 say 'DECEMBER :'
      	otherwise
      		exit
      endcase

      @13,35 get m_pbr_no1 valid m_pbr_no1!=space(15)
      @13,51 get m_pbr_dt1 valid dtoc(m_pbr_dt1)!='  /  /    '
      @14,35 get m_pbr_no2 valid m_pbr_no2!=space(15)
      @14,51 get m_pbr_dt2 valid dtoc(m_pbr_dt2)!='  /  /    '
      @15,35 get m_pbr_no3 valid m_pbr_no3!=space(15)
      @15,51 get m_pbr_dt3 valid dtoc(m_pbr_dt3)!='  /  /    '

      read

      if lastkey()=27
      	exit
      endif

      if f_ask('Are the data correct?')
         exit
      endif

   end while

	if lastkey()=27
		exit
	endif

	m_t_mede1:=m_t_medr1:=m_t_mede2:=m_t_medr2:=m_t_mede3:=m_t_medr3:=0

	m_sfname='PH'+m_year+str(m_quarter,1)
   m_correct:=.f.

	while ! m_correct
		f_bcln()
		@24,5 say 'ENTER SPOOL FILENAME :'
		tone(800,1)
		m_sfname:=upper(alltrim(m_sfname))+spac(8-len(alltrim(m_sfname)))
		@24,28 get m_sfname pict '@K!' vali m_sfname#spac(8)
		read

		if lastkey()=27
			exit
		endi

		tone(800,1)
		@24,45 say 'Is the filename correct ? 'get m_correct pict 'Y'
		read

		if lastkey()=27
			exit
		endi

		m_sfname=alltrim(m_sfname)
		n_sfname=m_sfname+'.'

		if file('&tpath\&n_sfname')
			f_bcln()
			tone(800,1)
			@24,16 say m_sfname+' already exists. Overwrite (Y/N) ?' get m_correct pict 'Y'
			read
		endi

	end while

	if lastkey()=27
		exit
	endi

	f_bcln()
	tone(4100,0.5)
	tone(4100,1)
	m_sfname=alltrim(m_sfname)+'.'

	f_sayit('SPOOLING... FILENAME = '+m_sfname)
	set cons off
	set alte to &tpath\&m_sfname
	set alte on

	m_med1:=m_med2:=m_med3:=0

	m_ncompany:=subs(alltrim(m_company)+spac(60-len(alltrim(m_company))),1,60)
	m_address :=subs(alltrim(m_comp_addr)+spac(100-len(alltrim(m_comp_addr))),1,100)

	m_id:=alltrim((strtran(m_comp_sss,'-','',1)))
	m_id:=m_id+spac(12-len(m_id))

	m_newhire=dtos(ctod(subs(str(100+m_month,3),2,2)+'/01/'+m_year))

	select master
	set rela to emp_no into history

	dbgotop()

   m_mon:=subs(str(m_month+100,3),2,2)

   ?'REMITTANCE REPORT'
	?m_ncompany
   ?m_address

   /*
   Type of Report
      "R" - regular quarterly remittance report
      "A" - addition to previously submitted report
      "D" - deduction to previously submitted report
   */
   m_report_type:='R'

   ?m_id+str(m_quarter,1)+m_year+m_report_type

   ?'MEMBERS'

   m_ctr:=0
   m_emps1:=m_emps2:=m_emps3:=0

	while ! eof()

  		if med_ee1+med_ee2+med_ee3+med_er1+med_er2+med_er3==0
   		skip
	   	loop
      endif

		m_d_emp:=dtos(history->date_emp)

      m_emp_nm:=strtran(emp_nm,"¤","N")
      m_emp_nm:=strtran(m_emp_nm,"¥","N")
      m_emp_nm:=strtran(m_emp_nm,"-"," ")
      m_emp_nm:=strtran(m_emp_nm,"."," ")
      m_emp_nm:=strtran(m_emp_nm,","," ")

      if phic!=space(12)
         m_number:=phic
      else
         m_number:=sss
      endif

      m_id:=alltrim((strtran(m_number,'-','',1)))
   	m_id:=m_id+spac(12-len(m_id))

		do case
			case emp_type$'Rr'
				m_remarks:='SP'+space(8)
			case m_d_emp!=space(8) .and. m_d_emp > m_newhire
				m_remarks:='NH'+subs(m_d_emp,5,4)+subs(m_d_emp,1,4)
			othe
				m_remarks:=space(10)
		endcase

		?m_id+subs(m_emp_nm,16,15)+space(15)+subs(m_emp_nm,1,15)+space(15);
		   +subs(m_emp_nm,31,1)

      ??f_qtrmed(m_gross-m_othp2,8)

   	??f_qtrmed(med_ee1,6)
   	??f_qtrmed(med_er1,6)

   	??f_qtrmed(med_ee2,6)
   	??f_qtrmed(med_er2,6)

   	??f_qtrmed(med_ee3,6)
   	??f_qtrmed(med_er3,6)

      ??m_remarks

		m_med1 += med_ee1+med_er1
		m_med2 += med_ee2+med_er2
		m_med3 += med_ee3+med_er3

      if med_ee1 > 0
         m_emps1++
      endif
      if med_ee2 > 0
         m_emps2++
      endif
      if med_ee3 > 0
         m_emps3++
      endif

      m_ctr++

		skip

	end while

   ?'M5-SUMMARY'

	?'1'+f_qtrmed(m_med1,8)+m_pbr_no1+subs(dtos(m_pbr_dt1),5,4);
	   +subs(dtos(m_pbr_dt1),1,4)+right(str(10000+m_emps1,5),3)
	?'2'+f_qtrmed(m_med2,8)+m_pbr_no2+subs(dtos(m_pbr_dt2),5,4);
	   +subs(dtos(m_pbr_dt2),1,4)+right(str(10000+m_emps2,5),3)
	?'3'+f_qtrmed(m_med3,8)+m_pbr_no3+subs(dtos(m_pbr_dt3),5,4);
	   +subs(dtos(m_pbr_dt3),1,4)+right(str(10000+m_emps3,5),3)

   ?'GRAND TOTAL'+f_qtrmed(m_med1+m_med2+m_med3,10)
   ?alltrim(m_comp_sign)+space(40-len(alltrim(m_comp_sign)))
      ??alltrim(m_compstit)+space(20-len(alltrim(m_compstit)))

   set alternate off
  	set alternate to

	set alte to &tpath\RF1SUM.TXT
	set alte on

	m_id:=alltrim((strtran(m_comp_sss,'-','',1)))
	m_id:=m_id+spac(12-len(m_id))

	?m_ncompany
	?
	?'RF-1 DISKETTE SUMMARY'
   ?
   ?
   ?'EMPLOYER SSS ID NO: '+subs(m_id,1,2)+'-'+subs(m_id,3,7)+'-'+subs(m_id,10,1)
   ?
   ?'APPLICABLE QUARTER: '+str(m_quarter,1)
   ?
   ?
   ?'    SSS             EC             EC            TOTAL'
   do case
      case m_quarter=1
         ?'   JANUARY       FEBRUARY         MARCH          TOTAL'
      case m_quarter=2
         ?'    APRIL           MAY           JUNE           TOTAL'
      case m_quarter=3
         ?'    JULY          AUGUST        SEPTEMBER        TOTAL'
      case m_quarter=4
         ?'   OCTOBER       NOVEMBER       DECEMBER         TOTAL'
   endcase
   ?'-------------  -------------  -------------  -------------'
   //99,999,999.99  99,999,999.99  99,999,999.99  99,999,999.99

   m_pict:='99,999,999.99'

	?tran(m_med1,m_pict)+'  '+tran(m_med2,m_pict)+'  '+tran(m_med3,m_pict)
	??'  '+tran(m_med1+m_med2+m_med3,m_pict)
   ?
   ?
   ?'Total Employees Reported this Quarter : '+tran(m_ctr,'999,999')+' Employees'
   ?chr(12)

	if m_spool
	   set alte off
   	set alte to
	else
	   set print off
   	set devi to scre
	endi
	set cons on
	exit

end while
restscreen(7,22,17,62,m_prevscrn)
dbcloseall()
setcolor(m_oldcol)
return


function f_qtrmed(_m_amt,_m_digits)
return(subs(str(10**_m_digits+_m_amt*100,_m_digits+1),2,_m_digits))
