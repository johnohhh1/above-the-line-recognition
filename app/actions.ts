'use server'

import { google } from 'googleapis'
import { Readable } from 'stream'
import sharp from 'sharp'
import { PDFDocument } from 'pdf-lib'

export async function submitForm(formData: string) {
  try {
    // Convert base64 PDF data to buffer
    const pdfBuffer = Buffer.from(formData.split(',')[1], 'base64')
    
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBuffer)
    
    // Convert the first page to PNG (better quality for text)
    const pages = await pdfDoc.getPages()
    const pngImage = await pages[0].render({
      scale: 2.0 // Higher scale for better quality
    })

    // Convert PNG to JPEG with sharp
    const jpegBuffer = await sharp(Buffer.from(pngImage.buffer))
      .jpeg({
        quality: 95,
        chromaSubsampling: '4:4:4'
      })
      .toBuffer()

    // Initialize Google Drive API
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || ''),
      scopes: ['https://www.googleapis.com/auth/drive.file']
    })

    const drive = google.drive({ version: 'v3', auth })

    // Create file metadata
    const fileMetadata = {
      name: `Recognition_${new Date().toISOString()}.jpg`,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID]
    }

    // Upload file to Google Drive
    await drive.files.create({
      requestBody: fileMetadata,
      media: {
        mimeType: 'image/jpeg',
        body: Readable.from(jpegBuffer)
      },
      fields: 'id'
    })

    return { message: 'Recognition submitted successfully!' }
  } catch (error) {
    console.error('Error submitting form:', error)
    return { message: 'An error occurred while submitting the form.' }
  }
}