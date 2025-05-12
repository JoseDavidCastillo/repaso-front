import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (name.trim() === '') {
      setError('Por favor, digita un nombre.');
      return;
    }

    try {
      const response = await fetch('https://repaso-esdbf8asb6g7apdv.canadacentral-01.azurewebsites.net/api/users');
      const users = await response.json();

      const existingUser = users.find((u) => u.name.toLowerCase() === name.toLowerCase());

      let user;

      if (existingUser) {
        user = existingUser;
        console.log('Usuario existente:', user);
        console.log(user.id);
      } else {
        const postResponse = await fetch('https://repaso-esdbf8asb6g7apdv.canadacentral-01.azurewebsites.net/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name }),
        });

        if (!postResponse.ok) {
          throw new Error('Error al crear usuario');
        }

        user = await postResponse.json();
        console.log('Usuario creado:', user);
      }

      localStorage.setItem('user', JSON.stringify(user));
      navigate('/order');

    } catch (err) {
      console.error(err);
      setError('Error en la conexión con el servidor.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Bienvenido</h1>
        <input
          type="text"
          placeholder="Tu nombre"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          style={styles.input}
        />
        <button onClick={handleLogin} style={styles.button}>
          Iniciar sesión
        </button>
        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(to right, #667eea, #764ba2)',
    fontFamily: 'Arial, sans-serif',
  },
  card: {
    background: '#fff',
    padding: '2rem',
    borderRadius: '1rem',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center',
  },
  title: {
    marginBottom: '1.5rem',
    color: '#333',
  },
  input: {
    padding: '0.75rem',
    width: '100%',
    marginBottom: '1rem',
    borderRadius: '0.5rem',
    border: '1px solid #ccc',
    fontSize: '1rem',
  },
  button: {
    padding: '0.75rem',
    width: '100%',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  error: {
    marginTop: '1rem',
    color: 'red',
    fontSize: '0.9rem',
  },
};

export default LoginPage;
