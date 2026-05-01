import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaMagnifyingGlass, FaXmark } from 'react-icons/fa6';
import api, { BASE_URL } from '../../api';
import styles from './SearchBar.module.css';
import { formatCurrencyVND } from '../../utils/format';

function SearchBar({ isOpen, onClose, transparent = false }) {
     const [query, setQuery] = useState("");
     const [suggestions, setSuggestions] = useState([]);
     const [showDropdown, setShowDropDown] = useState(false);
     // const [hasText, setHasText] = useState(false);
     const [isLoading, setIsLoading] = useState(false);
     const [activeIndex, setActivateIndex] = useState(-1);
     
     const wrapperRef = useRef(null);
     const timerRef = useRef(null);
     const inputRef = useRef(null);
     const navigate = useNavigate(); 

     //focus input khi mở
     useEffect(() => {
          if (isOpen) {
               const t = setTimeout(() => inputRef.current?.focus(), 150);
               return () => clearTimeout(t);
          } else {
               setQuery("");
               setSuggestions([]);
               setShowDropDown(false);
               setActivateIndex(-1);
          }
     }, [isOpen]);

     //click outside để đóng
     useEffect(() => {
          function handleClickOutside(e) {
               if (e.target.closest('#search-toggle-btn')) return;
               if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                    onClose();
               }
          }

          if(isOpen) document.addEventListener("mousedown", handleClickOutside);
          return () => document.removeEventListener("mousedown", handleClickOutside);
     }, [isOpen, onClose]);

     //cleanup timer
     useEffect(() => {
          return () => { if (timerRef.current) clearTimeout(timerRef.current); };
     }, []);

     const fetchSuggestions = async(searchText) => {
          setIsLoading(true);
          try {
               const res = await api.get(`search_suggestions/?q=${encodeURIComponent(searchText)}`);
               setSuggestions(res.data || []);
               setActivateIndex(-1);
               setShowDropDown(true);
          } catch (error) {
               console.error("Lỗi khi tải gợi ý:", error);
               setSuggestions([]);
          } finally {
               setIsLoading(false);
          }
     };
     
     const handleChange = (e) => {
          const value = e.target.value;
          setQuery(value);
     
          if (timerRef.current) clearTimeout(timerRef.current);
     
          if (value.trim().length < 2) {
               setSuggestions([]);
               setShowDropDown(false);
               return;
          }
     
          timerRef.current = setTimeout(() => fetchSuggestions(value.trim()), 300);
     };

     const handleClear = () => {
          setQuery("");
          setSuggestions([]);
          setShowDropDown(false);
          inputRef.current?.focus();
     }

     const handleKeyDown = (e) => {
          if (e.key === 'Escape') {
               onClose();
               return;
          }

          if (!showDropdown || suggestions.length === 0) return;
          if (e.key === 'ArrowDown') {
               e.preventDefault();
               setActivateIndex(i => (i + 1) % suggestions.length);
          } else if (e.key === 'ArrowUp') {
               e.preventDefault();
               setActivateIndex(i => (i - 1 + suggestions.length) % suggestions.length);
          } else if (e.key === 'Enter' && activeIndex >= 0) {
               e.preventDefault();
               handleSuggestionClick(suggestions[activeIndex].slug);
          }
     }
     
     const handleSubmit = (e) => {
          e?.preventDefault();
          if (!query.trim()) return;
     
          setShowDropDown(false);
          onClose();
          navigate(`/products?search=${encodeURIComponent(query.trim())}`);
     };
     
     const handleSuggestionClick = (slug) => {
          setShowDropDown(false);
          onClose();
          navigate(`/product/${slug}`);
     }

     return (
          <div 
               className={`${styles.searchOverlay} ${isOpen ? styles.searchOverlayOpen : '' }`}
               style={transparent ? { 
                    backgroundColor: 'transparent', 
                    boxShadow: 'none',
               } : {}}
          >
               <div ref={wrapperRef} className={styles.searchExpandedWrapper}>
                    <form onSubmit={handleSubmit} className={styles.searchForm}>
                         <FaMagnifyingGlass className={styles.searchIconLeft}/>
                         <input
                              ref={inputRef}
                              type="text"
                              className={styles.searchInput}
                              placeholder="Tìm kiếm sản phẩm cầu lông..."
                              value={query}
                              onChange={handleChange}
                              onKeyDown={handleKeyDown}
                              onFocus={() => {
                                   if (suggestions.length > 0) setShowDropDown(true);
                              }}
                         />
                         {query && (
                              <button
                                   type="button"
                                   className={styles.clearButton}
                                   onMouseDown={(e) => e.preventDefault()}
                                   onClick={handleClear}
                              >
                                   <FaXmark/>
                              </button>
                         )}
                         <button type="submit" className={styles.searchButton}>
                              Tìm kiếm
                         </button>
                    </form>

                    {/* Render bảng gợi ý nếu có */}
                    {showDropdown && suggestions.length > 0 && (
                         <div className={styles.dropdown}>
                              <div className={styles.dropdownHeader}>
                                   {isLoading ? 'Đang tải ...' : `Sản phẩm gợi ý (${suggestions.length})`}
                              </div>

                              <div className={styles.dropdownList}>
                                   {suggestions.map((item, idx) => (
                                        <div
                                             key={item.slug}
                                             className={`${styles.suggestionItem} ${idx===activeIndex?styles.active:''}`}
                                             onClick={() => handleSuggestionClick(item.slug)}
                                             onMouseEnter={() => setActivateIndex(idx)}
                                        >
                                             <img 
                                                  src={`${BASE_URL}${item.image}`}
                                                  alt={item.name}
                                                  className={styles.suggestionImg}
                                             />
                                             <div className={styles.suggestionInfo}>
                                                  <span className={styles.suggestionName}>
                                                       {highlight(item.name, query)}
                                                  </span>
                                                  <span className={styles.suggestionSub}>
                                                       {item.category}
                                                  </span>
                                             </div>
                                             <span className={styles.suggestionPrice}>
                                                  {formatCurrencyVND(item.price)}
                                             </span>
                                        </div>
                                   ))}
                              </div>
                              <div 
                                   className={styles.dropdownFooter} 
                                   onMouseDown={(e) => e.preventDefault()}
                                   onClick={handleSubmit}
                              >
                                   <FaMagnifyingGlass style={{ fontSize: 13, marginRight: 6 }}/>
                                   Xem tất cả kết quả cho: "<strong>{query}</strong>"
                              </div>
                         </div>
                    )}
               </div>
          </div>
     )
}

function highlight(text, query) {
     if (!query) return text;
     
     const idx = text.toLowerCase().indexOf(query.toLowerCase());
     if (idx === -1) return text;
     return (
          <>
               {text.slice(0, idx)}
               <mark className={styles.highlight}>
                    {text.slice(idx, idx + query.length)}
               </mark>
               {text.slice(idx + query.length)}
          </>
     )
}

export default SearchBar;