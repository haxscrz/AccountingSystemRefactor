/*
Program Name: Editcode.prg
Author: Sonny
Date Started: Feb 06, 2000
*/

function f_a_edtcod(m_which)
m_oldcolor:=setcolor()
m_oldscrn:=savescreen(2,3,23,77)
while .t.
  	set confirm on
  	f_setting()
   f_clnmes()

   do case
      case m_which=1  //Company Info

         select 1
         if ! net_use('pathfile',.f.,5,.f.,'')
         	exit
        	endif

      	f_drawbox(2,3,22,75,1,3)
         setcolor(m_cnor)

         @ 2, 6 say ' COMPANY INFO AND DATA PATH FILE MAINTENANCE '
      	setcolor(m_cnor)
         @ 4, 5 say 'Company Name.............. :'
         @ 5, 5 say 'Company Code.............. :'
         @ 6, 5 say 'Company Address........... :'
         @ 7, 5 say 'Reports Heading-1......... :'
         @ 8, 5 say 'Reports Heading-2......... :'
         @ 9, 5 say 'Reports Heading-3......... :'
         @10, 5 say 'Reports Heading-4......... :'
         @11, 5 say 'Barcode Data Files........ :'
         @12, 5 say 'Inventory Master File..... :'
         @13, 5 say 'Receiving & History Files. :'
         @14, 5 say 'Scanner Transaction File.. :'
         @15, 5 say 'Decode Files.............. :'
         @16, 5 say 'Backup Files.............. :'
         @17, 5 say 'Work Order Database File.. :'
         @18, 5 say 'Spooled Text Files........ :'
         @19, 5 say 'Vendor Master File........ :'
         @20, 5 say 'Customer Master File...... :'
         @21, 5 say 'Comm Port for BCODE Printer:'

      case m_which=2  //Account Decodes File

         select 1
         if ! net_use('&dpath\accounts',.t.,5,.f.,'')
         	exit
        	endif
         set index to &dpath\accounts

         setcolor(m_cmen)
      	f_drawbox(6,3,18,75,1,3)
         setcolor(m_cnor)

         @ 8, 5 say 'Account Code... :'
         @ 9, 5 say 'Description.... :'
         @10, 5 say 'Opening Balance :'
         @11, 5 say 'Current Debit.. :'
         @12, 5 say 'Current Credit. :'
         @13, 5 say 'Report Code.... :'
         @14, 5 say 'Report Group... :'
         @15, 5 say 'Formula........ :'
         @16, 5 say 'Initialize to 0 at the beginning of the Year (Y/N):'

      case m_which=3  //Effects

         select 1
         if ! net_use('&dpath\effects',.t.,5,.f.,'')
         	exit
        	endif
         set index to &dpath\effects

         setcolor(m_cmen)
      	f_drawbox(6,3,12,75,1,3)
         setcolor(m_cnor)

         @ 8, 5 say 'Report Code.... :'
         @ 9, 5 say 'Effect......... :'
         @10, 5 say 'Description.... :'

      case m_which=4  //Schedule

         select 2
         if ! net_use('&dpath\accounts',.t.,5,.f.,'')
         	exit
        	endif
         set index to &dpath\accounts

         select 1
         if ! net_use('&dpath\schedule',.t.,5,.f.,'')
         	exit
        	endif
         set index to &dpath\schedule

         setcolor(m_cmen)
      	f_drawbox(6,3,12,75,1,3)
         setcolor(m_cnor)

         @ 8, 5 say 'Schedule Group. :'
         @ 9, 5 say 'Account Code... :'
         @10, 5 say 'Description.... :'

   endcase

   f_bcln()

	while .t.
      setcolor(m_cnor)
   	f_datadisp(m_which)
      f_bcln()
		setcolor(m_cmen)
      //    13    19     26     33     40         51       60
      //     ADD   FIND   EDIT   NEXT   PREVIOUS   DELETE   QUIT
      //                        EDIT     QUIT
      @24,13 prompt ' ADD '
      @24,19 prompt ' FIND '
      @24,26 prompt ' EDIT '
      @24,33 prompt ' NEXT '
      @24,40 prompt ' PREVIOUS '
      @24,51 prompt ' DELETE '
      @24,60 prompt ' QUIT '
      menu to m_proc

		do case
			case m_proc==1  //ADD
				f_datagets(m_which,'A')

			case m_proc==2  //FIND
            do case
               case m_which==2 //Acct File
                  m_oldrec:=recno()
                  m_acct_code:=acct_code
   				   @ 8,23 get m_acct_code pict '@!'
                  read
                  set softseek on
                  seek m_acct_code
                  set softseek off
                  if eof()
                     dbgoto(m_oldrec)
                     f_err('There is no record beyond that code!',.t.)
                  endif

               case m_which==3 //Effects
                  m_oldrec:=recno()
                  m_gl_report:=gl_report
   				   @ 8,23 get m_gl_report pict '@!'
                  read
                  set softseek on
                  seek m_gl_report
                  set softseek off
                  if eof()
                     dbgoto(m_oldrec)
                     f_err('There is no record beyond that code!',.t.)
                  endif

               case m_which==4 //Schedule
                  m_oldrec:=recno()
                  m_gl_head:=gl_head
   				   @ 8,23 get m_gl_head pict '@!'
                  read
                  set softseek on
                  seek m_gl_head
                  set softseek off
                  if eof()
                     dbgoto(m_oldrec)
                     f_err('There is no record beyond that code!',.t.)
                  endif
            endcase

			case m_proc==3  //EDIT
            do case
               case m_which==1  //Company File
               	m_company:=company
               	m_compcode:=compcode
               	m_comp_addr:=comp_addr
                  m_head1:= head1
                  m_head2:= head2
                  m_head3:= head3
                  m_head4:= head4
               	dpath:=upper(datapath)
               	ipath:=upper(invpath)
               	ppath:=upper(pinvpath)
                  rpath:=upper(irlpath)
               	fpath:=upper(decodes)
               	bpath:=upper(backpath)
               	wpath:=upper(workpath)
               	tpath:=upper(textpath)
                  vpath:=upper(vendpath)
                  cpath:=upper(custpath)
                  m_com_port:=com_port

               case m_which==2 //Chart of Accounts
                  m_acct_code := acct_code
                  m_acct_desc := acct_desc
                  m_open_bal  := open_bal
                  m_cur_debit := cur_debit
                  m_cur_credit:= cur_credit
                  m_gl_effect := gl_effect
                  m_gl_report := gl_report
                  m_formula   := formula
                  m_initialize:= initialize

               case m_which==3 //Effects
                  m_gl_effect := gl_effect
                  m_gl_report := gl_report
                  m_gl_head   := gl_head

               case m_which==4 //Schedule
                  m_gl_head   := gl_head
                  m_acct_code := acct_code
                  m_acct_desc := acct_desc

            endcase

				f_datagets(m_which,'E')

			case m_proc==4  //NEXT
            skip
            if eof()
               skip -1
               f_mess('This is the last record!',.t.)
            endif

			case m_proc==5  //PREVIOUS
            skip -1
            if bof()
               f_mess('This is the first record!',.t.)
            endif

			case m_proc==6  //DELETE
            if f_ask('Are you sure?')
               if fil_lock(5)
                  delete
                  skip
                  if eof()
                     skip -1
                  endif
                  unlock
               endif
            endif

			otherwise //case m_proc==7  //QUIT
				exit

		endcase

	end while

   if m_which=1
   	dpath:=upper(alltrim(datapath))
   	ipath:=upper(alltrim(invpath))
   	ppath:=upper(alltrim(pinvpath))
      rpath:=upper(alltrim(irlpath))
   	fpath:=upper(alltrim(decodes))
   	bpath:=upper(alltrim(backpath))
   	wpath:=upper(alltrim(workpath))
   	tpath:=upper(alltrim(textpath))
      vpath:=upper(alltrim(vendpath))
      cpath:=upper(alltrim(custpath))
   	pcode:=upper(alltrim(passcode))
      m_com_port:=com_port
   	m_company:=alltrim(company)
   	m_compcode:=alltrim(compcode)
   endif

	exit

end while
setcolor(m_oldcolor)
restscreen(2,3,23,77,m_oldscrn)
dbcloseall()
return nil


function f_datadisp(m_which)
_m_oldcol:=setcolor()
setcolor(m_cbrg)
do case
   case m_which==1  //Path and Constants File
      @ 4,34 say company
      @ 5,34 say compcode
      @ 6,34 say subs(comp_addr,1,40)
      @ 7,34 say subs(head1,1,40)
      @ 8,34 say subs(head2,1,40)
      @ 9,34 say subs(head3,1,40)
      @10,34 say subs(head4,1,40)
      @11,34 say datapath
      @12,34 say invpath
      @13,34 say pinvpath
      @14,34 say irlpath
      @15,34 say decodes
      @16,34 say backpath
      @17,34 say workpath
      @18,34 say textpath
      @19,34 say vendpath
      @20,34 say custpath
      @21,34 say com_port pict '9'

   case m_which==2  //Chart Of Accounts
      @ 8,23 say acct_code
      @ 9,23 say acct_desc
      @10,23 say open_bal pict '99,999,999,999.99'
      @11,23 say cur_debit pict '99,999,999,999.99'
      @12,23 say cur_credit pict '99,999,999,999.99'
      @13,23 say gl_report
      @14,23 say gl_effect
      @15,23 say formula
      @16,57 say initialize pict 'Y'

   case m_which==3  //Effects
      @ 8,23 say gl_report
      @ 9,23 say gl_effect
      @10,23 say gl_head

   case m_which==4  //Chart Of Accounts
      @ 8,23 say gl_head
      @ 9,23 say acct_code
      @10,23 say acct_desc

endcase
setcolor(_m_oldcol)
return nil


function f_datagets(m_which,m_A_or_E)
m_abort:=.f.
f_sayit('Press <Esc> to Abort.')
if m_A_or_E == 'A'
   do case
      case m_which==2
         m_acct_code:=space(4)
         m_acct_desc:=space(30)
         m_open_bal:=m_cur_debit:=m_cur_credit:=0
         m_gl_report := space(4)
         m_gl_effect := space(3)
         m_formula   := space(2)
         m_initialize:= .f.

      case m_which==3  //Effects
         m_gl_report := space(4)
         m_gl_effect := space(3)
         m_gl_head   := space(25)

      case m_which==4  //Schedule
         m_gl_head  :=space(30)
         m_acct_code:=space(4)
         m_acct_desc:=space(30)

   endcase
endif
while .t.
   do case
      case m_which=1  //Path and Constants File
         @ 4,34 get m_company
         @ 5,34 get m_compcode
         @ 6,34 get m_comp_addr pict '@s40'
         @ 7,34 get m_head1 pict '@s40'
         @ 8,34 get m_head2 pict '@s40'
         @ 9,34 get m_head3 pict '@s40'
         @10,34 get m_head4 pict '@s40'
         @11,34 get dpath pict '@!'
         @12,34 get ipath pict '@!'
         @13,34 get ppath pict '@!'
         @14,34 get rpath pict '@!'
         @15,34 get fpath pict '@!'
         @16,34 get bpath pict '@!'
         @17,34 get wpath pict '@!'
         @18,34 get tpath pict '@!'
         @19,34 get vpath pict '@!'
         @20,34 get cpath pict '@!'
         @21,34 get m_com_port pict '9'

      case m_which==2
         if m_A_or_E == 'A'
            @ 8,23 get m_acct_code pict '@!' valid f_chkacct(m_acct_code,'A')
         endif
         @ 9,23 get m_acct_desc pict '@!'
         @10,23 get m_open_bal pict '99,999,999,999.99'
         @11,23 get m_cur_debit pict '99,999,999,999.99'
         @12,23 get m_cur_credit pict '99,999,999,999.99'
         @13,23 get m_gl_report pict '@!'
         @14,23 get m_gl_effect pict '@!'
         @15,23 get m_formula pict '@!' valid m_formula$'CD~DC'
         @16,57 get m_initialize pict 'Y'

      case m_which==3
         @ 8,23 get m_gl_report pict '@!'
         @ 9,23 get m_gl_effect pict '@!'
         @10,23 get m_gl_head pict '@!'

      case m_which==4
         @ 8,23 get m_gl_head pict '@!'
         @ 9,23 get m_acct_code valid f_svalacct(m_acct_code)

      otherwise
         exit
   endcase
 	read

	if lastkey()=27
		if f_ask('Abort data entry?')
			m_abort:=.t.
			exit
		else
			loop
		endif
	endif

	if ! f_ask('Data correct ?')
		loop
	endif

	// Save
	if f_ask('Save ?')
	   if fil_lock(5)
		   if m_A_or_E='A'
		   	append blank
         endif
         do case
            case m_which=1  //Path and Constants
               if recc()=0
                  append blank
               endif
            	dpath:=upper(alltrim(dpath))
             	ipath:=upper(alltrim(ipath))
             	ppath:=upper(alltrim(ppath))
               rpath:=upper(alltrim(rpath))
               fpath:=upper(alltrim(fpath))
             	bpath:=upper(alltrim(bpath))
             	wpath:=upper(alltrim(wpath))
             	tpath:=upper(alltrim(tpath))
               vpath:=upper(alltrim(vpath))
               cpath:=upper(alltrim(cpath))
               m_company :=alltrim(m_company)
               m_compcode:=alltrim(m_compcode)

               replace company   with m_company, compcode  with m_compcode,;
                  comp_addr with m_comp_addr, head1 with m_head1,;
                  head2 with m_head2, head3 with m_head3,;
                  head4 with m_head4, datapath with dpath,;
                  invpath with ipath, pinvpath with ppath,;
                  irlpath with rpath, decodes with fpath,;
                  backpath with bpath, workpath with wpath,;
                  textpath with tpath, vendpath with vpath,;
                  custpath with cpath, com_port with m_com_port

            case m_which==2
               replace acct_code with m_acct_code,;
                  acct_desc with m_acct_desc,;
                  open_bal with m_open_bal,;
                  cur_credit with m_cur_credit,;
                  cur_debit with m_cur_debit,;
                  gl_report with m_gl_report,;
                  gl_effect with m_gl_effect,;
                  formula with m_formula,;
                  initialize with m_initialize

            case m_which==3
               replace gl_report with m_gl_report,;
                  gl_effect with m_gl_effect,;
                  gl_head with m_gl_head

            case m_which==4
               replace acct_code with m_acct_code,;
                  acct_desc with m_acct_desc,;
                  gl_head with m_gl_head

         endcase
         unlock
      endif
   endif
   exit
end while
return nil


function f_chkacct(_m_acct_code,_x)
local _m_oldarea:=select(), _m_return:=.f.
select accounts
seek _m_acct_code
do case
   case _x=='A'
      if ! eof()
         f_err('Account Code '+_m_acct_code+' already exists!',.t.)
      else
         _m_return:=.t.
      endif
   otherwise
endcase
return(_m_return)


function f_svalacct(_m_acct_code)
local _m_oldarea:=select(), _m_oldrec:=recno(), _m_return:=.t.
select accounts
seek _m_acct_code
if ! eof()
   @10,23 say subs(acct_desc,1,30)
   m_acct_desc := acct_desc
   _m_return:=.t.
else
   @10,23 say space(30)
   f_err('Invalid Account Code!',.f.)
   _m_return:=.f.
endif
select(_m_oldarea)
dbgoto(_m_oldrec)
return(_m_return)
