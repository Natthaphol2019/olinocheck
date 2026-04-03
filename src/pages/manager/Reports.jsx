import React, { useState } from 'react'
import Layout from '@/components/Layout'
import { getAllTimeRecords } from '@/services/timeService'
import { getAllEmployees } from '@/services/employeeService'
import { supabase } from '@/services/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Download, FileSpreadsheet, FileText, Users, Calendar, Clock } from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import Papa from 'papaparse'

export default function Reports() {
  const { toast } = useToast()
  const [employees, setEmployees] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)
  const [attendanceData, setAttendanceData] = useState([])
  const [archiving, setArchiving] = useState(false)

  const monthsThai = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ]

  React.useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const data = await getAllEmployees()
      setEmployees(data || [])
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const fetchAttendanceData = async () => {
    setLoading(true)
    try {
      const startDate = format(startOfMonth(new Date(selectedYear, selectedMonth)), 'yyyy-MM-dd')
      const endDate = format(endOfMonth(new Date(selectedYear, selectedMonth)), 'yyyy-MM-dd')

      const data = await getAllTimeRecords(startDate, endDate)
      
      // Filter by employee if selected
      const filteredData = selectedEmployee === 'all' 
        ? data 
        : data.filter(r => r.employee_id === selectedEmployee)

      setAttendanceData(filteredData || [])
      
      toast({
        title: 'โหลดข้อมูลสำเร็จ',
        description: `พบข้อมูล ${filteredData?.length || 0} รายการ`,
      })
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const exportToExcel = () => {
    if (attendanceData.length === 0) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่มีข้อมูลให้ส่งออก',
        variant: 'destructive',
      })
      return
    }

    // Create formatted data for Excel
    const excelData = []

    // Add header information
    const employeeName = selectedEmployee === 'all' ? 'ทั้งหมด' : employees.find(e => e.id === selectedEmployee)?.name
    const reportTitle = `รายงานเช็คชื่อเข้าออกงาน - พนักงาน: ${employeeName}`
    const reportPeriod = `ประจำเดือน: ${monthsThai[selectedMonth]} ${selectedYear + 543}`
    const reportDate = `วันที่พิมพ์รายงาน: ${format(new Date(), 'd MMMM yyyy HH:mm')} น.`

    excelData.push([reportTitle])
    excelData.push([reportPeriod])
    excelData.push([reportDate])
    excelData.push([]) // Empty row

    // Add table headers
    excelData.push([
      'ลำดับ',
      'รหัสพนักงาน',
      'ชื่อ-นามสกุล',
      'แผนก',
      'วันที่',
      'วันในสัปดาห์',
      'เวลาเข้างาน',
      'เวลาเลิกงาน',
      'ชั่วโมงทำงาน',
      'ชั่วโมงล่วงเวลา (OT)',
      'ประเภทสถานที่ทำงาน',
      'สถานะการเข้างาน',
      'หมายเหตุ'
    ])

    // Add data rows
    attendanceData.forEach((record, index) => {
      const date = new Date(record.date)
      const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']
      const dayName = dayNames[date.getDay()]
      
      const checkIn = record.check_in ? format(new Date(record.check_in), 'HH:mm') : '-'
      const checkOut = record.check_out ? format(new Date(record.check_out), 'HH:mm') : '-'
      
      let workHours = '-'
      if (record.check_in && record.check_out) {
        const hours = (new Date(record.check_out) - new Date(record.check_in)) / (1000 * 60 * 60)
        workHours = hours.toFixed(2)
      }

      const statusLabel = record.status === 'normal' ? 'ปกติ' : record.status === 'late' ? 'สาย' : record.status === 'absent' ? 'ขาดงาน' : record.status
      const workTypeLabel = record.work_type === 'office' ? 'สำนักงาน' : record.work_type === 'wfh' ? 'WFH' : record.work_type === 'field' ? 'ภายนอก' : record.work_type

      excelData.push([
        index + 1,
        record.employee_id?.substring(0, 8) || '-',
        record.employee?.name || '-',
        record.employee?.department?.name || '-',
        format(date, 'dd/MM/yyyy'),
        dayName,
        checkIn,
        checkOut,
        workHours,
        record.ot_hours || 0,
        workTypeLabel,
        statusLabel,
        ''
      ])
    })

    // Add summary
    excelData.push([])
    excelData.push(['สรุป'])
    excelData.push(['วันมาทำงานทั้งหมด', attendanceData.length])
    excelData.push(['มาปกติ', attendanceData.filter(r => r.status === 'normal').length])
    excelData.push(['มาสาย', attendanceData.filter(r => r.status === 'late').length])
    excelData.push(['ขาดงาน', attendanceData.filter(r => r.status === 'absent').length])
    
    const totalHours = attendanceData.reduce((sum, record) => {
      if (record.check_in && record.check_out) {
        return sum + (new Date(record.check_out) - new Date(record.check_in)) / (1000 * 60 * 60)
      }
      return sum
    }, 0)
    excelData.push(['ชั่วโมงทำงานรวม', totalHours.toFixed(2)])

    const totalOT = attendanceData.reduce((sum, record) => sum + (parseFloat(record.ot_hours) || 0), 0)
    excelData.push(['OT รวม (ชม.)', totalOT.toFixed(2)])

    // Convert to CSV (Excel can open CSV)
    const csv = Papa.unparse(excelData)
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    
    // Create filename with employee name and month
    const fileName = `รายงานเช็คชื่อ_${employeeName}_${monthsThai[selectedMonth]}_${selectedYear + 543}.csv`
    a.href = url
    a.download = fileName
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: 'ส่งออกสำเร็จ',
      description: `ดาวน์โหลดไฟล์: ${fileName}`,
    })
  }

  const exportToPDF = () => {
    if (attendanceData.length === 0) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่มีข้อมูลให้ส่งออก',
        variant: 'destructive',
      })
      return
    }

    // Create printable HTML
    const employeeName = selectedEmployee === 'all' ? 'ทั้งหมด' : employees.find(e => e.id === selectedEmployee)?.name
    
    const printWindow = window.open('', '_blank')
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>รายงานเช็คชื่อเข้าออกงาน</title>
        <style>
          body {
            font-family: 'Sarabun', 'Tahoma', sans-serif;
            margin: 40px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            color: #1e40af;
          }
          .header h2 {
            margin: 10px 0 5px 0;
            font-size: 18px;
            color: #374151;
          }
          .header p {
            margin: 5px 0;
            font-size: 14px;
            color: #6b7280;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 13px;
          }
          th, td {
            border: 1px solid #d1d5db;
            padding: 8px;
            text-align: center;
          }
          th {
            background-color: #3b82f6;
            color: white;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f9fafb;
          }
          .summary {
            margin-top: 30px;
            padding: 15px;
            background-color: #f3f4f6;
            border-left: 4px solid #3b82f6;
          }
          .summary h3 {
            margin: 0 0 10px 0;
            color: #1e40af;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
          }
          @media print {
            body { margin: 20px; }
            th { background-color: #3b82f6 !important; color: white !important; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>รายงานเช็คชื่อเข้าออกงาน</h1>
          <h2>พนักงาน: ${employeeName}</h2>
          <p>ประจำเดือน: ${monthsThai[selectedMonth]} ${selectedYear + 543}</p>
          <p>วันที่พิมพ์รายงาน: ${format(new Date(), 'd MMMM yyyy HH:mm')} น.</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>ลำดับ</th>
              <th>ชื่อ-นามสกุล</th>
              <th>วันที่</th>
              <th>วัน</th>
              <th>เวลาเข้า</th>
              <th>เวลาออก</th>
              <th>ชั่วโมง</th>
              <th>OT</th>
              <th>ประเภท</th>
              <th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
    `)

    const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']

    attendanceData.forEach((record, index) => {
      const date = new Date(record.date)
      const dayName = dayNames[date.getDay()]
      const checkIn = record.check_in ? format(new Date(record.check_in), 'HH:mm') : '-'
      const checkOut = record.check_out ? format(new Date(record.check_out), 'HH:mm') : '-'
      
      let workHours = '-'
      if (record.check_in && record.check_out) {
        const hours = (new Date(record.check_out) - new Date(record.check_in)) / (1000 * 60 * 60)
        workHours = hours.toFixed(2)
      }

      const statusLabel = record.status === 'normal' ? 'ปกติ' : record.status === 'late' ? 'สาย' : record.status === 'absent' ? 'ขาด' : '-'
      const workTypeLabel = record.work_type === 'office' ? 'สำนักงาน' : record.work_type === 'wfh' ? 'WFH' : record.work_type === 'field' ? 'ภายนอก' : '-'

      printWindow.document.write(`
        <tr>
          <td>${index + 1}</td>
          <td style="text-align: left;">${record.employee?.name || '-'}</td>
          <td>${format(date, 'dd/MM/yyyy')}</td>
          <td>${dayName}</td>
          <td>${checkIn}</td>
          <td>${checkOut}</td>
          <td>${workHours}</td>
          <td>${record.ot_hours || 0}</td>
          <td>${workTypeLabel}</td>
          <td>${statusLabel}</td>
        </tr>
      `)
    })

    const totalHours = attendanceData.reduce((sum, record) => {
      if (record.check_in && record.check_out) {
        return sum + (new Date(record.check_out) - new Date(record.check_in)) / (1000 * 60 * 60)
      }
      return sum
    }, 0)

    printWindow.document.write(`
          </tbody>
        </table>
        
        <div class="summary">
          <h3>สรุป</h3>
          <p>วันมาทำงานทั้งหมด: ${attendanceData.length} วัน</p>
          <p>มาปกติ: ${attendanceData.filter(r => r.status === 'normal').length} วัน</p>
          <p>มาสาย: ${attendanceData.filter(r => r.status === 'late').length} วัน</p>
          <p>ขาดงาน: ${attendanceData.filter(r => r.status === 'absent').length} วัน</p>
          <p>ชั่วโมงทำงานรวม: ${totalHours.toFixed(2)} ชั่วโมง</p>
        </div>
        
        <div class="footer">
          <p>เอกสารนี้สร้างโดยระบบ OlinoCheck | ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
        </div>
      </body>
      </html>
    `)

    printWindow.document.close()
    
    toast({
      title: 'สร้างรายงานสำเร็จ',
      description: 'พิมพ์หรือบันทึกเป็น PDF ได้แล้ว (กด Ctrl+P หรือ Cmd+P)',
    })
  }

  const handleArchiveAndDeleteImages = async () => {
    if (!window.confirm(
      `ต้องการสรุปและลบรูปภาพเดือน ${monthsThai[selectedMonth]} ${selectedYear + 543} ใช่หรือไม่?\n\n` +
      `ระบบจะ:\n` +
      `✅ เก็บข้อมูลเวลาเข้า-ออกงานไว้\n` +
      `✅ ลบรูปภาพเช็คอิน/เช็คเอาท์ทั้งหมด\n` +
      `✅ ลบไฟล์แนบคำร้องทั้งหมด\n\n` +
      `การกระทำนี้ไม่สามารถย้อนกลับได้`
    )) {
      return
    }

    setArchiving(true)
    try {
      const startDate = format(startOfMonth(new Date(selectedYear, selectedMonth)), 'yyyy-MM-dd')
      const endDate = format(endOfMonth(new Date(selectedYear, selectedMonth)), 'yyyy-MM-dd')

      // Get all records for the month
      const { data: records, error: fetchError } = await supabase
        .from('time_records')
        .select('check_in_image, check_out_image')
        .gte('date', startDate)
        .lte('date', endDate)

      if (fetchError) throw fetchError

      if (!records || records.length === 0) {
        toast({
          title: 'ไม่มีข้อมูล',
          description: 'ไม่มีข้อมูลการเข้างานในเดือนนี้',
        })
        setArchiving(false)
        return
      }

      // Collect all image URLs
      const imageUrls = []
      records.forEach(record => {
        if (record.check_in_image) imageUrls.push(record.check_in_image)
        if (record.check_out_image) imageUrls.push(record.check_out_image)
      })

      // Delete images from storage
      let deletedCount = 0
      for (const url of imageUrls) {
        try {
          // Extract file path from URL
          const filePath = url.split('/attendance/')[1]
          if (filePath) {
            const { error: deleteError } = await supabase.storage
              .from('attendance')
              .remove([filePath])
            
            if (!deleteError) deletedCount++
          }
        } catch (err) {
          console.error('Error deleting image:', err)
        }
      }

      // Update database to remove image references
      const { error: updateError } = await supabase
        .from('time_records')
        .update({ check_in_image: null, check_out_image: null })
        .gte('date', startDate)
        .lte('date', endDate)

      if (updateError) throw updateError

      toast({
        title: 'สรุปข้อมูลสำเร็จ',
        description: `ลบรูปภาพ ${deletedCount} ไฟล์, เก็บข้อมูลเวลา ${records.length} รายการ`,
      })

      // Refresh data
      fetchAttendanceData()
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setArchiving(false)
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <FileSpreadsheet className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              รายงาน
            </h1>
            <p className="text-muted-foreground">ส่งออกและพิมพ์รายงานการเข้างาน</p>
          </div>
        </div>

        {/* Filters Card */}
        <Card className="bg-white border-2 border-blue-200">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              ตัวกรอง
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>พนักงาน</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="เลือกพนักงาน" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>เดือน</Label>
                <Select
                  value={selectedMonth.toString()}
                  onValueChange={(v) => setSelectedMonth(parseInt(v))}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthsThai.map((month, idx) => (
                      <SelectItem key={idx} value={idx.toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>ปี</Label>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(v) => setSelectedYear(parseInt(v))}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year + 543}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={fetchAttendanceData}
              disabled={loading}
              className="w-full mt-4 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:shadow-lg"
            >
              <Users className="h-4 w-4 mr-2" />
              {loading ? 'กำลังโหลด...' : 'โหลดข้อมูล'}
            </Button>
          </CardContent>
        </Card>

        {/* Results Card */}
        {attendanceData.length > 0 && (
          <Card className="bg-white border-2 border-green-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  ผลข้อมูล ({attendanceData.length} รายการ)
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={exportToExcel}
                    variant="outline"
                    className="gap-2 border-green-600 text-green-600 hover:bg-green-50"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Export Excel
                  </Button>
                  <Button
                    onClick={exportToPDF}
                    variant="outline"
                    className="gap-2 border-red-600 text-red-600 hover:bg-red-50"
                  >
                    <FileText className="h-4 w-4" />
                    พิมพ์/PDF
                  </Button>
                  <Button
                    onClick={handleArchiveAndDeleteImages}
                    disabled={archiving || attendanceData.length === 0}
                    variant="outline"
                    className="gap-2 border-orange-600 text-orange-600 hover:bg-orange-50"
                  >
                    <Calendar className="h-4 w-4" />
                    {archiving ? 'กำลังสรุป...' : 'สรุปและลบรูป'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">ลำดับ</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">ชื่อ-นามสกุล</th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-semibold">วันที่</th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-semibold">เข้างาน</th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-semibold">เลิกงาน</th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-semibold">ชั่วโมง</th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-semibold">OT</th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-semibold">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceData.slice(0, 50).map((record, index) => {
                      const date = new Date(record.date)
                      const checkIn = record.check_in ? format(new Date(record.check_in), 'HH:mm') : '-'
                      const checkOut = record.check_out ? format(new Date(record.check_out), 'HH:mm') : '-'
                      const statusLabel = record.status === 'normal' ? 'ปกติ' : record.status === 'late' ? 'สาย' : record.status === 'absent' ? 'ขาด' : '-'
                      
                      let workHours = '-'
                      if (record.check_in && record.check_out) {
                        const hours = (new Date(record.check_out) - new Date(record.check_in)) / (1000 * 60 * 60)
                        workHours = hours.toFixed(2)
                      }

                      return (
                        <tr key={record.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                          <td className="border border-gray-300 px-4 py-2 font-medium">{record.employee?.name || '-'}</td>
                          <td className="border border-gray-300 px-4 py-2 text-center">{format(date, 'dd/MM/yyyy')}</td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            <span className={record.check_in ? 'text-green-600 font-medium' : 'text-gray-400'}>{checkIn}</span>
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            <span className={record.check_out ? 'text-blue-600 font-medium' : 'text-gray-400'}>{checkOut}</span>
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-center">{workHours}</td>
                          <td className="border border-gray-300 px-4 py-2 text-center">{record.ot_hours || 0}</td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              record.status === 'normal' ? 'bg-green-100 text-green-700' :
                              record.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                              record.status === 'absent' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {statusLabel}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {attendanceData.length > 50 && (
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    แสดง 50 รายการจากทั้งหมด {attendanceData.length} รายการ (ส่งออกไฟล์เต็มเพื่อดูทั้งหมด)
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {attendanceData.length === 0 && !loading && (
          <Card className="bg-white">
            <CardContent className="py-16 text-center">
              <FileSpreadsheet className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">ยังไม่มีข้อมูล</p>
              <p className="text-sm text-gray-500 mt-1">เลือกตัวกรองแล้วกด "โหลดข้อมูล"</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}
