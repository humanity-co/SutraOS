import { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  total_copies: number;
  available_copies: number;
}

interface Checkout {
  id: string;
  book_id: string;
  checkout_date: string;
  due_date: string;
  returned_at?: string;
  status: string;
  book?: Book;
}

interface BusRoute {
  id: string;
  route_name: string;
  bus_number: string;
  driver_name: string;
  capacity: number;
  reserved_seats: number;
}

interface TransportReservation {
  id: string;
  route_id: string;
  seat_number: number;
  reserved_at: string;
  route?: BusRoute;
}

interface HostelAdmission {
  id: string;
  room_number: string;
  block_name: string;
  parent_consent_approved: boolean;
}

interface Gatepass {
  id: string;
  reason: string;
  out_date: string;
  in_date: string;
  status: string;
  signature_verified: boolean;
}

export default function Facilities({ setAuthToken }: { setAuthToken: (t: string | null) => void }) {
  const [activeTab, setActiveTab] = useState<'hostel' | 'library' | 'transport'>('hostel');
  const [role, setRole] = useState<string>('STUDENT');
  const [user, setUser] = useState<any>(null);

  // Hostel States
  const [hostelAdmission, setHostelAdmission] = useState<HostelAdmission | null>(null);
  const [gatepasses, setGatepasses] = useState<Gatepass[]>([]);
  const [wardenGatepasses, setWardenGatepasses] = useState<any[]>([]);
  const [loadingHostel, setLoadingHostel] = useState(false);

  // Hostel Form State (Matching Juno Screenshot fields)
  const [hostelForm, setHostelForm] = useState({
    courseYear: 'VI',
    gender: 'Male',
    policyName: 'MIT Aurangabad Hostel Policy',
    planName: 'Hostel Plan 2025-2026',
    fatherName: '',
    fatherContact: '',
    fatherAddress: '',
    motherName: '',
    motherContact: '',
    motherAddress: '',
    buildingName: 'Aryabhata Block A',
    floorName: 'Floor 1',
    roomName: 'Room 101',
    acceptRules: false,
  });

  // Outing Form State
  const [outingForm, setOutingForm] = useState({
    reason: '',
    outDate: '',
    inDate: '',
  });

  // Library States
  const [books, setBooks] = useState<Book[]>([]);
  const [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);

  // Transport States
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [reservations, setReservations] = useState<TransportReservation[]>([]);
  const [loadingTransport, setLoadingTransport] = useState(false);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await api.get('/users/me');
        setRole(res.data.system_role);
        setUser(res.data);
      } catch (err) {
        // Auth failed
      }
    };
    fetchUserData();
  }, []);

  // Fetch Hostel details
  const fetchHostelData = async () => {
    setLoadingHostel(true);
    try {
      if (role === 'STUDENT') {
        try {
          const res = await api.get('/hostel/admissions/me');
          setHostelAdmission(res.data);
        } catch (err) {
          setHostelAdmission(null);
        }
        const resGp = await api.get('/campus/gatepass');
        setGatepasses(resGp.data);
      } else {
        // Admin/Warden details
        const resGps = await api.get('/campus/gatepass');
        setWardenGatepasses(resGps.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHostel(false);
    }
  };

  // Fetch Library details
  const fetchLibraryData = async () => {
    setLoadingLibrary(true);
    try {
      const resB = await api.get('/library/books');
      setBooks(resB.data);
      if (role === 'STUDENT') {
        const resC = await api.get('/library/checkouts/me');
        setCheckouts(resC.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLibrary(false);
    }
  };

  // Fetch Transport details
  const fetchTransportData = async () => {
    setLoadingTransport(true);
    try {
      const resR = await api.get('/transport/routes');
      setRoutes(resR.data);
      if (role === 'STUDENT') {
        const resRes = await api.get('/transport/reservations/me');
        setReservations(resRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTransport(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'hostel') fetchHostelData();
    if (activeTab === 'library') fetchLibraryData();
    if (activeTab === 'transport') fetchTransportData();
  }, [activeTab, role]);

  // Handle Hostel Registration Submit
  const handleHostelRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostelForm.acceptRules) {
      showNotification('error', 'Please accept the hostel rules & regulations');
      return;
    }
    if (!user) return;

    try {
      await api.post('/hostel/admissions', {
        student_id: user.id,
        room_number: hostelForm.roomName,
        block_name: hostelForm.buildingName,
        parent_consent_approved: true, // Auto true for self enrollment demo
      });
      showNotification('success', 'Hostel Registered Successfully! A Fee Invoice of ₹50,000 has been generated in your account.');
      fetchHostelData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Hostel Registration Failed');
    }
  };

  // Request Night Out Gatepass
  const handleRequestOuting = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/campus/gatepass', {
        reason: outingForm.reason,
        out_date: outingForm.outDate,
        in_date: outingForm.inDate,
      });
      showNotification('success', 'Gatepass Request Submitted successfully!');
      setOutingForm({ reason: '', outDate: '', inDate: '' });
      fetchHostelData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Gatepass Request Failed');
    }
  };

  // Approve Gatepass (Warden/Admin)
  const handleApproveGatepass = async (id: string) => {
    try {
      await api.put(`/campus/gatepass/${id}/approve?status=APPROVED`);
      showNotification('success', 'Gatepass Request APPROVED!');
      fetchHostelData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Action failed');
    }
  };

  // Checkout Book (Student)
  const handleCheckoutBook = async (bookId: string) => {
    try {
      await api.post('/library/checkout', { book_id: bookId });
      showNotification('success', 'Book Issued Successfully! Remember to return it within 14 days.');
      fetchLibraryData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Checkout Failed');
    }
  };

  // Return Book (Admin/Librarian)
  const handleReturnBook = async (checkoutId: string) => {
    try {
      await api.post(`/library/checkout/${checkoutId}/return`);
      showNotification('success', 'Book Returned successfully!');
      fetchLibraryData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Return Failed');
    }
  };

  // Reserve Transport Bus Seat
  const handleReserveTransport = async (routeId: string) => {
    try {
      await api.post('/transport/reserve', { route_id: routeId });
      showNotification('success', 'Bus Seat Reserved! A Fee Invoice of ₹12,000 has been generated in your Finance dashboard.');
      fetchTransportData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Reservation Failed');
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      {/* Dynamic Toast System */}
      {notification && (
        <div className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg border transition-all duration-300 animate-slide-in ${
          notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className={`w-2 h-2 rounded-full ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <p className="text-sm font-semibold">{notification.message}</p>
        </div>
      )}

      {/* Facilities Page Header */}
      <div className="flex flex-col gap-2 mb-8">
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Facilities Management</h2>
        <p className="text-slate-500 font-medium">Configure hostel rooms, check out library catalogs, and book campus transport services.</p>
      </div>

      {/* Tabs Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Navigation Sidebar */}
        <div className="lg:w-64 flex flex-row lg:flex-col gap-2 bg-white p-3 rounded-2xl border border-slate-200/60 shadow-sm self-start w-full overflow-x-auto whitespace-nowrap">
          <button
            onClick={() => setActiveTab('hostel')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all w-full text-left ${
              activeTab === 'hostel' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            🏢 Hostel Registration & Leaves
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all w-full text-left ${
              activeTab === 'library' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            📚 Library Circulation
          </button>
          <button
            onClick={() => setActiveTab('transport')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all w-full text-left ${
              activeTab === 'transport' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            🚌 Transport Requisition
          </button>
        </div>

        {/* Right Active Content Panel */}
        <div className="flex-1 bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm min-h-[500px]">

          {/* TAB 1: HOSTEL */}
          {activeTab === 'hostel' && (
            <div className="space-y-8">
              
              {role === 'STUDENT' ? (
                <>
                  {!hostelAdmission ? (
                    // HOSTEL REGISTRATION FORM (Matching Juno UI Structure)
                    <form onSubmit={handleHostelRegister} className="space-y-6">
                      <div className="border-b border-slate-100 pb-4">
                        <h3 className="text-xl font-bold text-slate-800">Facilities » Hostel » Hostel Registration</h3>
                      </div>

                      {/* Course / Gender Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Course Year *</label>
                          <select
                            value={hostelForm.courseYear}
                            onChange={(e) => setHostelForm({...hostelForm, courseYear: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-medium"
                          >
                            <option>IV</option>
                            <option>V</option>
                            <option>VI</option>
                            <option>VII</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Gender *</label>
                          <select
                            value={hostelForm.gender}
                            onChange={(e) => setHostelForm({...hostelForm, gender: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-medium"
                          >
                            <option>Male</option>
                            <option>Female</option>
                          </select>
                        </div>
                      </div>

                      {/* Policy / Plan Details */}
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150 space-y-4">
                        <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Hostel Policy Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Policy Name :</label>
                            <select
                              value={hostelForm.policyName}
                              onChange={(e) => setHostelForm({...hostelForm, policyName: e.target.value})}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none font-medium"
                            >
                              <option>MIT Aurangabad Hostel Policy</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Plan Name :</label>
                            <select
                              value={hostelForm.planName}
                              onChange={(e) => setHostelForm({...hostelForm, planName: e.target.value})}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none font-medium"
                            >
                              <option>Hostel Plan 2025-2026</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Parent/Guardian Details (Juno Screenshot inputs) */}
                      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                          <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Parent / Guardian Details</h4>
                        </div>
                        <div className="p-4 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">Father's Name *</label>
                              <input
                                type="text"
                                required
                                placeholder="Anil Dagadu Patil"
                                value={hostelForm.fatherName}
                                onChange={(e) => setHostelForm({...hostelForm, fatherName: e.target.value})}
                                className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none font-medium"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">Mother's Name *</label>
                              <input
                                type="text"
                                required
                                placeholder="Vaishali"
                                value={hostelForm.motherName}
                                onChange={(e) => setHostelForm({...hostelForm, motherName: e.target.value})}
                                className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none font-medium"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">Guardian's Name</label>
                              <input
                                type="text"
                                placeholder="Optional"
                                className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none font-medium"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">Father's Contact *</label>
                              <input
                                type="text"
                                required
                                placeholder="9850140507"
                                value={hostelForm.fatherContact}
                                onChange={(e) => setHostelForm({...hostelForm, fatherContact: e.target.value})}
                                className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none font-medium"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">Father's Address *</label>
                              <input
                                type="text"
                                required
                                placeholder="Aurangabad"
                                value={hostelForm.fatherAddress}
                                onChange={(e) => setHostelForm({...hostelForm, fatherAddress: e.target.value})}
                                className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none font-medium"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Room/Building Preferences */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Building Name *</label>
                          <input
                            type="text"
                            required
                            value={hostelForm.buildingName}
                            onChange={(e) => setHostelForm({...hostelForm, buildingName: e.target.value})}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Floor Name *</label>
                          <input
                            type="text"
                            required
                            value={hostelForm.floorName}
                            onChange={(e) => setHostelForm({...hostelForm, floorName: e.target.value})}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Room Name *</label>
                          <input
                            type="text"
                            required
                            value={hostelForm.roomName}
                            onChange={(e) => setHostelForm({...hostelForm, roomName: e.target.value})}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium"
                          />
                        </div>
                      </div>

                      {/* Acceptance Checkbox */}
                      <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-250">
                        <input
                          type="checkbox"
                          id="accept"
                          checked={hostelForm.acceptRules}
                          onChange={(e) => setHostelForm({...hostelForm, acceptRules: e.target.checked})}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded border-slate-300"
                        />
                        <label htmlFor="accept" className="text-sm font-semibold text-slate-600 cursor-pointer">
                          I hereby accept all the rules and regulations.
                        </label>
                      </div>

                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md shadow-blue-200"
                      >
                        Register Hostel & Issue Invoice
                      </button>
                    </form>
                  ) : (
                    // SHOW ACTIVE HOSTEL DETAILS
                    <div className="space-y-6">
                      <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-bold text-blue-800">Hostel Allocation Active</h4>
                          <p className="text-sm text-blue-600 font-medium">Room {hostelAdmission.room_number} — {hostelAdmission.block_name}</p>
                        </div>
                        <div className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-extrabold uppercase">
                          Resident
                        </div>
                      </div>

                      {/* Gatepass Form */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        
                        {/* Outing Form */}
                        <form onSubmit={handleRequestOuting} className="space-y-4 border border-slate-200/80 p-5 rounded-2xl shadow-sm">
                          <h4 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2">Request Leave/Night Out Gatepass</h4>
                          
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Outing Reason / Destination *</label>
                            <input
                              type="text"
                              required
                              placeholder="Visiting family home in Aurangabad"
                              value={outingForm.reason}
                              onChange={(e) => setOutingForm({...outingForm, reason: e.target.value})}
                              className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">Out Date & Time *</label>
                              <input
                                type="datetime-local"
                                required
                                value={outingForm.outDate}
                                onChange={(e) => setOutingForm({...outingForm, outDate: e.target.value})}
                                className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">Expected In Date *</label>
                              <input
                                type="datetime-local"
                                required
                                value={outingForm.inDate}
                                onChange={(e) => setOutingForm({...outingForm, inDate: e.target.value})}
                                className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium"
                              />
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md"
                          >
                            Submit Gatepass Request
                          </button>
                        </form>

                        {/* Student Outing Request History */}
                        <div className="space-y-4">
                          <h4 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2">Outing Status History</h4>
                          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                            {gatepasses.length === 0 ? (
                              <p className="text-sm font-medium text-slate-400">No outing requests filed yet.</p>
                            ) : (
                              gatepasses.map((gp) => (
                                <div key={gp.id} className="border border-slate-200/70 p-4 rounded-xl flex items-center justify-between">
                                  <div>
                                    <h5 className="text-sm font-bold text-slate-700">{gp.reason}</h5>
                                    <p className="text-xs font-medium text-slate-400">Out: {gp.out_date} | In: {gp.in_date}</p>
                                  </div>
                                  <div className={`px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase ${
                                    gp.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                    gp.status === 'REJECTED_PARENT_CONSENT' || gp.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                    'bg-amber-50 text-amber-600 border border-amber-100'
                                  }`}>
                                    {gp.status}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  )}
                </>
              ) : (
                // WARDEN OR ADMIN PANEL: VIEW ALL PENDING REQUESTS
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">Warden Outing Requests Approval Desk</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase">Student Name</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase">Reason</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase">Timings</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase">Parent Status</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase">Warden Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {wardenGatepasses.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-sm font-semibold text-slate-400">No requests pending warden review.</td>
                          </tr>
                        ) : (
                          wardenGatepasses.map((gp) => (
                            <tr key={gp.id} className="hover:bg-slate-50/50">
                              <td className="p-4 text-sm font-bold text-slate-700">{gp.student_id}</td>
                              <td className="p-4 text-sm font-medium text-slate-600">{gp.reason}</td>
                              <td className="p-4 text-xs font-medium text-slate-400">Out: {gp.out_date}<br/>In: {gp.in_date}</td>
                              <td className="p-4 text-sm font-bold">
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${gp.status === 'REJECTED_PARENT_CONSENT' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                  {gp.status === 'REJECTED_PARENT_CONSENT' ? 'DENIED' : 'APPROVED'}
                                </span>
                              </td>
                              <td className="p-4 text-sm">
                                {gp.status === 'PENDING' ? (
                                  <button
                                    onClick={() => handleApproveGatepass(gp.id)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-3 py-1.5 rounded-lg shadow-sm"
                                  >
                                    Approve Outing
                                  </button>
                                ) : (
                                  <span className="text-slate-400 text-xs font-bold uppercase">{gp.status}</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: LIBRARY */}
          {activeTab === 'library' && (
            <div className="space-y-8">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-xl font-bold text-slate-800">Facilities » Library Catalog & Checkouts</h3>
              </div>

              {/* Student Checkouts list */}
              {role === 'STUDENT' && (
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60">
                  <h4 className="text-base font-bold text-slate-800 mb-3">My Library Circulation Ledger</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {checkouts.length === 0 ? (
                      <p className="text-sm font-semibold text-slate-400 col-span-2">No active books checked out from the library.</p>
                    ) : (
                      checkouts.map((checkout) => (
                        <div key={checkout.id} className="bg-white p-4 rounded-xl border border-slate-200/80 flex items-center justify-between shadow-sm">
                          <div>
                            <h5 className="text-sm font-bold text-slate-700">{checkout.book?.title || 'Unknown Title'}</h5>
                            <p className="text-xs font-medium text-slate-400">Due Date: {checkout.due_date.split('T')[0]}</p>
                          </div>
                          <div className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase ${
                            checkout.status === 'OVERDUE' ? 'bg-rose-50 text-rose-600 border border-rose-100 animate-pulse' :
                            checkout.status === 'RETURNED' ? 'bg-slate-50 text-slate-600' : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {checkout.status}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Library Catalog */}
              <div className="space-y-4">
                <h4 className="text-base font-bold text-slate-800">Circulation Books Catalog</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase">Title</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase">Author</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase">ISBN</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase">Available Copies</th>
                        {role === 'STUDENT' && <th className="p-4 text-xs font-bold text-slate-500 uppercase">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {books.map((book) => (
                        <tr key={book.id} className="hover:bg-slate-50/50">
                          <td className="p-4 text-sm font-bold text-slate-700">{book.title}</td>
                          <td className="p-4 text-sm font-medium text-slate-600">{book.author}</td>
                          <td className="p-4 text-xs font-medium text-slate-400">{book.isbn || 'N/A'}</td>
                          <td className="p-4 text-sm">
                            <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${book.available_copies > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                              {book.available_copies} / {book.total_copies}
                            </span>
                          </td>
                          {role === 'STUDENT' && (
                            <td className="p-4 text-sm">
                              <button
                                disabled={book.available_copies <= 0}
                                onClick={() => handleCheckoutBook(book.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold shadow-sm transition-all ${
                                  book.available_copies > 0
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                              >
                                Checkout Book
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: TRANSPORT */}
          {activeTab === 'transport' && (
            <div className="space-y-8">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-xl font-bold text-slate-800">Facilities » Transport Route Booking</h3>
              </div>

              {/* Student active bookings */}
              {role === 'STUDENT' && (
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60">
                  <h4 className="text-base font-bold text-slate-800 mb-3">My Transport Allocation</h4>
                  {reservations.length === 0 ? (
                    <p className="text-sm font-semibold text-slate-400">No active transport reservations found.</p>
                  ) : (
                    reservations.map((res) => (
                      <div key={res.id} className="bg-white p-4 rounded-xl border border-slate-200/80 flex items-center justify-between shadow-sm max-w-lg">
                        <div>
                          <h5 className="text-sm font-bold text-slate-700">{res.route?.route_name || 'Bus Route'}</h5>
                          <p className="text-xs font-medium text-slate-400">Vehicle No: {res.route?.bus_number} | Seat: #{res.seat_number}</p>
                          <p className="text-xs font-semibold text-slate-500">Driver: {res.route?.driver_name}</p>
                        </div>
                        <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-xs font-extrabold uppercase border border-emerald-100">
                          Allocated
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Available Bus Routes */}
              <div className="space-y-4">
                <h4 className="text-base font-bold text-slate-800">Available Institute Bus Routes</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {routes.map((route) => (
                    <div key={route.id} className="border border-slate-200/85 p-5 rounded-2xl flex flex-col gap-3 shadow-sm hover:border-slate-300 transition-all bg-slate-50/30">
                      <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                        <div>
                          <h5 className="text-base font-bold text-slate-800">{route.route_name}</h5>
                          <p className="text-xs font-medium text-slate-400">Bus Plate No: {route.bus_number}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-extrabold ${route.reserved_seats >= route.capacity ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {route.capacity - route.reserved_seats} Seats Left
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-500">
                        <div>Driver Name: <span className="text-slate-700 font-bold">{route.driver_name}</span></div>
                        <div>Total Seats: <span className="text-slate-700 font-bold">{route.capacity}</span></div>
                      </div>

                      {role === 'STUDENT' && (
                        <button
                          disabled={route.reserved_seats >= route.capacity}
                          onClick={() => handleReserveTransport(route.id)}
                          className={`w-full py-2.5 rounded-xl text-xs font-extrabold transition-all text-center shadow-sm ${
                            route.reserved_seats >= route.capacity
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          Book Seat & Generate Invoice
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
