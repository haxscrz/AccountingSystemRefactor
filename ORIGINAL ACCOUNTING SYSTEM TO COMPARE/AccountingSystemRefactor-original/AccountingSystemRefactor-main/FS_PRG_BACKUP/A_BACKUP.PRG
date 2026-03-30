/*
Program Name: Backup files
Program Code: A_BACKUP.PRG
Date: Feb 14, 2000
Note: Add all the files that need to be backed-up in backup.bat under
      the "backpath"
*/

function f_a_backup()
m_prevscrn:=savescreen(0,0,24,79)
m_oldcol:=setcolor()
setcolor(m_cmes)
m_sfname:=space(8)
while .t.

	f_drawbox(9,15,13,64,1,3)
   setcolor(m_cnor)

	@11,19 say 'ENTER PERIOD TO BACKUP (MMYYYY):'
   m_period:=space(6)
   m_exist:=.f.
   m_continue:=.f.

   while .t.
      @11,54 get m_period pict '999999' valid m_period > '002000'
      read
      if f_esc()
         exit
      endif
      if subs(m_period,1,2) < '01' .or. subs(m_period,1,2) > '13'
         f_err('Invalid Period.  Please check!',.t.)
         loop
      endif
      if subs(m_period,3,4) < '2000' .or. subs(m_period,3,4) > '3000'
         f_err('Invalid Period.  Please check!',.t.)
         loop
      endif
      if file('&m_period\accounts.dbf')
         if f_ask('Backup for '+m_period+' already exists!  Overwrite?')
            if f_esc()
               exit
            endif
            if f_password(12)
               m_exist:=.t.
            else
               loop
            endif
         else
            loop
         endif
      endif
      m_continue:=.t.
      exit
   end while

   if f_esc() .or. ! m_continue
      exit
   endif

   f_bcln()

   setcolor(m_cmes)

	@24,4 say 'ENTER BACKUP FILENAME :'
	tone(800,1)

	m_sfname:='FS'+m_period

   while .t.

   	@24,28 get m_sfname pict '@K!' vali m_sfname#spac(8)
	   read

   	if f_esc()
	   	exit
   	endif

	   tone(800,1)

      m_correct:=.f.

	   @24,45 say 'Is the filename correct ? 'get m_correct pict 'Y'
   	read

	   if f_esc()
		   exit
   	endif

	   if m_correct
		   exit
   	endif

   end while

	if f_esc()
	   exit
   endif

	m_sfname=alltrim(m_sfname)
	n_sfname=m_sfname+'.ZIP'

   m_correct:=.f.

	if file('&bpath\&n_sfname')
		f_bcln()
	   tone(800,1)
		@24,16 say m_sfname+'.ZIP'+' already exists. Overwrite (Y/N) ?' get m_correct pict 'Y'
		read
	endif

   if f_esc()
		exit
	endif

	f_bcln()

   if ! m_exist
      run md &m_period
   endif

	copy file &dpath\accounts.dbf to &m_period\accounts.dbf
	copy file &dpath\banks.dbf    to &m_period\banks.dbf
	copy file &dpath\supplier.dbf to &m_period\supplier.dbf
	copy file &dpath\checkmas.dbf to &m_period\checkmas.dbf
	copy file &dpath\checkvou.dbf to &m_period\checkvou.dbf
	copy file &dpath\cashrcpt.dbf to &m_period\cashrcpt.dbf
	copy file &dpath\salebook.dbf to &m_period\salebook.dbf
	copy file &dpath\journals.dbf to &m_period\journals.dbf
	copy file &dpath\purcbook.dbf to &m_period\purcbook.dbf
	copy file &dpath\adjstmnt.dbf to &m_period\adjstmnt.dbf
	copy file &dpath\pournals.dbf to &m_period\pournals.dbf
	copy file &dpath\effects.dbf  to &m_period\effects.dbf
	copy file &dpath\schedule.dbf to &m_period\schedule.dbf
	copy file &dpath\schedule.dbf to &m_period\schedule.dbf
	copy file &dpath\ACHECKMA.dbf to &m_period\ACHECKMA.dbf
	copy file &dpath\ACHECKVO.dbf to &m_period\ACHECKVO.dbf

   clear
   @ 8,26 say 'CREATING BACKUP FILES!'
   run &bpath\backup.bat &n_sfname
   ?'Backup Completed.  Press any key to continue.'
   inkey(0)

   exit

end while

dbcloseall()

setcolor(m_oldcol)
restscreen(0,0,24,79,m_prevscrn)

return nil
