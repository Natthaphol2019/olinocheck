import { supabase } from './supabase'

/**
 * Get today's date in ISO format (YYYY-MM-DD) for Thai timezone
 */
function getThaiDate(date = new Date()) {
  // Convert to Thai timezone and return YYYY-MM-DD format
  const thaiTime = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }))
  const year = thaiTime.getFullYear()
  const month = String(thaiTime.getMonth() + 1).padStart(2, '0')
  const day = String(thaiTime.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Get today's time record for an employee
 */
export async function getTodayTimeRecord(employeeId) {
  const today = getThaiDate()

  const { data, error } = await supabase
    .from('time_records')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('date', today)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

/**
 * Check in an employee (or update existing record)
 * @param {string} checkInTimeStr - Time string in HH:MM format (e.g., "11:30")
 */
export async function checkIn(employeeId, imageData, lat, lng, workType = 'office', shiftId = null, checkInTimeStr = null) {
  const today = getThaiDate()

  // Create check-in timestamp from user input or current time
  let checkInTimestamp
  if (checkInTimeStr) {
    const [hours, minutes] = checkInTimeStr.split(':')
    const now = new Date()
    now.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    checkInTimestamp = now.toISOString()
  } else {
    checkInTimestamp = new Date().toISOString()
  }

  // Upload check-in image (optional)
  let imageUrl = null
  if (imageData) {
    const fileName = `checkin/${employeeId}/${Date.now()}.jpg`
    const { error: uploadError } = await supabase.storage
      .from('attendance')
      .upload(fileName, imageData, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.warn('Image upload failed, continuing without image:', uploadError.message)
    } else {
      const { data: urlData } = supabase.storage
        .from('attendance')
        .getPublicUrl(fileName)

      imageUrl = urlData.publicUrl
    }
  }

  // Check if record already exists
  const { data: existingRecord } = await supabase
    .from('time_records')
    .select('id')
    .eq('employee_id', employeeId)
    .eq('date', today)
    .single()

  if (existingRecord) {
    // Update existing record
    const { data, error } = await supabase
      .from('time_records')
      .update({
        check_in: checkInTimestamp,
        check_in_image: imageUrl || existingRecord.check_in_image,
        lat: lat || existingRecord.lat,
        lng: lng || existingRecord.lng,
        work_type: workType || existingRecord.work_type,
        shift_id: shiftId || existingRecord.shift_id,
        status: 'normal',
      })
      .eq('id', existingRecord.id)
      .select()
      .single()

    if (error) throw error
    return data
  } else {
    // Insert new record
    const { data, error } = await supabase
      .from('time_records')
      .insert({
        employee_id: employeeId,
        check_in: checkInTimestamp,
        check_in_image: imageUrl,
        lat,
        lng,
        work_type: workType,
        date: today,
        status: 'normal',
        shift_id: shiftId,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }
}

/**
 * Check out an employee (or update existing record)
 * @param {string} checkOutTimeStr - Time string in HH:MM format (e.g., "21:30")
 */
export async function checkOut(employeeId, imageData, lat, lng, checkOutTimeStr = null) {
  const today = getThaiDate()

  // Create check-out timestamp from user input or current time
  let checkOutTimestamp
  if (checkOutTimeStr) {
    const [hours, minutes] = checkOutTimeStr.split(':')
    const now = new Date()
    now.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    checkOutTimestamp = now.toISOString()
  } else {
    checkOutTimestamp = new Date().toISOString()
  }

  // Check if record exists
  const { data: existingRecord } = await supabase
    .from('time_records')
    .select('id, check_in_image, lat, lng, work_type, shift_id')
    .eq('employee_id', employeeId)
    .eq('date', today)
    .single()

  if (!existingRecord) {
    throw new Error('No check-in record found for today')
  }

  // Upload check-out image (optional)
  let imageUrl = null
  if (imageData) {
    const fileName = `checkout/${employeeId}/${Date.now()}.jpg`
    const { error: uploadError } = await supabase.storage
      .from('attendance')
      .upload(fileName, imageData, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.warn('Image upload failed, continuing without image:', uploadError.message)
    } else {
      const { data: urlData } = supabase.storage
        .from('attendance')
        .getPublicUrl(fileName)

      imageUrl = urlData.publicUrl
    }
  }

  // Update record with check-out
  const { data, error } = await supabase
    .from('time_records')
    .update({
      check_out: checkOutTimestamp,
      check_out_image: imageUrl,
      lat: lat || existingRecord.lat,
      lng: lng || existingRecord.lng,
    })
    .eq('id', existingRecord.id)
    .select()
    .single()

  if (error) throw error

  // OT will be auto-calculated by trigger
  return data
}

/**
 * Get time records for an employee with filters
 */
export async function getTimeRecords(employeeId, startDate, endDate) {
  let query = supabase
    .from('time_records')
    .select('*')
    .eq('employee_id', employeeId)
    .order('date', { ascending: false })

  if (startDate) {
    query = query.gte('date', startDate)
  }
  if (endDate) {
    query = query.lte('date', endDate)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

/**
 * Get all time records for date range (for reports)
 */
export async function getAllTimeRecords(startDate, endDate) {
  // Convert to Thai timezone dates if needed
  const thaiStartDate = startDate ? getThaiDate(new Date(startDate)) : null
  const thaiEndDate = endDate ? getThaiDate(new Date(endDate)) : null

  let query = supabase
    .from('time_records')
    .select(`
      *,
      employee:employees!time_records_employee_id_fkey (
        id,
        name,
        role,
        department:departments (name)
      )
    `)
    .order('date', { ascending: false })

  if (thaiStartDate) {
    query = query.gte('date', thaiStartDate)
  }
  if (thaiEndDate) {
    query = query.lte('date', thaiEndDate)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}
