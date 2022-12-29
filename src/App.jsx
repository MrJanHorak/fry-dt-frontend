import { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';

// Services
import { getUser, logout } from "../services/authService";

// Pages + Components

const App = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(getUser());

  const handleSignupOrLogin = async () => {
    const currentUser = await getUser();
    setUser(currentUser);
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    navigate('/');
  };

  return (
    <div className='App'>
      <Nav user={user} handleLogout={handleLogout} />
      <Routes>
        <Route path='/' element={<Landing user={user} />} />
        <Route
          path='/signin'
          element={<SignIn handleSignupOrLogin={handleSignupOrLogin} />}
        />
        <Route
          path='/signup'
          element={<SignUp handleSignupOrLogin={handleSignupOrLogin} />}
        />
        <Route path='/study' element={<Study user={user} />} />
        <Route path='/spellingbee' element={<Spellingbee user={user} />} />
        <Route path='/profile' element={<Profile user={user} />} />
        <Route path='/admin' element={<Admin user={user} />} />
      </Routes>
    </div>
  );
};

export default App;
