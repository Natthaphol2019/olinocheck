import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Layout from '@/components/Layout'
import { supabase } from '@/services/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { User, Key, Shield, CheckCircle, Save } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Profile() {
  const { employee, loading } = useAuth()
  const { toast } = useToast()
  const [showPinDialog, setShowPinDialog] = useState(false)
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [updating, setUpdating] = useState(false)

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  if (!employee) {
    return (
      <Layout>
        <div className="text-center py-16">
          <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">กรุณาเข้าสู่ระบบ</p>
        </div>
      </Layout>
    )
  }

  const handleChangePin = async (e) => {
    e.preventDefault()
    
    if (newPin.length < 4 || newPin.length > 6) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'PIN ต้องมีความยาว 4-6 หลัก',
        variant: 'destructive',
      })
      return
    }

    if (newPin !== confirmPin) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'PIN ไม่ตรงกัน',
        variant: 'destructive',
      })
      return
    }

    setUpdating(true)
    try {
      // Hash PIN using bcrypt
      const { default: bcrypt } = await import('bcryptjs')
      const pinHash = await bcrypt.hash(newPin, 10)

      const { error } = await supabase
        .from('employees')
        .update({ pin_hash: pinHash })
        .eq('id', employee.id)

      if (error) throw error

      toast({
        title: 'สำเร็จ',
        description: 'เปลี่ยน PIN เรียบร้อยแล้ว',
      })

      setShowPinDialog(false)
      setNewPin('')
      setConfirmPin('')
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setUpdating(false)
    }
  }

  const getRoleLabel = (role) => {
    const labels = {
      employee: 'พนักงาน',
      supervisor: 'หัวหน้างาน',
      hr: 'ฝ่ายบุคคล',
      admin: 'ผู้ดูแลระบบ',
    }
    return labels[role] || role
  }

  const getRoleColor = (role) => {
    const colors = {
      employee: 'bg-blue-100 text-blue-700',
      supervisor: 'bg-green-100 text-green-700',
      hr: 'bg-purple-100 text-purple-700',
      admin: 'bg-red-100 text-red-700',
    }
    return colors[role] || 'bg-gray-100 text-gray-700'
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              ข้อมูลส่วนตัว
            </h1>
            <p className="text-muted-foreground">ดูและแก้ไขข้อมูลส่วนตัวของคุณ</p>
          </div>
        </div>

        {/* Profile Card */}
        <Card className="bg-white border-2 border-blue-200 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              ข้อมูลส่วนตัว
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center text-white text-3xl font-bold">
                {employee.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{employee.name}</h3>
                <span className={cn("px-3 py-1 rounded-full text-sm font-medium inline-block mt-1", getRoleColor(employee.role))}>
                  {getRoleLabel(employee.role)}
                </span>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">ตำแหน่ง</p>
                    <p className="font-medium capitalize">{getRoleLabel(employee.role)}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-500">สถานะ</p>
                    <p className="font-medium text-green-600">
                      {employee.is_active ? 'ใช้งานอยู่' : 'ไม่ใช้งาน'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Key className="h-5 w-5 text-gray-500" />
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">PIN</p>
                      <p className="font-medium">••••••</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPinDialog(true)}
                      className="gap-2"
                    >
                      <Key className="h-3 w-3" />
                      เปลี่ยน PIN
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change PIN Dialog */}
        <Dialog open={showPinDialog} onOpenChange={(open) => {
          setShowPinDialog(open)
          if (!open) {
            setNewPin('')
            setConfirmPin('')
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                เปลี่ยน PIN
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleChangePin} className="space-y-4">
              <div className="space-y-2">
                <Label>PIN ใหม่ (4-6 หลัก)</Label>
                <Input
                  type="password"
                  inputMode="numeric"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="กรอก PIN ใหม่"
                  maxLength={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>ยืนยัน PIN ใหม่</Label>
                <Input
                  type="password"
                  inputMode="numeric"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="กรอก PIN ใหม่ซ้ำ"
                  maxLength={6}
                  required
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowPinDialog(false)}>
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={updating || newPin.length < 4} className="flex-1 gap-2">
                  <Save className="h-4 w-4" />
                  {updating ? 'กำลังบันทึก...' : 'บันทึก'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}
