/*
PAYROLL SYSTEM
Program Name : Monthly Regular Deductions Report
Program Code : Rpsssmed.prg
Author       : SVC
Date Started : Aug 18, 1999
Date Finished: Aug 18, 1999
*/

para m_which
m_oldcol:=setcolor()
setcolor(m_cnor)
while .t.
   f_bcln()
	m_spool=.t.
	m_page=0
	m_crow=60
	m_fig='999,999.99'
	f_setting()
	select 1
	if .not. net_use('&dpath\sys_id',.t.,5)
		exit
	endif
	if .not. fil_lock(5)
		exit
	endif
	m_pres_mo=alltrim(cmonth(ctod(subs(str(100+pres_mo,3),2,2)+'/01/'+subs(str(year(end_date),4),3,2))))
	m_pres_yr=str(year(beg_date),4)
	sele 3
	if .not. net_use('&dpath\dept',.t.,5)
		exit
	endi
	set inde to &dpath\dbydep
	reindex
	select 2
	if .not. net_use('&dpath\master',.t.,5)
		exit
	endif

	if f_choose('SELECT :','BY DEPARTMENT','BY NAME')
		set inde to &dpath\mbydep
		m_bydep=.t.
	else
		set inde to &dpath\mbynm
		m_bydep=.f.
	endif

	reindex

	dbgotop()

	if ! f_askspool()
		m_spool:=.f.
		if lastkey()=27
			exit
		endif
		set print on
		set devi to print
		set cons off
	endif

	if lastkey()=27
		exit
	endif

	m_t_sse:=m_t_ssr:=m_t_mede:=m_t_medr:=m_t_ecer:=0
	m_g_sse:=m_g_ssr:=m_g_mede:=m_g_medr:=m_g_ecer:=0
	m_g_1stgrs:=m_g_2ndgrs:=0

	select master

	if m_bydep

		while ! eof()

			if m_crow>58
				do p_mssmedhead
			endif

			//if m_gross-m_othp2-m_othp4 <= 0
			if m_basic <= 0
				skip
				loop
			endif

			m_dep_no:=dep_no

			select dept

			seek m_dep_no

			if ! eof()
				m_dep_nm=dep_nm
			else
				m_dep_nm=''
			endif

			select master

			if m_crow+3>58
				do p_mssmedhead
			endif
			?
			?'Dept.No.: '+m_dep_no+' - '+m_dep_nm
			?
			m_crow += 3

			while dep_no==m_dep_no .and. ! eof()

				if m_crow+2>58
					do p_mssmedhead
				endi

				//if m_gross-m_othp2-m_othp4 <= 0
				if m_basic <= 0
					skip
					loop
				endi

            do case
               case m_which=='SSS'
	   	   		m_ttl=m_ssee+m_sser+m_ecer
      				//?emp_no+'   '+emp_nm+' '+tran(m_gross-m_othp2-m_othp4,'99,999,999.99')+'  '
      				?emp_no+'   '+emp_nm+' '+tran(m_basic,'99,999,999.99')+'  ';
		      			+tran(m_ssee,m_fig)+' '+tran(m_sser,m_fig)+' ';
				      	+tran(m_ssee+m_sser,'9,'+m_fig);
		      			+'  '+tran(m_ecer,m_fig)+'   '+tran(m_ttl,m_fig)
               otherwise
   	   			m_ttl=m_medee+m_meder
      				//?emp_no+'   '+emp_nm+' '+tran(m_gross-m_othp2-m_othp4,'99,999,999.99')+'  '
      				?emp_no+'   '+emp_nm+' '+tran(m_basic,'99,999,999.99')+'  ';
		      			+tran(m_medee,m_fig)+' '+tran(m_meder,m_fig)+' ';
				         +'   '+tran(m_ttl,m_fig)
            endcase

				m_crow ++

				m_t_sse +=m_ssee
				m_t_ssr +=m_sser
				m_t_mede+=m_medee
				m_t_medr+=m_meder
				m_t_ecer+=m_ecer

				skip

			end while

			if dep_no#m_dep_no
				if m_crow+4>58
					do p_mssmedhead
				endi
				?
				do case
					case m_which=='SSS'
						?repl('=',117)
					case m_which=='MED'
						?repl('=',93)
				endcase

  				?spac(34)+'DEPARTMENT TOTAL...    '

				do case
					case m_which='SSS'
		      		m_d_ttl := m_t_sse+m_t_ssr+m_t_ecer
				      ??tran(m_t_sse,m_fig)+' '+tran(m_t_ssr,m_fig)+' ';
      					+tran(m_t_sse+m_t_ssr,'9,'+m_fig)+'  ';
      					+tran(m_t_ecer,m_fig)

					case m_which='MED'
		      		m_d_ttl=m_t_mede+m_t_medr
				      ??tran(m_t_mede,m_fig)+' '+tran(m_t_medr,m_fig)+' '

				endcase

				??tran(m_d_ttl,'99,999,999.99')

				do case
					case m_which=='SSS'
						?repl('=',117)
					otherwise &&'MED'
						?repl('=',93)
				endcase

				m_crow += 4
				m_g_sse  += m_t_sse
				m_g_ssr  += m_t_ssr
				m_g_mede += m_t_mede
				m_g_medr += m_t_medr
				m_g_ecer += m_t_ecer

				m_t_sse:=m_t_ssr:=m_t_mede:=m_t_medr:=m_t_ecer:=0

			endif
		enddo

	else
		select master
      dbgotop()

		m_pg_sse:=m_pg_ssr:=m_pg_mede:=m_pg_medr:=m_pg_ecer:=m_pg_ttl:=0

		while ! eof()

			if m_crow>58
				do p_mssmedhead
			endif
			//if m_gross - m_othp2 - m_othp4 <= 0 .or. (m_ssee+m_sser+m_medee+m_meder+m_ecer=0)
			if m_basic <= 0 .or. (m_ssee+m_sser+m_medee+m_meder+m_ecer=0)
				skip
				loop
			endif

			//?sss+'   '+emp_nm+' '+tran(m_gross-m_othp2-m_othp4,'99,999,999.99')+'  '
			?sss+'   '+emp_nm+' '+tran(m_basic,'99,999,999.99')+'  '

			do case
				case m_which='SSS'
      			m_ttl:=m_ssee+m_sser+m_ecer
               ??tran(m_ssee,m_fig)+' '+tran(m_sser,m_fig)+' ';
				      +tran(m_ssee+m_sser,'9,'+m_fig)+'  '+tran(m_ecer,m_fig)

				case m_which='MED'
      			m_ttl:=m_medee+m_meder
               ??tran(m_medee,m_fig)+' '+tran(m_meder,m_fig)+' '

			endcase

			??tran(m_ttl,'99,999,999.99')

			m_crow++

			m_g_sse  +=m_ssee
			m_g_ssr  +=m_sser
			m_g_mede +=m_medee
			m_g_medr +=m_meder
			m_g_ecer +=m_ecer

			m_pg_sse +=m_ssee
			m_pg_ssr +=m_sser
			m_pg_mede+=m_medee
			m_pg_medr+=m_meder
			m_pg_ecer+=m_ecer

			skip

			if m_crow+3 > 58 .or. eof()

				?
				if m_bydep
					?spac(43)+' PAGE TOTAL...  '
				else
					?spac(47)+' PAGE TOTAL...  '
				endif

            do case
               case m_which=='SSS'
         			??tran(m_pg_sse,m_fig)+' '+tran(m_pg_ssr,m_fig)+' ';
			      		+tran(m_pg_sse+m_pg_ssr,'9,'+m_fig);
      					+'  '+tran(m_pg_ecer,m_fig)
      				m_pg_ttl:=m_pg_sse+m_pg_ssr+m_pg_ecer

               case m_which=='MED'
			      	??tran(m_pg_mede,m_fig)+' '+tran(m_pg_medr,m_fig)+' '
      				m_pg_ttl:=m_pg_mede+m_pg_medr

            endcase

				??tran(m_pg_ttl,'99,999,999.99')

				m_pg_sse:=m_pg_ssr:=m_pg_mede:=m_pg_medr:=m_pg_ecer:=m_pg_ttl:=0

				m_crow += 3

			endif

		end while

	endif

	if m_crow+3>58
		do p_mssmedhead
	endif

	?
	if m_bydep
		?spac(39)+'GRAND TOTAL...    '
	else
		?spac(47)+'GRAND TOTAL...  '
	endif

	do case
		case m_which=='SSS'
      	??tran(m_g_sse,m_fig)+' '+tran(m_g_ssr,m_fig)+' ';
		      +tran(m_g_sse+m_g_ssr,'9,'+m_fig)+'  '+tran(m_g_ecer,m_fig)
         m_g_ttl:=m_g_sse+m_g_ssr+m_g_ecer

      case m_which=='MED'
		   ??tran(m_g_mede,m_fig)+' '+tran(m_g_medr,m_fig)+' '
      	m_g_ttl:=m_g_mede+m_g_medr

   endcase

	??tran(m_g_ttl,'99,999,999.99')

	if m_bydep
		do case
			case m_which='SSS'
				?repl('=',117)
			case m_which='MED'
				?repl('=',93)
		endcase

	else
		do case
			case m_which='SSS'
				?repl('=',124)
			case m_which='MED'
				?repl('=',99)
		endcase
	endif

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
dbcloseall()
setcolor(m_oldcol)
return


proc p_mssmedhead
m_page=m_page+1
if m_page>1
	?chr(12)
endi
?m_company
?m_comp_addr
?'SSS ID NO.: '+m_comp_sss
if m_bydep
	do case
		case m_which='SSS'
         ?'MONTHLY SSS & EC CONTRIBUTIONS'
         ?'For the month of '+m_pres_mo+' '+m_pres_yr
         ?
			?alltrim(m_head)+spac(30-len(alltrim(m_head)))+space(79)+'Page '+str(m_page,3)
			?repl('=',117)
			?space(55)+'!-------------S---S---S-------------!----E-C----!----TOTAL---!'
         ?"EMP#   EMPLOYEE NAME                     GROSS PAY     !    'ee        'er        Total    !    'er    !            !"
			?repl('=',117)

		case m_which='MED'
         ?'MONTHLY PHIC CONTRIBUTIONS REPORT'
         ?'For the month of '+m_pres_mo+' '+m_pres_yr
         ?
			?alltrim(m_head)+spac(30-len(alltrim(m_head)))+space(55)+'Page '+str(m_page,3)
			?repl('=',93)
         ?space(56)+"!------------PHILHEALTH-------------!"
         ?"EMP#   EMPLOYEE NAME                       GROSS PAY    !    'ee        'er        Total    !"
			?repl('=',93)
	endcase

else
	do case
		case m_which='SSS'
         ?'MONTHLY SSS & EC CONTRIBUTIONS'
         ?'For the month of '+m_pres_mo+' '+m_pres_yr
         ?
			?alltrim(m_head)+spac(30-len(alltrim(m_head)))+space(86)+'Page '+str(m_page,3)
			?repl('=',124)
			?space(62)+'!-------------S---S---S-------------!----E-C----!----TOTAL---!'
         ?"SSS NUMBER     EMPLOYEE NAME                     GROSS PAY    !    'ee        'er        Total    !    'er    !            !"
			?repl('=',124)

		case m_which='MED'
         ?'MONTHLY PHIC CONTRIBUTIONS REPORT'
         ?'For the month of '+m_pres_mo+' '+m_pres_yr
         ?
			?alltrim(m_head)+spac(31-len(alltrim(m_head)))+space(60)+'Page '+str(m_page,3)
			?repl('=',99)
			?space(62)+'!-------------PHILHEALTH------------!'
         ?"SSS NUMBER     EMPLOYEE NAME                     GROSS PAY    !    'ee        'er        Total    !"
			?repl('=',99)

	endcase

endif
m_crow:=11
m_nextpg:=.f.
return
