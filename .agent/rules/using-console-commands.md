# Terminal Encoding Rule

Before executing the very first command in the PowerShell terminal during a session, you MUST set the output encoding to UTF-8 to ensure Cyrillic characters are displayed correctly.

Protocol:

1. For the first terminal interaction, prepend the encoding command to your intended command using a semicolon.
2. Example: `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; <your_command>`
3. Do not ask for permission to do this; it is required for correct output reading.