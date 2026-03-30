/*
Program Name : Accounting Program
Program Code : Acctng.PRG
Author...... : Sonny
Date Started : Feb 06, 2000
Date Finished:
*/

function f_acctmain()
* Initialize path variables
while .t.
   m_cmes:='b/n'
	if ! net_use('pathfile',.f.,5,.t.,'')
		exit
	endif
	dpath:=upper(alltrim(datapath))
	bpath:=upper(alltrim(backpath))
	tpath:=upper(alltrim(textpath))
   pcode:=m_company:=m_compcode:=''
	m_comp_addr:=comp_addr
	m_comp_zip:=alltrim(comp_zip)
	m_comp_tel:=alltrim(comp_tel)
	m_border:='…Õª∫ºÕ»∫'
   m_blindelay:=blindelay
	m_head:=''
   m_head1:=head1
   m_head2:=head2
   m_head3:=head3
   m_head4:=head4
   m_head5:=head5
   m_lastmonth:=lastmonth
   _m_helpon:=.f.
	// Initialize color variables
	do case
		case monitor='V'
			m_ched:=alltrim(c_ched)
			m_cini:=alltrim(c_cini)
			m_cbrg:=alltrim(c_cbrg)
			m_cnor:=alltrim(c_cnor)
			m_cerr:=alltrim(c_cerr)
			m_cmes:=alltrim(c_cmes)
			m_cmen:=alltrim(c_cmen)
			m_cget:=alltrim(c_cget)
			m_crev:=alltrim(c_crev)
			m_shad:=alltrim(c_shad)
			m_rshad:=alltrim(c_rshad)
			m_mscrn:=alltrim(c_mscrn)
			m_menbox:=alltrim(c_menbox)
			m_datbox:=alltrim(c_datbox)
		case monitor='W'
			m_ched:=alltrim(w_ched)
			m_cini:=alltrim(w_cini)
			m_cbrg:=alltrim(w_cbrg)
			m_cnor:=alltrim(w_cnor)
			m_cerr:=alltrim(w_cerr)
			m_cmes:=alltrim(w_cmes)
			m_cmen:=alltrim(w_cmen)
			m_cget:=alltrim(w_cget)
			m_crev:=alltrim(w_crev)
			m_shad:=alltrim(w_shad)
			m_rshad:=alltrim(w_rshad)
			m_mscrn:=alltrim(w_mscrn)
			m_menbox:=alltrim(w_menbox)
			m_datbox:=alltrim(w_datbox)
		otherwise  &&case monitor='B'
			m_ched:=alltrim(b_ched)
			m_cini:=alltrim(b_cini)
			m_cbrg:=alltrim(b_cbrg)
			m_cnor:=alltrim(b_cnor)
			m_cerr:=alltrim(b_cerr)
			m_cmes:=alltrim(b_cmes)
			m_cmen:=alltrim(b_cmen)
			m_cget:=alltrim(b_cget)
			m_crev:=alltrim(b_crev)
			m_shad:=alltrim(b_shad)
			m_rshad:=alltrim(b_rshad)
			m_mscrn:=alltrim(b_mscrn)
			m_menbox:=alltrim(b_menbox)
			m_datbox:=alltrim(b_datbox)
	endcase
   f_clirscrn()
	use
	// Set-up environment
	set wrap on
	set inte on
	set excl off
	set scor off
	set conf on
	set mess to 23 center
	set exac on
	set dele on
   set century on
	set key 28 to f_about()
	set key -9 to p_calendar
   set epoch to 1990
	setcolor(m_cini)
	clear
   squares()
   if ! f_password(10)
		exit
	endif
	// Draw main screen
	setcolor(m_mscrn)
	@1,0 to 1,79 doub
	@1,67 say ' F10-Calendar'
	@2,0 to 22,79
	setcolor(m_cnor)
	@23,0 clear to 23,79
	f_bcln()
	setcolor(m_ched)
	@0,0 say spac(80)
	@0,f_center(m_compcode+' ACCOUNTING SYSTEM',79) say m_compcode+' ACCOUNTING SYSTEM'
   @0, 1 say date()
   @0,63 say 'by ASCT V.110920'
	m_terminate:=.f.
	m_selected :=.f.
	keyboard chr(13)
	while .t.
      keyoff()
      f_bcln()
		f_clnmes()
		setcolor(m_cmen)
		f_selkey()
		@2,5  prom ' MAIN MENU ' mess 'Update Inventory Files, Data Entry, Post Transactions or EXIT to DOS.'
		@2,21 prom ' FILE MAINTENANCE ' mess 'Reindex corrupted files, Update master files.'
		@2,44 prom ' QUERY ' mess 'View Status, Transactions on the screen.'
		@2,56 prom ' REPORT GENERATION ' mess 'Generate a hard copy of reports.'
		menu to m_main
      keyon()
		do case
			case m_main=1    // Data entry, Processing
				p_mainmenu()
				if m_terminate
					exit
				endif
			case m_main=2    // File Maintenance
				p_filemain()
			case m_main=3    // Query
            p_quermenu()
			case m_main=4    // Report Generation
				p_reportgen()
		endcase
	end while
	exit
end while
setcolor(m_cnor)
blindclose(m_blindelay)
dbcloseall()
return nil


// Main Menu - Data Entry and File Processing
function p_mainmenu
static m_mscrn, m_main, m_scrn1, m_main2
m_mscrn:=savescreen(3,2,19,35)
f_drawmen(3,2,13,33,1)
while .t.
   keyon()
	f_clnmes()
	f_selkey()
	setcolor(m_cmen)
   @ 4, 3 prompt '   ENTER CASH DISBURSEMENT    ' mess 'Enter Cash Disbursement Voucher.'
   @ 5, 3 prompt '     ENTER CASH RECEIPTS      ' mess 'Enter Cash Receipts.'
   @ 6, 3 prompt '  ENTER SALES BOOK JOURNALS   ' mess 'Enter Sales Book Journals.'
   @ 7, 3 prompt '      JOURNAL VOUCHERS        ' mess 'Enter Journal Voucher.'
   @ 8, 3 prompt ' ENTER PURCHASE BOOK JOURNALS ' mess 'Enter Purchase Book Journals.'
   @ 9, 3 prompt '      ENTER ADJUSTMENTS       ' mess 'Enter Adjustments.'
   @10, 3 prompt '    POST ALL TRANSACTIONS     ' mess 'Post Transactions to Accont File.'
   @11, 3 prompt '      ENTER ADVANCE CDB       ' mess 'Enter CDB in Advance.'
 	@12, 3 prompt '    E X I T   TO   D O S      ' mess 'Go to DOS prompt.'
	menu to m_main
   keyoff()
	do case
		case m_main==1   //ENTER CASH DISBURSEMENT
         f_a_edtchk(1)
		case m_main==2   //ENTER CASH RECEIPTS
         f_a_edtjnl(1)
      case m_main==3   //ENTER SALES BOOK JOURNALS
         f_a_edtjnl(2)
      case m_main==4   //JOURNAL VOUCHERS
         f_a_edtjnl(3)
      case m_main==5   //ENTER PURCHASE BOOK JOURNALS
         f_a_edtjnl(4)
      case m_main==6   //ENTER ADJUSTMENTS
         f_a_edtjnl(5)
      case m_main==7   //TRANSACTION POSTING
         f_a_postng()
      case m_main==8   //ENTER ADVANCE CDB
         f_a_edtchk(2)
      case m_main==9  //EXIT TO DOS
			m_terminate:=.t.
			exit
		otherwise
			exit
	endcase

end while
restscreen(3,2,19,35,m_mscrn)
return nil


// File Maintenance
function p_filemain
static m_mscrn,m_main,m_fmscrn,m_main2
m_mscrn:=savescreen(3,17,14,46)
f_drawmen(3,17,11,44,1)

while .t.

   keyon()
	f_clnmes()
	f_selkey()
	setcolor(m_cmen)

	@ 4,18 prom ' REINDEX CORRUPTED FILES  ' mess 'Rebuild Corrupted Index Files of Databases.'
	@ 5,18 prom '  EDIT CHART OF ACCOUNTS  ' mess 'Maintain Chart of Accounts'
	@ 6,18 prom '     EDIT GROUP CODES     ' mess 'Maintain Balance Sheet Group Codes.'
	@ 7,18 prom '  EDIT SUBSIDIARY GROUPS  ' mess 'Maintain Subsidiary Groupings of Accounts.'
   @ 8,18 prom '     BACKUP DATABASES     ' mess 'Create Duplicate Copy of Databases.'
   @ 9,18 prom '   MONTH-END PROCESSING   ' mess 'Process the End of the Month Closing Balance.'
   @10,18 prom '   TRANSFER ADVANCE CDB   ' mess 'Transfer Advance CDB to current month.'
	menu to m_main
   keyoff()

	do case
		case m_main=1
			// REINDEX
			m_fmscrn:=savescreen(5,21,13,50)
			f_drawmen(5,21,9,48,1)
			while .t.
            keyon2()
				f_clnmes()
				f_selkey()
				@ 6,22 prom '  REINDEX ACCOUNTS FILE   ' mess 'Rebuild the Inventory Master Index Files.'
				@ 7,22 prom ' REINDEX TRANSACTION FILE ' mess 'Rebuild the Transaction Index Files.'
				@ 8,22 prom '    REINDEX ALL FILES     ' mess 'Rebuild All Index Files.'
				menu to m_main2
				do case
               case m_main2=1  //ACCOUNTS FILE
						f_reindex('&dpath\accounts','&dpath\accounts', 'acct_code')
						f_reindex('&dpath\banks',   '&dpath\banks',    'bank_no')
						f_reindex('&dpath\supplier','&dpath\supplier', 'sup_no')
					case m_main2=2  //TRANSACTION FILES
						f_reindex('&dpath\checkmas','&dpath\checkmas', 'j_jv_no')
						f_reindex('&dpath\checkmas','&dpath\checkma2', 'dtos(j_date)+j_jv_no')
						f_reindex('&dpath\checkmas','&dpath\checkma3', 'j_ck_no')
						f_reindex('&dpath\checkvou','&dpath\checkvou', 'j_ck_no')
						f_reindex('&dpath\checkvou','&dpath\checkvo2', 'acct_code+j_ck_no')
						f_reindex('&dpath\cashrcpt','&dpath\cashrcpt', 'dtos(j_date)')
						f_reindex('&dpath\salebook','&dpath\salebook', 'dtos(j_date)')
						f_reindex('&dpath\journals','&dpath\journals', 'dtos(j_date)')
						f_reindex('&dpath\purcbook','&dpath\purcbook', 'dtos(j_date)')
						f_reindex('&dpath\adjstmnt','&dpath\adjstmnt', 'dtos(j_date)')
						f_reindex('&dpath\pournals','&dpath\pournals', 'dtos(j_date)')
						f_reindex('&dpath\acheckma','&dpath\acheckma', 'j_jv_no')
						f_reindex('&dpath\acheckma','&dpath\acheckm2', 'dtos(j_date)+j_jv_no')
						f_reindex('&dpath\acheckma','&dpath\acheckm3', 'j_ck_no')
						f_reindex('&dpath\acheckvo','&dpath\acheckvo', 'j_ck_no')
						f_reindex('&dpath\acheckvo','&dpath\acheckv2', 'acct_code+j_ck_no')

               case m_main2=3  //ALL FILES
                  f_a_reindex()

					otherwise
						exit
				endcase
			end while

			restscreen(5,21,13,50,m_fmscrn)

      case m_main=2  //Edit Chart of Accounts
         f_a_edtcod(2)

      case m_main=3  //Effect
         f_a_edtcod(3)

      case m_main=4  //Schedule
         f_a_edtcod(4)

      case m_main=5  //Backup Databases
         f_a_backup()

      case m_main=6  //Month-end Processing
         f_a_mntend()

      case m_main=7  //Transfer Advance CDB
         f_xfercdb()

		otherwise
			exit

	endcase

end while
restscreen(3,17,14,46,m_mscrn)
return nil


// Query
function p_quermenu
static m_mscrn,m_main
m_mscrn:=savescreen(3,31,13,64)
f_drawmen(3,31,12,62,1)
while .t.
   keyon()
	f_clnmes()
	f_selkey()
	setcolor(m_cmen)
	@ 4,32 prompt '     VIEW SPOOLED FILE        ' mess 'Displays Spooled File on Screen.'
	@ 5,32 prompt '     CHARTS OF ACCOUNTS       ' mess 'Displays the Charts of Accounts.'
	@ 6,32 prompt ' CHECK DISBURSEMENT VOUCHERS  ' mess 'Displays the Check Disbursement Vouchers.'
	@ 7,32 prompt '  CASH RECEIPTS TRANSACTIONS  ' mess 'Print the Periodic Cash Receipts Transactions.'
	@ 8,32 prompt '     SALES BOOK JOURNALS      ' mess 'Print the Periodic Sales Book Journals.'
   @ 9,32 prompt '      JOURNAL VOUCHERS        ' mess 'Print the Periodic Journal Vouchers.'
   @10,32 prompt '   PURCHASE BOOK JOURNALS     ' mess 'Print the Periodic Purchase Book Journals.'
   @11,32 prompt '        ADJUSTMENTS           ' mess 'Print the Periodic Adjustments.'
	menu to m_main
   keyoff()
   do case
      case m_main==1
         f_a_txtbrw()
      case m_main==2
         f_a_queact(1)
      case m_main==3
         f_a_queact(2)
      case m_main==4
         f_a_queact(3)
      case m_main==5
         f_a_queact(4)
      case m_main==6
         f_a_queact(5)
      case m_main==7
         f_a_queact(6)
      case m_main==8
         f_a_queact(7)
      otherwise
         exit
   endcase
end while
//f_endtone()
restscreen(3,31,13,64,m_mscrn)
return nil


// Report Generation
function p_reportgen
static m_mscrn,m_main
m_mscrn:=savescreen(3,43,19,78)
f_drawmen(3,43,17,76,1)
while .t.
   keyon()
	f_clnmes()
	f_selkey()
	setcolor(m_cmen)
	@ 4,44 prom "   CASH DISBURSEMENT VOUCHER    " mess 'Print the Cash Disbursement Vouchers (Register).'
	@ 5,44 prom "   CASH DISBURSEMENT SUMMARY    " mess 'Print the Chronological Cash Disbursement Register Summary.'
	@ 6,44 prom " CASH DISBRSMNT SUMMARY BY CODE " mess 'Print the Periodic Cash Disbursement REgister Summary by Account Code.'
	@ 7,44 prom "   CASH RECEIPTS TRANSACTIONS   " mess 'Print the Periodic Cash Receipts Transactions.'
	@ 8,44 prom "      SALES BOOK JOURNALS       " mess 'Print the Periodic Sales Book Journals.'
   @ 9,44 prom "       JOURNAL VOUCHERS         " mess 'Print the Periodic Journal Vouchers.'
   @10,44 prom "    PURCHASE BOOK JOURNALS      " mess 'Print the Periodic Purchase Book Journals.'
   @11,44 prom "         ADJUSTMENTS            " mess 'Print the Periodic Adjustments.'
   @12,44 prom "    DETAILED TRIAL BALANCE      " mess 'Print the Detailed Trial Balance.'
   @13,44 prom "        TRIAL BALANCE           " mess 'Print the Trial Balance.'
   //@14,44 prom "        GENERAL LEDGER          " mess 'Print the General Ledger.'
   @14,44 prom "       INCOME STATEMENT         " mess 'Print the Income Statement.'
   @15,44 prom "        BALANCE SHEET           " mess 'Print the Balance Sheet.'
   @16,44 prom "         CODE FILES             " mess 'Print the Decodes Files.'
   menu to m_main

   keyoff()
   do case
		case m_main==1  // CASH DISBURSEMENT VOUCHER
         f_a_repvou()
		case m_main==2  // CASH DISBURSEMENT SUMMARY
         f_a_repvsm()
		case m_main==3  // CASH DISBRSMNT SUMMARY BY CODE
         f_a_repcds()
      case m_main==4  // CASH RECEIPTS TRANSACTIONS
         f_a_repjnl(1)
      case m_main==5  // SALES BOOK JOURNALS
         f_a_repjnl(2)
      case m_main==6  // JOURNAL VOUCHERS
         f_a_repjnl(3)
      case m_main==7  // PURCHASE BOOK JOURNALS
         f_a_repjnl(4)
      case m_main==8  // ADJUSTMENTS
         f_a_repjnl(5)
      case m_main==9  // DETAILED TRIAL BALANCE
         f_a_repdtb(1)
      case m_main==10 // TRIAL BALANCE
         f_a_repdtb(2)
      //case m_main==11 // GENERAL LEDGER
         //f_a_repgll()
      case m_main==11 // INCOME STATEMENT
         f_a_repist()
      case m_main==12 // BALANCE SHEET
         f_a_repbsh()
      case m_main==13 // CODE FILES
			// PRINT CODE FILES
			m_fmscrn:=savescreen(12,40,17,71)
			f_drawmen(12,40,16,69,1)
			while .t.
            keyon2()
				f_clnmes()
				f_selkey()
         	setcolor(m_cmen)
				@13,41 prom '     CHART OF ACCOUNTS      ' mess 'Print the Chart of Accounts File.'
				@14,41 prom '     ACCOUNTS GROUPING      ' mess 'Print the Groupings of Accounts.'
				@15,41 prom ' SUBSIDIARY SCHEDULE GROUPS ' mess 'Print the Subsidiary Schedules Group.'
				menu to m_main2

            keyoff()

				do case
               case m_main2=1  //ACCOUNTS.DBF
                  f_a_repcod(1)
					case m_main2=2  //EFFECTS.DBF
                  f_a_repcod(2)
               case m_main2=3  //SCHEDULE.DBF
                  f_a_repcod(3)
					otherwise
						exit
				endcase
			end while

			restscreen(12,40,17,71,m_fmscrn)

		otherwise
			exit

	endcase

end while

restscreen(3,43,19,78,m_mscrn)
return nil


function f_a_reindex()
f_reindex('&dpath\accounts','&dpath\accounts', 'acct_code')
f_reindex('&dpath\banks',   '&dpath\banks',    'bank_no')
f_reindex('&dpath\supplier','&dpath\supplier', 'sup_no')
f_reindex('&dpath\checkmas','&dpath\checkmas', 'j_jv_no')
f_reindex('&dpath\checkmas','&dpath\checkma2', 'dtos(j_date)+j_jv_no')
f_reindex('&dpath\checkmas','&dpath\checkma3', 'j_ck_no')
f_reindex('&dpath\checkvou','&dpath\checkvou', 'j_ck_no')
f_reindex('&dpath\checkvou','&dpath\checkvo2', 'acct_code+j_ck_no')
f_reindex('&dpath\cashrcpt','&dpath\cashrcpt', 'dtos(j_date)')
f_reindex('&dpath\salebook','&dpath\salebook', 'dtos(j_date)')
f_reindex('&dpath\journals','&dpath\journals', 'dtos(j_date)')
f_reindex('&dpath\purcbook','&dpath\purcbook', 'dtos(j_date)')
f_reindex('&dpath\adjstmnt','&dpath\adjstmnt', 'dtos(j_date)')
f_reindex('&dpath\pournals','&dpath\pournals', 'dtos(j_date)')
f_reindex('&dpath\pournals','&dpath\pournal2', 'acct_code+dtos(j_date)')
f_reindex('&dpath\effects' ,'&dpath\effects' , 'gl_report+gl_effect')
f_reindex('&dpath\schedule','&dpath\schedule', 'gl_head+acct_code')
f_reindex('&dpath\acheckma','&dpath\acheckma', 'j_jv_no')
f_reindex('&dpath\acheckma','&dpath\acheckm2', 'dtos(j_date)+j_jv_no')
f_reindex('&dpath\acheckma','&dpath\acheckm3', 'j_ck_no')
f_reindex('&dpath\acheckvo','&dpath\acheckvo', 'j_ck_no')
f_reindex('&dpath\acheckvo','&dpath\acheckv2', 'acct_code+j_ck_no')
return nil
