import { useCallback, useEffect, useRef, useState } from 'react'
import { extractTextFromFile, isSupportedFile, type Progress } from '../ingest'

export interface IngestState {
  status: 'idle' | 'loading' | 'done' | 'error'
  stage: string
  progress: number
  fileName: string
  message: string
}

const IDLE: IngestState = { status: 'idle', stage: '', progress: 0, fileName: '', message: '' }

/**
 * Reads PDFs and images (picked, dropped, or pasted from the clipboard) and hands the extracted text to `onText`.
 */
export function useIngest(onText: (text: string) => void) {
  const [state, setState] = useState<IngestState>(IDLE)
  const busy = useRef(false)
  const onTextRef = useRef(onText)
  onTextRef.current = onText

  const ingest = useCallback(async (file: File) => {
    if (busy.current) return
    if (!isSupportedFile(file)) {
      setState({ ...IDLE, status: 'error', fileName: file.name, message: 'Use a PDF, PNG, JPG or WEBP file.' })
      return
    }
    busy.current = true
    const name = file.name || 'Pasted screenshot'
    setState({ status: 'loading', stage: 'Loading reader', progress: 0, fileName: name, message: '' })
    try {
      const text = await extractTextFromFile(file, (p: Progress) =>
        setState((s) => ({ ...s, status: 'loading', stage: p.stage, progress: p.progress })),
      )
      if (!text.trim()) {
        setState({ ...IDLE, status: 'error', fileName: name, message: 'No text found. Try a sharper or larger image.' })
        return
      }
      onTextRef.current(text)
      setState({ status: 'done', stage: '', progress: 1, fileName: name, message: '' })
    } catch (err) {
      console.error(err)
      setState({ ...IDLE, status: 'error', fileName: name, message: 'Could not read that file. Try another file, or paste the text instead.' })
    } finally {
      busy.current = false
    }
  }, [])

  // Ctrl/Cmd+V with an image on the clipboard. Plain-text paste is left to the textarea.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = Array.from(e.clipboardData?.files ?? []).find((f) => f.type.startsWith('image/'))
      if (!file) return
      e.preventDefault()
      void ingest(file)
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [ingest])

  return { state, ingest, dismiss: () => setState(IDLE) }
}
