* Program Name : Tax Table File Maintenance
* Program Code : Taxtedit.prg
* Date : July 02, 1994
* Author : SVC

m_old_col=setcolor()
do whil .t.
	f_setting()
	sele 1
	if .not. net_use('&opath\taxtab',.t.,5)
		exit
	endi
	set inde to &opath\tax
	go top
	m_pack=.f.
	m_fig='999,999.99'
	m_dscrn=savescreen(7,24,17,53)
	f_drawbox(7,25,16,53,5,3)
	m_exemption=spac(3)
	m_peso=0
	m_percent='  '
	m_salary=0
	set colo to (m_cnor)
	@ 8,29 say 'TAX TABLE MAINTENANCE'
	@11,27 say 'STATUS...... :'
	@12,27 say 'TAX......... :'
	@13,27 say 'PERCENTAGE.. :'
 	@14,27 say 'SALARY...... :'
	f_bcln()
	do p_taxdisp
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
		endi
		f_bcln()
		do case
			case m_proc='A'
				do whil .t.
					do p_taxinit
					do p_taxgets with 'A'
					if .not. f_ask('Add new entry ?')
						exit
					endi
				endd
			case m_proc='E'
				m_exemption=exemption
				m_peso=peso
				m_percent=percent
				m_salary=salary
				do p_taxgets with 'E'
			case m_proc='D'
				if fil_lock(5)
					if f_ask('DELETE this record.  Are you sure ?')
						dele
						skip -1
						unlo
						m_pack=.t.
					endi
				endi
			case m_proc='N'
				skip
				if eof()
					skip -1
					f_err('This is the last record !',.f.)
				endi
			case m_proc='P'
				skip -1
				if bof()
					f_err('This is the first record !',.f.)
				endi
			case m_proc='F'
				m_oldrec=recno()
				@11,42 get m_exemption pict '@!' vali m_exemption#spac(3)
				read
				if lastkey()<>27
					set soft on
					seek m_exemption
					set soft off
					if eof()
						f_err('No record beyond that Tax Status Code !',.f.)
						go m_oldrec
					endi
				endi
			case m_proc='X'
				exit	
		endc
		do p_taxdisp
	endd
	if m_pack
		if fil_lock(5)
			set inde to
			f_mess('Packing files.  Please wait...',.f.)
			pack
			f_mess('Rebuilding index files.  Please wait...',.f.)
			rein
		endi
	endi
	exit
endd
restscreen(7,24,17,53,m_dscrn)
set colo to (m_old_col)
clos all
rele all
retu

proc p_taxgets
para _m_a_or_e
m_o_exemption=m_exemption
do whil .t.
	@11,42 get m_exemption pict '@!'
	@12,42 get m_peso pict m_fig
	@13,42 get m_percent pict '99' vali m_percent#'  '
	@14,42 get m_salary pict m_fig
	read
	if lastkey()=27
		exit
	endi
	if m_o_exemption<>m_exemption
		m_oldrec=recno()
		seek m_exemption
		if .not. eof() .and. percent=m_percent
			f_err('That Status-Pencentage Combination already exists !  Changes not accepted.',.f.)
			m_status=m_o_exemption
			goto m_oldrec
			loop
		endi
		goto m_oldrec
	endi
	if f_ask('Data Correct ?')
		if f_ask('Save ?')
			if fil_lock(5)
				if _m_a_or_e='A'
					appe blan
				endi
				repl exemption with m_exemption, peso with m_peso,;
					percent with m_percent, salary with m_salary
			endi
		endi
		exit
	endi
endd
retu

proc p_taxinit
m_exemption=spac(3)
m_peso=0
m_percent='  '
m_salary=0
retu

proc p_taxdisp
@11,42 say exemption
@12,42 say tran(peso,m_fig)
@13,42 say percent
@14,42 say tran(salary,m_fig)
retu
