import { useContext, useEffect, useRef, useState } from "react"
import styles from "../../styles/Components/Filedisplay.module.css"
import ThemeContext from "../assets/ThemeContext"
import {
  joinPath, trimPath,
  navigateTo, openFile,renameFile,moveFile, getDownloadsFolder,getDocumentsFolder, getSearchResults,
  addPinned, addHidden, removePinned, removeHidden, getPinned, getHidden, updateRecents, 
  getRecents} from "../../backend/requests"

import editIcon from "../assets/editIcon.png" 
import pinIcon from "../assets/pinIcon.png"
import unpinIcon from "../assets/unpinIcon.png"
import hideIcon from "../assets/hideIcon.png"
import unhideIcon from "../assets/unhideIcon.png"

function Filedisplay(){
  const [displayPath, setDisplayPath, pinnedFolders, setPinnedFolders, showRecents, setShowRecents, recents, setRecents] = useContext(ThemeContext)
  const [displayFiles,setDisplayFiles] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [editingName, setEditingName] = useState("")
  const [newFileName, setNewFileName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showHidden, setShowHidden] = useState(false)
  const [draggedTo, setDraggedTo] = useState(null)
  const [isSelected,setIsSelected] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [prevTimerActive, setPrevTimerActive] = useState(true)
  const containerRef = useRef(null)


  function pinEntry(each){
    const entryPath = joinPath(displayPath,each.name);
    setPinnedFolders(prev=>[...prev,[each.name,entryPath]]);
    addPinned(entryPath);
    setDisplayFiles(displayFiles.map(item=>{
      return each == item ? {...item, pinned: true} : item
    }))
  }
  function unpinEntry(each){
    setPinnedFolders(prev=>prev.filter(item=>item[0]!==each.name));
    removePinned(joinPath(displayPath, each.name))
    setDisplayFiles(displayFiles.map(item=>{
      return each == item ? {...item, pinned: false} : item
    }))
  }
  function hideEntry(each){
    addHidden(joinPath(displayPath,each.name))
    setDisplayFiles(displayFiles.map(item=>{
      return each == item ? {...item, hidden: true} : item
    }))
  }
  function unhideEntry(each){
    removeHidden(joinPath(displayPath, each.name))
    setDisplayFiles(displayFiles.map(item=>{
      return each == item ? {...item, hidden: false} : item
    }))
  }

  async function retrieveFiles() {
    const response = await navigateTo(displayPath)
    setDisplayFiles(response)
    setIsLoading(false)
  }
  async function callOpenFile(e) {
    if (e.target.tagName!==("BUTTON") && e.target.tagName!==("IMG")){
      const response = await openFile(joinPath(displayPath,e.currentTarget.firstElementChild.textContent))
    }
  }
  function sortFiles(){
    setFiles([...displayFiles].sort((a,b) => b.creation - a.creation))
  }
  function changePath(newPath){
    setIsLoading(true)
    if (!isLoading)
      console.log(newPath)
      setDisplayPath(newPath)
  }

  function startDrag(event){
    const start = [event.clientX, event.clientY]
    const startScrollHeight = containerRef.current.scrollHeight
    const selectedElement = event.currentTarget
    const startZ = selectedElement.style.zIndex;
    selectedElement.style.zIndex = "50000"
    const oldOpacity = selectedElement.style.opacity
    selectedElement.style.opacity = .4;
    document.body.style.userSelect = "none"
    setIsDragging(true)

    function dragElement(e){
      selectedElement.style.position = "relative"
      selectedElement.style.left = `${e.clientX - start[0]}px`
      selectedElement.style.top = `${e.clientY - start[1]}px`
      
      //to hide temporarily to see other elements
      selectedElement.style.display = "none";
      const elementsOverCursor = document.elementFromPoint(e.clientX, e.clientY)
      const elementHoveredOver = elementsOverCursor?.closest("[data-folder]");
      setDraggedTo(elementHoveredOver?.dataset.folder)
      if(elementsOverCursor?.closest("[data-dash]") && prevTimerActive){
        changePath(joinPath(displayPath,".."))
        setPrevTimerActive(false)
        setTimeout(()=>{
          setPrevTimerActive(true)
        },1000)
      }
      selectedElement.style.display = "";

      if (elementHoveredOver && elementHoveredOver !== selectedElement) {
      }

      const conRef = containerRef.current
      const relativeY = e.clientY - conRef.getBoundingClientRect().top
      if (relativeY < 120 && conRef.scrollTop > 0 && conRef.scrollHeight <= startScrollHeight){
        conRef.scrollTop -= 10
        start[1] += 10
      }else if (relativeY > conRef.clientHeight - 80 && conRef.scrollTop < conRef.scrollHeight - conRef.clientHeight && conRef.scrollHeight <= startScrollHeight){
        conRef.scrollTop += 10
        start[1] -= 10
      }
    }
    function endElementDrag(e){
      setIsDragging(false)
      setDraggedTo(null)
      selectedElement.style.position = "static"
      selectedElement.style.zIndex = startZ;
      selectedElement.style.opacity = oldOpacity;
      document.body.style.userSelect = ""

      const elementsOverCursor = document.elementFromPoint(e.clientX, e.clientY)
      const elementHoveredOver = elementsOverCursor?.closest("[data-folder]")
      if (elementHoveredOver && elementHoveredOver !== selectedElement){
        // call move folder
        moveFile(joinPath(displayPath,selectedElement.dataset.folder),joinPath(displayPath,elementHoveredOver.dataset.folder))
        setDisplayFiles(displayFiles.filter(item => item.name!=selectedElement.dataset.folder))
      }

      document.removeEventListener("mousemove", dragElement)
      document.removeEventListener("mouseup", endElementDrag)
    }
    document.addEventListener("mousemove",dragElement)
    document.addEventListener("mouseup",endElementDrag)
  }
  useEffect(()=>{
    retrieveFiles()
  },[displayPath])
  useEffect(()=>{
    async function printit() {
      const result = await getRecents()
    }
    printit()
  })
  if (showRecents){
    return (
    <div className={styles.filedisplay}>
      <div className={styles.dash}>
        <button className={styles.back} onClick={()=>setShowRecents(false)}>&lArr;Exit Recents</button>
        <section className={styles.path}>Showing Recent Entries</section>
      </div>
      {recents.map((each,i)=>{
        const createdDate = new Date(each.creation*1000).toLocaleString("en-US", {
          year: "numeric",
          month: "numeric",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true
        }).replace(",", "");
        return <div key={i} className={styles.file_folder_bg} style={{opacity:each.hidden ? .3 : 1}}>
        {each.type == "folder"
         ? 
        <div onClick={(e)=>{e.target.tagName!==("BUTTON") && e.target.tagName!==("IMG")? changePath(each.path):null;setShowRecents(false)}} className={styles.folder}>
          <section className={styles.dirName}>{each.name}</section>
          <section className={styles.dirDate}>{createdDate}</section>
        </div>
         :
        <div onClick={callOpenFile} className={styles.file}>
          <section className={styles.dirName}>{each.name}</section>
          <section className={styles.dirDate}>{createdDate}</section>
        </div>}
        </div>
      })}
    </div>)
  }
  return(
    <div ref={containerRef} className={styles.filedisplay}>
      { !isDragging 
      ?
      <div className={styles.dash}>
        <button className={styles.back} onClick={()=>{changePath(joinPath(displayPath,".."))}}>&lArr;BACK</button>
        <section className={styles.path}>Inside <strong>{displayPath}</strong></section>
        <button onClick={sortFiles}>sort</button>
        <button onClick={()=>setShowHidden(!showHidden)}>{showHidden ? "Unshow Hidden":"Show Hidden"}</button>
      </div>
      :
      <div className={styles.dashMove} data-dash><span style={{color:"white",padding:"5px",borderRadius:"5px"}}>Previous Directory</span></div>
      }
      {displayFiles.map((each,i)=>{
        if (each.hidden && !showHidden){
          return null
        }
        const createdDate = new Date(each.creation*1000).toLocaleString("en-US", {
          year: "numeric",
          month: "numeric",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true
        }).replace(",", "");
        return <div key={i} className={styles.file_folder_bg} style={{opacity:each.hidden ? .3 : 1,}}>
        {each.type == "folder"
         ? 
         draggedTo !== each.name ?
        <div onDoubleClick={(e)=>{const newPath=joinPath(displayPath,each.name);e.target.tagName!==("BUTTON") && e.target.tagName!==("IMG")? changePath(newPath):null;updateRecents(newPath)}} className={styles.folder}
        onMouseDown={startDrag} data-folder={each.name}>
          { isEditing && editingName === each.name 
          ?
          <section className={styles.dirName}>
            <input value={newFileName} onChange={(e)=>setNewFileName(e.target.value)}  type="text" />
            <button onClick={()=>{
              setIsEditing(false);
              renameFile(joinPath(displayPath,each.name),newFileName);
              const newFileNames=[...displayFiles];
              newFileNames[i].name = newFileName;
              setDisplayFiles(newFileNames)}}>Save</button>
            <button onClick={()=>{setIsEditing(false);}}>Exit</button>
          </section>
          :
          <section className={styles.dirName}>{each.name}</section>
          }
          <div className={styles.entryRight}>
            <div className={styles.icons}>
              {isEditing && editingName === each.name?
              null
              :
              <button onClick={()=>{setIsEditing(true);setEditingName(each.name);setNewFileName(each.name)}} title="rename"><img src={editIcon} /></button>
              }
              {
                each.pinned 
                ?
                <button onClick={()=>unpinEntry(each)} title="unpin"><img src={unpinIcon} /></button>
                :
                <button onClick={()=>pinEntry(each)} title="pin"><img src={pinIcon} /></button>
              }
              {
                each.hidden
                ?
                <button onClick={()=>unhideEntry(each)} title="unhide"><img src={unhideIcon}/></button>
                :
                <button onClick={()=>hideEntry(each)} title="hide"><img src={hideIcon} /></button>
              }
            </div>
            <section className={styles.dirDate}>{createdDate}</section>
          </div>
        </div>
          : 
          <div className={styles.folderMove} data-folder={each.name}>Move to {each.name}</div>
         :
        <div onClick={callOpenFile} className={styles.file}>
          { isEditing && editingName === each.name 
          ?
          <section className={styles.dirName}>
            <input value={newFileName} onChange={(e)=>setNewFileName(e.target.value)}  type="text" />
            <button onClick={()=>{
              setIsEditing(false);
              renameFile(joinPath(displayPath,each.name),newFileName);
              const newFileNames=[...displayFiles];
              newFileNames[i].name = newFileName;
              setDisplayFiles(newFileNames)}}>Save</button>
            <button onClick={()=>{setIsEditing(false);}}>Exit</button>
          </section>
          :
          <section className={styles.dirName}>{each.name}</section>
          }
          <div className={styles.entryRight}>
            <div className={styles.icons}>
              {isEditing && editingName === each.name?
              null
              :
              <button onClick={()=>{setIsEditing(true);setEditingName(each.name);setNewFileName(each.name)}} title="rename"><img src={editIcon} /></button>
              }
              <button title="pin"><img src={pinIcon} /></button>
            </div>
            <section className={styles.dirDate}>{createdDate}</section>
          </div>
        </div>}
        </div>
      })}
    </div>
  )
}

export default Filedisplay