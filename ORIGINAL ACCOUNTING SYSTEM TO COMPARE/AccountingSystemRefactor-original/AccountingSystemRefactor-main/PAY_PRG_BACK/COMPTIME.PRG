* Program Code : Comptime.prg
* Description  : This program computes the payroll.
* Author       : SVC
* Date Started : June 10, 1994
* Date Finished: June 10, 1994
***************************************************

m_old_col=setcolor()
do whil .t.
	m_prevscrn=savescreen(8,3,16,76)
	f_setting()
	sele 1
	if .not. net_use('&dpath\tmcard',.f.,5)
		exit
	endi
	set inde to &dpath\tbyemp
	if recc()=0
		f_err('NO Timecard to Compute !',.t.)
		exit
	endi
	if .not. fil_lock(5)
		exit
	endi
	sele 2
	if .not. net_use('&dpath\master',.f.,5)
		exit
	endi
	set inde to &dpath\mbyemp
	sele 3
	if .not. net_use('&dpath\sys_id',.f.,5)
		exit
	endi
	if trn_ctr=trn_upd
		f_err('Cannot Compute, Timecard already Posted. Check System-ID file.',.t.)
		exit
	endi

   if pres_mo = 12
      sYear = year(beg_date)
   else
      sYear = year(end_date)
   endif

   if sYear <= 2019
      sRate = 0.0275
      sCeiling = 50000

   elseif sYear = 2020
      sRate = 0.03
      sCeiling = 60000

   elseif sYear = 2021
      sRate = 0.03
      sCeiling = 60000

/*
   elseif sYear = 2022
      sRate = 0.035
      sCeiling = 70000
*/

   elseif sYear = 2022
      sRate = 0.04
      sCeiling = 80000

   elseif sYear = 2023
      sRate = 0.04
      sCeiling = 80000

   elseif sYear = 2024
      sRate = 0.045
      sCeiling = 90000

   else
      sRate = 0.05
      sCeiling = 100000
*/

   endif

   if f_ask('Deduct TAX from Casual Employees ?')
      m_dedtax_casl = .t.
   else
      m_dedtax_casl = .f.
   endif

	m_hdmf_pre=hdmf_pre
	m_pg_lower=pg_lower
	m_pg_higher=pg_higher
	m_pg_lwper=pg_lwper
	m_pg_hiper=pg_hiper
	m_bon_days=bon_days
	m_bon_mont=bon_mont
	sele 4
	if .not. net_use('&opath\taxtab',.f.,5)
		exit
	endi
	set inde to &opath\tax
	sele tmcard
	m_recc=recc()
	go top
	m_m_gross=0
	m_m_basic=0
	m_m_ssee=0
	m_m_sser=0
	m_m_medee=0
	m_m_meder=0
	m_m_ecer=0
	m_m_pgee=0
	m_m_pger=0
	m_emp_no='      '
	m_emp_nm=spac(32)
	m_dep_no=spac(2)
	m_status=spac(3)
	m_pgbg_member=.f.
	m_sss_member=.t.
	m_withbonus=.f.
	stor 0 to m_reg_hrs, m_abs_hrs, m_rot_hrs, m_sphp_hrs, m_spot_hrs,;
		m_lghp_hrs, m_lgot_hrs, m_oth_pay1, m_oth_pay2, m_oth_pay3, m_lv_hrs,;
		m_ls_hrs, m_sln_ded, m_hdmf_ded, m_oth_ded2, m_oth_ded3,;
		m_oth_ded4, m_oth_ded5, m_oth_ded6, m_oth_ded7, m_oth_ded8, m_oth_ded9,;
		m_oth_ded0, m_rate, m_tax_ded, m_nsd_pay, m_nsd_hrs,;
		m_cal_ded, m_comp_ded, m_comd_ded, m_oth_pay4, m_bonus, m_bonustax
	stor 0 to m_reg_pay, m_rot_pay, m_sphp_pay, m_spot_pay, m_lghp_pay,;
		m_lgot_pay, m_lv_pay, m_lv2_pay, m_ls_pay, m_grs_pay, m_net_pay,;
		m_abs_ded, m_tot_ded, m_sss_de, m_sss_dr, m_med_de, m_med_dr,;
		m_pgbg_ee, m_pgbg_er, m_ec_dr, m_tax_ee
	m_emp_stat= "R"
	f_drawbox(8,3,15,76,5,3)
	set colo to (m_cnor)
	*	@ 9,22 say 'Processing Record      out of '+tran(m_recc,'9999')
	*	@11, 6 say 'Computing the Salary of Emp#      -'
	*	@10,22 to 10,55
	*	@12, 6 to 12,73
	*                    22                40          52
	*                    Processing Record 1234 out of 1234
	*							----------------------------------
	*    Computing the Salary of Emp# 1234 - 12345678901234567890123456789012
	*	  --------------------------------------------------------------------
	*    6                            35     42
	*             ..................................................
	*             0%          25%         50%          75%      100%
	*
	*    Computing the Salary of Emp# 1234 - 12345678901234567890123456789012
	*    --------------------------------------------------------------------
	@10,15 say repl('.',50)
	@11,15 say '0%          25%         50%          75%      100%'
	@13, 6 say 'Computing the Salary of Emp#      -'
	@14, 6 to 14,73
	m_ctr=0
	do whil .not. eof()
		m_ctr=m_ctr+1
		@ 9,15 say repl(chr(219),int(round(m_ctr/m_recc*50,0)))
		@13,35 say emp_no
		@13,42 say emp_nm
		if trn_flag$'Uu'
			skip
			loop
		endif
		m_emp_no=emp_no
		m_emp_nm=emp_nm
		m_dep_no=dep_no
		m_reg_hrs=reg_hrs
		m_abs_hrs=abs_hrs
		m_rot_hrs=rot_hrs
		m_sphp_hrs=sphp_hrs
		m_spot_hrs=spot_hrs
		m_lghp_hrs=lghp_hrs
		m_lgot_hrs=lgot_hrs
		m_oth_pay1=oth_pay1
		m_oth_pay2=oth_pay2
		m_oth_pay3=oth_pay3
		m_oth_pay4=oth_pay4
		m_lv_hrs=lv_hrs
		m_ls_hrs=ls_hrs
		m_oth_ded1=oth_ded1
		m_oth_ded2=oth_ded2
		m_oth_ded3=oth_ded3
		m_oth_ded4=oth_ded4
		m_oth_ded5=oth_ded5
		m_oth_ded6=oth_ded6
		m_oth_ded7=oth_ded7
		m_oth_ded8=oth_ded8
		m_oth_ded9=oth_ded9
		m_oth_ded0=oth_ded10
		m_pgbg_ee=pgbg_ee
		m_pgbg_er=pgbg_er
		m_nsd_hrs=nsd_hrs
		m_sln_ded=sln_ded
		m_hdmf_ded=hdmf_ded
		m_cal_ded=cal_ded
		m_comp_ded=comp_ded
		m_comd_ded=comd_ded
		m_withbonuss=withbonus
		sele master
		seek m_emp_no
		if eof()
			f_err('Employee #'+m_emp_no+' not in Master file.  Please check.',.t.)
			sele tmcard
			skip
			loop
		endi
      m_emp_stat = emp_stat
		m_rate=b_rate
		m_m_gross=m_gross
		m_m_ssee=m_ssee
		m_m_sser=m_sser
		m_m_medee=m_medee
		m_m_meder=m_meder
		m_m_pgee=m_pgee
		m_m_pger=m_pger
		m_m_ecer=m_ecer
		m_m_othp1=m_othp1
		m_m_othp2=m_othp2
		m_m_othp3=m_othp3
		m_m_othp4=m_othp4
		m_m_leave=m_leave
		m_y_basic=y_basic
		m_status=status
		m_m_basic=m_basic
		m_pgbg_member=pgbg
		m_sss_member=sss_member
		m_emp_stat=emp_stat
		sele tmcard
		* This routine computes the gross income
		* hourly rate
		m_hrate = (m_rate/8)
		if m_daily_wage
			m_hrate = (m_rate/8)
			* regular pay (basic payxhrs worked)
			m_reg_pay  = round(m_reg_hrs*m_hrate,2)
		else
			m_hrate = (m_rate/240)
			* regular pay (basic payxhrs worked)
			m_reg_pay  = round((m_rate/2)-(m_abs_hrs*m_hrate),2)
		endif
		* reg. ot pay
		m_rot_pay  = round(m_rot_hrs*m_hrate*m_reot_r,2)
		* sp.hol.pay
		m_sphp_pay = round(m_sphp_hrs*m_hrate*m_sphp_r,2)
		* sp.hol.ot.pay
		m_spot_pay = round(m_spot_hrs*m_hrate*m_spot_r,2)
		* lg.hol. pay
		m_lghp_pay = round(m_lghp_hrs*m_hrate*m_lghp_r,2)
		* lg.hol.ot.pay
		m_lgot_pay = round(m_lgot_hrs*m_hrate*m_lgot_r,2)
		* nsd pay
		m_nsd_pay = round(m_nsd_hrs*m_hrate*m_nsd_r,2)
		if m_lv_hrs>10
			m_lv_pay = round((10*8*m_hrate),2)
			m_lv2_pay= round(((m_lv_hrs-10)*8*m_hrate),2)
		else
			m_lv_pay = round((m_lv_hrs*8*m_hrate),2)
			m_lv2_pay = 0
		endi
		m_ls_pay = round(((m_ls_hrs*8)*m_hrate),2)
		* plus other pay
		m_oth_pay1=oth_pay1
		m_oth_pay2=oth_pay2   &&(non-taxable)
		m_oth_pay3=oth_pay3
		m_oth_pay4=oth_pay4   &&(non-taxable)
		* gross pay
		m_grs_pay=round(m_reg_pay+m_rot_pay+m_sphp_pay+m_spot_pay+m_lghp_pay+;
			m_lgot_pay+m_lv_pay+m_lv2_pay+m_ls_pay+m_oth_pay1+m_oth_pay2+;
			m_oth_pay3+m_oth_pay4+m_nsd_pay,2)

		* This routine computes the sss premium, medicare and the tax
		m_sss_de = 0
		m_sss_dr = 0
		m_med_de = 0
		m_med_dr = 0
		m_ec_dr  = 0
		m_pgbg_ee= 0
		m_pgbg_er= 0


      //if  m_status!=space(3)

   	m_nontax=(m_oth_pay2+m_oth_pay4)+m_m_othp2+m_m_othp4   &&+m_lv_pay+m_m_leave &&(non-taxable)

      //AS PER MRS.BATAN 02/16/2016
      //m_grs=m_m_gross+m_grs_pay-m_nontax
   	m_grs=m_m_basic + m_reg_pay

   	m_pgregpay=m_reg_pay+m_oth_pay1

   	m_pgbg_ee=0
   	m_pgbg_er=0

      if m_pgbg_member

         // As per Tess 08-09-2001
   		//m_pgmonpay=m_m_basic+m_reg_pay+m_m_othp1+m_oth_pay1
         //AS PER MRS.BATAN 02/16/2016
   		//m_pgmonpay=m_m_gross+m_grs_pay

   		m_pgmonpay=m_m_basic + m_reg_pay

   		if m_pgbg_member .and. m_pgregpay > 0
   			if m_pgmonpay <= m_pg_lower
   				m_pgbg_ee=round(m_pgmonpay*m_pg_lwper-m_m_pgee,2)
   				m_pgbg_er=round(m_pgmonpay*m_pg_hiper-m_m_pger,2)
   			else
   				if m_pgmonpay > m_pg_higher
   					m_pgbg_ee=round(m_pg_higher*m_pg_hiper-m_m_pgee,2)
   					m_pgbg_er=round(m_pg_higher*m_pg_hiper-m_m_pger,2)
   				else
   					m_pgbg_ee=round(m_pgmonpay*m_pg_hiper-m_m_pgee,2)
   					m_pgbg_er=round(m_pgmonpay*m_pg_hiper-m_m_pger,2)
   				endif
	   		endif
         endif
      endif


		m_sss_de = 0
		m_sss_dr = 0
		m_ec_dr  = 0
	   m_med_de = 0
	   m_med_dr = 0

      if m_sss_member

   		* Compute SSS, Medicare and Employer's Contribution
   		do case
   			case .not. m_sss_member
   				m_sss_de = 0
   				m_sss_dr = 0
   				m_ec_dr  = 0
   			case (m_grs_pay-m_oth_pay2-m_oth_pay4)<=0 .or. m_grs<=0
   				m_sss_de = 0
   				m_sss_dr = 0
   				m_ec_dr  = 0
   				m_oth_ded1=0
   				m_oth_ded2=0
   				m_oth_ded3=0
   				m_oth_ded4=0
   				m_oth_ded5=0
   				m_oth_ded6=0
   				m_oth_ded7=0
   				m_oth_ded8=0
   				m_oth_ded9=0
   				m_oth_ded0=0
   				m_sln_ded=0
   				m_cal_ded=0
   				m_hdmf_ded=0
   				m_comp_ded=0
   				m_comd_ded=0

   	   	//case m_grs < 1000
      		//	m_sss_de =  0.00
      		//	m_sss_dr =  0.00
      		//	m_ec_dr  =  0.00

            //case m_grs < 1250
            //	m_sss_de =  36.30 - m_m_ssee
            //	m_sss_dr =  73.70 - m_m_sser
            //	m_ec_dr  =  10.00 - m_m_ecer

            //case m_grs < 1750
            //	m_sss_de =  54.50 - m_m_ssee
            //	m_sss_dr = 110.50 - m_m_sser
            //	m_ec_dr  =  10.00 - m_m_ecer

            case m_grs < 4250
            	m_sss_de = 180.00 - m_m_ssee
            	m_sss_dr = 380.00 - m_m_sser
            	m_ec_dr  =  10 - m_m_ecer

            case m_grs < 4750
            	m_sss_de = 202.50 - m_m_ssee
            	m_sss_dr = 427.50 - m_m_sser
            	m_ec_dr  =  10 - m_m_ecer

            case m_grs < 5250
            	m_sss_de = 225.00 - m_m_ssee
            	m_sss_dr = 475.00 - m_m_sser
            	m_ec_dr  =  10 - m_m_ecer

            case m_grs < 5750
            	m_sss_de = 247.50 - m_m_ssee
            	m_sss_dr = 522.50 - m_m_sser
            	m_ec_dr  =  10 - m_m_ecer

            case m_grs < 6250
            	m_sss_de = 270.00 - m_m_ssee
            	m_sss_dr = 570.00 - m_m_sser
            	m_ec_dr  =  10 - m_m_ecer

            case m_grs < 6750
            	m_sss_de = 292.50 - m_m_ssee
            	m_sss_dr = 617.50 - m_m_sser
            	m_ec_dr  =  10 - m_m_ecer

            case m_grs < 7250
            	m_sss_de = 315.00 - m_m_ssee
            	m_sss_dr = 665.00 - m_m_sser
            	m_ec_dr  =  10 - m_m_ecer

            case m_grs < 7750
            	m_sss_de = 337.50 - m_m_ssee
            	m_sss_dr = 712.50 - m_m_sser
            	m_ec_dr  =  10 - m_m_ecer

            case m_grs < 8250
            	m_sss_de = 360.00 - m_m_ssee
            	m_sss_dr = 760.00 - m_m_sser
            	m_ec_dr  =  10 - m_m_ecer

            case m_grs < 8750
            	m_sss_de = 382.50 - m_m_ssee
            	m_sss_dr = 807.50 - m_m_sser
            	m_ec_dr  =  10 - m_m_ecer

            case m_grs < 9250
            	m_sss_de = 405.00 - m_m_ssee
            	m_sss_dr = 855.00 - m_m_sser
            	m_ec_dr  =  10 - m_m_ecer

            case m_grs < 9750
            	m_sss_de = 427.50 - m_m_ssee
            	m_sss_dr = 902.50 - m_m_sser
            	m_ec_dr  =  10 - m_m_ecer

            case m_grs < 10250
            	m_sss_de = 450.00 - m_m_ssee
            	m_sss_dr = 950.00 - m_m_sser
            	m_ec_dr  =  10 - m_m_ecer

            case m_grs < 10750
            	m_sss_de = 472.50 - m_m_ssee
            	m_sss_dr = 997.50 - m_m_sser
            	m_ec_dr  =  10 - m_m_ecer

            case m_grs < 11250
            	m_sss_de = 495.00 - m_m_ssee
            	m_sss_dr = 1045.00 - m_m_sser
            	m_ec_dr  =  10 - m_m_ecer

            case m_grs < 11750
            	m_sss_de = 517.50 - m_m_ssee
            	m_sss_dr = 1092.50 - m_m_sser
            	m_ec_dr  =  10 - m_m_ecer

            case m_grs < 12250
            	m_sss_de = 540.00 - m_m_ssee
            	m_sss_dr = 1140.00 - m_m_sser
            	m_ec_dr  =  10 - m_m_ecer

            case m_grs < 12750
            	m_sss_de = 562.50 - m_m_ssee
            	m_sss_dr = 1187.50 - m_m_sser
            	m_ec_dr  =  10 - m_m_ecer

            case m_grs < 13250
            	m_sss_de = 585.00 - m_m_ssee
               m_sss_dr = 1235.00 - m_m_sser
            	m_ec_dr  = 10     - m_m_ecer

            case m_grs < 13750
            	m_sss_de = 607.50 - m_m_ssee
               m_sss_dr = 1282.50 - m_m_sser
            	m_ec_dr  = 10     - m_m_ecer

            case m_grs < 14250
            	m_sss_de = 630.00 - m_m_ssee
               m_sss_dr = 1330.00 - m_m_sser
            	m_ec_dr  = 10     - m_m_ecer

            case m_grs < 14750
            	m_sss_de = 652.50 - m_m_ssee
               m_sss_dr = 1337.50 - m_m_sser
            	m_ec_dr  = 10     - m_m_ecer

            case m_grs < 15250
            	m_sss_de = 675.00 - m_m_ssee
               m_sss_dr = 1425.00 - m_m_sser
            	m_ec_dr  = 30     - m_m_ecer

            case m_grs < 15750
            	m_sss_de = 697.50 - m_m_ssee
               m_sss_dr = 1472.50 - m_m_sser
            	m_ec_dr  = 30     - m_m_ecer

            case m_grs < 16250
            	m_sss_de = 720.00 - m_m_ssee
               m_sss_dr = 1520.00 - m_m_sser
            	m_ec_dr  = 30  - m_m_ecer

            case m_grs < 16750
            	m_sss_de = 742.50 - m_m_ssee
               m_sss_dr = 1567.50 - m_m_sser
            	m_ec_dr  = 30  - m_m_ecer

            case m_grs < 17250
            	m_sss_de = 765.00 - m_m_ssee
               m_sss_dr = 1615.00 - m_m_sser
            	m_ec_dr  = 30  - m_m_ecer

            case m_grs < 17750
            	m_sss_de = 787.50 - m_m_ssee
               m_sss_dr = 1662.50 - m_m_sser
            	m_ec_dr  = 30  - m_m_ecer

            case m_grs < 18250
            	m_sss_de = 810.00 - m_m_ssee
               m_sss_dr = 1710.00 - m_m_sser
            	m_ec_dr  = 30  - m_m_ecer

            case m_grs < 18750
            	m_sss_de = 832.50 - m_m_ssee
               m_sss_dr = 1757.50 - m_m_sser
            	m_ec_dr  = 30  - m_m_ecer

            case m_grs < 19250
            	m_sss_de = 855.00 - m_m_ssee
               m_sss_dr = 1805.00 - m_m_sser
            	m_ec_dr  = 30  - m_m_ecer

            case m_grs < 19750
            	m_sss_de = 877.50 - m_m_ssee
               m_sss_dr = 1852.50 - m_m_sser
            	m_ec_dr  = 30  - m_m_ecer

            otherwise
            	m_sss_de = 900.00 - m_m_ssee
               m_sss_dr = 1900 - m_m_sser
            	m_ec_dr  = 30  - m_m_ecer

   		endcase

         //PHILHEALTH
         /*
   	   do case

       	   case (m_grs_pay - m_oth_pay2 -m_oth_pay4)<= 0 .or. m_grs = 0
	            m_med_de = 0

         	case m_grs <= 10000
         	   m_med_de = 137.50 - m_m_medee

         	case m_grs <= 40000
         	   m_med_de = round((m_grs * 0.0275)/2, 2) - m_m_medee

            otherwise
         		m_med_de = 550.00 - m_m_medee

         endcase

	      m_med_dr = m_med_de
         */

   	   do case

       	   case (m_grs_pay - m_oth_pay2 -m_oth_pay4)<= 0 .or. m_grs = 0
	            m_med_de = 0

         	case m_grs < 10000
         	   m_med_de = round((10000 * sRate)/2, 2) - m_m_medee

         	case m_grs < sCeiling
         	   m_med_de = round((m_grs * sRate)/2, 2) - m_m_medee

            otherwise
         		m_med_de = round((sCeiling * sRate)/2, 2) - m_m_medee

         endcase

	      m_med_dr = m_med_de

      endif

		* Compute Tax

      /*
		if m_status <> spac(3)

   		m_grs_p1 = m_grs_pay-m_oth_pay2-m_oth_pay4-m_lv_pay-m_sss_de-m_med_de-m_pgbg_ee

			if m_grs_p1 <= 0
				m_tax_ded = 0
			else
				select taxtab
				*set filter to exemption = m_status
				seek m_status
				if .not. eof()
					m_peso=peso
					m_percent=percent
					m_salary=salary
					do while m_grs_p1 > salary .and. m_status=exemption.and. .not. eof()
						if m_grs_p1 >= salary
							m_peso=peso
							m_percent=percent
							m_salary=salary
						endif
						skip
					enddo
					if m_salary = -1
						m_tax_ded=0
					else
						m_tax_ded = m_peso + ((m_grs_p1-m_salary)*(val(m_percent)/100))
					endif
				endif
			endif
			m_tax_ded = round(m_tax_ded,2)
		else
			m_tax_ded = 0
		endif
      */

   	m_grs_p1 = m_grs_pay-m_oth_pay2-m_oth_pay4-m_lv_pay-m_sss_de-m_med_de-m_pgbg_ee

      //Weekly

      /*

		if m_grs_p1 <= 0
			m_tax_ded = 0
		else
         if m_grs_p1 <= 4808
            m_peso = 0
            m_percent = 0
   			m_salary = 0

         elseif m_grs_p1 < 7692
            m_peso = 0
            m_percent = 0.2
   			m_salary = 4808

         elseif m_grs_p1 < 15385
            m_peso = 576.92
            m_percent = 0.25
   			m_salary = 7692

         elseif m_grs_p1 < 38462
            m_peso =2500
            m_percent = 0.3
   			m_salary = 15385

         elseif m_grs_p1 < 153846
            m_peso =9423.08
            m_percent = 0.32
   			m_salary = 38462

         else
            m_peso =46346.15
            m_percent = 0.35
            m_salary = 153846

         endif

	   	m_tax_ded = m_peso + ((m_grs_p1-m_salary)*(m_percent))

		   m_tax_ded = round(m_tax_ded,2)

      endif

      */


      //Semi Monthly

		if m_grs_p1 <= 0
			m_tax_ded = 0
		else
         if m_grs_p1 <= 10417
            m_peso = 0
            m_percent = 0
   			m_salary = 0

         elseif m_grs_p1 < 16667
            m_peso = 0
            m_percent = 0.2
   			m_salary = 10417

         elseif m_grs_p1 < 33333
            m_peso = 1250
            m_percent = 0.25
   			m_salary = 16667

         elseif m_grs_p1 < 83333
            m_peso =5416.67
            m_percent = 0.3
   			m_salary = 33333

         elseif m_grs_p1 < 333333
            m_peso =20416.67
            m_percent = 0.32
   			m_salary = 83333

         else
            m_peso =100416.67
            m_percent = 0.35
            m_salary = 333333

         endif

	   	m_tax_ded = m_peso + ((m_grs_p1-m_salary)*(m_percent))

		   m_tax_ded = round(m_tax_ded,2)

      endif


      if m_emp_stat ="C"
         if .NOT. m_dedtax_casl
            m_tax_ded = 0
         endif
      endif

		m_tot_ded=m_sln_ded+m_hdmf_ded+m_sss_de+m_med_de+m_pgbg_ee+m_tax_ded;
			+m_oth_ded1+m_oth_ded2+m_oth_ded3+m_oth_ded4+m_oth_ded5;
			+m_oth_ded6+m_oth_ded7+m_oth_ded8+m_oth_ded9+m_oth_ded0;
			+m_comp_ded+m_comd_ded+m_cal_ded
		m_bonus=0
		m_bonustax=0
		if m_withbonus
			***
			if m_emp_stat='C' .or. m_emp_stat=' '
				m_bon_net=(m_y_basic+m_reg_pay)/12
			else
				if m_daily_wage
					m_bon_net=m_rate*m_bon_days
				else
					m_bon_net=m_rate*m_bon_mont
				endif
			endif
			m_btax=0
			if m_bon_net>m_tax_bon

				m_taxable= (m_bon_net-m_tax_bon)

            /*
				m_taxable=(m_bon_net-m_tax_bon)/2  &&divide by 2 bec.tax table is semi-monthly
		   	if subs(m_status,1,3) <> space(3)
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
		               m_btax=0
		            else
		               m_btax=(m_peso+((m_taxable-m_salary)*(val(m_percent)/100)))*2
		            endif
					else
						f_err('Please check tax status of '+m_emp_no+' '+m_emp_nm,.t.)
		         endi
				else
					f_err('Please check tax status of '+m_emp_no+' '+m_emp_nm,.t.)
				endif
            */


            //Monthly

		      if m_taxable <= 0
      			m_btax = 0
      		else
               if m_taxable <= 20833
                  m_peso = 0
                  m_percent = 0
         			m_salary =  0

               elseif m_taxable < 33333
                  m_peso = 0
                  m_percent = 0.2
         			m_salary =  20833

               elseif m_taxable < 66667
                  m_peso = 2500
                  m_percent = 0.25
         			m_salary =  33333

               elseif m_taxable < 166667
                  m_peso =10833.33
                  m_percent = 0.3
         			m_salary =  66667

               elseif m_taxable < 666667
                  m_peso =40833.33
                  m_percent = 0.32
         			m_salary = 166667

               else
                  m_peso =200833.33
                  m_percent = 0.35
                  m_salary = 666667

               endif

      	   	m_btax = m_peso + ((m_taxable-m_salary)*m_percent)

		         m_btax = round(m_btax,2)

            endif

				select tmcard

			endif
			m_bonus   :=m_bon_net
			m_bonustax:=m_btax
			//m_grs_pay += m_bon_net
			m_tot_ded += m_btax
			***
		endif
		sele tmcard
      repl reg_pay with m_reg_pay, rot_pay with m_rot_pay,;
			sphp_pay with m_sphp_pay, spot_pay with m_spot_pay,;
			lghp_pay with m_lghp_pay, lgot_pay with m_lgot_pay,;
			lv_pay with m_lv_pay, lv2_pay with m_lv2_pay,;
			ls_pay with m_ls_pay, grs_pay with m_grs_pay,;
			net_pay with m_grs_pay-m_tot_ded, abs_ded with m_abs_ded,;
			tot_ded with m_tot_ded, sss_ee with m_sss_de, sss_er with m_sss_dr,;
			med_ee with m_med_de, med_er with m_med_dr, pgbg_ee with m_pgbg_ee,;
			pgbg_er with m_pgbg_er,;
			ec_er with m_ec_dr, tax_ee with m_tax_ded, trn_flag with 'P',;
			nsd_pay with m_nsd_pay, bonus with m_bonus, bonustax with m_bonustax

		skip
	endd
	sele sys_id
	if fil_lock(5)
		repl trn_prc with m_ctr
	endi
	@ 9,15 say repl(chr(219),50)
	f_mess('Computation Completed...',.f.)
	inke(0)
	restscreen(8,3,16,76,m_prevscrn)
	exit
endd
clos all
retu
