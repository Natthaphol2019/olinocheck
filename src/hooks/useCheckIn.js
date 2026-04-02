import { useState, useCallback } from 'react'
import { getTodayTimeRecord, checkIn as checkInService, checkOut as checkOutService } from '../services/timeService'

export function useCheckIn(employeeId) {
  const [todayRecord, setTodayRecord] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchTodayRecord = useCallback(async () => {
    try {
      const record = await getTodayTimeRecord(employeeId)
      setTodayRecord(record)
      return record
    } catch (err) {
      setError(err.message)
      return null
    }
  }, [employeeId])

  const checkIn = async (imageBlob, lat, lng, workType = 'office', shiftId = null, checkInTimeStr = null) => {
    setLoading(true)
    setError(null)
    try {
      const record = await checkInService(employeeId, imageBlob, lat, lng, workType, shiftId, checkInTimeStr)
      setTodayRecord(record)
      return record
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const checkOut = async (imageBlob, lat, lng, checkOutTimeStr = null) => {
    setLoading(true)
    setError(null)
    try {
      const record = await checkOutService(employeeId, imageBlob, lat, lng, checkOutTimeStr)
      setTodayRecord(record)
      return record
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const isCheckedIn = !!todayRecord?.check_in
  const isCheckedOut = !!todayRecord?.check_out
  const canCheckIn = !isCheckedIn
  const canCheckOut = isCheckedIn && !isCheckedOut

  return {
    todayRecord,
    loading,
    error,
    checkIn,
    checkOut,
    fetchTodayRecord,
    isCheckedIn,
    isCheckedOut,
    canCheckIn,
    canCheckOut,
  }
}
