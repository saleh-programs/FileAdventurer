import { useContext, useEffect, useLayoutEffect, useRef, useState } from "react"
import styles from "../../styles/Components/Filedisplay.module.css"
import ThemeContext from "../assets/ThemeContext"

import {joinPath, getSegments, sortAlphanumeric, sortCreation, sortModified,formatDate,
renameFileReq, moveFileReq, addPinnedReq,addHiddenReq, removePinnedReq, removeHiddenReq,createFolderReq, copyFolderReq } from "../../backend/requests"

import renameIcon from "../assets/renameIcon.png" 
import pinIcon from "../assets/pinIcon.png"
import unpinIcon from "../assets/unpinIcon.png"
import hideIcon from "../assets/hideIcon.png"
import unhideIcon from "../assets/unhideIcon.png"
import folderIcon from "../assets/folderIcon.png"
import fileIcon from "../assets/fileIcon.png"
import previous from "../assets/previous.png"
import alphanumeric from "../assets/alphanumeric.png"
import creation from "../assets/creation.png"
import modified from "../assets/modified.png"
import emptyFolder from "../assets/createFolder.png"


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
  const [canPaste, setCanPaste] = useState(true)
  const displayFilesRef = useRef(displayFiles)

  const [zoom, setZoom] = useState(0)
  const zoomRef = useRef(0)
  


  useLayoutEffect(()=>{
    if (dragLink.current){
        const elemAsRect = dragLink.current.getBoundingClientRect();
        dragLink.current.style.left = `${globalCursorPos.current.x - elemAsRect.width / 2}px`;
        dragLink.current.style.top = `${globalCursorPos.current.y - elemAsRect.height / 2}px`;    
      }
  },[dragged])
 
  //Gets files on mount
  useEffect(()=>{
    changePath(displayPath)

    function watchForClicks(e){
      const cursor = getComputedStyle(e.target).cursor;

        if (cursor === "auto") {
          setSelected(null)
        }
    }
    function watchForCTRLC(e){
      if (e.ctrlKey && e.key === 'c'){
        copiedFolder.current = selectedRef.current
        console.log(copiedFolder.current)
      }
    }


    function watchForCTRLV(e){
      if (e.ctrlKey && e.key === 'v' && copiedFolder.current && canPaste){
        setCanPaste(false)
        setTimeout(()=>{setCanPaste(true)},1000)
        createCopy()
      }
    }
    const maxZoom = 100
    const minZoom = -50
    function watchForZoom(e){
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
        console.log(zoomRef.current*.01)
      }
    }
    
    const mainScrollableElement = document.querySelector(`.${styles.entries}`)
    mainScrollableElement.addEventListener("wheel", watchForZoom, {passive: false})
    document.addEventListener("click", watchForClicks)
    window.addEventListener("keydown", watchForCTRLC)
    window.addEventListener("keydown", watchForCTRLV)
    return ()=>{
      mainScrollableElement.removeEventListener("wheel", watchForZoom, {passive: false})
      document.removeEventListener("click",watchForClicks)
      window.removeEventListener("keydown",watchForCTRLC)
      window.removeEventListener("keydown", watchForCTRLV)
    }
  },[])

  //set up scrolling event listener on main display for lazy loading 
  useEffect(()=>{
    function uponScroll(){
      if (displayFiles.length > lazyLoadMaxRef.current){
        const maxScroll = mainScrollable.current.scrollHeight - mainScrollable.current.clientHeight
        if (mainScrollable.current.scrollTop > maxScroll - 200 ){
          lazyLoadMaxRef.current = lazyLoadMaxRef.current + 200
          setLazyLoadMax(lazyLoadMaxRef.current)
        }
      }
    }
    mainScrollable.current && mainScrollable.current.addEventListener("scroll", uponScroll)

    return  ()=>{
      mainScrollable.current && mainScrollable.current.removeEventListener("scroll", uponScroll)
    }
  },[displayPath])

  useEffect(()=>{
    selectedRef.current = selected
  },[selected])

    useEffect(()=>{
    displayFilesRef.current = displayFiles
  },[displayFiles])

  async function createCopy() {
    const response = await copyFolderReq(copiedFolder.current, joinPath(copiedFolder.current,".."))
    if (response != null){
      const newFiles = [response,...displayFilesRef.current]
      setDisplayFiles(sortedDisplay(newFiles))
    }
  }

  // pins entry
  async function pinEntry(e, each){
    e.stopPropagation()
    const entryPath = each.path;
    const response = await addPinnedReq(entryPath);
    if (response != null){
      setPinned(prev=>[...prev, each]);
      setDisplayFiles(displayFiles.map(item=>{
        return item.path === entryPath ? {...item, pinned: true} : item
    }))
    }
  }

  // unpins entry
  async function unpinEntry(e, each){
    e.stopPropagation()
    const entryPath = each.path
    const response = await removePinnedReq(entryPath)
    if (response != null){

      setPinned(prev=>prev.filter(item=> item.path !== entryPath));
      setDisplayFiles(displayFiles.map(item=>{
        return item.path === entryPath ? {...item, pinned: false} : item
      }))
    }
  }

  // hides entry
  async function hideEntry(e, each){ 
    e.stopPropagation()
    const entryPath = each.path
    const response = await addHiddenReq(entryPath)
    if (response != null){
      setDisplayFiles(displayFiles.map(item=>{
        return item.path === entryPath ? {...item, hidden: true} : item
      }))
    }
  }

  // unhides entry
  async function unhideEntry(e, each){
    e.stopPropagation()
    const entryPath = each.path
    const response = await removeHiddenReq(entryPath)
    if (response != null){
      setDisplayFiles(displayFiles.map(item=>{
        return item.path === entryPath ? {...item, hidden: false} : item
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

  // saves renamed entry 
  async function saveRename(e, each){
    e.stopPropagation()
    setIsRenaming(false);
    const entryPath = each.path
    const response = await renameFileReq(entryPath, newFileName);
    if (response != null){
      const newFiles = displayFiles.map(item=>{
        return item.path === entryPath ? {...item, name: newFileName} : item
      })
      setDisplayFiles(sortedDisplay(newFiles));
    }
  } 

  // moves file /folder from path 1 to path 2
  async function moveFile(path1, path2) {
    const response = await moveFileReq(path1, path2)
    console.log(path2)
    if (response != null){
      if (path2 !== displayPath){
            console.log(displayPath,path2)

        setDisplayFiles(displayFiles.filter(item => item.path !== path1))
      }else{
            console.log(path2)

        console.log(path2)
        changePath(path2)
      }
      
    }
  }
  function sortedDisplay(files) {
    if (sortType === "alphanumeric"){
      return sortAlphanumeric(files)
    }else if(sortType === "creation"){
      return sortCreation(files)
    }else{
      return sortModified(files)
    }
  }

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

  // Select an entry. If selected, navigates to folder path if folder and opens file if file
  function clickEntry(each){
      if (selected != each.path){
        setSelected(each.path)
        setIsRenaming(false)

        return
      }
      const newPath = each.path;
      if (each.type == "folder"){
        changePath(newPath);
      }else{
        openFile(newPath)
      }
  }

  // Sets up the drag of an element by adding event listeners for when cursor is moved or mouse is released
  function startDrag(event, data){
    const selectedElement = event.currentTarget
    folderElementRef.current = null
    navigateTimer.current = null

    let done = false;
    let scroll = {goScroll: null, scrollContainer: null};
    let startedDragging = false

    function dragMove(e) {
      // in case user is clicking and not dragging
      if (!startedDragging){
        setDragged(data)
        startedDragging = true
        document.body.style.userSelect = "none"
      }

      if (!done){
        done = true
        requestAnimationFrame(()=>{
          if (!dragLink.current){
            done = false
            return
          }
          
          // get elements under cursor (the element we drag blocks them)
          dragLink.current.style.display = "none"
          const overElements = document.elementFromPoint(e.clientX, e.clientY)
          dragLink.current.style.display = ""

          // Add css for folder elements underneath cursor
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
            }else if(!folderElement){
              clearTimeout(navigateTimer.current)
            }else{
              dragLink.current.style.cursor = "no-drop"
            }
          }
          
          // visually move the element
          const elemAsRect = dragLink.current.getBoundingClientRect();
          dragLink.current.style.left = `${e.clientX - elemAsRect.width / 2}px`;
          dragLink.current.style.top = `${e.clientY - elemAsRect.height / 2}px`;
          
          // For convenient scrolling while dragging. Sets up an interval to avoid having to move cursor to scroll
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

  function formPathSegments(){
    const segments = getSegments(displayPath)
    const result = []
    let tempPath = displayPath
    for (let i = segments.length-1; i >= 0; i--){
      result.unshift("\\")
      result.unshift([segments[i], tempPath])
      tempPath = joinPath(tempPath, "..")
    }
    return result
  }
  
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
    {dragged && <div ref={dragLink} className={styles.dragged}>{dragged.name}<br/>{dragged.path}</div>}

    </div>)
  }

  return(
    <div
    className={styles.filedisplay}>
      <div className={styles.dash}>
        <section className={styles.dashTop}>
          <section className={styles.dashContainer1}>
            <button className={styles.back} onClick={()=>{changePath(joinPath(displayPath,".."))}}><img src={previous}/>Previous</button>
          </section>
          <section className={styles.dashContainer2}>
            <button onClick={createFolder}>
              <span>Create Folder</span>
              <img src={emptyFolder}/>     
            </button>
          </section>
          <section className={styles.dashContainer3}>
            <span>Sort by:</span>
            <div className={styles.sortButtons}>
              <button title="Alphanumeric sort" onClick={()=>{setSortType("alphanumeric");setDisplayFiles(sortAlphanumeric(displayFiles))}} className={sortType === "alphanumeric" ? styles.clicked : ""}><img src={alphanumeric}/></button>
              <button title="Sort by date of creation" onClick={()=>{setSortType("creation");setDisplayFiles(sortCreation(displayFiles))}} className={sortType === "creation" ? styles.clicked : ""}><img src={creation}/></button>
              <button title="Sort by last modified" onClick={()=>{setSortType("modified");setDisplayFiles(sortModified(displayFiles))}} className={sortType === "modified" ? styles.clicked : ""}><img src={modified}/></button>
            </div>
          </section>
          <section className={styles.dashContainer4}>
            <section className={styles.showHidden}>
                Show Hidden
                <input type="checkbox" checked={showHidden} onChange={(e)=>setShowHidden(e.target.checked)}/>
            </section>
          </section>
        
        </section>
        <section className={styles.dashBottom}> 
          {formPathSegments().map((each, i)=>{
            if (i % 2 !== 0){
              return (<span key={i}>//</span>)
            }else{
              return (
              <span
              key={i}
              onClick={()=>changePath(each[1])}
              className={styles.parentSegment}
              data-path={each[1]} data-folder>
                {each[0]}
              </span>)
            }
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
                <input className={styles.rename} value={newFileName} onChange={(e)=>setNewFileName(e.target.value)} onClick={(e)=>e.stopPropagation()}  type="text" />
                <section className={styles.renameButtons}>
                  <button onClick={(e)=>{saveRename(e, each);}}>Save</button>
                  <button onClick={(e)=>{e.stopPropagation();setIsRenaming(false);}}>Exit</button>
                </section>
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
                <input value={newFileName} onChange={(e)=>setNewFileName(e.target.value)} onClick={(e)=>e.stopPropagation()} type="text" />
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
          </div>
        )})}
      </div>


      {dragged && <div ref={dragLink} className={styles.dragged}>{dragged.name}<br/>{dragged.path}</div>}
    </div>
  )
}

export default Filedisplay