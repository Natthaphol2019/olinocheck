import React, { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { getAllEmployees, getDepartments, createEmployee, updateEmployeePin, deactivateEmployee, reactivateEmployee } from '@/services/employeeService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { Users, Plus, Edit, UserX, UserCheck } from 'lucide-react'

export default function Employees() {
  const { toast } = useToast()
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditPinDialog, setShowEditPinDialog] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    pin: '',
    role: 'employee',
    department_id: '',
  })
  const [newPin, setNewPin] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [empData, deptData] = await Promise.all([
        getAllEmployees(),
        getDepartments(),
      ])
      setEmployees(empData || [])
      setDepartments(deptData || [])
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

  const handleAddEmployee = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.pin || !formData.department_id) {
      toast({
        title: 'Error',
        description: 'Please fill all required fields',
        variant: 'destructive',
      })
      return
    }

    if (formData.pin.length < 4 || formData.pin.length > 6) {
      toast({
        title: 'Error',
        description: 'PIN must be 4-6 digits',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      await createEmployee(
        formData.name,
        formData.pin,
        formData.role,
        formData.department_id
      )
      
      toast({
        title: 'Success',
        description: 'Employee created successfully',
      })
      
      setShowAddDialog(false)
      setFormData({ name: '', pin: '', role: 'employee', department_id: '' })
      fetchData()
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdatePin = async () => {
    if (newPin.length < 4 || newPin.length > 6) {
      toast({
        title: 'Error',
        description: 'PIN must be 4-6 digits',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      await updateEmployeePin(selectedEmployee.id, newPin)
      
      toast({
        title: 'Success',
        description: 'PIN updated successfully',
      })
      
      setShowEditPinDialog(false)
      setNewPin('')
      setSelectedEmployee(null)
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (employee, isActive) => {
    try {
      if (isActive) {
        await deactivateEmployee(employee.id)
        toast({ title: 'Success', description: 'Employee deactivated' })
      } else {
        await reactivateEmployee(employee.id)
        toast({ title: 'Success', description: 'Employee reactivated' })
      }
      fetchData()
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'hr': return 'bg-purple-100 text-purple-800'
      case 'supervisor': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Employees</h1>
            <p className="text-muted-foreground">Manage employee accounts</p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddEmployee} className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>PIN</Label>
                  <Input
                    type="password"
                    inputMode="numeric"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                    placeholder="4-6 digit PIN"
                    maxLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(v) => setFormData({ ...formData, role: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="hr">HR</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select
                    value={formData.department_id}
                    onValueChange={(v) => setFormData({ ...formData, department_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? 'Creating...' : 'Create Employee'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : employees.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No employees found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">{employee.name}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(employee.role)}`}>
                            {employee.role}
                          </span>
                        </TableCell>
                        <TableCell>{employee.department?.name || '-'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            employee.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {employee.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedEmployee(employee)
                                setShowEditPinDialog(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(employee, employee.is_active)}
                            >
                              {employee.is_active ? (
                                <UserX className="h-4 w-4" />
                              ) : (
                                <UserCheck className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit PIN Dialog */}
        <Dialog open={showEditPinDialog} onOpenChange={(open) => {
          setShowEditPinDialog(open)
          if (!open) {
            setSelectedEmployee(null)
            setNewPin('')
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update PIN</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Update PIN for <strong>{selectedEmployee?.name}</strong>
              </p>
              <div className="space-y-2">
                <Label>New PIN</Label>
                <Input
                  type="password"
                  inputMode="numeric"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="4-6 digit PIN"
                  maxLength={6}
                />
              </div>
              <Button
                onClick={handleUpdatePin}
                disabled={submitting || newPin.length < 4}
                className="w-full"
              >
                {submitting ? 'Updating...' : 'Update PIN'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}
