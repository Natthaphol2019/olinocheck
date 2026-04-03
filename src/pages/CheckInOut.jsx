import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useCheckIn } from '@/hooks/useCheckIn'
import Layout from '@/components/Layout'
import GPSPicker from '@/components/GPSPicker'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Clock, CheckCircle, LogOut, MapPin, Camera, Upload, Save, Calendar, User, Briefcase, Home, Building } from 'lucide-react'
import { format, subDays, startOfMonth } from 'date-fns'
import { supabase } from '@/services/supabase'
import { cn } from '@/lib/utils'

export default function CheckInOut() {
  const { employee } = useAuth()
  const { toast } = useToast()
  const {
    todayRecord,
    loading,
    checkIn,
    checkOut,
    fetchTodayRecord,
    isCheckedIn,
    isCheckedOut,
  } = useCheckIn(employee?.id)

  const [shifts, setShifts] = useState([])
  const [selectedShift, setSelectedShift] = useState('')
  const [workType, setWorkType] = useState('office')
  const [location, setLocation] = useState({ lat: null, lng: null })

  // Date selection (retroactive)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  // Check-in fields
  const [checkInTime, setCheckInTime] = useState(format(new Date(), 'HH:mm'))
  const [checkInFile, setCheckInFile] = useState(null)

  // Check-out fields
  const [checkOutTime, setCheckOutTime] = useState('')
  const [checkOutFile, setCheckOutFile] = useState(null)

  const checkInInputRef = useRef(null)
  const checkOutInputRef = useRef(null)

  // Convert 24h to 12h format for display
  const formatTo12Hour = (time24h) => {
    if (!time24h) return ''
    const [hours, minutes] = time24h.split(':')
    const h = parseInt(hours)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${minutes || '00'} ${ampm}`
  }

  // Convert 12h to 24h format for storage
  const parseTo24Hour = (time12h) => {
    if (!time12h) return ''
    const match = time12h.match(/(\d+):(\d+)\s*(AM|PM)/i)
    if (!match) return time12h

    let h = parseInt(match[1])
    const m = match[2]
    const ampm = match[3].toUpperCase()

    if (ampm === 'PM' && h !== 12) h += 12
    if (ampm === 'AM' && h === 12) h = 0

    return `${String(h).padStart(2, '0')}:${m}`
  }

  // Fetch shifts and selected date's record
  useEffect(() => {
    const fetchData = async () => {
      // Get shifts
      const { data } = await supabase
        .from('shifts')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
      setShifts(data || [])

      // Get selected date's record
      if (employee?.id) {
        await fetchDateRecord(selectedDate)
        
        // Auto-load employee's assigned shift
        await loadEmployeeShift()
      }
    }
    fetchData()
  }, [employee?.id, selectedDate])

  // Load employee's assigned shift
  const loadEmployeeShift = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_shifts')
        .select(`
          *,
          shifts:shift_id (*)
        `)
        .eq('employee_id', employee.id)
        .eq('is_active', true)
        .lte('start_date', selectedDate)
        .or(`end_date.is.null,end_date.gte.${selectedDate}`)
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error

      if (data?.shifts) {
        setSelectedShift(data.shifts.id)
      }
    } catch (error) {
      console.error('Error loading employee shift:', error)
    }
  }

  // Generate last 7 days for dropdown
  const getDateOptions = () => {
    const options = []
    const today = new Date()
    
    for (let i = 0; i < 7; i++) {
      const date = subDays(today, i)
      const value = format(date, 'yyyy-MM-dd')
      const label = i === 0 ? 'วันนี้' : 
                    i === 1 ? 'เมื่อวาน' :
                    format(date, 'd MMM yyyy')
      options.push({ value, label })
    }
    
    return options
  }

  // Fetch record for specific date
  const fetchDateRecord = async (date) => {
    try {
      const { data, error } = await supabase
        .from('time_records')
        .select('*')
        .eq('employee_id', employee?.id)
        .eq('date', date)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        // Update form with existing data
        if (data.check_in) {
          const time = format(new Date(data.check_in), 'HH:mm')
          setCheckInTime(time)
        } else {
          setCheckInTime(format(new Date(), 'HH:mm'))
        }
        
        if (data.check_out) {
          const time = format(new Date(data.check_out), 'HH:mm')
          setCheckOutTime(time)
        } else {
          setCheckOutTime('')
        }
        
        if (data.shift_id) {
          setSelectedShift(data.shift_id)
        }
        if (data.work_type) {
          setWorkType(data.work_type)
        }
      } else {
        // No record for this date, reset form
        setCheckInTime(format(new Date(), 'HH:mm'))
        setCheckOutTime('')
        setSelectedShift('')
      }
    } catch (error) {
      console.error('Error fetching date record:', error)
    }
  }

  const handleTimeChange = (e, isCheckIn) => {
    let value = e.target.value

    // Allow only digits and colon
    let cleaned = value.replace(/[^0-9:]/g, '')

    // Auto-format: if user types 1300, convert to 13:00
    if (cleaned.length === 3 && !cleaned.includes(':')) {
      cleaned = `${cleaned.slice(0, 2)}:${cleaned.slice(2)}`
    } else if (cleaned.length === 4 && !cleaned.includes(':')) {
      cleaned = `${cleaned.slice(0, 2)}:${cleaned.slice(2)}`
    }

    // Validate format HH:MM
    if (/^\d{1,2}:\d{2}$/.test(cleaned)) {
      const [hours, minutes] = cleaned.split(':')
      const h = parseInt(hours)
      const m = parseInt(minutes)

      // Validate hours (0-23) and minutes (0-59)
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        const formatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
        if (isCheckIn) {
          setCheckInTime(formatted)
        } else {
          setCheckOutTime(formatted)
        }
        return
      }
    }

    // Allow empty or partial input
    if (cleaned === '' || /^\d{1,2}$/.test(cleaned) || /^\d{1,2}:$/.test(cleaned) || /^\d{1,2}:\d{1}$/.test(cleaned)) {
      if (isCheckIn) {
        setCheckInTime(cleaned)
      } else {
        setCheckOutTime(cleaned)
      }
    }
  }

  const handleFileSelect = (e, isCheckIn) => {
    const file = e.target.files[0]
    if (file && file.type.startsWith('image/')) {
      if (isCheckIn) {
        setCheckInFile(file)
      } else {
        setCheckOutFile(file)
      }
    }
  }

  const handleSave = async () => {
    if (!selectedShift) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'กรุณาเลือกกะงาน',
        variant: 'destructive',
      })
      return
    }

    if (!checkInTime) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'กรุณากรอกเวลาเข้างาน',
        variant: 'destructive',
      })
      return
    }

    try {
      let checkInResult = null
      let checkOutResult = null

      // Save Check-in with user-entered time
      await checkIn(checkInFile, location.lat, location.lng, workType, selectedShift, checkInTime)

      // Save Check-out with user-entered time (if provided)
      if (checkOutTime && checkOutTime.trim() !== '') {
        await checkOut(checkOutFile, location.lat, location.lng, checkOutTime)
      }

      toast({
        title: 'สำเร็จ',
        description: checkOutTime ? 
          'บันทึกเวลาเข้า-ออกงานเรียบร้อยแล้ว' : 
          'บันทึกเวลาเข้างานเรียบร้อยแล้ว',
      })

      // Reset files
      setCheckInFile(null)
      setCheckOutFile(null)
      if (checkInInputRef.current) checkInInputRef.current.value = ''
      if (checkOutInputRef.current) checkOutInputRef.current.value = ''

      // Refresh the record
      await fetchDateRecord(selectedDate)
    } catch (err) {
      toast({
        title: 'ข้อผิดพลาด',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  const formatTime = (time) => {
    if (!time) return ''
    // time is already in 24-hour format (HH:MM:SS or HH:MM)
    return time.substring(0, 5) // HH:MM
  }

  const getImagePreview = (file) => {
    if (file) {
      return URL.createObjectURL(file)
    }
    return null
  }

  const workTypeOptions = [
    { value: 'office', label: 'ทำงานที่ร้าน', icon: Building, gradient: 'from-blue-400 to-cyan-500' },
  ]

  const getStatusCard = () => {
    const selectedDateObj = new Date(selectedDate)
    const dateOptions = getDateOptions()
    
    return (
      <Card className="card-glass overflow-hidden">
        <CardContent className="pt-6">
          <div className="text-center mb-4">
            {/* Date Selector */}
            <div className="mb-4">
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                เลือกวันที่ต้องการบันทึก
              </Label>
              <Select
                value={selectedDate}
                onValueChange={setSelectedDate}
              >
                <SelectTrigger className="h-14 text-lg font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dateOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!todayRecord ? (
              <div className="py-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 mb-3 animate-float">
                  <Clock className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2">ยังไม่ได้บันทึก</h3>
                <p className="text-muted-foreground text-sm">
                  กรอกเวลาเข้า-ออกงานของคุณด้านล่าง
                </p>
              </div>
            ) : isCheckedOut ? (
              <div className="py-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 mb-3 animate-scale-in">
                  <CheckCircle className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-3 text-green-600">บันทึกเรียบร้อยแล้ว</h3>
                <div className="space-y-2">
                  <p className="flex items-center justify-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    เข้างาน: {format(new Date(todayRecord.check_in), 'HH:mm')} น.
                  </p>
                  <p className="flex items-center justify-center gap-2 text-sm">
                    <LogOut className="h-4 w-4" />
                    เลิกงาน: {format(new Date(todayRecord.check_out), 'HH:mm')} น.
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mb-3 animate-pulse-ring">
                  <Clock className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-3 text-blue-600">เข้างานแล้ว</h3>
                <div className="space-y-2">
                  <p className="flex items-center justify-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    ตั้งแต่: {format(new Date(todayRecord.check_in), 'HH:mm')} น.
                  </p>
                </div>
              </div>
            )}

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Calendar className="h-4 w-4" />
              {format(selectedDateObj, 'EEEE, d MMM yyyy')}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              บันทึกเวลาทำงาน
            </h1>
            <p className="text-muted-foreground">
              กรอกเวลาเช็คอินและเช็คเอาท์ของคุณ
            </p>
          </div>
        </div>

        {getStatusCard()}

        {/* Attendance Form */}
        <Card className="card-glass">
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Save className="h-4 w-4 text-primary" />
              </div>
              <CardTitle>แบบฟอร์มบันทึกเวลา</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Shift Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4" />
                กะงาน (เวลาทำงาน) *
              </Label>
              <Select value={selectedShift} onValueChange={setSelectedShift}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="เลือกกะงาน" />
                </SelectTrigger>
                <SelectContent>
                  {shifts.map((shift) => (
                    <SelectItem key={shift.id} value={shift.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: shift.color || '#3B82F6' }}
                        />
                        <span className="font-medium">{shift.name}</span>
                        <span className="text-muted-foreground text-xs">
                          ({formatTime(shift.start_time)} - {formatTime(shift.end_time)})
                        </span>
                        {shift.ot_start_time && shift.ot_end_time && (
                          <span className="text-xs text-orange-600 font-medium">• มี OT</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedShift && shifts.find(s => s.id === selectedShift) && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      {shifts.find(s => s.id === selectedShift)?.name}
                    </p>
                    <p className="text-xs text-blue-700">
                      เวลาทำงาน: {formatTime(shifts.find(s => s.id === selectedShift)?.start_time)} - {formatTime(shifts.find(s => s.id === selectedShift)?.end_time)}
                      {(() => {
                        const shift = shifts.find(s => s.id === selectedShift);
                        if (!shift?.grace_period_minutes || !shift?.start_time) return null;
                        const startTime = new Date(`2000-01-01 ${shift.start_time}`);
                        const graceTime = new Date(startTime.getTime() + shift.grace_period_minutes * 60000);
                        const graceTimeStr = graceTime.toISOString().substring(11, 16);
                        return ` (สายหลังจาก ${formatTime(graceTimeStr)} น.)`;
                      })()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Work Type */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Work Type
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {workTypeOptions.map((option) => {
                  const Icon = option.icon
                  const isSelected = workType === option.value
                  return (
                    <button
                      key={option.value}
                      onClick={() => setWorkType(option.value)}
                      className={cn(
                        "relative p-4 rounded-xl border-2 transition-all duration-300 text-left",
                        "hover:shadow-lg active:scale-98 touch-target",
                        isSelected
                          ? `border-transparent bg-gradient-to-br ${option.gradient} text-white shadow-lg`
                          : "border-border bg-background/50 hover:border-primary/30"
                      )}
                    >
                      <Icon className={cn(
                        "h-6 w-6 mb-2",
                        isSelected ? "text-white" : "text-muted-foreground"
                      )} />
                      <p className={cn(
                        "text-sm font-medium",
                        isSelected ? "text-white" : "text-foreground"
                      )}>
                        {option.label}
                      </p>
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Check-in Section */}
            <div className="border-t border-border/50 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    isCheckedIn ? "bg-green-100" : "bg-muted"
                  )}>
                    <CheckCircle className={cn(
                      "h-4 w-4",
                      isCheckedIn ? "text-green-600" : "text-muted-foreground"
                    )} />
                  </div>
                  <h3 className="font-semibold">เช็คอิน (เข้างาน)</h3>
                </div>
                {isCheckedIn && (
                  <span className="badge-success">
                    <CheckCircle className="h-3 w-3" />
                    สำเร็จแล้ว
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">เวลาเข้างาน *</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={checkInTime}
                      onChange={(e) => handleTimeChange(e, true)}
                      disabled={loading}
                      placeholder="00:00"
                      maxLength={5}
                      className="pl-10 h-12 rounded-xl font-mono text-center text-lg"
                    />
                  </div>
                  {checkInTime && (
                    <p className="text-xs text-blue-600 font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      = {formatTo12Hour(checkInTime)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    กรอกแบบ 24 ชม. (เช่น 09:00, 13:00, 21:00)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">รูปถ่าย (ไม่บังคับ)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => checkInInputRef.current?.click()}
                    className="w-full h-12 rounded-xl"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    อัปโหลดรูป
                  </Button>
                  <input
                    ref={checkInInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, true)}
                  />
                  {checkInFile && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {checkInFile.name}
                    </p>
                  )}
                </div>
              </div>

              {checkInFile && (
                <div className="mt-3">
                  <div className="relative rounded-xl overflow-hidden border-2 border-green-200">
                    <img
                      src={getImagePreview(checkInFile)}
                      alt="Check-in preview"
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-green-600 text-white text-xs font-medium flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Check-in
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Check-out Section */}
            <div className="border-t border-border/50 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    isCheckedOut ? "bg-green-100" : "bg-muted"
                  )}>
                    <LogOut className={cn(
                      "h-4 w-4",
                      isCheckedOut ? "text-green-600" : "text-muted-foreground"
                    )} />
                  </div>
                  <h3 className="font-semibold">เช็คเอาท์ (เลิกงาน)</h3>
                </div>
                {isCheckedOut && (
                  <span className="badge-success">
                    <CheckCircle className="h-3 w-3" />
                    สำเร็จแล้ว
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">เวลาเลิกงาน</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={checkOutTime}
                      onChange={(e) => handleTimeChange(e, false)}
                      disabled={loading}
                      placeholder="00:00"
                      maxLength={5}
                      className="pl-10 h-12 rounded-xl font-mono text-center text-lg"
                    />
                  </div>
                  {checkOutTime && (
                    <p className="text-xs text-blue-600 font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      = {formatTo12Hour(checkOutTime)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    กรอกแบบ 24 ชม. (เช่น 17:00, 18:30, 21:00) หรือเว้นว่างไว้
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">รูปถ่าย (ไม่บังคับ)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => checkOutInputRef.current?.click()}
                    className="w-full h-12 rounded-xl"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    อัปโหลดรูป
                  </Button>
                  <input
                    ref={checkOutInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, false)}
                  />
                  {checkOutFile && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {checkOutFile.name}
                    </p>
                  )}
                </div>
              </div>

              {checkOutFile && (
                <div className="mt-3">
                  <div className="relative rounded-xl overflow-hidden border-2 border-green-200">
                    <img
                      src={getImagePreview(checkOutFile)}
                      alt="Check-out preview"
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-blue-600 text-white text-xs font-medium flex items-center gap-1">
                      <LogOut className="h-3 w-3" />
                      Check-out
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={loading || !selectedShift || !checkInTime}
              className="w-full h-14 text-lg font-semibold rounded-xl gradient-primary hover:shadow-2xl hover:shadow-primary/40 active:scale-98 transition-all"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  กำลังบันทึก...
                </div>
              ) : checkOutTime ? (
                <div className="flex items-center gap-2">
                  <Save className="h-5 w-5" />
                  บันทึกเวลาเข้า-ออกงาน
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-5 w-5" />
                  บันทึกเวลาเข้างาน
                </div>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
              <CheckCircle className="h-3 w-3" />
              สามารถบันทึกทั้งเวลาเข้าและออกพร้อมกันได้ หรือบันทึกแยกกันก็ได้
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
