import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

export function createOrder(orderData) {
  return axios.post(`${API_BASE_URL}/orders`, orderData);
}
