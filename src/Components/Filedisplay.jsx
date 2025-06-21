import { useContext, useEffect, useRef, useState } from "react"
import styles from "../../styles/Components/Filedisplay.module.css"
import ThemeContext from "../assets/ThemeContext"

import DeleteWarning from "./DeleteWarning"
import {joinPath, getSegments, sortAlphanumeric, sortCreation, sortModified,formatDate, sortedDisplay,
renameFileReq, moveFileReq, addPinnedReq,addHiddenReq, removePinnedReq, removeHiddenReq,createFolderReq, copyFolderReq, deleteEntryReq, 
trimPath} from "../../backend/requests"

import renameIcon from "../assets/renameIcon.png" 
import pinIcon from "../assets/pinIcon.png"
import unpinIcon from "../assets/unpinIcon.png"
import hideIcon from "../assets/hideIcon.png"
import unhideIcon from "../assets/unhideIcon.png"
import folderIcon from "../assets/folderIcon.png"
import fileIcon from "../assets/fileIcon.png"
import trashIcon from "../assets/trashIcon.png" 
import previous from "../assets/previous.png"
import alphanumeric from "../assets/alphanumeric.png"
import creation from "../assets/creation.png"
import modified from "../assets/modified.png"
import emptyFolderIcon from "../assets/createFolder.png"


function Filedisplay(){
  const {displayPath, displayFiles, setDisplayFiles, lazyLoadMax, setLazyLoadMax, lazyLoadMaxRef, setPinned, changePath, openFile, recents,showRecents, setShowRecents, globalCursorPos} = useContext(ThemeContext)
  const [selected, setSelected] = useState(null)
  const selectedRef = useRef(selected)

  const [isRenaming, setIsRenaming] = useState(false)
  const [renameID, setRenameID] = useState(null)
  const [newFileName, setNewFileName] = useState("")

  const [showHidden, setShowHidden] = useState(false)

  const [dragged, setDragged] = useState(null)
  const dragLink = useRef(null)
  const folderElementRef = useRef(null)
  const navigateTimer = useRef(null)
  const mainScrollable = useRef(null)

  const [sortType, setSortType] = useState("alphanumeric")

  const copiedFolder = useRef(null)
  const displayFilesRef = useRef(displayFiles)

  const [zoom, setZoom] = useState(0)
  const zoomRef = useRef(0)
  
  const [deletingID, setDeletingID] = useState(null)


  //on mount, navigate to initial path and set up event listeners for:
  // 1) ctrl + c (to copy folders)
  // 2) ctrl + v (to paste folders)
  // 3) clicks (to unselect when clicking blank spaces)
  useEffect(()=>{
    changePath(displayPath)

    function watchForClicks(e){
      const cursor = getComputedStyle(e.target).cursor;
        if (cursor === "auto") {
          setSelected(null)
          selectedRef.current = null
        }
    }
    function watchForCTRLC(e){
      if (e.ctrlKey && e.key === 'c'){
        copiedFolder.current = selectedRef.current
      }
    }
    function watchForCTRLV(e){
      if (e.ctrlKey && e.key === 'v' && copiedFolder.current){
        createCopy()
      }
    }

    document.addEventListener("click", watchForClicks)
    window.addEventListener("keydown", watchForCTRLC)
    window.addEventListener("keydown", watchForCTRLV)
    return ()=>{

      document.removeEventListener("click",watchForClicks)
      window.removeEventListener("keydown",watchForCTRLC)
      window.removeEventListener("keydown", watchForCTRLV)
    }
  },[])

  // whenever showRecents changes, set up event listeners for main display again (showRecents is the only thing that breaks it)
  // 1) user zooms in / out (change size of entry elements in main scrollable container)
  // 2) scroll (for lazy loading, more files will load the further down the user scrolls in main scrollable container )
  useEffect(()=>{
    const mainScrollableElem = mainScrollable.current
    function watchForZoom(e){
      const maxZoom = 100
      const minZoom = -50
      if (e.ctrlKey){
        e.preventDefault()
        zoomRef.current = (Math.max(minZoom, Math.min(zoomRef.current + e.deltaY,maxZoom)))
        setZoom(zoomRef.current)
        const newFont = 20 + .08 * zoomRef.current
        const newHeight = 60 + .5 *zoomRef.current
        document.querySelectorAll(`.${styles.file_folder_bg}`).forEach(elem=>{
            elem.style.fontSize = `${newFont}px`
            elem.style.height = `${newHeight}px`
        })
      }
    }
    function uponScroll(){
      if (displayFilesRef.current.length > lazyLoadMaxRef.current){
        const maxScroll = mainScrollable.current.scrollHeight - mainScrollable.current.clientHeight

        if (mainScrollable.current.scrollTop > maxScroll - 200 ){
          lazyLoadMaxRef.current = lazyLoadMaxRef.current + 200
          setLazyLoadMax(lazyLoadMaxRef.current)
        }
      }
    }
    mainScrollableElem.addEventListener("scroll", uponScroll)
    mainScrollableElem.addEventListener("wheel", watchForZoom, {passive: false})
    return ()=>{
      mainScrollableElem.removeEventListener("scroll", uponScroll)
      mainScrollableElem.removeEventListener("wheel", watchForZoom, {passive: false})
    }
  },[showRecents])

  // attach reference when state updates (used because state "displayFiles" won't work in event listeners)
  useEffect(()=>{
    displayFilesRef.current = displayFiles
    if (mainScrollable.current){
      mainScrollable.current.scrollTop = 0
    }
    
  },[displayFiles])


  // Makes a copy of an entry & updates display with new value in its sorted position
  async function createCopy() {
    const response = await copyFolderReq(copiedFolder.current, joinPath(copiedFolder.current,".."))
    if (response != null){
      const newFiles = [response,...displayFilesRef.current]
      setDisplayFiles(sortedDisplay(newFiles), sortType)
    }
  }

  // saves entry as pinned and updates display
  async function pinEntry(e, each){
    e.stopPropagation()
    const response = await addPinnedReq(each.path);
    if (response != null){
      setPinned(prev=>[...prev, each]);
      setDisplayFiles(displayFiles.map(item=>{
        return item.path === each.path ? {...item, pinned: true} : item
    }))
    }
  }

  // removes entry from pinned items in backend and updates display
  async function unpinEntry(e, each){
    e.stopPropagation()
    const response = await removePinnedReq(each.path)
    if (response != null){
      setPinned(prev=>prev.filter(item=> item.path !== each.path));
      setDisplayFiles(displayFiles.map(item=>{
        return item.path === each.path ? {...item, pinned: false} : item
      }))
    }
  }

  // saves entry as hidden and updates display
  async function hideEntry(e, each){ 
    e.stopPropagation()
    const response = await addHiddenReq(each.path)
    if (response != null){
      setDisplayFiles(displayFiles.map(item=>{
        return item.path === each.path ? {...item, hidden: true} : item
      }))
    }
  }

   // removes entry from hidden items in backend and updates display
  async function unhideEntry(e, each){
    e.stopPropagation()
    const response = await removeHiddenReq(each.path)
    if (response != null){
      setDisplayFiles(displayFiles.map(item=>{
        return item.path === each.path ? {...item, hidden: false} : item
      }))
    }
  }

  // Allows user to rename (doesn't rename yet)
  function rename(e, each){
    e.stopPropagation()
    setIsRenaming(true);
    setRenameID(each.path);
    setNewFileName(each.name) 
  }

  // saves renamed entry and updates display with its new sorted position
  async function saveRename(e, each){
    e.stopPropagation()
    setIsRenaming(false);
    const response = await renameFileReq(each.path, newFileName);
    if (response != null){
      const newFiles = displayFiles.map(item=>{
        return item.path === each.path ? {...item, name: newFileName, path: response} : item
      })
      setDisplayFiles(sortedDisplay(newFiles), sortType);
    }
  } 

  // moves entry from path 1 to path 2
  async function moveFile(path1, path2) {
    const response = await moveFileReq(path1, path2)
    if (response != null){
        setDisplayFiles(displayFiles.filter(item => item.path !== path1))
    }
  }

  //Creates a folder entry, scrolls to top, and allows user to namme folder
  async function createFolder() {
    const response = await createFolderReq(displayPath)
    if (response != null){
      mainScrollable.current.scrollTop = 0
      setDisplayFiles(prev=>[response ,...prev])
      setIsRenaming(true)
      setRenameID(response.path);
      setNewFileName(response.name) 
    }
  }

  // Deletes an entry and updates display. Only happens after clicking "yes" in a prompt
  async function deleteEntry(each){
    const response = await deleteEntryReq(each.path)
    if (response != null){
      setDisplayFiles(displayFiles.filter(item=> item.path !== each.path))
    }
  }

  // Sets up the drag of an element by adding event listeners for when cursor is moved or mouse is released. 
  function startDrag(event, data){
    const selectedElement = event.currentTarget
    if (selectedRef.current != selectedElement.dataset.path){
      return
    }
    folderElementRef.current = null 
    navigateTimer.current = null

    let done = false;
    let scroll = {goScroll: null, scrollContainer: null};
    let startedDragging = false

    const startCursor = {x:event.clientX, y:event.clientY}

    function dragMove(e) {
      // in case user is clicking and not dragging
      if (!startedDragging){
        const distFromStart = Math.sqrt(Math.abs((e.clientX - startCursor.x)**2 + (e.clientY - startCursor.y)**2 ))
        if (distFromStart > 3){
          setDragged(data)
          startedDragging = true
          document.body.style.userSelect = "none"
        }
      }

      if (!done){
        done = true
        requestAnimationFrame(()=>{
          if (!dragLink.current){
            done = false
            return
          }
          
          // get elements under cursor (the element we drag blocks them, so hide it first)
          dragLink.current.style.display = "none"
          const overElements = document.elementFromPoint(e.clientX, e.clientY)
          dragLink.current.style.display = ""

          // Add css for folder elements underneath cursor & navigate to folders you drag over
          const folderElement = overElements?.closest("[data-folder]")
          if (folderElement !== folderElementRef.current){
            folderElementRef.current?.classList.remove(styles["folder-drop"])
            folderElementRef.current = folderElement

            if (folderElement && (folderElement.dataset.path !== selectedElement.dataset.path)){
              clearTimeout(navigateTimer.current)
              navigateTimer.current = setTimeout(()=>{
                changePath(folderElement.dataset.path)
              }, 1000)
              dragLink.current.style.cursor = "copy"
              folderElement.classList.add(styles["folder-drop"]);
            }else{
              dragLink.current.style.cursor = "no-drop"
            }
          }
          if (!folderElement || scroll.goScroll){
            clearTimeout(navigateTimer.current)
          }
          
          // visually move the element
          const elemAsRect = dragLink.current.getBoundingClientRect();
          dragLink.current.style.left = `${e.clientX - elemAsRect.width / 2}px`;
          dragLink.current.style.top = `${e.clientY - elemAsRect.height / 2}px`;
          
          // For convenient scrolling while dragging. Sets up an interval to avoid having to move cursor to scroll.
          const closestScrollable = overElements?.closest("[data-scrollable]")
          if (closestScrollable){
            const scrollableRect = closestScrollable.getBoundingClientRect();
            const threshold = scrollableRect.height * .2
            
            if (scroll.scrollContainer !== closestScrollable){
              clearInterval(scroll.goScroll)
              scroll.goScroll = null
            }else if (e.clientY < scrollableRect.top + threshold){
              !scroll.goScroll && (scroll.goScroll = setInterval(()=>{closestScrollable.scrollTop -= 10}, 20))
            }else if(e.clientY > scrollableRect.bottom - threshold){
              !scroll.goScroll && (scroll.goScroll = setInterval(()=>{closestScrollable.scrollTop += 10}, 20))
            }else if(scroll.goScroll){
              clearInterval(scroll.goScroll)
              scroll.goScroll = null
            }

          }else{
            clearInterval(scroll.goScroll)
          }
          scroll.scrollContainer = closestScrollable
          done = false;
        })
      }
    }

    const dragStop = ()=>{
      setDragged(null)
      document.body.style.userSelect = ""

      clearTimeout(navigateTimer.current)
      clearInterval(scroll.goScroll)
      scroll.goScroll = null
      scroll.scrollContainer = null
      
      if (folderElementRef.current && folderElementRef.current.dataset.path !== selectedElement.dataset.path){
        folderElementRef.current.classList.remove(styles["folder-drop"])
        moveFile(selectedElement.dataset.path,folderElementRef.current.dataset.path)
      }
      
      document.removeEventListener("mousemove", dragMove)
      document.removeEventListener("mouseup",dragStop)

    }

    document.addEventListener("mousemove", dragMove)
    document.addEventListener("mouseup",dragStop)
  }

  // Select an entry. If already selected, navigates to path (if folder) or opens file (if file)
  function clickEntry(each){
      if (selected != each.path){
        setSelected(each.path)
        selectedRef.current = each.path
        setIsRenaming(false)
        return
      }
      if (each.type == "folder"){
        changePath(each.path);
      }else{
        openFile(each.path)
      }
  }

  // this early return's main difference is that it renders entries from "recents" and not "displayFiles".
  if (showRecents){
    return (
    <div className={styles.filedisplay} data-scrollable>
      <div className={styles.dash}>
        <section className={styles.dashTop}>
          <section className={styles.dashLeft}>
            <button className={styles.back} onClick={()=>setShowRecents(false)}><img src={previous}/>Exit Recents</button>
          </section>
        </section>
        <section className={styles.dashBottom}> 
          Showing Recent Folders
        </section>
      </div>
      <div 
      className={styles.entries}     
      ref={mainScrollable}
      data-scrollable>
        {recents.map((each,i)=>{
          return (
          <div
          key={each.path}
          className={styles.file_folder_bg}
          style={{opacity:each.hidden ? .4 : 1}}>
              <section className={styles.entryIcon}>
                <img src={each.type == "folder" ? folderIcon : fileIcon} />
              </section>
            {each.type == "folder"
            ? 
            <div 
            onClick={()=>clickEntry(each)} 
            onMouseDown={(e)=>{startDrag(e,each)}} 
            className={`${styles.folder} ${dragged===each ? styles["folder-dragged"]: ""} ${selected === each.path ? styles.isSelected : ""}`}
            data-path={each.path} data-folder
            >
              <section className={styles.dirName}>{each.path}</section>
              <section className={styles.dirDate}>{each.name}</section>
            </div>
            :
            <div 
            onClick={()=>clickEntry(each)} 
            className={`${styles.file} ${selected === each.path ? styles.isSelected : ""}`}
            data-path={each.path} data-file
            >
              <section className={styles.dirName}>{each.path}</section>
              <section className={styles.dirDate}>{formatDate(each.creation)}</section>
            </div>
            }
          </div>
          )})}
      </div>
    {dragged && <div ref={dragLink} className={styles.dragged}>{dragged.name}<br/>{dragged.path}</div>}

    </div>)
  }

  return(
    <div className={styles.filedisplay}>
      {deletingID && <DeleteWarning setDeletingID={setDeletingID} deletingId={deletingID} deleteEntry={deleteEntry}/>}

      <div className={styles.dash}>
        <section className={styles.dashTop}>
          <section className={styles.dashContainer1}>
            <button className={styles.back} onClick={()=>{changePath(joinPath(displayPath,".."))}}><img src={previous}/>Previous</button>
          </section>
          <section className={styles.dashContainer2}>
            <button onClick={createFolder}>
              <span>Create Folder</span>
              <img src={emptyFolderIcon}/>     
            </button>
          </section>
          <section className={styles.dashContainer3}>
            <span>Sort by:</span>
            <div className={styles.sortButtons}>
              <button title="Alphanumeric sort" onClick={()=>{setSortType("alphanumeric");setDisplayFiles(sortAlphanumeric(displayFiles))}} className={sortType === "alphanumeric" ? styles.clicked : ""}><img src={alphanumeric}/></button>
              <button title="Sort by date of creation" onClick={()=>{setSortType("creation");setDisplayFiles(sortCreation(displayFiles))}} className={sortType === "creation" ? styles.clicked : ""}><img src={creation}/></button>
              <button title="Sort by last modified" onClick={()=>{setSortType("modified");setDisplayFiles(sortModified(displayFiles))}} className={sortType === "modified" ? styles.clicked : ""}><img src={modified}/></button>
            </div>
            <button className={styles.reverseButton} onClick={()=>setDisplayFiles([...displayFiles].reverse())}>Reverse</button> 
          </section>
          <section className={styles.dashContainer4}>
            <section className={styles.showHidden}>
                Show Hidden
                <input type="checkbox" checked={showHidden} onChange={(e)=>setShowHidden(e.target.checked)}/>
            </section>
          </section>
        
        </section>
        <section className={styles.dashBottom}> 
          {getSegments(displayPath).map((each)=>{
              const path = trimPath(displayPath, each);
              return (
              <span
              key={each}
              onClick={()=>changePath(path)}
              className={styles.parentSegment}
              data-path={path} data-folder>
                {`${each} // `}
              </span>)
          })}
        </section>

      </div>
      
      <div 
      className={styles.entries}     
      ref={mainScrollable}
      data-scrollable>
      {displayFiles.slice(0, lazyLoadMax).map((each,i)=>{
        if (each.hidden && !showHidden){
          return null
        }

        return (
          <div 
          key={each.path} 
          className={styles.file_folder_bg} 
          style={{opacity:each.hidden ? .4 : 1,}}>
            <section className={styles.entryIcon}>
              <img src={each.type == "folder" ? folderIcon : fileIcon} />
            </section>
            {each.type == "folder"
              ? 
            <div 
            onClick={()=>clickEntry(each)}
            onMouseDown={(e)=>{startDrag(e,each)}} 
            className={`${styles.folder} ${dragged===each ? styles["folder-dragged"]: ""} ${selected === each.path ? styles.isSelected : ""}`}
            data-path={each.path} data-folder>

              { isRenaming && renameID === each.path 
              ?
              <section className={styles.dirName}>
                <input value={newFileName} onChange={(e)=>setNewFileName(e.target.value)} onClick={(e)=>e.stopPropagation()}  type="text" onMouseDown={(e)=>e.stopPropagation()}/>
                <button onClick={(e)=>{saveRename(e, each);}}>Save</button>
                <button onClick={(e)=>{e.stopPropagation();setIsRenaming(false);}}>Exit</button>
              </section>
              :
              <section className={styles.dirName}>{each.name}</section>
              }
              <div className={styles.entryRight}>
                <div className={styles.icons}>
                  {isRenaming && renameID === each.path
                  ?
                  null
                  :
                  <button onClick={(e)=>{rename(e,each)}} title="rename"><img src={renameIcon} /></button>
                  }
                  {
                    each.pinned 
                    ?
                    <button onClick={(e)=>unpinEntry(e,each)} title="unpin"><img src={unpinIcon} /></button>
                    :
                    <button onClick={(e)=>pinEntry(e,each)} title="pin"><img src={pinIcon} /></button>
                  }
                  {
                    each.hidden
                    ?
                    <button onClick={(e)=>unhideEntry(e,each)} title="unhide"><img src={unhideIcon}/></button>
                    :
                    <button onClick={(e)=>hideEntry(e,each)} title="hide"><img src={hideIcon} /></button>
                  }
                </div>
                <section className={styles.dirDate}>{formatDate(each.creation)}</section>
              </div>
            </div>
              :
            <div 
            onClick={()=>clickEntry(each)}
             onMouseDown={(e)=>{startDrag(e,each)}} 
            className={`${styles.file} ${selected === each.path ? styles.isSelected : ""}`}
            data-path={each.path} data-file>
              { isRenaming && renameID === each.path 
              ?
              <section className={styles.dirName}>
                <input value={newFileName} onChange={(e)=>setNewFileName(e.target.value)} onClick={(e)=>e.stopPropagation()} type="text" onMouseDown={(e)=>e.stopPropagation()}/>
                <button onClick={(e)=>{saveRename(e, each)}}>Save</button>
                <button onClick={(e)=>{e.stopPropagation();setIsRenaming(false);}}>Exit</button>
              </section>
              :
              <section className={styles.dirName}>{each.name}</section>
              }
              <div className={styles.entryRight}>
                <div className={styles.icons}>
                  {isRenaming && renameID === each.path
                  ?
                  null
                  :
                  <button onClick={(e)=>{rename(e,each)}} title="rename"><img src={renameIcon} /></button>
                  }
                  {
                    each.pinned 
                    ?
                    <button onClick={(e)=>unpinEntry(e,each)} title="unpin"><img src={unpinIcon} /></button>
                    :
                    <button onClick={(e)=>pinEntry(e,each)} title="pin"><img src={pinIcon} /></button>
                  }
                  {
                    each.hidden
                    ?
                    <button onClick={(e)=>unhideEntry(e,each)} title="unhide"><img src={unhideIcon}/></button>
                    :
                    <button onClick={(e)=>hideEntry(e,each)} title="hide"><img src={hideIcon} /></button>
                  }
                </div>
                <section className={styles.dirDate}>{formatDate(each.creation)}</section>
              </div>
            </div>
            }
            <section className={styles.entryIcon}>
              <img className={styles.deleteButton} src={trashIcon} onClick={()=>{!deletingID && setDeletingID(each)}} />
            </section>
          </div>
        )})}
      </div>


      {dragged && <div ref={dragLink} className={styles.dragged}>{dragged.name}<br/>{dragged.path}</div>}
    </div>
  )
}

export default Filedisplay