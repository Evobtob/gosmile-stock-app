#!/usr/bin/env python3
import json, sys
from pathlib import Path
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
sid=sys.argv[1]
TOKEN=Path.home()/'.hermes/google_token.json'
scopes=json.loads(TOKEN.read_text()).get('scopes')
creds=Credentials.from_authorized_user_file(str(TOKEN), scopes)
svc=build('script','v1',credentials=creds)
try:
    r=svc.scripts().run(scriptId=sid, body={'function':'readComponents'}).execute()
    print(json.dumps(r, indent=2)[:5000])
except HttpError as e:
    print(e.content.decode())
