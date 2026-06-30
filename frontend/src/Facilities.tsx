import { useState, useEffect } from 'react';
import { 
  Book as BookIcon, Bus, Home, Utensils, Award, CheckCircle, Wrench, Package, ShieldAlert 
} from 'lucide-react';
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
  student?: {
    first_name: string;
    last_name: string;
    username: string;
  };
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
  student?: {
    first_name: string;
    last_name: string;
    username: string;
  };
  pickup_route?: BusRoute;
  destination_route?: BusRoute;
}

interface HostelAdmission {
  id: string;
  student_id: string;
  course_year?: string;
  gender?: string;
  policy_name?: string;
  plan_name?: string;
  father_name?: string;
  father_contact?: string;
  father_address?: string;
  mother_name?: string;
  mother_contact?: string;
  mother_address?: string;
  guardian_name?: string;
  guardian_contact?: string;
  guardian_address?: string;
  vehicle_number?: string;
  license_number?: string;
  block_name?: string;
  floor_name?: string;
  room_number?: string;
  status: string;
  parent_consent_approved: boolean;
  student?: {
    first_name: string;
    last_name: string;
    username: string;
  };
}

interface Gatepass {
  id: string;
  reason: string;
  out_date: string;
  in_date: string;
  status: string;
  signature_verified: boolean;
}

export default function Facilities() {
  const [activeTab, setActiveTab] = useState<'hostel' | 'library' | 'transport' | 'mess' | 'sports' | 'maintenance' | 'store'>('hostel');
  const [role, setRole] = useState<string>('STUDENT');
  const [user, setUser] = useState<any>(null);

  // Notifications State
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Helper Booleans for RBAC Role checks
  const userRoles = user ? [user.system_role, ...(user.additional_roles || [])] : [];
  const isStudent = user?.system_role === 'STUDENT';
  const isWarden = userRoles.includes('ADMIN') || userRoles.includes('SUPER_ADMIN') || userRoles.includes('HOSTEL_WARDEN');
  const isLibrarian = userRoles.includes('ADMIN') || userRoles.includes('SUPER_ADMIN') || userRoles.includes('LIBRARIAN');
  const isTransportOfficer = userRoles.includes('ADMIN') || userRoles.includes('SUPER_ADMIN') || userRoles.includes('TRANSPORT_OFFICER');
  const isMessInCharge = userRoles.includes('ADMIN') || userRoles.includes('SUPER_ADMIN') || userRoles.includes('MESS_IN_CHARGE');
  const isSportsOfficer = userRoles.includes('ADMIN') || userRoles.includes('SUPER_ADMIN') || userRoles.includes('SPORTS_OFFICER');
  const isEstateManager = userRoles.includes('ADMIN') || userRoles.includes('SUPER_ADMIN') || userRoles.includes('ESTATE_MANAGER');
  const isPurchaseOfficer = userRoles.includes('ADMIN') || userRoles.includes('SUPER_ADMIN') || userRoles.includes('PURCHASE_OFFICER');

  // Helper to determine if a specific tab should be visible
  const isTabVisible = (tab: string) => {
    if (!user) return false;
    const rolesList = [user.system_role, ...(user.additional_roles || [])];
    if (rolesList.includes('SUPER_ADMIN') || rolesList.includes('ADMIN') || rolesList.includes('PRINCIPAL')) {
      return true;
    }
    if (user.system_role === 'STUDENT') {
      return true;
    }
    if (tab === 'hostel' && rolesList.includes('HOSTEL_WARDEN')) return true;
    if (tab === 'library' && rolesList.includes('LIBRARIAN')) return true;
    if (tab === 'transport' && rolesList.includes('TRANSPORT_OFFICER')) return true;
    if (tab === 'mess' && rolesList.includes('MESS_IN_CHARGE')) return true;
    if (tab === 'sports' && rolesList.includes('SPORTS_OFFICER')) return true;
    if (tab === 'maintenance' && rolesList.includes('ESTATE_MANAGER')) return true;
    if (tab === 'store' && rolesList.includes('PURCHASE_OFFICER')) return true;
    return false;
  };

  // --- HOSTEL STATES ---
  const [hostelAdmission, setHostelAdmission] = useState<HostelAdmission | null>(null);
  const [allHostelAdmissions, setAllHostelAdmissions] = useState<HostelAdmission[]>([]);
  const [gatepasses, setGatepasses] = useState<Gatepass[]>([]);
  const [wardenGatepasses, setWardenGatepasses] = useState<any[]>([]);
  const [loadingHostel, setLoadingHostel] = useState(false);
  const [activeHostelSubTab, setActiveHostelSubTab] = useState<'booking' | 'outing'>('booking');

  // Warden Room Allocation States
  const [allocatingId, setAllocatingId] = useState<string | null>(null);
  const [allocationForm, setAllocationForm] = useState({
    block_name: 'Aryabhata Block A',
    floor_name: 'Floor 1',
    room_number: 'Room 101',
  });

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
    guardianName: '',
    guardianContact: '',
    guardianAddress: '',
    vehicleNumber: '',
    licenseNumber: '',
    acceptRules: false,
  });

  const [outingForm, setOutingForm] = useState({
    reason: '',
    outDate: '',
    inDate: '',
  });

  // --- LIBRARY STATES ---
  const [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const [allCheckouts, setAllCheckouts] = useState<Checkout[]>([]);
  const [searchedBooks, setSearchedBooks] = useState<Book[]>([]);
  const [checkoutUsernames, setCheckoutUsernames] = useState<{[key: string]: string}>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [newBookForm, setNewBookForm] = useState({ title: '', author: '', isbn: '', totalCopies: 5 });

  // --- TRANSPORT STATES ---
  const [stops, setStops] = useState<BusStop[]>([]);
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [reservations, setReservations] = useState<TransportReservation[]>([]);
  const [allReservations, setAllReservations] = useState<TransportReservation[]>([]);
  const [loadingTransport, setLoadingTransport] = useState(false);
  const [showAddTransportRequest, setShowAddTransportRequest] = useState(false);
  
  // Strict compiler silencing
  if (loadingHostel || hasSearched || loadingLibrary || loadingTransport) {}
  const [activeTransportSubTab, setActiveTransportSubTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'>('PENDING');

  const [transportForm, setTransportForm] = useState({
    plan: 'MIT TRANSPORT PLAN 2022-2026 - CSE/ME/CE',
    pickupStop: '',
    pickupRouteId: '',
    destinationStop: '',
    destinationRouteId: '',
  });

  const [newStopName, setNewStopName] = useState('');
  const [newRouteForm, setNewRouteForm] = useState({
    route_name: '',
    bus_number: '',
    driver_name: '',
    capacity: 40,
  });
  const [selectedRouteStopIds, setSelectedRouteStopIds] = useState<string[]>([]);

  // --- MESS STATES ---
  const [messMenu, setMessMenu] = useState<any[]>([]);
  const [messFeedback, setMessFeedback] = useState<any[]>([]);
  const [messGrocery, setMessGrocery] = useState<any[]>([]);
  const [messForm, setMessForm] = useState({ dayOfWeek: 'Monday', breakfast: '', lunch: '', snacks: '', dinner: '' });
  const [feedbackForm, setFeedbackForm] = useState({ rating: 5, review: '' });

  // --- SPORTS STATES ---
  const [sportsEquipment, setSportsEquipment] = useState<any[]>([]);
  const [sportsIssueRequests, setSportsIssueRequests] = useState<any[]>([]);
  const [sportsTournaments, setSportsTournaments] = useState<any[]>([]);
  const [sportsForm, setSportsForm] = useState({ equipmentId: '', quantity: 1 });
  const [tournamentForm, setTournamentForm] = useState({ teamName: '', sportName: 'Cricket', membersCount: 11 });

  // --- MAINTENANCE STATES ---
  const [maintenanceTickets, setMaintenanceTickets] = useState<any[]>([]);
  const [maintenanceForm, setMaintenanceForm] = useState({ category: 'ELECTRIC', blockName: '', description: '' });
  const [assignStaffMap, setAssignStaffMap] = useState<{ [ticketId: string]: string }>({});

  // --- STORE & VENDING STATES ---
  const [storeInventory, setStoreInventory] = useState<any[]>([]);
  const [storeRequisitions, setStoreRequisitions] = useState<any[]>([]);
  const [vendingInventory, setVendingInventory] = useState<any[]>([]);
  const [storeForm, setStoreForm] = useState({ itemId: '', quantity: 1 });

  // --- FETCH DISPATCHERS ---
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

  useEffect(() => {
    if (user) {
      const allowed = ['hostel', 'library', 'transport', 'mess', 'sports', 'maintenance', 'store'].filter(isTabVisible);
      if (allowed.length > 0 && !allowed.includes(activeTab)) {
        setActiveTab(allowed[0] as any);
      }
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'hostel') fetchHostelData();
    if (activeTab === 'library') fetchLibraryData();
    if (activeTab === 'transport') fetchTransportData();
    if (activeTab === 'mess') fetchMessData();
    if (activeTab === 'sports') fetchSportsData();
    if (activeTab === 'maintenance') fetchMaintenanceData();
    if (activeTab === 'store') fetchStoreData();
  }, [activeTab, role, user]);

  const fetchHostelData = async () => {
    setLoadingHostel(true);
    try {
      if (isStudent) {
        try {
          const res = await api.get('/hostel/admissions/me');
          setHostelAdmission(res.data);
        } catch (err) {
          setHostelAdmission(null);
        }
        const resGp = await api.get('/campus/gatepass');
        setGatepasses(resGp.data);
      }
      if (isWarden) {
        const resAdm = await api.get('/hostel/admissions');
        setAllHostelAdmissions(resAdm.data);

        const resGps = await api.get('/campus/gatepass');
        setWardenGatepasses(resGps.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHostel(false);
    }
  };

  const fetchLibraryData = async () => {
    setLoadingLibrary(true);
    try {
      if (isStudent) {
        const resC = await api.get('/library/checkouts/me');
        setCheckouts(resC.data);
      }
      if (isLibrarian) {
        const resAll = await api.get('/library/checkouts');
        setAllCheckouts(resAll.data);
        const resB = await api.get('/library/books');
        setSearchedBooks(resB.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLibrary(false);
    }
  };

  const fetchTransportData = async () => {
    setLoadingTransport(true);
    try {
      const [resStops, resRoutes] = await Promise.all([
        api.get('/transport/stops'),
        api.get('/transport/routes'),
      ]);
      setStops(resStops.data);
      setRoutes(resRoutes.data);

      if (isStudent) {
        const resRes = await api.get('/transport/reservations/me');
        setReservations(resRes.data);
      }
      if (isTransportOfficer) {
        const resAllRes = await api.get('/transport/reservations');
        setAllReservations(resAllRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTransport(false);
    }
  };

  const fetchMessData = async () => {
    try {
      const menuRes = await api.get('/mess/menu');
      setMessMenu(menuRes.data);
      if (isMessInCharge) {
        const [feedbackRes, groceryRes] = await Promise.all([
          api.get('/mess/feedback'),
          api.get('/mess/grocery'),
        ]);
        setMessFeedback(feedbackRes.data);
        setMessGrocery(groceryRes.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSportsData = async () => {
    try {
      const [eqRes, tourRes] = await Promise.all([
        api.get('/sports/equipment'),
        api.get('/sports/tournaments'),
      ]);
      setSportsEquipment(eqRes.data);
      setSportsTournaments(tourRes.data);

      if (isSportsOfficer) {
        const issueRes = await api.get('/sports/issue');
        setSportsIssueRequests(issueRes.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMaintenanceData = async () => {
    try {
      const ticketsRes = await api.get('/maintenance/tickets');
      setMaintenanceTickets(ticketsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStoreData = async () => {
    try {
      const vendingRes = await api.get('/vending/inventory');
      setVendingInventory(vendingRes.data);

      if (isPurchaseOfficer) {
        const [inventoryRes, reqsRes] = await Promise.all([
          api.get('/store/inventory'),
          api.get('/store/requisitions'),
        ]);
        setStoreInventory(inventoryRes.data);
        setStoreRequisitions(reqsRes.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- HANDLERS ---
  
  // 1. Hostel
  const handleHostelRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostelForm.acceptRules) {
      showNotification('error', 'You must accept the hostel policy and rules agreement');
      return;
    }
    
    // Contact number validation rules (exactly 10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(hostelForm.fatherContact)) {
      showNotification('error', "Father's Contact Number must be exactly 10 digits");
      return;
    }
    if (hostelForm.motherContact && !phoneRegex.test(hostelForm.motherContact)) {
      showNotification('error', "Mother's Contact Number must be exactly 10 digits");
      return;
    }
    if (hostelForm.guardianContact && !phoneRegex.test(hostelForm.guardianContact)) {
      showNotification('error', "Guardian's Contact Number must be exactly 10 digits");
      return;
    }

    try {
      await api.post('/hostel/admissions', {
        course_year: hostelForm.courseYear,
        gender: hostelForm.gender,
        policy_name: hostelForm.policyName,
        plan_name: hostelForm.planName,
        father_name: hostelForm.fatherName,
        father_contact: hostelForm.fatherContact,
        father_address: hostelForm.fatherAddress,
        mother_name: hostelForm.motherName || null,
        mother_contact: hostelForm.motherContact || null,
        mother_address: hostelForm.motherAddress || null,
        guardian_name: hostelForm.guardianName || null,
        guardian_contact: hostelForm.guardianContact || null,
        guardian_address: hostelForm.guardianAddress || null,
        vehicle_number: hostelForm.vehicleNumber || null,
        license_number: hostelForm.licenseNumber || null,
      });
      showNotification('success', 'Hostel Registration submitted successfully! Pending room allocation by Warden.');
      fetchHostelData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Hostel Registration Failed');
    }
  };

  const handleHostelOuting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostelAdmission || hostelAdmission.status !== 'APPROVED') {
      showNotification('error', 'You must have an approved Room Allocation before filing outings.');
      return;
    }
    try {
      await api.post('/campus/gatepass', {
        reason: outingForm.reason,
        out_date: outingForm.outDate,
        in_date: outingForm.inDate,
      });
      showNotification('success', 'Outing requisition filed! Signature verified by system.');
      setOutingForm({ reason: '', outDate: '', inDate: '' });
      fetchHostelData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Outing Filing Failed');
    }
  };

  const handleVerifyOuting = async (id: string) => {
    try {
      await api.post(`/campus/gatepass/${id}/verify-signature`);
      showNotification('success', 'Parent digital signature verified successfully!');
      fetchHostelData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Signature Verification Failed');
    }
  };

  const handleWardenOutingStatus = async (id: string, status: string) => {
    try {
      await api.put(`/campus/gatepass/${id}/status?status=${status}`);
      showNotification('success', `Gatepass status updated to ${status}`);
      fetchHostelData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Outing Status Update Failed');
    }
  };

  const handleWardenAllocateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocatingId) return;
    try {
      await api.put(`/hostel/admissions/${allocatingId}/allocate`, allocationForm);
      showNotification('success', 'Room allocated and 50,000 INR Fee invoice created successfully!');
      setAllocatingId(null);
      fetchHostelData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Room Allocation Failed');
    }
  };

  // 2. Library
  const handleSearchBooks = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    fetchLibraryData();
  };

  const handleCheckoutBook = async (bookId: string, studentUsername?: string) => {
    try {
      await api.post('/library/checkout', { book_id: bookId, student_username: studentUsername });
      showNotification('success', 'Book checked out successfully! Keep in mind the due date.');
      fetchLibraryData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Book Checkout Failed');
    }
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/library/books', {
        title: newBookForm.title,
        author: newBookForm.author,
        isbn: newBookForm.isbn || null,
        total_copies: newBookForm.totalCopies
      });
      showNotification('success', 'Book added to library catalog successfully!');
      setNewBookForm({ title: '', author: '', isbn: '', totalCopies: 5 });
      fetchLibraryData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Failed to add book');
    }
  };

  const handleReturnBook = async (checkoutId: string) => {
    try {
      await api.put(`/library/checkouts/${checkoutId}/return`);
      showNotification('success', 'Book marked as returned successfully!');
      fetchLibraryData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Failed to return book');
    }
  };

  // 3. Transport
  const handleTransportRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/transport/reservations', {
        pickup_stop: transportForm.pickupStop,
        pickup_route_id: transportForm.pickupRouteId,
        destination_stop: transportForm.destinationStop,
        destination_route_id: transportForm.destinationRouteId,
      });
      showNotification('success', 'Transport reservation submitted successfully! Pending seat allocation.');
      setShowAddTransportRequest(false);
      fetchTransportData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Transport Booking Failed');
    }
  };

  const handleAddStop = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/transport/stops', { name: newStopName });
      showNotification('success', `Defined new stop: ${newStopName}`);
      setNewStopName('');
      fetchTransportData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Failed to define stop');
    }
  };

  const handleAddRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const resRoute = await api.post('/transport/routes', {
        route_name: newRouteForm.route_name,
        bus_number: newRouteForm.bus_number,
        driver_name: newRouteForm.driver_name,
        capacity: newRouteForm.capacity,
      });
      
      const routeId = resRoute.data.id;
      if (selectedRouteStopIds.length > 0) {
        await api.post(`/transport/routes/${routeId}/stops`, { stop_ids: selectedRouteStopIds });
      }

      showNotification('success', `Created route: ${newRouteForm.route_name} with stops linked!`);
      setNewRouteForm({ route_name: '', bus_number: '', driver_name: '', capacity: 40 });
      setSelectedRouteStopIds([]);
      fetchTransportData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Failed to define route');
    }
  };

  const handleUpdateTransportStatus = async (id: string, status: string) => {
    try {
      await api.put(`/transport/reservations/${id}/status?status=${status}`);
      showNotification('success', `Reservation updated to ${status}`);
      fetchTransportData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Reservation Status Update Failed');
    }
  };

  // 4. Mess Handlers
  const handleUpdateMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/mess/menu/${messForm.dayOfWeek}`, {
        breakfast: messForm.breakfast,
        lunch: messForm.lunch,
        snacks: messForm.snacks,
        dinner: messForm.dinner
      });
      showNotification('success', `Updated mess menu for ${messForm.dayOfWeek}`);
      fetchMessData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Failed to update menu');
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/mess/feedback', {
        rating: feedbackForm.rating,
        review: feedbackForm.review
      });
      showNotification('success', 'Thank you! Mess feedback logged successfully.');
      setFeedbackForm({ rating: 5, review: '' });
      fetchMessData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Failed to submit feedback');
    }
  };

  const handleRestockGrocery = async (id: string) => {
    try {
      await api.post(`/mess/grocery/${id}/restock`);
      showNotification('success', 'Grocery items restocked (+100 units)');
      fetchMessData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Restock failed');
    }
  };

  // 5. Sports Handlers
  const handleRequestEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sportsForm.equipmentId) {
      showNotification('error', 'Select equipment to borrow');
      return;
    }
    try {
      await api.post('/sports/issue', {
        equipment_id: sportsForm.equipmentId,
        quantity: sportsForm.quantity
      });
      showNotification('success', 'Borrow requisition submitted to Physical Director!');
      fetchSportsData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Request failed');
    }
  };

  const handleUpdateIssueStatus = async (id: string, status: string) => {
    try {
      await api.put(`/sports/issue/${id}/status?status=${status}`);
      showNotification('success', `Borrow request updated to ${status}`);
      fetchSportsData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Status update failed');
    }
  };

  const handleRegisterTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/sports/tournaments', {
        team_name: tournamentForm.teamName,
        sport_name: tournamentForm.sportName,
        members_count: tournamentForm.membersCount
      });
      showNotification('success', 'Registered tournament team successfully!');
      setTournamentForm({ teamName: '', sportName: 'Cricket', membersCount: 11 });
      fetchSportsData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Registration failed');
    }
  };

  // 6. Maintenance Handlers
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/maintenance/tickets', {
        category: maintenanceForm.category,
        block_name: maintenanceForm.blockName,
        description: maintenanceForm.description
      });
      showNotification('success', 'Lodge maintenance ticket logged! Assigning technician.');
      setMaintenanceForm({ category: 'ELECTRIC', blockName: '', description: '' });
      fetchMaintenanceData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Lodging ticket failed');
    }
  };

  const handleAssignTicket = async (ticketId: string) => {
    const staff = assignStaffMap[ticketId];
    if (!staff) {
      showNotification('error', 'Select a technician to assign');
      return;
    }
    try {
      await api.put(`/maintenance/tickets/${ticketId}/assign?staff_name=${encodeURIComponent(staff)}`);
      showNotification('success', `Assigned ticket to ${staff}`);
      fetchMaintenanceData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Assignment failed');
    }
  };

  const handleResolveTicket = async (ticketId: string) => {
    try {
      await api.put(`/maintenance/tickets/${ticketId}/resolve`);
      showNotification('success', 'Marked repair ticket as resolved!');
      fetchMaintenanceData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Resolution failed');
    }
  };

  // 7. Store & Vending Handlers
  const handleRequestStoreItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeForm.itemId) {
      showNotification('error', 'Select central store item');
      return;
    }
    try {
      await api.post('/store/requisitions', {
        item_id: storeForm.itemId,
        quantity: storeForm.quantity
      });
      showNotification('success', 'Requisition filed with Purchase Department!');
      fetchStoreData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Requisition failed');
    }
  };

  const handleUpdateRequisitionStatus = async (id: string, status: string) => {
    try {
      await api.put(`/store/requisitions/${id}/status?status=${status}`);
      showNotification('success', `Requisition status marked as ${status}`);
      fetchStoreData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Status update failed');
    }
  };

  const handleRefillVending = async (id: string) => {
    try {
      await api.post(`/vending/${id}/refill`);
      showNotification('success', 'Refilled vending machine to capacity!');
      fetchStoreData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Refill failed');
    }
  };

  // Filters for transport admin requisitions table
  const adminReservationsFiltered = allReservations.filter(r => r.approval_status === activeTransportSubTab);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const allowedTabs = ['hostel', 'library', 'transport', 'mess', 'sports', 'maintenance', 'store'].filter(isTabVisible);

  if (user && allowedTabs.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Page Header banner */}
        <div className="bg-gradient-to-br from-blue-900 to-indigo-950 rounded-3xl p-8 text-white shadow-md shadow-indigo-900/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">MIT Campus Facilities Hub</h2>
            <p className="text-sm text-indigo-200 font-medium mt-1">Hostels, Library Circulation, Mess, Transports, Sports, Maintenance, & Central Stores</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center border border-slate-100 mx-auto">
            <ShieldAlert size={28} />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-extrabold text-slate-800">Access Permissions Required</h3>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Your profile is currently configured as a regular faculty member with no assigned operational roles. 
              Please contact the Principal or Administrator to assign you one of the following roles:
            </p>
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              {['Hostel Warden', 'Librarian', 'Transport In-Charge', 'Mess In-Charge', 'Sports Officer', 'Estate Manager', 'Purchase Officer'].map(r => (
                <span key={r} className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded border border-slate-200">{r}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg border transition-all duration-300 ${
          notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-850' : 'bg-rose-50 border-rose-200 text-rose-850'
        }`}>
          <div className={`w-2 h-2 rounded-full ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <p className="text-sm font-semibold">{notification.message}</p>
        </div>
      )}

      {/* Page Header banner */}
      <div className="bg-gradient-to-br from-blue-900 to-indigo-950 rounded-3xl p-8 text-white shadow-md shadow-indigo-900/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">MIT Campus Facilities Hub</h2>
          <p className="text-sm text-indigo-200 font-medium mt-1">Hostels, Library Circulation, Mess, Transports, Sports, Maintenance, & Central Stores</p>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Navigation Sidebar */}
        <div className="lg:w-64 flex-shrink-0 flex flex-row lg:flex-col gap-2 bg-white p-3 rounded-2xl border border-slate-200/60 shadow-sm self-start w-full overflow-x-auto whitespace-nowrap">
          {allowedTabs.includes('hostel') && (
            <button
              onClick={() => setActiveTab('hostel')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all w-full text-left ${
                activeTab === 'hostel' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Home size={16} />
              Hostel Registration
            </button>
          )}
          {allowedTabs.includes('library') && (
            <button
              onClick={() => setActiveTab('library')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all w-full text-left ${
                activeTab === 'library' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <BookIcon size={16} />
              Library Circulation
            </button>
          )}
          {allowedTabs.includes('transport') && (
            <button
              onClick={() => setActiveTab('transport')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all w-full text-left ${
                activeTab === 'transport' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Bus size={16} />
              Transport Pass
            </button>
          )}
          {allowedTabs.includes('mess') && (
            <button
              onClick={() => setActiveTab('mess')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all w-full text-left ${
                activeTab === 'mess' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Utensils size={16} />
              Mess Management
            </button>
          )}
          {allowedTabs.includes('sports') && (
            <button
              onClick={() => setActiveTab('sports')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all w-full text-left ${
                activeTab === 'sports' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Award size={16} />
              Sports Arena
            </button>
          )}
          {allowedTabs.includes('maintenance') && (
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all w-full text-left ${
                activeTab === 'maintenance' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Wrench size={16} />
              Estate Maintenance
            </button>
          )}
          {allowedTabs.includes('store') && (
            <button
              onClick={() => setActiveTab('store')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all w-full text-left ${
                activeTab === 'store' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Package size={16} />
              Store & Vending
            </button>
          )}
        </div>

        {/* Right Active Content Panel */}
        <div className="flex-1 bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm min-h-[500px]">

          {/* TAB 1: HOSTEL */}
          {activeTab === 'hostel' && (
            <div className="space-y-8">
              
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h3 className="text-xl font-bold text-slate-800">Facilities - Hostel Registration</h3>
                
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
                  <button
                    onClick={() => setActiveHostelSubTab('booking')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                      activeHostelSubTab === 'booking' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-850'
                    }`}
                  >
                    Booking allocation
                  </button>
                  <button
                    onClick={() => setActiveHostelSubTab('outing')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                      activeHostelSubTab === 'outing' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-850'
                    }`}
                  >
                    Outing Requisitions
                  </button>
                </div>
              </div>

              {activeHostelSubTab === 'booking' && (
                <div>
                  {isStudent ? (
                    // Student view for hostel allocation
                    hostelAdmission ? (
                      <div className="space-y-6">
                        <div className="max-w-xl mx-auto bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl space-y-6 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10" />
                          
                          <div className="flex justify-between items-start border-b border-white/10 pb-4">
                            <div>
                              <h4 className="text-lg font-bold tracking-tight">MIT Aurangabad Hostel Pass</h4>
                              <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider">{hostelAdmission.policy_name}</p>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                              hostelAdmission.status === 'APPROVED' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                            }`}>
                              {hostelAdmission.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs">
                            <div>
                              <span className="block text-[10px] text-indigo-300 font-semibold uppercase">Building Block</span>
                              <span className="font-extrabold text-sm text-indigo-100">{hostelAdmission.block_name}</span>
                            </div>
                            <div>
                              <span className="block text-[10px] text-indigo-300 font-semibold uppercase">Room Number</span>
                              <span className="font-extrabold text-sm text-indigo-100">{hostelAdmission.room_number}</span>
                            </div>
                            <div>
                              <span className="block text-[10px] text-indigo-300 font-semibold uppercase">Floor Name</span>
                              <span className="font-bold">{hostelAdmission.floor_name}</span>
                            </div>
                            <div>
                              <span className="block text-[10px] text-indigo-300 font-semibold uppercase">Plan Name</span>
                              <span className="font-bold">{hostelAdmission.plan_name}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Application registration form
                      <form onSubmit={handleHostelRegister} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5">Course Year *</label>
                            <input
                              type="text"
                              required
                              value={hostelForm.courseYear}
                              onChange={(e) => setHostelForm({...hostelForm, courseYear: e.target.value})}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-medium text-slate-700"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5">Gender *</label>
                            <select
                              required
                              value={hostelForm.gender}
                              onChange={(e) => setHostelForm({...hostelForm, gender: e.target.value})}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-medium text-slate-700 cursor-pointer"
                            >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </div>

                        {/* Parent Details Grid */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                          <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Parent and Guardian Details</h4>
                          <p className="text-xs text-rose-500 font-medium mb-3">Please enter all your Parent and Guardian Details.</p>
                          
                          <div className="overflow-x-auto">
                            <table className="w-full border border-slate-200 text-sm">
                              <thead>
                                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                                  <th className="p-3 border-r border-slate-200"></th>
                                  <th className="p-3 border-r border-slate-200 text-xs font-bold uppercase text-slate-500">Father Details *</th>
                                  <th className="p-3 border-r border-slate-200 text-xs font-bold uppercase text-slate-500">Mother Details *</th>
                                  <th className="p-3 text-xs font-bold uppercase text-slate-500">Guardian Details</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="border-b border-slate-200">
                                  <td className="p-3 font-bold text-slate-600 border-r border-slate-200">Name *</td>
                                  <td className="p-2 border-r border-slate-200">
                                    <input
                                      type="text"
                                      required
                                      value={hostelForm.fatherName}
                                      onChange={(e) => setHostelForm({...hostelForm, fatherName: e.target.value})}
                                      className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm"
                                      placeholder="e.g. Ramesh Sharma"
                                    />
                                  </td>
                                  <td className="p-2 border-r border-slate-200">
                                    <input
                                      type="text"
                                      required
                                      value={hostelForm.motherName}
                                      onChange={(e) => setHostelForm({...hostelForm, motherName: e.target.value})}
                                      className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm"
                                      placeholder="e.g. Sita Sharma"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={hostelForm.guardianName}
                                      onChange={(e) => setHostelForm({...hostelForm, guardianName: e.target.value})}
                                      className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm"
                                    />
                                  </td>
                                </tr>
                                <tr className="border-b border-slate-200">
                                  <td className="p-3 font-bold text-slate-600 border-r border-slate-200">Contact No. *</td>
                                  <td className="p-2 border-r border-slate-200">
                                    <input
                                      type="text"
                                      required
                                      value={hostelForm.fatherContact}
                                      onChange={(e) => setHostelForm({...hostelForm, fatherContact: e.target.value})}
                                      className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm"
                                      placeholder="e.g. 9876543210"
                                    />
                                  </td>
                                  <td className="p-2 border-r border-slate-200">
                                    <input
                                      type="text"
                                      value={hostelForm.motherContact}
                                      onChange={(e) => setHostelForm({...hostelForm, motherContact: e.target.value})}
                                      className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={hostelForm.guardianContact}
                                      onChange={(e) => setHostelForm({...hostelForm, guardianContact: e.target.value})}
                                      className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm"
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="p-3 font-bold text-slate-600 border-r border-slate-200">Address *</td>
                                  <td className="p-2 border-r border-slate-200">
                                    <input
                                      type="text"
                                      required
                                      value={hostelForm.fatherAddress}
                                      onChange={(e) => setHostelForm({...hostelForm, fatherAddress: e.target.value})}
                                      className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm"
                                      placeholder="e.g. Pune"
                                    />
                                  </td>
                                  <td className="p-2 border-r border-slate-200">
                                    <input
                                      type="text"
                                      value={hostelForm.motherAddress}
                                      onChange={(e) => setHostelForm({...hostelForm, motherAddress: e.target.value})}
                                      className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={hostelForm.guardianAddress}
                                      onChange={(e) => setHostelForm({...hostelForm, guardianAddress: e.target.value})}
                                      className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm"
                                    />
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Other History */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                          <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Other Details (Optional)</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1.5">Vehicle Number</label>
                              <input
                                type="text"
                                value={hostelForm.vehicleNumber}
                                onChange={(e) => setHostelForm({...hostelForm, vehicleNumber: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-medium text-slate-700"
                                placeholder="e.g. MH-20-EG-4567"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1.5">Driving License Number</label>
                              <input
                                type="text"
                                value={hostelForm.licenseNumber}
                                onChange={(e) => setHostelForm({...hostelForm, licenseNumber: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-medium text-slate-700"
                                placeholder="e.g. DL-12345678901"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Accept rules */}
                        <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/50">
                          <input
                            type="checkbox"
                            id="acceptRules"
                            required
                            checked={hostelForm.acceptRules}
                            onChange={(e) => setHostelForm({...hostelForm, acceptRules: e.target.checked})}
                            className="mt-0.5"
                          />
                          <label htmlFor="acceptRules" className="text-xs text-slate-600 font-medium cursor-pointer">
                            I hereby declare that the information provided is correct. I agree to abide by the **Hostel Rules, Conduct, and Discipline Policies** of Maharashtra Institute of Technology, Chhatrapati Sambhajinagar.
                          </label>
                        </div>

                        <button
                          type="submit"
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md text-sm"
                        >
                          Register Hostel
                        </button>
                      </form>
                    )
                  ) : (
                    // Warden/Admin view for room allocation workbench
                    <div className="space-y-6">
                      <div className="border-b border-slate-100 pb-2">
                        <h4 className="text-base font-bold text-slate-800">Student Hostel Allocation Workbench</h4>
                      </div>

                      {allocatingId && (
                        <form onSubmit={handleWardenAllocateRoom} className="bg-blue-50/50 p-5 rounded-2xl border border-blue-200/60 max-w-xl space-y-4">
                          <h5 className="text-sm font-bold text-blue-800">Allocate Hostel Room & Generate Invoice</h5>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">Building Block</label>
                              <select
                                value={allocationForm.block_name}
                                onChange={(e) => setAllocationForm({...allocationForm, block_name: e.target.value})}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                              >
                                <option value="Aryabhata Block A">Aryabhata Block A</option>
                                <option value="Bhaskara Block B">Bhaskara Block B</option>
                                <option value="Chanakya Block C">Chanakya Block C</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">Floor</label>
                              <select
                                value={allocationForm.floor_name}
                                onChange={(e) => setAllocationForm({...allocationForm, floor_name: e.target.value})}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                              >
                                <option value="Floor 1">Floor 1</option>
                                <option value="Floor 2">Floor 2</option>
                                <option value="Floor 3">Floor 3</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">Room Number</label>
                              <input
                                type="text"
                                required
                                value={allocationForm.room_number}
                                onChange={(e) => setAllocationForm({...allocationForm, room_number: e.target.value})}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button type="submit" className="bg-blue-600 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-md">
                              Confirm Allocation
                            </button>
                            <button type="button" onClick={() => setAllocatingId(null)} className="bg-slate-200 text-slate-700 font-bold text-xs py-2 px-4 rounded-xl">
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}

                      <div className="overflow-x-auto bg-white border border-slate-200 rounded-2xl shadow-sm">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                          <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase">
                              <th className="p-4">Student</th>
                              <th className="p-4">Gender</th>
                              <th className="p-4">Father details</th>
                              <th className="p-4">Mother details</th>
                              <th className="p-4">License</th>
                              <th className="p-4">Building</th>
                              <th className="p-4">Room</th>
                              <th className="p-4">Status</th>
                              <th className="p-4">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-sm">
                            {allHostelAdmissions.length === 0 ? (
                              <tr>
                                <td colSpan={9} className="p-8 text-center text-slate-400 font-semibold">No Hostel Registrations Found.</td>
                              </tr>
                            ) : (
                              allHostelAdmissions.map((adm) => (
                                <tr key={adm.id} className="hover:bg-slate-50/50">
                                  <td className="p-4 font-bold text-slate-700">
                                    {adm.student?.first_name} {adm.student?.last_name}
                                    <span className="block text-[10px] text-slate-400 font-medium uppercase">{adm.student?.username}</span>
                                  </td>
                                  <td className="p-4 text-xs font-bold text-slate-500">{adm.gender}</td>
                                  <td className="p-4 text-xs text-slate-600 font-medium">
                                    <span className="block font-bold">{adm.father_name}</span>
                                    <span className="block text-[10px]">{adm.father_contact}</span>
                                  </td>
                                  <td className="p-4 text-xs text-slate-600 font-medium">
                                    <span className="block font-bold">{adm.mother_name}</span>
                                    <span className="block text-[10px]">{adm.mother_contact}</span>
                                  </td>
                                  <td className="p-4 text-xs font-mono text-slate-500">{adm.license_number || 'N/A'}</td>
                                  <td className="p-4 text-xs font-bold text-indigo-600">{adm.block_name}</td>
                                  <td className="p-4 text-xs font-bold text-slate-700">{adm.room_number}</td>
                                  <td className="p-4 text-xs font-extrabold uppercase">
                                    <span className={`px-2 py-0.5 rounded ${adm.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                      {adm.status}
                                    </span>
                                  </td>
                                  <td className="p-4">
                                    {adm.status === 'PENDING' && (
                                      <button
                                        onClick={() => {
                                          setAllocatingId(adm.id);
                                          setAllocationForm({
                                            block_name: 'Aryabhata Block A',
                                            floor_name: 'Floor 1',
                                            room_number: 'Room 101'
                                          });
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold py-1 px-2.5 rounded-lg shadow-sm"
                                      >
                                        Allocate Room
                                      </button>
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

              {activeHostelSubTab === 'outing' && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  {isStudent && (
                    <form onSubmit={handleHostelOuting} className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200/50 self-start">
                      <h4 className="text-base font-bold text-slate-800">File Night-Out Leave Requisition</h4>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Outing Reason</label>
                        <textarea
                          required
                          value={outingForm.reason}
                          onChange={(e) => setOutingForm({...outingForm, reason: e.target.value})}
                          placeholder="State detailed reason for leaving campus overnight..."
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm h-24"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Leaving Campus (Date/Time)</label>
                        <input
                          type="datetime-local"
                          required
                          value={outingForm.outDate}
                          onChange={(e) => setOutingForm({...outingForm, outDate: e.target.value})}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Expected Return (Date/Time)</label>
                        <input
                          type="datetime-local"
                          required
                          value={outingForm.inDate}
                          onChange={(e) => setOutingForm({...outingForm, inDate: e.target.value})}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm"
                        />
                      </div>
                      <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl shadow-md w-full">
                        File Outing Request
                      </button>
                    </form>
                  )}

                  <div className="xl:col-span-2 space-y-4">
                    <h4 className="text-base font-bold text-slate-800">Leave / Gatepass Ledgers</h4>
                    <div className="overflow-x-auto bg-white border border-slate-200 rounded-2xl shadow-sm">
                      <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase">
                            <th className="p-4">Reason</th>
                            <th className="p-4">Dates</th>
                            <th className="p-4">Consent Status</th>
                            <th className="p-4">Gatepass Status</th>
                            <th className="p-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {isStudent ? (
                            gatepasses.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-400 font-semibold">No gatepasses requested yet.</td>
                              </tr>
                            ) : (
                              gatepasses.map((gp) => (
                                <tr key={gp.id} className="hover:bg-slate-50/50">
                                  <td className="p-4 font-semibold text-slate-700">{gp.reason}</td>
                                  <td className="p-4 text-xs font-medium text-slate-500">
                                    <span className="block font-bold">Out: {gp.out_date}</span>
                                    <span className="block font-bold text-indigo-500">In: {gp.in_date}</span>
                                  </td>
                                  <td className="p-4 text-xs font-extrabold uppercase">
                                    <span className={`px-2 py-0.5 rounded ${gp.signature_verified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                      {gp.signature_verified ? 'Parent Approved' : 'Pending Verification'}
                                    </span>
                                  </td>
                                  <td className="p-4 text-xs font-extrabold uppercase">
                                    <span className={`px-2 py-0.5 rounded ${
                                      gp.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' :
                                      gp.status === 'REJECTED' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                                    }`}>
                                      {gp.status}
                                    </span>
                                  </td>
                                  <td className="p-4">
                                    {!gp.signature_verified && (
                                      <button
                                        onClick={() => handleVerifyOuting(gp.id)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-extrabold py-1 px-2.5 rounded-lg shadow-sm"
                                      >
                                        Verify parent SMS OTP
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))
                            )
                          ) : (
                            wardenGatepasses.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-400 font-semibold">No student gatepass requests pending.</td>
                              </tr>
                            ) : (
                              wardenGatepasses.map((gp) => (
                                <tr key={gp.id} className="hover:bg-slate-50/50">
                                  <td className="p-4 font-bold text-slate-700">
                                    {gp.student?.first_name} {gp.student?.last_name}
                                    <span className="block text-xs font-semibold text-slate-400 uppercase">{gp.reason}</span>
                                  </td>
                                  <td className="p-4 text-xs font-medium text-slate-500">
                                    <span className="block font-bold">Out: {gp.out_date}</span>
                                    <span className="block font-bold">In: {gp.in_date}</span>
                                  </td>
                                  <td className="p-4 text-xs font-extrabold uppercase">
                                    <span className={`px-2 py-0.5 rounded ${gp.signature_verified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                      {gp.signature_verified ? 'Approved by Parent' : 'Pending verification'}
                                    </span>
                                  </td>
                                  <td className="p-4 text-xs font-extrabold uppercase">
                                    <span className={`px-2 py-0.5 rounded ${
                                      gp.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' :
                                      gp.status === 'REJECTED' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                                    }`}>
                                      {gp.status}
                                    </span>
                                  </td>
                                  <td className="p-4 flex gap-2">
                                    {gp.status === 'PENDING' && (
                                      <>
                                        <button
                                          onClick={() => handleWardenOutingStatus(gp.id, 'APPROVED')}
                                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold py-1 px-2 rounded-lg"
                                        >
                                          Approve
                                        </button>
                                        <button
                                          onClick={() => handleWardenOutingStatus(gp.id, 'REJECTED')}
                                          className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-extrabold py-1 px-2 rounded-lg"
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
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LIBRARY */}
          {activeTab === 'library' && (
            <div className="space-y-8">
              <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">Facilities - Library Catalog & Circulation</h3>
              </div>

              {/* Student active checkouts */}
              {isStudent && (
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

              {/* Librarian Management Workbench */}
              {isLibrarian && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Add book form */}
                  <form onSubmit={handleAddBook} className="bg-slate-50 p-5 rounded-2xl border border-slate-200/50 space-y-4 self-start">
                    <h4 className="text-base font-bold text-slate-800">Add Book to Library Catalog</h4>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Book Title *</label>
                      <input
                        type="text"
                        required
                        value={newBookForm.title}
                        onChange={(e) => setNewBookForm({...newBookForm, title: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm"
                        placeholder="e.g. Introduction to Algorithms"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Author Name *</label>
                      <input
                        type="text"
                        required
                        value={newBookForm.author}
                        onChange={(e) => setNewBookForm({...newBookForm, author: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm"
                        placeholder="e.g. Thomas H. Cormen"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">ISBN Reference</label>
                      <input
                        type="text"
                        value={newBookForm.isbn}
                        onChange={(e) => setNewBookForm({...newBookForm, isbn: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm"
                        placeholder="e.g. 978-0262033848"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Total Copies *</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={newBookForm.totalCopies}
                        onChange={(e) => setNewBookForm({...newBookForm, totalCopies: parseInt(e.target.value)})}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm"
                      />
                    </div>
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-md w-full">
                      Add Book
                    </button>
                  </form>

                  {/* Campus circulation table */}
                  <div className="lg:col-span-2 space-y-4">
                    <h4 className="text-base font-bold text-slate-800">Active Book Circulations</h4>
                    <div className="overflow-x-auto bg-white border border-slate-200 rounded-2xl shadow-sm">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase">
                            <th className="p-3">Student</th>
                            <th className="p-3">Book details</th>
                            <th className="p-3">Due Date</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {allCheckouts.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-slate-400 font-semibold">No books checked out currently.</td>
                            </tr>
                          ) : (
                            allCheckouts.map((c) => (
                              <tr key={c.id}>
                                <td className="p-3 font-bold text-slate-700">
                                  {c.student?.first_name} {c.student?.last_name}
                                  <span className="block text-[10px] text-slate-400 uppercase">{c.student?.username}</span>
                                </td>
                                <td className="p-3 text-xs">
                                  <span className="block font-bold text-slate-600">{c.book?.title}</span>
                                  <span className="block text-slate-400">by {c.book?.author}</span>
                                </td>
                                <td className="p-3 text-xs font-mono text-slate-500">{c.due_date.split('T')[0]}</td>
                                <td className="p-3 text-xs font-extrabold uppercase">
                                  <span className={`px-2 py-0.5 rounded ${c.status === 'RETURNED' ? 'bg-slate-50 text-slate-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                    {c.status}
                                  </span>
                                </td>
                                <td className="p-3">
                                  {c.status !== 'RETURNED' && (
                                    <button
                                      onClick={() => handleReturnBook(c.id)}
                                      className="bg-emerald-600 text-white font-bold text-[10px] py-1 px-2.5 rounded-lg shadow-sm"
                                    >
                                      Mark Returned
                                    </button>
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

              {/* Book inquiry & Catalog Search */}
              {isLibrarian && (
                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <h4 className="text-base font-bold text-slate-800">Search Library Catalog</h4>
                  <form onSubmit={handleSearchBooks} className="flex gap-3 max-w-lg">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by title, author, or ISBN..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500 font-semibold"
                    />
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-xl shadow-md text-xs">
                      Search
                    </button>
                  </form>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {searchedBooks.map((book) => (
                      <div key={book.id} className="border border-slate-200 p-4 rounded-2xl flex justify-between items-center bg-white shadow-sm hover:shadow transition-shadow">
                        <div className="flex-1">
                          <h5 className="text-sm font-bold text-slate-850">{book.title}</h5>
                          <p className="text-xs text-slate-500 font-semibold">Author: {book.author}</p>
                          <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold ${book.available_copies > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            {book.available_copies} of {book.total_copies} copies available
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-2 ml-4">
                          <input
                            type="text"
                            placeholder="Student Username"
                            value={checkoutUsernames[book.id] || ''}
                            onChange={(e) => setCheckoutUsernames({...checkoutUsernames, [book.id]: e.target.value})}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs w-32 focus:outline-none focus:border-blue-500"
                          />
                          <button
                            disabled={book.available_copies <= 0 || !checkoutUsernames[book.id]}
                            onClick={() => {
                              handleCheckoutBook(book.id, checkoutUsernames[book.id]);
                              setCheckoutUsernames({...checkoutUsernames, [book.id]: ''});
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all w-full ${
                              book.available_copies > 0 && checkoutUsernames[book.id]
                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            Checkout to Student
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TRANSPORT */}
          {activeTab === 'transport' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h3 className="text-xl font-bold text-slate-800">Facilities - Student Transport Requisition</h3>
                {isStudent && !showAddTransportRequest && (
                  <button
                    onClick={() => {
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
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-5 rounded-xl font-bold shadow-md text-xs transition-all"
                  >
                    File Requisition
                  </button>
                )}
              </div>

              {showAddTransportRequest ? (
                // Transport booking requisition form
                <form onSubmit={handleTransportRegister} className="space-y-6 max-w-xl">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Pick Up Stop Name *</label>
                    <select
                      value={transportForm.pickupStop}
                      onChange={(e) => setTransportForm({...transportForm, pickupStop: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700"
                    >
                      {stops.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Pick Up Route *</label>
                    <select
                      value={transportForm.pickupRouteId}
                      onChange={(e) => setTransportForm({...transportForm, pickupRouteId: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700"
                    >
                      {routes.map(r => <option key={r.id} value={r.id}>{r.route_name} ({r.bus_number})</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">Drop Stop *</label>
                      <select
                        value={transportForm.destinationStop}
                        onChange={(e) => setTransportForm({...transportForm, destinationStop: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700"
                      >
                        {stops.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">Drop Route *</label>
                      <select
                        value={transportForm.destinationRouteId}
                        onChange={(e) => setTransportForm({...transportForm, destinationRouteId: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700"
                      >
                        {routes.map(r => <option key={r.id} value={r.id}>{r.route_name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md text-sm">
                      Submit Requisition
                    </button>
                    <button type="button" onClick={() => setShowAddTransportRequest(false)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2.5 px-6 rounded-xl transition-all text-sm">
                      Cancel
                    </button>
                  </div>
                </form>
              ) : role === 'STUDENT' ? (
                // Student Transport Pass Dashboard Card
                <div className="space-y-6">
                  {reservations.length === 0 ? (
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/50 text-center space-y-3">
                      <p className="text-sm font-semibold text-slate-400">You do not have any active transport requisitions at this time.</p>
                      <button
                        onClick={() => {
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
                        File Requisition
                      </button>
                    </div>
                  ) : (
                    <div className="max-w-xl mx-auto bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-6 shadow-xl space-y-6 relative overflow-hidden">
                      {/* Decorative elements */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10" />
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl -ml-8 -mb-8" />
                      
                      <div className="flex justify-between items-start border-b border-white/10 pb-4">
                        <div>
                          <h4 className="text-lg font-bold tracking-tight">MIT Aurangabad</h4>
                          <p className="text-[10px] text-blue-100 font-bold uppercase tracking-wider">Student Bus Transport Pass</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          reservations[0].approval_status === 'APPROVED' ? 'bg-emerald-500 text-white shadow animate-pulse' : 'bg-amber-500 text-white shadow'
                        }`}>
                          {reservations[0].approval_status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs">
                        <div>
                          <span className="block text-[10px] text-blue-200 font-semibold uppercase">Student Name</span>
                          <span className="font-bold text-sm">{user?.first_name} {user?.last_name}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-blue-200 font-semibold uppercase">Roll Number</span>
                          <span className="font-bold text-sm">{user?.username?.toUpperCase()}</span>
                        </div>
                        
                        <div>
                          <span className="block text-[10px] text-blue-200 font-semibold uppercase">Pick Up Stop</span>
                          <span className="font-bold">{reservations[0].pickup_stop}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-blue-200 font-semibold uppercase">Pick Up Route</span>
                          <span className="font-bold truncate block max-w-[180px]">{reservations[0].pickup_route?.route_name || 'N/A'}</span>
                        </div>

                        <div>
                          <span className="block text-[10px] text-blue-200 font-semibold uppercase">Drop Stop</span>
                          <span className="font-bold">{reservations[0].destination_stop}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-blue-200 font-semibold uppercase">Drop Route</span>
                          <span className="font-bold truncate block max-w-[180px]">{reservations[0].destination_route?.route_name || 'N/A'}</span>
                        </div>

                        <div>
                          <span className="block text-[10px] text-blue-200 font-semibold uppercase">Assigned Bus</span>
                          <span className="font-extrabold text-blue-100">{reservations[0].vehicle_no || 'NA'}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-blue-200 font-semibold uppercase">Seat Number</span>
                          <span className="font-extrabold text-blue-100">{reservations[0].seat_number || 'NA'}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t border-white/10 text-xs font-semibold">
                        <div>
                          <span>Fee: <span className="font-bold text-sm">{reservations[0].fee_amount} INR</span></span>
                        </div>
                        <div>
                          <span>Paid: <span className={`font-bold uppercase ${reservations[0].is_paid ? 'text-emerald-300' : 'text-amber-300'}`}>{reservations[0].is_paid ? 'Yes' : 'No'}</span></span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Active Table of requisitions with status sub-tabs for Admins/Faculty
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
                          <th className="p-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {adminReservationsFiltered.length === 0 ? (
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
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-5 rounded-xl shadow-md">
                          Define Stop
                        </button>
                      </form>

                      {/* Define New Route */}
                      <form onSubmit={handleAddRoute} className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200/50">
                        <h4 className="text-base font-bold text-slate-800">Define New Route & Link Stops</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Route Name</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Cidco To Campus"
                              value={newRouteForm.route_name}
                              onChange={(e) => setNewRouteForm({...newRouteForm, route_name: e.target.value})}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Bus License No</label>
                            <input
                              type="text"
                              required
                              placeholder="MH-20-EF-9999"
                              value={newRouteForm.bus_number}
                              onChange={(e) => setNewRouteForm({...newRouteForm, bus_number: e.target.value})}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Driver Name</label>
                            <input
                              type="text"
                              required
                              placeholder="Ramesh Kumar"
                              value={newRouteForm.driver_name}
                              onChange={(e) => setNewRouteForm({...newRouteForm, driver_name: e.target.value})}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Capacity</label>
                            <input
                              type="number"
                              required
                              value={newRouteForm.capacity}
                              onChange={(e) => setNewRouteForm({...newRouteForm, capacity: parseInt(e.target.value)})}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold"
                            />
                          </div>
                        </div>

                        {/* Linked stops multiselect */}
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5">Select Route Stops</label>
                          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto bg-white p-3 rounded-xl border border-slate-200">
                            {stops.map(s => {
                              const checked = selectedRouteStopIds.includes(s.id);
                              return (
                                <label key={s.id} className="flex items-center gap-2 text-xs text-slate-600 font-semibold cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => {
                                      if (checked) {
                                        setSelectedRouteStopIds(selectedRouteStopIds.filter(id => id !== s.id));
                                      } else {
                                        setSelectedRouteStopIds([...selectedRouteStopIds, s.id]);
                                      }
                                    }}
                                  />
                                  {s.name}
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-5 rounded-xl shadow-md">
                          Define Route
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MESS */}
          {activeTab === 'mess' && (
            <div className="space-y-8">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-xl font-bold text-slate-800">Facilities - Campus Mess Management</h3>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left block - menu list */}
                <div className="xl:col-span-2 space-y-6">
                  <h4 className="text-base font-bold text-slate-800">Weekly Food Menu Plan</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {messMenu.map((m) => (
                      <div key={m.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-200/50 space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                          <h5 className="font-extrabold text-blue-600 text-sm">{m.day_of_week}</h5>
                        </div>
                        <div className="space-y-1 text-xs">
                          <p className="text-slate-600"><span className="font-bold text-slate-800">Breakfast:</span> {m.breakfast}</p>
                          <p className="text-slate-600"><span className="font-bold text-slate-800">Lunch:</span> {m.lunch}</p>
                          <p className="text-slate-600"><span className="font-bold text-slate-800">Snacks:</span> {m.snacks}</p>
                          <p className="text-slate-600"><span className="font-bold text-slate-800">Dinner:</span> {m.dinner}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right block - contextual forms */}
                <div className="space-y-6">
                  {isStudent && (
                    <form onSubmit={handleSubmitFeedback} className="bg-slate-50 p-5 rounded-2xl border border-slate-200/50 space-y-4">
                      <h4 className="text-base font-bold text-slate-800">Rate & Review Today's Meals</h4>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Food Rating (1-5 Stars)</label>
                        <select
                          value={feedbackForm.rating}
                          onChange={(e) => setFeedbackForm({...feedbackForm, rating: parseInt(e.target.value)})}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700"
                        >
                          <option value="5">⭐⭐⭐⭐⭐ (Excellent)</option>
                          <option value="4">⭐⭐⭐⭐ (Good)</option>
                          <option value="3">⭐⭐⭐ (Average)</option>
                          <option value="2">⭐⭐ (Poor)</option>
                          <option value="1">⭐ (Unacceptable)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Review Remarks</label>
                        <textarea
                          value={feedbackForm.review}
                          onChange={(e) => setFeedbackForm({...feedbackForm, review: e.target.value})}
                          placeholder="Provide feedback on food taste, hygiene, or quantity..."
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm h-24"
                        />
                      </div>
                      <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl shadow-md w-full">
                        Submit Feedback
                      </button>
                    </form>
                  )}

                  {isMessInCharge && (
                    <div className="space-y-6">
                      {/* Update menu form */}
                      <form onSubmit={handleUpdateMenu} className="bg-slate-50 p-5 rounded-2xl border border-slate-200/50 space-y-4">
                        <h4 className="text-base font-bold text-slate-800">Edit Daily Food Menu</h4>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Select Day</label>
                          <select
                            value={messForm.dayOfWeek}
                            onChange={(e) => setMessForm({...messForm, dayOfWeek: e.target.value})}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                          >
                            {days.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Breakfast Menu</label>
                          <input
                            type="text"
                            required
                            value={messForm.breakfast}
                            onChange={(e) => setMessForm({...messForm, breakfast: e.target.value})}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Lunch Menu</label>
                          <input
                            type="text"
                            required
                            value={messForm.lunch}
                            onChange={(e) => setMessForm({...messForm, lunch: e.target.value})}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Snacks Menu</label>
                          <input
                            type="text"
                            required
                            value={messForm.snacks}
                            onChange={(e) => setMessForm({...messForm, snacks: e.target.value})}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Dinner Menu</label>
                          <input
                            type="text"
                            required
                            value={messForm.dinner}
                            onChange={(e) => setMessForm({...messForm, dinner: e.target.value})}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                          />
                        </div>
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-md w-full">
                          Update Daily Menu
                        </button>
                      </form>

                      {/* Grocery inventory table */}
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/50 space-y-4">
                        <h4 className="text-base font-bold text-slate-800">Kitchen Grocery Stock Levels</h4>
                        <div className="space-y-3">
                          {messGrocery.map((item) => {
                            const isLow = item.current_stock < item.min_stock;
                            return (
                              <div key={item.id} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                                <div>
                                  <span className="block font-bold text-xs text-slate-700">{item.item_name}</span>
                                  <span className="text-[10px] text-slate-400 font-semibold">Min Threshold: {item.min_stock} {item.unit}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-extrabold px-2 py-0.5 rounded ${
                                    isLow ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-emerald-50 text-emerald-600'
                                  }`}>
                                    {item.current_stock} {item.unit}
                                  </span>
                                  {isLow && (
                                    <button
                                      onClick={() => handleRestockGrocery(item.id)}
                                      className="bg-blue-600 text-white text-[10px] font-bold p-1 rounded-lg hover:bg-blue-700"
                                      title="Restock Stock"
                                    >
                                      Refill
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Feedback reviews log */}
              {isMessInCharge && (
                <div className="pt-6 border-t border-slate-100 space-y-4">
                  <h4 className="text-base font-bold text-slate-800">Student Reviews & Ratings Logs</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {messFeedback.length === 0 ? (
                      <p className="text-sm font-semibold text-slate-400">No food reviews logged yet.</p>
                    ) : (
                      messFeedback.map((fb) => (
                        <div key={fb.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-bold text-slate-700">{fb.student?.first_name} {fb.student?.last_name}</span>
                              <span className="text-xs text-amber-500 font-bold">{"⭐".repeat(fb.rating)}</span>
                            </div>
                            <p className="text-xs text-slate-600 font-semibold italic">"{fb.review || 'No written comments.'}"</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SPORTS */}
          {activeTab === 'sports' && (
            <div className="space-y-8">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-xl font-bold text-slate-800">Facilities - Campus Sports & Tournament Registrar</h3>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left panel - equipment list */}
                <div className="xl:col-span-2 space-y-6">
                  <h4 className="text-base font-bold text-slate-800">Sports Gear Inventory Catalog</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {sportsEquipment.map((eq) => (
                      <div key={eq.id} className="border border-slate-200/80 p-4 rounded-xl bg-slate-50/50 flex justify-between items-center shadow-sm">
                        <div>
                          <h5 className="font-bold text-sm text-slate-700">{eq.name}</h5>
                          <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold ${
                            eq.available_qty > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                          }`}>
                            {eq.available_qty} of {eq.total_qty} units available
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Registered Tournament Teams */}
                  <div className="pt-6 border-t border-slate-100 space-y-4">
                    <h4 className="text-base font-bold text-slate-800">Inter-College Tournament Team Registrations</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {sportsTournaments.length === 0 ? (
                        <p className="text-sm font-semibold text-slate-400">No teams registered yet.</p>
                      ) : (
                        sportsTournaments.map((team) => (
                          <div key={team.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                            <div>
                              <h5 className="font-extrabold text-slate-800 text-sm">{team.team_name}</h5>
                              <p className="text-xs text-indigo-600 font-bold">{team.sport_name}</p>
                              <p className="text-[10px] text-slate-400 font-semibold">Registered by: {team.registered_by?.first_name} ({team.registered_by?.username})</p>
                            </div>
                            <span className="bg-blue-50 text-blue-600 text-xs font-extrabold px-3 py-1 rounded-xl border border-blue-100">
                              {team.members_count} Players
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Right panel - forms */}
                <div className="space-y-6">
                  {isStudent && (
                    <>
                      {/* Equipment request form */}
                      <form onSubmit={handleRequestEquipment} className="bg-slate-50 p-5 rounded-2xl border border-slate-200/50 space-y-4">
                        <h4 className="text-base font-bold text-slate-800">Borrow Sports Equipment</h4>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Select Equipment</label>
                          <select
                            value={sportsForm.equipmentId}
                            onChange={(e) => setSportsForm({...sportsForm, equipmentId: e.target.value})}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                          >
                            <option value="">-- Choose Gear --</option>
                            {sportsEquipment.map(e => <option key={e.id} value={e.id}>{e.name} (Qty: {e.available_qty})</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            required
                            value={sportsForm.quantity}
                            onChange={(e) => setSportsForm({...sportsForm, quantity: parseInt(e.target.value)})}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                          />
                        </div>
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl shadow-md w-full">
                          Submit Request
                        </button>
                      </form>

                      {/* Tournament registration form */}
                      <form onSubmit={handleRegisterTournament} className="bg-slate-50 p-5 rounded-2xl border border-slate-200/50 space-y-4">
                        <h4 className="text-base font-bold text-slate-800">Register Tournament Team</h4>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Team Name *</label>
                          <input
                            type="text"
                            required
                            value={tournamentForm.teamName}
                            onChange={(e) => setTournamentForm({...tournamentForm, teamName: e.target.value})}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                            placeholder="e.g. MIT Avengers Cricket XI"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Sport Discipline</label>
                          <select
                            value={tournamentForm.sportName}
                            onChange={(e) => setTournamentForm({...tournamentForm, sportName: e.target.value})}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                          >
                            <option value="Cricket">Cricket</option>
                            <option value="Football">Football</option>
                            <option value="Basketball">Basketball</option>
                            <option value="Badminton">Badminton</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Player Count *</label>
                          <input
                            type="number"
                            min="1"
                            required
                            value={tournamentForm.membersCount}
                            onChange={(e) => setTournamentForm({...tournamentForm, membersCount: parseInt(e.target.value)})}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                          />
                        </div>
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl shadow-md w-full">
                          Register Team
                        </button>
                      </form>
                    </>
                  )}

                  {isSportsOfficer && (
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/50 space-y-4">
                      <h4 className="text-base font-bold text-slate-800 font-extrabold">Active Gear borrow Ledger</h4>
                      <div className="space-y-3">
                        {sportsIssueRequests.map((req) => (
                          <div key={req.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-2">
                            <div className="flex justify-between items-start text-xs font-bold">
                              <div>
                                <span className="block text-slate-750">{req.student?.first_name} {req.student?.last_name}</span>
                                <span className="block text-[10px] text-slate-400 uppercase">{req.student?.username}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                req.status === 'PENDING' ? 'bg-amber-50 text-amber-600' :
                                req.status === 'APPROVED' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-505'
                              }`}>
                                {req.status}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-semibold border-t border-slate-100 pt-1.5 flex justify-between items-center">
                              <span>Gear: <span className="font-extrabold text-slate-700">{req.equipment?.name} (x{req.quantity})</span></span>
                              <div className="flex gap-1.5">
                                {req.status === 'PENDING' && (
                                  <button
                                    onClick={() => handleUpdateIssueStatus(req.id, 'APPROVED')}
                                    className="bg-emerald-600 text-white p-1 rounded font-extrabold"
                                  >
                                    Approve
                                  </button>
                                )}
                                {req.status === 'APPROVED' && (
                                  <button
                                    onClick={() => handleUpdateIssueStatus(req.id, 'RETURNED')}
                                    className="bg-slate-700 text-white p-1 rounded font-extrabold"
                                  >
                                    Returned
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: MAINTENANCE */}
          {activeTab === 'maintenance' && (
            <div className="space-y-8">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-xl font-bold text-slate-800">Facilities - Estate & Maintenance Repair Center</h3>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left panel - create ticket */}
                <form onSubmit={handleCreateTicket} className="bg-slate-50 p-5 rounded-2xl border border-slate-200/50 space-y-4 self-start">
                  <h4 className="text-base font-bold text-slate-800">Lodge Infrastructure Maintenance Request</h4>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Issue Category</label>
                    <select
                      value={maintenanceForm.category}
                      onChange={(e) => setMaintenanceForm({...maintenanceForm, category: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-705"
                    >
                      <option value="ELECTRIC">Electrical Repairs</option>
                      <option value="PLUMBING">Plumbing & Water Supplies</option>
                      <option value="HVAC">AC/Heating Systems</option>
                      <option value="CARPENTRY">Furniture / Carpentry</option>
                      <option value="OTHER">Other Repair Requests</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Building/Block location *</label>
                    <input
                      type="text"
                      required
                      value={maintenanceForm.blockName}
                      onChange={(e) => setMaintenanceForm({...maintenanceForm, blockName: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                      placeholder="e.g. Block A, Floor 2, Room 204"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Description of Issue *</label>
                    <textarea
                      required
                      value={maintenanceForm.description}
                      onChange={(e) => setMaintenanceForm({...maintenanceForm, description: e.target.value})}
                      placeholder="Describe the complaint in detail..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs h-24"
                    />
                  </div>
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl shadow-md w-full">
                    Lodge Repair Request
                  </button>
                </form>

                {/* Right panel - master logs */}
                <div className="xl:col-span-2 space-y-4">
                  <h4 className="text-base font-bold text-slate-800">Campus Maintenance Tickets Log</h4>
                  <div className="overflow-x-auto bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase">
                          <th className="p-3">Location</th>
                          <th className="p-3">Issue details</th>
                          <th className="p-3">Technician Assignment</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {maintenanceTickets.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400 font-semibold">No maintenance tickets logged yet.</td>
                          </tr>
                        ) : (
                          maintenanceTickets.map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-bold text-slate-700">
                                {t.block_name}
                                <span className="block text-[10px] text-slate-400 uppercase">{t.category}</span>
                              </td>
                              <td className="p-3 text-xs font-medium text-slate-505">{t.description}</td>
                              <td className="p-3 text-xs">
                                <span className="font-extrabold text-blue-600">{t.assigned_to_staff || 'Unassigned'}</span>
                              </td>
                              <td className="p-3 text-xs font-extrabold uppercase">
                                <span className={`px-2 py-0.5 rounded ${
                                  t.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600' :
                                  t.status === 'ASSIGNED' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                                }`}>
                                  {t.status}
                                </span>
                              </td>
                              <td className="p-3">
                                {isEstateManager ? (
                                  t.status === 'PENDING' ? (
                                    <div className="flex gap-2">
                                      <select
                                        value={assignStaffMap[t.id] || ''}
                                        onChange={(e) => setAssignStaffMap({...assignStaffMap, [t.id]: e.target.value})}
                                        className="bg-slate-100 border border-slate-200 rounded px-2 py-1 text-xs"
                                      >
                                        <option value="">-- Assign --</option>
                                        <option value="Electrician Ramesh">Electrician Ramesh</option>
                                        <option value="Plumber Santosh">Plumber Santosh</option>
                                        <option value="Carpenter Nilesh">Carpenter Nilesh</option>
                                      </select>
                                      <button
                                        onClick={() => handleAssignTicket(t.id)}
                                        className="bg-blue-600 text-white text-[10px] font-bold py-1 px-2.5 rounded hover:bg-blue-700"
                                      >
                                        Go
                                      </button>
                                    </div>
                                  ) : t.status === 'ASSIGNED' ? (
                                    <button
                                      onClick={() => handleResolveTicket(t.id)}
                                      className="bg-emerald-600 text-white text-[10px] font-bold py-1 px-2.5 rounded hover:bg-emerald-705 shadow-sm"
                                    >
                                      Resolve Ticket
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                                      <CheckCircle size={12} /> Resolved
                                    </span>
                                  )
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic">No action allowed</span>
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
            </div>
          )}

          {/* TAB 7: STORE & VENDING */}
          {activeTab === 'store' && (
            <div className="space-y-8">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-xl font-bold text-slate-800">Facilities - Central Stores & Vending Machines Dashboard</h3>
              </div>

              {/* Vending machines inventory (Viewable by everyone) */}
              <div className="space-y-4">
                <h4 className="text-base font-bold text-slate-800">Campus Vending Machines Stocks</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  {vendingInventory.map((item) => {
                    const isLow = item.quantity <= 3;
                    return (
                      <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden flex flex-col justify-between">
                        <div>
                          <span className="block text-[10px] text-slate-405 font-bold uppercase tracking-wider">{item.location}</span>
                          <h5 className="font-extrabold text-slate-800 text-sm mt-1">{item.item_name}</h5>
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-200/60 pt-3 mt-4">
                          <div>
                            <span className="block text-[10px] text-slate-400 font-bold">STOCK COUNT</span>
                            <span className={`text-base font-extrabold ${isLow ? 'text-rose-600 animate-pulse' : 'text-slate-800'}`}>
                              {item.quantity} / {item.max_quantity}
                            </span>
                          </div>
                          {isPurchaseOfficer && isLow && (
                            <button
                              onClick={() => handleRefillVending(item.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-extrabold py-1.5 px-3 rounded-lg shadow-sm"
                            >
                              Refill
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Store procurement & requisitions (Purchase Officer & Faculty) */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pt-8 border-t border-slate-100">
                {/* Stationery Request form */}
                {!isStudent && (
                  <form onSubmit={handleRequestStoreItem} className="bg-slate-50 p-5 rounded-2xl border border-slate-200/50 space-y-4 self-start">
                    <h4 className="text-base font-bold text-slate-800">Request Stationery from Central Store</h4>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Select Stationery Item</label>
                      <select
                        value={storeForm.itemId}
                        onChange={(e) => setStoreForm({...storeForm, itemId: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 cursor-pointer"
                      >
                        <option value="">-- Choose Item --</option>
                        {storeInventory.map(item => <option key={item.id} value={item.id}>{item.item_name} (Qty: {item.quantity})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={storeForm.quantity}
                        onChange={(e) => setStoreForm({...storeForm, quantity: parseInt(e.target.value)})}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                      />
                    </div>
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl shadow-md w-full">
                      Submit Requisition
                    </button>
                  </form>
                )}

                {/* Purchase Officer Ledger tables */}
                {isPurchaseOfficer && (
                  <div className="xl:col-span-2 space-y-6">
                    {/* Store inventory */}
                    <div className="space-y-3">
                      <h4 className="text-base font-bold text-slate-800">Central Store Inventory Ledger</h4>
                      <div className="overflow-x-auto bg-white border border-slate-200 rounded-2xl shadow-sm">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase">
                              <th className="p-3">Stationery Item</th>
                              <th className="p-3 text-right">Available Stock</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-sm">
                            {storeInventory.map((item) => (
                              <tr key={item.id}>
                                <td className="p-3 font-bold text-slate-750">{item.item_name}</td>
                                <td className="p-3 text-right font-extrabold text-indigo-600">{item.quantity} {item.unit}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Faculty requisitions */}
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                      <h4 className="text-base font-bold text-slate-800">Faculty Store Requisitions Ledger</h4>
                      <div className="overflow-x-auto bg-white border border-slate-200 rounded-2xl shadow-sm">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase">
                              <th className="p-3">Staff</th>
                              <th className="p-3">Item details</th>
                              <th className="p-3">Status</th>
                              <th className="p-3">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-sm">
                            {storeRequisitions.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="p-8 text-center text-slate-400 font-semibold">No requisitions logged.</td>
                              </tr>
                            ) : (
                              storeRequisitions.map((req) => (
                                <tr key={req.id} className="hover:bg-slate-50/50">
                                  <td className="p-3 font-bold text-slate-705">
                                    {req.user?.first_name} {req.user?.last_name}
                                    <span className="block text-[10px] text-slate-400 uppercase">{req.user?.username}</span>
                                  </td>
                                  <td className="p-3 text-xs">
                                    <span className="block font-bold text-slate-600">{req.item?.item_name}</span>
                                    <span className="block text-slate-400">Requested: {req.quantity} units</span>
                                  </td>
                                  <td className="p-3 text-xs font-extrabold uppercase">
                                    <span className={`px-2 py-0.5 rounded ${
                                      req.status === 'DISBURSED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                    }`}>
                                      {req.status}
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    {req.status === 'PENDING' && (
                                      <button
                                        onClick={() => handleUpdateRequisitionStatus(req.id, 'DISBURSED')}
                                        className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold py-1 px-2.5 rounded shadow-sm"
                                      >
                                        Disburse Item
                                      </button>
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
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
