import { useState, useEffect } from "react"

type Breakpoint = "(min-width: 640px)" | "(min-width: 768px)" | "(min-width: 1024px)" | "(min-width: 1280px)" | "(min-width: 1536px)";

export function useMediaQuery(query: Breakpoint) {
  const [value, setValue] = useState(false)

  useEffect(() => {
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches)
    }

    const result = matchMedia(query)
    result.addEventListener("change", onChange)
    setValue(result.matches)

    return () => result.removeEventListener("change", onChange)
  }, [query])

  return value
}
