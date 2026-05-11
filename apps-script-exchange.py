#!/usr/bin/env python3
import json, sys
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from google_auth_oauthlib.flow import Flow

HOME=Path.home()/'.hermes'
CLIENT=HOME/'google_client_secret.json'
PENDING=HOME/'google_apps_script_oauth_pending.json'
TOKEN=HOME/'google_token.json'
url=sys.argv[1]
pending=json.loads(PENDING.read_text())
params=parse_qs(urlparse(url).query)
code=params['code'][0]
state=params.get('state',[None])[0]
if state != pending['state']:
    raise SystemExit('state mismatch')
flow=Flow.from_client_secrets_file(str(CLIENT), scopes=params.get('scope',[' '.join(pending['scopes'])])[0].split(), redirect_uri=pending['redirect_uri'], state=state, code_verifier=pending['code_verifier'])
import os
os.environ['OAUTHLIB_RELAX_TOKEN_SCOPE']='1'
flow.fetch_token(code=code)
payload=json.loads(flow.credentials.to_json())
payload.setdefault('type','authorized_user')
if getattr(flow.credentials,'granted_scopes',None):
    payload['scopes']=list(flow.credentials.granted_scopes)
TOKEN.write_text(json.dumps(payload, indent=2))
PENDING.unlink(missing_ok=True)
print('OK token saved', TOKEN)
print('\n'.join(payload.get('scopes',[])))
