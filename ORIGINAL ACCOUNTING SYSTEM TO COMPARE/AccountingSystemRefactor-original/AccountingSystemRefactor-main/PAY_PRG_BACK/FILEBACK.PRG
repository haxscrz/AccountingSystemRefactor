* Program Name : Payroll Timecard Initialization
* Program Code : Inittime.prg
* Description  : This program initializes the Timecard File
*              : for new payroll period.
* Author       : SVC
* Date Started : June 14, 1994
* Date Finished: June 15, 1994
***********************************************************

para m_new_year
m_old_col=setcolor()
do whil .t.
	m_prevscrn=savescreen(9,24,16,53)
	*confirm the week and month
	sele 1
	if .not. net_use('&dpath\sys_id',.t.,5)
		exit
	endi
	if .not. fil_lock(5)
		exit
	endi
	f_drawbox(9,25,15,53,1,3)
	set colo to (m_cnor)
	@10,28 say 'BACKUP  DATABASE  FILES'
	@11,26 to 11,52
	@12,28 say 'HALF  TO BACKUP.. :'
	@13,28 say 'MONTH TO BACKUP.. :'
	@14,28 say 'YEAR  TO BACKUP.. :'
	m_pay_type=subs(str(100+pay_type,3),2,2)
	m_pres_mo=subs(str(100+pres_mo,3),2,2)
	m_year=subs(str(year(end_date),4),3,2)
	*check if backup already exists, overwrite? if exist
	m_period=m_year+m_pres_mo+m_pay_type
	fname_mas='MA'+m_period+'.dbf'
	fname_his='HI'+m_period+'.dbf'
	fname_tim='TM'+m_period+'.dbf'
	fname_dep='DE'+m_period+'.dbf'
	fname_sys='SY'+m_period+'.dbf'
	fname_bre='BR'+m_period+'.dbf'
	fname_pmm='PM'+m_period+'.dbf'
	@12,48 say m_pay_type
	@13,48 say m_pres_mo
	@14,48 say m_year
	if .not. f_ask('Create a backup ?')
		exit
	endi
	if file('&bpath\&fname_tim')
		if .not. f_ask('Backup already created.  Overwrite ?')
			exit
		endi
	endi
	f_mess('Creating Backup.  Please wait...',.f.)
	repl needbackup with .f.
	use

	copy file &dpath\master.dbf to &bpath\&fname_mas
	copy file &dpath\history.dbf to &bpath\&fname_his
	copy file &dpath\tmcard.dbf to &bpath\&fname_tim
	copy file &dpath\dept.dbf to &bpath\&fname_dep
	copy file &dpath\sys_id.dbf to &bpath\&fname_sys
	copy file &dpath\break.dbf to &bpath\&fname_bre
	copy file &dpath\premmast.dbf to &bpath\&fname_pmm

	copy file &dpath\master.dbf to &b2path\&fname_mas
	copy file &dpath\history.dbf to &b2path\&fname_his
	copy file &dpath\tmcard.dbf to &b2path\&fname_tim
	copy file &dpath\dept.dbf to &b2path\&fname_dep
	copy file &dpath\sys_id.dbf to &b2path\&fname_sys
	copy file &dpath\break.dbf to &b2path\&fname_bre
	copy file &dpath\premmast.dbf to &b2path\&fname_pmm

	f_mess('Backup created completely. Press any key to continue...',.t.)

	exit

endd
restscreen(9,24,16,53,m_prevscrn)
clos all
set colo to (m_old_col)
retu
