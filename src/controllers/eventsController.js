const { ObjectId } = require('mongodb');
const { getDB, getFallbackStore } = require('../db');

// Helper to convert string or ObjectId
function toObjectId(id) {
  try {
    return new ObjectId(id);
  } catch (err) {
    return null;
  }
}

// 1. GET RECENT 6 UPCOMING EVENTS (Public - MongoDB .limit(6))
async function getRecentEvents(req, res) {
  try {
    const now = new Date();
    const db = getDB();

    if (db) {
      const eventsCollection = db.collection('events');
      // Must use .limit() operator of MongoDB as explicitly stated in prompt!
      const recentEvents = await eventsCollection
        .find({
          eventDate: { $gte: now }
        })
        .sort({ eventDate: 1 })
        .limit(6)
        .toArray();

      return res.status(200).json({
        success: true,
        count: recentEvents.length,
        data: recentEvents
      });
    } else {
      const store = getFallbackStore();
      const recentEvents = store.events
        .filter(e => new Date(e.eventDate) >= now)
        .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))
        .slice(0, 6);

      return res.status(200).json({
        success: true,
        count: recentEvents.length,
        data: recentEvents
      });
    }
  } catch (error) {
    console.error('Error fetching recent events:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch recent events.'
    });
  }
}

// 2. GET ALL UPCOMING EVENTS (Public - Filtered so past events do not appear)
async function getUpcomingEvents(req, res) {
  try {
    const now = new Date();
    const { search, category } = req.query;
    const db = getDB();

    const query = {
      eventDate: { $gte: now }
    };

    if (category && category !== 'All') {
      query.eventType = category;
    }

    if (search && search.trim() !== '') {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { location: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    if (db) {
      const eventsCollection = db.collection('events');
      const events = await eventsCollection
        .find(query)
        .sort({ eventDate: 1 })
        .toArray();

      return res.status(200).json({
        success: true,
        count: events.length,
        data: events
      });
    } else {
      const store = getFallbackStore();
      let events = store.events.filter(e => new Date(e.eventDate) >= now);

      if (category && category !== 'All') {
        events = events.filter(e => e.eventType === category);
      }

      if (search && search.trim() !== '') {
        const s = search.trim().toLowerCase();
        events = events.filter(e =>
          (e.title && e.title.toLowerCase().includes(s)) ||
          (e.location && e.location.toLowerCase().includes(s)) ||
          (e.description && e.description.toLowerCase().includes(s))
        );
      }

      events.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

      return res.status(200).json({
        success: true,
        count: events.length,
        data: events
      });
    }
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming events.'
    });
  }
}

// 3. GET SINGLE EVENT BY ID (Public)
async function getEventById(req, res) {
  try {
    const { id } = req.params;
    const db = getDB();

    if (db) {
      const objId = toObjectId(id);
      if (!objId) {
        return res.status(400).json({ success: false, message: 'Invalid event ID format.' });
      }

      const eventsCollection = db.collection('events');
      const event = await eventsCollection.findOne({ _id: objId });

      if (!event) {
        return res.status(404).json({ success: false, message: 'Event not found.' });
      }

      return res.status(200).json({
        success: true,
        data: event
      });
    } else {
      const store = getFallbackStore();
      const event = store.events.find(e => e._id.toString() === id.toString());

      if (!event) {
        return res.status(404).json({ success: false, message: 'Event not found.' });
      }

      return res.status(200).json({
        success: true,
        data: event
      });
    }
  } catch (error) {
    console.error('Error fetching event details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch event details.'
    });
  }
}

// 4. CREATE EVENT (Protected)
async function createEvent(req, res) {
  try {
    const { title, description, eventType, thumbnail, location, eventDate } = req.body;
    const creatorEmail = req.user.email;
    const creatorName = req.user.name;

    // Validation
    if (!title || !description || !eventType || !thumbnail || !location || !eventDate) {
      return res.status(400).json({
        success: false,
        message: 'All fields (title, description, eventType, thumbnail, location, eventDate) are required.'
      });
    }

    const parsedDate = new Date(eventDate);
    const now = new Date();

    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event date provided.'
      });
    }

    // Ensure no past date can be added
    if (parsedDate <= now) {
      return res.status(400).json({
        success: false,
        message: 'Event date must be in the future. Past dates are not allowed.'
      });
    }

    const newEvent = {
      title: title.trim(),
      description: description.trim(),
      eventType: eventType.trim(),
      thumbnail: thumbnail.trim(),
      location: location.trim(),
      eventDate: parsedDate,
      creatorEmail: creatorEmail.toLowerCase(),
      creatorName: creatorName || 'Volunteer Organizer',
      createdAt: new Date()
    };

    const db = getDB();
    if (db) {
      const eventsCollection = db.collection('events');
      const result = await eventsCollection.insertOne(newEvent);

      return res.status(201).json({
        success: true,
        message: 'Event created successfully!',
        data: { ...newEvent, _id: result.insertedId }
      });
    } else {
      const store = getFallbackStore();
      const created = {
        ...newEvent,
        _id: new ObjectId().toString()
      };
      store.events.push(created);

      return res.status(201).json({
        success: true,
        message: 'Event created successfully!',
        data: created
      });
    }
  } catch (error) {
    console.error('Error creating event:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create event.'
    });
  }
}

// 5. GET USER'S CREATED EVENTS (Protected - Manage Events)
async function getUserCreatedEvents(req, res) {
  try {
    const userEmail = req.user.email.toLowerCase();
    const db = getDB();

    if (db) {
      const eventsCollection = db.collection('events');
      const events = await eventsCollection
        .find({ creatorEmail: userEmail })
        .sort({ createdAt: -1 })
        .toArray();

      return res.status(200).json({
        success: true,
        count: events.length,
        data: events
      });
    } else {
      const store = getFallbackStore();
      const events = store.events
        .filter(e => e.creatorEmail === userEmail)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return res.status(200).json({
        success: true,
        count: events.length,
        data: events
      });
    }
  } catch (error) {
    console.error('Error fetching user events:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user events.'
    });
  }
}

// 6. UPDATE EVENT (Protected - Only owner can update)
async function updateEvent(req, res) {
  try {
    const { id } = req.params;
    const userEmail = req.user.email.toLowerCase();
    const { title, description, eventType, thumbnail, location, eventDate } = req.body;

    const db = getDB();

    // Validate update fields if provided
    const updateData = {};
    if (title) updateData.title = title.trim();
    if (description) updateData.description = description.trim();
    if (eventType) updateData.eventType = eventType.trim();
    if (thumbnail) updateData.thumbnail = thumbnail.trim();
    if (location) updateData.location = location.trim();
    if (eventDate) {
      const parsedDate = new Date(eventDate);
      if (isNaN(parsedDate.getTime()) || parsedDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Updated event date must be a valid future date.'
        });
      }
      updateData.eventDate = parsedDate;
    }
    updateData.updatedAt = new Date();

    if (db) {
      const objId = toObjectId(id);
      if (!objId) {
        return res.status(400).json({ success: false, message: 'Invalid event ID.' });
      }

      const eventsCollection = db.collection('events');
      const existing = await eventsCollection.findOne({ _id: objId });

      if (!existing) {
        return res.status(404).json({ success: false, message: 'Event not found.' });
      }

      if (existing.creatorEmail !== userEmail) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only update events you created.'
        });
      }

      await eventsCollection.updateOne({ _id: objId }, { $set: updateData });
      const updated = await eventsCollection.findOne({ _id: objId });

      return res.status(200).json({
        success: true,
        message: 'Event updated successfully!',
        data: updated
      });
    } else {
      const store = getFallbackStore();
      const existing = store.events.find(e => e._id.toString() === id.toString());

      if (!existing) {
        return res.status(404).json({ success: false, message: 'Event not found.' });
      }

      if (existing.creatorEmail !== userEmail) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only update events you created.'
        });
      }

      Object.assign(existing, updateData);

      return res.status(200).json({
        success: true,
        message: 'Event updated successfully!',
        data: existing
      });
    }
  } catch (error) {
    console.error('Error updating event:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update event.'
    });
  }
}

// 7. DELETE EVENT (Protected - Only owner can delete)
async function deleteEvent(req, res) {
  try {
    const { id } = req.params;
    const userEmail = req.user.email.toLowerCase();
    const db = getDB();

    if (db) {
      const objId = toObjectId(id);
      if (!objId) {
        return res.status(400).json({ success: false, message: 'Invalid event ID.' });
      }

      const eventsCollection = db.collection('events');
      const existing = await eventsCollection.findOne({ _id: objId });

      if (!existing) {
        return res.status(404).json({ success: false, message: 'Event not found.' });
      }

      if (existing.creatorEmail !== userEmail) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only delete events you created.'
        });
      }

      await eventsCollection.deleteOne({ _id: objId });
      // Clean up joined event records
      await db.collection('joined_events').deleteMany({ eventId: id });

      return res.status(200).json({
        success: true,
        message: 'Event deleted successfully.'
      });
    } else {
      const store = getFallbackStore();
      const index = store.events.findIndex(e => e._id.toString() === id.toString());

      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Event not found.' });
      }

      if (store.events[index].creatorEmail !== userEmail) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only delete events you created.'
        });
      }

      store.events.splice(index, 1);
      store.joined_events = store.joined_events.filter(j => j.eventId.toString() !== id.toString());

      return res.status(200).json({
        success: true,
        message: 'Event deleted successfully.'
      });
    }
  } catch (error) {
    console.error('Error deleting event:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete event.'
    });
  }
}

// 8. JOIN EVENT (Protected)
async function joinEvent(req, res) {
  try {
    const { id } = req.params;
    const userEmail = req.user.email.toLowerCase();
    const userName = req.user.name || 'Volunteer';

    const db = getDB();

    if (db) {
      const objId = toObjectId(id);
      if (!objId) {
        return res.status(400).json({ success: false, message: 'Invalid event ID.' });
      }

      const event = await db.collection('events').findOne({ _id: objId });
      if (!event) {
        return res.status(404).json({ success: false, message: 'Event does not exist.' });
      }

      if (new Date(event.eventDate) < new Date()) {
        return res.status(400).json({ success: false, message: 'Cannot join an event that has already passed.' });
      }

      const joinedCollection = db.collection('joined_events');
      const alreadyJoined = await joinedCollection.findOne({
        eventId: id,
        userEmail: userEmail
      });

      if (alreadyJoined) {
        return res.status(400).json({
          success: false,
          message: 'You have already joined this event!'
        });
      }

      const joinRecord = {
        eventId: id,
        eventTitle: event.title,
        eventType: event.eventType,
        eventDate: event.eventDate,
        location: event.location,
        thumbnail: event.thumbnail,
        userEmail: userEmail,
        userName: userName,
        joinedAt: new Date()
      };

      await joinedCollection.insertOne(joinRecord);

      return res.status(201).json({
        success: true,
        message: 'You have successfully joined this event! Thank you for making a difference.',
        data: joinRecord
      });
    } else {
      const store = getFallbackStore();
      const event = store.events.find(e => e._id.toString() === id.toString());

      if (!event) {
        return res.status(404).json({ success: false, message: 'Event does not exist.' });
      }

      if (new Date(event.eventDate) < new Date()) {
        return res.status(400).json({ success: false, message: 'Cannot join an event that has already passed.' });
      }

      const alreadyJoined = store.joined_events.find(
        j => j.eventId.toString() === id.toString() && j.userEmail === userEmail
      );

      if (alreadyJoined) {
        return res.status(400).json({
          success: false,
          message: 'You have already joined this event!'
        });
      }

      const joinRecord = {
        _id: new ObjectId().toString(),
        eventId: id,
        eventTitle: event.title,
        eventType: event.eventType,
        eventDate: event.eventDate,
        location: event.location,
        thumbnail: event.thumbnail,
        userEmail: userEmail,
        userName: userName,
        joinedAt: new Date()
      };

      store.joined_events.push(joinRecord);

      return res.status(201).json({
        success: true,
        message: 'You have successfully joined this event! Thank you for making a difference.',
        data: joinRecord
      });
    }
  } catch (error) {
    console.error('Error joining event:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to join event.'
    });
  }
}

// 9. GET USER'S JOINED EVENTS (Protected - Joined Events Page, Sorted by eventDate)
async function getUserJoinedEvents(req, res) {
  try {
    const userEmail = req.user.email.toLowerCase();
    const db = getDB();

    if (db) {
      const joinedCollection = db.collection('joined_events');
      const joinedList = await joinedCollection
        .find({ userEmail })
        .sort({ eventDate: 1 }) // Sorted by event date
        .toArray();

      return res.status(200).json({
        success: true,
        count: joinedList.length,
        data: joinedList
      });
    } else {
      const store = getFallbackStore();
      const joinedList = store.joined_events
        .filter(j => j.userEmail === userEmail)
        .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

      return res.status(200).json({
        success: true,
        count: joinedList.length,
        data: joinedList
      });
    }
  } catch (error) {
    console.error('Error fetching joined events:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch joined events.'
    });
  }
}

module.exports = {
  getRecentEvents,
  getUpcomingEvents,
  getEventById,
  createEvent,
  getUserCreatedEvents,
  updateEvent,
  deleteEvent,
  joinEvent,
  getUserJoinedEvents
};
