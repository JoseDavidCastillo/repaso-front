import React, { useEffect, useState } from 'react';
import { getFurnitures } from '../api/furnitureApi';
import { createOrder } from '../api/orderApi';
import FurnitureCard from '../components/FurnitureCard';

function OrderPage({ user }) {
  const [furnitures, setFurnitures] = useState([]);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    getFurnitures().then((res) => setFurnitures(res.data));
  }, []);

  const addToCart = (item) => {
    setCart([...cart, item]);
  };

  const handleSubmitOrder = async () => {
    const order = {
      user: { name: user }, // suponiendo estructura simple
      furnitures: cart,
      date: new Date()
    };
    await createOrder(order);
    alert('Orden creada exitosamente');
    setCart([]);
  };

  return (
    <div>
      <h2>Bienvenido, {user}</h2>
      <h3>Selecciona tus muebles</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        {furnitures.map((item, idx) => (
          <FurnitureCard key={idx} item={item} onAdd={addToCart} />
        ))}
      </div>

      <h3>Resumen de la orden ({cart.length})</h3>
      <ul>
        {cart.map((item, idx) => (
          <li key={idx}>
            {item.furnitureType} - {item.type} (${item.price})
          </li>
        ))}
      </ul>
      {cart.length > 0 && <button onClick={handleSubmitOrder}>Enviar Orden</button>}
    </div>
  );
}

export default OrderPage;
