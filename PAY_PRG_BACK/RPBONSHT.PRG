* Print 13th Month Paysheet
*proc rpbonsht

do while .t.
	select 1
  	if .not. net_use('&dpath\master',.f.,5)
		exit
	endi
	if f_choose('Print Report:','BY EMP#','BY DEPARTMENT')
		set index to &dpath\mbyemp
		m_by_emp_no=.t.
	else
		set index to &dpath\mbydep
		select 2
	  	if .not. net_use('&dpath\dept',.f.,5)
			exit
		endi
		set index to &dpath\dbydep
		select 1
		set relation to dep_no into dept
		m_by_emp_no=.f.
	endif
	if lastkey()=27
		exit
	endif
	m_spool=.t.
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
	m_page=0
	m_crow=60
	m_dep_no=space(2)
	m_t_y_bonus=0
	m_t_y_btax=0
	m_t_y_midbon=0
	m_d_y_bonus=0
	m_d_y_btax=0
	m_d_y_midbon=0
	m_ctr=0
	do while .not. eof()
		if m_crow>58
			m_page=m_page+1
			if m_page>1
				?chr(12)
			endif
			?ltrim(m_company)
			?'13th Month Pay Sheet for the year '+ltrim(str(year(date())))
			?
			?ltrim(m_head)+space(85-len(alltrim(m_head)))+'Page '+str(m_page,2)
			?repl('=',92)
			?'EMP#   NAME'+space(30)+'13th MONTH   WITHHOLDING  ';
			+'CASH         NET PAY.....'
			?space(41)+'PAY......... TAX......... ADVANCE.....'
			?repl('=',92)
			* 1234   12345678901234567890123456789012  9,999,999.99 9,999,999.99 9,999,999.99 9,999,999.99
			m_crow=8
		endif
		if y_bonus=0
			skip
			loop
		endif
		if .not. m_by_emp_no
			if dep_no<>m_dep_no
				if m_d_y_bonus>0
					?repl('-',92)
					?space(27)+'DEPT. TOTAL:  '+tran(m_d_y_bonus,'9,999,999.99');
					+' '+tran(m_d_y_btax,'9,999,999.99')+' ';
					+tran(m_d_y_midbon,'9,999,999.99')+' ';
					+tran(m_d_y_bonus-m_d_y_btax-m_d_y_midbon,'9,999,999.99')
					?
					m_crow=m_crow+3
				endif
				?'Department: '+ltrim(dept->dep_nm)
				m_d_y_bonus =0
				m_d_y_btax  =0
				m_d_y_midbon=0
				m_dep_no=dep_no
				m_crow=m_crow+1
			endif
		endif
		m_emp_nm = alltrim(emp_nm)
		m_lspac=int((32-len(m_emp_nm))/2)
		m_emp_nm1 =m_emp_nm+space(32-len(m_emp_nm))
		m_emp_no=alltrim(emp_no)+space(6-len(alltrim(emp_no)))
		?m_emp_no+' '+m_emp_nm1+'  '+tran(y_bonus,'9,999,999.99')+' ';
		+tran(y_btax,'9,999,999.99')+' '+tran(y_midbon,'9,999,999.99');
		+' '+tran(y_bonus-y_btax-y_midbon,'9,999,999.99')
		m_t_y_bonus = m_t_y_bonus  + y_bonus
		m_t_y_btax  = m_t_y_btax   + y_btax
		m_t_y_midbon= m_t_y_midbon + y_midbon
		m_d_y_bonus = m_d_y_bonus  + y_bonus
		m_d_y_btax  = m_d_y_btax   + y_btax
		m_d_y_midbon= m_d_y_midbon + y_midbon
		m_ctr=m_ctr+1
		skip
	enddo
	if .not. m_by_emp_no
		if m_d_y_bonus>0
			?repl('-',92)
			?space(27)+'DEPT. TOTAL:  '+tran(m_d_y_bonus,'9,999,999.99');
			+' '+tran(m_d_y_btax,'9,999,999.99')+' ';
			+tran(m_d_y_midbon,'9,999,999.99')+' ';
			+tran(m_d_y_bonus-m_d_y_btax-m_d_y_midbon,'9,999,999.99')
			?
			m_crow=m_crow+3
		endif
	endif
	if m_ctr>0
		?repl('=',92)
		?space(27)+'GRAND TOTAL:  '+tran(m_t_y_bonus,'9,999,999.99')+' ';
		+tran(m_t_y_btax,'9,999,999.99')+' '+tran(m_t_y_midbon,'9,999,999.99');
		+' '+tran(m_t_y_bonus-m_t_y_btax-m_t_y_midbon,'9,999,999.99')
		?repl('=',92)
	endif
	?'Total Number of Employees :'+str(m_ctr,7)
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
enddo
close all
return


* Print 13th Month Paysheet for ATM

proc rpbonatm
do while .t.
	select 1
  	if .not. net_use('&dpath\master',.f.,5)
		exit
	endi
	set index to &dpath\mbyemp
	if lastkey()=27
		exit
	endif
	m_spool=.t.
   if .not. f_askspool()
		m_spool=.f.
		if lastkey()=27
			exit
		endi
		set print on
		set devi to print
		set cons off
   endi
	m_page=0
	m_crow=60
	m_dep_no=space(2)
	m_t_net_pay=0
	m_ctr=0
	do while .not. eof()
		if m_crow>58
			m_page=m_page+1
			if m_page>1
				?chr(12)
			endif
			?ltrim(m_company)
			?'ATM PAYROLL SUMMARY'
			?'13th Month Pay for the year '+ltrim(str(year(date())))
			?
			?ltrim(m_head)+space(60-len(alltrim(m_head)))+'Page '+str(m_page,2)
			?repl('=',67)
			?'EMP#   NAME                              ACCT.NO.         NET PAY'
			?repl('=',67)
			*123456 12345678901234567890123456789012  123456789012  9,999,999.99
			m_crow=8
		endif
		m_net_pay=y_bonus-y_btax-y_midbon
		if m_net_pay>0
			m_emp_nm = alltrim(emp_nm)
			m_lspac=int((32-len(m_emp_nm))/2)
			m_emp_nm1 =m_emp_nm+space(32-len(m_emp_nm))
			m_emp_no=alltrim(emp_no)+space(6-len(alltrim(emp_no)))
			?m_emp_no+' '+m_emp_nm1+'  '+alltrim(acct_no);
			+space(14-len(alltrim(acct_no)));
			+tran(y_bonus-y_btax-y_midbon,'9,999,999.99')
			m_t_net_pay=m_t_net_pay+m_net_pay
		endif
		skip
	enddo
	if m_ctr>0
		?repl('=',67)
		?space(46)+'TOTAL :  '+tran(m_t_net_pay,'9,999,999.99')
		?repl('=',67)
	endif
	?chr(12)
	if m_spool
	   set alte off
   	set alte to
	else
	   set print off
   	set devi to scre
	endi
	set console on
	exit
enddo
close all
return


* 13th MONTH PAY DENOMINATION BREAKDOWN

proc rpbonden
do while .t.
	select 1
  	if .not. net_use('&dpath\master',.f.,5)
		exit
	endi
	if f_ask('Denomination with P500.00 bill ?')
		m_with500=.t.
	else
		m_with500=.f.
	endif
	m_spool=.t.
   if .not. f_askspool()
		m_spool=.f.
		if lastkey()=27
			exit
		endi
		set print on
		set device to print
		set console off
   endi
	store 0 to bb,b1,b2,b3,b4,b5,b6,b7,b8,b9,b10,b11,b12
	go top
	do while .not. eof()
		if emp_flag$'Rr'   && r - RESIGNED
			skip
			loop
		endif
		if y_bonus > 0
      	store 0 to a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,aa,cc
	 		store 0 to c1,c2,c3,c4,c5,c6,c7,c8,c8,c10,c11,c12
			bon_p = (y_bonus-(y_btax+y_midbon))*100 + .005
			if m_with500
				aa = int(bon_p/50000)
	  	      bb = bb + aa
	     	   cc = bon_p-(aa*50000)
	         a1 = int(cc/10000)
	  	      b1 = b1 + a1
	     	   c1 = cc-(a1*10000)
			else
	         a1 = int(bon_p/10000)
	  	      b1 = b1 + a1
	     	   c1 = bon_p-(a1*10000)
			endi
	      a2 = int(c1/5000)
			b2 = b2 + a2
	      c2 = c1 - (a2*5000)
	      a3 = int(c2/2000)
	      b3 = b3 + a3
	      c3 = c2 - (a3*2000)
	      a4 = int(c3/1000)
	      b4 = b4 + a4
	      c4 = c3 - (a4*1000)
	      a5 = int(c4/500)
	      b5 = b5 + a5
	      c5 = c4 - (a5*500)
	      a6 = int(c5/200)
	      b6 = b6 + a6
	      c6 = c5 - (a6*200)
   	   a7 = int(c6/100)
	      b7 = b7 + a7
	      c7 = c6 - (a7*100)
	      a8 = int(c7/50)
	      b8 = b8 + a8
	      c8 = c7 - (a8*50)
	      a9 = int(c8/25)
	      b9 = b9 + a9
	      c9 = c8 - (a9*25)
	      a10= int(c9/10)
	      b10= b10 + a10
	      c10= c9 - (a10*10)
	      a11= int(c10/5)
	      b11= b11 + a11
	      c11= c10 - (a11*5)
	      a12= int(c11)
	      b12= b12 + a12
	   endif
	   skip
	endd
	use
	m_year = ltrim(str(year(date())))
	xa = '999,999'
	xb = '999,999,999.99'
	m_total=bb*500+b1*100+b2*50+b3*20+b4*10+b5*5+b6*2+b7*1+b8*0.50+b9*0.25;
	+b10*0.10+b12*0.01
	?
	?ltrim(m_company)
	?'13th MONTH PAY Denomination Breakdown'
	?'For the Year '+m_year
	?
	?M_HEAD
	?repl('=',67)
	?' DENOMINATION               NO. OF PCS.                     AMOUNT'
	?repl('=',67)
	?'   P500.00'+space(19)+tran(bb,xa)+space(16)+tran(bb*500,xb)
	?'    100.00'+space(19)+tran(b1,xa)+space(16)+tran(b1*100,xb)
	?'     50.00'+space(19)+tran(b2,xa)+space(16)+tran(b2*50,xb)
	?'     20.00'+space(19)+tran(b3,xa)+space(16)+tran(b3*20,xb)
	?'     10.00'+space(19)+tran(b4,xa)+space(16)+tran(b4*10,xb)
	?'      5.00'+space(19)+tran(b5,xa)+space(16)+tran(b5*5,xb)
	?'      2.00'+space(19)+tran(b6,xa)+space(16)+tran(b6*2,xb)
	?'      1.00'+space(19)+tran(b7,xa)+space(16)+tran(b7,xb)
	?'      0.50'+space(19)+tran(b8,xa)+space(16)+tran(b8*0.50,xb)
	?'      0.25'+space(19)+tran(b9,xa)+space(16)+tran(b9*0.25,xb)
	?'      0.10'+space(19)+tran(b10,xa)+space(16)+tran(b10*0.10,xb)
	?'      0.05'+space(19)+tran(b11,xa)+space(16)+tran(b11*0.05,xb)
	?'      0.01'+space(19)+tran(b12,xa)+space(16)+tran(b12*0.01,xb)
	?space(52)+'--------------'
	?space(52)+tran(m_total,xb)
	?space(52)+'=============='
	?chr(12)
	?
	if m_spool
	   set alte off
   	set alte to
	else
	   set print off
   	set devi to scre
	endi
	set cons on
	exit
enddo
close all
retu

