#!/usr/bin/env python3
import json
from pathlib import Path
from google_auth_oauthlib.flow import Flow
HOME=Path.home()/'.hermes'; CLIENT=HOME/'google_client_secret.json'; PENDING=HOME/'google_apps_script_oauth_pending.json'; REDIRECT='http://localhost:1'
SCOPES=[
 'https://www.googleapis.com/auth/cloud-platform',
 'https://www.googleapis.com/auth/drive',
 'https://www.googleapis.com/auth/drive.readonly',
 'https://www.googleapis.com/auth/documents.readonly',
 'https://www.googleapis.com/auth/spreadsheets',
 'https://www.googleapis.com/auth/script.scriptapp',
 'https://www.googleapis.com/auth/script.deployments',
 'https://www.googleapis.com/auth/script.projects',
 'https://www.googleapis.com/auth/gmail.readonly',
 'https://www.googleapis.com/auth/gmail.send',
 'https://www.googleapis.com/auth/gmail.modify',
 'https://www.googleapis.com/auth/calendar',
 'https://www.googleapis.com/auth/contacts.readonly',
]
flow=Flow.from_client_secrets_file(str(CLIENT), scopes=SCOPES, redirect_uri=REDIRECT, autogenerate_code_verifier=True)
url,state=flow.authorization_url(access_type='offline', prompt='consent', include_granted_scopes='true')
PENDING.write_text(json.dumps({'state':state,'code_verifier':flow.code_verifier,'redirect_uri':REDIRECT,'scopes':SCOPES}, indent=2))
print(url)
