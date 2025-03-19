const express = require('express');
const supabase = require('../db');
const verifyToken = require('../auth/token');

const router = express.Router();

// Add a new bus (accessible by operators only)
router.post('/operator/buses', verifyToken, async (req, res) => {
  if (req.user.role !== 'operator') {
    return res.status(403).json({ error: 'Unauthorized - Operator access required' });
  }

  const { name, total_seats } = req.body;
  if (!name || !total_seats) {
    return res.status(400).json({ error: 'Bus name and total seats are required' });
  }

  try {
    // Insert bus into the 'buses' table
    const { data, error } = await supabase
      .from('buses')
      .insert([{ name, total_seats }])
      .select();

    if (error) {
      return res.status(500).json({ error: 'Database error while adding bus' });
    }

    res.status(201).json(data[0]);
  } catch (err) {
    console.error('Error adding bus:', err);
    res.status(500).json({ error: 'Database error while adding bus' });
  }
});

// Get all buses (accessible to everyone)
router.get('/buses', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('buses')
      .select('*');

    if (error) {
      return res.status(500).json({ error: 'Database error while fetching buses' });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error('Error fetching buses:', err);
    res.status(500).json({ error: 'Database error while fetching buses' });
  }
});

// Add a new schedule (accessible by operators only)
router.post('/operator/schedules', verifyToken, async (req, res) => {
  if (req.user.role !== 'operator') {
    return res.status(403).json({ error: 'Unauthorized - Operator access required' });
  }

  const { bus_id, departure_time, arrival_time, starting_point, destination } = req.body;
  if (!bus_id || !departure_time || !arrival_time || !starting_point || !destination) {
    return res.status(400).json({ error: 'All schedule fields are required' });
  }

  try {
    // Insert schedule into the 'schedules' table
    const { data, error } = await supabase
      .from('schedules')
      .insert([{ bus_id, departure_time, arrival_time, starting_point, destination }])
      .select();

    if (error) {
      return res.status(500).json({ error: 'Database error while adding schedule' });
    }

    res.status(201).json(data[0]);
  } catch (err) {
    console.error('Error adding schedule:', err);
    res.status(500).json({ error: 'Database error while adding schedule' });
  }
});

// Get all schedules
router.get('/schedules', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .select('*');

    if (error) {
      return res.status(500).json({ error: 'Database error while fetching schedules' });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error('Error fetching schedules:', err);
    res.status(500).json({ error: 'Database error while fetching schedules' });
  }
});

// Get seat availability for a schedule
router.get('/seats/:scheduleId', async (req, res) => {
  const { scheduleId } = req.params;
  try {
    // Fetch the bus associated with the schedule
    const { data: schedule, error: scheduleError } = await supabase
      .from('schedules')
      .select('bus_id')
      .eq('id', scheduleId)
      .single();

    if (scheduleError || !schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const { data: bus, error: busError } = await supabase
      .from('buses')
      .select('total_seats')
      .eq('id', schedule.bus_id)
      .single();

    if (busError || !bus) {
      return res.status(500).json({ error: 'Bus not found' });
    }

    // Fetch the booked seats for the given schedule
    const { data: bookedSeats, error: bookedSeatsError } = await supabase
      .from('bookings')
      .select('seat_number')
      .eq('schedule_id', scheduleId);

    if (bookedSeatsError) {
      return res.status(500).json({ error: 'Error fetching booked seats' });
    }

    // Generate the list of available seats
    const availableSeats = [];
    for (let i = 1; i <= bus.total_seats; i++) {
      availableSeats.push({
        seat_number: i,
        is_available: !bookedSeats.some(booking => booking.seat_number === i),
      });
    }

    res.status(200).json(availableSeats);
  } catch (err) {
    console.error('Error fetching seat availability:', err);
    res.status(500).json({ error: 'Error fetching seat availability' });
  }
});

// Book a specific seat (accessible by authenticated users)
router.post('/bookings', verifyToken, async (req, res) => {
  const { user_name, schedule_id, seat_number } = req.body;
  if (!user_name || !schedule_id || !seat_number) {
    return res.status(400).json({ error: 'User name, schedule ID, and seat number are required' });
  }

  try {
    // Fetch the schedule to ensure it exists
    const { data: schedule, error: scheduleError } = await supabase
      .from('schedules')
      .select('*')
      .eq('id', schedule_id)
      .single();

    if (scheduleError || !schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Fetch the bus to ensure it exists
    const { data: bus, error: busError } = await supabase
      .from('buses')
      .select('total_seats')
      .eq('id', schedule.bus_id)
      .single();

    if (busError || !bus) {
      return res.status(500).json({ error: 'Bus not found' });
    }

    // Check if the seat is already booked
    const { data: bookedSeats, error: bookedSeatsError } = await supabase
      .from('bookings')
      .select('seat_number')
      .eq('schedule_id', schedule_id);

    if (bookedSeatsError) {
      return res.status(500).json({ error: 'Error checking booked seats' });
    }

    if (bookedSeats.some(booking => booking.seat_number === seat_number)) {
      return res.status(400).json({ error: 'This seat is already booked' });
    }

    // Insert the booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([{ user_name, bus_id: schedule.bus_id, schedule_id, seat_number }])
      .select();

    if (bookingError) {
      return res.status(500).json({ error: 'Database error while booking seat' });
    }

    res.status(201).json(booking[0]);
  } catch (err) {
    console.error('Error booking seat:', err);
    res.status(500).json({ error: 'Database error while booking seat' });
  }
});

module.exports = router;
