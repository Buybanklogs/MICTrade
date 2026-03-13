import React, { useEffect, useState } from 'react';
import { Plus, MessageCircle, Clock, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { support } from '../../lib/api';

const Support = () => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', message: '' });
  const [replyMessage, setReplyMessage] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await support.getTickets();
      setTickets(response.data.tickets);
    } catch (error) {
      toast.error('Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    try {
      await support.createTicket(newTicket);
      toast.success('Ticket created successfully');
      setShowNewTicket(false);
      setNewTicket({ subject: '', message: '' });
      fetchTickets();
    } catch (error) {
      toast.error('Failed to create ticket');
    }
  };

  const fetchTicketDetails = async (ticketId) => {
    try {
      const response = await support.getTicketDetails(ticketId);
      setSelectedTicket(response.data);
    } catch (error) {
      toast.error('Failed to fetch ticket details');
    }
  };

  const handleReply = async () => {
    if (!replyMessage.trim()) return;
    try {
      await support.replyToTicket(selectedTicket.ticket.id, { ticket_id: selectedTicket.ticket.id, message: replyMessage });
      toast.success('Reply sent');
      setReplyMessage('');
      fetchTicketDetails(selectedTicket.ticket.id);
    } catch (error) {
      toast.error('Failed to send reply');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Support</h1>
            <p className="text-slate-600">Get help from our support team</p>
          </div>
          <Button onClick={() => setShowNewTicket(true)} className="mt-4 lg:mt-0">
            <Plus className="w-4 h-4 mr-2" />
            New Ticket
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <MessageCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400 mb-4">No support tickets yet</p>
            <Button onClick={() => setShowNewTicket(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Ticket
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition cursor-pointer" onClick={() => fetchTicketDetails(ticket.id)}>
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-bold text-slate-900">{ticket.subject}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    ticket.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {ticket.status === 'open' ? <Clock className="w-3 h-3 inline mr-1" /> : <CheckCircle className="w-3 h-3 inline mr-1" />}
                    {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">{ticket.message}</p>
                <p className="text-xs text-slate-400">
                  {new Date(ticket.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showNewTicket} onOpenChange={setShowNewTicket}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Subject</Label>
              <Input value={newTicket.subject} onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })} placeholder="Brief description of your issue" className="mt-2" />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea value={newTicket.message} onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })} placeholder="Describe your issue in detail" rows={5} className="mt-2" />
            </div>
            <Button onClick={handleCreateTicket} className="w-full">Submit Ticket</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTicket?.ticket.subject}</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-700">{selectedTicket.ticket.message}</p>
                <p className="text-xs text-slate-400 mt-2">
                  {new Date(selectedTicket.ticket.created_at).toLocaleString()}
                </p>
              </div>

              {selectedTicket.replies.map((reply) => (
                <div key={reply.id} className={`rounded-lg p-4 ${reply.is_admin ? 'bg-blue-50 border-l-4 border-blue-600' : 'bg-slate-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-900">{reply.is_admin ? 'Support Team' : 'You'}</span>
                    <span className="text-xs text-slate-400">{new Date(reply.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-slate-700">{reply.message}</p>
                </div>
              ))}

              {selectedTicket.ticket.status === 'open' && (
                <div>
                  <Label>Your Reply</Label>
                  <Textarea value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} placeholder="Type your message..." rows={3} className="mt-2" />
                  <Button onClick={handleReply} className="mt-2 w-full">Send Reply</Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Support;
