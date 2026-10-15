'use client'

import { useEffect } from 'react'

export default function AutoBackupRunner() {
  useEffect(() => {
    // Run auto backup check silently once on app load
    const runAutoBackupCheck = async () => {
      try {
        await fetch('/api/backup/auto')
      } catch (err) {
        // Silently catch background error
      }
    }

    runAutoBackupCheck()
  }, [])

  return null
}

