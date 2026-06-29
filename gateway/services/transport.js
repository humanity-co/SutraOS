/**
 * SUTRAOS TRANSPORT ROUTING & SEAT CAPACITY ENGINE
 * Manages driver allocations, bus route tracking, and seat quota checks.
 */

// In-memory bus routes database
const mockBusRoutes = {
  'route-delhi-ncr': {
    route_name: 'Delhi-NCR Route 4',
    bus_number: 'DL-1PB-9907',
    driver_name: 'Satish Singh',
    capacity: 3, // Very small for testing race conditions
    reserved_seats: 0
  }
};

/**
 * Attempts to reserve a student seat ticket on a specific route.
 */
export function reserveBusSeat(studentId, routeId) {
  const route = mockBusRoutes[routeId];
  if (!route) {
    throw new Error('Proposed transport route does not exist.');
  }

  // Check seat capacity limit
  if (route.reserved_seats >= route.capacity) {
    throw new Error(`Transport Block: Route [${route.route_name}] has reached its maximum passenger capacity (${route.capacity}).`);
  }

  route.reserved_seats += 1;
  console.log(`[Transport Engine] Seat allocated: Student ${studentId} on Route ${routeId}. Seats taken: ${route.reserved_seats}/${route.capacity}`);

  return {
    status: 'ALLOCATED',
    route_id: routeId,
    bus_number: route.bus_number,
    driver_name: route.driver_name,
    seat_number: route.reserved_seats
  };
}
