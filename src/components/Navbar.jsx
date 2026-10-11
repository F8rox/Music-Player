import { NavLink } from "react-router";

export const Navbar = () =>{
    const navClass = ({ isActive }) => `nav-link ${isActive ? "active" : ""}`;
    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <NavLink className="brand-link" to = '/'>
                    🎵MUSIC PLAYER
                </NavLink>
        </div>
        <div className="navbar-links">
            <NavLink to = '/' className={navClass}>
                All Songs
            </NavLink>
            <NavLink to = '/playlists' className={navClass}>
                Playlists
            </NavLink>
        </div>
    </nav>
    )      
};