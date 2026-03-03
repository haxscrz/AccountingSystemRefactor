* PAYROLL SYSTEM
* Program Name : Monthly Regular Deductions Report
* Program Code : Rpmonsss.prg
* Author       : SVC
* Date Started : June 24, 1994
* Date Finished: June 24, 1994
******************************************************

para m_which
m_oldcol=setcolor()
set colo to (m_cnor)
do while .t.
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
	if m_which='TAX'
		set inde to &dpath\mbynm
		if f_ask('With Breakdown of 1st and 2nd Payroll ?')
			m_withbreak=.t.
			select 4
			if .not. net_use('&dpath\tmcard',.t.,5)
				exit
			endif
			set inde to &dpath\tbyemp
		else
			m_withbreak=.f.
		endif
	else
		if f_choose('SELECT :','BY DEPARTMENT','BY NAME')
			set inde to &dpath\mbydep
			m_bydep=.t.
		else
			set inde to &dpath\mbynm
			m_bydep=.f.
		endif
	endif
	rein
	go top
	if .not. f_askspool()
		m_spool=.f.
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
	stor 0 to m_t_sse, m_t_ssr, m_t_mede, m_t_medr, m_t_pgee, m_t_pger,;
		m_t_ecer, m_t_tax
	stor 0 to m_g_sse, m_g_ssr, m_g_mede, m_g_medr, m_g_pgee, m_g_pger,;
		m_g_ecer, m_g_tax, m_g_grs
	stor 0 to m_g_1stgrs, m_g_1sttax, m_g_2ndgrs, m_g_2ndtax

	select 2 &&master
	if m_which='TAX'
		do while .not. eof()
			if m_crow>58
				if m_withbreak
					?repl('=',140)
				else
					?repl('=',76)
				endif
				do p_mtxhead
			endi
			if m_gross<=0
				skip
				loop
			endi
			?emp_nm+'   '+subs(alltrim(tan),1,11)+space(11-len(subs(alltrim(tan),1,11)))
			if m_withbreak
				m_emp_no=emp_no
				m_1stgrs=0
				m_1sttax=0
				m_2ndgrs=0
				m_2ndtax=0
				m_m_gross=m_gross
				m_m_tax=m_tax
				m_m_othp2=m_othp2
				m_m_leave=m_leave

				select tmcard
				seek m_emp_no
				if .not. eof()
					m_1stgrs=m_m_gross-m_m_othp2-m_m_leave-(grs_pay-oth_pay2-oth_pay4-lv_pay)
					m_1sttax=m_m_tax-tax_ee
					m_2ndgrs=grs_pay-oth_pay2-oth_pay4-lv_pay
					m_2ndtax=tax_ee
				else
					m_1sttax=m_m_tax
				endif

				select 2 &&master
				??'   '+tran(m_1stgrs,'9,'+m_fig)+'   '+tran(m_2ndgrs,'9,'+m_fig)
				??'   '+tran(m_gross-m_othp2-m_leave,'999,'+m_fig)
				??'   '+tran(m_1sttax,'999,'+m_fig)+'   '+tran(m_2ndtax,'9,'+m_fig)
				??'   '+tran(m_tax,'9,'+m_fig)

				m_g_1stgrs=m_g_1stgrs+m_1stgrs
				m_g_1sttax=m_g_1sttax+m_1sttax
				m_g_2ndgrs=m_g_2ndgrs+m_2ndgrs
				m_g_2ndtax=m_g_2ndtax+m_2ndtax
			else
				??'   '+tran(m_gross-m_othp2-m_leave,'9,'+m_fig)+'   '+tran(m_tax,'9,'+m_fig)
			endif
			m_crow=m_crow+1

			m_g_grs=m_g_grs+m_gross-m_othp2-m_leave
			m_g_tax=m_g_tax+m_tax
			*if m_bontot>m_tax_bon
			*	m_g_grs=m_g_grs+(m_bontot-m_tax_bon)
			*	m_g_tax=m_g_tax+m_bontax
			*endif
			skip

		enddo
		if m_crow+4>58
			if m_withbreak
				?repl('=',140)
			else
				?repl('=',76)
			endif
			do p_mtxhead
		endif
		if m_withbreak
			?repl('=',140)
		else
			?repl('=',76)
		endif
		?
		?spac(27)+'TOTAL TAX WITHHELD : '
		if m_withbreak
			??tran(m_g_1stgrs,'99,'+m_fig)+'  '+tran(m_g_2ndgrs,'99,'+m_fig);
			 +'    '+tran(m_g_grs,'99,'+m_fig)+'    '+tran(m_g_1sttax,'99,'+m_fig)+'  ';
			 +tran(m_g_2ndtax,'99,'+m_fig)+'  '+tran(m_g_tax,'99,'+m_fig)
		else
			??tran(m_g_grs,'99,'+m_fig)+'  '+tran(m_g_tax,'99,'+m_fig)
		endif
		?

	else
		if m_bydep
			do whil .not. eof()
				if m_crow>58
					do p_msshead
				endif
				if m_gross<=0
					skip
					loop
				endif
				m_dep_no=dep_no
				sele dept
				seek m_dep_no
				if .not. eof()
					m_dep_nm=dep_nm
				else
					m_dep_nm=''
				endif
				sele master
				if m_crow+3>58
					do p_msshead
				endif
				?
				?'Dept.No.: '+m_dep_no+' - '+m_dep_nm
				?
				m_crow=m_crow+3
				do whil dep_no=m_dep_no .and. .not. eof()
					if m_crow+2>58
						do p_msshead
					endi
					if m_gross<=0
						skip
						loop
					endi
					m_ttl=m_ssee+m_sser+m_medee+m_meder+m_ecer
					m_emp_no=alltrim(emp_no)+space(6-len(alltrim(emp_no)))
					m_sss_no=sss

					//?m_emp_no+' '+emp_nm+' '+m_sss_no+' '+tran(m_gross-m_othp2,'99,999,999.99')+'  '

					?m_emp_no+' '+emp_nm+' '+m_sss_no+' '+tran(m_basic,'99,999,999.99')+'  ';
						+tran(m_ssee,m_fig)+' '+tran(m_sser,m_fig)+' ';
						+tran(m_ssee+m_sser,'9,'+m_fig)+'  '+tran(m_medee,m_fig);
						+' '+tran(m_meder,m_fig)+' '+tran(m_medee+m_meder,'9,'+m_fig);
						+'  '+tran(m_ecer,m_fig)
					do case
						case m_which='ALL'
							??'  '+tran(m_pgee,m_fig)+' '+tran(m_pger,m_fig)+' ';
							+tran(m_pgee+m_pger,'9,'+m_fig)+'   ';
							+tran(m_tax,'9,'+m_fig)
							m_ttl=m_ttl+m_pgee+m_pger+m_tax

						case m_which='PBG'
							??'  '+tran(m_pgee,m_fig)+' '+tran(m_pger,m_fig)+' ';
							+tran(m_pgee+m_pger,'9,'+m_fig)
							m_ttl=m_ttl+m_pgee+m_pger

					endcase
					??'   '+tran(m_ttl,m_fig)
					m_crow=m_crow+1
					m_t_sse=m_t_sse+m_ssee
					m_t_ssr=m_t_ssr+m_sser
					m_t_mede=m_t_mede+m_medee
					m_t_medr=m_t_medr+m_meder
					m_t_pgee=m_t_pgee+m_pgee
					m_t_pger=m_t_pger+m_pger
					m_t_ecer=m_t_ecer+m_ecer
					m_t_tax=m_t_tax+m_tax
					skip
				enddo
				if dep_no#m_dep_no
					if m_crow+4>58
						do p_msshead
					endi
					?
					*?repl('-',216)
					do case
						case m_which='ALL'
							?repl('=',204)
						case m_which='PBG'
							?repl('=',189)
						otherwise &&'SSS'
							?repl('=',153)
					endcase

					?spac(47)+'DEPARTMENT TOTAL...  '

					m_d_ttl=m_t_sse+m_t_ssr+m_t_mede+m_t_medr+m_t_ecer

					??tran(m_t_sse,m_fig)+' '+tran(m_t_ssr,m_fig)+' ';
						+tran(m_t_sse+m_t_ssr,'9,'+m_fig)+'  '+tran(m_t_mede,m_fig);
						+' '+tran(m_t_medr,m_fig)+' ';
						+tran(m_t_mede+m_t_medr,'9,'+m_fig)+'  ';
						+tran(m_t_ecer,m_fig)

					do case
						case m_which='ALL'
							??'  '+tran(m_t_pgee,m_fig)+' '+tran(m_t_pger,m_fig)+' ';
							+tran(m_t_pgee+m_t_pger,'9,'+m_fig)+'   ';
							+tran(m_t_tax,'9,'+m_fig)
							m_d_ttl=m_d_ttl+m_t_pgee+m_t_pger+m_t_tax

						case m_which='PBG'
							??'  '+tran(m_t_pgee,m_fig)+' '+tran(m_t_pger,m_fig)+' ';
							+tran(m_t_pgee+m_t_pger,'9,'+m_fig)
							m_d_ttl=m_d_ttl+m_t_pgee+m_t_pger

					endcase

					??tran(m_d_ttl,'99,999,999.99')

					do case
						case m_which='ALL'
							?repl('=',204)
						case m_which='PBG'
							?repl('=',189)
						otherwise &&'SSS'
							?repl('=',153)
					endcase

					*?repl('-',216)

					m_crow=m_crow+4
					m_g_sse=m_g_sse+m_t_sse
					m_g_ssr=m_g_ssr+m_t_ssr
					m_g_mede=m_g_mede+m_t_mede
					m_g_medr=m_g_medr+m_t_medr
					m_g_pgee=m_g_pgee+m_t_pgee
					m_g_pger=m_g_pger+m_t_pger
					m_g_ecer=m_g_ecer+m_t_ecer
					m_g_tax=m_g_tax+m_t_tax
					stor 0 to m_t_sse, m_t_ssr, m_t_mede, m_t_medr, m_t_pgee,;
						m_t_pger, m_t_ecer, m_t_tax
				endif
			enddo
		else
			sele master
			store 0 to m_pg_sse, m_pg_ssr, m_pg_mede, m_pg_medr,;
				m_pg_ecer, m_pg_pgee, m_pg_pger, m_pg_tax, m_pg_ttl

			do whil .not. eof()

				if m_crow>58
					do p_msshead
				endif

				if m_gross<=0 .or. (m_ssee+m_sser+m_medee+m_meder+m_ecer=0)
					skip
					loop
				endif

				m_ttl=m_ssee+m_sser+m_medee+m_meder+m_ecer
				*?emp_no+'   '+emp_nm+' '+tran(m_gross-m_othp2,'99,999,999.99')'  ';
				//?sss+'   '+emp_nm+' '+tran(m_gross-m_othp2,'99,999,999.99')+'  '

				?sss+'   '+emp_nm+' '+tran(m_basic,'99,999,999.99')+'  ';
					+tran(m_ssee,m_fig)+' '+tran(m_sser,m_fig)+' ';
					+tran(m_ssee+m_sser,'9,'+m_fig)+'  '+tran(m_medee,m_fig);
					+' '+tran(m_meder,m_fig)+' '+tran(m_medee+m_meder,'9,'+m_fig);
					+'  '+tran(m_ecer,m_fig)

				do case
					case m_which='ALL'
						??'  '+tran(m_pgee,m_fig)+' '+tran(m_pger,m_fig)+' ';
						+tran(m_pgee+m_pger,'9,'+m_fig)+'   ';
						+tran(m_tax,'9,'+m_fig)
						m_ttl=m_ttl+m_pgee+m_pger+m_tax
					case m_which='PBG'
						??'  '+tran(m_pgee,m_fig)+' '+tran(m_pger,m_fig)+' ';
						+tran(m_pgee+m_pger,'9,'+m_fig)
						m_ttl=m_ttl+m_pgee+m_pger
				endcase

				??'   '+tran(m_ttl,m_fig)
				m_crow=m_crow+1
				m_g_sse=m_g_sse+m_ssee
				m_g_ssr=m_g_ssr+m_sser
				m_g_mede=m_g_mede+m_medee
				m_g_medr=m_g_medr+m_meder
				m_g_pgee=m_g_pgee+m_pgee
				m_g_pger=m_g_pger+m_pger
				m_g_ecer=m_g_ecer+m_ecer
				m_g_tax=m_g_tax+m_tax
				m_pg_sse=m_pg_sse+m_ssee
				m_pg_ssr=m_pg_ssr+m_sser
				m_pg_mede=m_pg_mede+m_medee
				m_pg_medr=m_pg_medr+m_meder
				m_pg_pgee=m_pg_pgee+m_pgee
				m_pg_pger=m_pg_pger+m_pger
				m_pg_ecer=m_pg_ecer+m_ecer
				m_pg_tax=m_pg_tax+m_tax
				skip
				****

				if m_crow+3 > 58 .or. eof()
					m_pg_ttl=m_g_sse+m_g_ssr+m_g_mede+m_g_medr+m_g_ecer
					?
					if m_bydep
						?spac(43)+' PAGE TOTAL...  '
					else
						?spac(47)+' PAGE TOTAL...  '
					endif
					??tran(m_pg_sse,m_fig)+' '+tran(m_pg_ssr,m_fig)+' ';
						+tran(m_pg_sse+m_pg_ssr,'9,'+m_fig)+'  '+tran(m_pg_mede,m_fig);
						+' '+tran(m_pg_medr,m_fig)+' ';
						+tran(m_pg_mede+m_pg_medr,'9,'+m_fig)+'  ';
						+tran(m_pg_ecer,m_fig)
					do case
						case m_which='ALL'
							??'  '+tran(m_pg_pgee,m_fig)+' '+tran(m_pg_pger,m_fig)+' ';
								+tran(m_pg_pgee+m_pg_pger,'9,'+m_fig)+'   ';
								+tran(m_pg_tax,'9,'+m_fig)
							m_pg_ttl=m_pg_ttl+m_pg_pgee+m_pg_pger+m_pg_tax
						case m_which='PBG'
							??'  '+tran(m_pg_pgee,m_fig)+' '+tran(m_pg_pger,m_fig)+' ';
								+tran(m_pg_pgee+m_g_pger,'9,'+m_fig)
							m_pg_ttl=m_pg_ttl+m_pg_pgee+m_pg_pger
					endcase
					??tran(m_pg_ttl,'99,999,999.99')
					store 0 to m_pg_sse, m_pg_ssr, m_pg_mede, m_pg_medr,;
						m_pg_ecer, m_pg_pgee, m_pg_pger, m_pg_tax, m_pg_ttl
					m_crow=m_crow+3
				endif
			enddo
		endif
		if m_crow+3>58
			do p_msshead
		endif
		m_g_ttl=m_g_sse+m_g_ssr+m_g_mede+m_g_medr+m_g_ecer
		?
		if m_bydep
			?spac(39)+'GRAND TOTAL...  '
		else
			?spac(47)+'GRAND TOTAL...  '
		endif
		??tran(m_g_sse,m_fig)+' '+tran(m_g_ssr,m_fig)+' ';
			+tran(m_g_sse+m_g_ssr,'9,'+m_fig)+'  '+tran(m_g_mede,m_fig);
			+' '+tran(m_g_medr,m_fig)+' ';
			+tran(m_g_mede+m_g_medr,'9,'+m_fig)+'  ';
			+tran(m_g_ecer,m_fig)
		do case
			case m_which='ALL'
				??'  '+tran(m_g_pgee,m_fig)+' '+tran(m_g_pger,m_fig)+' ';
					+tran(m_g_pgee+m_g_pger,'9,'+m_fig)+'   ';
					+tran(m_g_tax,'9,'+m_fig)
				m_g_ttl=m_g_ttl+m_g_pgee+m_g_pger+m_g_tax
			case m_which='PBG'
				??'  '+tran(m_g_pgee,m_fig)+' '+tran(m_g_pger,m_fig)+' ';
					+tran(m_g_pgee+m_g_pger,'9,'+m_fig)
				m_g_ttl=m_g_ttl+m_g_pgee+m_g_pger
		endcase
		??tran(m_g_ttl,'99,999,999.99')
		if m_bydep
			do case
				case m_which='ALL'
					?repl('=',204)
				case m_which='PBG'
					?repl('=',189)
				otherwise &&'SSS'
					?repl('=',153)
			endcase
		else
			do case
				case m_which='ALL'
					?repl('=',212)
				case m_which='PBG'
					?repl('=',197)
				otherwise &&'SSS'
					?repl('=',161)
			endcase
		endif
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
enddo
clos all
set colo to (m_oldcol)
rele all
retu

proc p_msshead
m_page=m_page+1
if m_page>1
	?chr(12)
endi
?m_company
?m_comp_addr
?'SSS ID NO.: '+m_comp_sss
?'MONTHLY SSS/PHIC/EC & MATERNITY CONTRIBUTIONS REPORT'
?'For the month of '+m_pres_mo+' '+m_pres_yr
?
if m_bydep
	do case
		case m_which='ALL'
			?alltrim(m_head)+spac(30-len(alltrim(m_head)))+space(166)+'Page '+str(m_page,3)
			?repl('=',217)
			?space(67)+'!-------------S---S---S-------------!-------------PHILHEALTH------------!----E-C----!'
			??'-------------PAG-IBIG--------------!------TAX-----!'
		case m_which='PBG'
			?alltrim(m_head)+spac(30-len(alltrim(m_head)))+space(151)+'Page '+str(m_page,3)
			?repl('=',202)
			?space(67)+'!-------------S---S---S-------------!-------------PHILHEALTH------------!----E-C----!'
			??'-------------PAG-IBIG--------------!'
		otherwise &&'SSS'
			?alltrim(m_head)+spac(30-len(alltrim(m_head)))+space(115)+'Page '+str(m_page,3)
			?repl('=',166)
			?space(67)+'!-------------S---S---S-------------!-------------PHILHEALTH------------!----E-C----!'
	endcase
else
	do case
		case m_which='ALL'
			?alltrim(m_head)+spac(30-len(alltrim(m_head)))+space(174)+'Page '+str(m_page,3)
			?repl('=',212)
			?space(62)+'!-------------S---S---S-------------!-------------PHILHEALTH------------!----E-C----!-------------PAG-IBIG--------------!------TAX-----!'
		case m_which='PBG'
			?alltrim(m_head)+spac(30-len(alltrim(m_head)))+space(159)+'Page '+str(m_page,3)
			?repl('=',197)
			?space(62)+'!-------------S---S---S-------------!-------------PHILHEALTH------------!----E-C----!'
			??'-------------PAG-IBIG--------------!'
		otherwise &&'SSS'
			?alltrim(m_head)+spac(30-len(alltrim(m_head)))+space(123)+'Page '+str(m_page,3)
			?repl('=',161)
			?space(62)+'!-------------S---S---S-------------!-------------PHILHEALTH------------!----E-C----!'
	endcase
endif
??space(13)+"!"
if m_bydep
	?"EMP#   EMPLOYEE NAME                     SSS NUMBER   GROSS PAY    !    'ee        'er        Total    !    'ee        'er        Total    !    'er    !"
else
	?"SSS NUMBER     EMPLOYEE NAME                     GROSS PAY    !    'ee        'er        Total    !    'ee        'er        Total    !    'er    !"
endif
* 1234   12345678901234567890123456789012 99,999,999.99  999,999.99 999,999.99 9,999,999.99  999,999.99 999,999.99 9,999,999.99  999,999.99  999,999.99 999,999.99 9,999,999.99 ! 9,999,999.99 !'
do case
	case m_which='ALL'
		??"    'ee        'er        Total    !       'ee    !"
	case m_which='PBG'
		??"    'ee        'er        Total    !"
endcase
??"----TOTAL----!"
* 1234   12345678901234567890123456789012  99,999,999.99    999,999.99 999,999.99 9,999,999.99  999,999.99 999,999.99 9,999,999.99  999,999.99  999,999.99 999,999.99 9,999,999.99 ! 9,999,999.99 !'
if m_bydep
	do case
		case m_which='ALL'
			?repl('=',217)
		case m_which='PBG'
			?repl('=',202)
		otherwise &&'SSS'
			?repl('=',166)
	endcase
else
	do case
		case m_which='ALL'
			?repl('=',212)
		case m_which='PBG'
			?repl('=',197)
		otherwise &&'SSS'
			?repl('=',161)
	endcase
endif
m_crow=11
m_nextpg=.f.
return

proc p_mtxhead
m_page=m_page+1
if m_page>1
	?chr(12)
endi
if m_withbreak
	?space(f_center(m_company,136))+m_company
	?space(f_center(m_comp_addr,136))+alltrim(m_comp_addr)
	?space(f_center('TAX Withheld for the Month of '+m_pres_mo+' '+m_pres_yr,136))
	??'TAX Withheld for the Month of '+m_pres_mo+' '+m_pres_yr
	?space(f_center('T.I.N. # : '+m_comp_tin,136))+'T.I.N. #: '+alltrim(m_comp_tin)
	?
	?alltrim(m_head)+spac(30-len(alltrim(m_head)))+space(98)+'Page '+str(m_page,3)
	?repl('=',140)
	?'EMPLOYEE NAME                         T I N      GRS-1st HALF   GRS-2nd HALF     TOTAL  GROSS   TAX-1st HALF   TAX-2nd HALF     TOTAL TAX'
	* 12345678901234567890123456789012   999-999-999   9,999,999.99   9,999,999.99   9,999,999.99   9,999,999.99   9,999,999.99   9,999,999.99
	?repl('=',140)
else
	?space(f_center(m_company,76))+m_company
	?space(f_center(m_comp_addr,76))+alltrim(m_comp_addr)
	?
	?space(f_center('TAX Withheld for the Month of '+m_pres_mo+' '+m_pres_yr,76))
	??'TAX Withheld for the Month of '+m_pres_mo+' '+m_pres_yr
	?
	?alltrim(m_head)+spac(30-len(alltrim(m_head)))+space(38)+'Page '+str(m_page,3)
	?repl('=',76)
	?'EMPLOYEE NAME                         T I N         GROSS PAY         TAX'
	?repl('=',76)
endif
* 12345678901234567890123456789012   999-999-999   9,999,999.99   9,999,999.99
m_crow=7
m_nextpg=.f.
return

* MONTHLY PAG-IBG
proc rpmonpbg
m_oldcol=setcolor()
set colo to (m_cnor)
do whil .t.
   f_bcln()
	m_spool=.t.
	m_page=0
	m_crow=60
	m_fig='99,999,999.99'

	if f_choose('SELECT :','BY DEPARTMENT','BY NAME')
      m_bydep := .t.
   else
      m_bydep := .f.
   endif

	f_setting()
	sele 1
	if .not. net_use('&dpath\sys_id',.t.,5)
		exit
	endi
	if .not. fil_lock(5)
		exit
	endi
	m_pres_mo=alltrim(cmonth(ctod(subs(str(100+pres_mo,3),2,2)+'/01/'+subs(str(year(end_date),4),3,2))))
	m_pres_yr=str(year(beg_date),4)
	sele 2
	if .not. net_use('&dpath\dept',.t.,5)
		exit
	endi
   set inde to &dpath\dbydep
	sele 3
	if .not. net_use('&dpath\master',.t.,5)
		exit
	endi
   if m_bydep
   	index on dep_no+emp_nm to &dpath\mbydepnm
   	set inde to &dpath\mbydepnm
   else
   	set index to &dpath\mbynm
   endif
   reindex
	go top
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
	stor 0 to m_g_pgee, m_g_pger, m_p_pgee, m_p_pger

	sele master

   if m_bydep
   	do whil .not. eof()
   		if m_crow>58
   			do p_mpghead
   		endif
   		if m_pgee+m_pger<=0
   			skip
   			loop
   		endi

         m_dep_no := dep_no

         select dept
			seek m_dep_no

			if .not. eof()
				m_dep_nm=dep_nm
			else
				m_dep_nm=''
			endif

			sele master
         if m_crow+3>58
				do p_mpghead
			endif

			?
			?'Dept.No.: '+m_dep_no+' - '+m_dep_nm
			?
			m_crow=m_crow+3

			do whil dep_no=m_dep_no .and. .not. eof()

				if m_crow+2>58
					do p_mpghead
				endi

      		if m_pgee+m_pger<=0
      			skip
   	   		loop
   		   endif

      		m_pgbg_no=alltrim(pgbg_no)+space(15-len(alltrim(pgbg_no)))

   		   m_emp_nm=LEFT(emp_nm,30)+" "+MNAME+"  "
      		?m_pgbg_no+m_emp_nm+tran(m_pgee,m_fig)+' '+tran(m_pger,m_fig)+tran(m_pgee+m_pger,m_fig)
   		   m_crow=m_crow+1
      		m_p_pgee=m_p_pgee+m_pgee
        		m_p_pger=m_p_pger+m_pger

            skip

         enddo

   		m_g_pgee=m_g_pgee+m_p_pgee
	   	m_g_pger=m_g_pger+m_p_pger

         if m_crow+3>58
            do p_mpghead
         endif

   		?
   		?space(44)+'DEPARTMENT TOTAL:  '+tran(m_p_pgee,m_fig)+' '+tran(m_p_pger,m_fig)+tran(m_p_pgee+m_p_pger,m_fig)
   		m_p_pgee=0
   		m_p_pger=0

   	enddo
   	?
	   ?space(48)+'GRAND TOTAL :  '+tran(m_g_pgee,m_fig)+' '+tran(m_g_pger,m_fig)+tran(m_g_pgee+m_g_pger,m_fig)
   	?chr(12)

   else
   	do whil .not. eof()
   		if m_crow>58
   			do p_mpghead
   		endif
   		if m_pgee+m_pger<=0
   			skip
   			loop
   		endi
   		m_pgbg_no=alltrim(pgbg_no)+space(15-len(alltrim(pgbg_no)))
   		//m_emp_nm=alltrim(emp_nm)+space(34-len(alltrim(emp_nm)))
   		m_emp_nm=LEFT(emp_nm,30)+" "+MNAME+"  "
   		?m_pgbg_no+m_emp_nm+tran(m_pgee,m_fig)+' '+tran(m_pger,m_fig)+tran(m_pgee+m_pger,m_fig)
   		m_crow=m_crow+1
   		m_p_pgee=m_p_pgee+m_pgee
     		m_p_pger=m_p_pger+m_pger
   		m_g_pgee=m_g_pgee+m_pgee
	   	m_g_pger=m_g_pger+m_pger
		   skip
   		if m_crow+3>58 .or. eof()
   			?
   			?space(49)+'Page Total :  '+tran(m_p_pgee,m_fig)+' '+tran(m_p_pger,m_fig)+tran(m_p_pgee+m_p_pger,m_fig)
   			m_p_pgee=0
   			m_p_pger=0
   			m_crow=60
   		endif
   	enddo
   	?
	   ?space(48)+'GRAND TOTAL :  '+tran(m_g_pgee,m_fig)+' '+tran(m_g_pger,m_fig)+tran(m_g_pgee+m_g_pger,m_fig)
   	?chr(12)

   endif

	if m_spool
	   set alte off
   	set alte to
	else
	   set print off
   	set device to screen
	endif
	set cons on
	exit
enddo
close all
set colo to (m_oldcol)
release all
return


proc p_mpghead
m_page=m_page+1
if m_page>1
	?chr(12)
endi
?m_company+space(51-len(alltrim(m_company)))+'Employer SSS No.: '+alltrim(m_comp_sss)
?alltrim(m_comp_addr)+space(51-len(alltrim(m_comp_addr)))+'Zip Code: ';
	+alltrim(m_comp_zip)+space(6-len(alltrim(m_comp_zip)))+'Tel#: '+m_comp_tel
?'MONTHLY PAG-IBIG PAYMENTS FOR '+m_pres_mo+' '+m_pres_yr
?
?alltrim(m_head)+spac(83-len(alltrim(m_head)))+'Page'+str(m_page,3)
?repl('=',104)
?space(63)+'------------ CONTRIBUTIONS --------------'
?'PAG-IBIG No.   NAME OF EMPLOYEES                                 Employee      Employer        Total'
?repl('=',104)
m_crow=9
return
