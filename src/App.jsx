import { useEffect, useState } from 'react'
import { getPinned } from '../backend/requests'
import Sidebar from './Components/Sidebar'
import Filedisplay from './Components/Filedisplay'
import ThemeContext from './assets/ThemeContext'
function App() {
  const [displayPath, setDisplayPath] = useState("C:\\")
  const [pinnedFolders, setPinnedFolders] = useState([])
  const [showRecents, setShowRecents] = useState(false)
  const [recents, setRecents] = useState([])

  useEffect(()=>{
    async function getPinnedItems() {
      const result = await getPinned()
      setPinnedFolders(result.map(item=>{
        const pathAsList = item.split("\\")
        return [pathAsList[pathAsList.length-2],item]
      }))
    }
    getPinnedItems()
  },[])
  return (
    <div className='page-container'>
      <ThemeContext.Provider value={[displayPath, setDisplayPath, pinnedFolders,setPinnedFolders, showRecents, setShowRecents, recents, setRecents]}>
        <Sidebar/>
        <Filedisplay/>
      </ThemeContext.Provider>
    </div>
  )
}

export default App
