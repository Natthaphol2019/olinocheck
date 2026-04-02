import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Layout from '@/components/Layout'
import { getPendingLeaveRequests, updateLeaveRequestStatus } from '@/services/leaveService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { Calendar, Check, X, Eye } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'

const LEAVE_TYPES = [
  { value: 'annual', label: 'Annual Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'personal', label: 'Personal Leave' },
  { value: 'maternity', label: 'Maternity Leave' },
  { value: 'paternity', label: 'Paternity Leave' },
  { value: 'bereavement', label: 'Bereavement Leave' },
  { value: 'unpaid', label: 'Unpaid Leave' },
]

export default function LeaveApprovals() {
  const { employee } = useAuth()
  const { toast } = useToast()
  const [leaveRequests, setLeaveRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchLeaveRequests()
  }, [employee?.id, employee?.role])

  const fetchLeaveRequests = async () => {
    setLoading(true)
    try {
      const data = await getPendingLeaveRequests(employee?.department_id, employee?.role)
      setLeaveRequests(data || [])
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

  const handleApprove = async (request) => {
    setProcessing(true)
    try {
      await updateLeaveRequestStatus(request.id, 'approved', employee.id)
      
      toast({
        title: 'Success',
        description: 'Leave request approved successfully',
      })
      
      fetchLeaveRequests()
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a rejection reason',
        variant: 'destructive',
      })
      return
    }

    setProcessing(true)
    try {
      await updateLeaveRequestStatus(
        selectedRequest.id,
        'rejected',
        employee.id,
        rejectionReason
      )
      
      toast({
        title: 'Success',
        description: 'Leave request rejected',
      })
      
      setShowRejectDialog(false)
      setRejectionReason('')
      setSelectedRequest(null)
      fetchLeaveRequests()
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  const getLeaveTypeLabel = (type) => {
    return LEAVE_TYPES.find(t => t.value === type)?.label || type
  }

  const calculateDays = (start, end) => {
    return differenceInDays(new Date(end), new Date(start)) + 1
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Leave Approvals</h1>
          <p className="text-muted-foreground">Review and approve employee leave requests</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : leaveRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No pending leave requests</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">
                          {request.employee?.name}
                        </TableCell>
                        <TableCell>{getLeaveTypeLabel(request.leave_type)}</TableCell>
                        <TableCell>
                          {format(new Date(request.start_date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          {format(new Date(request.end_date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>{calculateDays(request.start_date, request.end_date)}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {request.reason}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request)
                                setShowDetails(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handleApprove(request)}
                              disabled={processing}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => {
                                setSelectedRequest(request)
                                setShowRejectDialog(true)
                              }}
                              disabled={processing}
                            >
                              <X className="h-4 w-4" />
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

        {/* Details Dialog */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Leave Request Details</DialogTitle>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Employee</p>
                  <p className="text-muted-foreground">{selectedRequest.employee?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Leave Type</p>
                  <p className="text-muted-foreground">
                    {getLeaveTypeLabel(selectedRequest.leave_type)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Duration</p>
                  <p className="text-muted-foreground">
                    {format(new Date(selectedRequest.start_date), 'MMMM d, yyyy')} - {format(new Date(selectedRequest.end_date), 'MMMM d, yyyy')}
                    <br />
                    ({calculateDays(selectedRequest.start_date, selectedRequest.end_date)} days)
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Reason</p>
                  <p className="text-muted-foreground">{selectedRequest.reason}</p>
                </div>
                {selectedRequest.file_url && (
                  <div>
                    <p className="text-sm font-medium mb-2">Attachment</p>
                    {selectedRequest.file_url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                      <img
                        src={selectedRequest.file_url}
                        alt="Attachment"
                        className="rounded-lg max-w-full h-auto max-h-64"
                      />
                    ) : (
                      <a
                        href={selectedRequest.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        View Attachment
                      </a>
                    )}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">Submitted</p>
                  <p className="text-muted-foreground">
                    {format(new Date(selectedRequest.created_at), 'MMMM d, yyyy HH:mm')}
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={(open) => {
          setShowRejectDialog(open)
          if (!open) {
            setRejectionReason('')
            setSelectedRequest(null)
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Leave Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Please provide a reason for rejecting this leave request:
              </p>
              <div className="space-y-2">
                <label className="text-sm font-medium">Rejection Reason</label>
                <textarea
                  className="w-full min-h-[100px] p-2 border rounded-md"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this leave request is being rejected..."
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectDialog(false)
                    setRejectionReason('')
                    setSelectedRequest(null)
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={processing || !rejectionReason.trim()}
                  className="flex-1"
                >
                  {processing ? 'Rejecting...' : 'Reject Request'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}
