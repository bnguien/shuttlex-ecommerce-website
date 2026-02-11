import React, { useEffect, useState } from 'react'
import styles from './FilterSideBar.module.css'
import api from '../../api'

function FilterSideBar({ category }) {
  const [brands, setBrands] = useState([])
  const [sizes, setSizes] = useState([])

  // Map category slug to Size model type
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

  return (
    <div className={`d-flex flex-column p-4 h-100 ${styles.filterSidebar}`} style={{backgroundColor: "#f8f9fa"}}>
      <div className="mb-4">
        <h5 className="">Price Range</h5>
        <div className="d-flex align-items-center gap-2">
          <input type="number" className="form-control" placeholder="Min" />
          <span>-</span>
          <input type="number" className="form-control" placeholder="Max" />
        </div>
      </div>
      
      <div className="mb-4">
        <h5 className="">Brand</h5>
        {brands.map((brand, index) => (
          <div className="form-check" key={brand.id || index}>
            <input className="form-check-input" type="checkbox" value={brand.slug || brand.name} id={`brand${index}`} />
            <label className="form-check-label" htmlFor={`brand${index}`}>
              {brand.name}
            </label>
          </div>
        ))}
      </div>

      {sizes.length > 0 && (
        <div className="mb-4">
          <h5 className="">Size</h5>
          {sizes.map((size, index) => (
            <div className="form-check" key={size.id || index}>
              <input className="form-check-input" type="checkbox" value={size.name} id={`size${index}`} />
              <label className="form-check-label" htmlFor={`size${index}`}>
                {size.name}
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FilterSideBar