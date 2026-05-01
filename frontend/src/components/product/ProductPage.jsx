import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import FilterSideBar from "./FilterSideBar"
import HomeCard from "../home/HomeCard"
import api from "../../api"
import styles from "./ProductPage.module.css"
function ProductPage() {
  const [products, setProducts] = useState([])
  const [searchParams] = useSearchParams()
  const category = searchParams.get("category")
  const searchQuery = searchParams.get("search")
  const [categoryName, setCategoryName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [loaded, setLoaded] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [filters, setFilters] = useState({
    brands: [],
    sizes: [],
    minPrice: "",
    maxPrice: "",
    sort: "newest"
  })
  const pageSize = 12

  useEffect(() => {
    if (category) {
      api.get("categories/")
        .then(res => {
          const foundCategory = res.data.find(cat => cat.slug === category)
          setCategoryName(foundCategory?.name || "")
        })
        .catch(() => setCategoryName(""))
    } else {
      setCategoryName("")
    }
  }, [category])

  useEffect(() => {
    setPage(1)
    setFilters(prev => ({
      ...prev,
      sizes: []
    }))
  }, [category, searchQuery])

  useEffect(() => {
    setPage(1)
  }, [filters])

  useEffect(() => {
    setLoading(true)
    setLoaded(false)
    setError("")
    const sortMap = {
      price_low_high: "price_asc",
      price_high_low: "price_desc"
    }
    const apiSort = sortMap[filters.sort]
    const params = {
      page,
      page_size: pageSize,
      ...(category ? { category } : {}),
      ...(searchQuery ? { search: searchQuery } : {}),
      ...(filters.brands.length > 0 ? { brands: filters.brands.join(",") } : {}),
      ...(filters.sizes.length > 0 ? { sizes: filters.sizes.join(",") } : {}),
      ...(filters.minPrice ? { min_price: filters.minPrice } : {}),
      ...(filters.maxPrice ? { max_price: filters.maxPrice } : {}),
      ...(apiSort ? { sort: apiSort } : {})
    }
    api.get("products", { params })
      .then(res => {
        if (Array.isArray(res.data)) {
          setProducts(res.data)
          setTotalCount(res.data.length)
          setTotalPages(1)
        } else {
          setProducts(res.data.results || [])
          setTotalCount(res.data.count || 0)
          setTotalPages(res.data.total_pages || 0)
        }
        setLoading(false)
        setLoaded(true)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
        setError(err.message)
      }
    )
  }, [category, searchQuery, page, filters])

  const getPageNumbers = () => {
    if (totalPages <= 1) return []
    const maxButtons = 5
    let start = Math.max(1, page - Math.floor(maxButtons / 2))
    let end = Math.min(totalPages, start + maxButtons - 1)
    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1)
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  const pageNumbers = getPageNumbers()
  return (
    <div className="p-0" style={{backgroundColor: "#f8f9fa", maxWidth: "100%", overflow: "hidden", boxSizing: "border-box"}}>
      <div className="d-flex flex-row h-100" style={{maxWidth: "100%"}}>
        <div className='d-flex justify-content-center flex-shrink-0' style={{padding: "0 8px"}} >
          <FilterSideBar
            category={category}
            filters={filters}
            onChange={setFilters}
          />
        </div>
        <div className="flex-grow-1 d-flex flex-column p-3 ps-0" style={{minWidth: 0, maxWidth: "100%", boxSizing: "border-box", overflowX: "hidden"}}>
          <div className="p-3 d-flex flex-row ">
            <h3 className="fw-semibold">
              {categoryName || "Tất cả sản phẩm"}
            </h3>
            <div className="ms-auto d-flex align-items-center gap-2">
              <span className="fw-medium">Sắp xếp theo:</span>
              <select
                className="form-select form-select-sm w-auto"
                value={filters.sort}
                onChange={(event) =>
                  setFilters(prev => ({
                    ...prev,
                    sort: event.target.value
                  }))
                }
              >
                <option value="price_low_high">Giá: Thấp đến Cao</option>
                <option value="price_high_low">Giá: Cao đến Thấp</option>
              </select>
            </div>
          </div>
          <div className="flex-grow-1 overflow-auto p-2" style={{overflowX: "hidden"}}>
            {!loading && !error && (
              <>
                <div
                  className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3"
                  style={{
                    opacity: loaded ? 1 : 0,
                    transform: loaded ? 'translateY(0)' : 'translateY(30px)',
                    transition: 'opacity 600ms ease-out 200ms, transform 600ms ease-out 200ms',
                    margin: 0
                  }}
                >
                  {products.map(product => (
                    <HomeCard key={product.id} product={product} />
                  ))}
                </div>

                <div
                  className="text-center mt-5"
                  style={{
                    opacity: loaded ? 1 : 0,
                    transform: loaded ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'opacity 600ms ease-out 400ms, transform 600ms ease-out 400ms'
                  }}
                >
                </div>
              </>
            )}
          </div>
          <div className="p-4">
            {totalPages > 1 && (
              <nav aria-label="Products pagination" className="d-flex justify-content-center">
                <ul className={`pagination mb-0 ${styles.pagination}`}>
                  <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setPage(prev => Math.max(1, prev - 1))}
                      disabled={page === 1}
                    >
                      Trước
                    </button>
                  </li>
                  {pageNumbers.map(pageNum => (
                    <li key={pageNum} className={`page-item ${pageNum === page ? "active" : ""}`}>
                      <button className="page-link" onClick={() => setPage(pageNum)}>
                        {pageNum}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={page === totalPages}
                    >
                      Tiếp
                    </button>
                  </li>
                </ul>
              </nav>
            )}
            {totalCount > 0 && (
              <div className="text-center mt-2 text-muted">
                Trang {page} / {totalPages} ({totalCount} sản phẩm)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductPage
