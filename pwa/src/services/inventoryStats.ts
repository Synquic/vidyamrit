import { apiUrl, authAxios } from "@/services/index";

export interface InventoryStats {
  totalQuantityOnHand: number;
  totalQuantityReserved: number;
  totalQuantityAvailable: number;
}

export const getInventoryStats = async (): Promise<InventoryStats> => {
  const response = await authAxios.get(`${apiUrl}/inventory-stock-summary/sum`);
  return response.data.inventoryData;
};