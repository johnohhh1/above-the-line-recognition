'use client'

import { useRef, useState } from 'react'
import { submitForm } from './actions'

export default function Home() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const iframeRef = useRef<HTMLIFrameElement>(null)

  async function handleSubmit() {
    setIsSubmitting(true)
    setMessage('')
    
    try {
      if (!iframeRef.current || !iframeRef.current.contentWindow) return
      
      // Capture the current state of the form
      const formData = await new Promise<string>((resolve) => {
        iframeRef.current!.contentWindow!.postMessage({ type: 'getFormData' }, '*')
        
        window.addEventListener('message', function handler(event) {
          if (event.data && event.data.type === 'formData') {
            window.removeEventListener('message', handler)
            resolve(event.data.formData)
          }
        })
      })

      const result = await submitForm(formData)
      setMessage(result.message)
      
      // Reset the form
      if (iframeRef.current.contentDocument) {
        iframeRef.current.contentDocument.forms[0]?.reset()
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <img 
            src="/chilis-logo.jpg" 
            alt="Chili's Logo" 
            className="h-16 mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-red-600">Above the Line Recognition</h1>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <iframe
            ref={iframeRef}
            src="/recognition-form.pdf"
            className="w-full h-[800px] border-0 mb-4"
          />
          
          <div className="flex justify-center">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-2 text-lg rounded"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Recognition'}
            </button>
          </div>

          {message && (
            <p className={`text-center mt-4 ${
              message.includes('error') ? 'text-red-500' : 'text-green-600'
            }`}>
              {message}
            </p>
          )}
        </div>

        <footer className="text-center text-sm text-gray-600 space-y-1">
          <p>EVERY GUEST COUNTS • FOOD & DRINK PERFECTION</p>
          <p>BE ACCOUNTABLE • PLAY RESTAURANT</p>
          <p>BRING BACK GUESTS • ENGAGE TEAM MEMBERS</p>
        </footer>
      </div>
    </main>
  )
}