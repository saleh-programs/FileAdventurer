from fastapi import FastAPI, Response
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
class Path_Target(BaseModel):
  path: str
  target: str
class ChangePath(BaseModel):
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
  
# Database access stuff
# ------
@app.post("/updateRecents")
def updateRecents(req: JustPath):
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
    
  return Response(status_code=200)
@app.get("/getRecents")
def getRecents():
  with AccessDB("FileSystemDatabase.db") as conn:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM recents")
    recents = {}
    for each in cursor.fetchall():
      recents[each[1]] = 1 + recents.get(each[1],0)
    sortedRecents = [each[0] for each in sorted(recents.items(),key=lambda item: item[1], reverse=True)]
    cursor.execute("SELECT * FROM recents")
  sortedRecentFiles = []
  for each in sortedRecents:
    fileinfo =  os.lstat(each)
    sortedRecentFiles.append(
      {"name": "\\".join(each.split("\\")[:-1]),
        "type": "folder" if os.path.isdir(each) else "file",
        "creation": fileinfo.st_ctime,
        "path":each})
  return JSONResponse(
    content=sortedRecentFiles,
    status_code=200
  )
@app.post("/addPinned")
def addPinned(req: JustPath):
  with AccessDB("FileSystemDatabase.db") as conn:
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO preferences (name, type) VALUES (?, ?)''',(req.path, "pin")
    )
  return Response(status_code=200)
@app.post("/addHidden")
def addHidden(req: JustPath):
  with AccessDB("FileSystemDatabase.db") as conn:
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO preferences (name, type) VALUES (?, ?)''',(req.path, "hide")
    )
  return Response(status_code=200)
@app.post("/removePinned")
def removePinned(req: JustPath):
  with AccessDB("FileSystemDatabase.db") as conn:
    cursor = conn.cursor()
    cursor.execute('''
    DELETE FROM preferences WHERE name = ? AND type = ?''',(req.path, "pin")
    )
  return Response(status_code=200)
@app.post("/removeHidden")
def removeHidden(req: JustPath):
  with AccessDB("FileSystemDatabase.db") as conn:
    cursor = conn.cursor()
    cursor.execute('''
    DELETE FROM preferences WHERE name = ? AND type = ?''',(req.path, "hide")
    )
  return Response(status_code=200)
@app.get("/getPinned")
def getPinned():
  with AccessDB("FileSystemDatabase.db") as conn:
    cursor = conn.cursor()
    cursor.execute('''SELECT name FROM preferences WHERE type = ?''', ("pin",))
    pinnedEntries = [entry[0] for entry in cursor.fetchall()]
  return JSONResponse(
    content=pinnedEntries,
    status_code=200
  )
@app.get("/getHidden")
def getHidden():
  with AccessDB("FileSystemDatabase.db") as conn:
    cursor = conn.cursor()
    cursor.execute('''SELECT name FROM preferences WHERE type = ?''', ("hide",))
    hiddenEntries = [entry[0] for entry in cursor.fetchall()]
  return JSONResponse(
    content=hiddenEntries,
    status_code=200
  )


# File system operations
#----

@app.post("/navigate")
def navigate(req: JustPath):
  files = []
  with AccessDB("FileSystemDatabase.db") as conn:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM preferences")
    for name in os.listdir(req.path):
      fileinfo =  os.lstat(os.path.join(req.path,name))
      attributes =fileinfo.st_file_attributes
      if attributes & (stat.FILE_ATTRIBUTE_HIDDEN | stat.FILE_ATTRIBUTE_SYSTEM | stat.FILE_ATTRIBUTE_REPARSE_POINT):
        continue
      entry_path = os.path.join(req.path, name) + "\\"
      cursor.execute('''SELECT 1 FROM preferences WHERE name = ? and type = ?''',(entry_path,"pin"))
      isPinned = cursor.fetchone() is not None
      cursor.execute('''SELECT 1 FROM preferences WHERE name = ? and type = ?''',(entry_path,"hide"))
      isHidden = cursor.fetchone() is not None

      files.append({
        "name": name,
        "type": "folder" if os.path.isdir(entry_path) else "file",
        "creation": fileinfo.st_ctime,
        "pinned": isPinned,
        "hidden": isHidden
        })
    
  return JSONResponse(
    status_code=200,
    content= files
  )

@app.post("/open")
def open(req: JustPath):
    current_path = req.path
    code = 200
    if os.path.exists(current_path):
      os.startfile(current_path)
    else:
      code = 404
    return Response(status_code=code)

@app.post("/rename")
def rename(req: Path_Target):
  fileToRenamePath = os.path.join(os.path.dirname(req.path),req.target)
  os.rename(req.path, fileToRenamePath)
  return Response(status_code=200)


@app.post("/move")
def navigate(req: ChangePath):
  shutil.move(req.path1, req.path2)
  return Response(status_code=200)

@app.get("/getDownloadsFolder")
def getDownloadsFolder():
  code = 200
  downloads_path = platformdirs.user_downloads_dir()
  if not os.path.exists(downloads_path):
    code = 400
    downloads_path = None
  return JSONResponse(
    status_code=code,
    content=downloads_path
  )

@app.get("/getDocumentsFolder")
def getDocumentsFolder():
  code = 200
  documents_path = platformdirs.user_documents_dir()
  if not os.path.exists(documents_path):
    code = 400
    documents_path = None
  return JSONResponse(

    status_code=code,
    content=documents_path
  )

@app.post("/getSearchResults")
def getSearchResults(req: Path_Target):
  results = [] 
  path = req.path
  target = req.target
  if target != "":
    findMatchingFiles(path, target, results)
  return JSONResponse(
    content = results,
    status_code=200
  )


def findMatchingFiles(path, target, results):
  exclusions = {"__pycache__","node_modules","venv","anaconda3", "AppData"}
  try:
    entries = os.listdir(path)
  except PermissionError:
    return
  for each in os.listdir(path):
    childPath = os.path.join(path, each)
    if target in each:
      results.append(childPath)
    if (each not in exclusions) and (os.path.isdir(childPath)) and each[0] != "." :
      findMatchingFiles(childPath, target, results)
  
  
   