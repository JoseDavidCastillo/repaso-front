import axios from 'axios';

const API_BASE_URL = 'https://repaso-esdbf8asb6g7apdv.canadacentral-01.azurewebsites.net/api';

export function getFurnitures() {
  return axios.get(`${API_BASE_URL}/furnitures`);
}
