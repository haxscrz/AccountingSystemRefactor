/*
Program Name : PAYROLL SYSTEM MAIN PROGRAM
Program Code : Pay.prg
Author...... : SVC
Date Started : May 19, 1994
Date Finished: May 24, 1994
*/

* Initialize path variables
use pathfile
cpath=alltrim(caslpath)
rpath=alltrim(rankpath)
tpath=alltrim(textpath)
bpath=alltrim(backpath)
b2path=alltrim(back2path)
opath=alltrim(othrpath)
dpath=''
pcode=alltrim(passcode)
m_company=alltrim(company)
m_comp_addr=comp_addr
m_comp_sss=comp_sss
m_comp_pbg=comp_pbg
m_comp_tin=comp_tin
m_comp_sign=comp_sign
m_compstit=comp_stit
m_compstin=comp_stin
m_comp_zip=alltrim(comp_zip)
m_comp_tel=alltrim(comp_tel)
m_comp_PHIC=alltrim(comp_PHIC)
m_reot_r=reot_rate
m_sphp_r=sphp_rate
m_spot_r=spot_rate
m_lghp_r=lghp_rate
m_lgot_r=lgot_rate
m_nsd_r=nsd_rate
m_st_ln1=f_sscrn(tloan1)
m_st_ln2=f_sscrn(tloan2)
m_st_ln3=f_sscrn(tloan3)
m_st_ln4=f_sscrn(tloan4)
m_st_ln5=f_sscrn(tloan5)
m_st_ded1=f_sscrn(toth_ded1)
m_st_ded2=f_sscrn(toth_ded2)
m_st_ded3=f_sscrn(toth_ded3)
m_st_ded4=f_sscrn(toth_ded4)
m_st_ded5=f_sscrn(toth_ded5)
m_st_ded6=f_sscrn(toth_ded6)
m_st_ded7=f_sscrn(toth_ded7)
m_st_ded8=f_sscrn(toth_ded8)
m_st_ded9=f_sscrn(toth_ded9)
m_st_ded10=f_sscrn(toth_ded10)
m_rt_ln1=f_rscrn(tloan1)
m_rt_ln2=f_rscrn(tloan2)
m_rt_ln3=f_rscrn(tloan3)
m_rt_ln4=f_rscrn(tloan4)
m_rt_ln5=f_rscrn(tloan5)
m_rt_ded1=f_rscrn(toth_ded1)
m_rt_ded2=f_rscrn(toth_ded2)
m_rt_ded3=f_rscrn(toth_ded3)
m_rt_ded4=f_rscrn(toth_ded4)
m_rt_ded5=f_rscrn(toth_ded5)
m_rt_ded6=f_rscrn(toth_ded6)
m_rt_ded7=f_rscrn(toth_ded7)
m_rt_ded8=f_rscrn(toth_ded8)
m_rt_ded9=f_rscrn(toth_ded9)
m_rt_ded10=f_rscrn(toth_ded10)
m_company=alltrim(company)
m_compcode=alltrim(compcode)
/*
m_tax_bon=tax_bon
m_nontaxbon:=tax_bon
*/

m_tax_bon=90000
m_nontaxbon:=90000

m_daily_wage=daily_wage
m_head=''
m_border='ÉÍ»º¼ÍÈº'
_m_helpon=.f.
* Initialize color variables
do case
	case monitor='V'
		m_ched=alltrim(c_ched)
		m_cini=alltrim(c_cini)
		m_cbrg=alltrim(c_cbrg)
		m_cnor=alltrim(c_cnor)
		m_cerr=alltrim(c_cerr)
		m_cmes=alltrim(c_cmes)
		m_cmen=alltrim(c_cmen)
		m_cget=alltrim(c_cget)
		m_crev=alltrim(c_crev)
		m_shad=alltrim(c_shad)
		m_rshad=alltrim(c_rshad)
		m_mscrn=alltrim(c_mscrn)
	case monitor='W'
		m_ched=alltrim(w_ched)
		m_cini=alltrim(w_cini)
		m_cbrg=alltrim(w_cbrg)
		m_cnor=alltrim(w_cnor)
		m_cerr=alltrim(w_cerr)
		m_cmes=alltrim(w_cmes)
		m_cmen=alltrim(w_cmen)
		m_cget=alltrim(w_cget)
		m_crev=alltrim(w_crev)
		m_shad=alltrim(w_shad)
		m_rshad=alltrim(w_rshad)
		m_mscrn=alltrim(w_mscrn)
	case monitor='B'
		m_ched=alltrim(b_ched)
		m_cini=alltrim(b_cini)
		m_cbrg=alltrim(b_cbrg)
		m_cnor=alltrim(b_cnor)
		m_cerr=alltrim(b_cerr)
		m_cmes=alltrim(b_cmes)
		m_cmen=alltrim(b_cmen)
		m_cget=alltrim(b_cget)
		m_crev=alltrim(b_crev)
		m_shad=alltrim(b_shad)
		m_rshad=alltrim(b_rshad)
		m_mscrn=alltrim(b_mscrn)
endc
use
* Set-up environment
set wrap on
set inte on
set excl off
set scor off
set colo to (m_cini)
set conf on
set mess to 23 center
set exac on
set dele on
set key 28 to p_about
set procedure to payfuncs
set epoch to 1945
clea
squares()
f_drawbox(8,18,16,60,3,0)
if .not. f_password(10)
	clea
	release all
	retu
endi
* Draw main screen
squares()
set colo to (m_mscrn)
@1,0 to 1,79 doub
*set colo to (m_mscrn)
set colo to (m_cnor)
//@2,0,22,79 box 'ÚÄ¿³ÙÄÀ³°'
@2,0 to 22,79
@23,0 clear to 23,79
f_bcln()
set colo to (m_ched)
@0,0 say spac(80)
@0,f_center(m_compcode+' PAYROLL  SYSTEM',79) say m_compcode+' PAYROLL  SYSTEM'
*@0,72 say 'by iSCTL '
@0,65 say 'iSTCL-v.230216'
m_taposna=.f.
m_selected=.f.
keyboard chr(13)+chr(13)+chr(13)
do while .t.
	f_clnmes()
	set colo to (m_cmen)
	f_selkey()
	@2,5  prom ' MAIN MENU ' mess 'Data Entry, Process Payroll or EXIT to DOS.'
	@2,21 prom ' FILE MAINTENANCE ' mess 'Reindex corrupted files, Update master files.'
	@2,44 prom ' QUERY ' mess 'View Status, Transactions on the screen.'
	@2,56 prom ' REPORT GENERATION ' mess 'Generate a hard copy of reports.'
	menu to m_main
	do case
		case m_main=1
			* Main Menu - Data Entry and File Processing
			* do mainmenu
			m_mscrn=savescreen(3,1,13,27)
			f_drawbox(3,2,12,27,1,3)
			do while .t.
				f_clnmes()
				f_selkey()
				set colo to (m_cmen)
			   @ 4,3 prom '  SELECT PAYROLL TYPE   ' mess 'Select Payroll Type To Process.'
				@ 5,3 prom '    PROCESS TIMECARD    ' mess 'Initialize, Maintain Timecard File.'
				@ 6,3 prom '    COMPUTE PAYROLL     ' mess 'Initialize, Maintain Timecard File.'
				@ 7,3 prom '   POST TRANSACTIONS    ' mess 'Post Transactions Against Employee Master File.'
				@ 8,3 prom '   ENTER OR/SBR INFO    ' mess 'Enter SSS OR/SBR Information for Certification purposes.'
				@ 9,3 prom ' COMPUTE 13TH MONTH PAY ' mess 'Compute the 13th Month Pay Of All The Employees.'
				@10,3 prom '  COMPUTE YEAR-END TAX  ' mess 'Compute the Year-end Witholding Tax All The Employees.'
 			 	@11,3 prom '  E X I T   TO   D O S  ' mess 'Go to DOS prompt.'
				menu to m_main1
				do case
					case m_main1=0
						exit
					case m_main1=1
						m_mscrn1=savescreen(5,4,9,25)
						f_drawbox(5,5,8,25,1,3)
						do while .t.
							f_clnmes()
							f_selkey()
							set colo to (m_cmen)
						   @6,6 prom ' REGULAR EMPLOYEES ' mess "Process Regular Employees' Payroll."
							@7,6 prom ' CASUAL  EMPLOYEES ' mess "Process Casual Employees' Payroll."
							menu to m_main11
							do case
								case m_main11=1
									dpath=rpath
									tpath=rpath
									m_selected=.t.
									*m_head='REGULAR EMPLOYEES'
									m_head=''
									set colo to (m_ched)
									@0,1 say '*REGULAR EMP.*'
									exit
								case m_main11=2
									dpath=cpath
									tpath=cpath
									m_selected=.t.
									*m_head='CASUAL EMPLOYEES'
									m_head=''
									set colo to (m_ched)
									@0,1 say '*CASUAL  EMP.*'
									exit
							endc
						endd
						f_endtone()
						restscreen(5,4,9,25,m_mscrn1)
						release m_mscrn1

					case m_main1=2
						* TIMECARD
						m_mscrn1=savescreen(6,4,11,27)
						f_drawbox(6,5,10,27,1,3)
						do while .t.
							f_clnmes()
							f_selkey()
							set colo to (m_cmen)
							@7,6 prom ' ADD/EDIT   TIMECARD ' mess 'Add/Edit/Delete an Employee Timecard.'
						   @8,6 prom ' INITIALIZE TIMECARD ' mess 'Initialize or Prepare Files for a New Payroll Period.'
						   @9,6 prom ' APPEND FROM DATAFILE' mess 'Add new records to time file from datafile.'
							menu to m_main21
							do case
								case m_main21=1
									do edittime
								case m_main21=2
									if f_password(21)
										do inittime with .f.
									endi
								case m_main21=3
									if f_password(202)
										do appetime
									endi
								otherwise
									exit
							endc
						endd
						f_endtone()
						restscreen(6,4,11,27,m_mscrn1)
						release m_mscrn1

					case m_main1=3
						*Compute Payroll
						do comptime
						f_endtone()

					case m_main1=4
						*Post Transactions
						if f_password(14)
							do posttime
							f_endtone()
						endif

					case m_main1=5
						*Enter OR/SBR Information
						if f_choose(' SELECT O.R. INPUT : ',' SSS ',' PAG-IBIG ')
							do entorsbr 
						else
							do entorpag 
						endif		
						f_endtone()
					case m_main1=6
						*Compute 13th Month Pay
						if f_password(15)
							do bonscomp
							f_endtone()
						endi

					case m_main1=7
						*Year-end tax
						if f_password(16)
							do ytaxcomp
							f_endtone()
						endi

					otherwise
						m_taposna=.t.
						exit
				endc
			endd
			if m_taposna
				exit
			endi
			f_endtone()
			restscreen(3,1,13,27,m_mscrn)
			release m_mscrn

		case m_main=2
			* File Maintenance
			m_mscrn=savescreen(3,15,16,44)
			f_drawbox(3,16,15,44,1,3)
			do while .t.
				f_clnmes()
				f_selkey()
				set colo to (m_cmen)
				@ 4,17 prom '  REINDEX CORRUPTED FILES  ' mess 'Rebuild Corrupted Index Files of DatabaseS.'
				@ 5,17 prom ' EDIT EMPLOYEE MASTER FILE ' mess 'Maintain Employee Master File.'
				@ 6,17 prom '    UPDATE EMPLOYEE RATE   ' mess 'Increase The Employee Rate by Uniform Amount.'
				@ 7,17 prom '    EDIT DEPARTMENT FILE   ' mess 'Maintain Department Payroll Summary File.'
				@ 8,17 prom '    EDIT TAX TABLE FILE    ' mess 'Maintain The Tax Table File.'
				@ 9,17 prom '      EDIT SYSTEMS ID      ' mess 'Maintain System ID/Payroll Period.'
				@10,17 prom ' INITIALIZE FOR A NEW YEAR ' mess 'Initialize Databases and Counters for a New Year.'
				@11,17 prom '     BACKUP DATABASES      ' mess 'Create a Duplicate Copy Of The Databases.'
				@12,17 prom '    EDIT DATABASE PATH     ' mess 'Create a Duplicate Copy Of The Databases.'
				@13,17 prom '   EDIT EMPLOYEE NUMBER    ' mess 'Edit Employee Number.'
				@14,17 prom '   ADD/EDIT DEPARTMENT     ' mess 'Add/Edit Department Name'
				menu to m_main2
            m_flagdone=.f.
				do case
					case m_main2=1
						* REINDEX
						m_fmscrn=savescreen(5,18,13,50)
						f_drawbox(5,19,12,50,1,3)
						do while .t.
							f_clnmes()
							f_selkey()
							@ 6,20 prom ' REINDEX EMPLOYEE MASTER FILE ' mess 'Rebuild the Master Index Files.'
							@ 7,20 prom '     REINDEX TIMECARD FILE    ' mess 'Rebuild the Timecard Index File.'
							@ 8,20 prom '    REINDEX DEPARTMENT FILE   ' mess 'Rebuild the Department Index File.'
							@ 9,20 prom '     REINDEX TAX CODE FILE    ' mess 'Rebuild the Tax Code Index File.'
							@10,20 prom '  REINDEX CERTIFICATION FILE  ' mess 'Rebuild all the Premium Certification Databases.'
							@11,20 prom '    REINDEX ALL FILES ABOVE   ' mess 'Rebuild all the Index Files of All Databases.'
							menu to m_main3
							do case
								case m_main3=1
									f_reindex('&dpath\master','&dpath\mbyemp','emp_no')
									f_reindex('&dpath\master','&dpath\mbynm','emp_nm')
									f_reindex('&dpath\master','&dpath\mbydep','dep_no+emp_no')
									f_reindex('&dpath\history','&dpath\hbyemp','emp_no')
									f_reindex('&dpath\history','&dpath\hbynm','emp_nm')
									f_reindex('&dpath\history','&dpath\hbydep','dep_no+emp_no')
								case m_main3=2
									f_reindex('&dpath\tmcard','&dpath\tbyemp','emp_no')
									f_reindex('&dpath\tmcard','&dpath\tbynm','emp_nm')
									f_reindex('&dpath\tmcard','&dpath\tbydep','dep_no+emp_no')
								case m_main3=3
									f_reindex('&dpath\dept','&dpath\dbydep','dep_no')
								case m_main3=4
									f_reindex('&opath\taxtab','&opath\tax','exemption+percent')
								case m_main3=5
									f_reindex('&dpath\premmast','&dpath\premmast','emp_no+period')
									f_reindex('&dpath\prempaid','&dpath\prempaid','period+preflag')
								case m_main3=6
									f_reindex('&dpath\master','&dpath\mbyemp','emp_no')
									f_reindex('&dpath\master','&dpath\mbynm','emp_nm')
									f_reindex('&dpath\master','&dpath\mbydep','dep_no+emp_no')
									f_reindex('&dpath\history','&dpath\hbyemp','emp_no')
									f_reindex('&dpath\history','&dpath\hbynm','emp_nm')
									f_reindex('&dpath\history','&dpath\hbydep','dep_no+emp_no')
									f_reindex('&dpath\tmcard','&dpath\tbyemp','emp_no')
									f_reindex('&dpath\tmcard','&dpath\tbynm','emp_nm')
									f_reindex('&dpath\tmcard','&dpath\tbydep','dep_no+emp_no')
									f_reindex('&dpath\dept','&dpath\dbydep','dep_no')
									f_reindex('&opath\taxtab','&opath\tax','exemption+percent')
								otherwise
									exit
							endc
						endd
						f_endtone()
                  dbcloseall()
						restscreen(5,18,13,50,m_fmscrn)
						release m_fmscrn

					case m_main2=2
						if f_password(22)
							do mastedit
						endi

					case m_main2=3
						if f_password(23)
							do mastrate
						endi

					case m_main2=4
						if f_password(24)
							do deptedit
						endi

					case m_main2=5
						if f_password(25)
							do taxtedit
						endi

					case m_main2=6
						if f_password(26)
							do systedit
						endi

					case m_main2=7
						if f_password(27)
							do inittime with .t.
						endi

					case m_main2=8
						if f_password(28)
							if .not.f_choose(' SELECT BACK-UP (POSTING) : ',' BEFORE ',' AFTER ')
								do fileback
							else
								do file2bac
							endif
						endi

					case m_main2=9
						if f_password(29)
							do f_edtcod with 1
						endi

					case m_main2=10
						if f_password(290)
							do f_edtcod with 2
						endi

					case m_main2=11
						if f_password(240)
							do ftdepedt
						endi

					otherwise
						exit
				endc
			endd
			f_endtone()
			restscreen(3,15,15,44,m_mscrn)
			release m_mscrn

		case m_main=3
			* Query
			if f_password(30)
				do quertime
			endi

		case m_main=4
			* Report Generation
			m_mscrn=savescreen(3,52,19,78)
			f_drawbox(3,53,18,78,1,3)
			do while .t.
				f_clnmes()
				f_selkey()
				set colo to (m_cmen)
				@ 4,54 prom '  TIMECARD VALIDATION   ' mess 'Print the Timecard Validation Report.'
				@ 5,54 prom '   PAYROLL REGISTER     ' mess 'Print the Payroll Register.'
				@ 6,54 prom '     PAYROLL SLIP       ' mess 'Print the Payslip of All or Selected Employees or Summary Only.'
				@ 7,54 prom ' DENOMINATION BREAKDOWN ' mess 'Print the Denomination Breakdown.'
				@ 8,54 prom '   DEDUCTIONS REPORT    ' mess 'Print the List of Employees with Deductions.'
				@ 9,54 prom '    MONTHLY REPORTS     ' mess 'Print the Monthly Payroll Reports.'
				@10,54 prom '   QUARTERLY REPORTS    ' mess 'Print the Quarterly SSS Report.'
				@11,54 prom ' QTRLY SSS LN(SSS FORM) ' mess 'Print the Quarterly SSS Loan Report.'
				@12,54 prom ' YEAR-END PAYROLL RECAP ' mess 'Print the Year-end Payroll Recapitulation/Summary.'
				@13,54 prom ' EMPLOYEE MASTER FILE   ' mess 'Print the Employee Personal Info, Salary Rates, and/or Loan Balances.'
				@14,54 prom '        BONUS           ' mess 'Print the Bonus Summary, Payslip and/or Denomination Breakdown.'
				@15,54 prom '  YEAR-END TAX/REFUND   ' mess 'Print the Year-end Tax Reconciliation, Refund, and/or Refund Payslip.'
				@16,54 prom ' PREMIUM PAYMENT CERTIF ' mess 'Print the SSS, MEDICARE and PAG-IBIG Premium Payment Certification.'
				@17,54 prom '    SET PRINTER FONT    ' mess 'Set the current printer font for printing.'
				menu to m_main4
				do case
					case m_main4=1 &&TIMECARD VALIDATION
						do rptmval2  &&trn_list of trn_main
					case m_main4=2 &&PAYROLL REGISTER
						do rpregist  &&register
					case m_main4=3 &&PAYROLL SLIP
						m_mscrn42=savescreen(7,47,13,75)
						f_drawbox(7,47,12,74,1,3)
						do while .t.
							f_clnmes()
							f_selkey()
							set colo to (m_cmen)
                     @ 8,48 prom ' ALL PAY SLIPS W/ SUMMARY '
                     @ 9,48 prom '   SELECTED PAY SLIPS     '
                     @10,48 prom '    PAY SLIP SUMMARY      '
							@11,48 prom '   ATM PAYROLL SUMMARY    '
							menu to m_main41
							do case
								case m_main41=1 && ALL PAY SLIPS W/ SUMMARY
									do rppayslp with 1
								case m_main41=2 && SELECTED PAY SLIPS
									do rppayslp with 2
								case m_main41=3 && PAY SLIP SUMMARY
									do rppayslp with 3
								case m_main41=4 && ATM SUMMARY
									do rppayslp with 4
								otherwise
									exit
							endc
						endd
						f_endtone()
						restscreen(7,47,13,75,m_mscrn42)
						release m_mscrn42

					case m_main4=4 &&DENOMINATION BREAKDOWN
						do rpdenbrk &&pay_den
					case m_main4=5 &&DEDUCTIONS REPORT
						do rpdedrep &&oth_ded
					case m_main4=6 &&MONTHLY PAYROLL REPORTS
						m_mscrn42=savescreen( 5,44,20,75)
						f_drawbox( 5,44,20,74,1,3)
						while .t.
							f_clnmes()
							f_selkey()
							set colo to (m_cmen)
							@ 6,45 prom '    MONTHLY PAYROLL RECAP    ' mess 'Print the Monthly Payroll Recapitulation/Summary.'
	                  @ 7,45 prom 'MONTHLY SSS/PHIC/EC/PGBG/TAX ' mess 'Print the Monthly Regular Deductions Report.'
	                  @ 8,45 prom '  MONTHLY SSS/PHIC/EC/PGBG   ' mess 'Print the Monthly SSS, Philhealth, Employer Contribution, Pag-ibig Report.'
							@ 9,45 prom '    MONTHLY SSS,PHCI,EC      ' mess 'Print the Monthly SSS, Philhealth, Employer Contribution Report.'
							@10,45 prom '      MONTHLY SSS & EC       ' mess 'Print the Monthly SSS & Employer Contribution Report.'
							@11,45 prom '     MONTHLY PHILHEALTH      ' mess 'Print the Monthly Philhealth Contribution Report.'
							@12,45 prom '      MONTHLY PAG-IBIG       ' mess 'Print the Monthly Pag-ibig Contribution Report.'
							@13,45 prom '    MONTHLY TAX WITHHELD     ' mess 'Print the Monthly Tax Withheld.'
							@14,45 prom '    MONTHLY DEPT. SUMMARY    ' mess 'Print the Monthly Departmental Summary.'
							@15,45 prom ' MONTHLY LOAN DEDUCTION SMRY ' mess 'Print the Monthly Loan Deduction Summary.'
							@16,45 prom '  SSS-LMS  DISKETTE PROJECT  ' mess 'Spool the Monthly SSS Salary/Calamity Loan Payments.'
							@17,45 prom 'SSS R-3 TAPE DISKETTE PROJECT' mess "Spool the Quarterly SSS/Medicare/EC for SSS R-3 Tape Diskette Project"
							@18,45 prom ' HDMF LOAN DISKETTE PROJECT  ' mess 'Monthly HDMF Loan Payments Diskette Project.'
							@19,45 prom '   PHILHEALTH REGULAR RF-1   ' mess 'Print Monthly Philhealth Regular RF-1.'
							menu to m_main41

							do case
								case m_main41=1
									do rppaymon
								case m_main41=2
									do rpmonsss with 'ALL'
								case m_main41=3
									do rpmonsss with 'PBG'
								case m_main41=4
									do rpmonsss with 'SSS'
								case m_main41=5
									do rpsssmed with 'SSS'
								case m_main41=6
									do rpsssmed with 'MED'
								case m_main41=7
									do rpmonpbg  &&inside rpmonsss
								case m_main41=8
									do rpmonsss with 'TAX'
								case m_main41=9
									do rpdepsum &&dep_sum
								case m_main41=10
									m_mscrn422=savescreen(11,50,19,71)
									f_drawbox(11,50,18,70,1,3)
									do while .t.
										f_clnmes()
										f_selkey()
										set colo to (m_cmen)
				                  @12,51 prom '    '+m_rt_ln1+'     ' mess 'Print the Monthly '+m_rt_ln1+' Deduction Report.'
				                  @13,51 prom '    '+m_rt_ln2+'     ' mess 'Print the Monthly '+m_rt_ln2+' Deduction Report.'
										@14,51 prom '    '+m_rt_ln3+'     ' mess 'Print the Monthly '+m_rt_ln3+' Deduction Report.'
										@15,51 prom '    '+m_rt_ln4+'     ' mess 'Print the Monthly '+m_rt_ln4+' Deduction Report.'
										@16,51 prom '    '+m_rt_ln5+'     ' mess 'Print the Monthly '+m_rt_ln5+' Deduction Report.'
										@17,51 prom 'ALL LOAN DEDUCTION ' mess 'Print all the Monthly Deduction Report.'
										menu to m_main412
										do case
											case m_main412=1
												do rpmonlon with 'SLR'
											case m_main412=2
												do rpmonlon with 'CAL'
											case m_main412=3
												do rpmonlon with 'HSE'
											case m_main412=4
												do rpmonlon with 'COM'
											case m_main412=5
												do rpmonlon with 'COD'
											case m_main412=6
												m_mscrn423=savescreen(12,50,16,71)
												f_drawbox(13,50,16,71,1,3)
												do whil .t.
													f_clnmes()
													f_selkey()
													set colo to (m_cmen)
													@14,51 prom '  AUTOMATIC DED.   'mess 'Print all monthly automatic deductions.'
													@15,51 prom '   MANUAL DED.     'mess 'Print all monthly manual deductions.'
													menu to m_main413
													do case
														case m_main413=1
															do rpmallon
														case m_main413=2
															do rpmalman
														otherwise
															exit
													endcase
												enddo
												f_endtone()
												restscreen(12,50,16,71,m_mscrn423)
												release m_mscrn423
											otherwise
												exit
										endcase
									enddo
									f_endtone()
									restscreen(11,50,19,71,m_mscrn422)
									release m_mscrn422
								case m_main41=11
									do sslndisk
								case m_main41=12
									do rpr3proj
								case m_main41=13
									f_pgbgdisk()
								case m_main41=14
									do rpphic
								otherwise
									exit
							endcase
						end while
						f_endtone()
						restscreen( 5,44,20,75,m_mscrn42)
						release m_mscrn42

					case m_main4=7 &&QUARTERLY REPORTS
						m_mscrn42=savescreen(11,36,20,74)
						f_drawbox(11,36,19,74,1,3)
						while .t.
							f_clnmes()
							f_selkey()
							set colo to (m_cmen)
							@12,37 prom '    QUARTERLY SSS,PHILHEALTH & EC    ' mess "Print the Quarterly SSS, Philhealth Contribution & Employer's Contribution."
							@13,37 prom '     QUARTERLY PAG-IBIG PREMIUM      ' mess "Print the Quarterly Pag-ibig Premium."
							@14,37 prom '     QUARTERLY WITHHOLDING TAX       ' mess "Print the Quarterly Withholding Tax Paid by the Employees."
							@15,37 prom '     QUARTERLY SSS LOAN PAYMENTS     ' mess "Print the Quarterly SSS Loan Payments by the Employees."
							@16,37 prom '  QUARTERLY PAG-IBIG LOAN PAYMENTS   ' mess "Print the Quarterly Pag-ibig Loan Payments by the Employees."
							@17,37 prom ' QUARTERLY PHIC REMITTANCE(HARD COPY)' mess "Print the PHIC Quarterly Remittance Report."
							@18,37 prom ' QUARTERLY PHIC REMITTANCE(DISKETTE) ' mess "Generate PHIC Quarterly Remittance Report File (Copy to Diskette)."
							menu to m_main41
							do case
								case m_main41=1
									do rppayqtr with 1
								case m_main41=2
									do rppayqtr with 2
								case m_main41=3
									do rppayqtr with 3
								case m_main41=4
									do rppayqtr with 4
								case m_main41=5
									do rppayqtr with 6
								case m_main41=6
									do rpqtrphi
								case m_main41=7
									do philhelt
								otherwise
									exit
							endc
						end while
						f_endtone()
						restscreen(11,36,19,74,m_mscrn42)
						release m_mscrn42

					case m_main4=8 &&QUARTERLY SSS LOAN
						do rppayqtr with 5
					case m_main4=9 &&YEAR-END PAYROLL RECAP
						do rppayyer &&pay_yr
					case m_main4=10 &&EMPLOYEE MASTER FILE
						m_mscrn42=savescreen(7,50,13,74)
						f_drawbox(6,50,12,74,1,3)
						do while .t.
							f_clnmes()
							f_selkey()
							set colo to (m_cmen)
							@ 7,51 prom ' EMPLOYEE MASTER LIST  '
							@ 8,51 prom ' PERSONAL INFORMATION  '
							@ 9,51 prom ' EMPLOYEE SALARY RATE  '
							@10,51 prom ' EMPLOYEE LOAN BALANCE '
							@11,51 prom ' EMPLOYEE VL/SL BALNCE '
							menu to m_main41
							do case
								case m_main41=1 &&MASTER LIST
									do rpmaster with 1
								case m_main41=2 &&PERSONAL INFORMATION
									do rpmaster with 2
								case m_main41=3 &&EMPLOYEE SALARY RATES
									do rpmaster with 3
								case m_main41=4 &&EMPLOYEE LOAN BALANCES
									do rpmaster with 4
								case m_main41=5 &&EMPLOYEE VL/SL BALANCE
									do rpmaster with 5
								otherwise
									exit
							endc
						endd
						f_endtone()
						restscreen(6,50,12,74,m_mscrn42)
						release m_mscrn42

					case m_main4=11 &&BONUS
						m_mscrn42=savescreen(4,46,13,74)
						f_drawbox(5,47,13,74,1,3)
						do while .t.
							f_clnmes()
							f_selkey()
							set colo to (m_cmen)
							@ 6,48 prom ' ADVANCE BONUS P.SLIP/SHT '
							@ 7,48 prom '     BONUS PAY SHEET      '
							@ 8,48 prom '    BONUS ATM SUMMARY     '
                     @ 9,48 prom ' ALL PAY SLIPS W/ SUMMARY '
                     @10,48 prom '    SELECTED PAY SLIPS    '
                     @11,48 prom '  PAY SLIP SUMMARY ONLY   '
							@12,48 prom '  DENOMINATION BREAKDOWN  '
							menu to m_main41
			   			do case
								case m_main41=1 &&PRINT ADVANCE BONUS PAY SHEET
									do rpbonslp with 4
								case m_main41=2 &&PRINT BONUS PAY SHEET
									do rpbonsht
								case m_main41=3 &&PRINT BONUS ATM SUMMARY
									do rpbonatm
								case m_main41=4 &&PRINT BONUS PAY SLIP
									do rpbonslp with 1
								case m_main41=5 &&PRINT BONUS PAY SLIP
									do rpbonslp with 2
								case m_main41=6 &&PRINT BONUS PAY SLIP
									do rpbonslp with 3
								case m_main41=7 &&PRINT DENOMINATION BREAKDOWN
									do rpbonden &&BON_DEN OF BON_MAIN
								otherwise
									exit
							endc
						endd
						f_endtone()
						restscreen(4,46,13,74,m_mscrn42)
						release m_mscrn42

					case m_main4=12 &&YEAR-END TAX/REFUND
						m_mscrn42=savescreen(7,46,18,75)
						f_drawbox(7,46,17,74,1,3)
						do while .t.
							f_clnmes()
							f_selkey()
							set colo to (m_cmen)
							@ 8,47 prom ' TAX RECONCILIATION REPORT '
							@ 9,47 prom '     TAX REFUND REPORT     '
							@10,47 prom ' TAX REFUND DEN. BREAKDOWN '
							@11,47 prom '      TAX REFUND SLIP      '
							@12,47 prom '  BIR TAX WITHHELD REPORT  '
							@13,47 prom '  INDIVIDUAL BIR W2 FORM   '
							@14,47 prom '         ALPHA LIST        ' mess 'This report Includes current payroll even if not yet posted!'
                     @15,47 prom "  FORM 1604CF-SCHEDULE 7.3 " mess 'This report Includes Only Posted Data of Currently Hired Employees!'
                     @16,47 prom "  FORM 1604CF-SCHEDULE 7.1 " mess 'This report Includes Only Posted Data of Resigned Employees!'
							menu to m_main41
							do case
								case m_main41=1 &&PRINT TAX RECONCILIATION REPORT'
									m_txscrn=savescreen(8,46,13,76)
									f_drawbox(9,47,12,75,1,3)
									do while .t.
										f_clnmes()
										f_selkey()
										set colo to (m_cmen)
										@10,48 prom " EMP.'s  TAXABLE INCOME    " mess "Employees' INCOME with withholding."
									   @11,48 prom " EMP.'s NON-TAXABLE INCOME " mess "Employees' INCOME without withholding tax."
										menu to m_taxmain
										do case
											case m_taxmain=1
												do rptaxsht  &&TAX_SHT OF TAX_MAIN
											case m_taxmain=2
												do rptaxnon  &&TAX_SHT W/O TAX WHELD OF TAX_MAIN
											otherwise
											exit
										endc
									endd
									f_endtone()
									restscreen(8,46,13,76,m_txscrn)
									release m_txscrn

								case m_main41=2 &&PRINT TAX REFUND REPORT'
									do rptaxref &&TAX_REF OF TAX_MAIN
								case m_main41=3 &&PRINT TAX REFUND DENOMINATION BREAKDOWN
									do rptaxden &&TAX_DEN OF TAX_MAIN
								case m_main41=4 &&PRINT TAX REFUND SLIP'
									do rptaxslp &&TAX_SLP OF TAX_MAIN
								case m_main41=5 &&PRINT BIR TAX WITHHELD REPORT'
									do rptaxbir &&TAX_BIR OF TAX_MAIN
								case m_main41=6 &&PRINT INDIVIDUAL BIR W2 FORM'
									do rptaxfrm &&TAX_FRM OF TAX_MAIN
								case m_main41=7 &&PRINT ALPHA LIST
									do rpalphal &&ALPHA LIST
								case m_main41=8 &&FORM 1604CF-SCHEDULE 7.3 "
                           do rpnalpha
								case m_main41=9 &&FORM 1604CF-SCHEDULE 7.1 "
                           do rpralpha
								otherwise
									exit
							endcase
						enddo
						f_endtone()
						restscreen(7,46,18,75,m_mscrn42)
						release m_mscrn42

					case m_main4=13 &&PREMIUM CERTIFICATION
						m_mscrn42=savescreen(9,38,15,75)
						f_drawbox(9,38,14,74,1,3)
						do while .t.
							f_clnmes()
							f_selkey()
							set colo to (m_cmen)
							@10,39 prom ' SSS PREMIUM PAYMENT CERTIFICATION '
							@11,39 prom ' MEDICARE PREM PYMNT CERTIFICATION '
							@12,39 prom ' PAG-IBIG PREM PYMNT CERTIFICATION '
							@13,39 prom ' ALL PREMIUMS PAYMNT CERTIFICATION '
							menu to m_main41
							do case
								case m_main41=1 &&SSS PREMIUM PAYMENT CERTIFICATION
									do rppremcr with 'SSS'
								case m_main41=2 &&MEDICARE PREM PYMNT CERTIFICATION
									do rppremcr with 'MED'
								case m_main41=3 &&PAG-IBIG PREM PYMNT CERTIFICATION
									do rppremcr with 'PBG'
								case m_main41=4 &&ALL PREMIUMS PAYMNT CERTIFICATION
									do rppremcr with 'ALL'
								otherwise
									exit
							endcase
						enddo
						f_endtone()
						restscreen(9,38,15,75,m_mscrn42)
						release m_mscrn42
					
					case m_main4=14
						do setprint

					otherwise
						exit

				endcase

			enddo
			f_endtone()
			restscreen(3,52,18,78,m_mscrn)
			release m_mscrn
	endcase
enddo
set color to
clear
return
