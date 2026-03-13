import React, { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, CheckCircle, Clock, MessageCircle, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { toast } from 'sonner';
import { admin, auth } from '../../lib/api';

const AdminSupport = ({ currentUser }) => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [user, setUser] = useState(currentUser || null);

  const fetchUser = useCallback(async () => {
    try {
      const response = await auth.getMe();
      setUser(response.data);
    } catch (error) {
      navigate('/signin');
    }
  }, [navigate]);

  const fetchTickets = useCallback(async () => {
    try {
      const response = await admin.getTickets();
      setTickets(response.data.tickets || []);
    } catch (error) {
      toast.error('Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) {
      fetchUser();
    } else {
      setUser(currentUser);
    }
    fetchTickets();
  }, [currentUser, fetchUser, fetchTickets]);

  const fetchTicketDetails = async (ticketId) => {
    try {
      const response = await admin.getTicketDetails(ticketId);
      setSelectedTicket(response.data);
    } catch (error) {
      toast.error('Failed to fetch ticket details');
    }
  };

  const handleReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    try {
      await admin.replyToTicket(selectedTicket.ticket.id, {
        ticket_id: selectedTicket.ticket.id,
        message: replyMessage,
      });
      toast.success('Reply sent');
      setReplyMessage('');
      await fetchTicketDetails(selectedTicket.ticket.id);
      await fetchTickets();
    } catch (error) {
      toast.error('Failed to send reply');
    }
  };

  const handleClose = async () => {
    if (!selectedTicket) return;

    try {
      await admin.closeTicket(selectedTicket.ticket.id);
      toast.success('Ticket closed');
      setSelectedTicket(null);
      await fetchTickets();
    } catch (error) {
      toast.error('Failed to close ticket');
    }
  };

  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <Link
          to="/admin"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
                Support Operations
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">
                Support Tickets
              </h1>
              <p className="mt-2 text-sm text-slate-500 sm:text-base">
                Manage user conversations, respond to issues, and close resolved tickets.
              </p>
            </div>

            {isStaff && (
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
                <Shield className="h-4 w-4" />
                Staff View
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="py-16 text-center">
              <MessageCircle className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-4 text-base font-semibold text-slate-600">No support tickets</p>
              <p className="mt-1 text-sm text-slate-500">
                New tickets will appear here when users contact support.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-4">
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => fetchTicketDetails(ticket.id)}
                  data-testid={`ticket-${ticket.id}`}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-blue-200 hover:bg-white hover:shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900">{ticket.subject}</h3>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            ticket.status === 'open'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {ticket.status === 'open' ? (
                            <Clock className="h-3.5 w-3.5" />
                          ) : (
                            <CheckCircle className="h-3.5 w-3.5" />
                          )}
                          {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                        </span>
                      </div>

                      <p className="mt-2 text-sm font-medium text-slate-700">
                        {ticket.user_name}
                        {isAdmin && ticket.user_email ? ` (${ticket.user_email})` : ''}
                      </p>

                      <p className="mt-2 line-clamp-2 text-sm text-slate-500">{ticket.message}</p>
                    </div>

                    <p className="shrink-0 text-xs font-medium text-slate-400">
                      {ticket.created_at
                        ? new Date(ticket.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl font-bold text-slate-900">
                {selectedTicket?.ticket?.subject}
                {isStaff && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                    <Shield className="h-3.5 w-3.5" />
                    Staff View
                  </span>
                )}
              </DialogTitle>
            </DialogHeader>

            {selectedTicket && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-900">
                    {selectedTicket.ticket.user_name}
                    {isAdmin && selectedTicket.ticket.user_email
                      ? ` (${selectedTicket.ticket.user_email})`
                      : ''}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {selectedTicket.ticket.created_at
                      ? new Date(selectedTicket.ticket.created_at).toLocaleString()
                      : ''}
                  </p>
                  <p className="mt-4 whitespace-pre-wrap text-sm text-slate-600">
                    {selectedTicket.ticket.message}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                    Conversation
                  </h3>
                  <div className="mt-3 space-y-3">
                    {(selectedTicket.replies || []).map((reply) => (
                      <div
                        key={reply.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-800">
                          <span>{reply.author_name}</span>
                          {reply.is_admin && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                              Staff
                            </span>
                          )}
                          <span className="text-xs font-medium text-slate-400">
                            {reply.created_at ? new Date(reply.created_at).toLocaleString() : ''}
                          </span>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                          {reply.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedTicket.ticket.status === 'open' && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <Label className="text-sm font-semibold text-slate-800">
                      {isStaff ? 'Staff Reply' : 'Admin Reply'}
                    </Label>
                    <Textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type your response..."
                      rows={4}
                      className="mt-3"
                      data-testid="reply-textarea"
                    />
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <Button
                        onClick={handleReply}
                        className="flex-1"
                        data-testid="send-reply-btn"
                      >
                        Send Reply
                      </Button>
                      <Button
                        onClick={handleClose}
                        variant="outline"
                        className="flex-1"
                        data-testid="close-ticket-btn"
                      >
                        Close Ticket
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminSupport;
