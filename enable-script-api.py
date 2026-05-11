#!/usr/bin/env python3
import json, time
from pathlib import Path
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
TOKEN=Path.home()/'.hermes/google_token.json'
scopes=json.loads(TOKEN.read_text()).get('scopes')
creds=Credentials.from_authorized_user_file(str(TOKEN), scopes)
svc=build('serviceusage','v1',credentials=creds)
name='projects/306656112543/services/script.googleapis.com'
try:
    op=svc.services().enable(name=name, body={}).execute()
    print('enable_op', json.dumps(op, indent=2))
except HttpError as e:
    print('enable_error', e.content.decode())
    raise
# poll op if name present
opname=op.get('name')
if opname:
    ops=svc.operations()
    for i in range(30):
        res=ops.get(name=opname).execute()
        print('poll', i, res.get('done'))
        if res.get('done'): break
        time.sleep(2)
print('DONE')
