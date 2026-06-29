import { useState, useEffect } from 'react';
import api from './api';

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

interface BusStop {
  id: string;
  name: string;
}

interface BusRoute {
  id: string;
  route_name: string;
  bus_number: string;
  driver_name: string;
  capacity: number;
  reserved_seats: number;
  stops?: BusStop[];
}

interface TransportReservation {
  id: string;
  student_id: string;
  pickup_stop: string;
  pickup_route_id: string;
  destination_stop: string;
  destination_route_id: string;
  vehicle_no?: string;
  paid_amount: number;
  is_paid: boolean;
  fee_amount: number;
  approval_authority: string;
  approval_status: string;
  seat_number?: number;
  reserved_at: string;
  pickup_route?: BusRoute;
  destination_route?: BusRoute;
  student?: {
    first_name: string;
    last_name: string;
    username: string;
  };
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

  // Notifications State
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Hostel States
  const [hostelAdmission, setHostelAdmission] = useState<HostelAdmission | null>(null);
  const [gatepasses, setGatepasses] = useState<Gatepass[]>([]);
  const [wardenGatepasses, setWardenGatepasses] = useState<any[]>([]);
  const [loadingHostel, setLoadingHostel] = useState(false);

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

  const [outingForm, setOutingForm] = useState({
    reason: '',
    outDate: '',
    inDate: '',
  });

  // Library States
  const [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedBooks, setSearchedBooks] = useState<Book[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loadingLibrary, setLoadingLibrary] = useState(false);

  // Transport States
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [stops, setStops] = useState<BusStop[]>([]);
  const [reservations, setReservations] = useState<TransportReservation[]>([]);
  const [allReservations, setAllReservations] = useState<TransportReservation[]>([]);
  const [loadingTransport, setLoadingTransport] = useState(false);
  
  // Transport requisition layout & form states
  const [showAddTransportRequest, setShowAddTransportRequest] = useState(false);
  const [activeTransportSubTab, setActiveTransportSubTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'>('PENDING');
  
  const [transportForm, setTransportForm] = useState({
    policy: 'MIT Aurangabad Transport Policy',
    plan: 'MIT TRANSPORT PLAN 2022-2026 - CSE/ME/CE',
    pickupStop: '',
    pickupRouteId: '',
    destinationStop: '',
    destinationRouteId: '',
  });

  // Transport Admin state
  const [newStopName, setNewStopName] = useState('');
  const [newRouteForm, setNewRouteForm] = useState({
    route_name: '',
    bus_number: '',
    driver_name: '',
    capacity: 40,
  });
  const [selectedRouteStopIds, setSelectedRouteStopIds] = useState<string[]>([]);

  const fetchUserData = async () => {
    try {
      const res = await api.get('/users/me');
      setRole(res.data.system_role);
      setUser(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // Fetch Hostel Data
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
        const resGps = await api.get('/campus/gatepass');
        setWardenGatepasses(resGps.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHostel(false);
    }
  };

  // Fetch Library Data (Ledger / Checkouts)
  const fetchLibraryData = async () => {
    setLoadingLibrary(true);
    try {
      if (role === 'STUDENT') {
        const resC = await api.get('/library/checkouts/me');
        setCheckouts(resC.data);
      } else {
        // Librarian sees checkouts
        const resC = await api.get('/library/checkouts/me'); // fall back or all checkouts
        setCheckouts(resC.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLibrary(false);
    }
  };

  // Search Books in Catalog
  const handleSearchBooks = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoadingLibrary(true);
    try {
      const res = await api.get(`/library/books?q=${searchQuery}`);
      setSearchedBooks(res.data);
      setHasSearched(true);
    } catch (err) {
      showNotification('error', 'Book search failed');
    } finally {
      setLoadingLibrary(false);
    }
  };

  // Fetch Transport Data
  const fetchTransportData = async () => {
    setLoadingTransport(true);
    try {
      const resStops = await api.get('/transport/stops');
      setStops(resStops.data);

      const resRoutes = await api.get('/transport/routes');
      setRoutes(resRoutes.data);

      if (role === 'STUDENT') {
        const resRes = await api.get('/transport/reservations/me');
        setReservations(resRes.data);
      } else {
        const resResAll = await api.get('/transport/reservations');
        setAllReservations(resResAll.data);
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

  // Register Hostel
  const handleHostelRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostelForm.acceptRules) {
      showNotification('error', 'You must accept the hostel policy and rules agreement');
      return;
    }
    try {
      await api.post('/hostel/admissions', {
        student_id: user.id,
        room_number: hostelForm.roomName,
        block_name: hostelForm.buildingName,
        parent_consent_approved: true,
      });
      showNotification('success', 'Hostel Registered Successfully! A Fee Invoice of 50,000 INR has been generated.');
      fetchHostelData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Hostel Registration Failed');
    }
  };

  // Night Out Outing Request
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

  // Approve Outing Gatepass (Warden/Admin)
  const handleApproveGatepass = async (id: string) => {
    try {
      await api.put(`/campus/gatepass/${id}/approve?status=APPROVED`);
      showNotification('success', 'Gatepass Request APPROVED!');
      fetchHostelData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Action failed');
    }
  };

  // Checkout Book Inquiry Request
  const handleCheckoutBook = async (bookId: string) => {
    try {
      await api.post('/library/checkout', { book_id: bookId });
      showNotification('success', 'Book Issued Successfully! Return window is 14 days.');
      fetchLibraryData();
      // Refresh search to show updated copies count
      handleSearchBooks();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Checkout Request Denied');
    }
  };

  // Student Submits Transport Requisition
  const handleRequestTransport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transportForm.pickupStop || !transportForm.pickupRouteId || !transportForm.destinationStop || !transportForm.destinationRouteId) {
      showNotification('error', 'Please fill all pickup and destination stop and route fields');
      return;
    }
    try {
      await api.post('/transport/reserve', {
        pickup_stop: transportForm.pickupStop,
        pickup_route_id: transportForm.pickupRouteId,
        destination_stop: transportForm.destinationStop,
        destination_route_id: transportForm.destinationRouteId
      });
      showNotification('success', 'Transport Requisition filed successfully! A Fee Invoice of 12,000 INR was generated.');
      setShowAddTransportRequest(false);
      fetchTransportData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Requisition Filing Failed');
    }
  };

  // Transport Officer Updates Request Status
  const handleUpdateTransportStatus = async (resId: string, status: string) => {
    try {
      await api.put(`/transport/reservations/${resId}/status?status=${status}`);
      showNotification('success', `Reservation updated successfully to ${status}!`);
      fetchTransportData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Failed to update reservation status');
    }
  };

  // Admin Adds New Stop Name
  const handleAddStop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStopName.trim()) return;
    try {
      await api.post('/transport/stops', { name: newStopName });
      showNotification('success', `Bus Stop '${newStopName}' defined successfully!`);
      setNewStopName('');
      fetchTransportData();
    } catch (err) {
      showNotification('error', 'Failed to define stop');
    }
  };

  // Admin Defines New Route
  const handleAddRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRouteForm.route_name || !newRouteForm.bus_number || !newRouteForm.driver_name) {
      showNotification('error', 'Please complete route metadata fields');
      return;
    }
    try {
      const resRoute = await api.post('/transport/routes', newRouteForm);
      const routeId = resRoute.data.id;
      
      // Link selected stops
      for (const stopId of selectedRouteStopIds) {
        await api.post(`/transport/routes/${routeId}/stops/${stopId}`);
      }
      
      showNotification('success', `Route '${newRouteForm.route_name}' defined and stops associated successfully!`);
      setNewRouteForm({ route_name: '', bus_number: '', driver_name: '', capacity: 40 });
      setSelectedRouteStopIds([]);
      fetchTransportData();
    } catch (err) {
      showNotification('error', 'Failed to define route');
    }
  };

  // Filter transport requisitions by sub-tab status
  const studentReservationsFiltered = reservations.filter(r => r.approval_status === activeTransportSubTab);
  const adminReservationsFiltered = allReservations.filter(r => r.approval_status === activeTransportSubTab);

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      {/* Toast System */}
      {notification && (
        <div className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg border transition-all duration-300 ${
          notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className={`w-2 h-2 rounded-full ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <p className="text-sm font-semibold">{notification.message}</p>
        </div>
      )}

      {/* Facilities Page Header */}
      <div className="flex flex-col gap-2 mb-8">
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Facilities Management</h2>
        <p className="text-slate-500 font-medium">Configure hostel rooms, check library circulation records, and file transport requisitions.</p>
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
            Hostel Registration and Leaves
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all w-full text-left ${
              activeTab === 'library' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            Library Circulation
          </button>
          <button
            onClick={() => setActiveTab('transport')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all w-full text-left ${
              activeTab === 'transport' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            Transport Requisition
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
                    // HOSTEL REGISTRATION FORM
                    <form onSubmit={handleHostelRegister} className="space-y-6">
                      <div className="border-b border-slate-100 pb-4">
                        <h3 className="text-xl font-bold text-slate-800">Facilities - Hostel - Hostel Registration</h3>
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
                            <option>VIII</option>
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

                      {/* Policy & Plan selections */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Policy Name *</label>
                          <select
                            value={hostelForm.policyName}
                            onChange={(e) => setHostelForm({...hostelForm, policyName: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-medium"
                          >
                            <option>MIT Aurangabad Hostel Policy</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Plan Name *</label>
                          <select
                            value={hostelForm.planName}
                            onChange={(e) => setHostelForm({...hostelForm, planName: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-medium"
                          >
                            <option>Hostel Plan 2025-2026</option>
                          </select>
                        </div>
                      </div>

                      {/* Parent Details */}
                      <div className="space-y-4 pt-4 border-t border-slate-100">
                        <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Family & Guardian Contact Details</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">Father Name *</label>
                            <input
                              type="text"
                              required
                              value={hostelForm.fatherName}
                              onChange={(e) => setHostelForm({...hostelForm, fatherName: e.target.value})}
                              placeholder="Father Full Name"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">Father Contact *</label>
                            <input
                              type="text"
                              required
                              value={hostelForm.fatherContact}
                              onChange={(e) => setHostelForm({...hostelForm, fatherContact: e.target.value})}
                              placeholder="Phone Number"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-2">Father Address *</label>
                          <input
                            type="text"
                            required
                            value={hostelForm.fatherAddress}
                            onChange={(e) => setHostelForm({...hostelForm, fatherAddress: e.target.value})}
                            placeholder="Residential Address"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">Mother Name *</label>
                            <input
                              type="text"
                              required
                              value={hostelForm.motherName}
                              onChange={(e) => setHostelForm({...hostelForm, motherName: e.target.value})}
                              placeholder="Mother Full Name"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">Mother Contact *</label>
                            <input
                              type="text"
                              required
                              value={hostelForm.motherContact}
                              onChange={(e) => setHostelForm({...hostelForm, motherContact: e.target.value})}
                              placeholder="Phone Number"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Building Allocation Choice */}
                      <div className="space-y-4 pt-4 border-t border-slate-100">
                        <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Building Preference</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">Building *</label>
                            <select
                              value={hostelForm.buildingName}
                              onChange={(e) => setHostelForm({...hostelForm, buildingName: e.target.value})}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium"
                            >
                              <option>Aryabhata Block A</option>
                              <option>Aryabhata Block B</option>
                              <option>Bhaskara Boys Block</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">Floor *</label>
                            <select
                              value={hostelForm.floorName}
                              onChange={(e) => setHostelForm({...hostelForm, floorName: e.target.value})}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium"
                            >
                              <option>Floor 1</option>
                              <option>Floor 2</option>
                              <option>Floor 3</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">Room *</label>
                            <select
                              value={hostelForm.roomName}
                              onChange={(e) => setHostelForm({...hostelForm, roomName: e.target.value})}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium"
                            >
                              <option>Room 101</option>
                              <option>Room 102</option>
                              <option>Room 201</option>
                              <option>Room 202</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Rules acceptance */}
                      <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <input
                          type="checkbox"
                          id="acceptRules"
                          checked={hostelForm.acceptRules}
                          onChange={(e) => setHostelForm({...hostelForm, acceptRules: e.target.checked})}
                          className="mt-1 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                        />
                        <label htmlFor="acceptRules" className="text-xs font-semibold text-slate-600 leading-relaxed cursor-pointer">
                          I agree that all information entered is true to my knowledge and I agree to strictly abide by the guidelines, codes of conduct, and policies set forth by the MIT Aurangabad Hostel board of trustees.
                        </label>
                      </div>

                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md shadow-blue-500/10 text-sm"
                      >
                        Enroll and Generate Fee Invoice
                      </button>
                    </form>
                  ) : (
                    // ACTIVE ADMISSION CARD
                    <div className="space-y-6">
                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 max-w-lg space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                          <div>
                            <h3 className="text-lg font-bold text-slate-800">Hostel Allocation</h3>
                            <p className="text-sm font-semibold text-slate-400">Active Resident Profile</p>
                          </div>
                          <span className="bg-emerald-50 text-emerald-600 text-xs font-extrabold uppercase px-3 py-1 rounded-lg border border-emerald-100">
                            Registered
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-500">
                          <div>Building Block Name: <span className="text-slate-700 font-bold">{hostelAdmission.block_name}</span></div>
                          <div>Room Number: <span className="text-slate-700 font-bold">{hostelAdmission.room_number}</span></div>
                          <div>Parent Outing Permission: <span className={`font-bold ${hostelAdmission.parent_consent_approved ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {hostelAdmission.parent_consent_approved ? 'Granted' : 'Denied / Restrained'}
                          </span></div>
                        </div>
                      </div>

                      {/* OUTING / GATEPASS FORM FOR RESIDENT STUDENT */}
                      <div className="border-t border-slate-100 pt-6 space-y-4">
                        <h3 className="text-lg font-bold text-slate-800">Request Leave Outing Gatepass</h3>
                        <form onSubmit={handleRequestOuting} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-slate-50 p-5 rounded-2xl border border-slate-100">
                          <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-slate-500 mb-2">Reason for Outing</label>
                            <input
                              type="text"
                              required
                              value={outingForm.reason}
                              onChange={(e) => setOutingForm({...outingForm, reason: e.target.value})}
                              placeholder="e.g. Health checkup / visiting parents"
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">Out Date & Time</label>
                            <input
                              type="datetime-local"
                              required
                              value={outingForm.outDate}
                              onChange={(e) => setOutingForm({...outingForm, outDate: e.target.value})}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">Return Date & Time</label>
                            <input
                              type="datetime-local"
                              required
                              value={outingForm.inDate}
                              onChange={(e) => setOutingForm({...outingForm, inDate: e.target.value})}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium"
                            />
                          </div>
                          <div className="md:col-span-3 pt-2 flex justify-end">
                            <button
                              type="submit"
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md shadow-blue-500/10 text-sm"
                            >
                              Submit Outing Request
                            </button>
                          </div>
                        </form>
                      </div>

                      {/* OUTING LIST FOR STUDENT */}
                      <div className="space-y-3">
                        <h4 className="text-base font-bold text-slate-800">My Outing History</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Reason</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Out Date</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">In Date</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Security Check</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Parental Consent Gate</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {gatepasses.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="p-4 text-center text-sm font-semibold text-slate-400">No outing records found.</td>
                                </tr>
                              ) : (
                                gatepasses.map(gp => (
                                  <tr key={gp.id} className="hover:bg-slate-50/50">
                                    <td className="p-4 text-sm font-bold text-slate-700">{gp.reason}</td>
                                    <td className="p-4 text-xs font-semibold text-slate-500">{new Date(gp.out_date).toLocaleString()}</td>
                                    <td className="p-4 text-xs font-semibold text-slate-500">{new Date(gp.in_date).toLocaleString()}</td>
                                    <td className="p-4 text-xs">
                                      <span className={`px-2 py-0.5 rounded-lg text-xs font-extrabold uppercase ${
                                        gp.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' :
                                        gp.status === 'REJECTED' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                                      }`}>
                                        {gp.status}
                                      </span>
                                    </td>
                                    <td className="p-4 text-xs font-bold">
                                      {gp.signature_verified ? (
                                        <span className="text-emerald-600">Verified & Approved</span>
                                      ) : (
                                        <span className="text-slate-400">No Action Required</span>
                                      )}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                    </div>
                  )}
                </>
              ) : (
                // WARDEN / ADMIN LIST GATEPASSES FOR APPROVAL
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-xl font-bold text-slate-800">Outing Requests Gate</h3>
                    <p className="text-xs font-medium text-slate-400">Approve or deny student leave outings with automatic parental consent checks.</p>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase">Student</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase">Reason</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase">Out Date</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase">In Date</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase">Parent Status</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {wardenGatepasses.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-sm font-semibold text-slate-400">No pending outing requests.</td>
                          </tr>
                        ) : (
                          wardenGatepasses.map((gp: any) => (
                            <tr key={gp.id} className="hover:bg-slate-50/50">
                              <td className="p-4 text-sm font-bold text-slate-700">
                                {gp.student?.first_name} {gp.student?.last_name}
                              </td>
                              <td className="p-4 text-sm font-semibold text-slate-600">{gp.reason}</td>
                              <td className="p-4 text-xs font-semibold text-slate-500">{new Date(gp.out_date).toLocaleString()}</td>
                              <td className="p-4 text-xs font-semibold text-slate-500">{new Date(gp.in_date).toLocaleString()}</td>
                              <td className="p-4 text-xs">
                                <span className={`px-2 py-0.5 rounded-lg text-xs font-extrabold uppercase ${
                                  gp.signature_verified ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                }`}>
                                  {gp.signature_verified ? 'Consent Granted' : 'Blocked / Denied'}
                                </span>
                              </td>
                              <td className="p-4 text-sm">
                                {gp.status === 'PENDING' ? (
                                  <button
                                    onClick={() => handleApproveGatepass(gp.id)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 px-3 rounded-lg text-xs"
                                  >
                                    Approve Outing
                                  </button>
                                ) : (
                                  <span className="text-slate-400 text-xs font-extrabold uppercase">{gp.status}</span>
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
                <h3 className="text-xl font-bold text-slate-800">Facilities - Library Circulation</h3>
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
                            <p className="text-xs font-medium text-slate-400">Checkout Date: {checkout.checkout_date.split('T')[0]}</p>
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

              {/* Book Inquiry & Search */}
              <div className="space-y-4">
                <h4 className="text-base font-bold text-slate-800">Book Search and Inquiry</h4>
                <form onSubmit={handleSearchBooks} className="flex gap-3 max-w-lg">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by book title, author, or ISBN..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-medium"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md text-sm"
                  >
                    Search
                  </button>
                </form>

                {hasSearched && (
                  <div className="pt-2 space-y-4">
                    <h5 className="text-sm font-bold text-slate-700">Search Results ({searchedBooks.length})</h5>
                    {searchedBooks.length === 0 ? (
                      <p className="text-sm font-semibold text-slate-400">No matching books found in the library catalog.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {searchedBooks.map((book) => (
                          <div key={book.id} className="border border-slate-200/80 p-4 rounded-xl flex justify-between items-center bg-white shadow-sm">
                            <div>
                              <h6 className="text-sm font-bold text-slate-800">{book.title}</h6>
                              <p className="text-xs font-semibold text-slate-500">Author: {book.author}</p>
                              <p className="text-xs font-medium text-slate-400">ISBN: {book.isbn || 'N/A'}</p>
                              <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold ${book.available_copies > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {book.available_copies} of {book.total_copies} copies available
                              </span>
                            </div>
                            {role === 'STUDENT' && (
                              <button
                                disabled={book.available_copies <= 0}
                                onClick={() => handleCheckoutBook(book.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                                  book.available_copies > 0
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                              >
                                Checkout Book
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: TRANSPORT */}
          {activeTab === 'transport' && (
            <div className="space-y-8">
              
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h3 className="text-xl font-bold text-slate-800">Facilities - Student Transport Requisition</h3>
                {role === 'STUDENT' && !showAddTransportRequest && (
                  <button
                    onClick={() => {
                      // Pre-fill route dropdown defaults if stops exist
                      if (stops.length > 0) {
                        setTransportForm({
                          ...transportForm,
                          pickupStop: stops[0].name,
                          pickupRouteId: routes[0]?.id || '',
                          destinationStop: stops[0].name,
                          destinationRouteId: routes[0]?.id || '',
                        });
                      }
                      setShowAddTransportRequest(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold shadow-md shadow-blue-500/10 text-xs transition-all"
                  >
                    Add New Request
                  </button>
                )}
              </div>

              {/* Student transport requisition form */}
              {role === 'STUDENT' && showAddTransportRequest ? (
                <form onSubmit={handleRequestTransport} className="space-y-6 max-w-2xl bg-slate-50 p-6 rounded-3xl border border-slate-200/50">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <h4 className="text-base font-bold text-slate-800">Add New Requisition</h4>
                    <button
                      type="button"
                      onClick={() => setShowAddTransportRequest(false)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800"
                    >
                      Back
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-2">Transport Policy</label>
                      <select
                        value={transportForm.policy}
                        onChange={(e) => setTransportForm({...transportForm, policy: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700"
                      >
                        <option>MIT Aurangabad Transport Policy</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-2">Transport Plan</label>
                      <select
                        value={transportForm.plan}
                        onChange={(e) => setTransportForm({...transportForm, plan: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700"
                      >
                        <option>MIT TRANSPORT PLAN 2022-2026 - CSE/ME/CE</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-2">Pick up Stop</label>
                      <select
                        value={transportForm.pickupStop}
                        onChange={(e) => setTransportForm({...transportForm, pickupStop: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700"
                      >
                        {stops.map(stop => (
                          <option key={stop.id} value={stop.name}>{stop.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-2">Pick Route Name</label>
                      <select
                        value={transportForm.pickupRouteId}
                        onChange={(e) => setTransportForm({...transportForm, pickupRouteId: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700"
                      >
                        {routes.map(r => (
                          <option key={r.id} value={r.id}>{r.route_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-2">Drop Stop</label>
                      <select
                        value={transportForm.destinationStop}
                        onChange={(e) => setTransportForm({...transportForm, destinationStop: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700"
                      >
                        {stops.map(stop => (
                          <option key={stop.id} value={stop.name}>{stop.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-2">Drop Route Name</label>
                      <select
                        value={transportForm.destinationRouteId}
                        onChange={(e) => setTransportForm({...transportForm, destinationRouteId: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700"
                      >
                        {routes.map(r => (
                          <option key={r.id} value={r.id}>{r.route_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md text-sm"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddTransportRequest(false)}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2.5 px-6 rounded-xl transition-all text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                // Active Table of requisitions with status sub-tabs
                <div className="space-y-6">
                  
                  {/* Status Sub-Tabs */}
                  <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50 max-w-md">
                    {(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as const).map(status => (
                      <button
                        key={status}
                        onClick={() => setActiveTransportSubTab(status)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition-all uppercase ${
                          activeTransportSubTab === status
                            ? 'bg-white text-blue-600 shadow-sm border border-slate-200/20'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {status.toLowerCase()} Requests
                      </button>
                    ))}
                  </div>

                  {/* Requisitions Ledger Table */}
                  <div className="overflow-x-auto bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase">
                          <th className="p-4">Sr No.</th>
                          <th className="p-4">Student Name</th>
                          <th className="p-4">Pick Up Stop</th>
                          <th className="p-4">Pick Up Route</th>
                          <th className="p-4">Destination Stop</th>
                          <th className="p-4">Destination Route</th>
                          <th className="p-4">Requested Vehicle No</th>
                          <th className="p-4">Paid Amount</th>
                          <th className="p-4">Is Paid</th>
                          <th className="p-4">Fee Amount</th>
                          <th className="p-4">Approval Status</th>
                          {role !== 'STUDENT' && <th className="p-4">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {role === 'STUDENT' ? (
                          studentReservationsFiltered.length === 0 ? (
                            <tr>
                              <td colSpan={11} className="p-8 text-center text-slate-400 font-semibold">Data Not Found...</td>
                            </tr>
                          ) : (
                            studentReservationsFiltered.map((r, i) => (
                              <tr key={r.id} className="hover:bg-slate-50/50">
                                <td className="p-4 font-bold text-slate-500">{i + 1}</td>
                                <td className="p-4 font-bold text-slate-700">{user?.first_name} {user?.last_name}</td>
                                <td className="p-4 font-semibold text-slate-600">{r.pickup_stop}</td>
                                <td className="p-4 text-xs font-medium text-slate-500">{r.pickup_route?.route_name}</td>
                                <td className="p-4 font-semibold text-slate-600">{r.destination_stop}</td>
                                <td className="p-4 text-xs font-medium text-slate-500">{r.destination_route?.route_name}</td>
                                <td className="p-4 font-bold text-indigo-600">{r.vehicle_no || 'N/A'}</td>
                                <td className="p-4 font-semibold text-slate-700">{r.paid_amount} INR</td>
                                <td className="p-4 text-xs font-extrabold uppercase">
                                  <span className={`px-2 py-0.5 rounded ${r.is_paid ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {r.is_paid ? 'Yes' : 'No'}
                                  </span>
                                </td>
                                <td className="p-4 font-bold text-slate-700">{r.fee_amount} INR</td>
                                <td className="p-4 text-xs uppercase font-extrabold">
                                  <span className={`px-2 py-0.5 rounded ${
                                    r.approval_status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' :
                                    r.approval_status === 'REJECTED' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                                  }`}>
                                    {r.approval_status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )
                        ) : (
                          // Transport Officer list
                          adminReservationsFiltered.length === 0 ? (
                            <tr>
                              <td colSpan={12} className="p-8 text-center text-slate-400 font-semibold">Data Not Found...</td>
                            </tr>
                          ) : (
                            adminReservationsFiltered.map((r, i) => (
                              <tr key={r.id} className="hover:bg-slate-50/50">
                                <td className="p-4 font-bold text-slate-500">{i + 1}</td>
                                <td className="p-4 font-bold text-slate-700">{r.student?.first_name} {r.student?.last_name}</td>
                                <td className="p-4 font-semibold text-slate-600">{r.pickup_stop}</td>
                                <td className="p-4 text-xs font-medium text-slate-500">{r.pickup_route?.route_name}</td>
                                <td className="p-4 font-semibold text-slate-600">{r.destination_stop}</td>
                                <td className="p-4 text-xs font-medium text-slate-500">{r.destination_route?.route_name}</td>
                                <td className="p-4 font-bold text-indigo-600">{r.vehicle_no || 'N/A'}</td>
                                <td className="p-4 font-semibold text-slate-700">{r.paid_amount} INR</td>
                                <td className="p-4 text-xs font-extrabold uppercase">
                                  <span className={`px-2 py-0.5 rounded ${r.is_paid ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {r.is_paid ? 'Yes' : 'No'}
                                  </span>
                                </td>
                                <td className="p-4 font-bold text-slate-700">{r.fee_amount} INR</td>
                                <td className="p-4 text-xs uppercase font-extrabold">
                                  <span className={`px-2 py-0.5 rounded ${
                                    r.approval_status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' :
                                    r.approval_status === 'REJECTED' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                                  }`}>
                                    {r.approval_status}
                                  </span>
                                </td>
                                <td className="p-4 text-xs font-bold flex gap-2">
                                  {r.approval_status === 'PENDING' && (
                                    <>
                                      <button
                                        onClick={() => handleUpdateTransportStatus(r.id, 'APPROVED')}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white py-1 px-2.5 rounded-lg"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => handleUpdateTransportStatus(r.id, 'REJECTED')}
                                        className="bg-rose-600 hover:bg-rose-700 text-white py-1 px-2.5 rounded-lg"
                                      >
                                        Reject
                                      </button>
                                    </>
                                  )}
                                </td>
                              </tr>
                            ))
                          )
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* ADMIN DEFINE STOP & ROUTE CONTROLS */}
                  {role !== 'STUDENT' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 border-t border-slate-100 pt-8">
                      {/* Define New Stop */}
                      <form onSubmit={handleAddStop} className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200/50">
                        <h4 className="text-base font-bold text-slate-800">Define New Transport Stop</h4>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5">Stop Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Cidco Mahanagar Stop"
                            value={newStopName}
                            onChange={(e) => setNewStopName(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm"
                          />
                        </div>
                        <button
                          type="submit"
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl text-xs shadow-md shadow-blue-500/10 transition-all"
                        >
                          Add Stop
                        </button>
                      </form>

                      {/* Define New Route */}
                      <form onSubmit={handleAddRoute} className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200/50">
                        <h4 className="text-base font-bold text-slate-800">Define New Route & Associate Stops</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5">Route Name</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Jatwada To MIT"
                              value={newRouteForm.route_name}
                              onChange={(e) => setNewRouteForm({...newRouteForm, route_name: e.target.value})}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5">Bus Number</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. MH-20-EF-1234"
                              value={newRouteForm.bus_number}
                              onChange={(e) => setNewRouteForm({...newRouteForm, bus_number: e.target.value})}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5">Driver Name</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Ramesh Patil"
                              value={newRouteForm.driver_name}
                              onChange={(e) => setNewRouteForm({...newRouteForm, driver_name: e.target.value})}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5">Capacity</label>
                            <input
                              type="number"
                              required
                              value={newRouteForm.capacity}
                              onChange={(e) => setNewRouteForm({...newRouteForm, capacity: parseInt(e.target.value) || 40})}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm"
                            />
                          </div>
                        </div>

                        {/* Select Stops to Associate */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-500">Associate Stops</label>
                          <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto bg-white border border-slate-200 rounded-xl p-3">
                            {stops.map(stop => (
                              <label key={stop.id} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedRouteStopIds.includes(stop.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedRouteStopIds([...selectedRouteStopIds, stop.id]);
                                    } else {
                                      setSelectedRouteStopIds(selectedRouteStopIds.filter(id => id !== stop.id));
                                    }
                                  }}
                                  className="rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                                />
                                {stop.name}
                              </label>
                            ))}
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl text-xs shadow-md shadow-blue-500/10 transition-all"
                        >
                          Save Route
                        </button>
                      </form>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
