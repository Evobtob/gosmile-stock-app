#!/usr/bin/env python3
import json
from pathlib import Path
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
sid='1B4u7k33JWEsqyfNHyYsCuv8UOWmE_kpZUZKxIkwvWA4NAzT88SX4ZGMC'
TOKEN=Path.home()/'.hermes/google_token.json'
scopes=json.loads(TOKEN.read_text()).get('scopes')
creds=Credentials.from_authorized_user_file(str(TOKEN), scopes)
drive=build('drive','v3',credentials=creds)
try:
    print(drive.files().get(fileId=sid, fields='id,name,mimeType,webViewLink,permissions').execute())
except HttpError as e: print('get',e.content.decode())
try:
    r=drive.permissions().create(fileId=sid, body={'type':'anyone','role':'reader'}, fields='id,type,role').execute()
    print('perm',r)
except HttpError as e: print('permerr',e.content.decode())
