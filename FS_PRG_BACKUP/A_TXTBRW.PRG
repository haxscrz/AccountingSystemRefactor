/*
Program Code: a_txtbrw.prg
Program Name: Program Browsing Utility
Author: Sonny
Date: March 13, 2000
*/



#include "directry.ch"
#include "inkey.ch"

function f_a_txtbrw()
local files_, element, list, key
m_oldscreen:=savescreen(0,0,24,79)

   //  Load the files_ array with filenames
   //  found in current subdirectory.

   m_hit_return:=.f.

   filespec="*.txt"
   files_:={}
   aeval(directory("&tpath\*.txt"), { |f_| aadd(files_, f_[1]) } )

   ASORT(FILES_,1,len(files_))

   //  This will be our "element pointer".
   element := 1

   //  General browse setup.
   setcolor(m_cmen)
	f_drawbox(5,29,20,51,1,3)
   list := TBrowseNew(6, 30, 19, 50)
   //list:colorSpec:='w+/b'
   list:colorSpec:=m_cmen
   list:headSep:='мям'
   list:colSep :=' Ё '
   list:footSep:='мом'

   //  Assign the positioning blocks.
   list:goTopBlock    := { || element := 1 }
   list:goBottomBlock := { || element := len(files_) }
   list:skipBlock := { |n| ArraySkip(len(files_), @element, n) }

   //  Add a file name column object to the browse object.
   list:addColumn(TBColumnNew("TEXT FILE", ;
      { || padr(subs(files_[element],1,at('.',files_[element])-1), 12) } ))

   //  Display the window and process navigation keystrokes.
   while .t.
      m_hit_return:=.f.
      while ! list:stabilize()
      end while
      if ! BNavigate(list, inkey(0))
         exit
      endif
      if m_hit_return
         save screen to xxx
         clear
         m_file:=files_[element]
         f_browtext('&tpath\&m_file')
         rest screen from xxx
      endif
   end while
restscreen(0,0,24,79,m_oldscreen)
return nil


function f_browtext(filename)
   //  Load the contents of the specified file.
   textfile := memoread(filename)

   //  Determine how many lines are in the file.
   lastLine := mlcount(textfile)

   //  A pointer used to keep track of which line we're on.
   line := 1

   @ 0, 0 say "File: " +filename
   @ 1, 0 to 24, 79

   //  Create the browse object.
   txt := TBrowseNew(2, 1, 23, 78)
   //txt :colorSpec:='w+/b'
   txt :colorSpec:=m_cmen
   //  Add a column that displays a line of text.
   //txt:addColumn(TBColumnNew(, ;
   //   { || memoline(textfile, 254, line)} ))

   txt:addColumn(TBColumnNew(, ;
      { || subs(memoline(textfile, 254, line),1,78)} ))
   txt:addColumn(TBColumnNew(, ;
      { || subs(memoline(textfile, 254, line),51,78)} ))
   txt:addColumn(TBColumnNew(, ;
      { || subs(memoline(textfile, 254, line),101,78)} ))
   txt:addColumn(TBColumnNew(, ;
      { || subs(memoline(textfile, 254, line),151,78)} ))
   txt:addColumn(TBColumnNew(, ;
      { || subs(memoline(textfile, 254, line),201,78)} ))

   //  The data positioning blocks.
   txt:goTopBlock := { || line := 1 }
   txt:goBottomBlock := { || line := lastLine }
   txt:skipBlock := { |n| ArraySkip(lastLine, @line, n) }

   //  Display the window and process navigation keystrokes.
   while .t.
      while ! txt:stabilize()
      end while
      if ! BNavigate(txt, inkey(0))
         exit
      endif
   end while
return nil


function BNavigate(br, k)
/*
   Establish standard navigation keystrokes and the cursor movement
   method to associate with each key.

   This function gets passed a browse object and a potential
   navigation key. If the key is defined it's associated navigation
   message is sent to the browse.

   Function returns .t. if navigation was handled, .f. if not.
*/
local did := .t.

  if k == K_UP
    br:up()
  elseif k == K_DOWN
    br:down()
  elseif k == K_LEFT
    br:left()
  elseif k == K_RIGHT
    br:right()
  elseif k == K_PGUP
    br:pageUp()
  elseif k == K_PGDN
    br:pageDown()
  elseif k == K_CTRL_PGUP
    br:goTop()
  elseif k == K_CTRL_PGDN
    br:goBottom()
  elseif k == K_HOME
    br:home()
  elseif k == K_END
    br:end()
  elseif k == K_CTRL_HOME
    br:panHome()
  elseif k == K_CTRL_END
    br:panEnd()
  elseif k == K_TAB
    br:panRight()
  elseif k == K_SH_TAB
    br:panLeft()
  elseif k == K_ENTER
    m_hit_return:=.t.
  else
    did := .f.
  endif

return did

