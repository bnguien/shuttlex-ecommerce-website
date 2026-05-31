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

  const sizeType = getCategoryType(category)
  const inferredSizeType =
    sizes.length > 0 && new Set(sizes.map((size) => size.type)).size === 1
      ? sizes[0].type
      : null
  const resolvedSizeType = sizeType || inferredSizeType

  useEffect(() => {
    if (!category) {
      setSizes([])
      return
    }

    const params = { category }
    if (sizeType) {
      params.type = sizeType
    }

    api.get("sizes/", { params })
      .then(res => setSizes(res.data))
      .catch(err => console.error(err))
  }, [category, sizeType])

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
    <div className={`d-flex flex-column p-4 h-100 ${styles.filterSidebar}`}>
      <div className="mb-4">
        <h5 className="">Khoảng giá</h5>
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
        <h5 className="fw-bold">Khuyến mãi</h5>
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="flashSaleFilter"
            checked={!!filters.isFlashSale}
            onChange={(e) => 
              onChange(prev => ({
                ...prev,
                isFlashSale: e.target.checked
              }))
            }
          />
          <label className="form-check-label" htmlFor="flashSaleFilter">
            Flash Sale
          </label>
        </div>
      </div>

      <div className="mb-4">
        <h5 className="">Đánh giá</h5>
        <div className="form-check">
          <input
            className="form-check-input"
            type="radio"
            name="ratingFilter"
            id="ratingAll"
            checked={!filters.rating}
            onChange={() => 
              onChange(prev => ({
                ...prev,
                rating: ""
              }))
            }
          />
          <label className="form-check-label" htmlFor="ratingAll">
            Tất cả sản phẩm
          </label>
        </div>
        <div className="form-check mt-1">
          <input
            className="form-check-input"
            type="radio"
            name="ratingFilter"
            id="ratingHasReviews"
            checked={filters.rating === "has_reviews"}
            onChange={() => 
              onChange(prev => ({
                ...prev,
                rating: "has_reviews"
              }))
            }
          />
          <label className="form-check-label" htmlFor="ratingHasReviews">
            Có đánh giá
          </label>
        </div>
        <div className="form-check mt-1">
          <input
            className="form-check-input"
            type="radio"
            name="ratingFilter"
            id="rating02"
            checked={filters.rating === "0-2"}
            onChange={() => 
              onChange(prev => ({
                ...prev,
                rating: "0-2"
              }))
            }
          />
          <label className="form-check-label" htmlFor="rating02">
            ⭐ 0 - 2 sao
          </label>
        </div>
        <div className="form-check mt-1">
          <input
            className="form-check-input"
            type="radio"
            name="ratingFilter"
            id="rating34"
            checked={filters.rating === "3-4"}
            onChange={() => 
              onChange(prev => ({
                ...prev,
                rating: "3-4"
              }))
            }
          />
          <label className="form-check-label" htmlFor="rating34">
            ⭐ 3 - 4 sao
          </label>
        </div>
        <div className="form-check mt-1">
          <input
            className="form-check-input"
            type="radio"
            name="ratingFilter"
            id="rating45"
            checked={filters.rating === "4-5"}
            onChange={() => 
              onChange(prev => ({
                ...prev,
                rating: "4-5"
              }))
            }
          />
          <label className="form-check-label" htmlFor="rating45">
            ⭐ 4 - 5 sao
          </label>
        </div>
      </div>

      <div className="mb-4">
        <h5 className="">Thương hiệu</h5>
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
          <h5 className="">Kích cỡ</h5>
          {resolvedSizeType === "racket" ? (
            sizes.map((size, index) => {
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
            })
          ) : (
            <div className={styles.sizesGrid}>
              {sizes
                .slice()
                .sort((a, b) => {
                  if (resolvedSizeType !== "clothes" && resolvedSizeType !== "apparel") return 0
                  const order = ["S", "M", "L", "XL", "XXL", "XXXL"]
                  const aName = String(a.name || "").trim().toUpperCase()
                  const bName = String(b.name || "").trim().toUpperCase()
                  const aIndex = order.indexOf(aName)
                  const bIndex = order.indexOf(bName)
                  if (aIndex === -1 && bIndex === -1) return aName.localeCompare(bName)
                  if (aIndex === -1) return 1
                  if (bIndex === -1) return -1
                  return aIndex - bIndex
                })
                .map((size, index) => {
                const sizeValue = String(size.id ?? size.name)
                return (
                  <div className={styles.sizeItem} key={size.id || index}>
                    <input
                      className={styles.sizeInput}
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
                    <label className={styles.sizeLabel} htmlFor={`size${index}`}>
                      {size.name}
                    </label>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FilterSideBar