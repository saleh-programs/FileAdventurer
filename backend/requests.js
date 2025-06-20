
const baseURL = "http://localhost:8000/"

//comments for many may be obvious but are made for consistency

//Save pinned entry in backend
async function addPinnedReq(path) {
  try{
    const response = await fetch(baseURL + "addPinned",{
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({"path":path})
    });
    const data = await response.json()
    if (!data.success){
      throw new Error(data.message || "Req Failed")
    }
    return data
  }catch(err){
    console.error(err)
    return null
  }
}

//Save hidden entry in backend
async function addHiddenReq(path) {
  try{
    const response = await fetch(baseURL + "addHidden",{
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({"path":path})
    }); 
    const data = await response.json()
    if (!data.success){
      throw new Error(data.message || "Req Failed")
    }
    return data
  } catch(err){
      console.error(err)
      return null
  }
}

//Remove pinned entry from backend
async function removePinnedReq(path) {
  try{
    const response = await fetch(baseURL + "removePinned",{
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({"path":path})
    });
    const data = await response.json()
    if (!data.success){
      throw new Error(data.message || "Req Failed")
    }
    return data
  } catch(err){
      console.error(err)
      return null
  }
}

//Remove hidden entry from backend
async function removeHiddenReq(path) {
  try{
    const response = await fetch(baseURL + "removeHidden",{
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({"path":path})
    });
    const data = await response.json()
    if (!data.success){
      throw new Error(data.message || "Req Failed")
    }
    return data
  }catch(err){
    console.error(err);
    return null
  }
}

//Retrieve pinned entries from backend
async function getPinnedReq() {
  try{
    const response = await fetch(baseURL + "getPinned",{
      method: "GET",
    });
    const data = await response.json()
    if (!data.success){
      throw new Error(data.message || "Req Failed")
    }
    return data.data
  }catch(err){
    console.error(err);
    return null
  }
}

//Retrieve hidden entries from backend
async function getHiddenReq() {
  try{
    const response = await fetch(baseURL + "getHidden",{
      method: "GET",
    });
    const data = await response.json()
    if (!data.success){
      throw new Error(data.message || "Req Failed")
    }
    return data.data
  }catch(err){
    console.error(err);
    return null
  }
}

//Save new recently accessed path to backend 
async function updateRecentsReq(path) {
  try{
    const response = await fetch(baseURL + "updateRecents",{
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({"path":path})
    });
    const data = await response.json()
    if (!data.success){
      throw new Error(data.message || "Req Failed")
    }
    return data
  }catch(err){
    console.error(err);
    return null
  }
}

//Retrieve recently accessed paths from backend in order of most to least frequently accessed
async function getRecentsReq() {
  try{
    const response = await fetch(baseURL + "getRecents",{
      method: "GET",
    });
    const data = await response.json()
    if (!data.success){
      throw new Error(data.message || "Req failed")
    }
    return data.data
  }catch(err){
    console.error(err)
    return null
  }
}

// Retrieve files / folders from a specified path, excluding undesirables
async function navigateToReq(path){
  try{
    const response = await fetch(baseURL + "navigate",{
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({"path":path})
    });
    const data = await response.json()
    if (!data.success){
      throw new Error(data.message || "Req Failed")
    }
    return data.data
  }catch(err){
    console.error(err)
    return null
  }
}

// open a file
async function openFileReq(path){
  try{
    const response = await fetch(baseURL + "open",{
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({"path":path})
    });
    const data = await response.json()
    if (!data.success){
      throw new Error(data.message || "Req Failed")
    }
    return data
  }catch(err){
    console.error(err)
    return null;
  }
}

// rename a file or directory
async function renameFileReq(path,target){
  try{
    const response = await fetch(baseURL + "rename",{
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({"path":path, "target":target})
    });
    const data = await response.json()
    if (!data.success){
      throw new Error(data.message || "Req Failed")
    }
    return data.data
  }catch(err){
    console.error(err)
    return null;
  }
}

// moves entry in path1 to directory in path2
async function moveFileReq(path1, path2) {
  try{
    const response = await fetch(baseURL + "move",{
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({"path1":path1, "path2":path2})
    });
    const data = await response.json()
    if (!data.success){
      throw new Error(data.message || "Req Failed")
    }
    return data
  }catch(err){
    console.error(err)
    return null;
  }
}

// get system Downloads folder (in case user renames downloads or something)
async function getDownloadsFolderReq(){
  try{
    const response = await fetch(baseURL + "getDownloadsFolder",{
      method: 'GET',
    });
    const data = await response.json()
    if (!data.success){
      throw new Error(data.message || "Req Failed")
    }
    return data.data
  }catch(err){
    console.error(err)
    return null;
  }
}

// get system Documents folder (in case user renames documents or something)
async function getDocumentsFolderReq(){
  try{
    const response = await fetch(baseURL + "getDocumentsFolder",{
      method: 'GET',
    });
    const data = await response.json()
    if (!data.success){
      throw new Error(data.message || "Req Failed")
    }
    return data.data
  }catch(err){
    console.error(err)
    return null;
  }
}

// get file / folder object
async function getEntryReq(path){
  try{
    const response = await fetch(baseURL + "getEntry",{
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({path:path})
    });
    const data = await response.json()
    if (!data.success){
      throw new Error(data.message || "Req Failed")
    }
    return data.data
  }catch(err){
    console.error(err)
    return null;
  }
}

// Gets a list of paths with the matching target substring
async function getSearchResultsReq(path, target) {
  try{
    const response = await fetch(baseURL + "getSearchResults",{
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({path:path, target:target})
    });
    const data = await response.json()
    if (!data.success){
      throw new Error(data.message || "Req Failed")
    }
    return data.data
  }catch(err){
    console.error(err)
    return null;
  }
}

// Creates a new folder (big surprise huh)
async function createFolderReq(path){
  try{
    const response = await fetch(baseURL + "createFolder",{
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({"path":path})
    });
    const data = await response.json()
    if (!data.success){
      throw new Error(data.message || "Req Failed")
    }
    return data.data
  }catch(err){
    console.error(err)
    return null
  }
}


// Creates a copy of a folder 
async function copyFolderReq(path1, path2){
  try{
    const response = await fetch(baseURL + "copyFolder",{
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({"path1":path1, "path2":path2})
    });
    const data = await response.json()
    if (!data.success){
      throw new Error(data.message || "Req Failed")
    }
    return data.data
  }catch(err){
    console.error(err)
    return null
  }
}

//deletes a path
async function deleteEntryReq(path){
  try{
    const response = await fetch(baseURL + "deleteEntry",{
      method: 'DELETE',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({"path":path})
    });
    const data = await response.json()
    if (!data.success){
      throw new Error(data.message || "Req Failed")
    }
    return data
  }catch(err){
    console.error(err)
    return null
  }
}

//gets the default path the user set
async function getDefaultPathReq() {
  try{
    const response = await fetch(baseURL + "getDefaultPath",{
      method: 'GET',
    });
    const data = await response.json()
    if (!data.success){
      throw new Error(data.message || "Req Failed")
    }
    return data.data
  }catch(err){
    console.error(err)
    return null
  }
}

//sets the default path the user sets for minitree in sidebar
async function setDefaultPathReq(path) {
  try{
    const response = await fetch(baseURL + "setDefaultPath",{
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({"path":path})
    });
    const data = await response.json()
    if (!data.success){
      throw new Error(data.message || "Req Failed")
    }
    return data
  }catch(err){
    console.error(err)
    return null
  }
}


// utility functions

// Acts as os.path.join in Python to add to a path (can also go to previous path by making ".." the second arg)
function joinPath(fullpath, added){   
  if (fullpath === "C:\\" && added === ".."){
    return fullpath
  }else if (fullpath === "C:\\"){
    return fullpath + added
  }

  let newPath = fullpath.split("\\")
  added === ".." ? newPath.pop() : newPath.push(added)
  if (newPath.length == 1){
    return "C:\\"
  }

  return newPath.join("\\")
}

// trims path to be the parent path of target ("C:\\Users\\Downloads", "Users") => "C:\\" 
function trimPath(fullpath, target){
  let newPath = fullpath.split("\\")
  newPath = newPath.slice(0,newPath.indexOf(target))
  if (newPath.length <= 1){
    return "C:\\"
  }
  return newPath.join("\\")
}

//gets parts of path: "C:\\users\name" => ["C:", "users", "name"]
function getSegments(fullpath){
  //only edge case is "C:\\".split("\\") => ["C:", ""]
  if (fullpath === "C:\\"){
    return ["C:"]
  }
  return fullpath.split("\\")
}

  // formats file's creation time, which is some float # timestamp, into a presentable date
  function formatDate(timestamp){
    return new Date(timestamp * 1000).toLocaleString("en-US", {
          year: "numeric",
          month: "numeric",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true
        }).replace(",", "");
  }

  //sorts file names alphanumerically
  function sortAlphanumeric(fileList){
    const result = [...fileList]
    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
    result.sort((a, b)=>collator.compare(a.name, b.name))
    return result
  }
  //sorts file names by modified date
  function sortModified(fileList){
    const result = [...fileList]
    result.sort((a,b)=>a.modified - b.modified)
    return result
  }
  //sorts file names by creation date
  function sortCreation(fileList){
    const result = [...fileList]
    result.sort((a,b)=>a.creation - b.creation)
    return result
  }

  // Will return the appropriate sorted list for the current sort mode
  function sortedDisplay(items, sortType) {
    if (sortType === "alphanumeric"){
      return sortAlphanumeric(items)
    }else if(sortType === "creation"){
      return sortCreation(items)
    }else{
      return sortModified(items)
    }
  }

export {
  joinPath, trimPath, getSegments, sortAlphanumeric, sortCreation, sortModified, formatDate, sortedDisplay,
  navigateToReq, openFileReq,renameFileReq, moveFileReq, getDownloadsFolderReq,getDocumentsFolderReq, getSearchResultsReq, getEntryReq, getDefaultPathReq, setDefaultPathReq,
  addPinnedReq, addHiddenReq, removePinnedReq, removeHiddenReq, getPinnedReq, getHiddenReq, updateRecentsReq, getRecentsReq, createFolderReq, copyFolderReq, deleteEntryReq }