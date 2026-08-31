import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LeaveRequest, LeaveType, LeaveCategory, LeaveStatus } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  CalendarOff,
  Clock,
  Plus,
  CheckCircle2,
  XCircle,
  Clock3,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  FileText,
  Trash2,
} from 'lucide-react';

export const LeaveManagementView: React.FC = () => {
  const {
    currentUser,
    users,
    leaveRequests,
    createLeaveRequest,
    reviewLeaveByReviewer,
    reviewLeaveByAdmin,
    cancelLeaveRequest,
  } = useAuth();

  const [filterTab, setFilterTab] = useState<'all' | 'my_requests' | 'pending_approval' | 'approved' | 'rejected'>('pending_approval');
  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Form State
  const [requestType, setRequestType] = useState<LeaveType>('leave');
  const [leaveCategory, setLeaveCategory] = useState<LeaveCategory>('casual');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState<string>('14:00');
  const [endTime, setEndTime] = useState<string>('16:00');
  const [permissionHours, setPermissionHours] = useState<number>(2);
  const [reason, setReason] = useState<string>('');

  // Action Dialog State
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [actionRemark, setActionRemark] = useState<string>('');

  if (!currentUser) return null;

  const isAdmin = currentUser.roleTier === 'admin';
  const isReviewer = currentUser.roleTier === 'reviewer';

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleOpenRaiseModal = () => {
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate(new Date().toISOString().slice(0, 10));
    setReason('');
    setIsRaiseModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsProcessing(true);
    try {
      await createLeaveRequest({
        requestType,
        leaveCategory: requestType === 'permission' ? 'short_permission' : leaveCategory,
        startDate,
        endDate: requestType === 'permission' ? startDate : endDate,
        startTime: requestType === 'permission' ? startTime : undefined,
        endTime: requestType === 'permission' ? endTime : undefined,
        permissionHours: requestType === 'permission' ? permissionHours : undefined,
        reason: reason.trim(),
      });
      setIsRaiseModalOpen(false);
    } catch (err) {
      console.error('Error submitting leave request:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteAction = async () => {
    if (!selectedRequest || !actionType) return;

    setIsProcessing(true);
    try {
      if (isReviewer && selectedRequest.status === 'pending_reviewer') {
        await reviewLeaveByReviewer(selectedRequest.id, actionType === 'approve' ? 'approved' : 'rejected', actionRemark);
      } else if (isAdmin && (selectedRequest.status === 'pending_admin' || (isReviewer && selectedRequest.status === 'pending_reviewer'))) {
        await reviewLeaveByAdmin(selectedRequest.id, actionType === 'approve' ? 'approved' : 'rejected', actionRemark);
      }
      setSelectedRequest(null);
      setActionType(null);
      setActionRemark('');
    } catch (err) {
      console.error('Error reviewing request:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter Logic
  const filteredRequests = leaveRequests.filter((req) => {
    if (filterTab === 'my_requests') {
      return req.requesterId === currentUser.id;
    }
    if (filterTab === 'pending_approval') {
      if (isReviewer) {
        return req.status === 'pending_reviewer';
      }
      if (isAdmin) {
        return req.status === 'pending_admin' || req.status === 'pending_reviewer';
      }
      return req.requesterId === currentUser.id && req.status.startsWith('pending');
    }
    if (filterTab === 'approved') return req.status === 'approved';
    if (filterTab === 'rejected') return req.status === 'rejected';
    return true;
  });

  const pendingReviewerCount = leaveRequests.filter((r) => r.status === 'pending_reviewer').length;
  const pendingAdminCount = leaveRequests.filter((r) => r.status === 'pending_admin').length;
  const approvedCount = leaveRequests.filter((r) => r.status === 'approved').length;
  const myRequestsCount = leaveRequests.filter((r) => r.requesterId === currentUser.id).length;

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="p-6 bg-white border border-purple-100 rounded-2xl shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl">
              <CalendarOff className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Leave & Permissions Workflow Hub</h2>
              <p className="text-xs text-slate-500 font-normal pt-0.5">
                Raise full-day leave or short-hours permission requests with multi-stage Reviewer & Founder approval.
              </p>
            </div>
          </div>

          <Button
            onClick={handleOpenRaiseModal}
            className="h-10 px-5 text-xs font-bold gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" /> Raise Leave / Permission
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <Card className="border border-amber-200 bg-linear-to-br from-amber-50/70 to-amber-100/30 rounded-2xl p-4 flex items-center space-x-3.5">
          <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs">
            <Clock3 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase text-amber-700 tracking-wider block">Pending Reviewer</span>
            <h3 className="text-lg font-black text-slate-900">{pendingReviewerCount} Requests</h3>
          </div>
        </Card>

        <Card className="border border-purple-200 bg-linear-to-br from-purple-50/70 to-indigo-100/30 rounded-2xl p-4 flex items-center space-x-3.5">
          <div className="p-2.5 bg-purple-600 text-white rounded-xl shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase text-purple-700 tracking-wider block">Pending Founder Sign-off</span>
            <h3 className="text-lg font-black text-slate-900">{pendingAdminCount} Requests</h3>
          </div>
        </Card>

        <Card className="border border-emerald-200 bg-linear-to-br from-emerald-50/70 to-teal-100/30 rounded-2xl p-4 flex items-center space-x-3.5">
          <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase text-emerald-700 tracking-wider block">Fully Approved</span>
            <h3 className="text-lg font-black text-slate-900">{approvedCount} Requests</h3>
          </div>
        </Card>

        <Card className="border border-slate-200 bg-linear-to-br from-slate-50 to-slate-100/50 rounded-2xl p-4 flex items-center space-x-3.5">
          <div className="p-2.5 bg-slate-700 text-white rounded-xl shadow-xs">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-600 tracking-wider block">My Total Requests</span>
            <h3 className="text-lg font-black text-slate-900">{myRequestsCount} Requests</h3>
          </div>
        </Card>

      </div>

      {/* Filter Tabs & Content */}
      <Card className="border border-purple-100 bg-white shadow-2xs rounded-2xl p-5 space-y-5">
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
          <button
            onClick={() => setFilterTab('pending_approval')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              filterTab === 'pending_approval' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-purple-50'
            }`}
          >
            <Clock3 className="w-3.5 h-3.5" /> Pending Approvals
          </button>

          <button
            onClick={() => setFilterTab('my_requests')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              filterTab === 'my_requests' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-purple-50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> My Requests ({myRequestsCount})
          </button>

          <button
            onClick={() => setFilterTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              filterTab === 'all' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-purple-50'
            }`}
          >
            All Requests ({leaveRequests.length})
          </button>

          <button
            onClick={() => setFilterTab('approved')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              filterTab === 'approved' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-purple-50'
            }`}
          >
            Approved ({approvedCount})
          </button>

          <button
            onClick={() => setFilterTab('rejected')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              filterTab === 'rejected' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-purple-50'
            }`}
          >
            Rejected ({leaveRequests.filter((r) => r.status === 'rejected').length})
          </button>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <CalendarOff className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-xs font-medium">No leave or permission requests found in this view.</p>
            </div>
          ) : (
            filteredRequests.map((req) => {
              const requester = users.find((u) => u.id === req.requesterId);
              const reviewer = users.find((u) => u.id === req.reviewerId);
              const adminUser = users.find((u) => u.id === req.adminId);
              const isMine = req.requesterId === currentUser.id;

              const canReviewerApprove = isReviewer && req.status === 'pending_reviewer';
              const canAdminApprove = isAdmin && (req.status === 'pending_admin' || req.status === 'pending_reviewer');

              return (
                <div
                  key={req.id}
                  className="p-4 bg-slate-50/70 hover:bg-purple-50/20 border border-slate-200/80 rounded-2xl transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    
                    {/* Requester Profile & Type */}
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-9 w-9 border border-purple-200">
                        {requester?.avatarUrl ? <AvatarImage src={requester.avatarUrl} alt={requester.fullName} /> : null}
                        <AvatarFallback className="bg-purple-600 text-white font-bold text-xs">
                          {getInitials(requester?.fullName || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-sm text-slate-900">{requester?.fullName}</span>
                          <Badge
                            variant={requester?.roleTier === 'admin' ? 'default' : requester?.roleTier === 'reviewer' ? 'purple' : 'info'}
                            className="text-[9px] font-bold uppercase"
                          >
                            {requester?.roleTier}
                          </Badge>
                        </div>
                        <span className="text-xs text-slate-500 font-normal">{requester?.title}</span>
                      </div>
                    </div>

                    {/* Status Badge & Workflow Indicators */}
                    <div className="flex items-center space-x-2">
                      {req.status === 'pending_reviewer' && (
                        <Badge variant="warning" className="text-xs font-bold gap-1 px-3 py-1 bg-amber-100 text-amber-900 border-amber-300">
                          <Clock className="w-3 h-3 text-amber-600" /> Pending Reviewer Sign-off
                        </Badge>
                      )}

                      {req.status === 'pending_admin' && (
                        <Badge variant="purple" className="text-xs font-bold gap-1 px-3 py-1 bg-purple-100 text-purple-900 border-purple-300">
                          <ShieldCheck className="w-3 h-3 text-purple-600" /> Pending Founder Approval
                        </Badge>
                      )}

                      {req.status === 'approved' && (
                        <Badge variant="success" className="text-xs font-bold gap-1 px-3 py-1 bg-emerald-100 text-emerald-900 border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Fully Approved
                        </Badge>
                      )}

                      {req.status === 'rejected' && (
                        <Badge variant="destructive" className="text-xs font-bold gap-1 px-3 py-1 bg-rose-100 text-rose-900 border-rose-300">
                          <XCircle className="w-3 h-3 text-rose-600" /> Request Rejected
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Request Detail Content */}
                  <div className="p-3 bg-white border border-slate-100 rounded-xl space-y-2">
                    <div className="flex flex-wrap items-center justify-between text-xs font-bold text-slate-800 gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-mono text-[11px]">
                          {req.requestType === 'permission' ? '⏱️ SHORT PERMISSION' : '📅 FULL LEAVE'}
                        </span>
                        <span className="text-slate-600 uppercase tracking-wide text-[10px]">
                          {req.leaveCategory.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="text-slate-600 font-mono">
                        {req.requestType === 'permission' ? (
                          <span>
                            Date: <strong>{req.startDate}</strong> ({req.startTime} - {req.endTime}) [{req.permissionHours || 2} hrs]
                          </span>
                        ) : (
                          <span>
                            Dates: <strong>{req.startDate}</strong> to <strong>{req.endDate}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 italic font-normal">
                      "{req.reason}"
                    </p>

                    {/* Reviewer / Admin Audit Remarks History */}
                    {(req.reviewerRemark || req.adminRemark) && (
                      <div className="pt-2 border-t border-slate-100 text-[11px] space-y-1">
                        {req.reviewerRemark && (
                          <div className="text-blue-900">
                            <strong>Reviewer ({reviewer?.fullName || 'Reviewer'}):</strong> "{req.reviewerRemark}"
                          </div>
                        )}
                        {req.adminRemark && (
                          <div className="text-purple-900">
                            <strong>Founder/Admin ({adminUser?.fullName || 'Admin'}):</strong> "{req.adminRemark}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400 font-normal">
                      Submitted on {new Date(req.createdAt).toLocaleString()}
                    </span>

                    <div className="flex items-center space-x-2">
                      {isMine && req.status.startsWith('pending') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelLeaveRequest(req.id)}
                          className="h-8 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Withdraw Request
                        </Button>
                      )}

                      {canReviewerApprove && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(req);
                              setActionType('approve');
                              setActionRemark('');
                            }}
                            className="h-8 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Forward to Admin
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRequest(req);
                              setActionType('reject');
                              setActionRemark('');
                            }}
                            className="h-8 text-xs font-bold border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </Button>
                        </>
                      )}

                      {canAdminApprove && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(req);
                              setActionType('approve');
                              setActionRemark('');
                            }}
                            className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg gap-1 shadow-2xs"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" /> Grant Final Sign-Off
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRequest(req);
                              setActionType('reject');
                              setActionRemark('');
                            }}
                            className="h-8 text-xs font-bold border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </Card>

      {/* Raise Request Dialog Modal */}
      <Dialog open={isRaiseModalOpen} onOpenChange={setIsRaiseModalOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <CalendarOff className="w-5 h-5 text-purple-600" /> Raise Leave or Permission Request
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Submit your leave or short-hours request for reviewer & founder sign-off.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
            
            {/* Request Type Toggle */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Request Category Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRequestType('leave')}
                  className={`p-2.5 rounded-xl text-xs font-bold border text-center transition-all ${
                    requestType === 'leave'
                      ? 'bg-purple-50 border-purple-300 text-purple-900 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  📅 Full-Day Leave
                </button>

                <button
                  type="button"
                  onClick={() => setRequestType('permission')}
                  className={`p-2.5 rounded-xl text-xs font-bold border text-center transition-all ${
                    requestType === 'permission'
                      ? 'bg-purple-50 border-purple-300 text-purple-900 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  ⏱️ Short Permission (Hours)
                </button>
              </div>
            </div>

            {/* Leave Category Selection */}
            {requestType === 'leave' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Leave Reason Category</Label>
                <select
                  value={leaveCategory}
                  onChange={(e) => setLeaveCategory(e.target.value as LeaveCategory)}
                  className="w-full h-10 px-3 text-xs font-medium border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="casual">Casual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="academic">Academic / Exam Leave</option>
                  <option value="emergency">Personal Emergency</option>
                </select>
              </div>
            )}

            {/* Dates / Times Fields */}
            {requestType === 'leave' ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Permission Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Start Time</Label>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="h-10 text-xs rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">End Time</Label>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="h-10 text-xs rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Hours</Label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="8"
                      value={permissionHours}
                      onChange={(e) => setPermissionHours(parseFloat(e.target.value) || 1)}
                      className="h-10 text-xs rounded-xl"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Reason Textarea */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Detailed Reason</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain the reason for leave/permission request..."
                className="h-20 text-xs rounded-xl resize-none"
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRaiseModalOpen(false)}
                className="h-9 text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isProcessing || !reason.trim()}
                className="h-9 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs"
              >
                Submit Request
              </Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>

      {/* Action Approval / Rejection Remarks Modal */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              {actionType === 'approve' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-600" />
              )}
              {actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Provide optional remarks for this leave request decision.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
              <span className="font-bold text-slate-900 block">
                {selectedRequest?.requestType === 'permission' ? 'Short Hours Permission' : 'Full Leave Request'}
              </span>
              <p className="text-slate-600 italic">"{selectedRequest?.reason}"</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Remarks / Feedback (Optional)</Label>
              <Textarea
                value={actionRemark}
                onChange={(e) => setActionRemark(e.target.value)}
                placeholder={actionType === 'approve' ? 'Looks good, approved.' : 'State reason for rejection...'}
                className="h-20 text-xs rounded-xl resize-none"
              />
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedRequest(null)}
                className="h-9 text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleExecuteAction}
                disabled={isProcessing}
                className={`h-9 text-xs font-bold text-white rounded-xl shadow-xs ${
                  actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Confirm {actionType === 'approve' ? 'Approval' : 'Rejection'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};
