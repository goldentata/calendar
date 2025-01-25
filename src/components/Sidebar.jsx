function Sidebar(props){
    return (
        <aside>
            <h2>{props.title ? props.title : "Sidebar"}</h2>
            <div className="content">
                {props.children}
            </div>
        </aside>
    )
}

export default Sidebar