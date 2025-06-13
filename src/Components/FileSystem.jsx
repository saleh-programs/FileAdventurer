import { useState, useRef } from "react"

import ThemeContext from "../assets/ThemeContext"
import Filedisplay from "./Filedisplay"
import Sidebar from "./Sidebar"

import { navigateToReq, openFileReq, updateRecentsReq } from "../../backend/requests"

function FileSystem(){
  const [displayPath, setDisplayPath] = useState("C:\\")
  const [displayFiles,setDisplayFiles] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const isLoadingRef = useRef(false)
  const [pinnedFolders, setPinnedFolders] = useState([])
  const [showRecents, setShowRecents] = useState(false)
  const [recents, setRecents] = useState([])

  const shared = {
    displayPath, setDisplayPath,
    displayFiles, setDisplayFiles,
    pinnedFolders, setPinnedFolders,
    showRecents, setShowRecents,
    recents, setRecents,
    changePath, updateRecents, openFile
  }

  // Changes the main display path and retrieves files / folders attached to the changed path.
  async function changePath(newPath){
    if (isLoadingRef.current || isLoading) return

    setIsLoading(true)
    isLoadingRef.current = true

    const response = await navigateToReq(newPath)
    if (response != null){
      setDisplayFiles(response)
      setDisplayPath(newPath)
      updateRecents(newPath)
    }

    setIsLoading(false)
    isLoadingRef.current = false
  }
  
  // Updates the list of recents
  async function updateRecents(path) {
   const response = await updateRecentsReq(path)
  }

  // opens file (async because I'll open room for custom error handling later)
  async function openFile(path) {
    const response = await openFileReq(path)
  }

  return(
  <>
    <ThemeContext.Provider value={shared}>
      <Sidebar/>
      <Filedisplay/>
    </ThemeContext.Provider> 
  </>
  )
}

export default FileSystem