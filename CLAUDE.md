# vchatb — Claude Code instructions

## Security: environment files

**Never read, edit, or expose `.env` or other local environment files.**

- Do not use Read, Grep, Glob, or Bash/PowerShell to access `.env`, `.env.local`, or similar files
- Do not run `cat .env`, `type .env`, `Get-Content .env`, or grep against env files
- Do not paste secret values into chat, commits, or code

Use `.env.example` for variable names and structure only. If a value is needed, ask the user to set or confirm it — do not read `.env`.
