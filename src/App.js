import React, { useState } from 'react';
import LoginPage from './pages/LoginPage';
import OrderPage from './pages/OrderPage';

function App() {
  const [user, setUser] = useState(null);

  return (
    <div>
      {user ? (
        <OrderPage user={user} />
      ) : (
        <LoginPage onLogin={(name) => setUser(name)} />
      )}
    </div>
  );
}

export default App;

