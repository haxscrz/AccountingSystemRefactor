/*
Program Name: Editcode.prg
Author: Sonny
Date Started: June 01, 1999
*/

para m_which
m_oldcolor:=setcolor()
m_oldscrn:=savescreen(6,3,22,77)
while .t.
  	set confirm on
  	f_setting()
   @23,0 clear to 23,79
   if m_which = 1
      select 1
      if ! net_use('pathfile',.f.,5,.f.,'')
      	exit
     	endif

   elseif m_which =2
      select 4
      if ! net_use('&dpath\tmcard',.f.,5,.f.,'')
      	exit
     	endif
      select 3
      if ! net_use('&dpath\premmast',.f.,5,.f.,'')
      	exit
     	endif
      select 2
      if ! net_use('&dpath\history',.f.,5,.f.,'')
      	exit
     	endif
      select 1
      if ! net_use('&dpath\master',.f.,5,.f.,'')
      	exit
     	endif
   endif

	f_drawbox(7,3,22,75,1,3)
   setcolor(m_cnor)
   do case
      case m_which=1  //Company Info
      	setcolor(m_cnor)
         @ 8, 5 say 'COMPANY INFORMATION:'
         @ 9, 5 say 'Company Name....... :'
         @10, 5 say 'Company Code....... :'
         @11, 5 say 'FILES LOCATION:'
         @12, 5 say 'Regular Employees.. :'
         @13, 5 say 'Casual Employees... :'
         @14, 5 say 'Tax and Other Files :'
         @15, 5 say 'Backup Files....... :'
         @16, 5 say '2nd Backup Files... :'
         @17, 5 say 'Spooled Text Files. :'
         @18, 5 say 'Company PHIC No.... :'
         @19, 5 say 'Company SSS  No.... :'
         @20, 5 say 'Company PAG-IBIG No :'
         @21, 5 say 'Company TIN ....... :'

         @18,45 say 'SUN/SPCL HOL RATE   :'
         @19,45 say 'SUN/SPCL HOL OT RATE:'
         @20,45 say 'LGL HOL RATE        :'
         @21,45 say 'LGL HOL OT RATE     :'

      	setcolor(m_cnor)
         @ 9, 5 say 'Emp.Name    : '
         @10, 5 say 'Old Emp.No. : '
         @11, 5 say 'New Emp.No. : '
   endcase

   f_bcln()

	while .t.
      select 1 //master
      setcolor(m_cnor)
   	f_datadisp(m_which)
      tone(2100,0.5)
      f_bcln()
		set colo to (m_cmen)
      //    13    19     26     33     40         51       60
      //     ADD   FIND   EDIT   NEXT   PREVIOUS   DELETE   QUIT
      //           20     27     34         45     52
      //            EDIT   NEXT   PREVIOUS   FIND   QUIT
      //                        EDIT     QUIT
      if m_which = 1
         @24,32 prompt ' EDIT '
         @24,41 prompt ' QUIT '

      elseif m_which = 2
         @24,20 prompt " EDIT "
         @24,27 prompt " NEXT "
         @24,34 prompt " PREVIOUS "
         @24,45 prompt " FIND "
         @24,52 prompt " QUIT "

      endif
      menu to m_proc

      if m_which = 1
   		do case
   			case m_proc=1  //EDIT
               do case
                  case m_which=1  //Company File
                  	Nm_company:=company
                  	Nm_compcode:=compcode
                  	Nrpath:=upper(rankpath)
                  	Ncpath:=upper(caslpath)
                  	Nopath:=upper(othrpath)
                  	Nbpath:=upper(backpath)
                  	Nbpath2:=upper(back2path)
                  	Ntpath:=upper(textpath)
                  	Ncomp_phic:=upper(comp_phic)
                  	Ncomp_sss :=upper(comp_sss )
                  	Ncomp_pbg :=upper(comp_pbg )
                  	Ncomp_tin :=upper(comp_tin )
                     msphp_rate := sphp_rate
                     mspot_rate := spot_rate
                     mlghp_rate := lghp_rate
                     mlgot_rate := lgot_rate
               endcase
   				f_datagets(m_which,'E')

   			case m_proc=2  //QUIT
	   			exit

   		endcase

      elseif m_which = 2
         select master
   		do case
   			case m_proc=1  //EDIT
               m_emp_no := emp_no
               n_emp_no := emp_no
   				f_datagets(m_which,'E')
            case m_proc=2
               skip
   				if eof()
	   				skip -1
		   			f_err('This is the last record !',.f.)
			   	endif
            case m_proc=3
   				skip -1
	   			if bof()
		   			f_err('This is the first record !',.f.)
			   	endif
            case m_proc=4
   				m_oldrec=recno()
				   @9,19 get m_emp_no pict '999999'
   				read
	   			if lastkey()<>27
		   			set soft on
			   		seek m_emp_no
				   	set soft off
					   if eof()
						   f_err('No record beyond that employee number !',.f.)
   						go m_oldrec
	   				endif
		   		endif
            otherwise
               dbcloseall()
				   f_mess('Reindexing files. Please wait...',.f.)
					f_reindex('&dpath\premmast','&dpath\premmast','emp_no+period')
					f_reindex('&dpath\master','&dpath\mbyemp','emp_no')
					f_reindex('&dpath\master','&dpath\mbynm','emp_nm')
					f_reindex('&dpath\master','&dpath\mbydep','dep_no+emp_no')
					f_reindex('&dpath\history','&dpath\hbyemp','emp_no')
					f_reindex('&dpath\history','&dpath\hbynm','emp_nm')
					f_reindex('&dpath\history','&dpath\hbydep','dep_no+emp_no')
					f_reindex('&dpath\tmcard','&dpath\tbyemp','emp_no')
					f_reindex('&dpath\tmcard','&dpath\tbynm','emp_nm')
					f_reindex('&dpath\tmcard','&dpath\tbydep','dep_no+emp_no')
               exit
         endc
      endif
	end while

   if m_which=1
   	Nm_company:=alltrim(company)
   	Nm_compcode:=alltrim(compcode)
      Nrpath:=upper(alltrim(rankpath))
      Ncpath:=upper(alltrim(caslpath))
      Nopath:=upper(alltrim(othrpath))
      Nbpath:=upper(alltrim(backpath))
      Nbpath2:=upper(alltrim(back2path))
      Ntpath:=upper(alltrim(textpath))
     	Ncomp_phic:=upper(comp_phic)
     	Ncomp_sss :=upper(comp_sss )
     	Ncomp_pbg :=upper(comp_pbg )
     	Ncomp_tin :=upper(comp_tin )
      msphp_rate := sphp_rate
      mspot_rate := spot_rate
      mlghp_rate := lghp_rate
      mlgot_rate := lgot_rate
   endif

	exit

end while
setcolor(m_oldcolor)
restscreen(6,3,22,77,m_oldscrn)
dbcloseall()
return


function f_datadisp(m_which)
do case
   case m_which=1  //Path and Constants File
      @ 9,27 say company
      @10,27 say compcode
      @12,27 say rankpath
      @13,27 say caslpath
      @14,27 say othrpath
      @15,27 say backpath
      @16,27 say back2path
      @17,27 say textpath
      @18,27 say comp_phic pict "XXXXXXXXXXXXXX"
      @19,27 say comp_sss
      @20,27 say comp_pbg
      @21,27 say comp_tin

      @18,67 say sphp_rate pict "99.9999"
      @19,67 say spot_rate pict "99.9999"
      @20,67 say lghp_rate pict "99.9999"
      @21,67 say lgot_rate pict "99.9999"

                      //  12345678901234    SUN/SPCL HOL RATE   : 99.999
                      //  12345678901234    SUN/SPCL HOL OT RATE: 99.999
                      //  12345678901234    LGL HOL RATE        : 99.999
                      //  12345678901234    LGL HOL OT RATE     : 99.999


   case m_which = 2
      @ 9,19 say emp_nm
      @10,19 say emp_no
      @11,19 say emp_no
endcase
return nil


function f_datagets(m_which,m_A_or_E)
m_abort=.f.
f_sayit('Press <Esc> to Abort.')
while .t.
   do case
      case m_which=1  //Path and Constants File
         //@ 9,34 get m_company
         //@10,34 get m_compcode
         @12,27 get Nrpath pict '@!'
         @13,27 get Ncpath pict '@!'
         @14,27 get Nopath pict '@!'
         @15,27 get Nbpath pict '@!'
         @16,27 get Nbpath2 pict '@!'
         @17,27 get Ntpath pict '@!'
         @18,27 get Ncomp_phic pict "XXXXXXXXXXXXXX"
         @19,27 get Ncomp_sss  pict '@!'
         @20,27 get Ncomp_pbg  pict '@!'
         @21,27 get Ncomp_tin  pict '@!'

         @18,67 get msphp_rate pict "99.9999"
         @19,67 get mspot_rate pict "99.9999"
         @20,67 get mlghp_rate pict "99.9999"
         @21,67 get mlgot_rate pict "99.9999"
                    /*
                          12345678901234    SUN/SPCL HOL RATE   : 99.999
                          12345678901234    SUN/SPCL HOL OT RATE: 99.999
                          12345678901234    LGL HOL RATE        : 99.999
                          12345678901234    LGL HOL OT RATE     : 99.999
                   */

      case m_which = 2
         @11,19 get n_emp_no pict '999999'

      otherwise
         exit
   endcase
 	read

	if f_esc()
		if f_ask('Abort data entry?')
			m_abort=.t.
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

   	         m_company:=alltrim(Nm_company)
            	m_compcode:=alltrim(Nm_compcode)
               rpath:=upper(alltrim(Nrpath))
               cpath:=upper(alltrim(Ncpath))
               opath:=upper(alltrim(Nopath))
               bpath:=upper(alltrim(Nbpath))
               b2path:=upper(alltrim(Nbpath2))
               tpath:=upper(alltrim(Ntpath))

               replace company   with m_company, compcode  with m_compcode,;
                  rankpath with rpath, caslpath with cpath,;
                  othrpath with opath, backpath with bpath,;
                  back2path with b2path, textpath with tpath,;
                  comp_phic with ncomp_phic,;
                  comp_sss  with ncomp_sss ,;
                  comp_pbg  with ncomp_pbg ,;
                  comp_tin  with ncomp_tin ,;
                  sphp_rate with msphp_rate ,;
                  spot_rate with mspot_rate ,;
                  lghp_rate with mlghp_rate ,;
                  lgot_rate with mlgot_rate

            case m_which=2  //Emp.No
               select master
               if fil_lock(5)
                  replace emp_no with n_emp_no
                  @10,19 say emp_no
               endif

               select history
               if fil_lock(5)
                  replace all emp_no with n_emp_no for emp_no = m_emp_no
                  unlock
               endif

               select tmcard
               if fil_lock(5)
                  replace all emp_no with n_emp_no for emp_no = m_emp_no
                  unlock
               endif

               select premmast
               if fil_lock(5)
                  replace all emp_no with n_emp_no for emp_no = m_emp_no
               endif

               select master

         endcase
         unlock
      endif
   endif
   exit
end while
return nil
