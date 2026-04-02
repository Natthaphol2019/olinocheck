import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Layout from '@/components/Layout'
import { getTimeRecords } from '@/services/timeService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Download, Clock, Camera, MapPin, Eye, Calendar, ChevronRight, CheckCircle, AlertCircle } from 'lucide-react'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import Papa from 'papaparse'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

export default function History() {
  const { employee, loading } = useAuth()
  const { toast } = useToast()
  const [records, setRecords] = useState([])
  const [recordsLoading, setRecordsLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedImage, setSelectedImage] = useState(null)
  const [showImageDialog, setShowImageDialog] = useState(false)

  useEffect(() => {
    if (!loading && employee?.id) {
      fetchRecords()
    }
  }, [selectedMonth, selectedYear, employee?.id, loading])

  const fetchRecords = async () => {
    if (!employee?.id) {
      toast({
        title: 'Error',
        description: 'Employee not logged in',
        variant: 'destructive',
      })
      return
    }

    setRecordsLoading(true)
    try {
      const startDate = format(startOfMonth(new Date(selectedYear, selectedMonth)), 'yyyy-MM-dd')
      const endDate = format(endOfMonth(new Date(selectedYear, selectedMonth)), 'yyyy-MM-dd')

      const data = await getTimeRecords(employee.id, startDate, endDate)
      setRecords(data || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setRecordsLoading(false)
    }
  }

  const exportToCSV = () => {
    const csvData = records.map(record => ({
      Date: format(new Date(record.date), 'yyyy-MM-dd'),
      'Check In': record.check_in ? format(new Date(record.check_in), 'HH:mm:ss') : 'N/A',
      'Check Out': record.check_out ? format(new Date(record.check_out), 'HH:mm:ss') : 'N/A',
      'Work Type': record.work_type,
      Status: record.status,
      'Check In Photo': record.check_in_image ? 'Yes' : 'No',
      'Check Out Photo': record.check_out_image ? 'Yes' : 'No',
      Latitude: record.lat || 'N/A',
      Longitude: record.lng || 'N/A',
    }))

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance_${employee.name}_${format(new Date(selectedYear, selectedMonth), 'yyyy-MM')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: 'Export Successful',
      description: 'Your attendance history has been downloaded',
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
      case 'normal': return 'badge-success'
      case 'late': return 'badge-warning'
      case 'absent': return 'badge-danger'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'normal': return 'ปกติ'
      case 'late': return 'สาย'
      case 'absent': return 'ขาดงาน'
      default: return status
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

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl gradient-blue flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                ประวัติการเข้างาน
              </h1>
              <p className="text-muted-foreground">ดูประวัติการเช็คอินและเช็คเอาท์ของคุณ</p>
            </div>
          </div>
          <Button 
            onClick={exportToCSV} 
            disabled={records.length === 0}
            className="gradient-primary hover:shadow-xl hover:shadow-primary/40 active:scale-95 transition-all h-12 rounded-xl"
          >
            <Download className="h-4 w-4 mr-2" />
            ส่งออก CSV
          </Button>
        </div>

        {/* Filter Card */}
        <Card className="card-glass">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle>กรองข้อมูล</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">เดือน</label>
                <Select
                  value={selectedMonth.toString()}
                  onValueChange={(v) => setSelectedMonth(parseInt(v))}
                >
                  <SelectTrigger className="h-12 rounded-xl">
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
                <label className="text-sm font-medium text-muted-foreground">ปี</label>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(v) => setSelectedYear(parseInt(v))}
                >
                  <SelectTrigger className="h-12 rounded-xl">
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

        {/* Records List */}
        <Card className="card-glass">
          <CardContent className="pt-6">
            {loading || recordsLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
              </div>
            ) : !employee ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Clock className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground text-lg">กรุณาเข้าสู่ระบบเพื่อดูประวัติ</p>
              </div>
            ) : records.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Calendar className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-lg font-medium">ไม่พบข้อมูล</p>
                <p className="text-muted-foreground text-sm">
                  ไม่มีบันทึกการเข้างานสำหรับ {monthsThai[selectedMonth]} {selectedYear + 543}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">วันที่</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">เช็คอิน</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">เช็คเอาท์</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">ประเภทงาน</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">สถานะ</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">รายละเอียด</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((record) => (
                        <tr key={record.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 font-medium">
                            {format(new Date(record.date), 'd MMM yyyy')}
                          </td>
                          <td className="py-3 px-4">
                            {record.check_in ? (
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                                  <Camera className="h-4 w-4 text-green-600" />
                                </div>
                                <span className="font-medium">{format(new Date(record.check_in), 'HH:mm')}</span>
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
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {record.check_out ? (
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                  <Camera className="h-4 w-4 text-blue-600" />
                                </div>
                                <span className="font-medium">{format(new Date(record.check_out), 'HH:mm')}</span>
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
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 capitalize">
                            <div className="flex items-center gap-2">
                              {getWorkTypeIcon(record.work_type)}
                              <span>{record.work_type}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={cn("px-3 py-1 rounded-full text-xs font-medium", getStatusColor(record.status))}>
                              {getStatusLabel(record.status)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {record.lat && record.lng && (
                              <div className="flex items-center gap-2 text-muted-foreground">
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
                <div className="lg:hidden space-y-3">
                  {records.map((record) => (
                    <Card key={record.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center",
                              record.status === 'normal' ? "gradient-success" :
                              record.status === 'late' ? "gradient-warning" : "gradient-danger"
                            )}>
                              <Calendar className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-lg">
                                {format(new Date(record.date), 'd MMM yyyy')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(record.date), 'EEEE')}
                              </p>
                            </div>
                          </div>
                          <span className={cn("px-3 py-1.5 rounded-full text-xs font-medium", getStatusColor(record.status))}>
                            {getStatusLabel(record.status)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                          {/* Check-in */}
                          <div className="bg-green-50 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 rounded-lg bg-green-200 flex items-center justify-center">
                                <CheckCircle className="h-3 w-3 text-green-600" />
                              </div>
                              <span className="text-xs font-medium text-green-700">เช็คอิน</span>
                            </div>
                            {record.check_in ? (
                              <div>
                                <p className="text-lg font-bold text-green-700">
                                  {format(new Date(record.check_in), 'HH:mm')}
                                </p>
                                {record.check_in_image && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => viewImage(record.check_in_image, 'Check-in')}
                                    className="h-8 mt-1 text-green-600 hover:bg-green-100"
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    ดูรูป
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <p className="text-muted-foreground text-sm">-</p>
                            )}
                          </div>

                          {/* Check-out */}
                          <div className="bg-blue-50 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 rounded-lg bg-blue-200 flex items-center justify-center">
                                <CheckCircle className="h-3 w-3 text-blue-600" />
                              </div>
                              <span className="text-xs font-medium text-blue-700">เช็คเอาท์</span>
                            </div>
                            {record.check_out ? (
                              <div>
                                <p className="text-lg font-bold text-blue-700">
                                  {format(new Date(record.check_out), 'HH:mm')}
                                </p>
                                {record.check_out_image && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => viewImage(record.check_out_image, 'Check-out')}
                                    className="h-8 mt-1 text-blue-600 hover:bg-blue-100"
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    ดูรูป
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <p className="text-muted-foreground text-sm">-</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-border/30">
                          <div className="flex items-center gap-2">
                            <div className="px-2 py-1 rounded-lg bg-muted flex items-center gap-1">
                              {getWorkTypeIcon(record.work_type)}
                              <span className="text-xs text-muted-foreground capitalize">{record.work_type}</span>
                            </div>
                          </div>
                          {record.lat && record.lng && (
                            <div className="flex items-center gap-1 text-muted-foreground text-xs">
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
          <DialogContent className="max-w-2xl rounded-2xl">
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
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No image available</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}
