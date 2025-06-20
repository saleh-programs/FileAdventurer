import { useContext, useEffect, useRef, useState } from "react"
import styles from "../../styles/Components/Sidebar.module.css"
import {trimPath, getSegments, navigateToReq, getSearchResultsReq, getPinnedReq, getRecentsReq, getDownloadsFolderReq, removePinnedReq, getDocumentsFolderReq, getDefaultPathReq, setDefaultPathReq} from "../../backend/requests";
import ThemeContext from "../assets/ThemeContext";

import treeIcon from "../assets/treeIcon.png"
import stackIcon from "../assets/stackIcon.png"
import sidebarHandle from "../assets/sidebarHandle.png"
import opened from "../assets/opened.png"
import closed from "../assets/closed.png"
import unpinIcon from "../assets/unpinIcon.png"
import frames from "../assets/willowFrames.js"


function Sidebar(){
  const {setRecents, setShowRecents, changePath, openFile, pinned, setPinned,displayFiles, setDisplayFiles} = useContext(ThemeContext)

  const [stackFiles, setStackFiles] = useState([])
  const [stackPath, setStackPath] = useState("C:\\")
  const [defaultPath, setDefaultPath] = useState("C:\\")
  const [stackParents, setStackParents] = useState([])
  const [stackMode, setStackMode] = useState(true)
  const [isLoadingStack, setIsLoadingStack] = useState(false)
  const isLoadingStackRef = useRef(false)

  const [searchLoading, setSearchLoading] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [searchTarget, setSearchTarget] = useState("")
  const lastSearched = useRef(null)
  const searchLoadingRef = useRef(false)

  const sidebarWidthRef = useRef(null)
  const [expanded, setExpanded] = useState(new Set())

  const [frameIndex, setFrameIndex] = useState(0)
  const frameIndexRef = useRef(0)
  const willowRef = useRef(null)
  const willowInfo = useRef({
    speed: 6,
    framerate: 9,
    direction: 1
  })
  // Get pinned entries, default path, and Tree entries on mount
  useEffect(()=>{
    getPinnedItems()
    getDefaultPath()
  },[])


  // gets pinned entries (that's it i guess)
  async function getPinnedItems() {
    const response = await getPinnedReq()
    if (response != null){ 
      setPinned(response)
    }
  }

  //gets the default path the user set previously
  async function getDefaultPath() {
    const response = await getDefaultPathReq()
    if (response != null){
      setDefaultPath(response)
      changeStackPath(response)
    }else{
      changeStackPath(stackPath)
    }
  }
  
  //go to downloads folder in the main display
  async function goToDownloads() {
    const response = await getDownloadsFolderReq()
    if (response != null){
      changePath(response)
    }
  }

  //go to documents folder in the main display
  async function goToDocuments() {
    const response = await getDocumentsFolderReq()
    if (response != null){
      changePath(response)
    }
  }
  // Show recents screen and get list of file/folders objects that are most frequently accessed
  async function goToRecents() {
    const response = await getRecentsReq()
    if (response != null){
      setRecents(response)
      setShowRecents(true)
    }
  }

  // Collapses all children of closed folder (recursively removes them from the "expanded" set)
  function closeChildren(item, expandedSet){
    expandedSet.delete(item.path)
    for (let i=0; i < item.children.length; i++){
      if (expandedSet.has(item.children[i].path)){
        closeChildren(item.children[i], expandedSet)
      }
    }
  }

  // If entry is expanded, this will collapse it and all its children. Otherwise, it was add its children. Happens in "Tree Mode"
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
  }
  //Recursively render all entries in "Tree Mode". Basic idea is to add more spacing from the left as the depth increases (deeply nested children have much spacing)
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
  // Begin Willow animation. Willow is an asset I love to resuse from when I made my first game. 
  function startAnimation(){
    let lastTime = 0
    function moveWillow(time){
      if (!searchLoadingRef.current){
        return
      }
  
      const delta = (time - lastTime) / 1000
      lastTime = time
      //animate willow
      const increment = delta * willowInfo.current.framerate
      frameIndexRef.current += increment
      if (frameIndexRef.current > frames.length){
        frameIndexRef.current = 0
        setFrameIndex(0)
      }else{
        if (Math.floor(frameIndexRef.current - increment) !== frameIndex){
          setFrameIndex(Math.floor(frameIndexRef.current))
        }
      }
      

      // Move Willow
      const containerRect = sidebarWidthRef.current.getBoundingClientRect()
      const currentX = parseFloat(getComputedStyle(willowRef.current).left)
      if (currentX > containerRect.right + 120 && willowInfo.current.direction == 1){
        willowInfo.current.direction = -1
      }else if ((currentX < containerRect.left - 120 && willowInfo.current.direction == -1)){
        willowInfo.current.direction = 1
      }
      willowRef.current.style.left = `${currentX + willowInfo.current.speed * willowInfo.current.direction}px`

      
      requestAnimationFrame(moveWillow)
    }
    requestAnimationFrame(moveWillow)
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

    // Show search screen and get list of entries with matching target substring
  async function startSearch() {
    if (searchTarget === "" || searchTarget === lastSearched.current){
      return
    }

    !searchLoadingRef.current && startAnimation() 
    setShowSearch(true) 
    setSearchLoading(true)
    searchLoadingRef.current = true

    const currentSearch = searchTarget
    lastSearched.current = currentSearch
    const response = await getSearchResultsReq(stackPath, currentSearch)

    if (currentSearch !== lastSearched.current){
      return 
    }
    setSearchLoading(false)
    searchLoadingRef.current = false

    if (response != null){
      setSearchResults(response)
    }
  }

  // Clean up all values used for searching and exit the search screen/animation
  async function endSearch() {
    lastSearched.current = null
    setShowSearch(false);
    setSearchLoading(false)
    setSearchTarget("")
    setSearchResults([])
  }

  //Returns search result with the located substring highlighted (and path truncated as defined by maxLength)
  function getHighlightedPortion(path){
    const target = lastSearched.current.toLowerCase()
    const newPath = path.toLowerCase()
    const targetIdx = newPath.indexOf(target)
    
    const maxLength = 50
    const startingStem = targetIdx+1 > maxLength ? `...${path.slice((targetIdx+1)-maxLength,targetIdx)}`: path.slice(0, targetIdx)
    return <span>
      {startingStem}
      <strong style={{backgroundColor:"yellow",opacity:'.6'}}>{path.slice(targetIdx, targetIdx + target.length)}</strong>
      {path.slice(targetIdx + target.length, path.length)}</span>
  }

    //Sets up event listeners for moving sidebar when the handle is pressed. Has a defined right and left boundary,
  //as well as a collapse boundary to make sidebar disappear.
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

    //Sidebar equivalent of "changePath". Changes the stack path if it isn't loading and sets appropriate suppporting values.
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


    // Navigates to path (if folder) or opens file (if file)
  function clickEntry(each){
      if (each.type == "folder"){
        changePath(each.path);
      }else{
        openFile(each.path)
      }
  }

  return(
    <div className={styles.sidebarWrapper}>
      <div ref={sidebarWidthRef} className={styles.sidebar}>
        <div className={styles.search}>
          <input placeholder={`Search ${stackPath}`} type="text" value={searchTarget} onChange={(e)=>setSearchTarget(e.target.value)}/>
          <button onClick={startSearch}>Search</button>
        </div>
        {showSearch ? 
         <>
          <button onClick={endSearch}>Exit Search</button>
          <span className={styles.searchingMessage}>Searching all entries in {stackPath}</span>
          {searchLoading
            ?
            <div className={styles.willowContainer}>
              <img style={{transform: willowInfo.current.direction == -1 ? "scaleX(-1)": "none"}} ref={willowRef} src={frames[frameIndex]} />
            </div>
            :
            <div className={styles.searchResults} data-scrollable>
              {searchResults.length == 0 && <section>No results found</section>}
              {
                searchResults.map((each)=>{
                  return (
                    <div
                      key={each.path}
                      className={styles.file_folder_bg}>
                      {each.type == "folder"
                        ? 
                        <div 
                        onClick={()=>{changePath(each.path)}}
                        className={styles.folder}
                        data-path={each.path} data-folder>
                          <section title={each.name} className={styles.search_dirName}>{getHighlightedPortion(each.path)}</section>
                        </div> 
                        :
                        <div
                        onClick={()=>openFile(each.path)}
                        className={styles.file}
                        data-path={each.path} data-folder>
                          <section title={each.name}  className={styles.search_dirName}>{getHighlightedPortion(each.path)}</section>
                        </div>}
                      </div>
                  )
                })
              }
            </div>
            }
          </>
        :
        <div className={styles.minitree}  data-scrollable>
          <section className={styles.defaultpath}>Default Path: <strong>{defaultPath}</strong>
          <button onClick={async()=>{setDefaultPath(stackPath);setDefaultPathReq(stackPath)}}>Set as Current</button></section>

          <div className={styles.treeHeader}>
            <section className={styles.path}>Inside {stackPath}</section>

            <section className={styles.modes}>
                <button className= {styles.linearMode} onClick={()=>setStackMode(true)}>
                  <img src={stackIcon} />
                  Stack Mode
                </button>
              <button className={styles.treeMode} onClick={()=>setStackMode(false)}>
                <img src={treeIcon} />
                  Tree Mode
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
              <div
               key={each.path}
              className={styles.file_folder_bg}
              style={{marginLeft:`${(stackParents.length)*10}px`}}>
                {each.type == "folder"
                ? 
                <div 
                onClick={()=>{changeStackPath(each.path)}}
                className={styles.folder}
                data-path={each.path} data-folder>
                  <section title={each.name} className={styles.dirName}>{each.name}</section>
                  <button className={styles.openDir} onClick={(e)=>{e.stopPropagation();changePath(each.path);}}>Open</button>
                </div> 
                :
                <div
                onClick={()=>openFile(each.path)}
                className={styles.file}
                data-path={each.path} data-folder>
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
          <section onClick={goToRecents}>Recents</section>
        </div>
        <div className={styles.pinnedSection} data-scrollable>
          <h2 className={styles.pinnedHeader}>Pinned Folders<hr /></h2>
          <div className={styles.pinnedItems}>
            {
              pinned.map((each,i)=>{
                return (
                <div  key={each.path} className={styles.pinnedEntry} onClick={()=>clickEntry(each)}>
                  <span>{each.name}</span>
                  <button onClick={(e)=>unpinEntry(e, each)}>
                    <img src={unpinIcon} />
                  </button>
                  
                </div>)
              })
            }
          </div>
        </div>
      </div>
      <div className={styles.sidebarHandle}>
        <img src={sidebarHandle} onMouseDown={dragSidebar}/>
      </div>
    </div>
  )
}

export default Sidebar