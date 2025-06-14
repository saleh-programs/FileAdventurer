import { useContext, useEffect, useRef, useState } from "react"
import styles from "../../styles/Components/Sidebar.module.css"
import {trimPath, getSegments, navigateToReq, getSearchResultsReq, getPinnedReq, getRecentsReq} from "../../backend/requests";
import ThemeContext from "../assets/ThemeContext";

import treeIcon from "../assets/treeIcon.png"
import stackIcon from "../assets/stackIcon.png"
import sidebarHandle from "../assets/sidebarHandle.png"

function Sidebar(){
  const {setRecents, setShowRecents, changePath, openFile, pinned, setPinned} = useContext(ThemeContext)

  const [stackFiles, setStackFiles] = useState([])
  const [stackPath, setStackPath] = useState("C:\\Users\\Saleh\\")
  const [stackParents, setStackParents] = useState([])
  const [isLoadingStack, setIsLoadingStack] = useState(false)
  const isLoadingStackRef = useRef(false)

  const [searchLoading, setSearchLoading] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [searchTarget, setSearchTarget] = useState("")
  const lastSearched = useRef(null)

  const [refresh, setRefresh] = useState(false)
  const [stackMode, setStackMode] = useState(true)
  const sidebarWidthRef = useRef(null)

  // get pinned entries and Tree entries on mount
  useEffect(()=>{
    getPinnedItems()
    changeStackPath(stackPath)
  },[])


  // gets pinned entries
  async function getPinnedItems() {
    const response = await getPinnedReq()
    if (response != null){ 
      setPinned(response)
    }
  }

  // Get all entries in folder and add those entries as children of that folder
  async function addChildren(item) {
    if (item.children.length > 0){
      item.children = []
    }else{
      const response = await navigateToReq(item.path);
      if (response != null){
        item.children = response
      }
    }
    setRefresh(!refresh)
  }

  // Show search screen and get list of file/folder objects with matching target substring
  async function startSearch() {
    setShowSearch(true) 

    setSearchLoading(true)
    const currentSearch = searchTarget
    lastSearched.current = currentSearch
    const response = await getSearchResultsReq(stackPath, currentSearch)
    if (currentSearch !== lastSearched.current){
      return 
    }
    setSearchLoading(false)

    if (response != null){
      showSearch && setSearchResults(response)
    }
  }

  async function endSearch() {
    setShowSearch(false);
    setSearchLoading(false)
    setSearchTarget("")
    setSearchResults([])
  }

  // Show recents screen and get list of file/folders objects that are most frequently accessed
  async function viewRecents() {
    const response = await getRecentsReq()
    if (response != null){
      setRecents(response)
    }
    setShowRecents(true)
  }

  function renderFiles(each, depth=0){
    return (
      <div key={each.path} className={styles.file_folder_bg} style={{marginLeft:`${depth*10}px`}}>
        {
        each.type == "folder" 
        ? 
        <div
        onClick={()=>{addChildren(each)}}
        className={styles.folder}
        data-folder data-path={each.path}>
          <section title={each.name} className={styles.dirName}>{each.name}</section>
          <button className={styles.openDir} onClick={()=>changePath(each.path)}>Open</button>
        </div> 
        :
        <div onClick={()=>openFile(each.path)} className={styles.file}>
          <section title={each.name} className={styles.dirName}>{each.name}</section>
        </div>
        }
        {each.children.length > 0 && each.children.map(item=>{return renderFiles(item,depth+1)})}
      </div>
    )
          
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

  async function changeStackPath(newPath){
    if (isLoadingStackRef.current || isLoadingStack) return

    setIsLoadingStack(true)
    isLoadingStackRef.current = true

    const response = await navigateToReq(newPath)
    if (response != null){
      setStackPath(newPath)
      setStackFiles(response)

      const parents = getSegments(newPath).slice(0,-1)
      setStackParents(parents)
    }

    setIsLoadingStack(false)
    isLoadingStackRef.current = false
  }

  return(
    <div className={styles.sidebarWrapper}>
      <div ref={sidebarWidthRef} className={styles.sidebar}>
        <div className={styles.search}>
          <input type="text" value={searchTarget} onChange={(e)=>setSearchTarget(e.target.value)}/>
          <button onClick={startSearch}>Search</button>
        </div>
        {showSearch ? 
        <div className={styles.searchResults}>
          <button onClick={endSearch}>Exit Search</button>
          {
            searchResults.map((each)=>{
              return <div key={each.path}>{each.path}</div>
            })
          }
        </div>
        :
        <div className={styles.minitree}  data-scrollable>
          <div className={styles.treeHeader}>
            {
              !stackMode
              ?
                <section className={styles.path}>Inside {stackPath}</section>
              :
                null
            }
            <section className={styles.modes}>
              <button className={styles.treeMode} onClick={()=>setStackMode(true)}>
                <img src={treeIcon} />
                Tree Mode
                </button>
              <button className= {styles.linearMode} onClick={()=>setStackMode(false)}>
                <img src={stackIcon} />
                Stack Mode
                </button>
            </section>
          </div>
          {stackMode
          ?
          <section>
            {
              stackFiles.map(each => {return renderFiles(each)})
            }
          </section>
          :
          <section>
            {stackParents.map((each,i)=>{
            return <div key={i} className={styles.parentDir} onClick={()=>changeStackPath(trimPath(stackPath, each.name))} style={{marginLeft:`${i*10}px`}}>
              {each}
            </div>
          })}
          {stackFiles.map((each,i)=>{
            return <div key={i} className={styles.file_folder_bg} style={{marginLeft:`${(stackParents.length)*10}px`}}>
            {each.type == "folder" ? 
            <div onClick={()=>{changeStackPath(each.path)}} className={styles.folder}>
              <section title={each.name} className={styles.dirName}>{each.name}</section>
              <button className={styles.openDir} onClick={()=>changeStackPath(each.path)}>Open</button>
            </div> :
            <div onClick={()=>openFile(each.path)} className={styles.file}>
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
            pinned.map((each,i)=>{
              return <div  key={i} className={styles.pinnedEntries} onClick={async ()=>{setDisplayPath(each[1])}}>{each[0]}</div>
            })
          }
        </div>
      </div>
      <div className={styles.sidebarHandle}>
        <img src={sidebarHandle} onMouseDown={dragSidebar}/>
      </div>
    </div>
  )
}

export default Sidebar