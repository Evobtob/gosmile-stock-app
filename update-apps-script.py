#!/usr/bin/env python3
import json, sys
from pathlib import Path
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

SCRIPT_ID = sys.argv[1] if len(sys.argv) > 1 else '1BsbfkUx0JEnmg-EKNkOzjY3LR-owFqjV1UH70dyQE29fiKdNXY6KPP_t'
TOKEN = Path.home()/'.hermes/google_token.json'
scopes = json.loads(TOKEN.read_text()).get('scopes')
creds = Credentials.from_authorized_user_file(str(TOKEN), scopes)
svc = build('script','v1',credentials=creds)
code = Path('apps-script/Code.gs').read_text()
manifest = json.dumps({
  'timeZone':'Europe/Lisbon',
  'exceptionLogging':'STACKDRIVER',
  'runtimeVersion':'V8',
  'webapp': {'executeAs':'USER_DEPLOYING','access':'ANYONE_ANONYMOUS'},
  'executionApi': {'access': 'ANYONE'}
}, indent=2)
try:
    svc.projects().updateContent(scriptId=SCRIPT_ID, body={'files':[
        {'name':'Code','type':'SERVER_JS','source':code},
        {'name':'appsscript','type':'JSON','source':manifest},
    ]}).execute()
    version = svc.projects().versions().create(scriptId=SCRIPT_ID, body={'description':'Fix manual doGet authorization guard'}).execute()
    version_number = version['versionNumber']
    deployments = svc.projects().deployments().list(scriptId=SCRIPT_ID).execute().get('deployments', [])
    web = [d for d in deployments if any(ep.get('entryPointType') == 'WEB_APP' for ep in d.get('entryPoints', []))]
    if web:
        dep_id = web[-1]['deploymentId']
        dep = svc.projects().deployments().update(scriptId=SCRIPT_ID, deploymentId=dep_id, body={
            'deploymentConfig': {
                'versionNumber': version_number,
                'manifestFileName': 'appsscript',
                'description': 'Web app backend for GoSmile stock PWA'
            }
        }).execute()
    else:
        dep = svc.projects().deployments().create(scriptId=SCRIPT_ID, body={
            'versionNumber': version_number,
            'manifestFileName':'appsscript',
            'description':'Web app backend for GoSmile stock PWA'
        }).execute()
    print(json.dumps({'scriptId': SCRIPT_ID, 'version': version_number, 'deployment': dep}, indent=2))
except HttpError as e:
    print(e.content.decode() if hasattr(e, 'content') else str(e))
    raise
