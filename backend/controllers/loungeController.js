import sqlQuery from '../utils/db.js';

export const listLounges = async (_req, res) => {
  try {
    const rows = await sqlQuery('SELECT * FROM lounges ORDER BY name');
    res.json(rows);
  } catch (err) {
    console.error('List Lounges Error:', err);
    res.status(500).json({ message: 'Server error listing lounges' });
  }
};

export const addLounge = async (req, res) => {
  const { name, location, capacity } = req.body;
  if (!name || !location || capacity == null) {
    return res
      .status(400)
      .json({ message: 'name, location, and capacity required' });
  }
  try {
    const result = await sqlQuery(
      'INSERT INTO lounges (name, location, capacity) VALUES (?, ?, ?)',
      [name, location, capacity]
    );
    res.status(201).json({ message: 'Lounge added', lounge_id: result.insertId });
  } catch (err) {
    console.error('Add Lounge Error:', err);
    res.status(500).json({ message: 'Server error adding lounge' });
  }
};

// In loungeController.js - assignLounge
export const assignLounge = async (req, res) => {
  const bookingId = Number(req.params.bid);
  const { lounge_id } = req.body;

  try {
    // Verify booking exists
    const [booking] = await sqlQuery(
      'SELECT booking_id FROM bookings WHERE booking_id = ?',
      [bookingId]
    );
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Verify lounge exists
    const [lounge] = await sqlQuery(
      'SELECT lounge_id FROM lounges WHERE lounge_id = ?',
      [lounge_id]
    );
    if (!lounge) return res.status(404).json({ message: 'Lounge not found' });

    // Insert access
    const result = await sqlQuery(
      'INSERT INTO lounge_access (booking_id, lounge_id) VALUES (?, ?)',
      [bookingId, lounge_id]
    );

    res.status(201).json({ 
      message: 'Lounge access granted',
      access_id: result.insertId
    });
  } catch (err) {
    console.error('Assign Lounge Error:', err);
    res.status(500).json({ message: 'Server error granting access' });
  }
};

export const listMyLounges = async (req, res) => {
  const bookingId = Number(req.params.bid);
  const userId    = req.user.id;
  try {
    // verify booking belongs to user
    const bk = await sqlQuery(
      'SELECT user_id FROM bookings WHERE booking_id = ?',
      [bookingId]
    );
    if (!bk.length || bk[0].user_id !== userId) {
      return res.status(403).json({ message: 'Not your booking' });
    }
    const rows = await sqlQuery(
      `SELECT la.access_id, l.lounge_id, l.name, l.location, l.capacity, la.access_time
         FROM lounge_access la
         JOIN lounges l ON la.lounge_id = l.lounge_id
        WHERE la.booking_id = ?`,
      [bookingId]
    );
    res.json(rows);
  } catch (err) {
    console.error('List My Lounges Error:', err);
    res.status(500).json({ message: 'Server error listing my lounges' });
  }
};

export const removeLoungeAccess = async (req, res) => {
  const id = Number(req.params.id);
  try {
    await sqlQuery('DELETE FROM lounge_access WHERE access_id = ?', [id]);
    res.json({ message: 'Lounge access revoked' });
  } catch (err) {
    console.error('Remove Lounge Access Error:', err);
    res.status(500).json({ message: 'Server error revoking lounge access' });
  }
};

// Get all lounge accesses (admin only)
export const listAllLoungeAccess = async (_req, res) => {
  try {
    const rows = await sqlQuery(`
      SELECT la.*, l.name 
      FROM lounge_access la
      JOIN lounges l ON la.lounge_id = l.lounge_id
      ORDER BY access_time DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('List All Lounge Access Error:', err);
    res.status(500).json({ message: 'Server error listing lounge accesses' });
  }
};