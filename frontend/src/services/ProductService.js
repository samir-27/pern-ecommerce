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

export const getColors = async () => {
  const { data } = await api.get("/products/colors");
  return data;
}

export const getProductById = async (id) => {
    const { data } = await api.get(`/products/${id}`);
    return data;
};