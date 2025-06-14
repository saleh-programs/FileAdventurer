import { useContext, useEffect, useRef, useState } from "react"
import styles from "../../styles/Components/Filedisplay.module.css"
import ThemeContext from "../assets/ThemeContext"

import {
  joinPath, trimPath,
  navigateToReq, openFileReq,renameFileReq,moveFileReq, getDownloadsFolderReq,getDocumentsFolderReq, getSearchResultsReq,
  addPinnedReq, addHiddenReq, removePinnedReq, removeHiddenReq, getPinnedReq, getHiddenReq, updateRecentsReq, 
  getRecentsReq} from "../../backend/requests"

import renameIcon from "../assets/renameIcon.png" 
import pinIcon from "../assets/pinIcon.png"
import unpinIcon from "../assets/unpinIcon.png"
import hideIcon from "../assets/hideIcon.png"
import unhideIcon from "../assets/unhideIcon.png"
import folderIcon from "../assets/folderIcon.png"
import fileIcon from "../assets/fileIcon.png"


function Filedisplay(){
  const {displayPath, displayFiles, setDisplayFiles,pinned, setPinned, changePath, openFile, showRecents} = useContext(ThemeContext)
  const [selected, setSelected] = useState(null)

  const [isRenaming, setIsRenaming] = useState(false)
  const [renameID, setRenameID] = useState(null)
  const [newFileName, setNewFileName] = useState("")

  const [showHidden, setShowHidden] = useState(false)

  const [dragged, setDragged] = useState(null)
  const dragLink = useRef(null)
  const folderElementRef = useRef(null)
  const mainScrollable = useRef(null)

  const [lazyloadMax, setLazyLoadMax] = useState(100);

  useEffect(()=>{
    changePath(displayPath)
  },[])

  useEffect(()=>{console.log(displayFiles.length)},[displayFiles])


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
      console.log(pinned)

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
    console.log(entryPath, newFileName)
    const response = await renameFileReq(entryPath, newFileName);
    if (response != null){
      setDisplayFiles(displayFiles.map(item=>{
        return item.path === entryPath ? {...item, name: newFileName} : item
      }));
    }
  } 

  // moves file /folder from path 1 to path 2
  async function moveFile(path1, path2) {
    const response = await moveFileReq(path1, path2)
    console.log(path1, path2)
    if (response != null){
      setDisplayFiles(displayFiles.filter(item => item.path !== path1))
    }
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


  // Select an entry. If selected, navigates to folder path if folder and opens file if file
  function clickEntry(each){
      if (selected != each.path){
        setSelected(each.path)
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
              dragLink.current.style.cursor = "copy"
              folderElement.classList.add(styles["folder-drop"]);
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


  if (showRecents){
    return (
    <div className={styles.filedisplay} data-scrollable>
      <div className={styles.dash}>
        <button className={styles.back} onClick={()=>setShowRecents(false)}>&lArr;Exit Recents</button>
        <section className={styles.path}>Showing Recent Entries</section>
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
            <section className={styles.dirName}>{each.name}</section>
            <section className={styles.dirDate}>{formatDate(each.creation)}</section>
          </div>
          :
          <div 
          onClick={()=>clickEntry(each)} 
          className={`${styles.file} ${selected === each.path ? styles.isSelected : ""}`}
          data-path={each.path} data-file
          >
            <section className={styles.dirName}>{each.name}</section>
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
    className={styles.filedisplay}
    ref={mainScrollable}
    data-scrollable>
      <div className={styles.dash}>
        <button className={styles.back} onClick={()=>{changePath(joinPath(displayPath,".."))}}>&lArr;BACK</button>
        <section className={styles.path}>Inside <strong>{displayPath}</strong></section>
        <button onClick={()=>setShowHidden(!showHidden)}>{showHidden ? "Unshow Hidden":"Show Hidden"}</button>
      </div>
      
      {displayFiles.slice(0, lazyloadMax).map((each,i)=>{
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

      {dragged && <div ref={dragLink} className={styles.dragged}>{dragged.name}<br/>{dragged.path}</div>}
    </div>
  )
}

export default Filedisplay