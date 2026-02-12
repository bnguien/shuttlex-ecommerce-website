import React, { useEffect, useState } from 'react'
import styles from './FilterSideBar.module.css'
import api from '../../api'

function FilterSideBar({ category, filters, onChange }) {
  const [brands, setBrands] = useState([])
  const [sizes, setSizes] = useState([])

  const getCategoryType = (categorySlug) => {
    if (!categorySlug) return null
    if (categorySlug.includes('racket')) return 'racket'
    if (categorySlug.includes('apparel') || categorySlug.includes('clothes')) return 'clothes'
    if (categorySlug.includes('shoes')) return 'shoes'
    return null
  }

  useEffect(() => {
    api.get("brands/")
      .then(res => setBrands(res.data))
      .catch(err => console.error(err))
  }, [])

  useEffect(() => {
    const sizeType = getCategoryType(category)
    if (sizeType) {
      api.get("sizes/", { params: { type: sizeType } })
        .then(res => setSizes(res.data))
        .catch(err => console.error(err))
    } else {
      setSizes([])
    }
  }, [category])

  useEffect(() => {
    if (!filters || !onChange) return
    if (sizes.length === 0) {
      if (filters.sizes.length > 0) {
        onChange(prev => ({
          ...prev,
          sizes: []
        }))
      }
      return
    }
    const available = new Set(sizes.map(size => String(size.id ?? size.name)))
    const nextSizes = filters.sizes.filter(value => available.has(String(value)))
    if (nextSizes.length !== filters.sizes.length) {
      onChange(prev => ({
        ...prev,
        sizes: nextSizes
      }))
    }
  }, [sizes, filters, onChange])

  const toggleListValue = (list, value) =>
    list.includes(value) ? list.filter(item => item !== value) : [...list, value]

  return (
    <div className={`d-flex flex-column p-4 h-100 ${styles.filterSidebar}`} style={{backgroundColor: "#f8f9fa"}}>
      <div className="mb-4">
        <h5 className="">Price Range</h5>
        <div className="d-flex align-items-center gap-2">
          <input
            type="number"
            className="form-control"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(event) =>
              onChange(prev => ({
                ...prev,
                minPrice: event.target.value
              }))
            }
          />
          <span>-</span>
          <input
            type="number"
            className="form-control"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(event) =>
              onChange(prev => ({
                ...prev,
                maxPrice: event.target.value
              }))
            }
          />
        </div>
      </div>
      
      <div className="mb-4">
        <h5 className="">Brand</h5>
        {brands.map((brand, index) => {
          const brandValue = brand.slug || brand.name
          return (
            <div className="form-check" key={brand.id || index}>
              <input
                className="form-check-input"
                type="checkbox"
                value={brandValue}
                id={`brand${index}`}
                checked={filters.brands.includes(brandValue)}
                onChange={() =>
                  onChange(prev => ({
                    ...prev,
                    brands: toggleListValue(prev.brands, brandValue)
                  }))
                }
              />
              <label className="form-check-label" htmlFor={`brand${index}`}>
                {brand.name}
              </label>
            </div>
          )
        })}
      </div>

      {sizes.length > 0 && (
        <div className="mb-4">
          <h5 className="">Size</h5>
          {sizes.map((size, index) => {
            const sizeValue = String(size.id ?? size.name)
            return (
              <div className="form-check" key={size.id || index}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  value={sizeValue}
                  id={`size${index}`}
                  checked={filters.sizes.includes(sizeValue)}
                  onChange={() =>
                    onChange(prev => ({
                      ...prev,
                      sizes: toggleListValue(prev.sizes, sizeValue)
                    }))
                  }
                />
                <label className="form-check-label" htmlFor={`size${index}`}>
                  {size.name}
                </label>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default FilterSideBar