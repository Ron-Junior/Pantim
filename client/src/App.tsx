import { Component } from 'solid-js';
import { Router, Route } from '@solidjs/router';
import QRCodePage from './pages/QRCodePage';
import PlayerLoginPage from './pages/PlayerLoginPage';
import { ToastContainer } from './components/Toast';

const App: Component = () => {
  return (
    <>
      <Router>
        <Route path="/" component={QRCodePage} />
        <Route path="/player" component={PlayerLoginPage} />
      </Router>
      <ToastContainer />
    </>
  );
};

export default App;
