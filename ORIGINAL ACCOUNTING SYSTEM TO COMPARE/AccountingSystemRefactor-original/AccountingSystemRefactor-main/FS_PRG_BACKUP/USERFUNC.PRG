//  FUNCTIONS
* F_BCLN - clears row 24 of the screen
function f_bcln
local m_oldcol
m_oldcol:=setcolor()
setcolor(m_cmes)
@24,0 clea to 24,79
setcolor(m_oldcol)
return .t.


* F_SELKEY - displays the navigation keys for prompts.
function f_selkey
f_sayit('Press  '+chr(26)+'  '+chr(27)+'  '+chr(24)+'  or  '+chr(25);
+'  to position'+',  '+chr(17)+chr(196)+chr(217)+'  to select, Esc to go back.')
return .t.


function f_browkey  //BROWSING PROMPTS
f_sayit('Press '+chr(24)+' or '+chr(25);
+' to position'+', '+chr(17)+chr(196)+chr(217)+' to select, Ctrl-End to Save, Esc to Abort.')
return .t.


function f_browkey2   //BROWSING PROMPTS
f_sayit('Press '+chr(24)+' '+chr(25)+' '+chr(26)+' or '+chr(27);
+' to navigate'+', '+chr(17)+chr(196)+chr(217)+' or Esc to Close Window.')
return .t.


* F_VIEWKEY - displays the navigation keys for prompts.
function f_viewkey
f_sayit('Press  '+chr(26)+'  '+chr(27)+'  '+chr(24)+'  '+chr(25);
+'  PgUp  PgDn  or  '+chr(17)+chr(196)+chr(217)+'  or <Esc> exit.')
return .t.

* F_VIEWKEY2 - displays the navigation keys for prompts.
function f_viewkey2
f_sayit('Press  '+chr(24)+'  '+chr(25);
+'  PgUp  PgDn  or  '+chr(17)+chr(196)+chr(217)+' to Continue.')
return .t.


* F_SAYIT - displays messages without asking for user input.
function f_sayit(m_mes)
local m_oldcol
m_oldcol:=setcolor()
f_bcln()
setcolor(m_cmes)
@24,(80-len(m_mes)-2)/2 say m_mes
setcolor(m_oldcol)
return .t.


function f_msayit(m_mes)
local m_oldcol
m_oldcol:=setcolor()
f_bcln()
setcolor(m_cmes)
@24,(80-len(m_mes)-2)/2 say m_mes
inkey(1.5)
setcolor(m_oldcol)
return .t.


* F_MESS - displays messages, mesage could be retained if m_bura is true.
function f_mess(m_mes,m_press)
local m_oldcol,m_scrn
m_oldcol:=setcolor()
m_scrn:=savescreen(24,1,24,79)
f_bcln()
setcolor(m_cmes)
@24,(80-len(m_mes)-2)/2 say ' '+m_mes+' '
tone(4100,0.5)
tone(4100,1)
setcolor(m_oldcol)
if m_press
	inkey(0)
	restscreen(24,1,24,79,m_scrn)
endif
return .t.


* F_ERR - displays error messages.
function f_err(m_mes,m_press)
local m_oldcol,m_scrn
m_oldcol:=setcolor()
m_scrn:=savescreen(24,0,24,79)
f_bcln()
setcolor(m_cerr)
@24,(79-len(m_mes)-2)/2 say ' '+m_mes+' '
tone(300,1)
tone(499,5)
tone(700,5)
if m_press
	inkey(0)
else
	inkey(2)
endif
restscreen(24,0,24,79,m_scrn)
setcolor(m_oldcol)
return(.t.)


* F_PASSWORD - asks user for pasword of corresponding rotine.
function f_password(m_ano)
local m_oldcol,m_scrn,m_ctr,m_pass,h,x,magicword
m_oldcol:=setcolor()
m_scrn:=savescreen(11,23,14,57)
m_ctr:=1
setcolor(m_cmen)
f_drawbox(11,23,13,55,1)
set conf off
whil m_ctr<4
	setcolor(m_cnor)
	@12,24 say '  ENTER PASSWORD : Æ        Ø  '
	@12,24 say chr(16)
	@12,54 say chr(17)
	m_pass:=''
	h:=0
	while len(m_pass)<=8
	 	x:=chr(232)
	   set cons off
	   @12,44+h get x pict '!'
	   read
	   set cons on
		if x<>chr(8)
		   @12,44+h say chr(232)
		endif
		if lastkey()=27 .or. x=chr(13) .or. x=chr(232)
			exit
		endif
	   h++
		m_pass+=+x
	end while
	setcolor()
	if lastkey()=27
		exit
	endif
	do case
		case m_ano=10
			magicword:=pcode
		case m_ano=11
			magicword:='INITIAL0'
		case m_ano=12
			magicword:='BACKFILE'
      case m_ano==101
         magicword:='BRECEIVE'
      case m_ano==102
         magicword:='BPOSTWIN'
      case m_ano==103
         magicword:='BUPLOAD'
      case m_ano==104
         magicword:='BEDITUNP'
      case m_ano==105
         magicword:='BRETURN'
      case m_ano==106
         magicword:='BENTADJU'
      case m_ano==107
         magicword:='BASSIGN'
      case m_ano==108
         magicword:='B_OTOPIK'
      case m_ano==109
         magicword:='BPLABELS'
      case m_ano==110
         magicword:='REPRNLBL'
      case m_ano==111
         magicword:='BAUTOROL'
      case m_ano==112
         magicword:='BEDITROL'
      case m_ano==113
         magicword:='BRECVMEM'
      case m_ano==301
         magicword:='BRESERVE'
		case m_ano==202
			magicword:='EDITMAST'
		case m_ano==2021
			magicword:='CPNODELE'
		case m_ano==204
			magicword:='BENDMONT'
		case m_ano==205
			magicword:='EDITPATH'
		case m_ano==206
			magicword:='ENDROLNO'
		case m_ano==207
			magicword:='ROLL2INV'
		case m_ano==208
			magicword:='CLEARSPL'
		case m_ano==209
			magicword:='REPOST'
		case m_ano==302
			magicword:='EDR'
		case m_ano==303
			magicword:='ROLLDELE'
		other
			magicword:='DONTKNOW'
	endcase
	if ! magicword$m_pass
		f_err('*** ACCESS DENIED ***',.t.)
		m_ctr++
	else
		exit
	endif
end while
set confirm on
setcolor(m_oldcol)
restscreen(11,23,14,57,m_scrn)
if m_ctr>3 .or. lastkey()=27
	return .f.
endif
return .t.


function f_begtone
tone(980,2)
inkey(0.1)
tone(3500,1.5)
return .t.


function f_endtone
tone(3500,1.95)
inkey(0.1)
tone(980,1.5)
return .t.

* F_DRAWMEN - draw a pop-up box for menu
function f_drawmen(m_x1,m_y1,m_x2,m_y2,m_line)
local m_box_str,m_oldcol
m_oldcol:=setcolor()
f_begtone()
do case
	case m_line=0
		m_box_str:=spac(9)
	case m_line=1
        m_box_str:='€ﬂ€€€‹€€ '
	case m_line=2
		m_box_str:='…Õª∫ºÕ»∫'+' '
	case m_line=3
		m_box_str:='⁄ƒø≥Ÿƒ¿≥'+'≤'
	case m_line=4
		m_box_str:='…Õª∫ºÕ»∫'+'≤'
	case m_line=5
		m_box_str:='÷ƒ∑∫Ωƒ”∫'+'€'
	case m_line=6
		m_box_str:='÷ƒ∑∫Ωƒ”∫'+'≤'
	otherwise
		m_box_str=spac(9)
endcase
setcolor(m_menbox)
if m_line = 0
	@m_x1,m_y1,m_x2,m_y2 box space(9)
else
   @m_x1,m_y1,m_x2,m_y2 box m_box_str
endif
ft_shadow(m_x1,m_y1,m_x2,m_y2)
setcolor(m_oldcol)
return nil

function f_clirscrn()
pcode:=upper(alltrim(f_xclirscrn(passcode)))
m_company:=alltrim(f_xclirscrn(company))
m_compcode:=alltrim(f_xclirscrn(compcode))
return nil

* F_DRAWBOX - draw a pop-up box
function f_drawbox(m_x1,m_y1,m_x2,m_y2,m_line)
local m_box_str,m_oldcol
m_oldcol:=setcolor()
f_begtone()
do case
	case m_line=0
		m_box_str:=spac(9)
	case m_line=1
        m_box_str:='€ﬂ€€€‹€€ '
	case m_line=2
		m_box_str:='…Õª∫ºÕ»∫'+' '
	case m_line=3
		m_box_str:='⁄ƒø≥Ÿƒ¿≥'+'≤'
	case m_line=4
		m_box_str:='…Õª∫ºÕ»∫'+'≤'
	case m_line=5
		m_box_str:='÷ƒ∑∫Ωƒ”∫'+'€'
	case m_line=6
		m_box_str:='÷ƒ∑∫Ωƒ”∫'+'≤'
	otherwise
		m_box_str:=spac(9)
endcase
setcolor(m_datbox)
if m_line = 0
	@m_x1,m_y1,m_x2,m_y2 box space(9)
else
   @m_x1,m_y1,m_x2,m_y2 box m_box_str
endif
ft_shadow(m_x1,m_y1,m_x2,m_y2)
setcolor(m_oldcol)
return nil


function f_reindex
para m_dbf,m_ntx,m_key
local m_scrn
m_scrn:=savescreen(24,1,24,79)
f_sayit('Reindexing file.  Please wait...')
tone(800,1)
if .not. file('&m_dbf'+'.dbf')
	f_err('&m_dbf '+'file does not exists !',.t.)
else
	if .not. file('&m_ntx'+'.ntx')
		f_sayit('Creating '+'&m_ntx'+' file.  Please wait...')
	endif
	use &m_dbf
	index on &m_key to &m_ntx
endif
use
restscreen(24,1,24,79,m_scrn)
return(.t.)


function f_printest()
local i
f_sayit('PLEASE TURN YOUR PRINTER ON. Press <Esc> to Abort, any key when Ready.')
tone(300,0.5)
tone(200,1)
i:=inke(0)
if i=27
   return(.f.)
endif
while ! isprinter()
	f_err('PRINTER IS NOT READY !  Press <Esc> to Abort, any key to Retry.',.t.)
   if lastkey()=27
      return(.f.)
   endif
end while
f_sayit('PRINTING.  Please wait...')
set console off
set device to print
return .t.


function f_choose(m_mess,m_option1,m_option2)
local m_col_mes,m_col_op1,m_col_op2,m_oldcol,m_chosen
m_col_mes:=int((79-len(m_mess+'   '+m_option1+'    '+m_option2+' '))/2)
m_col_op1:=m_col_mes+len(m_mess+'  ')
m_col_op2:=m_col_op1+len(' '+m_option1+'   ')
m_oldcol:=setcolor()
setcolor(m_cmes)
@24,0 clea to 24,79
tone(800,1)
@24,m_col_mes say m_mess
@24,m_col_op1 prom ' '+m_option1+' '
@24,m_col_op2 prom ' '+m_option2+' '
menu to m_chosen
setcolor(m_oldcol)
f_bcln()
if m_chosen=1
	return .t.
else
	return .f.
endif


function f_askspool(filename)
local m_oldcol,correct,i
m_oldcol:=setcolor()
m_sfname:=alltrim(filename)+space(8-len(alltrim(filename)))
setcolor(m_cmes)
while .t.
	if ! f_choose('PRINTING :','DIRECT','SPOOL')
		if lastkey()=27
			exit
		endif
		correct:=.f.
		while ! correct
			f_bcln()
			@24,5 say 'ENTER SPOOL FILENAME :'
			tone(800,1)
			m_sfname=upper(alltrim(m_sfname))+spac(8-len(alltrim(m_sfname)))
			@24,28 get m_sfname pict '@K!' vali m_sfname#spac(8)
			read
			if lastkey()=27
				exit
			endif
			tone(800,1)
			@24,45 say 'Is the filename correct ? 'get correct pict 'Y'
			read
			if lastkey()=27
				exit
			endif
			if .not. correct
				loop
			endif
			m_sfname=alltrim(m_sfname)
			n_sfname=m_sfname+'.TXT'
			if file('&tpath\&n_sfname')
				f_bcln()
				tone(800,1)
				@24,16 say m_sfname+'.TXT'+' already exists. Overwrite (Y/N) ?' get correct pict 'Y'
				read
			endif
		end while
		if lastkey()=27
			exit
		endif
		f_bcln()
		tone(4100,0.5)
		tone(4100,1)
		m_sfname=alltrim(m_sfname)+'.TXT'
		f_sayit('SPOOLING... FILENAME = '+m_sfname)
		set console off
		set alternate to &tpath\&m_sfname
		set alternate on
		setcolor(m_oldcol)
		return(.t.)
	else
		f_sayit('PLEASE SWITCH ON YOUR PRINTER. Press <Esc> to Abort, any key when Ready.')
		i:=inke(0)
		if lastkey()=27
			exit
		endif
		while ! isprinter()
			f_err('PRINTER IS NOT READY !  Press <Esc> to Abort, any key to Retry.',.t.)
			if lastkey()=27
				exit
			endif
		end while
		if lastkey()=27
			exit
		endif
      f_mess('Printing.  Please wait...',.f.)
		set print on
		set device to print
		set console off
	endif
	exit
end while
setcolor(m_oldcol)
return .f.


function f_2askspool(m_fname)
local _m_oldcol:=setcolor(), _m_correct:=.f.,_m_return:=.f.
if m_fname=""
	m_fname:=spac(8)
endif
setcolor(m_cmes)
while ! _m_correct
	f_bcln()
	@24,5 say 'ENTER SPOOL FILENAME :'
	tone(800,1)
	m_sfname:=upper(alltrim(m_fname))+spac(8-len(alltrim(m_fname)))

	@24,28 get m_sfname pict '@K!' vali m_sfname#space(8)
	read

	if lastkey()=27
		exit
	endif

	tone(800,1)

	@24,45 say 'Is the filename correct ? 'get _m_correct picture 'Y'
	read

	if lastkey()=27
		exit
	endif

	if _m_correct
   	m_sfname:=alltrim(m_sfname)
   	n_sfname:=m_sfname+'.TXT'
   	if file('&tpath\&n_sfname')
   		f_bcln()
   		tone(800,1)
   		@24,16 say m_sfname+'.TXT'+' already exists. Overwrite (Y/N) ?' get _m_correct pict 'Y'
   		read
         if lastkey()=27
            exit
         endif
   	endif

      if _m_correct
        	f_bcln()
        	tone(4100,0.5)
        	tone(4100,1)
        	m_sfname:=alltrim(m_sfname)+'.TXT'
         f_sayit('SPOOLING... FILENAME = '+m_sfname)
        	set console off
        	set printer to &tpath\&m_sfname
        	set device to print
         _m_return:=.t.

      else
         loop

      endif

      exit

   endif

end while
setcolor(_m_oldcol)
return(_m_return)


function f_3askspool
para m_sfname
local correct
if m_sfname=""
	m_sfname:=spac(8)
endif
m_oldcol:=setcolor()
setcolor(m_cmes)
while .t.
	if ! f_choose('PRINTING :','DIRECT','SPOOL')
		if lastkey()=27
			exit
		endif
		correct:=.f.
		while ! correct
			f_bcln()
			@24,5 say 'ENTER SPOOL FILENAME :'
			tone(800,1)
			m_sfname:=upper(alltrim(m_sfname))+spac(8-len(alltrim(m_sfname)))
			@24,28 get m_sfname pict '@K!' vali m_sfname#spac(8)
			read
			if lastkey()=27
				exit
			endi
			tone(800,1)
			@24,45 say 'Is the filename correct ? 'get correct pict 'Y'
			read
			if lastkey()=27
				exit
			endif
			if ! correct
				loop
			endif
			m_sfname:=alltrim(m_sfname)
			n_sfname:=m_sfname+'.TXT'
			if file('&tpath\&n_sfname')
				f_bcln()
				tone(800,1)
				@24,16 say m_sfname+'.TXT'+' already exists. Overwrite (Y/N) ?' get correct pict 'Y'
				read
			endif
		end while
		if lastkey()=27
			exit
		endif
		f_bcln()
		tone(4100,0.5)
		tone(4100,1)
		m_sfname:=alltrim(m_sfname)+'.TXT'
		f_sayit('SPOOLING... FILENAME = '+m_sfname)
		set console off
		set alternate to &tpath\&m_sfname
		set alternate on
		set colo to (m_oldcol)
		return(.t.)

	else
		f_sayit('PLEASE SWITCH ON YOUR PRINTER. Press <Esc> to Abort, any key when Ready.')
		i:=inke(0)
		if lastkey()=27
			exit
		endif
		while ! isprinter()
			f_err('PRINTER IS NOT READY !  Press <Esc> to Abort, any key to Retry.',.t.)
			if lastkey()=27
				exit
			endif
		end while
		if lastkey()=27
			exit
		endif
      f_mess('Printing.  Please wait...',.f.)
		set printer on
		set device to print
		set console off

	endif
	exit

end while
setcolor(m_oldcol)
return .f.


function f_naskspool
m_oldcol:=setcolor()
setcolor(m_cmes)
while .t.
	if .not. f_choose('PRINTING :','DIRECT','SPOOL')
		if lastkey()=27
			exit
		endif
		correct:=.f.
		while ! correct
			f_bcln()
			@24,5 say 'ENTER SPOOL FILENAME :'
			tone(800,1)
			m_sfname:=upper(alltrim(m_sfname))+spac(8-len(alltrim(m_sfname)))
			@24,28 get m_sfname pict '@K!' vali m_sfname#spac(8)
			read
			if lastkey()=27
				exit
			endif
			tone(800,1)
			@24,45 say 'Is the filename correct ? 'get correct pict 'Y'
			read
			if lastkey()=27
				exit
			endif
			m_sfname:=alltrim(m_sfname)
			n_sfname:=m_sfname+'.TXT'
			if file('&tpath\&n_sfname')
				f_bcln()
				tone(800,1)
				@24,16 say m_sfname+'.TXT'+' already exists. Overwrite (Y/N) ?' get correct pict 'Y'
				read
			endif

		end while
		if lastkey()=27
			exit
		endif
		f_bcln()
		tone(4100,0.5)
		tone(4100,1)
		m_sfname:=alltrim(m_sfname)+'.TXT'
		f_sayit('SPOOLING... FILENAME = '+m_sfname)
		set console off
		set alternate to &tpath\&m_sfname
		set alternate on
		setcolor(m_oldcol)
		return .t.

	else
		f_sayit('PLEASE SWITCH ON YOUR PRINTER. Press <Esc> to Abort, any key when Ready.')
		i:=inke(0)
		if lastkey()=27
			exit
		endif
		while ! isprinter()
			f_err('PRINTER IS NOT READY !  Press <Esc> to Abort, any key to Retry.',.t.)
			if lastkey()=27
				exit
			endif
		end while
		if lastkey()=27
			exit
		endif
      f_mess('Printing.  Please wait...',.f.)
		set printer on
		set device to print
		set console off

	endif
	exit

end while
setcolor(m_oldcol)
return .f.


function f_setting
f_sayit('Setting-up Database Files.  Please wait...')
return .t.

function net_use
para m_payl,_m_ex_use,_m_wait,_m_readonly,m_alias
if m_alias=''
   m_alias=subs(m_payl,rat('\',m_payl)+1)
endif
_m_return:=.f.
while .t.
   if file("&m_payl"+'.dbf')
      while .t.
	      while _m_wait > 0
      	   f_setting('Setting-up '+m_payl+'.dbf.  Please wait...',.f.)
         	if _m_ex_use
               if _m_readonly
      	         use &m_payl exclusive readonly alias '&m_alias'
               else
   	            use &m_payl exclusive alias '&m_alias'
               endif
      	   else
               if _m_readonly
            	   use &m_payl shared readonly alias '&m_alias'
               else
            	   use &m_payl shared alias '&m_alias'
               endif
   	      endif
   	      if .not. neterr()
   	         _m_return:=.t.
               exit
   	      endif
   	      inkey(1)
   	      _m_wait--
   	   end while
         if _m_return=.t.
            exit
         endif
   	   _m_retry = .t.
   	   if f_choose('File(s) not available.  Retry ?','YES','NO')
	   	   set deli off
   	   	if f_esc()
   	      	exit
   		   endif
   	   	f_bcln()
   		   f_setting()
     		   _m_wait:=5
   		else
   	   	exit
   		endif
   	end while

   else
   	f_mess(m_payl+" does not exist !   Can't continue...",.t.)

   endif
   f_bcln()
   exit

end while
return (_m_return)


function fil_lock(wait)
local forever,m_scrn
m_scrn:=savescreen(24,0,24,79)
if flock()
   return .t.
endif
while .t.
   while  wait > 0
      if flock()
         return (.t.)
      endif
      inkey(.5)
      wait-=0.5
   end while
   f_bcln()
  	if f_choose('File(s) not available.  Retry ? ','YES','NO')
   	if lastkey() = 27
      	exit
	   endi
   	f_bcln()
	   wait = 5

	else
      exit
   endif

end while
restscreen(24,0,24,79,m_scrn)
return .f.


function rec_lock(wait)
local forever,m_scrn
m_scrn:=savescreen(24,0,24,79)
if rlock()
   return .t.
endif
while .t.
   while  wait > 0
      if rlock()
         return (.t.)
      endif
      inkey(.5)
      wait-=0.5
   end while
   f_bcln()
  	if f_choose('Cannot Lock Record. Retry ? ','YES','NO')
   	if lastkey() = 27
      	exit
	   endi
   	f_bcln()
	   wait = 5

	else
      exit
   endif

end while
restscreen(24,0,24,79,m_scrn)
return .f.




function f_dbedit                  && activates dbedit() program
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


function f_ask(m_mes)
local m_oldcol,m_scrn,m_col,m_chosen
m_oldcol:=setcolor()
m_scrn:=savescreen(24,0,24,79)
f_bcln()
setcolor(m_cmes)
m_col:=int(66-len(m_mes))/2
@24,m_col say m_mes
tone(980,2)
inkey(0.1)
while .t.
   @24,m_col+len(m_mes)+3 prom ' YES '
   @24,m_col+len(m_mes)+9 prom ' NO '
   menu to m_chosen
   do case
      case m_chosen=1
			restscreen(24,0,24,79,m_scrn)
			setcolor(m_oldcol)
         return .t.
      case m_chosen=2
         restscreen(24,0,24,79,m_scrn)
			setcolor(m_oldcol)
         return .f.
      otherwise
         loop
   endcase
end while


function f_about()
local m_oldcol,m_scrn
if _m_helpon
	return(.t.)
endif
_m_helpon:=.t.
m_oldcol:=setcolor()
m_scrn:=savescreen(4,4,22,77)
f_drawbox(4,4,21,75,3)
setcolor(m_cmes)
@5,5 clear to 20,74
@ 5,6 say 'About the system...'
@ 7,6 say '       The program boasts of 100% user-friendly screens and is menu-'
@ 8,6 say 'driven.  The system is protected by passwords ensuring the confiden-'
@ 9,6 say 'tiality and safety of the data/information stored in the program.  A'
@10,6 say 'quick  help  access was provided to assist the user in the effective'
@11,6 say 'and full utilization of the system.  Message  and  navigation  lines'
@12,6 say 'were also included to help the user  in  understanding  each  chosen'
@13,6 say 'menu and to determine when and where to proceed in the course of the'
@14,6 say 'program usage.'
@15,6 say '       No part of this  system can be copied, duplicated nor altered'
@16,6 say 'without the prior permission of the author.'
inkey(40)
restscreen(4,4,22,77,m_scrn)
setcolor(m_oldcol)
_m_helpon:=.f.
return .t.


function f_center(m_mes,m_col)
retu(int((m_col-len(alltrim(m_mes)))/2))

function f_clnmes
local m_oldcol
m_oldcol:=setcolor()
setcolor()
@23,0 clea to 23,79
setcolor(m_oldcol)
return(.t.)

function f_sscrn(m_mes)
retu(alltrim(subs(m_mes,1,14))+repl('.',14-len(alltrim(subs(m_mes,1,14)))))

function f_rscrn(m_mes)
retu(alltrim(m_mes)+spac(10-len(alltrim(m_mes))))

function p_calendar
set key -9 to
m_date:=ft_popupcal()
set key -9 to p_calendar
return nil

FUNCTION FT_POPUPCAL(dInitDate,nTopRow,nLeftCol,lShadow,aColors,dOldDate)
#include "inkey.ch"
#include "box.ch"
#define K_MINUS    45
#define K_EQUAL    61
#define K_PLUS	   43
#define K_SH_PGUP  57
#define K_SH_PGDN  51
#define K_C        99
#define K_c        67
*#define K_CTRL_UP 397    && JR
#define K_CTRL_DN 401    && JR
#define pDate	   "D"
#define pOldDate   "D"
#define pNumeric   "N"
#define pLogical   "L"
#define pArray	   "A"
#define pLine1a    "   " + CHR( 26 ) + " "
#define pLine1b    "Day"
#define pLine2a    "CTRL   "
#define pLine2b    "Month"
#define pLine3a    "  +   -"
#define pLine3b    "Year"
#define pLine4a    "  Home"
#define pLine4b    "Init Date"
#define pLine5a    "CTRL Home"
#define pLine5b    "Today"
#define pLine6a    " <Esc>"
#define pLine6b    "E X I T   "
#define pCalWidth  24  // Overall width of calendar, excluding shadow
#define pCalHeight 17  // Overall height of calendar, excluding shadow
#define pSBar	   "⁄ƒø≥Ÿƒ¿≥"
#define pBold	   "€ﬂ€€€‹€€"

// Set up manifest constants to access the window colors array
#define pC_Border  1   // Color of calendar border
#define pC_Title   2   // Color of month title
#define pC_DOW	   3   // Color of days of week header
#define pC_AnyDate 4   // Color of any unselected date
#define pC_SelDate 5   // Color of selected date
#define pC_InfoBox 6   // Color of info box
#define pC_PageBox 7   // Color of calendar page box
#define pC_Info    8   // Color of info text

static save_cVar
static cScreen
static cScreenm
static keylast
static d_mess          && JR


#translate VALIDATE(<x>, <y>, <z>)  =>	;
	   IF( <x> = NIL, <z>, IF( VALTYPE(<x>) != <y>, <z>, <x> ))

LOCAL lExit	   := .f.
LOCAL lNewMonth    := .f.
LOCAL cOldColor    := SETCOLOR()
LOCAL bChkMonth    := ;
	  {|D,nD|MONTH(D)==MONTH(D+nD) .AND. YEAR(D)==YEAR(D+nD)}
LOCAL nOldCursor, nLastKey, dWorkDate, nLastDOM, cMonth, nFirstDOW
LOCAL nDay, nMonth, nYear, cYear, nScrn_loc, nDayNumber, cDay
LOCAL i, k

LOCAL aRow := {}, aCol := {}

dOldDate  := VALIDATE( dOldDate,  pOldDate, NIL)
dInitDate := VALIDATE( dInitDate, pDate,    NIL)
nTopRow   := VALIDATE( nTopRow,   pNumeric, NIL)
nLeftCol  := VALIDATE( nLeftCol,  pNumeric, NIL)
lShadow   := VALIDATE( lShadow,   pLogical, NIL)
aColors   := VALIDATE( aColors,   pArray,   NIL)

dOldDate  := IF( dOldDate =  NIL, dInitDate, dOldDate )
dInitDate := IF( dInitDate = NIL, DATE(), dInitDate)
lShadow   := IF( lShadow = NIL, .f., lShadow)

IF nTopRow = NIL

   nTopRow = IF(ROW() < MAXROW()/2, MAXROW()-pCalHeight-3, 3)
   ELSE
   nTopRow = IF(nTopRow > MAXROW()-pCalHeight-1, ;
		MAXROW()-pCalHeight-3, nTopRow)

ENDIF

IF nLeftCol = NIL

   nLeftCol = IF(COL() < MAXCOL()/2, MAXCOL()-pCalWidth-4, 2)
   ELSE
   nLeftCol = IF(nLeftCol > MAXCOL()-pCalWidth-2, ;
		 MAXCOL()-pCalWidth-4, nLeftCol)

ENDIF

IF !ISCOLOR()

   aColors := { 'W/N', 'W+/N', 'W/N', 'N/W', 'W+/N', 'N/W', ;
		   'N/W', 'W/N' }
   ELSE

   IF aColors = NIL

       aColors := { 'GR+/B', 'W+/B', 'W/B', 'W+/N+', 'W+/BG+',;
		    'W+/N+','W/N+', 'W/B' }

   ENDIF

ENDIF

cScreen    := FT_SAVRGN(nTopRow,nLeftCol,nTopRow+pCalHeight+1,;
			nLeftCol+pCalWidth+2)
dWorkDate  := dInitDate  // hold the calling date in case user
			 // escapes from this routine.
nOldCursor := SETCURSOR(0)

// define X/Y coordinates of calendar proper


FOR k = 1 TO 6

   FOR i = 1 TO 7

      AADD( aRow, k + nTopRow + 3)    // First row is nTopRow + 4
      AADD( aCol, (3*i-1) + nLeftCol) // First col is nLeftCol + 3

   NEXT

NEXT

// Draw Background calendar
DISPBEGIN()    // Use this function to "snap" the calendar
	       // onto the screen
SETCOLOR( aColors[pC_Info] )
@ nTopRow,nLeftCol CLEAR TO nTopRow+pCalHeight,nLeftCol+pCalWidth
@ nTopRow+11,nLeftCol+12 SAY pLine1b
@ nTopRow+12,nLeftCol+12 SAY pLine2b
@ nTopRow+13,nLeftCol+12 SAY pLine3b
@ nTopRow+14,nLeftCol+12 SAY pLine4b
@ nTopRow+15,nLeftCol+12 SAY pLine5b
@ nTopRow+16,nLeftCol+12 SAY pLine6b

SETCOLOR( aColors[pC_DOW] )
@ nTopRow+3,nLeftCol+3 SAY "S M  T  W  T  F  S" // days of the week

set color to gr+/b  &&  SETCOLOR( aColors[pC_InfoBox] )
@ nTopRow+11,nLeftCol+2 CLEAR TO nTopRow+16,nLeftCol+10
@ nTopRow+11,nLeftCol+2 SAY pLine1a
@ nTopRow+12,nLeftCol+2 SAY pLine2a
@ nTopRow+13,nLeftCol+2 SAY pLine3a
@ nTopRow+14,nLeftCol+2 SAY pLine4a
@ nTopRow+15,nLeftCol+2 SAY pLine5a
@ nTopRow+16,nLeftCol+2 SAY pLine6a
SETCOLOR( aColors[pC_Border] )
@ nTopRow, nLeftCol, nTopRow+pCalHeight, nLeftCol+pCalWidth BOX B_DOUBLE
@ nTopRow+2, nLeftCol+1, nTopRow+10, nLeftCol+pCalWidth-1   BOX pSBar

DISPEND()

//IF lShadow
   FT_SHADOW(nTopRow, nLeftCol+1, nTopRow+pCalHeight, ;
   	     nLeftCol+pCalWidth)
//ENDIF

// Start of major program loop
DO WHILE !lExit

   // Day, Month, Year, first day, last day of month data

   nMonth     := MONTH(dWorkDate)
   nYear      := YEAR(dWorkDate)
   cYear      := STR(nYear)
   nDay       := DAY(dWorkDate)
   nLastDOM   := _FTLASTDAY(nMonth,nYear) // the day number of the
				       // last day in this month
   nFirstDOW  := DOW(CTOD(STR(nMonth,2)+'/01/'+cYear))
   nDayNumber := 0

   IF !lNewMonth // Redraw calendar if MORE than a day select occurs.

      SETCOLOR( aColors[pC_Title] )
      cMonth := CMONTH(dWorkDate) + ' ' + cYear
      @ nTopRow+1,nLeftCol+1 SAY SPACE(pCalWidth-2)
      @ nTopRow+1,nLeftCol+1 SAY SPACE((pCalWidth-LEN(cMonth))/2)+cMonth

      SETCOLOR( aColors[pC_PageBox] )
      @ nTopRow+4,nLeftCol+2 CLEAR TO nTopRow+9,nLeftCol+pCalWidth-2

   ENDIF

   DISPBEGIN()	// If key response is an issue (on slow machines)
		// remove this function.  With it in, the changes
		// "snap" onto the screen, but it does slightly
		// delay response.
   SETCOLOR( aColors[pC_AnyDate] )
   FOR nScrn_loc = nFirstDOW TO (nFirstDOW + nLastDOM - 1)

      cDay = STR(++nDayNumber,2)

      IF nDayNumber = DAY(dWorkDate) // Test for selected date &
				     // change color

	   SETCOLOR( aColors[pC_SelDate] )
	   @ aRow[nScrn_loc],aCol[nScrn_loc] SAY cDay
	   SETCOLOR( aColors[pC_AnyDate] )
	   LOOP

      ENDIF

      @ aRow[nScrn_loc],aCol[nScrn_loc] SAY cDay

   NEXT
   DISPEND()

   DO WHILE .T.  // Use this loop to prevent nonsense keys
		 // from redrawing the calendar.

     INKEY(0)
     nLastKey  := LASTKEY()
     lNewMonth := .F.  // Assume that user will change calendar month

     DO CASE

       CASE nLastKey == K_RIGHT 	// increase by one day
	 lNewMonth := EVAL(bChkMonth,dWorkDate,1)
	 dWorkDate++

       CASE nLastKey == K_LEFT		// decrease by one day
	 lNewMonth := EVAL(bChkMonth,dWorkDate,-1)
	 dWorkDate--

       CASE nLastKey == K_UP		// increase by seven days
	 lNewMonth := EVAL(bChkMonth,dWorkDate,-7)
	 dWorkDate := dWorkDate-7

       CASE nLastKey == K_DOWN		// decrease by seven days
	 lNewMonth := EVAL(bChkMonth,dWorkDate,7)
	 dWorkDate := dWorkDate+7

       CASE nLastKey == K_CTRL_HOME		// Control-Home key
	 dWorkDate := DATE()                    // System Date

       CASE nLastKey == K_HOME                  // Home Key
         dInitDate := dOldDate                  // Original Passed Date
         *lExit := .T.  && JR -- I don't like exiting here

       CASE nLastKey == K_ESC   // Exit no save
         dInitDate := dOldDate
         lExit := .T.

       CASE nLastKey == K_ENTER // Exit save
	 lExit := .T.
         keyboard chr(K_ENTER)   && JR - terminate the get with the new value

       CASE nLastKey == K_CTRL_UP  && K_PGUP		// page-up key	- back one month
	 nMonth--

	 IF nMonth < 1
	   nMonth := 12
	   nYear--
	 ENDIF

	 dWorkDate := _FTMAKDATE(nMonth,nDay,nYear)

       CASE nLastKey == K_MINUS 	// " - " - back one year
	 dWorkDate := _FTMAKDATE(nMonth,nDay,--nYear)

       CASE nLastKey == K_CTRL_PGDN 	// " - " - back one DECADE
	 dWorkDate := _FTMAKDATE(nMonth,nDay,nYear-10)

       CASE nLastKey == K_SH_PGDN 	// " - " - back one CENTURY
	 dWorkDate := _FTMAKDATE(nMonth,nDay,nYear-100)

       CASE nLastKey == K_CTRL_DN && K_PGDN		// page-down key - ahead one month

	 IF ++nMonth > 12
	   nMonth := 1
	   nYear++
	 ENDIF

	 dWorkDate := _FTMAKDATE(nMonth,nDay,nYear)

       CASE nLastKey == K_EQUAL .OR. nLastKey == K_PLUS
					// "= " - ahead one year
	 dWorkDate := _FTMAKDATE(nMonth,nDay,++nYear)

       CASE nLastKey == K_CTRL_PGUP  //  "  ahead one DECADE
	 dWorkDate := _FTMAKDATE(nMonth,nDay,nYear+10)

       CASE nLastKey == K_SH_PGUP  //  "  ahead one CENTURY
	 dWorkDate := _FTMAKDATE(nMonth,nDay,nYear+100)

       OTHERWISE
	 LOOP

     ENDCASE

     EXIT

   ENDDO

ENDDO

// Let's get out of here!

FT_RSTRGN(cScreen,nTopRow,nLeftCol)
SETCOLOR(cOldColor)
SETCURSOR(nOldCursor)

// return the date the user selected, or the calling date
// if user exited with Escape.

RETURN IF(nLastKey==K_ESC .or. nLastKey==K_HOME,dInitDate,dWorkDate)

/*************
*
*   Function _FTLASTDAY --> Returns last day of month as an integer
*/

//STATIC FUNCTION _FTLASTDAY(nMonth,nYear)
FUNCTION _FTLASTDAY(nMonth,nYear)
LOCAL nLastDate

nLastDate := CTOD(STR(nMonth,2)+'/27/'+STR(nYear))

DO WHILE nMonth == MONTH(++nLastDate)
ENDDO

RETURN DAY(--nLastDate)

//STATIC FUNCTION F_LASTDAY(nMonth,nYear)
FUNCTION F_LASTDAY(nMonth,nYear)
LOCAL nLastDate
nLastDate := CTOD(STR(nMonth,2)+'/27/'+STR(nYear))
DO WHILE nMonth == MONTH(nLastDate)
   nLASTDATE++
ENDDO
nLASTDATE--
RETURN (nLastDate)

/*************
*
*    Function _FTMAKDATE --> Returns date as a string
*
*
*  Receives integers of the month day and year and returns
*  a composite date.
*  If day in month is greater than the true numbers in the
*  month it returns the last day.
*/

STATIC FUNCTION _FTMAKDATE(nMonth,nDay,nYear)
LOCAL dDate

IF nYear < 100
   nYear = 3000 - (100 - nYear)
else
   If nYear > 2999
      nYear = 100 + (nYear - 3000)
   endif
endif

dDate := CTOD(STR(nMonth,2)+'/'+STR(nDay,2)+'/'+STR(nYear))

IF dDate == CTOD(" / / ")
   dDate := CTOD(STR(nMonth,2)+'/'+STR(_FTLASTDAY(nMonth,nYear),2)+ ;
	     '/'+STR(nYear))
ENDIF

RETURN (dDate)

*---- DStart -----------------------------------------------------------------*

function DStart
* turn on special handling of keys for date changing


  cScreenm = FT_SAVRGN(24,2,24,79)
  dMESS()

  set key K_PLUS to DMove           && Assign procedure 
  set key K_MINUS to DMove          
  set key K_C to DMove
  set key K_c to DMove
  set key K_HOME to DMove
  set key K_CTRL_HOME to DMove
  *set key K_PGUP to DMove
  *set key K_PGDN to DMove
  set key K_CTRL_UP to DMove   && JR
  set key K_CTRL_DN to DMove   && JR
  set key K_CTRL_PGUP to DMove
  set key K_CTRL_PGDN to DMove
  set key K_ESC to DMove
 *  KEYBOARD CHR(K_C)

  return .t.

*----- DStop -----------------------------------------------------------------*

function DStop
* turn off special key handling for date changing & restore screen

  set key K_PLUS to                 && Change plus key back to normal
  set key K_MINUS to                && Change minus key back to normal
  set key K_C to
  set key K_c to
  set key K_HOME to
  set key K_CTRL_HOME to
  *set key K_PGUP to
  *set key K_PGDN to
  set key K_CTRL_UP to
  set key K_CTRL_DN to
  set key K_CTRL_PGUP to
  set key K_CTRL_PGDN to
  set key K_ESC to
  set Escape on

  FT_RSTRGN(cScreenm)  && ,24,2)
  save_cVar = NIL
 return .t.

*---DGetStop------------------------------------------------------------------*

Function DGetStop
dstop()
clear gets
return .t.

*----- DMove -----------------------------------------------------------------*

procedure DMove
* increment or decrement the passed variable if it is of date type
* if it's an empty date, set it to today's date

PARAMETER cProc, nLine, cVar


IF TYPE(cVar) == "D"              && If it is a date field
*if empty(save_cVar)
if save_cVar = NIL
   save_cVar = &cVar
endif

   do case
    case LASTKEY() == K_PLUS        && If the plus key was hit
       IF EMPTY(&cVar)                 && If it is empty
          &cVar = DATE()                && Set to today's date
       else
          &cVar = &cVar + 1           && Increment the date field
       endif

    case LASTKEY() == K_MINUS
       IF EMPTY(&cVar)                 && If it is empty
          &cVar = DATE()                && Set to today's date
       else
          &cVar = &cVar - 1           && Decrement the date field
       endif

    case LASTKEY() == K_C .or. LASTKEY() == K_c
       IF EMPTY(&cVar)
           &cVar = date()
       endif
       &cVar = FT_popupcal(&cVar, , ,.t., ,save_cVar)

    case LASTKEY() == K_HOME
       &cVar = save_cVar

    case LASTKEY() == K_ESC
      &cVar = save_cVar
      set key K_ESC to DGETSTOP
      

    case LASTKEY() == K_CTRL_HOME
       &cVar = DATE()


   endcase

   if LASTKEY() != K_ESC
        set key K_ESC to DMove
   endif 

ENDIF

RETURN

*----DMESS--------------------------------------------------------------------*

Function DMESS
   d_mess = " +/- increments/decrements date -- ";
            + "C pops up Calendar " 
   && --- F1 = Help "
   @ 24, 2 say d_mess color if(iscolor(), "R/BG","W+/n")
return


FUNCTION Squares( lHi )
#define SB9 "€€€€€€€€€"
*#define HICOLOR "bg+/bg"
#define HICOLOR "b+/b"
*#define LOCOLOR "n/gb"
#define LOCOLOR "n/b"
LOCAL cHi1 := "⁄ƒ", cHi2 := "¿ ", cLo1 :=  "ø", cLo2 := "ƒŸ", n1 := 0, n2 := 0

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
*****************************************************************************
FUNCTION Checkers

LOCAL n  := 0, nn := 0, cOldClr := SETCOLOR( "bg/n" )

DISPBEGIN() ; CLS

FOR n := 0 TO 19 STEP 4
    FOR nn := 0 TO 72 STEP 18
        @ n,   nn SAY SB9
        @ n+1, nn SAY SB9
        @ n+2, nn SAY SB9
        @ n+3, nn SAY SB9
    NEXT
    n += 4
    FOR nn := 0 TO 72 STEP 18
        @ n,   nn+9 SAY SB9
        @ n+1, nn+9 SAY SB9
        @ n+2, nn+9 SAY SB9
        @ n+3, nn+9 SAY SB9
    NEXT
NEXT

// last line
FOR nn := 0 TO 72 STEP 18
    @ 24, nn SAY SB9
NEXT

DISPEND() ; SETCOLOR( cOldClr )

RETURN NIL
******************************************************************
FUNCTION Egypt( lHi )

LOCAL n := 0, nn := 0, cOldClr := SETCOLOR( HICOLOR )

IF( lHi == NIL, lHi := .t., NIL )

DISPBEGIN() ; CLS

FOR n := 1 TO 17 STEP 8
    FOR nn := 0 TO 70 STEP 14
        SETCOLOR( IF( lHi, HICOLOR, LOCOLOR ) )
        @n  ,nn SAY "ƒƒƒƒƒƒƒƒ  ⁄ƒƒƒ"
        @n+1,nn SAY "      ø   ≥ ⁄ƒ"
        @n+2,nn SAY "⁄ƒƒƒƒ ≥   ≥ ≥ "
        @n+3,nn SAY "≥     ≥   ≥ ≥ "
        @n+4,nn SAY "≥  ⁄ƒƒŸ   ≥ ≥ "
        @n+5,nn SAY "≥  ¿      ≥ ≥ "
        @n+6,nn SAY "≥  ƒƒƒƒƒƒƒŸ ≥ "
        @n+7,nn SAY "¿             "

      SETCOLOR( IF( lHi, LOCOLOR, HICOLOR ) )
      @n   ,nn+8  SAY "ø"
      @n+1 ,nn-1  SAY "ƒƒƒƒƒƒƒ"; @n+ 1,nn+8  SAY "≥"     ; @n+ 1,nn+12 SAY "⁄"
      @n+ 2,nn+5  SAY "ø"      ; @n+ 2,nn+8  SAY "≥"     ; @n+ 2,nn+12 SAY "≥"
      @n+ 3,nn+2  SAY "⁄ƒƒŸ"   ; @n+ 3,nn+8  SAY "≥"     ; @n+ 3,nn+12 SAY "≥"
      @n+ 4,nn+2  SAY "≥"      ; @n+ 4,nn+8  SAY "≥"     ; @n+ 4,nn+12 SAY "≥"
      @n+ 5,nn+2  SAY "≥"      ; @n+ 5,nn+4  SAY "ƒƒƒƒŸ" ; @n+ 5,nn+12 SAY "≥"
      @n+ 6,nn+2  SAY "¿"      ; @n+ 6,nn+12 SAY "≥"
      @n+ 7,nn+1  SAY "ƒƒƒƒƒƒƒƒƒƒƒŸ"
    NEXT
NEXT

DISPEND() ; SETCOLOR( cOldClr )

RETURN NIL


function f_spilog
local y,x
setcolor('n/b')
clear
setcolor('b+/b')
for y=4 to 54 step 25
	for x=4 to 16 step 6
		@x,y   say '⁄ƒƒƒƒƒƒƒ ⁄ƒƒƒƒƒƒƒ ⁄ƒƒ'
		@x+1,y say '≥        ≥    ø   ≥'
		@x+2,y say '≥   ƒƒƒƒ ≥   ƒŸ   ≥'
		@x+3,y say '¿        ≥        ≥'
		@x+4,y say '⁄ƒƒƒƒŸ   ≥        ≥'
		@x+5,y say '¿        ¿        ¿ '
	next x
next y
setcolor('n/b')
for y=0 to 50 step 25
	for x=4 to 16 step 6
		@x  ,y+12 say 'ø'
		@x  ,y+21 say 'ø'
		@x  ,y+25 say 'ø'
		@x+1,y+7 say '⁄ƒƒƒƒŸ'
		@x+1,y+16 say '⁄ƒ'
		@x+1,y+21 say '≥'
		@x+1,y+25 say '≥'
		@x+2,y+7 say '¿'
		@x+2,y+12 say 'ø'
		@x+2,y+16 say '¿'
		@x+2,y+21 say '≥'
		@x+2,y+25 say '≥'
		@x+3,y+5 say 'ƒƒƒƒø'
		@x+3,y+12 say '≥'
		@x+3,y+16 say '⁄ƒƒƒƒŸ'
		@x+3,y+25 say '≥'
		@x+4,y+12 say '≥'
		@x+4,y+16 say '≥'
		@x+4,y+25 say '≥'
		@x+5 ,y+5 say 'ƒƒƒƒƒƒƒŸ'
		@x+5,y+14 say 'ƒƒŸ'
		@x+5,y+23 say 'ƒƒŸ'
	next x
next y
return nil


function f_swwlog
local x,y
setcolor('n/b')
clear
for y=9 to 44 step 35
	for x=4 to 16 step 6
		@x,y   say '⁄        ⁄  ⁄  ⁄   ⁄  ⁄  ⁄ƒ'
		@x+1,y say '≥ ⁄ƒƒƒƒ  ≥  ≥  ≥   ≥  ≥  ≥'
		@x+2,y say '≥        ≥  ≥  ≥   ≥  ≥  ≥'
		@x+3,y say '¿ƒƒƒƒø   ≥  ≥  ≥   ≥  ≥  ≥'
		@x+4,y say '⁄    Ÿ   ≥  Ÿ  Ÿ   ≥  Ÿ  Ÿ'
		@x+5,y say '¿ƒƒƒƒƒƒ  ¿ƒƒƒƒƒƒƒ  ¿ƒƒƒƒƒƒƒ'
	next x
next y

setcolor('b+/b')
for y=0 to 35 step 35
	for x=4 to 16 step 6
      // ƒƒƒƒƒƒø  ƒø ƒø ƒø  ƒø ƒø ƒø
      @x  ,y+10 say 'ƒƒƒƒƒƒø'
		@x  ,y+19 say 'ƒø'
		@x  ,y+22 say 'ƒø'
		@x  ,y+25 say 'ƒø'
		@x  ,y+29 say 'ƒø'
		@x  ,y+32 say 'ƒø'
		@x  ,y+35 say 'ƒø'
      //  Ÿ   ≥  ≥  ≥   ≥  ≥  ≥
		@x+1,y+16 say 'Ÿ'
		@x+1,y+20 say '≥'
		@x+1,y+23 say '≥'
		@x+1,y+26 say '≥'
		@x+1,y+30 say '≥'
		@x+1,y+33 say '≥'
		@x+1,y+36 say '≥'
      // ¿ƒƒƒƒø   ≥  ≥  ≥   ≥  ≥  ≥
		@x+2,y+11 say '¿ƒƒƒƒø'
		@x+2,y+20 say '≥'
		@x+2,y+23 say '≥'
		@x+2,y+26 say '≥'
		@x+2,y+30 say '≥'
		@x+2,y+33 say '≥'
		@x+2,y+36 say '≥'
      //   ≥   ≥  ≥  ≥   ≥  ≥  ≥
		@x+3,y+16 say '≥'
		@x+3,y+20 say '≥'
		@x+3,y+23 say '≥'
		@x+3,y+26 say '≥'
		@x+3,y+30 say '≥'
		@x+3,y+33 say '≥'
		@x+3,y+36 say '≥'
      //  ƒƒƒƒŸ ≥   ¿  ¿  ≥   ¿  ¿  ≥
		@x+4,y+10 say 'ƒƒƒƒ'
		@x+4,y+16 say '≥'
		@x+4,y+20 say '¿'
		@x+4,y+23 say '¿'
		@x+4,y+26 say '≥'
		@x+4,y+30 say '¿'
		@x+4,y+33 say '¿'
		@x+4,y+36 say '≥'
  		//   Ÿ         Ÿ         Ÿ
		@x+5,y+16 say 'Ÿ'
		@x+5,y+26 say 'Ÿ'
		@x+5,y+36 say 'Ÿ'
	next x
next y
return nil


function f_esc()
return iif(lastkey()=27,.t.,.f.)


function f_pcenter(_m_text,_m_columns)
local m_return
if len(alltrim(_m_text)) > _m_columns
   m_return:=alltrim(m_text)
else
   m_return:=space((_m_columns-len(alltrim(_m_text)))/2)+alltrim(_m_text)
endif
return m_return


function f_pright(_m_text,_m_columns)
local m_return
if len(alltrim(_m_text)) > _m_columns
   m_return:=subs(alltrim(m_text),1,_m_columns)
else
   m_return:=space(_m_columns-len(alltrim(_m_text)))+alltrim(_m_text)
endif
return m_return


function f_pleft(_m_text,_m_columns)
local m_return
if len(alltrim(_m_text)) > _m_columns
   m_return:=subs(alltrim(m_text),1,_m_columns)
else
   m_return:=alltrim(_m_text)+space(_m_columns-len(alltrim(_m_text)))
endif
return m_return


function f_fileback()
para m_payl
m_pay:=alltrim(m_payl)+".dbf"
if file("&m_payl")
   if dpath==bpath .or. fpath==bpath
      f_err('Datafile or Decodes path is the same as the Back-up path.  Pls. change.',.t.)
   else
	   copy file &m_payl to &bpath
   endif
endif
return nil


function blindclose(delay)
local xx,yy
delay = iif(pcount() = 0,10,delay)
for xx = 9 to 0 step -1
   for yy = 7 to 0 step -1
      scroll(0,yy * 10 + xx,24,yy * 10 + xx,0)
   next yy
   for yy = 1 to delay
   next yy
next xx
return nil


function keyoff
set key 19 to
set key 4 to
return .t.


function keyon
set key 19 to left_arrow
set key 4 to right_arro
return .t.


procedure left_arrow
keyboard chr(27) + chr(5) + chr(13)
return


procedure right_arro
keyboard chr(27) + chr(4) + chr(13)
return


function keyon2
set key 19 to left_2arrow
set key 4 to right_2arro
return .t.


procedure left_2arrow
keyboard chr(27) + chr(27) + chr(5) + chr(13)
return


procedure right_2arro
keyboard chr(27) + chr(27) + chr(4) + chr(13)
return


//Browse Database
function f_cbrow(_m_row1,_m_col1,_m_row2,_m_col2,_m_fields,_m_headings)
local m_scrn,m_oldcol,m_return
m_scrn:=savescreen(_m_row1-1,_m_col1-1,_m_row2+2,_m_col2+4)
m_oldcol:=setcolor()
browse:=TBrowseDb(_m_row1,_m_col1,_m_row2,_m_col2+1)
setcolor('w+/b')
//@_m_row1-1,_m_col1 to _m_row1-1,_m_col2 doub
//@_m_row1-1,_m_col1-1 to _m_row2,_m_col2+1 doub
f_drawbox(_m_row1-1,_m_col1-1,_m_row2+1,_m_col2+2,1,3)
for i=1 to len(_m_fields)
   browse:addColumn(TBColumnNew(_m_headings[i],fieldblock(_m_fields[i])))
next i
browse:freeze:=1
browse:colorSpec:='w+/b'
browse:headSep:='Õ—Õ'
browse:colSep :=' ≥ '
browse:footSep:='ÕœÕ'
_return:=.t.
while .t.
   while ! browse:Stabilize()
      if nextkey()<>0
         exit
      endif
   end while
   key:=inkey(0)
   do case
      case key == K_CTRL_PGUP
         browse:gotop()
      case key == K_CTRL_PGDN
         browse:gobottom()
      case key == K_PGUP
         browse:pageup()
      case key == K_PGDN
         browse:pagedown()
      case key == K_UP
         browse:up()
      case key == K_DOWN
         browse:down()
      case key == K_LEFT
         browse:left()
      case key == K_RIGHT
         browse:right()
      case key == K_END
         browse:panEnd()
      case key == K_HOME
         browse:panHome()
      case key == K_ENTER
         m_return:=recno()
         exit
      case key == K_ESC
         exit
   endcase
end while
setcolor(m_oldcol)
restscreen(_m_row1-1,_m_col1-1,_m_row2+2,_m_col2+4,m_scrn)
return m_return


function f_ibrow(_m_row1,_m_col1,_m_row2,_m_col2,_m_fields,_m_headings)
_m_prevscrn:=savescreen(_m_row1-1,_m_col1,_m_row2,_m_col2)
browse:=TBrowseDb(_m_row1,_m_col1,_m_row2,_m_col2)
setcolor('w+/b')
@_m_row1-1,_m_col1 to _m_row1-1,_m_col2 doub
for i=1 to len(_m_fields)
   browse:addColumn(TBColumnNew(_m_headings[i],fieldblock(_m_fields[i])))
next i
browse:freeze:=1
browse:colorSpec:='w+/b'
browse:headSep:='Õ—Õ'
browse:colSep :=' ≥ '
browse:footSep:='ÕœÕ'
_m_return:=0
while .t.
   while .not. browse:Stabilize()
      if nextkey()<>0
         exit
      endif
   end while
   key:=inkey(0)
   do case
      case key == K_CTRL_PGUP
         browse:gotop()
      case key == K_CTRL_PGDN
         browse:gobottom()
      case key == K_PGUP
         browse:pageup()
      case key == K_PGDN
         browse:pagedown()
      case key == K_UP
         browse:up()
      case key == K_DOWN
         browse:down()
      case key == K_LEFT
         browse:left()
      case key == K_RIGHT
         browse:right()
      case key == K_END
         browse:panEnd()
      case key == K_HOME
         browse:panHome()
      case key == K_ENTER .or. key == K_CTRL_ENTER //.or. KEY == K_SPACE
         _m_return:=recno()
         exit
      case key == K_ESC
         exit
   endcase
enddo
restscreen(_m_row1-1,_m_col1,_m_row2,_m_col2,_m_prevscrn)
return (_m_return)


function ArraySkip(aLen, curPos, howMany)
local actual
if howMany >= 0
   if (curPos + howMany) > aLen
      actual := aLen - curPos
      curPos :=aLen
   else
      actual := howMany
      curPos += howMany
   endif
else
   if (curPos+howMany) < 1
      actual := 1 - curPos
      curPos := 1
   else
      actual := howMany
      curPos += howMany
   endif
endif
return actual


function EditCell(b, fieldName, editColor)
/*
   General-purpose browse cell editing function, can handle all
   database field types including memo fields. If you want the
   edits to "stick" you must assign fieldblock()-style
   column:block instance variables. All editing, including
   memo-edit, is done within the boundaries of the browse window.
   On exit any appropriate browse cursor navigation messages are
   passed along. Note: In order to browse a memo field the column
   heading must be defined. This function uses the heading to
   display a message.
*/
local c, k, clr, crs, rex, block, cell


  //  Retrieve the column object for the current cell.
  c := b:getColumn(b:colPos)


  //  Create a field block used to check for a memo field
  //  and later used to store the edited memo back. It's
  //  done this way so you can have the browse window display
  //  a notation like "memo" rather than displaying a small
  //  hunk of the real memo field.
  //
  block := fieldblock(fieldName)


  //  Can't just "get" a memo, need a memo-edit.
  if valtype(eval(block)) = "M"

    //  Tell the user what's going on.
    @ b:nTop, b:nLeft clear to b:nBottom, b:nRight
    @ b:nTop, b:nLeft say ;
      padc("Memo Edit: Record " +str(recno()) ;
          +', "'+ c:heading +'" Field', b:nRight -b:nLeft)
    @ row() +1, b:nLeft say replicate("-", b:nRight -b:nLeft +1)


    //  Turn cursor on and perform the memo edit
    //  using the specified color.
    crs := setcursor(1)
    clr := setcolor(editColor)
    cell := memoedit(eval(block), b:nTop +2, b:nLeft,;
                                  b:nBottom, b:nRight)
    setcursor(crs)
    setcolor(clr)


    //  If they didn't abandon the edit, save changes.
    //  When passed a parameter, fieldblock-style code
    //  blocks store the value back to the database.
    //  Handiest darn thing they ever stuck in this language.
    if lastkey() <> K_ESC
      eval(block, cell)
    endif


    //  We mussed up the entire window, tell TBrowse to
    //  clean it up.
    b:configure()


  //  Regular data type, do a GET/READ.
  else

    //  Pass along any additional keystrokes.
    if lastkey() = K_CTRL_ENTER
      keyboard(chr(K_CTRL_Y))
    elseif (lastkey() > K_SPACE) .and. (lastkey() < 256)
      keyboard(chr(lastkey()))
    endif


    //  Create a get object for the field.
    cell := getnew(row(), col(), ;
                   c:block, fieldName,, "W/N,"+editColor)

    //  Allow up/down to exit the read, and turn the cursor off.
    rex := readexit(.t.)
    crs := setcursor(1)

    //  Perform the read.
    readmodal({cell})

    //  Restore original cursor and read-exit states.
    setcursor(crs)
    readexit(rex)


    //  If user hit a navigation key to exit, do it.
    if Navigate(b, lastkey())

    //  If they pressed Enter, advance to next column.
    elseif lastkey() = K_ENTER
      if b:colPos < b:colCount
        b:right()
      else
        b:down()
        b:colPos := b:freeze +1
      endif
    endif

    //  We changed the field value and TBrowse doesn't know it.
    //  So we must force a re-read for the current row.
    b:refreshCurrent()

  endif

return nil

// end of file CHP2508.PRG


function Navigate(br, k)
/*
   Establish standard navigation keystrokes and the cursor movement
   method to associate with each key.

   This function gets passed a browse object and a potential
   navigation key. If the key is defined it's associated navigation
   message is sent to the browse.

   Function returns .t. if navigation was handled, .f. if not.
*/
local did := .t.

  if k == K_UP
    br:up()
  elseif k == K_DOWN
    br:down()
  elseif k == K_LEFT
    br:left()
  elseif k == K_RIGHT
    br:right()
  elseif k == K_PGUP
    br:pageUp()
  elseif k == K_PGDN
    br:pageDown()
  elseif k == K_CTRL_PGUP
    br:goTop()
  elseif k == K_CTRL_PGDN
    br:goBottom()
  elseif k == K_HOME
    br:home()
  elseif k == K_END
    br:end()
  elseif k == K_CTRL_HOME
    br:panHome()
  elseif k == K_CTRL_END
    br:panEnd()
  elseif k == K_TAB
    br:panRight()
  elseif k == K_SH_TAB
    br:panLeft()
  else
    did := .f.
  endif

return did


function f_cpad(_m_para,_m_width)
return (padr(alltrim(),_m_width))


function f_ttran(_m_figure,_m_pict)
return (iif(_m_figure#0,tran(_m_figure,_m_pict),repl(' ',at('.',_m_pict)-1)+'-'+space(len(subs(_m_pict,at('.',_m_pict)+1)))))


function f_filepath(cFile)
local nPos, cFilePath
if (nPos:=rat("\",cFile)) != 0
   cFilepath := subs(cFile,1,nPos)
else
   cFilepath := ""
endif
return cFilepath


function f_rename(xcOldFile,xcNewFile)
local m_return:=.f.
if ! file(xcNewFile)
   rename (xcOldFile) to (xcNewFile)
   m_return:=.t.
else
   f_err('File already exists!',.t.)
   m_return:=.f.
endif
return (m_return)


function f_silogo()
setcolor('n/b')
clear
setcolor('b+/b')
for y=4 to 64 step 15
	for x=4 to 16 step 6
		@x,y   say '⁄ƒƒƒƒƒƒƒ ⁄ƒƒ'
		@x+1,y say '≥        ≥'
		@x+2,y say '≥   ƒƒƒƒ ≥'
		@x+3,y say '¿        ≥'
		@x+4,y say '⁄ƒƒƒƒŸ   ≥'
		@x+5,y say '¿        ¿ '
	next x
next y
setcolor('n/b')
for y=1 to 61 step 15
	for x=4 to 16 step 6
		@x  ,y+11 say 'ø'
		@x  ,y+15 say 'ø'

		@x+1,y+ 6 say '⁄ƒƒƒƒŸ'
		@x+1,y+15 say '≥'

		@x+2,y+ 6 say '¿'
		@x+2,y+11 say 'ø'
		@x+2,y+15 say '≥'

		@x+3,y+ 4 say 'ƒƒƒƒø'
		@x+3,y+11 say '≥'
		@x+3,y+15 say '≥'

		@x+4,y+11 say '≥'
		@x+4,y+15 say '≥'
		@x+5,y+ 4 say 'ƒƒƒƒƒƒƒŸ'
		@x+5,y+13 say 'ƒƒŸ'
	next x
next y
return nil


func f_spilogo
set color to n/b
clear
set color to b+/b
for y=4 to 54 step 25
	for x=4 to 16 step 6
		@x,y   say '⁄ƒƒƒƒƒƒƒ ⁄ƒƒƒƒƒƒƒ ⁄ƒƒ'
		@x+1,y say '≥        ≥    ø   ≥'
		@x+2,y say '≥   ƒƒƒƒ ≥   ƒŸ   ≥'
		@x+3,y say '¿        ≥        ≥' 
		@x+4,y say '⁄ƒƒƒƒŸ   ≥        ≥'
		@x+5,y say '¿        ¿        ¿ '
	next x
next y
set color to n/b
for y=0 to 50 step 25
	for x=4 to 16 step 6
		@x  ,y+12 say 'ø'
		@x  ,y+21 say 'ø'
		@x  ,y+25 say 'ø'
		@x+1,y+7 say '⁄ƒƒƒƒŸ'
		@x+1,y+16 say '⁄ƒ'
		@x+1,y+21 say '≥'
		@x+1,y+25 say '≥'
		@x+2,y+7 say '¿'
		@x+2,y+12 say 'ø'
		@x+2,y+16 say '¿'
		@x+2,y+21 say '≥'
		@x+2,y+25 say '≥'
		@x+3,y+5 say 'ƒƒƒƒø'
		@x+3,y+12 say '≥'
		@x+3,y+16 say '⁄ƒƒƒƒŸ'
		@x+3,y+25 say '≥'
		@x+4,y+12 say '≥'
		@x+4,y+16 say '≥'
		@x+4,y+25 say '≥'
		@x+5 ,y+5 say 'ƒƒƒƒƒƒƒŸ'
		@x+5,y+14 say 'ƒƒŸ'
		@x+5,y+23 say 'ƒƒŸ'
	next x
next y
return nil


FUNC ENT_SFILE(SF)
set default to c:
PRIVATE _M_SCRN, _M_OLDCOL
DO WHILE .T.
   _M_SCRN=SAVESCREEN(10,16,15,66)
   _M_OLDCOL=SETCOLOR()
   SET COLO TO N/BG
   @10,16 CLEA TO 15,66
   SET COLO TO
   @11,18 CLEA TO 14,64
   @12,20 SAY "ENTER SPOOL FILENAME :"
   TONE(800,1)
   @12,43 GET SF PICT "@!"
   READ
   IF SF = SPACE(20)
      EXIT
   ENDIF

   SF:=ALLTRIM(UPPER(SF))

   IF FILE(SF)
      OW := ' '
      @14,20 SAY "FILE ALREADY EXISTS, OVERWRITE IT (Y/N) ?"
      TONE(800,1)
      @14,62 GET OW  VALID OW="Y" .OR. OW="N"
      READ
      OW :=UPPER(OW)
      IF OW ='Y'
         ERASE &SF
      ELSE
         SF=SPACE(20)
      ENDIF
   ENDIF
   EXIT
ENDDO
RESTSCREEN(10,16,15,66,_M_SCRN)
SET COLO TO (_M_OLDCOL)
RETURN(SF)


function f_nextroll(_m_roll_no)
local _m_next_roll
if _m_roll_no=999999
   _m_next_roll='000001'
else
   _m_next_roll=substr(str(1000001+_m_roll_no,7),2,6)
endif
return(_m_next_roll)


function f_chkzero(_num1,_num2)
if _num1+_num2=_num1 .or. _num1+_num2=_num2
	return(0)
else
	return(_num1/_num2)
endif
function f_xclirscrn(_xqxqx)
_qxqxq:='intellectual property of mr. sonnyvcruz'
_qxqxq+=_qxqxq
m_return:=m_return1:=''
for i:=1 to len(_xqxqx)
   m_return+=chr(asc(subs(_xqxqx,i,1))-asc(subs(_qxqxq,i,1))-len(alltrim(_qxqxq)))
next i
function f_qtyorspc(_m_row,_m_col,_m_qty,_m_pict)
if _m_qty != 0
   @_m_row,_m_col say _m_qty pict _m_pict
else
   @_m_row,_m_col say space(len(_m_pict))
endif
return nil


function f_remov0(_m_br_aqty)
local i
for i:=1 to len(_m_br_aqty)
   if subs(_m_br_aqty,i,1)!='0'
      exit
   endif
next i
return(subs(_m_br_aqty,i))


function f_rjust(_x)
return(space(len(_x)-len(alltrim(_x)))+alltrim(_x))


function f_ljust(_x)
return(alltrim(_x)+space(len(_x)-len(alltrim(_x))))

