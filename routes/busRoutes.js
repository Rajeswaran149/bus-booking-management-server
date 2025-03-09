const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../auth/token');

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
    const result = await pool.query(
      'INSERT INTO buses(name, total_seats) VALUES ($1, $2) RETURNING *',
      [name, total_seats]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding bus:', err);
    res.status(500).json({ error: 'Database error while adding bus' });
  }
});

// Get all buses (accessible to everyone)
router.get('/buses', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM buses');
    res.status(200).json(result.rows);
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
    const result = await pool.query(
      'INSERT INTO schedules(bus_id, departure_time, arrival_time, starting_point, destination) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [bus_id, departure_time, arrival_time, starting_point, destination]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding schedule:', err);
    res.status(500).json({ error: 'Database error while adding schedule' });
  }
});

// Get all schedules
router.get('/schedules', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM schedules');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching schedules:', err);
    res.status(500).json({ error: 'Database error while fetching schedules' });
  }
});

// Get seat availability for a schedule
router.get('/seats/:scheduleId', async (req, res) => {
  const { scheduleId } = req.params;
  try {
    const scheduleResult = await pool.query('SELECT bus_id FROM schedules WHERE id = $1', [scheduleId]);
    const schedule = scheduleResult.rows[0];
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const busResult = await pool.query('SELECT total_seats FROM buses WHERE id = $1', [schedule.bus_id]);
    const bus = busResult.rows[0];

    const bookedSeatsResult = await pool.query('SELECT seat_number FROM bookings WHERE schedule_id = $1', [scheduleId]);
    const bookedSeats = bookedSeatsResult.rows.map(row => row.seat_number);

    const availableSeats = [];
    for (let i = 1; i <= bus.total_seats; i++) {
      availableSeats.push({
        seat_number: i,
        is_available: !bookedSeats.includes(i), // If the seat is not booked
      });
    }

    res.status(200).json(availableSeats);
  } catch (err) {
    console.error('Error fetching seat availability:', err);
    res.status(500).json({ error: 'Database error while fetching seat availability' });
  }
});

// Book a specific seat (accessible by authenticated users)
router.post('/bookings', verifyToken, async (req, res) => {
  const { user_name, schedule_id, seat_number } = req.body;
  if (!user_name || !schedule_id || !seat_number) {
    return res.status(400).json({ error: 'User name, schedule ID, and seat number are required' });
  }

  try {
    const scheduleResult = await pool.query('SELECT * FROM schedules WHERE id = $1', [schedule_id]);
    const schedule = scheduleResult.rows[0];
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const busResult = await pool.query('SELECT total_seats FROM buses WHERE id = $1', [schedule.bus_id]);
    const bus = busResult.rows[0];

    const bookedSeatsResult = await pool.query('SELECT seat_number FROM bookings WHERE schedule_id = $1', [schedule_id]);
    const bookedSeats = bookedSeatsResult.rows.map(row => row.seat_number);

    if (bookedSeats.includes(seat_number)) {
      return res.status(400).json({ error: 'This seat is already booked' });
    }

    const bookingResult = await pool.query(
      'INSERT INTO bookings(user_name, bus_id, schedule_id, seat_number) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_name, schedule.bus_id, schedule_id, seat_number]
    );

    res.status(201).json(bookingResult.rows[0]);
  } catch (err) {
    console.error('Error booking seat:', err);
    res.status(500).json({ error: 'Database error while booking seat' });
  }
});

module.exports = router;
