import { NavLink } from "react-router";

export const Navbar = () =>{
    const navClass = ({ isActive }) => `nav-link ${isActive ? "active" : ""}`;
    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <NavLink className="brand-link" to = '/' aria-label="Music player, home">
                    <span className="brand-mark" aria-hidden="true" /><span className="brand-text">music <span className="serif">player</span></span>
                </NavLink>
        </div>
        <div className="navbar-links">
            <NavLink to = '/' className={navClass}>
                All Songs
            </NavLink>
            <NavLink to = '/vibe' className={navClass}>
                Vibe
            </NavLink>
            <NavLink to = '/playlists' className={navClass}>
                Playlists
            </NavLink>
            <NavLink to = '/about' className={navClass}>
                About
            </NavLink>
        </div>
    </nav>
    )      
};