import api from "./axios";

export const getProducts = async (params = {}) => {
    
  const queryString = new URLSearchParams(params).toString();
  
  const { data } = await api.get(`/products?${queryString}`);
  return data; 
};
export const getCategories = async () => {
  const { data } = await api.get("/products/categories");
  return data;
};