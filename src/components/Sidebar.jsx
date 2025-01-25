function Sidebar(props){
    return (
        <aside>
            <h2>Sidebar</h2>
            {props.children}
        </aside>
    )
}

export default Sidebar