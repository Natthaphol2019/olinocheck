import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Layout from '@/components/Layout'
import { supabase } from '@/services/supabase'
import { getAllEmployees } from '@/services/employeeService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Clock, Plus, Edit, Trash } from 'lucide-react'
import { format } from 'date-fns'

export default function ShiftManagement() {
  const { employee } = useAuth()
  const { toast } = useToast()
  const [shifts, setShifts] = useState([])
  const [employeeShifts, setEmployeeShifts] = useState([])
  const [allEmployees, setAllEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showShiftDialog, setShowShiftDialog] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [selectedShift, setSelectedShift] = useState(null)
  const [shiftForm, setShiftForm] = useState({
    name: '',
    start_time: '09:00',
    end_time: '17:00',
    ot_start_time: '17:00',
    ot_end_time: '21:00',
    description: '',
  })
  const [assignForm, setAssignForm] = useState({
    employee_id: '',
    shift_id: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Get all shifts
      const { data: shiftsData } = await supabase
        .from('shifts')
        .select('*')
        .order('start_time')
      setShifts(shiftsData || [])

      // Get all employee shift assignments
      const { data: empShiftsData } = await supabase
        .from('employee_shifts')
        .select(`
          *,
          employee:employees (id, name),
          shift:shifts (id, name)
        `)
        .eq('is_active', true)
      setEmployeeShifts(empShiftsData || [])

      // Get all employees
      const employees = await getAllEmployees()
      setAllEmployees(employees || [])
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
        title: 'Success',
        description: 'Shift created successfully',
      })

      setShowShiftDialog(false)
      setShiftForm({
        name: '',
        start_time: '09:00',
        end_time: '17:00',
        ot_start_time: '17:00',
        ot_end_time: '21:00',
        description: '',
      })
      fetchData()
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleAssignShift = async (e) => {
    e.preventDefault()
    try {
      const { error } = await supabase
        .from('employee_shifts')
        .insert(assignForm)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Employee assigned to shift successfully',
      })

      setShowAssignDialog(false)
      setAssignForm({
        employee_id: '',
        shift_id: '',
        start_date: format(new Date(), 'yyyy-MM-dd'),
      })
      fetchData()
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleDeleteShift = async (shiftId) => {
    if (!confirm('Are you sure you want to delete this shift?')) return

    try {
      const { error } = await supabase
        .from('shifts')
        .update({ is_active: false })
        .eq('id', shiftId)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Shift deleted successfully',
      })

      fetchData()
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleUnassignShift = async (assignmentId) => {
    if (!confirm('Remove employee from this shift?')) return

    try {
      const { error } = await supabase
        .from('employee_shifts')
        .update({ is_active: false })
        .eq('id', assignmentId)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Employee unassigned successfully',
      })

      fetchData()
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const formatTime = (time) => {
    if (!time) return '-'
    return time.substring(0, 5) // HH:MM
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Shift Management</h1>
            <p className="text-muted-foreground">Manage work shifts and employee assignments</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Assign Shift
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Employee to Shift</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAssignShift} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Employee</Label>
                    <Select
                      value={assignForm.employee_id}
                      onValueChange={(v) => setAssignForm({ ...assignForm, employee_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {allEmployees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Shift</Label>
                    <Select
                      value={assignForm.shift_id}
                      onValueChange={(v) => setAssignForm({ ...assignForm, shift_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select shift" />
                      </SelectTrigger>
                      <SelectContent>
                        {shifts.filter(s => s.is_active).map((shift) => (
                          <SelectItem key={shift.id} value={shift.id}>
                            {shift.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={assignForm.start_date}
                      onChange={(e) => setAssignForm({ ...assignForm, start_date: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Assign Shift
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={showShiftDialog} onOpenChange={setShowShiftDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  New Shift
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Shift</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateShift} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Shift Name</Label>
                    <Input
                      value={shiftForm.name}
                      onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })}
                      placeholder="e.g., Morning Shift"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={shiftForm.start_time}
                        onChange={(e) => setShiftForm({ ...shiftForm, start_time: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Time</Label>
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
                      <Label>OT Start Time</Label>
                      <Input
                        type="time"
                        value={shiftForm.ot_start_time}
                        onChange={(e) => setShiftForm({ ...shiftForm, ot_start_time: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>OT End Time</Label>
                      <Input
                        type="time"
                        value={shiftForm.ot_end_time}
                        onChange={(e) => setShiftForm({ ...shiftForm, ot_end_time: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={shiftForm.description}
                      onChange={(e) => setShiftForm({ ...shiftForm, description: e.target.value })}
                      placeholder="Optional description"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Create Shift
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Shifts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Work Shifts</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : shifts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No shifts defined</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shift Name</TableHead>
                    <TableHead>Work Hours</TableHead>
                    <TableHead>OT Hours</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shifts.filter(s => s.is_active).map((shift) => (
                    <TableRow key={shift.id}>
                      <TableCell className="font-medium">{shift.name}</TableCell>
                      <TableCell>
                        {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                      </TableCell>
                      <TableCell>
                        {shift.ot_start_time && shift.ot_end_time ? (
                          `${formatTime(shift.ot_start_time)} - ${formatTime(shift.ot_end_time)}`
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{shift.description || '-'}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteShift(shift.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Employee Shift Assignments */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Shift Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : employeeShifts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No shift assignments yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeShifts.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">
                        {assignment.employee?.name}
                      </TableCell>
                      <TableCell>{assignment.shift?.name}</TableCell>
                      <TableCell>
                        {format(new Date(assignment.start_date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnassignShift(assignment.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
