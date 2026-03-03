/*
Program Code: Rpralpha.prg
Program Func:This program spools the Shecdule 7.1 as per BIR format S71
             (for Resigned Employees - Emp_type = 'R' )
Author: Sonny C.
Date  : Jan.30, 2001
*/

   m_oldcol  := setcolor()
   m_qtrscrn := savescreen(12,18,15,61)
   setcolor(m_cnor)
   while .t.
      f_bcln()
      m_spool := .t.

      f_setting()

      select 6
      if !net_use("&opath\exmp2007",.t.,5)
         exit
      endif
      index on status to &opath\exmp2007
      set index to &opath\exmp2007

      select 5
      if !net_use("&dpath\history",.t.,5)
         exit
      endif
      set index to &dpath\hbyemp
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

      f_drawbox(12,18,14,59,1,3)
      @13,21 say "Print Alpha List For The Year :"
      @13,53 get m_year picture "9999" valid m_year>=str(year(beg_date-1),4)
      read

      if f_esc()
         exit
      endif

      m_sfname:=subs(f_nohyphen(m_comp_tin),1,8)+'.S71'

      if ! f_zaskspool(m_sfname)
         m_spool := .f.
         if f_esc()
            exit
         endif
         set print on
         set device to print
         set console off
      endif

      //f_compute_tax(.t.)  //.t.-posted
      f_comp_tax(.t.)  //.t.-posted
      f_rprint_alpha()

      if m_spool
         set printer to
      endif
      set device to screen
      set console on

      exit

   end while

   restscreen(12,18,15,61,m_qtrscrn)
   dbcloseall()
   setcolor(m_oldcol)
   return nil


***************************************
function f_rprint_alpha()
local _m_oldarea:=select()

select master
dbgotop()

while ! eof()

   s1:=','
	m_ctr:=0
   m_crow:=0
   m_pict:='999999999.99'
   m_page:=0
   m_t13th:=m_tsss:=m_tsal:=m_tnt13th:=m_tntsal:=m_texemp:=m_tprem:=m_ttaxdue:=;
   m_tjandec:=m_tjannov:=m_tdectax:=m_tref:=m_tadjstd:=0

   m_g_4a := m_g_4b := m_g_4c := m_g_4d := m_g_4e := m_g_4f := m_g_4g :=;
   m_g_4h := m_g_4i := m_g_4j := m_g_5b := m_g_6  := m_g_7  := m_g_8  :=;
   m_g_9  := m_g_10a:= m_g_10b:= m_g_11 := 0

   m_ncomp_tin:=F_NOHYPHEN(m_comp_tin)

   @m_crow,0 say 'H1604CF,'+m_ncomp_tin+',0000,12/31/'+m_year+',,,,,,,,,,,,,,,,,,,,,,,,,,,,,'
   m_dtl:='D7.1,1604CF,'+m_ncomp_tin+',0000,12/31/'+m_year+','

	while ! eof()

		if y_gross+y_othergrs+y_bonus+y_midbon<=0
			skip
			loop
		endif

      if emp_type != 'R'
         skip
         loop
      endif

	   m_ctr ++
      m_line:=''

      //m_premiums:=y_sss+y_med+y_pbg+y_dues
      m_premiums:=y_sss+y_med+y_pbg  //+y_dues
      adjust_ntx:=adjust_grs:=add_exmp:=sap_exmp:=0
      lname:=subs(emp_nm,1,15)
      fname:=subs(emp_nm,16,15)

      m_line += m_dtl+alltrim(str(m_ctr,9))+','+f_nohyphen(tan)+',0000,' ;
         +alltrim(lname)+','+alltrim(fname)+','+alltrim(mname)+','

      //Date Hire and Date Resigned
      m_emp_no := emp_no
      m_line += f_hiredresign(m_emp_no)

      m_y_bonus := y_bonus + y_midbon
      m_y_btax  := y_btax  + y_midtax

      //4(a) GROSS COMPENSATION INCOME
      m_4a := y_gross + y_othergrs + m_y_bonus
      m_line += alltrim(tran(m_4a,m_pict))+s1
      m_g_4a += m_4a

      if m_y_bonus > m_nontaxbon
         m_4b := m_nontaxbon
         m_4h := m_y_bonus - m_nontaxbon
      else
         m_4b := m_y_bonus
         m_4h := 0
      endif

      //Print NON-TAXABLE PAY

      //4(b) 13th MONTH PAY & OTHER BENEFITS
      m_line += alltrim(tran(m_4b,m_pict))+s1
      m_g_4b += m_4b

      //4(c) DE MINIMIS BENEFITS
      m_4c := deminimis
      m_line += alltrim(tran(m_4c,m_pict))+s1
      m_g_4c += m_4c

      //4(d) SSS,GSIS,PHIC & PAG-IBIG CONTRIBUTIONS & UNION DUES
      m_4d := y_sss + y_med + y_pbg
      m_line += alltrim(tran(m_4d,m_pict)) + s1
      m_g_4d += m_4d

      //4(e) SALARIES & OTHER FORMS OF COMPENSATION
      //m_4e := y_othp2 + y_othp4
      m_4e := Y_OTHP1 + y_othp2 + y_othp4
      m_line += alltrim(tran(m_4e,m_pict)) + s1
      m_g_4e += m_4e

      //4(f) TOTAL NON-TAXABLE EXEMPT COMP. INCOME
      m_4f := m_4b + m_4c + m_4d + m_4e
      m_line += alltrim(tran(m_4f,m_pict))+s1
      m_g_4f += m_4f

      //Print TAXABLE PAY

      //4(g) TAXABLE BASIC SALARY
      //4c = deminimis, 4d = premiums, 4e = y_othp2 + y_othp4
      //m_4i = y_othp1 + y_othp3
      m_4i = y_othp3
      m_4g := y_gross-(m_4c+m_4d+m_4e+m_4i)+y_othergrs
      m_line += alltrim(tran(m_4g,m_pict)) + s1
      m_g_4g += m_4g

      //4(h) TAXABLE 13TH MONTH & OTHER BENEFITS
      m_line += alltrim(tran(m_4h,m_pict)) + s1
      m_g_4h += m_4h

      //4(i) TAXABLE SALARIES & OTHER FORMS OF COMPENSATION
      m_line += alltrim(tran(m_4i,m_pict)) + s1
      m_g_4i += m_4i

      //4(j) TOTAL TAXABLE COMPENSATION INCOME
      m_4j := m_4g + m_4h + m_4i
      m_line += alltrim(tran(m_4j,m_pict)) + s1
      m_g_4j += m_4j

      //5(a) EXEMPTION CODE

      m_status := STATUS

      if m_status = "ME0"
         m_status = "M"
      elseif m_status = "ME1"
         m_status = "M1"
      elseif m_status = "ME2"
         m_status = "M2"
      elseif m_status = "ME3"
         m_status = "M3"
      elseif m_status = "ME4"
         m_status = "M4"
      elseif m_status = "S0"
         m_status = "S"
      elseif m_status = "HF0"
         m_status = "S"
      elseif m_status = "HF1"
         m_status = "S1"
      elseif m_status = "HF2"
         m_status = "S2"
      elseif m_status = "HF3"
         m_status = "S3"
      elseif m_status = "HF4"
         m_status = "S4"
      endif

      m_5a := m_status

      //5a EXEMPTION CODE
      m_line += alltrim(m_5a)+s1

      //5b EXEMPTION AMOUNT
      m_5b = per_exmp + add_exmp + sap_exmp
      m_line += alltrim(tran(m_5b,m_pict)) + s1
      m_g_5b += m_5b

      //6 HEALTH PREMIUM
      m_6 := y_premium
      m_line += alltrim(tran(m_6,m_pict)) + s1
      m_g_6 += m_6

      //7 NET TAXABLE COMPENSATION INCOME
      m_7 := m_4j - m_5b - m_6
      if m_7 < 0
         m_7 := 0
      endif
      m_line += alltrim(tran(m_7,m_pict)) + s1
      m_g_7 += m_7

      //8 TAX DUE
      m_8 := tax_due
      m_line += alltrim(tran(m_8,m_pict)) + s1
      m_g_8 += m_8

      //9 TAX WITHHELD
      //Jan to Nov. Tax w/held = total tax w/held less dec tax w/held
      //m_novtax := (y_tax+y_ded10-m_ded10-m_tax) + y_othertax
      m_9 := y_tax + y_ded10 + y_othertax
      m_line += alltrim(tran(m_9,m_pict)) + s1
      m_g_9 += m_9

      //10a AMOUNT WITHHELD AND PAID FOR IN DECEMBER
      //10b OVER WITHHELD TAX REFUNDED TO EMPLOYEE

      if m_8 > m_9
         m_10a := m_8 - m_9
         m_10b := 0
      else
         m_10a := 0
         m_10b := m_9 - m_8
      endif

      m_line += alltrim(tran(m_10a,m_pict)) + s1
      m_g_10a += m_10a

      m_line += alltrim(tran(m_10B,m_pict)) + s1
      m_g_10b += m_10b

      //11 AMOUNT OF TAX WITHHELD AS ADJUSTED
      m_11 := m_9 + m_10a
      m_line += alltrim(tran(m_11,m_pict)) + s1
      m_g_11 += m_11

      m_line += "Y"

      m_crow++

      @m_crow,0 say m_line

	   skip

	end while

   m_crow++

   @m_crow,0 say 'C7.1,1604CF,'+m_ncomp_tin+',0000,12/31/'+m_year+',';
      + alltrim(tran(m_g_4a,m_pict)) + s1 ;
      + alltrim(tran(m_g_4b,m_pict)) + s1 ;
      + alltrim(tran(m_g_4c,m_pict)) + s1 ;
      + alltrim(tran(m_g_4d,m_pict)) + s1 ;
      + alltrim(tran(m_g_4e,m_pict)) + s1 ;
      + alltrim(tran(m_g_4f,m_pict)) + s1 ;
      + alltrim(tran(m_g_4g,m_pict)) + s1 ;
      + alltrim(tran(m_g_4h,m_pict)) + s1 ;
      + alltrim(tran(m_g_4i,m_pict)) + s1 ;
      + alltrim(tran(m_g_4j,m_pict)) + s1 ;
      + alltrim(tran(m_g_5b,m_pict)) + s1 ;
      + alltrim(tran(m_g_6 ,m_pict)) + s1 ;
      + alltrim(tran(m_g_7 ,m_pict)) + s1 ;
      + alltrim(tran(m_g_8 ,m_pict)) + s1 ;
      + alltrim(tran(m_g_9 ,m_pict)) + s1 ;
      + alltrim(tran(m_g_10a,m_pict))+ s1 ;
      + alltrim(tran(m_g_10b,m_pict))+ s1 ;
      + alltrim(tran(m_g_11 ,m_pict))  ;
      + ',,,,,,,,,,'

   exit

end while
select(_m_oldarea)
return nil


function f_hiredresign(_m_emp_no)
local _m_oldarea:=select(), _m_return:=',,'
select history
seek _m_emp_no
if ! eof()
   if dtos(date_emp) != space(8)
      _m_return := subs(dtoc(date_emp),1,6)+str(year(date_emp),4)+','
   else
      _m_return := '  /  /    ,'
   endif
   if dtos(date_sep) != space(8)
      _m_return += subs(dtoc(date_sep),1,6)+str(year(date_sep),4)+','
   else
      _m_return += '  /  /    ,'
   endif
endif
select (_m_oldarea)
return(_m_return)
