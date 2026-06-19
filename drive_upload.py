import os
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload

# Scope required to upload and manage files created by this app
SCOPES = ['https://www.googleapis.com/auth/drive.file']

def upload_file_to_drive(filepath, filename=None, mimetype=None):
    """
    Authenticates using OAuth 2.0 InstalledAppFlow and uploads a file to Google Drive.
    Saves/loads access tokens to token.json.
    """
    if not os.path.exists(filepath):
        print(f"Error: File '{filepath}' not found.")
        return None

    creds = None
    # The file token.json stores the user's access and refresh tokens
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    
    # If there are no (valid) credentials available, let the user log in
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
            except Exception:
                # If refresh fails, delete token and re-authenticate
                os.remove('token.json')
                creds = None
        
        if not creds:
            if not os.path.exists('credentials.json'):
                print("Error: 'credentials.json' file not found.")
                print("Please download your OAuth client ID credentials from the Google Cloud Console.")
                print("Save the downloaded file as 'credentials.json' in this folder and try again.")
                return None
            
            # Start local browser authentication
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
            
            # Save the credentials for the next run
            with open('token.json', 'w') as token:
                token.write(creds.to_json())

    try:
        # Create Google Drive v3 Client
        service = build('drive', 'v3', credentials=creds)

        # Set default file name from path if not provided
        if not filename:
            filename = os.path.basename(filepath)

        file_metadata = {'name': filename}
        media = MediaFileUpload(filepath, mimetype=mimetype, resumable=True)

        print(f"Uploading '{filepath}' to Google Drive...")
        
        # Call API
        file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id'
        ).execute()

        print(f"Upload complete! File ID: {file.get('id')}")
        return file.get('id')

    except HttpError as error:
        print(f"An error occurred: {error}")
        return None

if __name__ == '__main__':
    # Example usage:
    # 1. Place a test file in the directory (e.g. sample.txt)
    # 2. Place your credentials.json in the directory
    # 3. Call upload_file_to_drive("sample.txt")
    
    import sys
    if len(sys.argv) < 2:
        print("Usage: python drive_upload.py <local_file_path> [remote_file_name]")
    else:
        local_path = sys.argv[1]
        remote_name = sys.argv[2] if len(sys.argv) > 2 else None
        upload_file_to_drive(local_path, filename=remote_name)
