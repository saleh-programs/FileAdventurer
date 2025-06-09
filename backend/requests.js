
const baseURL = "http://localhost:8000/"


async function addPinned(path) {
  const response = await fetch(baseURL + "addPinned",{
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({"path":path})
  });
}
async function addHidden(path) {
  const response = await fetch(baseURL + "addHidden",{
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({"path":path})
  });
}
async function removePinned(path) {
  const response = await fetch(baseURL + "removePinned",{
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({"path":path})
  });
}
async function removeHidden(path) {
  const response = await fetch(baseURL + "removeHidden",{
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({"path":path})
  });
}
async function getPinned() {
  const response = await fetch(baseURL + "getPinned",{
    method: "GET",
  });
  return await response.json()
}
async function getHidden() {
  const response = await fetch(baseURL + "getHidden",{
    method: "GET",
  });
  return await response.json()
}

async function updateRecents(path) {
    const response = await fetch(baseURL + "updateRecents",{
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({"path":path})
  });
}
async function getRecents() {
    const response = await fetch(baseURL + "getRecents",{
    method: "GET",
  });
  return await response.json()
}




// navigate to different directory
async function navigateTo(path){
  const response = await fetch(baseURL + "navigate",{
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({"path":path})
  });
  return await response.json()
}

// open a file
async function openFile(path){
  const response = await fetch(baseURL + "open",{
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({"path":path})
  });
}

// rename a file or directory
async function renameFile(path,target){
  if (path[path.length-1] === "\\")
    path = path.slice(0,-1)
    console.log(path)
  const response = await fetch(baseURL + "rename",{
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({"path":path, "target":target})
  });
}

// moves file in path1 to directory in path2
async function moveFile(path1, path2) {
    const response = await fetch(baseURL + "move",{
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({"path1":path1, "path2":path2})
  });
}
// get downloads folder (in case user renames downloads or something)
async function getDownloadsFolder(){
  const response = await fetch(baseURL + "getDownloadsFolder",{
    method: 'GET',
  });
  return await response.json()
}
// get documents folder (in case user renames documents or something)
async function getDocumentsFolder(){
  const response = await fetch(baseURL + "getDocumentsFolder",{
    method: 'GET',
  });
  return await response.json()
}

// just gets search results 
async function getSearchResults(path, target) {
  const response = await fetch(baseURL + "getSearchResults",{
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({path:path, target:target})
  })
  return await response.json()
}

function joinPath(fullpath, added){    
  if (fullpath === "C:\\" && added === "..")
    return fullpath
  
  let newPath = fullpath.split("\\").slice(0,-1)
  added === ".." ? newPath.pop() : newPath.push(added)

  return newPath.join("\\") + "\\"
}
function trimPath(fullpath, parent){
  console.log(fullpath,parent)
  let newPath = fullpath.split("\\").slice(0,-1)
  newPath = newPath.slice(0,newPath.indexOf(parent))
  newPath = newPath.join("\\") + "\\"
  console.log(newPath)
  return newPath
}

export {
  joinPath, trimPath,
  navigateTo, openFile,renameFile, moveFile, getDownloadsFolder,getDocumentsFolder, getSearchResults,
  addPinned, addHidden, removePinned, removeHidden, getPinned, getHidden, updateRecents, getRecents }