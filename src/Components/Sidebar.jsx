import { useContext, useEffect, useRef, useState } from "react"
import styles from "../../styles/Components/Sidebar.module.css"
import {trimPath, getSegments, navigateToReq, getSearchResultsReq, getPinnedReq, getRecentsReq, getDownloadsFolderReq, getDocumentsFolderReq} from "../../backend/requests";
import ThemeContext from "../assets/ThemeContext";

import treeIcon from "../assets/treeIcon.png"
import stackIcon from "../assets/stackIcon.png"
import sidebarHandle from "../assets/sidebarHandle.png"
import opened from "../assets/opened.png"
import closed from "../assets/closed.png"

function Sidebar(){
  const {setRecents, setShowRecents, changePath, openFile, pinned, setPinned} = useContext(ThemeContext)

  const [stackFiles, setStackFiles] = useState([])
  const [stackPath, setStackPath] = useState("C:\\Users\\Saleh")
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

  const [expanded, setExpanded] = useState(new Set())

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

  //go to downloads folder
  async function goToDownloads() {
    const response = await getDownloadsFolderReq()
    if (response != null){
      changePath(response)
    }
  }

  //go to documents folder
  async function goToDocuments() {
    const response = await getDocumentsFolderReq()
    console.log(response)
    if (response != null){
      changePath(response)
    }
  }

  // Collapses all children of closed folder
  function closeChildren(item, expandedSet){
    expandedSet.delete(item.path)
    for (let i=0; i < item.children.length; i++){
      if (expandedSet.has(item.children[i].path)){
        closeChildren(item.children[i], expandedSet)
      }
    }
  }

  // Get all entries in folder and add those entries as children of that folder
  async function toggleChildren(item) {
    if (expanded.has(item.path)){
      const newExpandedSet = new Set(expanded)
      closeChildren(item, newExpandedSet)
      setExpanded(newExpandedSet)
      item.children = []
    }else{
      const response = await navigateToReq(item.path);
      if (response != null){
        item.children = response

        setExpanded(prev=>{
          const newSet = new Set(prev)
          newSet.add(item.path)
          return newSet
        })
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
      <div key={each.path} className={styles.file_folder_bg} style={{marginLeft:depth===0 ? "0px" :`20px`}}>
        { 
        each.type == "folder" 
        ? 
        <div className={styles.folderWrapper}>
          <span className={styles.toggleOpen}><img src={expanded.has(each.path) ? opened: closed}/></span>
          <div
          onClick={()=>{toggleChildren(each)}}
          className={styles.folder}
          data-path={each.path} data-folder>
            <section title={each.name} className={styles.dirName}>{each.name}</section>
            <button className={styles.openDir} onClick={(e)=>{e.stopPropagation(); changePath(each.path);}}>Open</button>
          </div> 
        </div>
        :
        <div
        onClick={()=>openFile(each.path)}
        className={styles.file}
        data-path={each.path} data-file>
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

      const segments = getSegments(newPath)
      setStackParents(segments.slice(0,segments.length))
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
        <div className={styles.searchResults} data-scrollable>
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
            { stackMode ? <section className={styles.path}>Inside {stackPath}</section> : null }

            <section className={styles.modes}>
              <button className={styles.treeMode} onClick={()=>setStackMode(false)}>
                <img src={treeIcon} />
                Tree Mode
                </button>
              <button className= {styles.linearMode} onClick={()=>setStackMode(true)}>
                <img src={stackIcon} />
                Stack Mode
                </button>
            </section>
          </div>
          {!stackMode
          ?
          <section className={styles.treemode}>
            {
              stackFiles.map(each => {return renderFiles(each)})
            }
          </section>
          :
          <section>
            {stackParents.map((each,i)=>{
              return (
              <div 
              key={each}
              className={styles.parentDir}
              onClick={()=>{each !== "C:" ? changeStackPath(trimPath(stackPath, each)) : changeStackPath("C:\\")}}
              style={{marginLeft:`${i*10}px`}}> 
                {each}
              </div>
              )})}
            {stackFiles.map((each,i)=>{
              return ( 
              <div key={each.path} className={styles.file_folder_bg} style={{marginLeft:`${(stackParents.length)*10}px`}}>
                {each.type == "folder"
                ? 
                <div onClick={()=>{changeStackPath(each.path)}} className={styles.folder}>
                  <section title={each.name} className={styles.dirName}>{each.name}</section>
                  <button className={styles.openDir} onClick={(e)=>{e.stopPropagation();changePath(each.path);}}>Open</button>
                </div> 
                :
                <div onClick={()=>openFile(each.path)} className={styles.file}>
                  <section title={each.name}  className={styles.dirName}>{each.name}</section>
                </div>}
              </div>
              )})}
          </section>
          }
          
        </div>
        }
        <div className={styles.commonFolders}>
          <section onClick={goToDownloads}> Downloads</section>
          <section onClick={goToDocuments}> Documents</section>
          <section onClick={viewRecents}>Recents</section>
        </div>
        <div className={styles.pinnedSection} data-scrollable>
          <h2 className={styles.pinnedHeader}>Pinned Folders<hr /></h2>
          {
            pinned.map((each,i)=>{
              return <div  key={each.path} className={styles.pinnedEntries} onClick={()=>changePath(each.path)}>{each.name}</div>
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