/*
PAYROLL SYSTEM
Program Name : Timecard Validation Report Generation
Program Code : Rpregist.prg
Author : SVC
*/

m_oldcol=setcolor()
set colo to (m_cnor)
do whil .t.
	set color to (m_cmes)
	f_bcln()
	m_spool:=.t.
	m_page :=0
	m_crow :=60
   m_app_period := ""
   m_ack_rec_nos :=space(30)
   m_exit := .f.
   m_ctr := 0

   m_scrn=savescreen(9,8,11,73)

	while .t.

      @ 9, 8 clear to 11,73
      @10,10 say "ACKNOWLEDGEMENT RECEIPTS NO.: " get m_ack_rec_nos
      read

	   f_setting()

   	set color to (m_cmes)
   	f_bcln()
   	if f_choose('Select:','CURRENT MONTH','PREV MONTH')
   		m_curmonth = .t.
   	else
   		m_curmonth = .f.
      endif

      if .not. m_curmonth

         f_bcln()
         m_period := space(6)

         do while .t.
         	@24,18 say 'ENTER PERIOD TO PROCESS (YYYYMM):' get m_period pict "999999"
            read
            if lastkey()= 27
               exit
            endif
            if len(alltrim(m_period)) = 6
               if f_ask("Process Summary for " + m_period + " ?")
                  if .not. file('&bpath\mar' + right(m_period,3) + '02.dbf')
		               f_err('REQUIRED FILES NOT IN BACKUP FOLDER.',.t.)
                  else
                     exit
                  endif
               endif
            endif
         enddo

         if lastkey()= 27
            exit
         endif

      	f_setting()

         m_trfile = "MAR" + right(m_period,3) + '02.dbf'

   		select 1
   		use '&bpath\'+'&m_trfile' alias XXX

			index on emp_name to &bpath\mbynm
   		set inde to &bpath\mbyemp

      	m_app_period := cmonth(ctod(right(m_period,2)+'/01/'+left(m_period,4))) ;
      	   +" "+left(m_period,4)

      else

         select 2
	   	if ! net_use('&dpath\sys_id',.t.,5)
	   		exit
	   	endif

      	m_app_period := cmonth(ctod(subs(str(100+pres_mo,3),2,2)+'/01/'+subs(str(year(end_date),4),3,2))) ;
            +" "+str(year(beg_date),4)

         use

	   	if ! net_use('&dpath\master',.t.,5)
	   		exit
	   	endif
	   	set index to &dpath\mbynm
	   	reindex

      endif

      dbgotop()

	   if ! f_askspool()
			m_spool := .f.
			if f_esc()
				exit
			endif
			set print on
			set devi to print
			set cons off
	   endif

		if f_esc()
			exit
		endif

		stor 0 to m_g_ps, m_g_es

  		do while ! eof()

			if m_crow>58
				do p_rephead
			endi

		   if m_medee > 0

            if trim(phic) <> ""
               _m_phic_no := left(trim(phic)+space(12),12)
            else
               _m_phic_no := left(trim(sss)+space(12),12)
            endif

            _m_msb := f_getmsb(m_medee)

   			?emp_nm+'  '+phic+'  '+str(_m_msb,3);
   			   +' '+tran(m_medee,"999,999.99");
   			   +' '+tran(m_meder,"999,999.99")
   			   //+' '+tran(m_medee+m_meder,"9,999.99")

            m_ctr  := m_ctr + 1

            m_crow = m_crow + 1

   		   m_g_ps := m_g_ps + m_medee
	   	   m_g_es := m_g_es + m_meder

         endif

			skip

      enddo

		if m_crow+3>60
			do p_rephead
		endi

   	?repl('-',81)

      ?"Applicable Period: " + left(m_app_period,3)+"-"+right(m_app_period,4)

   	??space(12);
   		+"      TOTAL :"+tran(m_g_ps,"999,999.99");
   		+tran(m_g_es,"9999,999.99")

      ?"Remitted Amount  : " + tran(m_g_ps+m_g_es,"999,999.99")

   	??space(10);
   		+"TOTAL PS+ES :"+tran(m_g_ps+m_g_es,"999,999.99")


      ?"Ack.Receipts Nos.: " + alltrim(m_ack_rec_nos)
      ?"No.Of Employyes  : " + alltrim(str(m_ctr))

   	?repl('-',81)

		?chr(12)

		exit

	end while


	restscreen(9,8,11,73,m_scrn)

	if lastkey()=27
		exit
	endif

   if m_exit
      exit
   endif

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
set color to (m_oldcol)
release all
return

proc p_rephead
m_page=m_page+1
if m_page>1
	?chr(12)
endi
?m_company+space(74-len(m_company))+"Page "+tran(m_page,"99")
?"Address   : "+m_comp_addr
?"Tel.No.   : "+m_comp_tel
?"PHILHEALTH: "+left(trim(m_comp_phic)+space(40),40)+"EMPLOYER TYPE: Private"
?"TIN       : "+left(trim(m_comp_tin )+space(40),40)+"REPORT TYPE  : Regular RF-1"
?
?"APPLICABLE PERIOD : "+m_app_period
?
?"SURNAME        GIVEN NAME         PHILHEALTH    MSB ----PS---- ----ES----  STATUS"
//12345678901234512345678901234512--123456789012--MSB-999,999.99-999,999.99--XXX
//12345678901234512345678901234512--1234567890 OTAL:B-999,999.99-999,999.99--XXX
?repl('=',81)
m_crow  :=10
m_nextpg:=.f.
return

function f_getmsb(_m_ps)
_m_return := 1
if _m_ps     = 50.00
   _m_return := 1
elseif _m_ps = 62.50
   _m_return := 2
elseif _m_ps = 75.00
   _m_return := 3
elseif _m_ps = 87.50
   _m_return := 4
elseif _m_ps =100.00
   _m_return := 5
elseif _m_ps =112.50
   _m_return := 6
elseif _m_ps =125.00
   _m_return := 7
elseif _m_ps =137.50
   _m_return := 8
elseif _m_ps =150.00
   _m_return := 9
elseif _m_ps =162.50
   _m_return :=10
elseif _m_ps =175.00
   _m_return :=11
elseif _m_ps =187.50
   _m_return :=12
elseif _m_ps =200.00
   _m_return :=13
elseif _m_ps =212.50
   _m_return :=14
elseif _m_ps =225.00
   _m_return :=15
elseif _m_ps =237.50
   _m_return :=16
elseif _m_ps =250.00
   _m_return :=17
elseif _m_ps =262.50
   _m_return :=18
elseif _m_ps =275.00
   _m_return :=19
elseif _m_ps =287.50
   _m_return :=20
elseif _m_ps =300.00
   _m_return :=21
elseif _m_ps =312.50
   _m_return :=22
elseif _m_ps =325.00
   _m_return :=23
elseif _m_ps =337.50
   _m_return :=24
elseif _m_ps =350.00
   _m_return :=25
elseif _m_ps =362.50
   _m_return :=26
elseif _m_ps =375.00
   _m_return :=27
elseif _m_ps >375.00
   _m_return :=28
endif
return(_m_return)
