import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useSearchParams } from 'react-router-dom'
import Layout from '@/components/Layout'
import { getAllEmployees } from '@/services/employeeService'
import { getTimeRecords } from '@/services/timeService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Download, Clock, Camera, MapPin, Eye, Calendar, CheckCircle, AlertCircle, Users, Search } from 'lucide-react'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import Papa from 'papaparse'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

export default function EmployeeAttendanceHistory() {
  const { employee, loading } = useAuth()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  const [employees, setEmployees] = useState([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [records, setRecords] = useState([])
  const [loadingEmployees, setLoadingEmployees] = useState(true)
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedImage, setSelectedImage] = useState(null)
  const [showImageDialog, setShowImageDialog] = useState(false)

  useEffect(() => {
    if (!loading && employee?.id) {
      fetchEmployees()
      
      // Check if employee ID is in URL parameter
      const empId = searchParams.get('employee')
      if (empId) {
        setSelectedEmployeeId(empId)
      }
    }
  }, [employee?.id, loading, searchParams])

  useEffect(() => {
    if (selectedEmployeeId) {
      fetchRecords()
    }
  }, [selectedMonth, selectedYear, selectedEmployeeId])

  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true)
      const data = await getAllEmployees()
      setEmployees(data || [])
      
      // Auto-select employee from URL or first employee
      const empId = searchParams.get('employee')
      if (empId) {
        setSelectedEmployeeId(empId)
        const emp = data.find(e => e.id === empId)
        setSelectedEmployee(emp)
      } else if (!selectedEmployeeId && data && data.length > 0) {
        setSelectedEmployeeId(data[0].id)
        setSelectedEmployee(data[0])
      }
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoadingEmployees(false)
    }
  }

  const handleEmployeeSelect = (employeeId) => {
    setSelectedEmployeeId(employeeId)
    const emp = employees.find(e => e.id === employeeId)
    setSelectedEmployee(emp)
  }

  const fetchRecords = async () => {
    if (!selectedEmployeeId) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'กรุณาเลือกพนักงาน',
        variant: 'destructive',
      })
      return
    }

    setRecordsLoading(true)
    try {
      const startDate = format(startOfMonth(new Date(selectedYear, selectedMonth)), 'yyyy-MM-dd')
      const endDate = format(endOfMonth(new Date(selectedYear, selectedMonth)), 'yyyy-MM-dd')

      const data = await getTimeRecords(selectedEmployeeId, startDate, endDate)
      setRecords(data || [])
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setRecordsLoading(false)
    }
  }

  const exportToCSV = () => {
    if (records.length === 0) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่มีข้อมูลให้ส่งออก',
        variant: 'destructive',
      })
      return
    }

    const csvData = records.map(record => ({
      วันที่: format(new Date(record.date), 'yyyy-MM-dd'),
      'เช็คอิน': record.check_in ? format(new Date(record.check_in), 'HH:mm:ss') : 'N/A',
      'เช็คเอาท์': record.check_out ? format(new Date(record.check_out), 'HH:mm:ss') : 'N/A',
      'ประเภทงาน': record.work_type,
      สถานะ: record.status,
      'รูปเช็คอิน': record.check_in_image ? 'มี' : 'ไม่มี',
      'รูปเช็คเอาท์': record.check_out_image ? 'มี' : 'ไม่มี',
      ละติจูด: record.lat || 'N/A',
      ลองจิจูด: record.lng || 'N/A',
    }))

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance_${selectedEmployee?.name}_${format(new Date(selectedYear, selectedMonth), 'yyyy-MM')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: 'ส่งออกสำเร็จ',
      description: 'ดาวน์โหลดข้อมูลประวัติการเข้างานแล้ว',
    })
  }

  const viewImage = (imageUrl, type) => {
    setSelectedImage({ url: imageUrl, type })
    setShowImageDialog(true)
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const monthsThai = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ]

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  const getStatusColor = (status) => {
    switch (status) {
      case 'normal': return 'bg-green-100 text-green-700'
      case 'late': return 'bg-yellow-100 text-yellow-700'
      case 'absent': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'normal': return 'ปกติ'
      case 'late': return 'สาย'
      case 'absent': return 'ขาดงาน'
      default: return status || '-'
    }
  }

  const getWorkTypeIcon = (workType) => {
    switch (workType) {
      case 'office': return <CheckCircle className="h-3 w-3" />
      case 'wfh': return <Calendar className="h-3 w-3" />
      case 'field': return <MapPin className="h-3 w-3" />
      default: return <Clock className="h-3 w-3" />
    }
  }

  const calculateStats = () => {
    const stats = {
      totalDays: records.length,
      normalDays: records.filter(r => r.status === 'normal').length,
      lateDays: records.filter(r => r.status === 'late').length,
      absentDays: records.filter(r => r.status === 'absent').length,
      totalWorkHours: 0,
    }

    records.forEach(record => {
      if (record.check_in && record.check_out) {
        const checkIn = new Date(record.check_in)
        const checkOut = new Date(record.check_out)
        const hours = (checkOut - checkIn) / (1000 * 60 * 60)
        stats.totalWorkHours += hours
      }
    })

    return stats
  }

  const stats = calculateStats()

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                ประวัติการเข้างานของพนักงาน
              </h1>
              <p className="text-muted-foreground">ดูรายละเอียดการเข้างานรายบุคคล</p>
            </div>
          </div>
          <Button
            onClick={exportToCSV}
            disabled={records.length === 0}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:shadow-xl hover:shadow-cyan-500/40 active:scale-95 transition-all h-12 rounded-xl"
          >
            <Download className="h-4 w-4 mr-2" />
            ส่งออก CSV
          </Button>
        </div>

        {/* Employee Selection Card */}
        <Card className="bg-white border border-gray-200 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-xl">เลือกพนักงาน</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loadingEmployees ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                <Select
                  value={selectedEmployeeId || ''}
                  onValueChange={handleEmployeeSelect}
                >
                  <SelectTrigger className="h-14 border-2 border-gray-200 focus:border-blue-600">
                    <SelectValue placeholder="เลือกพนักงาน..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center text-white text-xs font-bold">
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium">{emp.name}</div>
                            <div className="text-xs text-gray-500">{emp.role} - {emp.department?.name || '-'}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Selected Employee Info */}
                {selectedEmployee && (
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border-2 border-blue-200">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center text-white text-xl font-bold">
                        {selectedEmployee.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900">{selectedEmployee.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="capitalize">{selectedEmployee.role}</span>
                          <span>•</span>
                          <span>{selectedEmployee.department?.name || '-'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Month/Year Filter Card */}
        <Card className="bg-white border border-gray-200 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-xl">เลือกช่วงเวลา</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">เดือน</label>
                <Select
                  value={selectedMonth.toString()}
                  onValueChange={(v) => setSelectedMonth(parseInt(v))}
                >
                  <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month, idx) => (
                      <SelectItem key={idx} value={idx.toString()}>
                        {monthsThai[idx]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">ปี</label>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(v) => setSelectedYear(parseInt(v))}
                >
                  <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year + 543} {/* Thai Buddhist year */}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        {!recordsLoading && records.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-white border-2 border-blue-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{stats.totalDays}</div>
                  <div className="text-sm text-gray-600 mt-1">วันทั้งหมด</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-2 border-green-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{stats.normalDays}</div>
                  <div className="text-sm text-gray-600 mt-1">มาปกติ</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-2 border-yellow-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">{stats.lateDays}</div>
                  <div className="text-sm text-gray-600 mt-1">มาสาย</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-2 border-purple-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{stats.totalWorkHours.toFixed(1)}</div>
                  <div className="text-sm text-gray-600 mt-1">ชั่วโมงทำงาน</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Records List */}
        <Card className="bg-white border border-gray-200 shadow-lg">
          <CardContent className="pt-6">
            {loading || loadingEmployees || recordsLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
                <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
              </div>
            ) : !selectedEmployeeId ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Users className="h-20 w-20 text-gray-300 mb-4" />
                <p className="text-gray-600 text-lg">กรุณาเลือกพนักงานเพื่อดูประวัติ</p>
              </div>
            ) : records.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Calendar className="h-12 w-12 text-gray-400" />
                </div>
                <p className="text-gray-600 text-lg font-medium">ไม่พบข้อมูล</p>
                <p className="text-gray-500 text-sm mt-1">
                  ไม่มีบันทึกการเข้างานสำหรับ {monthsThai[selectedMonth]} {selectedYear + 543}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-4 px-4 font-semibold text-gray-700">วันที่</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-700">เช็คอิน</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-700">เช็คเอาท์</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-700">ประเภทงาน</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-700">สถานะ</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-700">รายละเอียด</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((record) => (
                        <tr key={record.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                          <td className="py-4 px-4 font-medium">
                            {format(new Date(record.date), 'd MMM yyyy')}
                          </td>
                          <td className="py-4 px-4">
                            {record.check_in ? (
                              <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                  <Camera className="h-5 w-5 text-green-600" />
                                </div>
                                <span className="font-semibold text-green-700">{format(new Date(record.check_in), 'HH:mm')}</span>
                                {record.check_in_image && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => viewImage(record.check_in_image, 'Check-in')}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            {record.check_out ? (
                              <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                  <Camera className="h-5 w-5 text-blue-600" />
                                </div>
                                <span className="font-semibold text-blue-700">{format(new Date(record.check_out), 'HH:mm')}</span>
                                {record.check_out_image && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => viewImage(record.check_out_image, 'Check-out')}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-4 px-4 capitalize">
                            <div className="flex items-center gap-2">
                              {getWorkTypeIcon(record.work_type)}
                              <span>{record.work_type === 'office' ? 'สำนักงาน' : record.work_type === 'wfh' ? 'WFH' : 'ภายนอก'}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={cn("px-3 py-1.5 rounded-full text-xs font-medium", getStatusColor(record.status))}>
                              {getStatusLabel(record.status)}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            {record.lat && record.lng && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <MapPin className="h-4 w-4" />
                                <span className="text-xs">GPS</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-4">
                  {records.map((record) => (
                    <Card key={record.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-14 h-14 rounded-xl flex items-center justify-center",
                              record.status === 'normal' ? "bg-gradient-to-br from-green-500 to-green-600" :
                              record.status === 'late' ? "bg-gradient-to-br from-yellow-500 to-orange-500" : "bg-gradient-to-br from-red-500 to-red-600"
                            )}>
                              <Calendar className="h-7 w-7 text-white" />
                            </div>
                            <div>
                              <p className="font-bold text-lg">
                                {format(new Date(record.date), 'd MMM yyyy')}
                              </p>
                              <p className="text-xs text-gray-500">
                                {format(new Date(record.date), 'EEEE')}
                              </p>
                            </div>
                          </div>
                          <span className={cn("px-3 py-1.5 rounded-full text-xs font-medium", getStatusColor(record.status))}>
                            {getStatusLabel(record.status)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                          {/* Check-in */}
                          <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-7 h-7 rounded-lg bg-green-200 flex items-center justify-center">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </div>
                              <span className="text-xs font-medium text-green-700">เช็คอิน</span>
                            </div>
                            {record.check_in ? (
                              <div>
                                <p className="text-xl font-bold text-green-700">
                                  {format(new Date(record.check_in), 'HH:mm')}
                                </p>
                                {record.check_in_image && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => viewImage(record.check_in_image, 'Check-in')}
                                    className="h-8 mt-2 text-green-600 hover:bg-green-100"
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    ดูรูป
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <p className="text-gray-400 text-sm">-</p>
                            )}
                          </div>

                          {/* Check-out */}
                          <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-7 h-7 rounded-lg bg-blue-200 flex items-center justify-center">
                                <CheckCircle className="h-4 w-4 text-blue-600" />
                              </div>
                              <span className="text-xs font-medium text-blue-700">เช็คเอาท์</span>
                            </div>
                            {record.check_out ? (
                              <div>
                                <p className="text-xl font-bold text-blue-700">
                                  {format(new Date(record.check_out), 'HH:mm')}
                                </p>
                                {record.check_out_image && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => viewImage(record.check_out_image, 'Check-out')}
                                    className="h-8 mt-2 text-blue-600 hover:bg-blue-100"
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    ดูรูป
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <p className="text-gray-400 text-sm">-</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                          <div className="flex items-center gap-2">
                            <div className="px-3 py-1.5 rounded-lg bg-gray-100 flex items-center gap-1">
                              {getWorkTypeIcon(record.work_type)}
                              <span className="text-xs text-gray-600 capitalize">
                                {record.work_type === 'office' ? 'สำนักงาน' : record.work_type === 'wfh' ? 'WFH' : 'ภายนอก'}
                              </span>
                            </div>
                          </div>
                          {record.lat && record.lng && (
                            <div className="flex items-center gap-1 text-gray-600 text-xs">
                              <MapPin className="h-3 w-3" />
                              <span>GPS</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Image Preview Dialog */}
        <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
          <DialogContent className="max-w-3xl rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                {selectedImage?.type} Photo
              </DialogTitle>
            </DialogHeader>
            {selectedImage?.url ? (
              <div className="relative rounded-xl overflow-hidden">
                <img
                  src={selectedImage.url}
                  alt={`${selectedImage.type} photo`}
                  className="w-full h-auto"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <AlertCircle className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-gray-600">ไม่มีรูปภาพ</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}
