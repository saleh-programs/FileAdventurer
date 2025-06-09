import { useContext, useEffect, useState } from "react"
import styles from "../../styles/Components/Sidebar.module.css"
import {
  joinPath, trimPath,
  navigateTo, openFile,renameFile, getDownloadsFolder,getDocumentsFolder, getSearchResults,
  addPinned, addHidden, removePinned, removeHidden, getPinned, getHidden, 
  getRecents} from "../../backend/requests";
import ThemeContext from "../assets/ThemeContext";

function Sidebar(){
  const [displayPath, setDisplayPath, pinnedFolders, setPinnedFolders, showRecents, setShowRecents, recents, setRecents] = useContext(ThemeContext)
  const [treeFiles, setTreeFiles] = useState([])
  const [treePath, setTreePath] = useState("C:\\Users\\Saleh\\")
  const [parents, setParents] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchTarget, setSearchTarget] = useState("")
  const [loading,setIsLoading] = useState(false)

  async function retrieveFiles() {
    const response = await navigateTo(treePath);
    setTreeFiles(response);
  }
  function callOpenFile(e) {
    openFile(joinPath(treePath,e.currentTarget.firstElementChild.textContent))
  }
  async function searchForItem() {
    setIsSearching(true)
    const response = await getSearchResults(treePath, searchTarget)
    setSearchResults(response)
  }
  async function viewRecents() {
    const data = await getRecents()
    setRecents(data)
    setShowRecents(true)
  }

  useEffect(()=>{
    async function getNewFiles() {
      await retrieveFiles()
      setParents(treePath.split("\\").slice(1,-1))
    }
    getNewFiles()
  },[treePath])
  return(
    <div className={styles.sidebar}>
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
      <div className={styles.minitree}>
        <section>Inside {treePath}</section>
        {parents.map((each,i)=>{
          return <div key={i} className={styles.parentDir} onClick={()=>setTreePath(trimPath(treePath, each))} style={{marginLeft:`${i*10}px`}}>
            {each}
          </div>
        })}
        {treeFiles.map((each,i)=>{
          return <div key={i} className={styles.file_folder_bg} style={{marginLeft:`${(parents.length)*10}px`}}>
          {each.type == "folder" ? 
          <div onClick={(e)=>{e.target.tagName !== "BUTTON" ?setTreePath(joinPath(treePath,each.name)):null}} className={styles.folder}>
            <section className={styles.dirName}>{each.name}</section>
            <button onClick={()=>setDisplayPath(joinPath(treePath,each.name))}>Go</button>
          </div> :
          <div onClick={callOpenFile} className={styles.file}>
            <section  className={styles.dirName}>{each.name}</section>
          </div>}
          </div>
        })}
      </div>
      }
      <div className={styles.commonFolders}>
        <section onClick={async ()=>setDisplayPath(await getDownloadsFolder())}> Downloads</section>
        <section onClick={async ()=>setDisplayPath(await getDocumentsFolder())}> Documents</section>
        <section onClick={viewRecents}>Recents</section>
      </div>
      <div className={styles.pinnedSection}>
        <h2 className={styles.pinnedHeader}>Pinned Folders<hr /></h2>
        {
          pinnedFolders.map((each,i)=>{
            return <div  key={i} className={styles.pinnedEntries} onClick={async ()=>{setDisplayPath(each[1])}}>{each[0]}</div>
          })
        }
      </div>
    </div>
  )
}

export default Sidebar