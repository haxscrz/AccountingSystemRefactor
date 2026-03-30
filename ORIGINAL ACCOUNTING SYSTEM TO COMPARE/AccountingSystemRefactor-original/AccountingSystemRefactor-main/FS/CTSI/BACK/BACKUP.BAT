@echo off
cd back
pkzip -a %1 @acct.lst
cd..
