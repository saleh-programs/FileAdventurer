import { useEffect, useState } from 'react'
import Sidebar from './Components/Sidebar'
import Filedisplay from './Components/Filedisplay'
import ThemeContext from './assets/ThemeContext'
function App() {
  const [displayPath, setDisplayPath] = useState("C:\\")
  const [draggedOver, setDraggedOver] = useState(null)
  const [pinnedFolders, setPinnedFolders] = useState([])
  const [showRecents, setShowRecents] = useState(false)
  const [recents, setRecents] = useState([])


  return (
    <div className='page-container'>
      <ThemeContext.Provider value={[displayPath, setDisplayPath, pinnedFolders,setPinnedFolders, showRecents, setShowRecents, recents, setRecents, draggedOver, setDraggedOver]}>
        <Sidebar/>
        <Filedisplay/>
      </ThemeContext.Provider>
    </div>
  )
}

export default App
