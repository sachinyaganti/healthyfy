import jsPDF from 'jspdf'
import { PDF_DISCLAIMER_LINES } from '../constants/disclaimer.js'

// Generates a client-side PDF only when the user clicks “Export Final Setup as PDF”.
// In Step 2 (backend), this can be replaced by server-side PDF generation + storage.

function addWrappedLines(doc, text, x, y, maxWidth, lineHeight) {
  const lines = doc.splitTextToSize(text, maxWidth)
  for (const line of lines) {
    doc.text(line, x, y)
    y += lineHeight
  }
  return y
}

export function exportFinalSetupPdf({ user, domainTitle, generatedAtIso, sections }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  const margin = 48
  const maxWidth = pageWidth - margin * 2
  let y = margin

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('Healthyfy — Final Setup Export', margin, y)
  y += 22

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.text(`Domain: ${domainTitle}`, margin, y)
  y += 16
  doc.text(`User: ${user?.name || 'Unknown'} (${user?.email || 'n/a'})`, margin, y)
  y += 16
  doc.text(`Generated: ${generatedAtIso}`, margin, y)
  y += 18

  doc.setDrawColor(226, 232, 240)
  doc.line(margin, y, pageWidth - margin, y)
  y += 18

  for (const section of sections || []) {
    if (y > pageHeight - margin - 80) {
      doc.addPage()
      y = margin
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text(section.title, margin, y)
    y += 16

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)

    for (const line of section.lines || []) {
      if (y > pageHeight - margin - 40) {
        doc.addPage()
        y = margin
      }
      y = addWrappedLines(doc, String(line), margin, y, maxWidth, 14)
    }

    y += 10
  }

  if (y > pageHeight - margin - 80) {
    doc.addPage()
    y = margin
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Disclaimer', margin, y)
  y += 16

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  for (const line of PDF_DISCLAIMER_LINES) {
    y = addWrappedLines(doc, line, margin, y, maxWidth, 14)
  }

  doc.save(`Healthyfy_${domainTitle.replace(/\s+/g, '_')}_FinalSetup.pdf`)
}
