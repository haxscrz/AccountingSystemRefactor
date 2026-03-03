* Program Code : Rppremcr.prg
* Program Desc : Premium Certification
* Program Date : Feb. 22, 1995
* Author       : SVC

para m_which
m_oldcol=setcolor()
set colo to (m_cnor)
do whil .t.
	set color to (m_cmes)
	f_bcln()
	m_spool=.t.
	m_page=0
	m_crow=60
	m_fig ='9,999,999.99'
	m_certscrn=savescreen(10,4,18,73)
	f_setting()
	do while .t.
		select 3
		if .not. net_use('&dpath\prempaid',.t.,5)
			exit
		endif
		set inde to &dpath\prempaid
		select 1
		if .not. net_use('&dpath\premmast',.t.,5)
			exit
		endif
		set inde to &dpath\premmast
		if .not. fil_lock(5)
			exit
		endif
		select 2
		if .not. net_use('&dpath\master',.t.,5)
			exit
		endif
		set inde to &dpath\mbyemp
		m_emp_no1=spac(6)
		m_emp_no2=spac(6)
		f_drawbox(10,5,18,73,1,3)
		store 0 to m_month1,m_year1,m_month2,m_year2
		do while .t.
			set color to (m_cnor)
			@12, 8 say 'Period Covered-  From: Month-   Year-    '
			@13,27 say 'To: Month-   Year-    '
			@12,37 get m_month1 pict '99' vali (m_month1<13 .and. m_month1>0)
			@12,45 get m_year1 pict '9999' vali m_year1>0
			@13,37 get m_month2 pict '99' vali (m_month2<13 .and. m_month2>0)
			@13,45 get m_year2 pict '9999' vali m_year2>0
			read
			if lastkey()=27
				exit
			endif
			m_period1=subs(str(10000+m_year1,5),2,4)+subs(str(100+m_month1,3),2,2)
			m_period2=subs(str(10000+m_year2,5),2,4)+subs(str(100+m_month2,3),2,2)
			if m_period1>m_period2
				f_err('Invalid Period Range !',.f.)
				loop
			endif
			@14, 8 say 'Scope:'
			@14,16 prompt ' ALL EMPLOYEES '
			@14,33 prompt ' SELECTED EMPLOYEES '
			menu to m_scope
			if lastkey()=27
				exit
			endif
			if m_scope=1
				go bott
				m_emp_no2=emp_no
				go top
				m_emp_no1=emp_no
			else
				*ASK USER TO ENTER 2 EMPLOYEE NUMBERS
				@15, 8 say 'CERTIFICATION From EMP#:'
				@16,24 say 'To EMP#:'
				do whil .t.
					* f_valempnm - under rppayslp.prg
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
						endif
					endif
				enddo
				if lastkey()=27
					exit
				endif
				seek m_emp_no1
			endif
			if f_ask('Data correct ?')
				exit
			endif
	   enddo
		if lastkey()=27
			exit
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
		m_pertitl1=cmonth(ctod(subs(m_period1,5,2)+'/01/'+subs(m_period1,1,4)))+' '+subs(m_period1,1,4)
		m_pertitl2=cmonth(ctod(subs(m_period2,5,2)+'/01/'+subs(m_period2,1,4)))+' '+subs(m_period2,1,4)
		select 2
		do while emp_no<=m_emp_no2 .and. .not. eof()
			m_emp_no  := emp_no
			m_emp_nm  := emp_nm
			m_sss_no  := sss
         m_phic    := phic
		   m_pgbg_no := pgbg_no

			do p_premhead
			m_total=0
			m_tot2=0
			m_totals=0
			m_tots2=0
			m_totalm=0
			m_totm2=0
			m_totalp=0
			m_totp2=0
			select premmast
			set softseek on
			seek m_emp_no+m_period1
			if eof() .or. period<=m_period2
				set softseek off
				do while emp_no=m_emp_no .and. period <=m_period2
					m_per=alltrim(cmonth(ctod(subs(period,5,2)+'/01/'+subs(period,1,4))))
					m_per=subs(period,1,4)+'  '+m_per+space(10-len(m_per))
					m_period=period
					select prempaid
					seek m_period
					if .not. eof()
						m_or_sbr=or_sbr
						m_or_date=dtoc(or_date)
						m_or_pag=or_pag
						m_pg_date=dtoc(pg_date)
					else
						m_or_sbr=space(15)
						m_or_date=space(8)
						m_or_pag=space(15)
						m_pg_date=space(8)
					endif
					sele premmast
					do case
						case m_which$'SSS'
							?m_per+tran(m_ssee, m_fig)+'   '+m_or_sbr+'  '+m_or_date
							m_total=m_total+m_ssee
						case m_which='MED'
							?m_per+tran(m_medee,m_fig)+'   '+m_or_sbr+'  '+m_or_date
							m_total=m_total+m_medee
						case m_which='PBG'
							?m_per+tran(m_pgee, m_fig);          //+'   '+tran(m_pger, m_fig);
							 +'   '+m_or_pag+'  '+m_pg_date
							m_total=m_total+m_pgee
							m_tot2=m_tot2+m_pger
						case m_which='ALL'
							?m_per+tran(m_ssee,m_fig)+' ';
								+tran(m_medee,m_fig)+'     '+tran(m_pgee,m_fig)+'    ';
								+tran(m_pger,m_fig);
								+' '+m_or_sbr+' '+m_or_pag+' '+m_or_date
							m_totals=m_totals+m_ssee
							m_totalm=m_totalm+m_medee
							m_totalp=m_totalp+m_pgee
							m_totp2=m_totp2+m_pger
					endcase
					m_crow=m_crow+1
					skip
				enddo
				if m_crow+8>60
					do p_reghead
				endif
				?
				do case
					case m_which$'SSS~MED'
						?'GRAND TOTAL :   '+tran(m_total,m_fig)
					case m_which$'PBG'
						?'GRAND TOTAL :   '+tran(m_total,m_fig)  //+'   '+tran(m_tot2,m_fig)
					case m_which='ALL'
						?'GRAND TOTAL :   '+tran(m_totals,m_fig);
							+' '+tran(m_totalm,m_fig)+'     '+tran(m_totalp,m_fig);
							+tran(m_totp2,m_fig)
				endcase
				?
				?
				?'CERTIFIED CORRECT:'
				?
				?'__________________                           ___________'
				?'Accountant                                   Date Signed'
				?
			endif
			set softseek off
			select 2
			skip
		enddo
		exit
	enddo
	if m_spool
	   set alte off
   	set alte to
	else
	   set print off
   	set devi to scre
	endi
	set cons on
	restscreen(10,4,18,73,m_certscrn)
	release m_certscrn
	exit
enddo
close all
set colo to (m_oldcol)
release all
return

proc p_premhead
m_page=m_page+1
if m_page>1
	?chr(12)
endi
?m_company
?'Business Address : '+ltrim(m_comp_addr)
do case
	case m_which='SSS'
		?'CERTIFICATE OF SSS PREMIUM PAYMENTS'
		?'Company SSS I.D. NO. : '+m_comp_sss
      ?'Employee Name        : '+m_emp_nm
      ?'Employee SSS I.D. No.: '+m_sss_no
	case m_which='MED'
		?'CERTIFICATE OF MEDICARE PREMIUM PAYMENTS'
		?'Company SSS I.D. NO. : '+m_comp_sss
      ?'Employee Name        : '+m_emp_nm
      ?'Employee PHIC I.D.No.: '+m_phic
	case m_which='PBG'
		?'CERTIFICATE OF PAG-IBIG PREMIUM PAYMENTS'
		?'Company PAG-IBIG NO. : '+m_comp_pbg
      ?'Employee Name        : '+m_emp_nm
      ?'Employee PAG-IBIG No.: '+m_pgbg_no
	case m_which='ALL'
		?'CERTIFICATE OF PREMIUM PAYMENTS'
		?'Company SSS I.D. NO. : '+m_comp_sss
		?'Company PAG-IBIG NO. : '+m_comp_pbg
      ?'Employee Name : '+m_emp_nm
      ?'Employee SSS I.D. No.: '+m_sss_no
endcase
?
?'Period Covered : '+m_pertitl1+' to '+m_pertitl2
?
do case
	case m_which$'SSS~MED~PBG'
		?'YEAR  MONTH         AMOUNT     O.R./SBR NO.    DATE PAID'
		?repl('=',56)
		m_crow=8
	case m_which='ALL'
		?'YEAR  MONTH           SSS     MEDICARE         PAG-IBIG       O.R./SBR NO.   O.R. PGBG NO.   DATE PAID'
		?'                                           EMP.       EMPR.                                          '        
		?repl('=',101)
		m_crow=9
endcase
return

