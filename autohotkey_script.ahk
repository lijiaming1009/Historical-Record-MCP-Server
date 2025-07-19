#NoEnv
#Warn
SendMode Input
SetWorkingDir %A_ScriptDir%

; --- 快捷键: Ctrl + Enter ---
; 当您在任何输入框中按下 Ctrl+Enter 时，此脚本会触发。
^Enter::
    ; 1. 临时保存您当前的剪贴板内容，以免被覆盖。
    ClipSaved := ClipboardAll
    Clipboard := "" ; 清空剪贴板，准备接收新内容。

    ; 2. 模拟键盘操作，全选(Ctrl+A)并复制(Ctrl+C)当前输入框中的文本。
    Send, ^a
    Send, ^c
    ClipWait, 0.5 ; 等待0.5秒，确保复制操作已完成。

    ; 如果复制失败，则恢复剪贴板并退出。
    if ErrorLevel
    {
        MsgBox, 无法从输入框复制文本。
        Clipboard := ClipSaved
        return
    }

    ; 3. 将复制的消息内容存入变量，然后恢复您原来的剪贴板。
    message := Clipboard
    Clipboard := ClipSaved

    ; 4. 如果消息为空，就只发送一个普通的回车键，不执行记录。
    if (message = "")
    {
        Send, {Enter}
        return
    }

    ; 5. 在后台静默运行Python脚本来添加记录。
    ;    'Hide' 参数会隐藏命令行窗口，实现无感操作。
    Run, python client.py --add "%message%",, Hide

    ; 6. 最后，在聊天窗口发送一个普通的回车键来发送您的消息。
    Send, {Enter}
return
