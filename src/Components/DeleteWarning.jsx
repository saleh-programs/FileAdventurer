import { useEffect } from "react"
import styles from "../../styles/Components/DeleteWarning.module.css"

function DeleteWarning({setDeletingID, deletingId, deleteEntry}){
  return(
    <div className={styles.deleteWarning}>
      <section className={styles.message}>
        Are you absolutely sure you want to delete: <br/> <span style={{color:'red',fontWeight:"bold"}}>{deletingId.path}</span>?
      </section>
      <section className={styles.buttons}>
        <button onClick={()=>{deleteEntry(deletingId);setDeletingID(null);}}>Yes</button>
        <button onClick={()=>setDeletingID(null)}>No</button>
      </section>
    </div>
  )
}

export default DeleteWarning