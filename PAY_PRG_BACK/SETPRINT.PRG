* Setprint.prg
* Alows user to change the printer font.'

m_old_col=setcolor()
do while .t.
	m_dscrn=savescreen(5,19,20,58)
	f_drawbox(5,20,19,57,5,3)
	f_mess('Please switch "ON" your printer first, selecting the font.',.f.)
	@ 6,21 prompt ' 10 PITCH, DRAFT                    '
	@ 7,21 prompt ' 10 PITCH, DOUBLE STRIKE            '
	@ 8,21 prompt ' 10 PITCH, CONDENSED                '
	@ 9,21 prompt ' 10 PITCH, CONDENSED, DOUBLE STRIKE '
	@10,21 prompt ' 10 PITCH, ITALICS                  '
	@11,21 prompt ' 10 PITCH, ITALICS, DOUBLE STRIKE   '
	@12,21 prompt ' 12 PITCH, DRAFT                    '
	@13,21 prompt ' 12 PITCH, DOUBLE STRIKE            '
	@14,21 prompt ' 12 PITCH, CONDENSED                '
	@15,21 prompt ' 12 PITCH, CONDENSED, DOUBLE STRIKE '
	@16,21 prompt ' 12 PITCH, ITALICS                  '
	@17,21 prompt ' 12 PITCH, ITALICS, DOUBLE STRIKE   '
	@18,21 prompt ' E X I T                            '
	menu to m_choice
	if lastkey()=27 .or. m_choice=13
		exit
	endi
	do whil .not. isprinter()
		f_err('PRINTER IS NOT READY !  Press <Esc> to Abort, any key to Retry.',.t.)
		if lastkey()=27
			exit
		endi
	enddo
	if lastkey()=27
		exit
	endif
	set print on
	set devi to print
	do case
		case m_choice=1
			?chr(27)+chr(33)+chr(0)
		case m_choice=2
			?chr(27)+chr(33)+chr(16)
		case m_choice=3
			?chr(27)+chr(33)+chr(4)
		case m_choice=4
			?chr(27)+chr(33)+chr(20)
		case m_choice=5
			?chr(27)+chr(33)+chr(64)
		case m_choice=6
			?chr(27)+chr(33)+chr(80)
		case m_choice=7
			?chr(27)+chr(33)+chr(1)
		case m_choice=8
			?chr(27)+chr(33)+chr(17)
		case m_choice=9
			?chr(27)+chr(33)+chr(5)
		case m_choice=10
			?chr(27)+chr(33)+chr(21)
		case m_choice=11
			?chr(27)+chr(33)+chr(65)
		case m_choice=12
			?chr(27)+chr(33)+chr(81)
	endcase
	set print off
	set cons on
	exit
endd
restscreen(5,19,20,58,m_dscrn)
set colo to (m_old_col)
close all
release all
return
