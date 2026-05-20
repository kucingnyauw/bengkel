import Client from "@lib/client.js";

export const createProduct = async (formData) => {
  const { data } = await Client.post("/products", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
};

export const getProducts = async (params) => {
  const response = await Client.get("/products", { params });
  return { data: response.data, metadata: response.metadata };
};

export const getServices = async () => {
  const { data } = await Client.get("/products/services");
  return data;
};

export const getSpareparts = async () => {
  const { data } = await Client.get("/products/spareparts");
  return data;
};

export const getLowStockProducts = async (params) => {
  const { data } = await Client.get("/products/low-stock", { params });
  return data;
};

export const checkSkuAvailability = async (sku, excludeId = null) => {
  const { data } = await Client.get("/products/check/sku", {
    params: { sku, excludeId },
  });
  return data;
};

export const getProductBySku = async (sku) => {
  const { data } = await Client.get(`/products/sku/${sku}`);
  return data;
};

export const getProductById = async (id) => {
  const { data } = await Client.get(`/products/${id}`);
  return data;
};

export const updateProduct = async (id, formData) => {
  const { data } = await Client.put(`/products/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
};

export const updateProductStatus = async (id, payload) => {
  const { data } = await Client.patch(`/products/${id}/status`, payload);
  return data;
};

export const adjustStock = async (id, payload) => {
  const { data } = await Client.patch(`/products/${id}/stock`, payload);
  return data;
};