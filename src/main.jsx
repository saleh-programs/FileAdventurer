import { createRoot } from 'react-dom/client'
import '../styles/index.css'
import App from './App.jsx'
import {getCurrentWindow} from "@tauri-apps/api/window"

createRoot(document.getElementById('root')).render(
    <App />
)

window.onload = () => {getCurrentWindow().show()}
