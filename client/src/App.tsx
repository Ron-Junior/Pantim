import { Component } from 'solid-js';
import { Router, Route } from '@solidjs/router';
import QRCodePage from './pages/QRCodePage';
import PlayerLoginPage from './pages/PlayerLoginPage';
import LeaderSelectionPage from './pages/LeaderSelectionPage';
import LobbyPage from './pages/LobbyPage';
import DefinitionPage from './pages/DefinitionPage';
import { ToastContainer } from './components/Toast';

const App: Component = () => {
  return (
    <>
      <Router>
        <Route path="/" component={QRCodePage} />
        <Route path="/player" component={PlayerLoginPage} />
        <Route path="/lobby" component={LobbyPage} />
        <Route path="/leader" component={LeaderSelectionPage} />
        <Route path="/definition" component={DefinitionPage} />
      </Router>
      <ToastContainer />
    </>
  );
};

export default App;
