import React, { useEffect, useState } from 'react';
import { MessageCircle, Clock, CheckCircle, ChevronLeft, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { admin, auth } from '../../lib/api';

const AdminSupport = ({ currentUser }) => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [user, setUser] = useState(currentUser || null);

  useEffect(() => {
    if (!currentUser) {
      fetchUser();
    }
    fetchTickets();
  }, [currentUser]);

  const fetchUser = async () => {
    try {
      const response = await auth.getMe();
      setUser(response.data);
    } catch (error) {
      navigate('/signin');
    }
  };

  const fetchTickets = async () => {
    try {
      const response = await admin.getTickets();
      setTickets(response.data.tickets);
    } catch (error) {
      toast.error('Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetails = async (ticketId) => {
    try {
      const response = await admin.getTicketDetails(ticketId);
      setSelectedTicket(response.data);
    } catch (error) {
      toast.error('Failed to fetch ticket details');
    }
  };

  const handleReply = async () => {
    if (!replyMessage.trim()) return;
    try {
      await admin.replyToTicket(selectedTicket.ticket.id, { ticket_id: selectedTicket.ticket.id, message: replyMessage });
      toast.success('Reply sent');
      setReplyMessage('');
      fetchTicketDetails(selectedTicket.ticket.id);
      fetchTickets();
    } catch (error) {
      toast.error('Failed to send reply');
    }
  };

  const handleClose = async () => {
    try {
      await admin.closeTicket(selectedTicket.ticket.id);
      toast.success('Ticket closed');
      setSelectedTicket(null);
      fetchTickets();
    } catch (error) {
      toast.error('Failed to close ticket');
    }
  };

  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link to="/admin" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 font-medium">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-slate-900">Support Tickets</h1>
            {isStaff && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded">
                <Shield className="w-3 h-3 mr-1" />
                Staff View
              </span>
            )}
          </div>
          <p className="text-slate-600">Manage user support requests</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <MessageCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400">No support tickets</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div 
                key={ticket.id} 
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition cursor-pointer" 
                onClick={() => fetchTicketDetails(ticket.id)}
                data-testid={`ticket-${ticket.id}`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-bold text-slate-900">{ticket.subject}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        ticket.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {ticket.status === 'open' ? <Clock className="w-3 h-3 inline mr-1" /> : <CheckCircle className="w-3 h-3 inline mr-1" />}
                        {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">
                      {ticket.user_name}
                      {/* Only admin sees email */}
                      {isAdmin && ticket.user_email && (
                        <span className="text-slate-500"> ({ticket.user_email})</span>
                      )}
                    </p>
                    <p className="text-sm text-slate-500 line-clamp-1">{ticket.message}</p>
                  </div>
                  <div className="mt-4 lg:mt-0 text-sm text-slate-400">
                    {new Date(ticket.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span>{selectedTicket?.ticket.subject}</span>
              {isStaff && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                  Staff View
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm font-medium text-slate-900">{selectedTicket.ticket.user_name}</span>
                    {/* Only admin sees email in details */}
                    {isAdmin && selectedTicket.ticket.user_email && (
                      <span className="text-sm text-slate-500 ml-2">({selectedTicket.ticket.user_email})</span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">{new Date(selectedTicket.ticket.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm text-slate-700">{selectedTicket.ticket.message}</p>
              </div>

              {selectedTicket.replies.map((reply) => (
                <div key={reply.id} className={`rounded-lg p-4 ${reply.is_admin ? 'bg-blue-50 border-l-4 border-blue-600' : 'bg-slate-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-900">
                      {reply.author_name} {reply.is_admin && '(Staff)'}
                    </span>
                    <span className="text-xs text-slate-400">{new Date(reply.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-slate-700">{reply.message}</p>
                </div>
              ))}

              {selectedTicket.ticket.status === 'open' && (
                <div>
                  <Label>{isStaff ? 'Staff Reply' : 'Admin Reply'}</Label>
                  <Textarea 
                    value={replyMessage} 
                    onChange={(e) => setReplyMessage(e.target.value)} 
                    placeholder="Type your response..." 
                    rows={3} 
                    className="mt-2"
                    data-testid="reply-textarea"
                  />
                  <div className="flex space-x-2 mt-2">
                    <Button onClick={handleReply} className="flex-1" data-testid="send-reply-btn">
                      Send Reply
                    </Button>
                    <Button onClick={handleClose} variant="outline" data-testid="close-ticket-btn">
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
  );
};

export default AdminSupport;
