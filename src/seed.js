const { connectDB, getDB, getFallbackStore } = require('./db');

const sampleEvents = [
  {
    title: "Winter Warmth: Blanket Distribution for Needy Families",
    description: "Join our annual drive to collect and distribute high-grade thermal blankets and sweaters to underprivileged street families living near Mohammadpur and surrounding slum clusters.",
    eventType: "Donation",
    thumbnail: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80",
    location: "Mohammadpur Town Hall Ground, Dhaka",
    daysFromNow: 5,
    creatorEmail: "organizer@kindredacts.org",
    creatorName: "Rahim Chowdhury"
  },
  {
    title: "Mirpur Community Winter Clothes & Footwear Drive",
    description: "Distributing clean, warm winter coats, hoodies, and shoes to disadvantaged children and daily wage workers before the freezing peak of December.",
    eventType: "Donation",
    thumbnail: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1200&q=80",
    location: "Mirpur 10 Community Center, Dhaka",
    daysFromNow: 8,
    creatorEmail: "organizer@kindredacts.org",
    creatorName: "Nusrat Jahan"
  },
  {
    title: "Urban Greenery: 500 Native Tree Plantation",
    description: "Combating urban heat and air pollution by planting fruit and shade trees along school perimeters, public walkways, and open recreational parks.",
    eventType: "Plantation",
    thumbnail: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80",
    location: "Uttara Sector 11 Eco Park, Dhaka",
    daysFromNow: 12,
    creatorEmail: "greenearth@kindredacts.org",
    creatorName: "Tanvir Ahmed"
  },
  {
    title: "Lake Cleanliness & Plastic Interception Drive",
    description: "Equipped with safety gloves and recycling bags, volunteers will pull floating plastic bags, bottles, and debris from Dhanmondi Lake banks to restore aquatic life.",
    eventType: "Cleanup",
    thumbnail: "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=1200&q=80",
    location: "Dhanmondi Lake Amphitheatre, Dhaka",
    daysFromNow: 16,
    creatorEmail: "cleanwaves@kindredacts.org",
    creatorName: "Ayesha Siddiqua"
  },
  {
    title: "Free Healthcare & Eye Checkup Camp for Slum Residents",
    description: "A team of volunteer certified physicians and ophthalmologists will conduct basic medical screenings, blood sugar tests, and prescribe free glasses to elderly citizens.",
    eventType: "Healthcare",
    thumbnail: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80",
    location: "Korail Slum Health Outpost, Mohakhali, Dhaka",
    daysFromNow: 21,
    creatorEmail: "healthfirst@kindredacts.org",
    creatorName: "Dr. Farhan Kabir"
  },
  {
    title: "Street Children Literacy & School Bag Distribution",
    description: "Inspiring underprivileged young learners by handing out backpacks loaded with notebooks, colored pencils, alphabet books, and healthy lunch boxes.",
    eventType: "Education",
    thumbnail: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80",
    location: "Kamalapur Railway School Shed, Dhaka",
    daysFromNow: 25,
    creatorEmail: "futurestars@kindredacts.org",
    creatorName: "Sadia Rahman"
  },
  {
    title: "Flood Relief Nutritional Food Box Assembly",
    description: "Packaging dry food supplies (rice, lentils, flattened rice, molasses, water purification tablets) for flash-flood affected riverside families.",
    eventType: "Donation",
    thumbnail: "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1200&q=80",
    location: "Tejgaon Industrial Area Relief Warehouse, Dhaka",
    daysFromNow: 30,
    creatorEmail: "reliefaid@kindredacts.org",
    creatorName: "Kamrul Islam"
  }
];

async function seedData() {
  const db = await connectDB();
  const now = Date.now();

  const formattedEvents = sampleEvents.map(e => ({
    title: e.title,
    description: e.description,
    eventType: e.eventType,
    thumbnail: e.thumbnail,
    location: e.location,
    eventDate: new Date(now + e.daysFromNow * 24 * 60 * 60 * 1000),
    creatorEmail: e.creatorEmail,
    creatorName: e.creatorName,
    createdAt: new Date()
  }));

  if (db) {
    const eventsCollection = db.collection('events');
    const count = await eventsCollection.countDocuments();
    if (count === 0) {
      await eventsCollection.insertMany(formattedEvents);
      console.log(`[Seed] Successfully inserted ${formattedEvents.length} events into MongoDB.`);
    } else {
      console.log(`[Seed] MongoDB already contains ${count} events.`);
    }
  } else {
    const store = getFallbackStore();
    if (store.events.length === 0) {
      store.events = formattedEvents.map((e, idx) => ({
        ...e,
        _id: `evt_mock_${idx + 1}`
      }));
      console.log(`[Seed] In-memory store seeded with ${store.events.length} initial events.`);
    }
  }
}

module.exports = { seedData, sampleEvents };

if (require.main === module) {
  seedData().then(() => {
    console.log("Seeding complete.");
    process.exit(0);
  });
}
