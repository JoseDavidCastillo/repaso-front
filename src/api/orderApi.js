import axios from 'axios';

const API_BASE_URL = 'https://repaso-esdbf8asb6g7apdv.canadacentral-01.azurewebsites.net/api';

export function createOrder(orderData) {
  return axios.post(`${API_BASE_URL}/orders`, orderData);
}
