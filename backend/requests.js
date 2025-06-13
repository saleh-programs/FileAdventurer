
const baseURL = "http://localhost:8000/"

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
  console.log(path)
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
    return data
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

// utility functions

// Acts as os.path.join to add to a path
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
  if (newPath.length == 1){
    return "C:\\"
  }
  return newPath.join("\\")
}

export {
  joinPath, trimPath,
  navigateToReq, openFileReq,renameFileReq, moveFileReq, getDownloadsFolderReq,getDocumentsFolderReq, getSearchResultsReq,
  addPinnedReq, addHiddenReq, removePinnedReq, removeHiddenReq, getPinnedReq, getHiddenReq, updateRecentsReq, getRecentsReq }