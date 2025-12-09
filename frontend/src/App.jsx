import React from 'react';
import "./App.css";
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Signup from './Layout/signup';
import Signin from './Layout/signin';
import Messages from './pages/Messages';
import Friends from './pages/Friends';
import FriendState from './context/FriendState';
import SearchResult from './components/SearchResult';
import Profile from './pages/Profile';

const AppWrapper = () => {
  const location = useLocation();

  // Hide Navbar on signup and signin pages
  const hideNavbar = location.pathname === '/' || location.pathname === '/signin';

  return (
    <>
      {!hideNavbar && <Navbar />}
      <FriendState>
      <Routes>
        <Route path="/" element={<Signup />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/home" element={<Home />} />
        <Route path="/message" element={<Messages />} />
        <Route path="/friend" element={<Friends />} />
        <Route path="/search-result/:searchQuery" element={<SearchResult />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
      </FriendState>
    </>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AppWrapper />
    </BrowserRouter>
  );
};

export default App;
