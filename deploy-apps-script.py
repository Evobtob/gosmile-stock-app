#!/usr/bin/env python3
import json
from pathlib import Path
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

HOME=Path.home()/'.hermes'
TOKEN=HOME/'google_token.json'
SCOPES=json.loads(TOKEN.read_text()).get('scopes')
creds=Credentials.from_authorized_user_file(str(TOKEN), SCOPES)
service=build('script','v1',credentials=creds)
code=Path('apps-script/Code.gs').read_text()
manifest=json.dumps({
  'timeZone':'Europe/Lisbon',
  'exceptionLogging':'STACKDRIVER',
  'runtimeVersion':'V8',
  'webapp': {'executeAs':'USER_DEPLOYING','access':'ANYONE_ANONYMOUS'},
  'executionApi': {'access': 'ANYONE'}
}, indent=2)
try:
    project=service.projects().create(body={'title':'GoSmile Stock Backend'}).execute()
    sid=project['scriptId']
    print('scriptId',sid)
    content={'files':[
        {'name':'Code','type':'SERVER_JS','source':code},
        {'name':'appsscript','type':'JSON','source':manifest},
    ]}
    service.projects().updateContent(scriptId=sid, body=content).execute()
    version=service.projects().versions().create(scriptId=sid, body={'description':'Initial GoSmile stock backend'}).execute()
    print('version',version)
    deploy=service.projects().deployments().create(scriptId=sid, body={
        'versionNumber': version['versionNumber'],
        'manifestFileName':'appsscript',
        'description':'Web app backend for GoSmile stock PWA'
    }).execute()
    print(json.dumps(deploy, indent=2))
    entry=deploy.get('entryPoints',[{}])[0]
    print('WEBAPP_URL', entry.get('webApp',{}).get('url'))
except HttpError as e:
    print('HTTP_ERROR', e.status_code if hasattr(e,'status_code') else '')
    print(e.content.decode() if hasattr(e,'content') else str(e))
    raise
