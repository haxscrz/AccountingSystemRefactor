/*
Program Name: Print Code Files
Program Code: a_repcod.prg
Date: Feb 23, 2000
*/

function f_a_repcod(m_which)
m_prevscrn:=savescreen(10,11,16,69)
while .t.

   f_setting()
   f_clnmes()

   do case
      case m_which==1  //Account.dbf

         select 1
         if ! net_use('&dpath\accounts',.t.,5,.f.,'TRANS')
         	exit
        	endif
         set index to &dpath\accounts

         m_frsttwo:='AC'
         m_report :='CHART OF ACCOUNTS'

      case m_which==2  //Effects.dbf

         select 1
         if ! net_use('&dpath\effects',.t.,5,.f.,'TRANS')
         	exit
        	endif
         set index to &dpath\effects
         m_frsttwo:='AG'
         m_report :='ACCOUNTS GROUPING'

      case m_which=3  //Schedule

         select 1
         if ! net_use('&dpath\schedule',.t.,5,.f.,'TRANS')
         	exit
        	endif
         set index to &dpath\schedule
         m_frsttwo:='SG'
         m_report :='SUBSIDIARY SCHEDULE GROUPS'

   endcase

   select TRANS
   m_fr_date:=date()

   m_fname:=m_frsttwo+subs(dtoc(date()),1,2)+subs(dtoc(date()),4,2)+subs(dtoc(date()),9,2)

   m_spool:=.t.

   setcolor(m_cnor)
   if ! f_askspool(m_fname)
		m_spool:=.f.
		if f_esc()
			exit
		endif
		set print on
		set device to print
   endif

	if f_esc()
		exit
	endif

   m_crow:=60
   m_page:=0
   m_line:=0
   s2:=space(2)

   select trans
   dbgotop()

   if eof()
      m_page++
      f_codhead(m_report,m_page,m_fr_date,m_to_date)
      ?'No records to print...'
      exit
   endif

   m_gl_head := ''

   while ! eof()

      if m_crow > 58
         m_page++
         m_crow := f_codhead(m_report,m_page,m_fr_date,m_which)
      endif

      do case
         case m_which==1  //Accounts.dbf
            ?acct_code+space(3)+acct_desc+s2+gl_report+space(9)+gl_effect+space(11)+formula

         case m_which==2  //Effects.dbf
            ?gl_report+space(9)+gl_effect+space(11)+gl_head

         case m_which==3  //Schedule.dbf
            if gl_head != m_gl_head
               ?gl_head+s2
               m_gl_head := gl_head
            else
               ?space(32)
            endif

            ??acct_code+space(3)+acct_desc

      endcase

      m_crow++

      skip

   end while

   ?
   ?'---end of report---'
   ?chr(12)

	if ! m_spool
		set printer to
		set device to screen
		set print off
   else
      set alternate off
		set alternate to
		set device to screen
		set console on
	endif

	exit

end while
restscreen(10,11,16,69,m_prevscrn)
dbcloseall()
return nil


function f_codhead(_m_report,_m_page,_m_fr_date,_m_which)
if _m_page>1
   ?chr(12)  //Eject then cancel condense mode
endif
?m_company+space(86-len(m_company))+'Page '+tran(_m_page,'999')
?_m_report
?'Run Date: '+dtoc(_m_fr_date)
?
do case
   case _m_which==1  //Accounts.dbf
      ?'Acct#  Description                     Report Code  Report Group  Formula'
      ?'-----  ------------------------------  -----------  ------------  -------'
      //1234   123456789012345678901234567890  1234         123           12

   case _m_which==2  //Effects.dbf
      ?'Report Code  Report Group  Description'
      ?'-----------  ------------  -------------------------'
      //1234         123           1234567890123456789012345

   case _m_which==3  //Schedule.dbf
      ?'Group                           Acct#  Description'
      ?'------------------------------  -----  ------------------------------'
      //123456789012345678901234567890  1234   123456789012345678901234567890
endcase
return(6)
