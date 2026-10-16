Set WshShell = CreateObject("WScript.Shell")
' 0 = Hide window completely
WshShell.Run "cmd /c """ & CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName) & "\start-system.bat""", 0, False
