Request URL
https://zfbrvgcsiykxbwikkqmp.supabase.co/rest/v1/inscripciones_retiro_misioneros
Request Method
POST
Status Code
401 Unauthorized
Remote Address
10.0.0.7:8080
Referrer Policy
strict-origin-when-cross-origin
:authority
zfbrvgcsiykxbwikkqmp.supabase.co
:method
POST
:path
/rest/v1/inscripciones_retiro_misioneros
:scheme
https
accept
*/*
accept-encoding
gzip, deflate, br, zstd
accept-language
es-ES,es;q=0.9
apikey
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmYnJ2Z2NzaXlreGJ3aWtrcW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MDg0NjEsImV4cCI6MjA4ODI4NDQ2MX0.B8367Tj53LfNMZYXLek9p56ntVyMvEm7fRME6ZKfC8U
authorization
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmYnJ2Z2NzaXlreGJ3aWtrcW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MDg0NjEsImV4cCI6MjA4ODI4NDQ2MX0.B8367Tj53LfNMZYXLek9p56ntVyMvEm7fRME6ZKfC8U
content-length
106
content-profile
public
content-type
application/json
origin
http://localhost:3000
priority
u=1, i
referer
http://localhost:3000/
sec-ch-ua
"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"
sec-ch-ua-mobile
?0
sec-ch-ua-platform
"Windows"
sec-fetch-dest
empty
sec-fetch-mode
cors
sec-fetch-site
cross-site
user-agent
Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36
x-client-info
supabase-ssr/0.9.0 createBrowserClient,
payload
{
    "retiro_id": "5366462c-9e68-4f8a-b036-c87c964016cf",
    "misionero_id": "da948683-122c-41b4-bed8-e7999be78d02"
}, respnse {
    "code": "42501",
    "details": null,
    "hint": null,
    "message": "new row violates row-level security policy for table \"inscripciones_retiro_misioneros\""
}