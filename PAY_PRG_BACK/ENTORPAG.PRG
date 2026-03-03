* Program Name : Official Receipt/Special Bank Receipt Data Entry
* Program Code : Entorpag.prg
* Date : Feb. 23, 1995
* Author : SVC

m_old_col=setcolor()
m_preflag='T'
do while .t.
	m_dscrn=savescreen(9,4,15,40)
	f_setting()
	sele 1
	if .not. net_use('&dpath\prempaid',.t.,5)
		exit
	endi
	set inde to &dpath\prempaid
	go top
	m_pack=.f.
	f_drawbox(9,5,14,40,1,3)
	m_month=space(2)
	m_year=space(4)
	m_or_sbr=space(15)
	m_or_date=ctod('  /  /  ')
	m_period=space(6)
	set colo to (m_cnor)
	@10,8 say 'MONTH....... :   '        
	@11,8 say 'YEAR.......  :     '
	@12,8 say 'O.R./SBR NO. :                '
	@13,8 say 'O.R. DATE... :         '
	f_bcln()
	do p_pagdisp
	do whil .t.
	   *   11     18      26        36      44          56       65
      *  [A]dd  [E]dit  [D]elete  [N]ext  [P]revious  [F]ind  e[X]it
		@23,10 say '[A]dd  [E]dit  [D]elete  [N]ext  [P]revious  [F]ind  e[X]it'
		set colo to w+
		@23,11 say 'A'
		@23,18 say 'E'
		@23,26 say 'D'
		@23,36 say 'N'
		@23,44 say 'P'
		@23,56 say 'F'
		@23,65 say 'X'
		set colo to
		f_sayit('Press A, E, D, N, P, F or X')
		set curs off
		m_proc=upper(chr(inkey(0)))
		set curs on
		if lastkey()=27
			exit
		endif
		f_bcln()
		do case
			case m_proc='A'
				do whil .t.
					do p_paginit
					do p_paggets with 'A'
					if .not. f_ask('Add new entry ?')
						exit
					endi
				endd
			case m_proc='E'
				m_period=period
				m_month=subs(period,5,2)
				m_year=subs(period,1,4)
				m_or_sbr=or_pag
				m_or_date=pg_date
				m_preflag=preflag
				do p_paggets with 'E'
			case m_proc='D'
				if fil_lock(5)
					if f_ask('DELETE this record.  Are you sure ?')
						delete
						skip -1
						unlock
						m_pack=.t.
					endif
				endif
			case m_proc='N'
				skip
				if eof()
					skip -1
					f_err('This is the last record !',.f.)
				endif
			case m_proc='P'
				skip -1
				if preflag='S'
					f_err('This is the first record !',.f.)
				endif
			case m_proc='F'
				m_oldrec=recno()
				@10,23 get m_month pict '99' valid val(m_month)>0.and.val(m_month)<13
				@11,23 get m_year pict '9999' valid m_year > '1980'
				read
				if lastkey()<>27
					m_period=subs(str(10000+val(m_year),5),2,4)+subs(str(100+val(m_month),3),2,2)
					set softseek on
					seek m_period
					set soft off
					if eof()
						f_err('No record beyond that period !',.f.)
						go m_oldrec
					endif
				endif
			case m_proc='X'
				exit	
		endcase
		do p_pagdisp
	enddo
	if m_pack
		if fil_lock(5)
			set inde to
			f_mess('Packing files.  Please wait...',.f.)
			pack
			f_mess('Rebuilding index files.  Please wait...',.f.)
			reindex
		endif
	endif
	exit
enddo
restscreen(9,4,15,40,m_dscrn)
set colo to (m_old_col)
close all
release all
return

proc p_paggets
para _m_a_or_e
m_o_period=m_period
do while .t.
	@10,23 get m_month pict '99' valid val(m_month)>0.and.val(m_month)<13
	@11,23 get m_year pict '9999' valid m_year > '1980'
	@12,23 get m_or_sbr vali m_or_sbr<>space(15)
	@13,23 get m_or_date valid dtoc(m_or_date)<>'  /  /  '
	read
	if lastkey()=27
		exit
	endif
	m_period=subs(str(10000+val(m_year),5),2,4)+subs(str(100+val(m_month),3),2,2)
	if subs(dtoc(m_or_date),7,1)='0'
		m_ordte='20'+subs(dtoc(m_or_date),7,2)+subs(str(100+val(m_month),3),2,2)
	else
		m_ordte='19'+subs(dtoc(m_or_date),7,2)+subs(str(100+val(m_month),3),2,2)
	endif
	if m_period>m_ordte
		f_err('O.R. date cannot be sooner than the period !',.f.)
		loop
	endif
	*if m_o_period<>m_period
	*	m_oldrec=recno()
		*seek m_period
		*if .not. eof()
		*	f_err('That Period already exists !  Changes not accepted.',.f.)
		*	m_period=m_o_period
		*	goto m_oldrec
		*	loop
	*	endif
	*	goto m_oldrec
	*endif
	if f_ask('Data Correct ?')
		if f_ask('Save ?')
			if fil_lock(5)
				if _m_a_or_e='A'
					append blank
				endif
				replace period with m_period, or_pag with m_or_sbr,;
					pg_date with m_or_date,preflag with m_preflag
			endif
		endif
		exit
	endif
enddo
return

proc p_paginit
m_period=space(6)
m_month=space(2)
m_year=space(4)
m_or_sbr=space(15)
m_or_date=ctod('  /  /  ')
return

proc p_pagdisp
do whil preflag='S'.and..not. eof()
	skip
	loop
enddo	
@10,23 say subs(period,5,2)
@11,23 say subs(period,1,4)
@12,23 say or_pag
@13,23 say pg_date
return
