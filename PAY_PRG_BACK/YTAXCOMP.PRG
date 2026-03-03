/*
Program Code: ytaxcomp.prg
Program Func:This program prints the Alpha-List
Author: Sonny C.
Date  : Aug.10, 2000
*/

//function f_rpalphal()
   m_oldcol  := setcolor()
   m_qtrscrn := savescreen(12,18,15,61)
   setcolor(m_cnor)
   while .t.
      f_bcln()
      m_spool := .t.

      f_setting()

      select 7
      if !net_use("&dpath\history",.t.,5)
         exit
      endif
      set index to &dpath\hbyemp
      reindex

      select 6
      if !net_use("&opath\exmp2007",.t.,5)
         exit
      endif
      index on status to &opath\exmp2007
      set index to &opath\exmp2007

      select 5
      if !net_use("&dpath\tmcard",.t.,5)
         exit
      endif
      set index to &dpath\tbyemp
      reindex

      select 4
      if !net_use("&opath\exmption",.t.,5)
         exit
      endif
      set index to &opath\exmption
      reindex

      select 3
      if !net_use("&opath\taxdue",.t.,5)
         exit
      endif

      select 2
      if !net_use("&dpath\sys_id",.t.,5)
         exit
      endif
      if !fil_lock(5)
         exit
      endif

      select 1
      if !net_use("&dpath\master",.t.,5)
         exit
      endif
      set index to &dpath\mbynm
      reindex
      dbgotop()

      select sys_id
      m_year = str(year(beg_date),4)

      if trn_upd==trn_prc
         m_posted:=.t.
      else
         m_posted:=.f.
      endif

      f_comp_tax(m_posted)

      exit

   end while

   restscreen(12,18,15,61,m_qtrscrn)
   dbcloseall()
   setcolor(m_oldcol)
   return nil


***************************************
function f_comp_tax(_m_posted)
local _m_oldarea:=select()

select master
dbgotop()

/*
set alte to tax.txt
set alte on
*/

while ! eof()

   m_emp_no := emp_no
	m_stat := upper(alltrim(status))
	m_stat += space(3-len(m_stat))

   m_old_exemption := .f.

   if emp_type = "R"
      select history
      seek m_emp_no
      if .not. eof()
         if dtos(date_sep) <> space(8)
            if dtos(date_sep) < "20080705"
               m_old_exemption := .t.
            endif
         endif
      endif
   endif

   if m_old_exemption
      select exmp2007
   else
      select exmption
   endif

   //Jan 9, 2018
   /*
   seek m_stat
   if ! eof()
      m_per_exemption := per_exmptn
      m_add_exemption := add_exmptn
   else
      m_per_exemption := m_add_exemption := 0
   endif
   */

   m_per_exemption := m_add_exemption := 0

   select master
   //m_emp_no := emp_no

   m_y_bonus := y_bonus + y_midbon
   m_y_btax  := y_btax  + y_midtax

   m_tm_bonus := m_tm_btax := m_tm_txble := m_tm_tax := 0

   if ! _m_posted

      select tmcard
      seek emp_no
      if (! eof()) .and. trn_flag!='U'
         m_tm_bonus := bonus
         m_tm_btax  := bonustax
         m_tm_txble := grs_pay - (oth_pay2 + oth_pay4 + sss_ee + med_ee + pgbg_ee)
         m_tm_tax   := tax_ee //+ oth_ded10
      endif

      select master

   endif

	if m_y_bonus+m_tm_bonus > m_nontaxbon
		m_txble_bonus := m_y_bonus+m_tm_bonus-m_nontaxbon
		m_bonus_exemption := m_nontaxbon
	else
		m_bonus_exemption := m_y_bonus+m_tm_bonus
	endif

   m_ttl_exemption := m_per_exemption + m_add_exemption + m_bonus_exemption

   m_nontax_pay  := Y_OTHP1 + y_othp2 + y_othp4 + y_sss + y_med + y_pbg + y_premium + y_leave + deminimis

   m_txble_income:= y_gross + m_y_bonus + y_othergrs - (m_nontax_pay + m_ttl_exemption) + m_tm_txble

   m_tax_due := f_comptaxdue(m_txble_income)

   m_tax_ref := y_tax + y_ded10 + m_y_btax + y_othertax - m_tax_due + m_tm_tax

   replace per_exmp with m_per_exemption,;
      add_exmp with m_add_exemption,;
      sap_exmp with 0,;
      tax_inc with m_txble_income,;
      tax_due with m_tax_due,;
      tax_ref with m_tax_ref

   skip

end while

select(_m_oldarea)
return nil
