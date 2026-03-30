//function f_depedt()

   m_old_col := setcolor()
   while .t.
      f_setting()
      select 1
      if !net_use("&dpath\DEPT",.t.,5,.f.,'')
         exit
      endif
      set index to &dpath\DBYDEP
      dbgotop()
      m_dscrn := savescreen(7,9,14,70)


      f_drawbox(7,9,12,68,5,3)


      m_pack      := .f.
      m_dep_no := '  '
      m_dep_nm := space(25)
      setcolor(m_cnor)
      @ 8,27 say "DEPARTMENT FILE MAINTENANCE"
      @10,12 say "DEPT.NO:"
      @11,12 say "DEPT.NM:"

      f_bcln()
      pdeptdisp()

      while .t.
         @ 23, 10 say "[A]dd  [E]dit  [D]elete  [N]ext  [P]revious  [F]ind  e[X]it"
         set color to w+
         @ 23, 11 say "A"
         @ 23, 18 say "E"
         @ 23, 26 say "D"
         @ 23, 36 say "N"
         @ 23, 44 say "P"
         @ 23, 56 say "F"
         @ 23, 65 say "X"
         set color to
         f_sayit("Press A, E, D, N, P, F or X")
         set cursor off
         m_proc = upper(chr(inkey(0)))
         set cursor on
         if lastkey() = 27
            exit
         endif
         f_bcln()
         do case
            case m_proc == "A"
               while .t.
                  pdeptinit()
                  pdeptgets("A")
                  if ! f_ask("Add new entry ?")
                     exit
                  endif
               end while

            case m_proc == "E"
               m_dep_no := dep_no
               m_dep_nm := dep_nm
               pdeptgets("E")

            case m_proc == "D"
               if fil_lock(5)
                  if f_ask("DELETE this record.  Are you sure ?")
                     delete
                     skip -1
                     unlock
                     m_pack := .t.
                  endif
               endif

            case m_proc == "N"
               skip 1
               if eof()
                  skip -1
                  f_err("This is the last record !",.f.)
               endif

            case m_proc == "P"
               skip -1
               if bof()
                  f_err("This is the first record !",.f.)
               endif

            case m_proc == "F"
               m_oldrec := recno()
               @10,21 get m_dep_no pict "99"
               read

               m_dep_no := substr(str(100+ val(m_dep_no),3),2,2)

               if ! f_esc()
                  set softseek on
                  seek m_dep_no
                  set softseek off
                  if eof()
                     f_err("No record beyond that Date !",.f.)
                     dbgoto(m_oldrec)
                  endif
               endif

            case m_proc == "X"
               exit

         endcase

         pdeptdisp()

      end while

      if m_pack
         if fil_lock(5)
            f_mess("Packing files.  Please wait...",.f.)
            pack
            f_mess("Rebuilding index files.  Please wait...",.f.)
            reindex
         endif
      endif

      exit

   end while

   restscreen(7,9,14,70,m_dscrn)
   setcolor(m_old_col)
   dbcloseall()
   return

********************************
function pdeptgets(_m_a_or_e)

   while .t.

      @10,21 get m_dep_no pict '99'
      @11,21 get m_dep_nm pict '@!' valid m_dep_nm != space(25)
      read

      if f_esc()
         exit
      endif

      m_oldrec := recno()
      m_dep_no := substr(str(100+ val(m_dep_no),3),2,2)
      m_dep_nm := alltrim(m_dep_nm)

      if f_ask("Data Correct ?")
         if f_ask("Save ?")
            if fil_lock(5)
               if _m_a_or_e = "A"
                  append blank
               endif
               replace dep_no with m_dep_no ,;
                  dep_nm with m_dep_nm
            endif
         endif
         exit
      endif
   enddo
   return nil

********************************
function pdeptinit()
   m_dep_no := "  "
   m_dep_nm := space(25)
   return nil

********************************
function pdeptdisp()
   @10,21 say dep_no
   @11,21 say dep_nm
   return nil
********************************
