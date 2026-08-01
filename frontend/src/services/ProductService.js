import api from "./axios";

export const getProducts = async () => {
  const { data } = await api.get("/products");
  console.log("Fetched products:", data);
  return data;
};

export const getCategories = async () => {
  const { data } = await api.get("/products/categories");
  return data;
};