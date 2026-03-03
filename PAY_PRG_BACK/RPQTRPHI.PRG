/*
PAYROLL SYSTEM
Program Name : Quarterly Philhealth Remittance Report
Program Code : Rpqtrphi.prg
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

   do case
   	case m_quarter=1
   		m_mn1:=' JANUARY '
   		m_mn2:='FEBRUARY '
   		m_mn3:='  MARCH  '
   	case m_quarter=2
   		m_mn1:='  APRIL  '
   		m_mn2:='   MAY   '
   		m_mn3:='  JUNE   '
   	case m_quarter=3
   		m_mn1:='  JULY   '
   		m_mn2:=' AUGUST  '
   		m_mn3:='SEPTEMBER'
   	case m_quarter=4
   		m_mn1:=' OCTOBER '
   		m_mn2:='NOVEMBER '
   		m_mn3:='DECEMBER '
   	otherwise
   		exit
   endcase

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

      @13,24 say alltrim(m_mn1)+space(9-len(alltrim(m_mn1)))+':'
      @14,24 say alltrim(m_mn2)+space(9-len(alltrim(m_mn2)))+':'
      @15,24 say alltrim(m_mn3)+space(9-len(alltrim(m_mn3)))+':'

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

	m_sfname='RPH'+m_year+str(m_quarter,1)
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
		n_sfname=m_sfname+'.TXT'

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
	m_sfname:=n_sfname

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
   /*
   Type of Report
      "R" - regular quarterly remittance report
      "A" - addition to previously submitted report
      "D" - deduction to previously submitted report
   */
   m_report_type:='R'

   m_ctr:=m_page:=0
   m_emps1:=m_emps2:=m_emps3:=0
   m_crow:=60
   m_mn_pg1:=m_mn_pg2:=m_mn_pg3:=m_mn_pg4:=m_mn_pg5:=m_mn_pg6:=0
   m_mn_gt1:=m_mn_gt2:=m_mn_gt3:=m_mn_gt4:=m_mn_gt5:=m_mn_gt6:=0

	while ! eof()

  		if med_ee1+med_ee2+med_ee3+med_er1+med_er2+med_er3==0
   		skip
	   	loop
      endif

      if m_crow > 58
         if m_page > 0
            ?space(60)+replicate(' -----------',7)+'--'
         	?space(47)+'Page Total : '+f_dqtrmed(m_mn_pg1,6);
         	   +f_dqtrmed(m_mn_pg2,6)+f_dqtrmed(m_mn_pg3,6);
         	   +f_dqtrmed(m_mn_pg4,6)+f_dqtrmed(m_mn_pg5,6);
         	   +f_dqtrmed(m_mn_pg6,6)
         	??f_dqtrmed(m_mn_pg1+m_mn_pg2+m_mn_pg3+m_mn_pg4;
         	   +m_mn_pg5+m_mn_pg6,8)
         endif
         m_page ++
         m_crow:=f_phichead(m_mn1,m_mn2,m_mn3,m_page)

         m_mn_gt1+=m_mn_pg1
         m_mn_gt2+=m_mn_pg2
         m_mn_gt3+=m_mn_pg3
         m_mn_gt4+=m_mn_pg4
         m_mn_gt5+=m_mn_pg5
         m_mn_gt6+=m_mn_pg6

         m_mn_pg1:=m_mn_pg2:=m_mn_pg3:=m_mn_pg4:=m_mn_pg5:=m_mn_pg6:=0
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

		?m_id+m_emp_nm+space(2)

      ??f_dqtrmed(grs_ee1+grs_ee2+grs_ee3,8)

   	??f_dqtrmed(med_ee1,6)
   	??f_dqtrmed(med_er1,6)

   	??f_dqtrmed(med_ee2,6)
   	??f_dqtrmed(med_er2,6)

   	??f_dqtrmed(med_ee3,6)
   	??f_dqtrmed(med_er3,6)

   	??f_dqtrmed(med_ee1+med_ee2+med_ee3+med_er1+med_er2+med_er3,8)

      m_mn_pg1 += med_ee1
      m_mn_pg2 += med_er1
      m_mn_pg3 += med_ee2
      m_mn_pg4 += med_er2
      m_mn_pg5 += med_ee3
      m_mn_pg6 += med_er3

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
      m_crow++

		skip

	end while

   if m_ctr > 0
      ?space(60)+replicate(' -----------',7)+'--'
     	?space(47)+'Page Total : '+f_dqtrmed(m_mn_pg1,6);
     	   +f_dqtrmed(m_mn_pg2,6)+f_dqtrmed(m_mn_pg3,6);
     	   +f_dqtrmed(m_mn_pg4,6)+f_dqtrmed(m_mn_pg5,6);
     	   +f_dqtrmed(m_mn_pg6,6)
     	??f_dqtrmed(m_mn_pg1+m_mn_pg2+m_mn_pg3+m_mn_pg4;
     	   +m_mn_pg5+m_mn_pg6,8)

      m_mn_gt1+=m_mn_pg1
      m_mn_gt2+=m_mn_pg2
      m_mn_gt3+=m_mn_pg3
      m_mn_gt4+=m_mn_pg4
      m_mn_gt5+=m_mn_pg5
      m_mn_gt6+=m_mn_pg6

      ?
      ?space(60)+replicate(' -----------',7)+'--'
     	?space(46)+'Grand Total : '+f_dqtrmed(m_mn_gt1,6);
     	   +f_dqtrmed(m_mn_gt2,6)+f_dqtrmed(m_mn_gt3,6);
     	   +f_dqtrmed(m_mn_gt4,6)+f_dqtrmed(m_mn_gt5,6);
     	   +f_dqtrmed(m_mn_gt6,6)
     	??f_dqtrmed(m_mn_gt1+m_mn_gt2+m_mn_gt3+m_mn_gt4;
     	   +m_mn_gt5+m_mn_gt6,8)

      ?replicate('-',146)

      m_crow += 6

   endif

   if m_crow+8 > 60
      m_page++
   endif

   ?
   ?'SUMMARY :'
   ?'MONTH           AMOUNT     PBR NO.          ISSUE DATE    NO.OF EMPLOYEES'
   ?alltrim(m_mn1)+space(9-len(alltrim(m_mn1)))+': '
	??f_dqtrmed(m_med1,8)+'  '+m_pbr_no1+'  '+dtoc(m_pbr_dt1);
	   +tran(m_emps1,'999,999')

   ?alltrim(m_mn2)+space(9-len(alltrim(m_mn2)))+': '
	??f_dqtrmed(m_med2,8)+'  '+m_pbr_no2+'  '+dtoc(m_pbr_dt2);
	   +tran(m_emps2,'999,999')

   ?alltrim(m_mn3)+space(9-len(alltrim(m_mn3)))+': '
	??f_dqtrmed(m_med3,8)+'  '+m_pbr_no3+'  '+dtoc(m_pbr_dt3);
	   +tran(m_emps3,'999,999')
   ?
   ?'GRAND TOTAL : '+f_dqtrmed(m_med1+m_med2+m_med3,10)
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

function f_phichead(_m_month1,_m_month2,_m_month3,_m_page)
if _m_page > 1
   ?chr(12)
endif
?m_ncompany
?m_address
?'SSS#: '+m_id+space(5)+'For the '
do case
   case m_quarter=1
      ??'1st'
   case m_quarter=2
      ??'2nd'
   case m_quarter=3
      ??'3rd'
   case m_quarter=4
      ??'4th'
endcase
??' QUARTER OF '+m_year
?'PHIC QUARTERLY REMITTANCE REPORT'
?space(138)+'Page '+str(_m_page,3)
?replicate('=',146)
?space(70)+_m_month1+space(15)+_m_month2+space(15)+_m_month3
?"PHIC/SSS#   EMPLOYEE NAME                         GROSS PAY        'ee         'er         'ee         'er         'ee         'er      TOTAL"
?replicate('=',146)
return(9)


function f_dqtrmed(_m_amt,_m_digits)
if _m_digits==6
   return(tran(_m_amt,'9,999,999.99'))
else
   return(tran(_m_amt,'999,999,999.99'))
endif

