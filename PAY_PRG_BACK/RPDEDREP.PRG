* PAYROLL SYSTEM
* Program Name : Deductions Report
* Program Code : Rpdedrep.prg
* Author       : SVC
* Date Started : June 23, 1994
* Date Finished: June 23, 1994
******************************************************

m_oldcol=setcolor()
set colo to (m_cnor)
save scre to rpdescrn
do whil .t.
   f_bcln()
	m_spool=.t.
	m_page=0
	m_crow=60
	_m_field_nm=''
	_m_ded_head=''
	use pathfile
	m_ded1=toth_ded1
	m_ded2=toth_ded2
	m_ded3=toth_ded3
	m_ded4=toth_ded4
	m_ded5=toth_ded5
	m_ded6=toth_ded6
	m_ded7=toth_ded7
	m_ded8=toth_ded8
	m_ded9=toth_ded9
	m_ded10=toth_ded10
	use
	f_setting()
	sele 1
	if .not. net_use('&dpath\sys_id',.t.,5)
		exit
	endi
	if .not. fil_lock(5)
		exit
	endi
	sele 2
	if .not. net_use('&dpath\tmcard',.t.,5)
		exit
	endi
	set inde to &dpath\tbyemp
	rein
	go top
	sele sys_id
	m_beg_date=dtoc(beg_date)
	m_end_date=dtoc(end_date)
	m_dedscrn=savescreen(9,36,21,64)
	stor 0 to m_gttl1,m_gttl2,m_gttl3,m_gttl4,m_gttl5,m_gttl6,m_gttl7,m_gttl8,m_gttl9,m_gttl10,m_gttl11,m_gttl12,m_gttl13,m_gttl14,m_gttl15
	f_drawbox(9,36,21,64,1,3)
	set colo to (m_cmen)
	@10,37 prom ' '+m_rt_ln1+' '
	@11,37 prom ' '+m_rt_ln2+' '
	@12,37 prom ' '+m_rt_ln3+' '
	@13,37 prom ' '+m_rt_ln4+' '
	@14,37 prom ' '+m_rt_ln5+' '
	@10,52 prom ' '+m_rt_ded1+' '
	@11,52 prom ' '+m_rt_ded2+' '
	@12,52 prom ' '+m_rt_ded3+' '
	@13,52 prom ' '+m_rt_ded4+' '
	@14,52 prom ' '+m_rt_ded5+' '
	@15,52 prom ' '+m_rt_ded6+' '
	@16,52 prom ' '+m_rt_ded7+' '
	@17,52 prom ' '+m_rt_ded8+' '
	@18,52 prom ' '+m_rt_ded9+' '
	@19,52 prom ' '+m_rt_ded10+' '
	@20,52 prom '  ALL DED.  '
	menu to m_rep
	if lastkey()=27
		exit
	endif
	if m_rep=16
		m_mscrn423=savescreen(12,50,16,71)
		f_drawbox(13,50,16,71,1,3)
		f_clnmes()
		f_selkey()
		set colo to (m_cmen)
		@14,51 prom '  AUTOMATIC DED.   'mess 'Print all automatic deductions.'
		@15,51 prom '   MANUAL DED.     'mess 'Print all manual deductions.'
		menu to m_main413
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
	m_gtl=0
	sele tmcard
	do case
		case m_rep=1
			do p_repded with 'sln_ded','SSS SALARY LOAN'
		case m_rep=2
			do p_repded with 'cal_ded','SSS CALAMITY LOAN'
		case m_rep=3
			do p_repded with 'hdmf_ded','HOUSING LOAN'
		case m_rep=4
			do p_repded with 'comp_ded','COMPANY SALARY LOAN'
		case m_rep=5
			do p_repded with 'comd_ded','MULTI-PURPOSE LOAN'
		case m_rep=6
			do p_repded with 'oth_ded1',m_rt_ded1
		case m_rep=7
			do p_repded with 'oth_ded2',m_rt_ded2
		case m_rep=8
			do p_repded with 'oth_ded3',m_rt_ded3
		case m_rep=9
			do p_repded with 'oth_ded4',m_rt_ded4
		case m_rep=10
			do p_repded with 'oth_ded5',m_rt_ded5
		case m_rep=11
			do p_repded with 'oth_ded6',m_rt_ded6
		case m_rep=12
			do p_repded with 'oth_ded7',m_rt_ded7
		case m_rep=13
			do p_repded with 'oth_ded8',m_rt_ded8
		case m_rep=14
			do p_repded with 'oth_ded9',m_rt_ded9
		case m_rep=15
			do p_repded with 'oth_ded10',m_rt_ded10
		case m_rep=16
			do whil .t.
				do case
					case m_main413=1																				
						do p_autoded
						exit	
					case m_main413=2
						do p_manuded
						exit
					otherwise
						exit	
				endcase
			enddo
			f_endtone()
			restscreen(12,50,16,71,m_mscrn423)
			release m_mscrn423	
		othe
			exit	
	endcase
	if m_crow+3>60
		do p_dedhead
	endi
	?
	if m_spool
	   set alte off
   	set alte to
	else
	   set print off
   	set devi to scre
	endi
	set cons on
	f_endtone()
	restscreen(9,36,21,64,m_dedscrn)
	rele m_dedscrn
	exit
endd
clos all
set colo to (m_oldcol)
rest scre from rpdescrn
rele all
retu

proc p_autoded
stor 0 to m_t_loan1,m_t_loan2,m_t_loan3,m_t_loan4,m_t_loan5,;
   m_p_loan1,m_p_loan2,m_p_loan3,m_p_loan4,m_p_loan5
sele tmcard
go top
do whil .not. eof()
	if m_crow+2>58
		? repl('=',120)
		do p_autoall
	endi
	m_ln_amt1=sln_ded
	m_ln_amt2=cal_ded
	m_ln_amt3=hdmf_ded
	m_ln_amt4=comp_ded
	m_ln_amt5=comd_ded
	if m_ln_amt1<=0.and.m_ln_amt2<=0.and.m_ln_amt3<=0.and.m_ln_amt4<=0.and.m_ln_amt5<=0
		skip
		loop
	endif
	m_emp_no=alltrim(emp_no)+space(7-len(alltrim(emp_no)))
	m_emp_nm=alltrim(emp_nm)+space(35-len(alltrim(emp_nm)))
	?m_emp_no+m_emp_nm+tran(m_ln_amt1,'99,999,999.99')+'   ';
	 +tran(m_ln_amt2,'99,999,999.99')+'   ';
	 +tran(m_ln_amt3,'99,999,999.99')+'   ';
	 +tran(m_ln_amt4,'99,999,999.99')+'   '+tran(m_ln_amt5,'99,999,999.99')
	m_crow=m_crow+1
	m_t_loan1=m_t_loan1+m_ln_amt1
	m_t_loan2=m_t_loan2+m_ln_amt2
	m_t_loan3=m_t_loan3+m_ln_amt3
	m_t_loan4=m_t_loan4+m_ln_amt4
	m_t_loan5=m_t_loan5+m_ln_amt5
	m_p_loan1=m_p_loan1+m_ln_amt1
	m_p_loan2=m_p_loan2+m_ln_amt2
	m_p_loan3=m_p_loan3+m_ln_amt3
	m_p_loan4=m_p_loan4+m_ln_amt4
	m_p_loan5=m_p_loan5+m_ln_amt5
	skip
	if m_crow+6>58
		? repl('-',120)
		?space(18)+'      PAGE TOTAL... :  '+tran(m_p_loan1,'999,999,999.99');
		 +'  '+tran(m_p_loan2,'999,999,999.99')+'  ';
		 +tran(m_p_loan3,'999,999,999.99')+'  ';
		 +tran(m_p_loan4,'999,999,999.99')+'  ';
		 +tran(m_p_loan5,'999,999,999.99')
		? repl('=',120)
		store 0 to m_p_loan1,m_p_loan2,m_p_loan3,m_p_loan4,m_p_loan5		
		do p_autoall
	endi
enddo
?
?repl('-',120)
?space(18)+'DEDUCTIONS TOTAL... :  '+tran(m_t_loan1,'999,999,999.99');
 +'  '+tran(m_t_loan2,'999,999,999.99')+'  ';
 +tran(m_t_loan3,'999,999,999.99')+'  ';
 +tran(m_t_loan4,'999,999,999.99')+'  ';
 +tran(m_t_loan5,'999,999,999.99')
?repl('=',120)
retu

proc p_autoall
m_page=m_page+1
if m_page>1
	?chr(12)
endi
?m_company
?' AUTOMATIC LOAN DEDUCTIONS REPORT'
?
?alltrim(m_head)+spac(30-len(alltrim(m_head)))+space(82)+'Page '+str(m_page,3)
? repl('=',120)
?'EMP#   EMPLOYEE NAME                        SSS SALARY     SSS CALAMITY       HOUSING    COMPANY SALARY   MULTI-PURPOSE'
? repl('=',120)
m_crow=8

proc p_manuded
sele tmcard
go top
stor 0 to m_t_loan1,m_t_loan2,m_t_loan3,m_t_loan4,m_t_loan5,m_t_loan6,m_t_loan7,m_t_loan8,m_t_loan9,m_t_loan10
store 0 to m_p_loan1,m_p_loan2,m_p_loan3,m_p_loan4,m_p_loan5,m_p_loan6,m_p_loan7,m_p_loan8,m_p_loan9,m_p_loan10		
do whil .not. eof()
	if m_crow>58
		?repl('=',200)
		do p_manuall
	endi
	m_ln_amt1=oth_ded1
	m_ln_amt2=oth_ded2
	m_ln_amt3=oth_ded3
	m_ln_amt4=oth_ded4
	m_ln_amt5=oth_ded5
	m_ln_amt6=oth_ded6
	m_ln_amt7=oth_ded7
	m_ln_amt8=oth_ded8
	m_ln_amt9=oth_ded9
	m_ln_amt10=oth_ded10
	if m_ln_amt1<=0.and.m_ln_amt2<=0.and.m_ln_amt3<=0.and.m_ln_amt4<=0.and.;
	   m_ln_amt5<=0.and.m_ln_amt6<=0.and.m_ln_amt7<=0.and.m_ln_amt8<=0.and.;
		m_ln_amt9<=0.and.m_ln_amt10<=0
		skip
	loop
	endif
	m_emp_no=alltrim(emp_no)+space(7-len(alltrim(emp_no)))
	m_emp_nm=alltrim(emp_nm)+space(35-len(alltrim(emp_nm)))
	?m_emp_no+m_emp_nm+tran(m_ln_amt1,'99,999,999.99')+'   ';
	 +tran(m_ln_amt2,'99,999,999.99')+'   ';
	 +tran(m_ln_amt3,'99,999,999.99')+'   ';
	 +tran(m_ln_amt4,'99,999,999.99')+'   ';
	 +tran(m_ln_amt5,'99,999,999.99')+'   ';
	 +tran(m_ln_amt6,'99,999,999.99')+'   ';
	 +tran(m_ln_amt7,'99,999,999.99')+'   ';
	 +tran(m_ln_amt8,'99,999,999.99')+'   ';
	 +tran(m_ln_amt9,'99,999,999.99')+'   '+tran(m_ln_amt10,'99,999,999.99')
	m_crow=m_crow+1
	m_t_loan1=m_t_loan1+m_ln_amt1
	m_t_loan2=m_t_loan2+m_ln_amt2
	m_t_loan3=m_t_loan3+m_ln_amt3
	m_t_loan4=m_t_loan4+m_ln_amt4
	m_t_loan5=m_t_loan5+m_ln_amt5
	m_t_loan6=m_t_loan6+m_ln_amt6
	m_t_loan7=m_t_loan7+m_ln_amt7
	m_t_loan8=m_t_loan8+m_ln_amt8
	m_t_loan9=m_t_loan9+m_ln_amt9
	m_t_loan10=m_t_loan10+m_ln_amt10
	m_p_loan1=m_p_loan1+m_ln_amt1
	m_p_loan2=m_p_loan2+m_ln_amt2
	m_p_loan3=m_p_loan3+m_ln_amt3
	m_p_loan4=m_p_loan4+m_ln_amt4
	m_p_loan5=m_p_loan5+m_ln_amt5
	m_p_loan6=m_p_loan6+m_ln_amt6
	m_p_loan7=m_p_loan7+m_ln_amt7
	m_p_loan8=m_p_loan8+m_ln_amt8
	m_p_loan9=m_p_loan9+m_ln_amt9
	m_p_loan10=m_p_loan10+m_ln_amt10
	if m_crow+4>58	
		?repl('-',200)
		?space(23)+' PAGE TOTAL... :  '+tran(m_p_loan1,'999,999,999.99')+'  ';
		 +tran(m_p_loan2,'999,999,999.99')+'  '+tran(m_p_loan3,'999,999,999.99');
		 +'  '+tran(m_p_loan4,'999,999,999.99')+'  '+tran(m_p_loan5,'999,999,999.99');
		 +'  '+tran(m_p_loan6,'999,999,999.99')+'  '+tran(m_p_loan7,'999,999,999.99');
		 +'  '+tran(m_p_loan8,'999,999,999.99')+'  ';
		 +tran(m_p_loan9,'999,999,999.99')+'  '+tran(m_p_loan10,'999,999,999.99')
		?repl('=',200)
		store 0 to m_p_loan1,m_p_loan2,m_p_loan3,m_p_loan4,m_p_loan5,m_p_loan6,m_p_loan7,m_p_loan8,m_p_loan9,m_p_loan10		
		do p_manuall
	endi
	skip
enddo
?
?space(23)+'GRAND TOTAL... :  '+tran(m_t_loan1,'999,999,999.99')+'  ';
 +tran(m_t_loan2,'999,999,999.99')+'  '+tran(m_t_loan3,'999,999,999.99');
 +'  '+tran(m_t_loan4,'999,999,999.99')+'  '+tran(m_t_loan5,'999,999,999.99');
 +'  '+tran(m_t_loan6,'999,999,999.99')+'  '+tran(m_t_loan7,'999,999,999.99');
 +'  '+tran(m_t_loan8,'999,999,999.99')+'  ';
 +tran(m_t_loan9,'999,999,999.99')+'  '+tran(m_t_loan10,'999,999,999.99')
?repl('=',200)
?
retu

proc p_manuall
m_page=m_page+1
if m_page>1
	?chr(12)
endi
?m_company
?' MANUAL LOAN DEDUCTIONS REPORT'
?
?alltrim(m_head)+spac(30-len(alltrim(m_head)))+space(82)+'Page '+str(m_page,3)
? repl('=',200)
?'EMP#   EMPLOYEE NAME                      '+'      '+m_ded1+'     '+' '+m_ded2+'     '+;
  ' '+m_ded3+'     '+' '+m_ded4+'     '+' '+m_ded5+'     '+' '+m_ded6+'     '+' '+m_ded7+'     '+;
  ' '+m_ded8+'     '+' '+m_ded9+'     '+m_ded10
? repl('=',200)
* 1234   12345678901234567890123456789012   99,999,999.99
m_crow=8
m_nextpg=.f.
return


proc p_repded
para _m_field_nm,_m_ded_head
stor 0 to m_ttl
sele tmcard
go top
do whil .not. eof()
	if &_m_field_nm=0
		skip
		loop
	endi
	m_crow=60
	do whil .not. eof()
		if m_crow>58
			do p_dedhead
		endi
		if &_m_field_nm=0
			skip
			loop
		endi
		?emp_no+'   '+emp_nm+'  '+tran(&_m_field_nm,'999,999,999.99')
		m_crow=m_crow+1
		m_ttl=m_ttl+&_m_field_nm
		skip
	endd
	?
	?spac(33)+'TOTAL : '+tran(m_ttl,'999,999,999.99')
	?
	m_gtl=m_gtl+m_ttl
	exit
endd
retu

proc p_dedhead
m_page=m_page+1
if m_page>1
	?chr(12)
endi
?m_company
?_m_ded_head
?'For the period '+m_beg_date+' to '+m_end_date
?
?alltrim(m_head)+spac(30-len(alltrim(m_head)))+spac(17)+'Page '+str(m_page,3)
?repl('=',55)
?'EMP#   EMPLOYEE NAME                             AMOUNT'
?repl('=',55)
m_crow=8
m_nextpg=.f.
retu


text

EMP#   EMPLOYEE NAME                      SSS SALARY    SSS CALAMITY      HOUSING    COMPANY SALARY  MULTI-PURPOSE
1234   12345678901234567890123456789012  99,999,999.99  99,999,999.99  99,999,999.99  99,999,999.99  99,999,999.99  99,999,999.99  99,999,999.99  99,999,999.99  99,999,999.99  99,999,999.99  99,999,999.99  99,999,999.99  99,999,999.99  99,999,999.99  99,999,999.99

                  DEPARTMENT TOTAL... :  999,999,999.99

                       GRAND TOTAL... :  999,999,999.99  999,999,999.99  999,999,999.99  999,999,999.99  999,999,999.99


endtext