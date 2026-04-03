import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Layout from '@/components/Layout'
import { supabase } from '@/services/supabase'
import { getAllEmployees } from '@/services/employeeService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Clock, Plus, Users, Calendar, CheckCircle, X, Settings, Palette } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

const SHIFT_COLORS = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#10B981', // Green
  '#F59E0B', // Orange
  '#EF4444', // Red
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#6366F1', // Indigo
]

export default function ShiftManagement() {
  const { employee } = useAuth()
  const { toast } = useToast()
  const [shifts, setShifts] = useState([])
  const [employeeShifts, setEmployeeShifts] = useState([])
  const [allEmployees, setAllEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Dialog states
  const [showShiftDialog, setShowShiftDialog] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [selectedShift, setSelectedShift] = useState(null)
  
  // Form states
  const [shiftForm, setShiftForm] = useState({
    name: '',
    start_time: '09:00',
    end_time: '17:00',
    ot_start_time: '',
    ot_end_time: '',
    grace_period_minutes: 15,
    color: '#3B82F6',
    description: '',
  })
  
  const [assignForm, setAssignForm] = useState({
    employee_ids: [],
    shift_id: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: shiftsData } = await supabase
        .from('shifts')
        .select('*')
        .order('display_order', { ascending: true })
      setShifts(shiftsData || [])

      const { data: empShiftsData } = await supabase
        .from('employee_shifts')
        .select(`
          *,
          employee:employees!employee_shifts_employee_id_fkey(id, name),
          shift:shifts!employee_shifts_shift_id_fkey(id, name, color)
        `)
        .eq('is_active', true)
      setEmployeeShifts(empShiftsData || [])

      const employees = await getAllEmployees()
      setAllEmployees(employees || [])
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

  const handleCreateShift = async (e) => {
    e.preventDefault()
    try {
      const { data, error } = await supabase
        .from('shifts')
        .insert(shiftForm)
        .select()
        .single()

      if (error) throw error

      toast({
        title: 'สำเร็จ',
        description: 'สร้างกะงานเรียบร้อยแล้ว',
      })

      setShowShiftDialog(false)
      resetShiftForm()
      fetchData()
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const resetShiftForm = () => {
    setShiftForm({
      name: '',
      start_time: '09:00',
      end_time: '17:00',
      ot_start_time: '',
      ot_end_time: '',
      grace_period_minutes: 15,
      color: '#3B82F6',
      description: '',
    })
    setSelectedShift(null)
  }

  const handleEditShift = (shift) => {
    setSelectedShift(shift)
    setShiftForm({
      name: shift.name,
      start_time: shift.start_time?.substring(0, 5),
      end_time: shift.end_time?.substring(0, 5),
      ot_start_time: shift.ot_start_time?.substring(0, 5) || '',
      ot_end_time: shift.ot_end_time?.substring(0, 5) || '',
      grace_period_minutes: shift.grace_period_minutes || 15,
      color: shift.color || '#3B82F6',
      description: shift.description || '',
    })
    setShowShiftDialog(true)
  }

  const handleUpdateShift = async (e) => {
    e.preventDefault()
    try {
      const { error } = await supabase
        .from('shifts')
        .update(shiftForm)
        .eq('id', selectedShift.id)

      if (error) throw error

      toast({
        title: 'สำเร็จ',
        description: 'อัปเดตกะงานเรียบร้อยแล้ว',
      })

      setShowShiftDialog(false)
      resetShiftForm()
      fetchData()
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleToggleShiftActive = async (shift) => {
    try {
      const { error } = await supabase
        .from('shifts')
        .update({ is_active: !shift.is_active })
        .eq('id', shift.id)

      if (error) throw error

      toast({
        title: 'สำเร็จ',
        description: shift.is_active ? 'ปิดใช้งานกะงานแล้ว' : 'เปิดใช้งานกะงานแล้ว',
      })

      fetchData()
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleAssignShift = async (e) => {
    e.preventDefault()
    
    if (!assignForm.employee_ids.length || !assignForm.shift_id) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'กรุณาเลือกพนักงานและกะงาน',
        variant: 'destructive',
      })
      return
    }

    try {
      const assignments = assignForm.employee_ids.map(empId => ({
        employee_id: empId,
        shift_id: assignForm.shift_id,
        start_date: assignForm.start_date,
      }))

      const { error } = await supabase
        .from('employee_shifts')
        .upsert(assignments, { onConflict: 'employee_id,shift_id,start_date' })

      if (error) throw error

      toast({
        title: 'สำเร็จ',
        description: `จัดกะงานให้พนักงาน ${assignForm.employee_ids.length} คนเรียบร้อยแล้ว`,
      })

      setShowAssignDialog(false)
      setAssignForm({ employee_ids: [], shift_id: '', start_date: format(new Date(), 'yyyy-MM-dd') })
      fetchData()
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleRemoveEmployeeShift = async (assignmentId) => {
    try {
      const { error } = await supabase
        .from('employee_shifts')
        .update({ is_active: false })
        .eq('id', assignmentId)

      if (error) throw error

      toast({
        title: 'สำเร็จ',
        description: 'ยกเลิกการจัดกะงานแล้ว',
      })

      fetchData()
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const formatTime = (time) => {
    if (!time) return '-'
    return time.substring(0, 5)
  }

  const getEmployeesByShift = (shiftId) => {
    return employeeShifts
      .filter(es => es.shift_id === shiftId && es.is_active)
      .map(es => es.employee)
      .filter(Boolean)
  }

  const getEmployeeCurrentShift = (employeeId) => {
    const today = format(new Date(), 'yyyy-MM-dd')
    return employeeShifts.find(es => 
      es.employee_id === employeeId && 
      es.is_active &&
      es.start_date <= today &&
      (es.end_date === null || es.end_date >= today)
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                จัดการกะงาน
              </h1>
              <p className="text-muted-foreground">สร้างและจัดกะงานให้พนักงาน</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => {
                resetShiftForm()
                setShowShiftDialog(true)
              }}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:shadow-xl hover:shadow-cyan-500/40 h-12 rounded-xl"
            >
              <Plus className="h-4 w-4 mr-2" />
              สร้างกะงาน
            </Button>
            <Button 
              onClick={() => setShowAssignDialog(true)}
              variant="outline"
              className="h-12 rounded-xl"
            >
              <Users className="h-4 w-4 mr-2" />
              จัดกะให้พนักงาน
            </Button>
          </div>
        </div>

        {/* Shifts Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {shifts.map((shift) => {
            const employeesInShift = getEmployeesByShift(shift.id)
            
            return (
              <Card 
                key={shift.id} 
                className={cn(
                  "border-2 hover:shadow-lg transition-all",
                  shift.is_active ? "bg-white" : "bg-gray-50 opacity-60"
                )}
                style={{ 
                  borderColor: shift.is_active ? (shift.color || '#3B82F6') : '#E5E7EB',
                  borderLeftWidth: shift.is_active ? '4px' : '2px'
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: shift.color || '#3B82F6' }}
                      />
                      <CardTitle className="text-lg">{shift.name}</CardTitle>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditShift(shift)}
                        className="h-8 w-8 p-0"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleShiftActive(shift)}
                        className="h-8 w-8 p-0"
                      >
                        {shift.is_active ? <X className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Time Info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">เวลาทำงาน:</span>
                      <span className="font-medium">
                        {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                      </span>
                    </div>
                    {shift.ot_start_time && shift.ot_end_time && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">เวลา OT:</span>
                        <span className="font-medium text-orange-600">
                          {formatTime(shift.ot_start_time)} - {formatTime(shift.ot_end_time)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">สายหลังจาก:</span>
                      <span className="font-medium text-yellow-600">
                        {(() => {
                          const startTime = new Date(`2000-01-01 ${shift.start_time || '09:00:00'}`)
                          const graceTime = new Date(startTime.getTime() + (shift.grace_period_minutes || 15) * 60000)
                          return formatTime(graceTime.toISOString().substring(11, 16))
                        })()}
                      </span>
                    </div>
                  </div>

                  {/* Employees Count */}
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">พนักงาน:</span>
                      <span className="font-medium">{employeesInShift.length} คน</span>
                    </div>
                    {employeesInShift.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {employeesInShift.slice(0, 3).map((emp, idx) => (
                          <span 
                            key={idx}
                            className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                          >
                            {emp.name}
                          </span>
                        ))}
                        {employeesInShift.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            +{employeesInShift.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div className={cn(
                    "px-3 py-2 rounded-lg text-xs font-medium",
                    shift.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
                  )}>
                    {shift.is_active ? '✓ เปิดใช้งาน' : '✗ ปิดใช้งาน'}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Shift Assignment Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              การจัดกะงานให้พนักงาน
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : employeeShifts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>ยังไม่ได้จัดกะงานให้พนักงาน</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold">พนักงาน</th>
                      <th className="text-left py-3 px-4 font-semibold">กะงาน</th>
                      <th className="text-left py-3 px-4 font-semibold">วันที่เริ่มต้น</th>
                      <th className="text-left py-3 px-4 font-semibold">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeShifts.map((assignment) => (
                      <tr key={assignment.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{assignment.employee?.name || '-'}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: assignment.shift?.color || '#3B82F6' }}
                            />
                            <span>{assignment.shift?.name || '-'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {assignment.start_date ? format(new Date(assignment.start_date), 'd MMM yyyy') : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveEmployeeShift(assignment.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <X className="h-3 w-3 mr-1" />
                            ยกเลิก
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Shift Dialog */}
        <Dialog open={showShiftDialog} onOpenChange={(open) => {
          setShowShiftDialog(open)
          if (!open) resetShiftForm()
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {selectedShift ? 'แก้ไขกะงาน' : 'สร้างกะงานใหม่'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={selectedShift ? handleUpdateShift : handleCreateShift} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ชื่อกะงาน *</Label>
                  <Input
                    value={shiftForm.name}
                    onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })}
                    placeholder="เช่น กะเช้า, กะบ่าย"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>สีแสดงกะงาน</Label>
                  <div className="flex gap-2 flex-wrap">
                    {SHIFT_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setShiftForm({ ...shiftForm, color })}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 transition-all",
                          shiftForm.color === color ? "border-gray-900 scale-110" : "border-gray-300"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>เวลาเข้างาน *</Label>
                  <Input
                    type="time"
                    value={shiftForm.start_time}
                    onChange={(e) => setShiftForm({ ...shiftForm, start_time: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>เวลาเลิกงาน *</Label>
                  <Input
                    type="time"
                    value={shiftForm.end_time}
                    onChange={(e) => setShiftForm({ ...shiftForm, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>เวลาเริ่ม OT</Label>
                  <Input
                    type="time"
                    value={shiftForm.ot_start_time}
                    onChange={(e) => setShiftForm({ ...shiftForm, ot_start_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>เวลาสิ้นสุด OT</Label>
                  <Input
                    type="time"
                    value={shiftForm.ot_end_time}
                    onChange={(e) => setShiftForm({ ...shiftForm, ot_end_time: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>ระยะเวลาสายได้ (นาที)</Label>
                <Input
                  type="number"
                  min="0"
                  max="60"
                  value={shiftForm.grace_period_minutes}
                  onChange={(e) => setShiftForm({ ...shiftForm, grace_period_minutes: parseInt(e.target.value) || 15 })}
                />
                <p className="text-xs text-muted-foreground">
                  หลังจากเวลาเข้างานกี่นาทีก่อนจะถือว่าเป็นสาย
                </p>
              </div>

              <div className="space-y-2">
                <Label>รายละเอียด</Label>
                <Input
                  value={shiftForm.description}
                  onChange={(e) => setShiftForm({ ...shiftForm, description: e.target.value })}
                  placeholder="คำอธิบายเพิ่มเติม (ถ้ามี)"
                />
              </div>

              <Button type="submit" className="w-full h-12">
                {selectedShift ? 'อัปเดตกะงาน' : 'สร้างกะงาน'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Assign Shift Dialog */}
        <Dialog open={showAssignDialog} onOpenChange={(open) => {
          setShowAssignDialog(open)
          if (!open) setAssignForm({ employee_ids: [], shift_id: '', start_date: format(new Date(), 'yyyy-MM-dd') })
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                จัดกะงานให้พนักงาน
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAssignShift} className="space-y-4">
              <div className="space-y-2">
                <Label>เลือกพนักงาน * (เลือกได้หลายคน)</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                  {allEmployees.map((emp) => (
                    <label key={emp.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={assignForm.employee_ids.includes(emp.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAssignForm({ 
                              ...assignForm, 
                              employee_ids: [...assignForm.employee_ids, emp.id] 
                            })
                          } else {
                            setAssignForm({ 
                              ...assignForm, 
                              employee_ids: assignForm.employee_ids.filter(id => id !== emp.id) 
                            })
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{emp.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {emp.department?.name || '-'}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  เลือกแล้ว {assignForm.employee_ids.length} คน
                </p>
              </div>

              <div className="space-y-2">
                <Label>เลือกกะงาน *</Label>
                <Select 
                  value={assignForm.shift_id} 
                  onValueChange={(v) => setAssignForm({ ...assignForm, shift_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกกะงาน" />
                  </SelectTrigger>
                  <SelectContent>
                    {shifts.filter(s => s.is_active).map((shift) => (
                      <SelectItem key={shift.id} value={shift.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: shift.color || '#3B82F6' }}
                          />
                          {shift.name} ({formatTime(shift.start_time)} - {formatTime(shift.end_time)})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>วันที่เริ่มต้น *</Label>
                <Input
                  type="date"
                  value={assignForm.start_date}
                  onChange={(e) => setAssignForm({ ...assignForm, start_date: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" className="w-full h-12">
                จัดกะงานให้พนักงาน {assignForm.employee_ids.length} คน
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}
