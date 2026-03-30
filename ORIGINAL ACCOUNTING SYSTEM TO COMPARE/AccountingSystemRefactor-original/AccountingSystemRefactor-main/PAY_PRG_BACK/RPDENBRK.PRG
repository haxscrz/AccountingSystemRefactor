* PAYROLL SYSTEM
* Program Name : Compute and Print the Denomination Breakdown
* Program Code : Rpdenbrk.prg
* Author : SVC
* Date Started : June 04, 1994
* Date Finished: June 04, 1994
*************************************************************

m_oldcol=setcolor()
do whil .t.
	f_bcln()
	m_spool=.t.
	sele 1
	if .not. net_use('&dpath\sys_id',.t.,5)
		exit
	endi
	if .not. fil_lock(5)
		exit
	endi
	m_da1=dtoc(beg_date)
	m_da2=dtoc(end_date)	
	sele 2
	if .not. net_use('&dpath\break',.t.,5)
		exit
	endi
	zap
	sele 3
	if .not. net_use('&dpath\tmcard',.t.,5)
		exit
	endi
	m_with500=.F.
   m_with500=f_ask('DENOMINATION WITH P500.00 BILL?')
	f_mess('COMPUTATION IN PROCESS...',.f.)
   if .not. f_askspool()
		m_spool=.f.
		if lastkey()=27
			exit
		endi
		set print on
		set devi to print
   endif
	if lastkey()=27
		exit
	endif
	set cons off
   stor 0 to bb,b1,b2,b3,b4,b5,b6,b7,b8,b9,b10,b11,b12
   sele 3
   go top
   do whil .not. eof()
		if net_pay > 0
			store 0 to a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,aa,cc,;
				c1,c2,c3,c4,c5,c6,c7,c8,c8,c10,c11,c12
			net_p = net_pay*100+.005
			if m_with500
				aa = int(net_p/50000)
   		   bb = bb + aa
      		cc = net_p-(aa*50000)
				a1 = int(cc/10000)
   		   b1 = b1 + a1
				c1 = cc-(a1*10000)
			else
				a1 = int(net_p/10000)
   		   b1 = b1 + a1
      		c1 = net_p-(a1*10000)
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
		endi
		skip
	endd
	sele break
	appe blan
	repl t50000 with bb, t10000 with b1,t5000 with b2, t2000 with b3,;
		t1000 with b4, t500 with b5, t200 with b6, t100 with b7,;
		t50 with b8, t25 with b9, t10 with b10, t05 with b11, t01 with b12

	* PAY_BRK
	sele break
	? chr(27)+chr(64)
	? chr(18)
	xa = '999,999'
	xb = '99,999,999.99'
	aa = t50000 * 500
	a1 = t10000 * 100
	a2 = t5000 * 50
	a3 = t2000 * 20
	a4 = t1000 * 10
	a5 = t500 * 5
	a6 = t200 * 2
	a7 = t100 * 1
	a8 = t50 * .5
	a9 = t25 * .25
	a10= t10 * .10
	a11= t05 * .05
	a12= t01 * .01
	atotal = aa+a1+a2+a3+a4+a5+a6+a7+a8+a9+a10+a11+a12
	?m_company
	?'DENOMINATION BREAKDOWN'
	?'Payroll Period: '+m_da1+' TO '+m_da2
	?
	?m_head
	?repl('=',47)
	?'DENOMINATION   NO. OF PCS.            AMOUNT'
	?repl('=',47)
	?
	if m_with500
		?'P500.00'+spac(10)+tran(t50000,xa)+spac(10)+tran(aa,xb)
	endi
	?' 100.00'+spac(10)+tran(t10000,xa)+spac(10)+tran(a1,xb)
	?'  50.00'+spac(10)+tran( t5000,xa)+spac(10)+tran(a2,xb)
	?'  20.00'+spac(10)+tran( t2000,xa)+spac(10)+tran(a3,xb)
	?'  10.00'+spac(10)+tran( t1000,xa)+spac(10)+tran(a4,xb)
	?'   5.00'+spac(10)+tran(  t500,xa)+spac(10)+tran(a5,xb)
	?'   2.00'+spac(10)+tran(  t200,xa)+spac(10)+tran(a6,xb)
	?'   1.00'+spac(10)+tran(  t100,xa)+spac(10)+tran(a7,xb)
	?'   0.50'+spac(10)+tran(   t50,xa)+spac(10)+tran(a8,xb)
	?'   0.25'+spac(10)+tran(   t25,xa)+spac(10)+tran(a9,xb)
	?'   0.10'+spac(10)+tran(   t10,xa)+spac(10)+tran(a10,xb)
	?'   0.05'+spac(10)+tran(   t05,xa)+spac(10)+tran(a11,xb)
	?'   0.01'+spac(10)+tran(   t01,xa)+spac(10)+tran(a12,xb)
	?spac(34)+'-------------'
	?spac(34)+tran(atotal,xb)
	?spac(34)+'============='
	? chr(27)+chr(64)
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
endd
clos all
set colo to (m_oldcol)
rele all
retu
