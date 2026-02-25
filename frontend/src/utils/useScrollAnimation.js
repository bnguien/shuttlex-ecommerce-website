import { useEffect, useRef, useState } from 'react'

export const useScrollAnimation = () => {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observedElement = ref.current
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.1 }
    )

    if (observedElement) {
      observer.observe(observedElement)
    }

    return () => {
      if (observedElement) {
        observer.unobserve(observedElement)
      }
    }
  }, [])

  return [ref, isVisible]
}
