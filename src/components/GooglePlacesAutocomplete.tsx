"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface GooglePlacesAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  required?: boolean
}

// Google Places API integration
declare global {
  interface Window {
    google: any
    initGooglePlaces: () => void
  }
}

const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Start typing your address...",
  label = "Address",
  required = false,
}) => {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteService = useRef<any>(null)
  const placesService = useRef<any>(null)

  // Initialize Google Places API
  useEffect(() => {
    const initializeGooglePlaces = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService()
        const mapDiv = document.createElement("div")
        const map = new window.google.maps.Map(mapDiv)
        placesService.current = new window.google.maps.places.PlacesService(map)
      }
    }

    // Load Google Maps API if not already loaded
    if (!window.google) {
      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCcp2w1C8JLtYY22NcSBooAZYKQFd9oMNM&libraries=places&callback=initGooglePlaces`
      script.async = true
      script.defer = true

      window.initGooglePlaces = initializeGooglePlaces

      document.head.appendChild(script)
    } else {
      initializeGooglePlaces()
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    onChange(inputValue)

    if (inputValue.length > 2 && autocompleteService.current) {
      setIsLoading(true)

      const request = {
        input: inputValue,
        types: ["address"],
        componentRestrictions: { country: ["us", "ca", "pk"] }, // Add more countries as needed
      }

      autocompleteService.current.getPlacePredictions(request, (predictions: any[], status: any) => {
        setIsLoading(false)
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions.slice(0, 5)) // Limit to 5 suggestions
          setShowSuggestions(true)
        } else {
          setSuggestions([])
          setShowSuggestions(false)
        }
      })
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const selectSuggestion = (suggestion: any) => {
    onChange(suggestion.description)
    setShowSuggestions(false)
    setSuggestions([])
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest(".google-places-autocomplete")) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="form-group google-places-autocomplete">
      <label htmlFor="google-places-input">{label}</label>
      <div className="input-wrapper">
        <i className="fas fa-map-marker-alt input-icon"></i>
        <input
          ref={inputRef}
          id="google-places-input"
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          autoComplete="off"
          required={required}
        />
        {isLoading && (
          <div className="loading-spinner">
            <div className="loading"></div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            className="google-places-suggestions"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {suggestions.map((suggestion, index) => (
              <motion.div
                key={suggestion.place_id}
                className="google-places-suggestion"
                onClick={() => selectSuggestion(suggestion)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ backgroundColor: "var(--accent-purple)" }}
              >
                <i className="fas fa-map-marker-alt suggestion-icon"></i>
                <div className="suggestion-content">
                  <div className="suggestion-main">{suggestion.structured_formatting.main_text}</div>
                  <div className="suggestion-secondary">{suggestion.structured_formatting.secondary_text}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default GooglePlacesAutocomplete
