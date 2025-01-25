import Navigation from './Navigation'  // Fix imports
import Search from './Search'
import UserMenu from './UserMenu'

function Header() {
  return (
    <header>
      <Navigation />
      <div className="rightSection">
        <Search />
        <UserMenu />
      </div>
    </header>
  )
}

export default Header