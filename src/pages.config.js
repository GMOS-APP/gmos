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
import { lazy } from 'react';
import __Layout from './Layout.jsx';

// Pages are code-split: each becomes its own chunk loaded on demand (behind a
// <Suspense> in App.jsx and WindowContent.jsx), so the initial bundle is just
// the shell + whatever page the user lands on.
const CampaignDashboard = lazy(() => import('./pages/CampaignDashboard'));
const CampaignList = lazy(() => import('./pages/CampaignList'));
const CampaignNotes = lazy(() => import('./pages/CampaignNotes'));
const CampaignMap = lazy(() => import('./pages/CampaignMap'));
const EntityBrowser = lazy(() => import('./pages/EntityBrowser'));
const EntityDetail = lazy(() => import('./pages/EntityDetail'));
const RelationshipMap = lazy(() => import('./pages/RelationshipMap'));
const SessionBrowser = lazy(() => import('./pages/SessionBrowser'));
const SessionPage = lazy(() => import('./pages/SessionPage'));
const RandomTableBrowser = lazy(() => import('./pages/RandomTableBrowser'));
const CampaignTimeline = lazy(() => import('./pages/CampaignTimeline'));
const PlayerView = lazy(() => import('./pages/PlayerView'));
const CampaignSettings = lazy(() => import('./pages/CampaignSettings'));
const About = lazy(() => import('./pages/About'));
const AccountSettings = lazy(() => import('./pages/AccountSettings'));
const EntityTypes = lazy(() => import('./pages/EntityTypes'));
const Upgrade = lazy(() => import('./pages/Upgrade'));
const PartyInventory = lazy(() => import('./pages/PartyInventory'));
const BattleMap = lazy(() => import('./pages/BattleMap'));


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
    "AccountSettings": AccountSettings,
    "EntityTypes": EntityTypes,
    "Upgrade": Upgrade,
    "PartyInventory": PartyInventory,
    "BattleMap": BattleMap,
}

export const pagesConfig = {
    mainPage: "CampaignList",
    Pages: PAGES,
    Layout: __Layout,
};