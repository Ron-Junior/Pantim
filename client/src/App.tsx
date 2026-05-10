import { Component } from 'solid-js';
import { Router, Route } from '@solidjs/router';
import QRCodePage from './pages/QRCodePage';
import PlayerLoginPage from './pages/PlayerLoginPage';

const App: Component = () => {
  return (
    <Router>
      <Route path="/" component={QRCodePage} />
      <Route path="/player" component={PlayerLoginPage} />
    </Router>
  );
};

export default App;
