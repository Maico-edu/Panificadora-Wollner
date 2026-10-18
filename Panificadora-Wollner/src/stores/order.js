import { ref } from 'vue'

// Produto cujo pedido está sendo montado na janela de encomenda (OrderDialog).
const selectedProduct = ref(null)

export function useOrder() {
  return {
    selectedProduct,
    openOrder: (product) => {
      selectedProduct.value = product
    },
    closeOrder: () => {
      selectedProduct.value = null
    },
  }
}
