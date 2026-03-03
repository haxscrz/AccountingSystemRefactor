******************************
*         FUNCTIONS          *
******************************
* F_BCLN - clears row 24 of the screen
func f_bcln
m_oldcol=setcolor()
set colo to (m_cmes)
@24,0 clea to 24,79
set colo to (m_oldcol)
retu .t.

* F_SELKEY - displays the navigation keys for prompts.
func f_selkey
f_sayit('Press  '+chr(26)+'  '+chr(27)+'  '+chr(24)+'  or  '+chr(25);
+'  to position'+',  '+chr(17)+chr(196)+chr(217)+'  to select, Esc to go back.')
retu(.t.)

* F_SAYIT - displays messages without asking for user input.
func f_sayit
para m_mes
m_oldcol=setcolor()
f_bcln()
set colo to (m_cmes)
@24,(80-len(m_mes)-2)/2 say m_mes
set colo to (m_oldcol)
retu(.t.)

func f_msayit
para m_mes
m_oldcol=setcolor()
f_bcln()
set colo to (m_cmes)
@24,(80-len(m_mes)-2)/2 say m_mes
inkey(1.5)
set colo to (m_oldcol)
retu(.t.)

* F_MESS - displays messages, mesage could be retained if m_bura is true.
func f_mess
para m_mes,m_press
m_oldcol=setcolor()
m_scrn=savescreen(24,1,24,79)
//tone(4100,0.5)
//tone(4100,1)
f_bcln()
set colo to (m_cmes)
col=(80-len(m_mes)-2)/2
@24,col say ' '+m_mes+' '
set colo to (m_oldcol)
if m_press
	inke(0)
	restscreen(24,1,24,79,m_scrn)
endi
retu(.t.)

* F_ERR - displays error messages.
func f_err
para m_mes,m_press
m_oldcol=setcolor()
m_scrn=savescreen(24,0,24,79)
//tone(300,1)
//tone(499,5)
//tone(700,5)
f_bcln()
set colo to (m_cerr)
@24,(79-len(m_mes)-2)/2 say ' '+m_mes+' '
if m_press
	inke(0)
else
	inke(2)
endi
restscreen(24,0,24,79,m_scrn)
set colo to (m_oldcol)
retu(.t.)

* F_PASSWORD - asks user for pasword of corresponding rotine.
func f_password
para m_ano
m_oldcol=setcolor()
m_passcrn=savescreen(11,23,13,55)
m_ctr=1
set colo to (m_cmen)
@11,23,13,55 box 'ÚÄ¿³ÙÄÀ³Û'
set conf off
do whil m_ctr<3
	set colo to w+/n
	@12,24 say '  ENTER PASSWORD : ®        ¯  '
	@12,24 say chr(16)
	@12,54 say chr(17)
	m_pass=''
	h=0
	do while len(m_pass)<=8
	 	x=chr(232)
	   set cons off
	   @12,44+h get x pict '!'
	   read
	   set cons on
		if x<>chr(8)
		   @12,44+h say chr(232)
		endi
		if lastkey()=27 .or. x=chr(13) .or. x=chr(232)
			exit
		endi
	   h=h+1
		m_pass=m_pass+x
	endd
	set colo to
	if lastkey()=27
		exit
	endi
	do case
		case m_ano=10
			magicword=pcode
		case m_ano=21
			magicword='INITTIME'
		case m_ano=14
			magicword='POSTTIME'
		case m_ano=15
			magicword='BONUCOMP'
		case m_ano=16
			magicword='YRENDTAX'
		case m_ano=22
			magicword='MASTEDIT'
		case m_ano=23
			magicword='MASTRATE'
		case m_ano=24
			magicword='DEPTEDIT'
		case m_ano=240
			magicword='EDITDEPT'
		case m_ano=25
			magicword='TAXEDIT'
		case m_ano=26
			magicword='SYSTEDIT'
		case m_ano=27
			magicword='FILEINIT'
		case m_ano=28
			magicword='FILEBACK'
		case m_ano=29
			magicword='EDITPATH'
		case m_ano=30
			magicword='QUERTIME'
		case m_ano=77
			magicword='THIRDMON'
		case m_ano=202
			magicword='APPETIME'
		case m_ano=290
			magicword='EDTEMPNO'
		other
			magicword='PAY'
	endc
	if .not. magicword$m_pass
		f_err('*** ACCESS DENIED ***',.t.)
		m_ctr=m_ctr+1
	else
		exit
	endi
endd
set conf on
set colo to (m_oldcol)
restscreen(11,23,13,55,m_passcrn)
rele m_passcrn
if m_ctr>2 .or. lastkey()=27
	retu (.f.)
endi
retu(.t.)

func f_begtone
//tone(980,2)
//inke(0.1)
//tone(3500,1.5)
retu .t.

func f_endtone
//tone(3500,1.95)
//inke(0.1)
//tone(980,1.5)
retu .t.

* F_DRAWBOX - draw a pop-up box
func f_drawbox
para m_x1,m_y1,m_x2,m_y2,m_line,m_shade
private m_c1,m_c2,m_x,m_y,m_d1,m_d2,m_box_str

m_oldcol=setcolor()
//f_begtone()
do case
	case m_line=0
		m_box_str=spac(9)
	case m_line=1
		m_box_str='ÚÄ¿³ÙÄÀ³'+' '
	case m_line=2
		m_box_str='ÉÍ»º¼ÍÈº'+' '
	case m_line=3
		m_box_str='ÚÄ¿³ÙÄÀ³'+'²'
	case m_line=4
		m_box_str='ÉÍ»º¼ÍÈº'+'²'
	case m_line=5
		m_box_str='ÖÄ·º½ÄÓº'+' '
	case m_line=6
		m_box_str='ÖÄ·º½ÄÓº'+'²'
	othe
		m_box_str=spac(9)
endc
*set colo to (m_crev)
set colo to (m_cnor)
m_x  = int((m_x2-m_x1)/2)
m_y  = int((m_y2-m_y1)/2)
m_d1 = m_x/10
m_d2 = m_y/10
stor 0 to m_c1,m_c2
do while .t.
	@m_x1+m_x-m_c1,m_y1+m_y-m_c2,m_x2-m_x+m_c1,m_y2-m_y+m_c2 box m_box_str
   if m_c1 < m_x
       m_c1 = m_c1 + m_d1
	endif
   if m_c2 < m_y
		m_c2 = m_c2 + m_d2
   endi
	if m_c1 >= m_x .OR. m_c2 >= m_y
       exit
    endif
endd
if m_line = 0
	@m_x1,m_y1,m_x2,m_y2 box space(9)
else
    @m_x1,m_y1,m_x2,m_y2 box m_box_str
endi

if m_shade>0
	do case
		case m_shade=1
			m_shadchar='Å'
		case m_shade=2
			m_shadchar='Á'
		othe
			m_shadchar=' '
	endc
*	set colo to (m_shad)
*	set colo to (m_rshad)
*	for _q=m_x1+1 to m_x2
*		@_q,m_y1-1 say m_shadchar
*	next
*	@_q,m_y1-1 say repl(m_shadchar,m_y2-m_y1+1)
endi
set colo to (m_oldcol)
retu ''

func f_reindex
para m_dbf,m_ntx,m_key
m_bscrn=savescreen(24,1,24,79)
//tone(800,1)
f_sayit('Reindexing file.  Please wait...')
if .not. file('&m_dbf'+'.dbf')
	f_err('&m_dbf '+'file does not exist !',.t.)
else
	if .not. file('&m_ntx'+'.ntx')
		f_sayit('Creating '+'&m_ntx'+' file.  Please wait...')
	endi
	use &m_dbf
	inde on &m_key to &m_ntx
endi
restscreen(24,1,24,79,m_bscrn)
retu(.t.)

func f_printest
//tone(300,0.5)
//tone(200,1)
f_sayit('PLEASE TURN YOUR PRINTER ON. Press <Esc> to Abort, any key when Ready.')
i=inke(0)
if i=27
   retu(.f.)
endi
do whil .not. isprinter()
	f_err('PRINTER IS NOT READY !  Press <Esc> to Abort, any key to Retry.',.t.)
   if lastkey()=27
     retu(.f.)
   endi
endd
f_sayit('PRINTING.  Please wait...')
set cons off
set devi to print
retu(.t.)

func f_choose
para m_mess,m_option1,m_option2
m_col_mes=int((79-len(m_mess+'   '+m_option1+'    '+m_option2+' '))/2)
m_col_op1=m_col_mes+len(m_mess+'  ')
m_col_op2=m_col_op1+len(' '+m_option1+'   ')
m_soldc=setcolor()
f_bcln()
set colo to (m_cmes)
//tone(800,1)
@24,m_col_mes say m_mess
@24,m_col_op1 prom ' '+m_option1+' '
@24,m_col_op2 prom ' '+m_option2+' '
menu to m_chosen
set colo to (m_soldc)
if m_chosen=1
	retu(.t.)
else
	retu(.f.)
endi

func f_askspool
m_soldc=setcolor()
m_sfname=spac(8)
set colo to (m_cmes)
do whil .t.
	if .not. f_choose('PRINTING :','DIRECT','SPOOL')
		if lastkey()=27
			exit
		endi
		correct=.f.
		do whil .not. correct
			f_bcln()
			@24,5 say 'ENTER SPOOL FILENAME :'
			//tone(800,1)
			m_sfname=upper(alltrim(m_sfname))+spac(8-len(alltrim(m_sfname)))
			@24,28 get m_sfname pict '@K!' vali m_sfname#spac(8)
			read
			if lastkey()=27
				exit
			endi
			//tone(800,1)
			@24,45 say 'Is the filename correct ? 'get correct pict 'Y'
			read
			if lastkey()=27
				exit
			endi
			m_sfname=alltrim(m_sfname)
			n_sfname=m_sfname+'.TXT'
			if file('&tpath\&n_sfname')
				f_bcln()
				//tone(800,1)
				@24,16 say m_sfname+'.TXT'+' already exists. Overwrite (Y/N) ?' get correct pict 'Y'
				read
			endi
		endd
		if lastkey()=27
			exit
		endi
		f_bcln()
		//tone(4100,0.5)
		//tone(4100,1)
		m_sfname=alltrim(m_sfname)+'.TXT'
		f_sayit('SPOOLING... FILENAME = '+m_sfname)
		set cons off
		set alte to &tpath\&m_sfname
		set alte on
		set colo to (m_soldc)
		retu(.t.)
	else
		if lastkey()=27
			exit
		endi
		f_sayit('PLEASE SWITCH ON YOUR PRINTER. Press <Esc> to Abort, any key when Ready.')
		i=inke(0)
		if lastkey()=27
			exit
		endi
		do whil .not. isprinter()
			f_err('PRINTER IS NOT READY !  Press <Esc> to Abort, any key to Retry.',.t.)
			if lastkey()=27
				exit
			endi
		endd
		if lastkey()=27
			exit
		endi
		set print on
		set devi to print
		set cons off
	endi
	exit
endd
set colo to (m_soldc)
retu(.f.)


function f_xaskspool

   m_soldc = setcolor()
   set color to (m_cmes)
   do while .t.
      if !f_choose("PRINTING :","DIRECT","SPOOL")
         if lastkey() = 27
            exit
         endif
         correct = .f.
         do while !correct
            f_bcln()
            @ 24, 5 say "ENTER SPOOL FILENAME :"
            //tone(800,1)
            m_sfname = upper(alltrim(m_sfname)) + space(8 - len(alltrim(m_sfname)))
            @ 24, 28 get m_sfname picture "@K!" valid m_sfname#spac(8)
            read
            if lastkey() = 27
               exit
            endif
            //tone(800,1)
            @ 24, 45 say "Is the filename correct ? " get correct picture "Y"
            read
            if lastkey() = 27
               exit
            endif
            m_sfname = alltrim(m_sfname)
            n_sfname = m_sfname + "."
            if file("&tpath\&n_sfname")
               f_bcln()
               //tone(800,1)
               @ 24, 16 say m_sfname + " already exists. Overwrite (Y/N) ?" get correct ;
                  picture "Y"
               read
            endif
         enddo
         if lastkey() = 27
            exit
         endif
         f_bcln()
         //tone(4100,0.5)
         //tone(4100,1)
         m_sfname = alltrim(m_sfname) + "."
         f_sayit("SPOOLING... FILENAME = " + m_sfname)
         set console off
         set alternate to &TPATH\&M_SFNAME
         set alternate on
         set color to (m_soldc)
         return .t.
      else
         f_sayit("PLEASE SWITCH ON YOUR PRINTER. Press <Esc> to Abort, any key when Ready.")
         i = inkey(0)
         if lastkey() = 27
            exit
         endif
         do while !isprinter()
            f_err("PRINTER IS NOT READY !  Press <Esc> to Abort, any key to Retry.",.t.)
            if lastkey() = 27
               exit
            endif
         enddo
         if lastkey() = 27
            exit
         endif
         set print on
         set device to print
         set console off
      endif
      exit
   enddo
   set color to (m_soldc)
   return .f.


function f_zaskspool

   m_soldc = setcolor()
   set color to (m_cmes)
   do while .t.
      if !f_choose("PRINTING :","DIRECT","SPOOL")
         if lastkey() = 27
            exit
         endif
         correct = .f.
         do while !correct
            f_bcln()
            @ 24, 5 say "ENTER SPOOL FILENAME :"
            //tone(800,1)
            m_sfname = upper(alltrim(m_sfname)) + space(8 - len(alltrim(m_sfname)))
            @ 24, 28 get m_sfname picture "@K!" valid m_sfname#spac(8)
            read
            if lastkey() = 27
               exit
            endif
            //tone(800,1)
            @ 24, 45 say "Is the filename correct ? " get correct picture "Y"
            read
            if lastkey() = 27
               exit
            endif
            m_sfname = alltrim(m_sfname)
            n_sfname = m_sfname + "."
            if file("&tpath\&n_sfname")
               f_bcln()
               //tone(800,1)
               @ 24, 16 say m_sfname + " already exists. Overwrite (Y/N) ?" get correct ;
                  picture "Y"
               read
            endif
         enddo
         if lastkey() = 27
            exit
         endif
         f_bcln()
         //tone(4100,0.5)
         //tone(4100,1)
         m_sfname = alltrim(m_sfname) + "."
         f_sayit("SPOOLING... FILENAME = " + m_sfname)
         set console off
         set printer to &tpath\&m_sfname
         set device to printer
         set color to (m_soldc)
         return .t.
      else
         f_sayit("PLEASE SWITCH ON YOUR PRINTER. Press <Esc> to Abort, any key when Ready.")
         i = inkey(0)
         if lastkey() = 27
            exit
         endif
         do while !isprinter()
            f_err("PRINTER IS NOT READY !  Press <Esc> to Abort, any key to Retry.",.t.)
            if lastkey() = 27
               exit
            endif
         enddo
         if lastkey() = 27
            exit
         endif
         set print on
         set device to print
         set console off
      endif
      exit
   enddo
   set color to (m_soldc)
   return .f.



func f_naskspool
m_soldc=setcolor()
set colo to (m_cmes)
do whil .t.
	if .not. f_choose('PRINTING :','DIRECT','SPOOL')
		if lastkey()=27
			exit
		endi
		correct=.f.
		do whil .not. correct
			f_bcln()
			@24,5 say 'ENTER SPOOL FILENAME :'
			//tone(800,1)
			m_sfname=upper(alltrim(m_sfname))+spac(8-len(alltrim(m_sfname)))
			@24,28 get m_sfname pict '@K!' vali m_sfname#spac(8)
			read
			if lastkey()=27
				exit
			endi
			//tone(800,1)
			@24,45 say 'Is the filename correct ? 'get correct pict 'Y'
			read
			if lastkey()=27
				exit
			endi
			m_sfname=alltrim(m_sfname)
			n_sfname=m_sfname+'.TXT'
			if file('&tpath\&n_sfname')
				f_bcln()
				//tone(800,1)
				@24,16 say m_sfname+'.TXT'+' already exists. Overwrite (Y/N) ?' get correct pict 'Y'
				read
			endi
		endd
		if lastkey()=27
			exit
		endi
		f_bcln()
		//tone(4100,0.5)
		//tone(4100,1)
		m_sfname=alltrim(m_sfname)+'.TXT'
		f_sayit('SPOOLING... FILENAME = '+m_sfname)
		set cons off
		set alte to &tpath\&m_sfname
		set alte on
		set colo to (m_soldc)
		retu(.t.)
	else
		f_sayit('PLEASE SWITCH ON YOUR PRINTER. Press <Esc> to Abort, any key when Ready.')
		i=inke(0)
		if lastkey()=27
			exit
		endi
		do whil .not. isprinter()
			f_err('PRINTER IS NOT READY !  Press <Esc> to Abort, any key to Retry.',.t.)
			if lastkey()=27
				exit
			endi
		endd
		if lastkey()=27
			exit
		endi
		set print on
		set devi to print
		set cons off
	endi
	exit
endd
set colo to (m_soldc)
retu(.f.)

func f_setting
f_sayit('Setting-up Database Files.  Please wait...')
retu(.t.)

func net_use
para payl, ex_use, wait
if file('&payl'+'.dbf')
	do whil .t.
	   do whil wait > 0
   	   *f_setting('Setting-up '+payl+'.dbf.  Please wait...',.f.)
      	if ex_use
	         use &payl excl
   	   else
      	   use &payl
	      endi
	      if .not. neterr()
	         retu (.t.)
	      endi
	      inke(1)
	      wait = wait - 1
	   endd
	   rety = .t.
	   *do s
	   *set deli on
	   if f_choose('File(s) not available.  Retry ?','YES','NO')
		   set deli off
	   	if lastkey() = 27
	      	exit
		   endi
	   	f_bcln()
		   f_setting()
		   wait = 5
		else
	   	exit
		endi
	endd
else
	f_mess(payl+" does not exist !   Can't continue...",.t.)
	*f_mess("System files do not exist !   Can't continue...",.t.)
endi
//tone(800,1)
f_bcln()
retu (.f.)

func fil_lock
para wait
private forever
m_scrn=savescreen(24,0,24,79)
if flock()
   retu (.t.)
endi
do whil .t.
   do whil  wait > 0
      if flock()
         retu (.t.)
      endi
      inke(.5)
      wait = (wait -.5)
   endd
   rety = .t.
   f_bcln()
   *do s
   *set deli on
  	if f_choose('File(s) not available.  Retry ? ','YES','NO')
	   set deli off
   	if lastkey() = 27
      	exit
	   endi
   	f_bcln()
	   wait = 5
	else
      exit
   endi
endd
restscreen(24,0,24,79,m_scrn)
retu (.f.)

proc s
//tone(300,1)
//tone(499,5)
//tone(700,5)
retu

func f_dbedit                  && activates dbedit() program
para m_mode,m_ptr
public m_cur_fld
m_cur_fld=a_dbedit[m_ptr]
do case
	case m_mode<4
 		  retu 1
	case lastkey()=27
		  retu 0
	case lastkey()=13
		  if a_torf[m_ptr]
		     set curs on
			  do &m_proget	
		     set curs off
           if .not.m_prflag
			     keyboard chr(24)
			  else           
				  keyboard chr(4)
           endi
        endi
        retu 2
	othe
		retu 1
endc
retu 1


func f_ask
para _askmess
_m_oldcol=setcolor()
_m_prev_scrn=savescreen(24,0,24,79)
_mwhere=int(66-len(_askmess))/2
f_bcln()
set colo to (m_cmes)
@24,_mwhere say _askmess
do whil .t.
   @24,_mwhere+len(_askmess)+3 prom ' YES '
   @24,_mwhere+len(_askmess)+9 prom ' NO '
   menu to yesno
   do case
      case yesno=1
			restscreen(24,0,24,79,_m_prev_scrn)
			set colo to (_m_oldcol)
         retu (.t.)
      case yesno=2
         restscreen(24,0,24,79,_m_prev_scrn)
			set colo to (_m_oldcol)
         retu (.f.)
      othe
         loop      
   endc
endd

func p_about
if _m_helpon
	retu(.t.)
endi
_m_helpon=.t.
m_old_cod=setcolor()
save scre to m_helpscr
set colo to n/w
@4,4 clea to 21,75
@4,4 to 21,75
@ 5,6 say 'About the system...'
@ 7,6 say '       The program boasts of 100% user-friendly screens and is menu-'
@ 8,6 say 'driven.  The system is protected by passwords ensuring the confiden-'
@ 9,6 say 'tiality and safety of the data/information stored in the program.  A'
@10,6 say 'quick  help  access was provided to assist the user in the effective'
@11,6 say 'and full utilization of the system.  Message  and  navigation  lines'
@12,6 say 'were also included to help the user  in  understanding  each  chosen'
@13,6 say 'menu and to determine when and where to proceed in the course of the'
@14,6 say 'program usage.                                                      '
*@16,6 say '       This  system  was  created  and  designed for the sole use of'
*@17,6 say 'Stayfast Phils., Inc. with  offices at National Higway, Bo. Landayan'
*@18,6 say 'San Pedro, Laguna by Sonny V. Cruz.                                 '
@19,6 say '       No part of this  system can be copied, duplicated nor altered'
@20,6 say 'without the prior permission of the author.                         '
inke(40)
rest scre from m_helpscr
set colo to (m_old_cod)
_m_helpon=.f.
retu(.t.)

func f_center
para _mess,_columns
retu(int((_columns-len(alltrim(_mess)))/2))

func f_clnmes
_m_oldcol=setcolor()
set colo to
@23,0 clea to 23,74
set colo to (_m_oldcol)
retu(.t.)

func f_sscrn
para _title
retu(alltrim(subs(_title,1,14))+repl('.',14-len(alltrim(subs(_title,1,14)))))

func f_rscrn
para _title
retu(alltrim(_title)+spac(10-len(alltrim(_title))))

func f_p_emp_no
para _emp_no
return(alltrim(emp_no)+space(7-len(alltrim(emp_no))))

function f_esc()
if lastkey()==27
   return(.t.)
else
   return(.f.)
endif

FUNCTION Squares( lHi )
#define SB9 "ÛÛÛÛÛÛÛÛÛ"
*#define HICOLOR "bg+/bg"
#define HICOLOR "b+/b"
*#define LOCOLOR "n/gb"
#define LOCOLOR "n/b"
LOCAL cHi1 := "ÚÄ", cHi2 := "À ", cLo1 :=  "¿", cLo2 := "ÄÙ", n1 := 0, n2 := 0

IF( lHi == NIL, lHi := .f., NIL )

// Background screen
DISPBEGIN() ; CLS

FOR n1 := 0 TO 22 STEP 2
   FOR n2 := 0 TO 78 STEP 3
       @n1  , n2   SAY cHi1 COLOR IF( lHi, HICOLOR, LOCOLOR )
       @n1  , n2+2 SAY cLo1 COLOR IF( lHi, LOCOLOR, HICOLOR )
       @n1+1, n2   SAY cHi2 COLOR IF( lHi, HICOLOR, LOCOLOR )
       @n1+1, n2+1 SAY cLo2 COLOR IF( lHi, LOCOLOR, HICOLOR )
   NEXT
NEXT

// the bottom line
FOR n2 := 0 TO 78 STEP 3
    @24  , n2   SAY cHi1 COLOR IF( lHi, HICOLOR, LOCOLOR )
    @24  , n2+2 SAY cLo1 COLOR IF( lHi, LOCOLOR, HICOLOR )
NEXT

DISPEND()

RETURN NIL
