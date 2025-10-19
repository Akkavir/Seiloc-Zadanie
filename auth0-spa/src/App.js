import logo from './logo.svg';
import './App.css';
import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';

function LoginButton() {
  const { loginWithRedirect } = useAuth0();
  return <button onClick={() => loginWithRedirect()}>Zaloguj</button>;
}

function LogoutButton() {
  const { logout } = useAuth0();
  return <button onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>Wyloguj</button>;
}

// komponent pokazujący dane użytkownika
function Profile() {
  const { user, isAuthenticated, isLoading } = useAuth0();
  if (isLoading) return <div>Ładowanie profilu...</div>;
  if (!isAuthenticated) return <div>Nie jesteś zalogowany.</div>;
  return (
    <div>
      <h3>Profil użytkownika</h3>
      <p><strong>Name:</strong> {user.name}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Sub:</strong> {user.sub}</p>
    </div>
  );
}

// komponent do wywołania API chronionych przez Auth0
function CallApi() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  const [apiResp, setApiResp] = React.useState(null);
  const [adminResp, setAdminResp] = React.useState(null);
  const [err, setErr] = React.useState(null);

  // wywołanie /api/profile
  async function callProtected() {
    setErr(null);
    setApiResp(null);
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: process.env.REACT_APP_AUTH0_AUDIENCE }
      });

      const resp = await fetch('http://localhost:4000/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`${resp.status} ${text}`);
      }

      const data = await resp.json();
      setApiResp(data);
    } catch (e) {
      setErr(e.message);
    }
  }

  // wywołanie /api/admin
  async function callAdmin() {
    setErr(null);
    setAdminResp(null);
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: process.env.REACT_APP_AUTH0_AUDIENCE }
      });

      const resp = await fetch('http://localhost:4000/api/admin', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.message || `HTTP ${resp.status}`);

      setAdminResp(data);
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div>
      <h3>Wywołaj chronione API</h3>
      {!isAuthenticated ? (
        <div>Zaloguj się, aby wywołać API</div>
      ) : (
        <>
          <button onClick={callProtected}>Pobierz /api/profile</button>
          <button onClick={callAdmin} style={{ marginLeft: 10 }}>Pobierz /api/admin</button>
        </>
      )}

      {err && <pre style={{ color: 'red', whiteSpace: 'pre-wrap' }}>{err}</pre>}

      {apiResp && (
        <>
          <h4>/api/profile</h4>
          <pre style={{ background: '#f4f4f4', padding: 10 }}>{JSON.stringify(apiResp, null, 2)}</pre>
        </>
      )}

      {adminResp && (
        <>
          <h4>/api/admin</h4>
          <pre style={{ background: '#f4f4f4', padding: 10 }}>{JSON.stringify(adminResp, null, 2)}</pre>
        </>
      )}
    </div>
  );
}

export default function App() {
  const { isAuthenticated } = useAuth0();
  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <h1>Auth0 demo</h1>
      <div style={{ marginBottom: 10 }}>
        {isAuthenticated ? <LogoutButton /> : <LoginButton />}
      </div>
      <Profile />
      <hr />
      <CallApi />
      <hr />
    </div>
  );
}
