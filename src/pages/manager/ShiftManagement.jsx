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
import { Clock, Plus, Edit, Trash2, CheckCircle, X, Palette } from 'lucide-react'
import { cn } from '@/lib/utils'

const SHIFT_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6', '#6366F1']

export default function ShiftManagement() {
  const { employee } = useAuth()
  const { toast } = useToast()
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingShift, setEditingShift] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    start_time: '09:00',
    end_time: '18:00',
    ot_start_time: '',
    ot_end_time: '',
    grace_period_minutes: 0,
    color: '#3B82F6',
    description: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .order('display_order', { ascending: true })
      
      if (error) throw error
      setShifts(data || [])
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

  const resetForm = () => {
    setFormData({
      name: '',
      start_time: '09:00',
      end_time: '18:00',
      ot_start_time: '',
      ot_end_time: '',
      grace_period_minutes: 0,
      color: '#3B82F6',
      description: '',
    })
    setEditingShift(null)
  }

  const handleOpenDialog = (shift = null) => {
    if (shift) {
      setEditingShift(shift)
      setFormData({
        name: shift.name,
        start_time: shift.start_time?.substring(0, 5) || '09:00',
        end_time: shift.end_time?.substring(0, 5) || '18:00',
        ot_start_time: shift.ot_start_time?.substring(0, 5) || '',
        ot_end_time: shift.ot_end_time?.substring(0, 5) || '',
        grace_period_minutes: shift.grace_period_minutes || 0,
        color: shift.color || '#3B82F6',
        description: shift.description || '',
      })
    } else {
      resetForm()
    }
    setShowDialog(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingShift) {
        const { error } = await supabase
          .from('shifts')
          .update(formData)
          .eq('id', editingShift.id)

        if (error) throw error

        toast({ title: 'สำเร็จ', description: 'อัปเดตกะงานเรียบร้อยแล้ว' })
      } else {
        const { error } = await supabase
          .from('shifts')
          .insert({ ...formData, is_active: true })

        if (error) throw error

        toast({ title: 'สำเร็จ', description: 'สร้างกะงานเรียบร้อยแล้ว' })
      }

      setShowDialog(false)
      resetForm()
      fetchData()
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleToggleActive = async (shift) => {
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

  const handleDelete = async (shiftId) => {
    if (!window.confirm('ต้องการลบกะงานนี้หรือไม่?')) return

    try {
      const { error } = await supabase
        .from('shifts')
        .delete()
        .eq('id', shiftId)

      if (error) throw error

      toast({ title: 'สำเร็จ', description: 'ลบกะงานเรียบร้อยแล้ว' })
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
              <p className="text-muted-foreground">สร้าง แก้ไข และจัดการกะงาน</p>
            </div>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:shadow-xl hover:shadow-cyan-500/40 h-12 rounded-xl"
          >
            <Plus className="h-4 w-4 mr-2" />
            สร้างกะงาน
          </Button>
        </div>

        {/* Shifts Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full flex justify-center py-16">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : shifts.length === 0 ? (
            <div className="col-span-full">
              <Card>
                <CardContent className="py-16 text-center">
                  <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">ยังไม่มีกะงาน</p>
                  <p className="text-sm text-gray-500 mt-1">คลิก "สร้างกะงาน" เพื่อเริ่มต้น</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            shifts.map((shift) => (
              <Card
                key={shift.id}
                className={cn(
                  "border-2 hover:shadow-lg transition-all",
                  shift.is_active ? "bg-white" : "bg-gray-50 opacity-60"
                )}
                style={{
                  borderColor: shift.is_active ? (shift.color || '#3B82F6') : '#E5E7EB',
                  borderLeftWidth: shift.is_active ? '4px' : '2px',
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
                        onClick={() => handleOpenDialog(shift)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(shift)}
                        className="h-8 w-8 p-0"
                      >
                        {shift.is_active ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(shift.id)}
                        className="h-8 w-8 p-0 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
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
                    {shift.grace_period_minutes > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">สายหลังจาก:</span>
                        <span className="font-medium text-yellow-600">
                          {(() => {
                            const [h, m] = shift.start_time.split(':')
                            const graceM = parseInt(m) + shift.grace_period_minutes
                            const graceH = parseInt(h) + Math.floor(graceM / 60)
                            const graceMin = graceM % 60
                            return `${String(graceH).padStart(2, '0')}:${String(graceMin).padStart(2, '0')} น.`
                          })()}
                        </span>
                      </div>
                    )}
                  </div>

                  {shift.description && (
                    <p className="text-sm text-muted-foreground pt-2 border-t">{shift.description}</p>
                  )}

                  <div className={cn(
                    "px-3 py-2 rounded-lg text-xs font-medium",
                    shift.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
                  )}>
                    {shift.is_active ? '✓ เปิดใช้งาน' : '✗ ปิดใช้งาน'}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Dialog */}
        <Dialog open={showDialog} onOpenChange={(open) => {
          setShowDialog(open)
          if (!open) resetForm()
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {editingShift ? 'แก้ไขกะงาน' : 'สร้างกะงานใหม่'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>ชื่อกะงาน *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="เช่น กะเช้า, กะบ่าย"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>เวลาเข้างาน *</Label>
                  <Input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>เวลาเลิกงาน *</Label>
                  <Input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>เวลาเริ่ม OT</Label>
                  <Input
                    type="time"
                    value={formData.ot_start_time}
                    onChange={(e) => setFormData({ ...formData, ot_start_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>เวลาสิ้นสุด OT</Label>
                  <Input
                    type="time"
                    value={formData.ot_end_time}
                    onChange={(e) => setFormData({ ...formData, ot_end_time: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>ระยะเวลาสายได้ (นาที)</Label>
                <Input
                  type="number"
                  min="0"
                  max="60"
                  value={formData.grace_period_minutes}
                  onChange={(e) => setFormData({ ...formData, grace_period_minutes: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.grace_period_minutes === 0 ? 'ไม่มีการนับสาย - ต้องเข้าตรงเวลา' : `หลังจากเวลาเข้างานกี่นาทีก่อนจะถือว่าเป็นสาย (ปัจจุบัน: ${formData.grace_period_minutes} นาที)`}
                </p>
              </div>

              <div className="space-y-2">
                <Label>สีแสดงกะงาน</Label>
                <div className="flex gap-2 flex-wrap">
                  {SHIFT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={cn(
                        "w-10 h-10 rounded-full border-2 transition-all",
                        formData.color === color ? "border-gray-900 scale-110" : "border-gray-300"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>รายละเอียด</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="คำอธิบายเพิ่มเติม (ถ้ามี)"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowDialog(false)}>
                  ยกเลิก
                </Button>
                <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600">
                  {editingShift ? 'อัปเดต' : 'สร้างกะงาน'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}
