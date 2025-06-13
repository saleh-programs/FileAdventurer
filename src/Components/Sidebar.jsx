import { useContext, useEffect, useRef, useState } from "react"
import styles from "../../styles/Components/Sidebar.module.css"
import {
  joinPath, trimPath,
  navigateToReq, openFileReq,renameFileReq, getDownloadsFolderReq,getDocumentsFolderReq, getSearchResultsReq,
  addPinnedReq, addHiddenReq, removePinnedReq, removeHiddenReq, getPinnedReq, getHiddenReq, 
  getRecentsReq} from "../../backend/requests";
import ThemeContext from "../assets/ThemeContext";

import treeIcon from "../assets/treeIcon.png"
import stackIcon from "../assets/stackIcon.png"
import sidebarHandle from "../assets/sidebarHandle.png"

function Sidebar(){
  const [displayPath, setDisplayPath, pinnedFolders, setPinnedFolders, showRecents, setShowRecents, recents, setRecents, draggedOver, setDraggedOver] = useContext(ThemeContext)
  const [treeFiles, setTreeFiles] = useState([])
  const [treePath, setTreePath] = useState("C:\\Users\\Saleh\\")
  const [parents, setParents] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchTarget, setSearchTarget] = useState("")
  const [loading,setIsLoading] = useState(false)
  const [refresh, setRefresh] = useState(false)
  const [defaultMode, setDefaultMode] = useState(true)
  const sidebarWidthRef = useRef(null)

  
  useEffect(()=>{
    getPinnedItems()
  },[])


  // gets pinned files/folders
  async function getPinnedItems() {
    const response = await getPinnedReq()
    if (response != null){ 
      setPinnedFolders(response)
    }
  }

  //gets files/folders in current "treePath"
  async function retrieveFiles() {
    const response = await navigateToReq(treePath);
    if (response != null){
      setTreeFiles(response); 
    }
  }

  //
  async function addChildren(item) {
    if (item.children.length > 0){
      item.children = []
    }else{
      const response = await navigateToReq(item.path);
      item.children = response
    }
    setRefresh(!refresh)
  }

  function callOpenFile(e) {
    openFile(joinPath(treePath,e.currentTarget.firstElementChild.textContent))
  }
  async function searchForItem() {
    setIsSearching(true)
    const response = await getSearchResultsReq(treePath, searchTarget)
    setSearchResults(response)
  }
  async function viewRecents() {
    const data = await getRecentsReq()
    setRecents(data)
    setShowRecents(true)
  }
  function renderFiles(each, depth=0){
    return <div key={each.path} className={styles.file_folder_bg} style={{marginLeft:`${depth*10}px`}}>
          {
          each.type == "folder" 
          ? 
          <div onClick={(e)=>{e.target.tagName !== "BUTTON" ? addChildren(each):null}} className={styles.folder}data-folder={each.path}>
            <section title={each.name} className={styles.dirName}>{each.name}</section>
            <button className={styles.openDir} onClick={()=>setDisplayPath(each.path)}>Open</button>
          </div> 
          :
          <div onClick={callOpenFile} className={styles.file}>
            <section title={each.name} className={styles.dirName}>{each.name}</section>
          </div>
          }
          {each.children.length > 0 && each.children.map(item=>{return renderFiles(item,depth+1)})}
          </div>
          
  }
  function dragSidebar(){

    let done = false;
    let startedDragging = false
    const rightBoundary = 800
    const leftBoundary = 200
    const collapseBoundary = 50

    function dragMove(e) {
      // in case user is clicking and not dragging
      if (!startedDragging){
        startedDragging = true
        document.body.style.userSelect = "none"
      }

      if (!done){
        done = true
        requestAnimationFrame(()=>{ 
          sidebarWidthRef.current.style.width = `${e.clientX}px`
          const widthNum = parseInt(sidebarWidthRef.current.style.width)
          
          if(e.clientX <= collapseBoundary){
            sidebarWidthRef.current.style.display = "none"
            done = false
            return
          }else{
            sidebarWidthRef.current.style.display = ""
          }

          if (widthNum >= rightBoundary){
            sidebarWidthRef.current.style.width = `${rightBoundary-1}px`
          }else if (widthNum <= leftBoundary){
            sidebarWidthRef.current.style.width = `${leftBoundary+1}px`
          }
        
          done = false;
        })
      }
    }

    const dragStop = ()=>{
      document.body.style.userSelect = ""
      document.removeEventListener("mousemove", dragMove)
      document.removeEventListener("mouseup",dragStop)

    }

    document.addEventListener("mousemove", dragMove)
    document.addEventListener("mouseup",dragStop)
  }

  useEffect(()=>{
    async function getNewFiles() {
      await retrieveFiles()
      setParents(treePath.split("\\").slice(1,-1))
    }
    getNewFiles()
  },[treePath])
  return(
    <div className={styles.sidebarWrapper}>
      <div ref={sidebarWidthRef} className={styles.sidebar}>
        <div className={styles.search}>
          <input type="text" value={searchTarget} onChange={(e)=>setSearchTarget(e.target.value)}/>
          <button onClick={searchForItem}>Search</button>
        </div>
        {isSearching ? 
        <div className={styles.searchResults}>
          <button onClick={()=>{setIsSearching(false);setSearchResults([]);setSearchTarget("")}}>Exit Search</button>
          {
            searchResults.map((each,i)=>{
              return <div key={i}>{each}</div>
            })
          }
        </div>
        :
        <div className={styles.minitree}  data-scrollable>
          <div className={styles.treeHeader}>
            <section className={styles.path}>Inside {treePath}</section>
            <section className={styles.modes}>
              <button className={styles.treeMode} onClick={()=>setDefaultMode(true)}>
                <img src={treeIcon} />
                Tree Mode
                </button>
              <button className= {styles.linearMode} onClick={()=>setDefaultMode(false)}>
                <img src={stackIcon} />
                Stack Mode
                </button>
            </section>
          </div>
          {defaultMode
          ?
          <section>
            {
              treeFiles.map(each => {return renderFiles(each)})
            }
          </section>
          :
          <section>
            {parents.map((each,i)=>{
            return <div key={i} className={styles.parentDir} onClick={()=>setTreePath(trimPath(treePath, each))} style={{marginLeft:`${i*10}px`}}>
              {each}
            </div>
          })}
          {treeFiles.map((each,i)=>{
            return <div key={i} className={styles.file_folder_bg} style={{marginLeft:`${(parents.length)*10}px`}}>
            {each.type == "folder" ? 
            <div onClick={(e)=>{e.target.tagName !== "BUTTON" ?setTreePath(joinPath(treePath,each.name)):null}} className={styles.folder}>
              <section title={each.name} className={styles.dirName}>{each.name}</section>
              <button className={styles.openDir} onClick={()=>setDisplayPath(joinPath(treePath,each.name))}>Open</button>
            </div> :
            <div onClick={callOpenFile} className={styles.file}>
              <section title={each.name}  className={styles.dirName}>{each.name}</section>
            </div>}
            </div>
          })}
          </section>
          }
          
        </div>
        }
        <div className={styles.commonFolders}>
          <section onClick={async ()=>setDisplayPath(await getDownloadsFolder())}> Downloads</section>
          <section onClick={async ()=>setDisplayPath(await getDocumentsFolder())}> Documents</section>
          <section onClick={viewRecents}>Recents</section>
        </div>
        <div className={styles.pinnedSection} data-scrollable>
          <h2 className={styles.pinnedHeader}>Pinned Folders<hr /></h2>
          {
            pinnedFolders.map((each,i)=>{
              return <div  key={i} className={styles.pinnedEntries} onClick={async ()=>{setDisplayPath(each[1])}}>{each[0]}</div>
            })
          }
        </div>
      </div>
      <div className={styles.sidebarHandle}>
        <img 
        src={sidebarHandle}
        onMouseDown={dragSidebar}/>
      </div>
    </div>
  )
}

export default Sidebar