import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Layout from '@/components/Layout'
import { supabase } from '@/services/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Building2, Plus, Edit, Trash2, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function DepartmentManagement() {
  const { employee } = useAuth()
  const { toast } = useToast()
  const [departments, setDepartments] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingDept, setEditingDept] = useState(null)
  const [deptName, setDeptName] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: depts, error: deptError } = await supabase
        .from('departments')
        .select('*')
        .order('name')
      
      if (deptError) throw deptError
      setDepartments(depts || [])

      const { data: emps, error: empError } = await supabase
        .from('employees')
        .select('id, department_id')
        .eq('is_active', true)
      
      if (empError) throw empError
      setEmployees(emps || [])
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!deptName.trim()) return

    try {
      if (editingDept) {
        const { error } = await supabase
          .from('departments')
          .update({ name: deptName.trim() })
          .eq('id', editingDept.id)

        if (error) throw error

        toast({ title: 'สำเร็จ', description: 'อัปเดตแผนกเรียบร้อยแล้ว' })
      } else {
        const { error } = await supabase
          .from('departments')
          .insert({ name: deptName.trim() })

        if (error) throw error

        toast({ title: 'สำเร็จ', description: 'สร้างแผนกเรียบร้อยแล้ว' })
      }

      setShowDialog(false)
      setDeptName('')
      setEditingDept(null)
      fetchData()
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleOpenDialog = (dept = null) => {
    if (dept) {
      setEditingDept(dept)
      setDeptName(dept.name)
    } else {
      setEditingDept(null)
      setDeptName('')
    }
    setShowDialog(true)
  }

  const handleDelete = async (deptId) => {
    const empCount = employees.filter(e => e.department_id === deptId).length
    if (empCount > 0) {
      toast({
        title: 'ไม่สามารถลบได้',
        description: `มีพนักงาน ${empCount} คนในแผนกนี้ ย้ายพนักงานออกก่อน`,
        variant: 'destructive',
      })
      return
    }

    if (!window.confirm('ต้องการลบแผนกนี้หรือไม่?')) return

    try {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', deptId)

      if (error) throw error

      toast({ title: 'สำเร็จ', description: 'ลบแผนกเรียบร้อยแล้ว' })
      fetchData()
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const getEmployeeCount = (deptId) => {
    return employees.filter(e => e.department_id === deptId).length
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                จัดการแผนก
              </h1>
              <p className="text-muted-foreground">เพิ่ม แก้ไข และจัดการแผนกในองค์กร</p>
            </div>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-xl hover:shadow-purple-500/40 h-12 rounded-xl"
          >
            <Plus className="h-4 w-4 mr-2" />
            เพิ่มแผนก
          </Button>
        </div>

        {/* Departments Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full flex justify-center py-16">
              <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
            </div>
          ) : departments.length === 0 ? (
            <div className="col-span-full">
              <Card>
                <CardContent className="py-16 text-center">
                  <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">ยังไม่มีแผนก</p>
                  <p className="text-sm text-gray-500 mt-1">คลิก "เพิ่มแผนก" เพื่อเริ่มต้น</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            departments.map((dept) => {
              const empCount = getEmployeeCount(dept.id)
              return (
                <Card
                  key={dept.id}
                  className="border-2 hover:shadow-lg transition-all bg-white"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{dept.name}</CardTitle>
                          <p className="text-xs text-muted-foreground">
                            สร้างเมื่อ {new Date(dept.created_at).toLocaleDateString('th-TH')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(dept)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(dept.id)}
                          className="h-8 w-8 p-0 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                      <Users className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-900">
                        พนักงาน {empCount} คน
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* Dialog */}
        <Dialog open={showDialog} onOpenChange={(open) => {
          setShowDialog(open)
          if (!open) {
            setDeptName('')
            setEditingDept(null)
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {editingDept ? 'แก้ไขแผนก' : 'เพิ่มแผนกใหม่'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>ชื่อแผนก *</Label>
                <Input
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="เช่น ฝ่ายขาย, ฝ่ายการตลาด"
                  required
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowDialog(false)}>
                  ยกเลิก
                </Button>
                <Button type="submit" className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600">
                  {editingDept ? 'อัปเดต' : 'เพิ่มแผนก'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}
