import api from "./Axios";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getOrders = async () => {
  const { data } = await api.get(`/orders/myorders`, {
    headers: getAuthHeaders(),
  });
  return data;
};

export const createOrder = async (orderData) => {
  const { data } = await api.post(`/orders`, orderData, {
    headers: getAuthHeaders(),
  });
  return data;
};

export const createPaymentOrder = async (orderData) => {
  const { data } = await api.post(`/orders/payment/order`, orderData, {
    headers: getAuthHeaders(),
  });
  return data;
};

export const verifyPayment = async (paymentData) => {
  const { data } = await api.post(`/orders/payment/verify`, paymentData, {
    headers: getAuthHeaders(),
  });
  return data;
};