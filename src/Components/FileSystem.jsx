import { useState, useRef, useEffect } from "react"

import ThemeContext from "../assets/ThemeContext"
import Filedisplay from "./Filedisplay"
import Sidebar from "./Sidebar"

import { navigateToReq, openFileReq, updateRecentsReq } from "../../backend/requests"

function FileSystem(){
  const [displayPath, setDisplayPath] = useState("C:\\")
  const [displayFiles,setDisplayFiles] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const isLoadingRef = useRef(false)

  const [pinned, setPinned] = useState([])
  const [showRecents, setShowRecents] = useState(false)
  const [recents, setRecents] = useState([])

  const [lazyLoadMax, setLazyLoadMax] = useState(100);
  const lazyLoadMaxRef = useRef(100)

  const globalCursorPos = useRef({x:0,y:0})

  //Always make cursor pos available 
  useEffect(()=>{
    function getCursorPos(e){
      globalCursorPos.current.x = e.clientX
      globalCursorPos.current.y = e.clientY

    }
    window.addEventListener("mousemove", getCursorPos)
    return ()=>{
      window.removeEventListener("mousemove", getCursorPos)
    }
  },[])

  const shared = {
    displayPath, setDisplayPath,
    displayFiles, setDisplayFiles,
    lazyLoadMax, setLazyLoadMax, lazyLoadMaxRef,
    pinned, setPinned,
    showRecents, setShowRecents,
    recents, setRecents,
    changePath, updateRecents, openFile,
    globalCursorPos
  }

  // Changes the main display path and gets files / folders attached to the changed path.
  async function changePath(newPath){
    if (isLoadingRef.current || isLoading) return

    setIsLoading(true)
    isLoadingRef.current = true

    const response = await navigateToReq(newPath)
    if (response != null){
      setDisplayFiles(response)
      setDisplayPath(newPath)
      updateRecents(newPath)

      setShowRecents(false)
      setLazyLoadMax(50)
      lazyLoadMaxRef.current = 50 
    }

    setIsLoading(false)
    isLoadingRef.current = false
  }
  
  // Updates most frequently accessed entries 
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