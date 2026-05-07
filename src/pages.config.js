/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import CampaignDashboard from './pages/CampaignDashboard';
import CampaignList from './pages/CampaignList';
import CampaignNotes from './pages/CampaignNotes';
import CampaignMap from './pages/CampaignMap';
import EntityBrowser from './pages/EntityBrowser';
import EntityDetail from './pages/EntityDetail';
import RelationshipMap from './pages/RelationshipMap';
import SessionBrowser from './pages/SessionBrowser';
import SessionPage from './pages/SessionPage';
import RandomTableBrowser from './pages/RandomTableBrowser';
import CampaignTimeline from './pages/CampaignTimeline';
import PlayerView from './pages/PlayerView';
import CampaignSettings from './pages/CampaignSettings';
import About from './pages/About';
import __Layout from './Layout.jsx';


export const PAGES = {
    "CampaignDashboard": CampaignDashboard,
    "CampaignList": CampaignList,
    "CampaignNotes": CampaignNotes,
    "CampaignMap": CampaignMap,
    "EntityBrowser": EntityBrowser,
    "EntityDetail": EntityDetail,
    "RelationshipMap": RelationshipMap,
    "SessionBrowser": SessionBrowser,
    "SessionPage": SessionPage,
    "RandomTableBrowser": RandomTableBrowser,
    "CampaignTimeline": CampaignTimeline,
    "PlayerView": PlayerView,
    "CampaignSettings": CampaignSettings,
    "About": About,
}

export const pagesConfig = {
    mainPage: "CampaignList",
    Pages: PAGES,
    Layout: __Layout,
};