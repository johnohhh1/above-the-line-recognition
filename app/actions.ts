'use server'

import { google } from 'googleapis'
import { Readable } from 'stream'
import sharp from 'sharp'

export async function submitForm(formData: string) {
  try {
    // Convert base64 PDF data to buffer
    const pdfBuffer = Buffer.from(formData.split(',')[1], 'base64')
    
    // Convert PDF to JPEG using sharp
    const jpegBuffer = await sharp(pdfBuffer)
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

