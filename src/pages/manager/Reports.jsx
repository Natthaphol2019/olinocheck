import React, { useState } from 'react'
import Layout from '@/components/Layout'
import { getAllTimeRecords } from '@/services/timeService'
import { getAllOvertime } from '@/services/overtimeService'
import { getAllLeaveRequests } from '@/services/leaveService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { Download, FileSpreadsheet, Clock, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import Papa from 'papaparse'

export default function Reports() {
  const { toast } = useToast()
  const [dateRange, setDateRange] = useState({
    start: format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  })
  const [loading, setLoading] = useState(false)
  const [attendanceData, setAttendanceData] = useState([])
  const [overtimeData, setOvertimeData] = useState([])
  const [leaveData, setLeaveData] = useState([])

  const fetchAttendance = async () => {
    setLoading(true)
    try {
      const data = await getAllTimeRecords(dateRange.start, dateRange.end)
      setAttendanceData(data || [])
      toast({
        title: 'Success',
        description: `Loaded ${data?.length || 0} attendance records`,
      })
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

  const fetchOvertime = async () => {
    setLoading(true)
    try {
      const data = await getAllOvertime(dateRange.start, dateRange.end)
      setOvertimeData(data || [])
      toast({
        title: 'Success',
        description: `Loaded ${data?.length || 0} overtime records`,
      })
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

  const fetchLeave = async () => {
    setLoading(true)
    try {
      const data = await getAllLeaveRequests(dateRange.start, dateRange.end)
      setLeaveData(data || [])
      toast({
        title: 'Success',
        description: `Loaded ${data?.length || 0} leave requests`,
      })
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

  const exportAttendance = () => {
    if (attendanceData.length === 0) {
      toast({
        title: 'Error',
        description: 'No data to export',
        variant: 'destructive',
      })
      return
    }

    const csvData = attendanceData.map(record => ({
      Date: format(new Date(record.date), 'yyyy-MM-dd'),
      Employee: record.employee?.name,
      Role: record.employee?.role,
      Department: record.employee?.department?.name,
      'Check In': record.check_in ? format(new Date(record.check_in), 'HH:mm:ss') : 'N/A',
      'Check Out': record.check_out ? format(new Date(record.check_out), 'HH:mm:ss') : 'N/A',
      'Work Type': record.work_type,
      Status: record.status,
      Latitude: record.lat || 'N/A',
      Longitude: record.lng || 'N/A',
    }))

    const csv = Papa.unparse(csvData)
    downloadCSV(csv, `attendance_report_${dateRange.start}_to_${dateRange.end}.csv`)
  }

  const exportOvertime = () => {
    if (overtimeData.length === 0) {
      toast({
        title: 'Error',
        description: 'No data to export',
        variant: 'destructive',
      })
      return
    }

    const csvData = overtimeData.map(record => ({
      Date: format(new Date(record.date), 'yyyy-MM-dd'),
      Employee: record.employee?.name,
      Role: record.employee?.role,
      Department: record.employee?.department?.name,
      'Start Time': record.start_time,
      'End Time': record.end_time,
      'Total Hours': record.hours,
      Reason: record.reason,
      Status: record.status,
    }))

    const csv = Papa.unparse(csvData)
    downloadCSV(csv, `overtime_report_${dateRange.start}_to_${dateRange.end}.csv`)
  }

  const exportLeave = () => {
    if (leaveData.length === 0) {
      toast({
        title: 'Error',
        description: 'No data to export',
        variant: 'destructive',
      })
      return
    }

    const csvData = leaveData.map(record => ({
      Employee: record.employee?.name,
      Role: record.employee?.role,
      Department: record.employee?.department?.name,
      'Leave Type': record.leave_type,
      'Start Date': format(new Date(record.start_date), 'yyyy-MM-dd'),
      'End Date': format(new Date(record.end_date), 'yyyy-MM-dd'),
      Days: Math.ceil((new Date(record.end_date) - new Date(record.start_date)) / (1000 * 60 * 60 * 24)) + 1,
      Reason: record.reason,
      Status: record.status,
    }))

    const csv = Papa.unparse(csvData)
    downloadCSV(csv, `leave_report_${dateRange.start}_to_${dateRange.end}.csv`)
  }

  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: 'Export Successful',
      description: `${filename} has been downloaded`,
    })
  }

  const LEAVE_TYPES = {
    annual: 'Annual Leave',
    sick: 'Sick Leave',
    personal: 'Personal Leave',
    maternity: 'Maternity Leave',
    paternity: 'Paternity Leave',
    bereavement: 'Bereavement Leave',
    unpaid: 'Unpaid Leave',
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Export attendance, overtime, and leave reports</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Date Range</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="attendance" className="space-y-4">
          <TabsList>
            <TabsTrigger value="attendance">
              <Clock className="h-4 w-4 mr-2" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="overtime">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Overtime
            </TabsTrigger>
            <TabsTrigger value="leave">
              <Calendar className="h-4 w-4 mr-2" />
              Leave
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Report</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={fetchAttendance} disabled={loading}>
                    Load Data
                  </Button>
                  <Button
                    variant="outline"
                    onClick={exportAttendance}
                    disabled={attendanceData.length === 0 || loading}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
                {attendanceData.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {attendanceData.length} records loaded
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overtime" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Overtime Report</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={fetchOvertime} disabled={loading}>
                    Load Data
                  </Button>
                  <Button
                    variant="outline"
                    onClick={exportOvertime}
                    disabled={overtimeData.length === 0 || loading}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
                {overtimeData.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {overtimeData.length} records loaded
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leave" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Leave Report</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={fetchLeave} disabled={loading}>
                    Load Data
                  </Button>
                  <Button
                    variant="outline"
                    onClick={exportLeave}
                    disabled={leaveData.length === 0 || loading}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
                {leaveData.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {leaveData.length} records loaded
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}
