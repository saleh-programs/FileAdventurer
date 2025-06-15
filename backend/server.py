from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

import os
import stat
import platformdirs
import sqlite3
import shutil

conn = sqlite3.connect("FileSystemDatabase.db")
cursor = conn.cursor()
cursor.execute('''
CREATE TABLE IF NOT EXISTS preferences(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL)
''')
cursor.execute('''
CREATE TABLE IF NOT EXISTS recents(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL)
''')
# cursor.execute("DROP TABLE recents")
conn.close()

app = FastAPI()
origins = [
    "http://localhost:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class JustPath(BaseModel):
  path: str
class RenameReq(BaseModel):
  path: str
  target: str
class SearchReq(BaseModel):
  path: str
  target: str
class MoveReq(BaseModel):
  path1: str
  path2: str
class CopyReq(BaseModel):
  path1: str
  path2: str

class AccessDB:
  def __init__(self, db_path):
    self.db_path = db_path
    self.conn = None
  def __enter__(self):
    self.conn = sqlite3.connect(self.db_path)
    return self.conn
  def __exit__(self, exc_type, exc_value, exc_tb):
    self.conn.commit()
    self.conn.close()
  
# Add new "recent" access 
@app.post("/updateRecents")
def updateRecents(req: JustPath):
  try:
    with AccessDB("FileSystemDatabase.db") as conn:
      cursor = conn.cursor()
      cursor.execute("SELECT COUNT(*) from recents")
      recentsLength = cursor.fetchone()[0]
      if recentsLength > 10:
        cursor.execute('''
            DELETE FROM recents
            WHERE id = (SELECT id FROM recents ORDER BY id ASC LIMIT 1)
        ''')
      cursor.execute('''INSERT INTO recents (name) VALUES (?)''',(req.path,))
    return JSONResponse(
      content = {"success": True},
      status_code = 200
    )
  except Exception as e:
    return JSONResponse(
      content = {"success": False, "message": "Recents update failed"},
      status_code = 500
    )

#Retrieves list of paths in order from most to least accessed
@app.get("/getRecents")
def getRecents():
  try: 
    with AccessDB("FileSystemDatabase.db") as conn:
      cursor = conn.cursor()
      recents = {}

      cursor.execute("SELECT * FROM recents")
      for each in cursor.fetchall():
        recents[each[1]] = 1 + recents.get(each[1],0)
      recentsList = [ each[0] for each in sorted(recents.items(),key=lambda item: item[1], reverse=True)]
    result = getEntries(recentsList)
      
    return JSONResponse(
      content={"data":result, "success":True},
      status_code=200
    )
  except Exception as e:
    return JSONResponse(
      content={"success":False, "message": "Getting Recents failed"},
      status_code=500,
    )

# Add a pinned folder to recents TABLE
@app.post("/addPinned")
def addPinned(req: JustPath):
  try: 
    with AccessDB("FileSystemDatabase.db") as conn:
      cursor = conn.cursor()
      cursor.execute('''
      INSERT INTO preferences (name, type) VALUES (?, ?)''',(req.path, "pin")
      )
    return JSONResponse(
      content = {"success": True},
      status_code = 200
    )
  except Exception as e:
    return JSONResponse(
      content = {"success": False, "message": "Adding pin failed"},
      status_code = 500
    )
# Remove a pinned folder from recents TABLE
@app.post("/removePinned")
def removePinned(req: JustPath):
  try:
    with AccessDB("FileSystemDatabase.db") as conn:
      cursor = conn.cursor()
      cursor.execute('''
      DELETE FROM preferences WHERE name = ? AND type = ?''',(req.path, "pin")
      )
    return JSONResponse(
      content = {"success": True},
      status_code = 200
    )
  except Exception as e:
    return JSONResponse(
      content = {"success": False, "message": "Removing pin failed"},
      status_code = 500
    )
  
# Get all "pin" entries from preferences TABLE
@app.get("/getPinned")
def getPinned():
  try: 
    with AccessDB("FileSystemDatabase.db") as conn:
      cursor = conn.cursor()
      cursor.execute('''SELECT name FROM preferences WHERE type = ?''', ("pin",))
      entryList = [each[0] for each in cursor.fetchall()]
    result = getEntries(entryList)

    return JSONResponse(
      content={"data":result,"success":True},
      status_code=200
    )
  except Exception as e:
    return JSONResponse(
      content = {"success":False, "message": "Getting pinned entries failed"},
      status_code=500
    )

# Add a hidden folder to preferences TABLE
@app.post("/addHidden")
def addHidden(req: JustPath):
  try:
    with AccessDB("FileSystemDatabase.db") as conn:
      cursor = conn.cursor()
      cursor.execute('''
      INSERT INTO preferences (name, type) VALUES (?, ?)''',(req.path, "hide")
      )
    return JSONResponse(
      content={"success":True},
      status_code = 200
    )
  except Exception as e:
    return JSONResponse(
      content={"success":False, "message":"Adding hidden failed"},
      status_code = 500
    )

# Remove a hidden folder from preferences TABLE
@app.post("/removeHidden")
def removeHidden(req: JustPath):
  try:
    with AccessDB("FileSystemDatabase.db") as conn:
      cursor = conn.cursor()
      cursor.execute('''
      DELETE FROM preferences WHERE name = ? AND type = ?''',(req.path, "hide")
      )
    return JSONResponse(
        content={"success":True},
        status_code = 200
    )
  except Exception as e:
    return JSONResponse(
      content={"success":False, "message":"Removing hidden failed"},
      status_code = 500
    )
  
# Get all "hide" entries from preferences TABLE
@app.get("/getHidden")
def getHidden():
  try:
    with AccessDB("FileSystemDatabase.db") as conn:
      cursor = conn.cursor()
      cursor.execute('''SELECT name FROM preferences WHERE type = ?''', ("hide",))
      entryList = [each[0] for each in cursor.fetchall()]
    result = getEntries(entryList)

    return JSONResponse(
      content={"data":result, "success": True},
      status_code=200
    )
  except Exception as e:
    return JSONResponse(
      content={"success":False, "message": "Getting hidden entries failed"},
      status_code = 500
    )


# Retrieve list of folder/file objects at given path, filtering for undesirable folders/files
@app.post("/navigate")
def navigate(req: JustPath):
  try:
    entryList = [os.path.join(req.path, each) for each in os.listdir(req.path)]
    result = getEntries(entryList)
    return JSONResponse(
      content= {"data": result, "success": True},
      status_code=200
    )
  except Exception as e:
    return JSONResponse(
      content= {"success":False, "message": f"Error retrieving files from {req.path}"},
      status_code=500,
    )

# Open a file
@app.post("/open")
def open(req: JustPath):
  try:
    os.startfile(req.path)
    return JSONResponse(
      content={"success":True},
      status_code=200
    )
  except Exception as e:
    return JSONResponse(
      content={"success":False, "message": "Failed to open file"},
      status_code=500
    )
  
# rename a folder / file
@app.post("/rename")
def rename(req: RenameReq):
  try:
    fileToRenamePath = os.path.join(os.path.dirname(req.path),req.target)
    os.rename(req.path, fileToRenamePath)
    return JSONResponse(
      content={"success":True},
      status_code=200
    )
  except Exception as e:
    return JSONResponse(
      content={"success":False, "message":"Failed to rename entry"},
      status_code=500
    )

# Move a file/folder to a directory
@app.post("/move")
def move(req: MoveReq):
  try:
    shutil.move(req.path1, req.path2)
    return JSONResponse(
      content={"success":True},
      status_code=200
    )
  except Exception as e:
    return JSONResponse(
      content={"success":False, "message":"Failed to relocate entry"},
      status_code=500
    )

# Retrieves system Dowloads folder in case user renamed/relocated it
@app.get("/getDownloadsFolder")
def getDownloadsFolder():
  try:
    downloads_path = platformdirs.user_downloads_dir()
    return JSONResponse(
      content={"data": downloads_path,"success":True},
      status_code=200
    )
  except Exception as e:
    return JSONResponse(
      content={"success":False, "message": "Failed to retrieve system Downloads path"},
      status_code=500
    )

# Retrieves entries from Documents folder (dedicated endpoint because this ensures system Downloads path is used)
@app.get("/getDocumentsFolder")
def getDocumentsFolder():
  try:
    documents_path = platformdirs.user_documents_dir()
    return JSONResponse(
      content={"data": documents_path,"success":True},
      status_code=200
    )
  except Exception as e:
    return JSONResponse(
      content={"success":False, "message": "Failed to retrieve system Documents path"},
      status_code=500
    )

# Create Folder
@app.post("/createFolder")
def createFolder(req: JustPath):
  try:
    newPath = os.path.join(req.path, "New Folder")
    count = 2
    while (os.path.exists(newPath)):
      newPath = os.path.join(req.path, f"New Folder ({count})")
      count += 1

    os.mkdir(newPath)
    fileinfo = os.lstat(newPath)
    createdFolder = {
        "name": os.path.basename(newPath),
        "type": "folder",
        "creation": fileinfo.st_ctime,
        "modified": fileinfo.st_mtime,
        "pinned": False,
        "hidden": False,
        "path": newPath,
        "children": []
    }
    return JSONResponse(
      content={"data": createdFolder,"success":True},
      status_code=200
    )
  except Exception as e:
    return JSONResponse(
      content={"success":False, "message": "Failed to create folder"},
      status_code=500
    )
  
# makes a copy of a file or folder
@app.post("/copyFolder")
def copyFolder(req: CopyReq):
  try:
    newPath = os.path.join(req.path2, f"{os.path.basename(req.path1)} -Copy")
    count = 2
    while (os.path.exists(newPath)):
      newPath = os.path.join(req.path2, f"{os.path.basename(req.path1)} -Copy({count})")
      count += 1

    fileType = "folder" if os.path.isdir(req.path1) else "file"
    if fileType == "folder":
      shutil.copytree(req.path1, newPath)
    else:
      shutil.copy(req.path1, newPath)

    fileinfo = os.lstat(newPath)
    copiedFolder = {
        "name": os.path.basename(newPath),
        "type": fileType,
        "creation": fileinfo.st_ctime,
        "modified": fileinfo.st_mtime,
        "pinned": False,
        "hidden": False,
        "path": newPath,
        "children": []
    }
    return JSONResponse(
      content={"data": copiedFolder,"success":True},
      status_code=200
    )
  except Exception as e:
    return JSONResponse(
      content={"success":False, "message": "Failed to copy folder"},
      status_code=500
    )


# Retrieve a specific file/folder object
@app.post("/getEntry")
def getEntry(req: JustPath):
  try:
    with AccessDB("FileSystemDatabase.db") as conn:
      cursor = conn.cursor()
      fileinfo =  os.lstat(req.path)

      cursor.execute('''SELECT 1 FROM preferences WHERE name = ? and type = ?''',(req.path,"pin"))
      isPinned = cursor.fetchone() is not None
      cursor.execute('''SELECT 1 FROM preferences WHERE name = ? and type = ?''',(req.path,"hide"))
      isHidden = cursor.fetchone() is not None

      entry = {
        "name": os.path.basename(req.path),
        "type": "folder" if os.path.isdir(req.path) else "file",
        "creation": fileinfo.st_ctime,
        "pinned": isPinned,
        "hidden": isHidden,
        "path": req.path,
        "children": []
        }
    return JSONResponse(
      content={"data": entry,"success":True},
      status_code=200
    )
  except Exception as e:
    return JSONResponse(
      content={"success":False, "message": "Failed to retrieve file / folder object"},
      status_code=500
    )



# Retrieve list of paths with matching target substring anywhere within given path
@app.post("/getSearchResults")
def getSearchResults(req: SearchReq):
  try:
    if req.target == "":
      raise ValueError
    results = [] 
    findMatchingFiles(req.path, req.target.lower(), results)
    result = getEntries(results)

    return JSONResponse(
      content = {"data":result, "success":True},
      status_code=200
    )
  except Exception as e:
    return JSONResponse(
      content = {"success":False, "message": "Failed to search results"},
      status_code=500
    )

# recursive function that checks every directory in initial path for target. "Exclusions" are not explored.
def findMatchingFiles(path, target, results):
  exclusions = {"__pycache__","node_modules","venv","anaconda3", "appdata"}
  try:
    entries = os.listdir(path)
  except PermissionError:
    return
  
  for name in entries:
    childPath = os.path.join(path, name)
    lowerCaseName = name.lower()
    
    if target in lowerCaseName:
      results.append(childPath)
    if (lowerCaseName not in exclusions) and (os.path.isdir(childPath)) and name[0] != "." :
      findMatchingFiles(childPath, target, results)



# Retrieve a list of file / folder objests
def getEntries(pathList):
  with AccessDB("FileSystemDatabase.db") as conn:
    cursor = conn.cursor()
    results = []
    for path in pathList:
      fileinfo =  os.lstat(path)

      attributes = fileinfo.st_file_attributes
      if attributes & (stat.FILE_ATTRIBUTE_HIDDEN | stat.FILE_ATTRIBUTE_SYSTEM | stat.FILE_ATTRIBUTE_REPARSE_POINT):
        continue

      cursor.execute('''SELECT 1 FROM preferences WHERE name = ? and type = ?''',(path,"pin"))
      isPinned = cursor.fetchone() is not None
      cursor.execute('''SELECT 1 FROM preferences WHERE name = ? and type = ?''',(path,"hide"))
      isHidden = cursor.fetchone() is not None

      results.append({
        "name": os.path.basename(path),
        "type": "folder" if os.path.isdir(path) else "file",
        "creation": fileinfo.st_ctime,
        "modified":fileinfo.st_mtime,
        "pinned": isPinned,
        "hidden": isHidden,
        "path": path,
        "children": []
        })
    return results