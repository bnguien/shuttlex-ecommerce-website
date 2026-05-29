import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api'

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('categories/')
      return Array.isArray(res.data) ? res.data : []
    },
    staleTime: 10 * 60 * 1000, // 10 minutes cache
  })
}

export const useBrands = () => {
  return useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const res = await api.get('brands/')
      return Array.isArray(res.data) ? res.data : []
    },
    staleTime: 10 * 60 * 1000,
  })
}

export const useSizes = () => {
  return useQuery({
    queryKey: ['sizes'],
    queryFn: async () => {
      const res = await api.get('sizes/')
      return Array.isArray(res.data) ? res.data : []
    },
    staleTime: 60 * 60 * 1000, // 1 hour cache
  })
}

export const useProducts = (params) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const res = await api.get('products', { params })
      if (Array.isArray(res.data)) {
        return {
          results: res.data,
          count: res.data.length,
          total_pages: 1
        }
      }
      return {
        results: res.data.results || [],
        count: res.data.count || 0,
        total_pages: res.data.total_pages || 1
      }
    },
    keepPreviousData: true,
    staleTime: 1 * 60 * 1000, // 1 min cache for products
  })
}

export const useCreateProduct = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (formData) => {
      const res = await api.post("create_product/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products'])
    }
  })
}

export const useUpdateProduct = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, formData }) => {
      const res = await api.patch(`update_product/${id}/`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products'])
    }
  })
}

export const useDeleteProduct = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`delete_product/${id}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products'])
    }
  })
}

export const useCreateVariant = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ productId, payload }) => {
      const res = await api.post(`create_variant/${productId}/`, payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products'])
    }
  })
}

export const useUpdateVariant = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await api.patch(`update_variant/${id}/`, payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products'])
    }
  })
}

export const useDeleteVariant = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`delete_variant/${id}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products'])
    }
  })
}
