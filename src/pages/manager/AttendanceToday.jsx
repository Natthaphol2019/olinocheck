import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import { getAllTimeRecords } from '@/services/timeService'
import { getAllEmployees } from '@/services/employeeService'
import { supabase } from '@/services/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Users, CheckCircle, Clock, X, Eye, Download } from 'lucide-react'
import { format } from 'date-fns'
import Papa from 'papaparse'

export default function AttendanceToday() {
  const { employee } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [allEmployees, setAllEmployees] = useState([])
  const [shifts, setShifts] = useState([])
  const [employeeShifts, setEmployeeShifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(null)
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all') // all, present, absent, late

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Use Thai timezone (UTC+7)
      const today = new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }).split(',')[0]
      
      // Get today's attendance records
      const records = await getAllTimeRecords(today, today)
      setAttendanceRecords(records || [])
      
      // Get all employees
      const employees = await getAllEmployees()
      setAllEmployees(employees || [])

      // Get all shifts
      const { data: shiftsData } = await supabase
        .from('shifts')
        .select('*')
        .eq('is_active', true)
      setShifts(shiftsData || [])

      // Get employee shift assignments for today
      const { data: empShiftsData } = await supabase
        .from('employee_shifts')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', today)
        .or(`end_date.is.null,end_date.gte.${today}`)
      setEmployeeShifts(empShiftsData || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const getAttendanceStatus = (empId) => {
    const record = attendanceRecords.find(r => r.employee_id === empId)
    if (!record) return 'absent'
    if (record.status === 'late') return 'late'
    return 'present'
  }

  const getFilteredData = () => {
    if (filterStatus === 'all') return allEmployees
    
    return allEmployees.filter(emp => {
      const status = getAttendanceStatus(emp.id)
      return filterStatus === status
    })
  }

  const getEmployeeRecord = (empId) => {
    return attendanceRecords.find(r => r.employee_id === empId)
  }

  const getEmployeeShift = (empId) => {
    const assignment = employeeShifts.find(a => a.employee_id === empId)
    if (!assignment) return null
    return shifts.find(s => s.id === assignment.shift_id)
  }

  const handleEmployeeClick = (employeeId) => {
    navigate(`/manager/employee-attendance?employee=${employeeId}`)
  }

  const formatTime = (time) => {
    if (!time) return '-'
    return time.substring(0, 5) // HH:MM
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800'
      case 'absent': return 'bg-red-100 text-red-800'
      case 'late': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const viewImage = (imageUrl, type) => {
    setSelectedImage({ url: imageUrl, type })
    setShowImageDialog(true)
  }

  const exportToCSV = () => {
    const csvData = getFilteredData().map(emp => {
      const record = getEmployeeRecord(emp.id)
      const status = getAttendanceStatus(emp.id)
      const shift = getEmployeeShift(emp.id)
      
      return {
        Employee: emp.name,
        Department: emp.department?.name || '-',
        Shift: shift?.name || '-',
        'Shift Hours': shift ? `${formatTime(shift.start_time)} - ${formatTime(shift.end_time)}` : '-',
        Status: status,
        'Check In': record?.check_in ? format(new Date(record.check_in), 'HH:mm:ss') : 'N/A',
        'Check Out': record?.check_out ? format(new Date(record.check_out), 'HH:mm:ss') : 'N/A',
        'OT Hours': record?.ot_hours || 0,
        'Work Type': record?.work_type || '-',
      }
    })

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance_today_${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: 'ส่งออกสำเร็จ',
      description: 'ดาวน์โหลดข้อมูลการเข้างานแล้ว',
    })
  }

  const filteredData = getFilteredData()
  const presentCount = allEmployees.filter(e => getAttendanceStatus(e.id) === 'present').length
  const absentCount = allEmployees.filter(e => getAttendanceStatus(e.id) === 'absent').length
  const lateCount = allEmployees.filter(e => getAttendanceStatus(e.id) === 'late').length

  const monthsThai = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ]

  const getStatusLabel = (status) => {
    switch (status) {
      case 'present': return 'มางาน'
      case 'absent': return 'ขาดงาน'
      case 'late': return 'สาย'
      default: return status
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">การเข้างานวันนี้</h1>
            <p className="text-muted-foreground">
              {format(new Date(), `EEEE d ${monthsThai[format(new Date(), 'M') - 1]} yyyy`)}
            </p>
          </div>
          <Button onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            ส่งออก CSV
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">พนักงานทั้งหมด</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allEmployees.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">มางาน</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{presentCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ขาดงาน</CardTitle>
              <X className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{absentCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">มาสาย</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{lateCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <Card>
          <CardHeader>
            <CardTitle>ตัวกรอง</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="present">มางานเท่านั้น</SelectItem>
                <SelectItem value="absent">ขาดงานเท่านั้น</SelectItem>
                <SelectItem value="late">สายเท่านั้น</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Attendance Table */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>ไม่พบพนักงาน</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>พนักงาน</TableHead>
                      <TableHead>แผนก</TableHead>
                      <TableHead>กะงาน</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead>วันที่</TableHead>
                      <TableHead>เข้างาน</TableHead>
                      <TableHead>เลิกงาน</TableHead>
                      <TableHead>ชั่วโมง OT</TableHead>
                      <TableHead>ประเภทงาน</TableHead>
                      <TableHead>หลักฐาน</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((emp) => {
                      const record = getEmployeeRecord(emp.id)
                      const status = getAttendanceStatus(emp.id)
                      const shift = getEmployeeShift(emp.id)

                      return (
                        <TableRow key={emp.id}>
                          <TableCell>
                            <button
                              onClick={() => handleEmployeeClick(emp.id)}
                              className="font-medium text-blue-600 hover:underline cursor-pointer"
                            >
                              {emp.name}
                            </button>
                          </TableCell>
                          <TableCell>{emp.department?.name || '-'}</TableCell>
                          <TableCell>
                            {shift ? (
                              <div>
                                <div className="text-sm font-medium">{shift.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                              {getStatusLabel(status)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {record?.date ? (
                              <span className="text-sm">
                                {format(new Date(record.date), `d ${monthsThai[format(new Date(record.date), 'M') - 1]} yyyy`)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {record?.check_in ? (
                              <div className="flex items-center gap-2">
                                <span>{format(new Date(record.check_in), 'HH:mm')}</span>
                                {record.check_in_image && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => viewImage(record.check_in_image, 'Check-in')}
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {record?.check_out ? (
                              <div className="flex items-center gap-2">
                                <span>{format(new Date(record.check_out), 'HH:mm')}</span>
                                {record.check_out_image && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => viewImage(record.check_out_image, 'Check-out')}
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {record?.ot_hours > 0 ? (
                              <span className="text-sm font-medium text-orange-600">
                                {record.ot_hours} ชม.
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {record?.work_type === 'office' ? 'สำนักงาน' : 
                             record?.work_type === 'wfh' ? 'WFH' : 
                             record?.work_type === 'field' ? 'ภายนอก' : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {record?.check_in_image && (
                                <span className="text-xs text-green-600">✓ มีรูป</span>
                              )}
                              {record?.lat && record?.lng && (
                                <span className="text-xs text-blue-600">✓ GPS</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Image Preview Dialog */}
        <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedImage?.type === 'Check-in' ? 'รูปเช็คอิน' : 'รูปเช็คเอาท์'}
              </DialogTitle>
            </DialogHeader>
            {selectedImage?.url ? (
              <div className="relative">
                <img
                  src={selectedImage.url}
                  alt={`${selectedImage.type} photo`}
                  className="w-full h-auto rounded-lg"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">ไม่มีรูปภาพ</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}
