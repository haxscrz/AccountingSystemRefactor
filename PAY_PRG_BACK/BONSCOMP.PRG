* Program Name : 13th Month Pay Computation
* Program Code : Bonscomp.prg
* Author       : SVC
* Date         : March 16, 1995

m_old_col=setcolor()
do while .t.
	f_setting()
	select 2
	if .not. net_use ('&dpath\sys_id',.f.,5)
		exit
	endif
	m_bon_days=bon_days
	select 2
	if .not. net_use ('&opath\taxtab',.f.,5)
		exit
	endif
	set index to &opath\tax
	select 1
	if .not. net_use('&dpath\master',.t.,5)
		exit
	endif
	set inde to &dpath\mbyemp
	m_prevscrn=savescreen(8,3,16,76)
	if recc()=0
		f_err('NO Records in Master File !',.t.)
		exit
	endif
	if .not. fil_lock(5)
		exit
	endif
	f_drawbox(8,3,15,76,5,3)
	set colo to (m_cnor)
	@10,15 say repl('.',50)
	@11,15 say '0%          25%         50%          75%      100%'
	@13, 4 say 'Computing the 13th Month of Emp#      -'
	@14, 4 to 14,75
	m_recc=recc()
	m_ctr=0
	go top
	do while .not. eof()
		m_ctr=m_ctr+1
		select 1
		m_emp_no=emp_no
		m_emp_nm=emp_nm
		@ 9,15 say repl(chr(219),int(round(m_ctr/m_recc*50,0)))
		@13,36 say emp_no
		@13,43 say emp_nm
		m_y_bonus=0
		m_y_btax=0
		if emp_stat='C'
			m_bon_net=y_basic/12
		else
			m_bon_net=b_rate*m_bon_days
		endif
		m_tax_d=0
		if m_bon_net>m_tax_bon
			m_taxable=(m_bon_net-m_tax_bon)/2  &&divide by 2 bec.tax table is semi-monthly
	   	if subs(status,1,3) <> space(3)
				m_status=status
	         select taxtab
  			   seek m_status
				if .not. eof()
					m_peso=peso
					m_percent=percent
					m_salary=salary
		         do while m_taxable>salary.and.m_status=exemption.and..not.eof()
						if m_taxable>=salary
							m_peso=peso
							m_percent=percent
							m_salary=salary
						endif
						skip
					enddo
	            if m_salary=-1
	               m_y_btax=0
	            else
	               m_y_btax=(m_peso+((m_taxable-m_salary)*(val(m_percent)/100)))*2
	            endif
				else
					f_err('Please check tax status of '+m_emp_no+' '+m_emp_nm,.t.)
	         endi
			else
				f_err('Please check tax status of '+m_emp_no+' '+m_emp_nm,.t.)
			endif
			select 1
		endif
		replace y_bonus with m_bon_net, y_btax with m_y_btax
		skip
	enddo
	@ 9,15 say repl(chr(219),50)
	f_mess('Computation Completed...',.f.)
	inkey(0)
	restscreen(8,3,16,76,m_prevscrn)
	exit
enddo
close all
return
