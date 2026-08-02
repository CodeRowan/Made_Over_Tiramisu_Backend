/**
 * Setup Script - Initialize Database with Admin User and Starter Content
 *
 * Run this script once (after connecting to a fresh MongoDB database) to create:
 * 1. Admin user (admin@tiramisu.com)
 * 2. Owner information
 * 3. Default content sections (hero, about, story, video, testimonials,
 *    instagram, map, contact, footer)
 * 4. A few sample products, testimonials, Instagram posts, and locations so
 *    the landing page isn't empty on first run — edit/replace these from the
 *    admin panel afterwards.
 *
 * Command: node setup-initial-data.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcryptjs from 'bcryptjs';

// Load environment variables
dotenv.config();

// Import models
import User from './src/models/User.js';
import Owner from './src/models/Owner.js';
import Content from './src/models/Content.js';
import Product from './src/models/Product.js';
import Testimonial from './src/models/Testimonial.js';
import InstagramPost from './src/models/InstagramPost.js';
import Location from './src/models/Location.js';

const MONGODB_URI = process.env.MONGODB_URI;

// Lorem Picsum placeholder images — replace with real Cloudinary uploads via
// the admin panel once you have product/Instagram photos ready.
const PLACEHOLDER_IMAGE = (seed, size = 600) => `https://picsum.photos/seed/${seed}/${size}/${size}`;

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    return false;
  }
};

/**
 * Create admin user
 */
const createAdminUser = async () => {
  const existingUser = await User.findOne({ email: 'admin@tiramisu.com' });

  if (existingUser) {
    console.log('ℹ️  Admin user already exists');
    return existingUser;
  }

  const hashedPassword = await bcryptjs.hash('password123', 10);

  const adminUser = await User.create({
    email: 'admin@tiramisu.com',
    password: hashedPassword,
    name: 'Admin',
    role: 'super_admin',
    isActive: true,
  });

  console.log('✅ Admin user created:');
  console.log('   Email: admin@tiramisu.com');
  console.log('   Password: password123');
  console.log('   Role: super_admin');

  return adminUser;
};

/**
 * Create owner information (used as the "send contact form emails to" address)
 */
const createOwner = async () => {
  const existingOwner = await Owner.findOne();

  if (existingOwner) {
    console.log('ℹ️  Owner information already exists');
    return existingOwner;
  }

  const owner = await Owner.create({
    name: 'Mad Over Tiramisu',
    businessName: 'Mad Over Tiramisu',
    email: 'owner@tiramisu.com',
    phone: '+61 400 000 001',
    address: 'Hope Island & Emerald Lakes',
    city: 'Gold Coast',
    state: 'QLD',
    country: 'Australia',
    isActive: true,
  });

  console.log('✅ Owner information created (used as contact-form recipient)');
  return owner;
};

/**
 * Create default content sections
 */
const createDefaultContent = async (adminId) => {
  const sections = [
    {
      section: 'hero',
      title: 'Mad Over Tiramisu',
      subtitle: "We Didn't Make 20 Desserts. We Perfected One.",
      description:
        'A classic Italian dessert with coffee soaked layers,\nrich mascarpone cream and a dusting of cocoa.',
    },
    {
      section: 'about',
      title: 'One Recipe.',
      subtitle: 'Pure Obsession.',
      description:
        'Mad Over Tiramisu was born from a simple obsession — the original Italian tiramisu, untouched, uncompromised. No fusions. No twists.\n\nEvery container we make starts with the same question: does this taste exactly as it should? No shortcuts. No substitutes. Just honest, beautiful ingredients — quality espresso, proper savoiardi, premium mascarpone, and a cloud of fine cocoa.\n\nHand-built in small batches across Gold Coast, Australia — ready to make you fall mad in love with every spoon.',
    },
    {
      section: 'story',
      title: 'Our Story',
      subtitle: 'One recipe. Pure obsession.',
      description:
        'Mad Over Tiramisu was born from a simple obsession — the original Italian tiramisu, untouched, uncompromised. No fusions. No twists.\n\nHand-built in small batches across Australia — ready to make you fall mad in love with every spoon.\n\nEvery jar, every cup, every cake is crafted with the finest mascarpone, espresso-soaked savoiardi, and a generous dusting of premium cocoa.',
    },
    {
      section: 'video',
      title: 'The Art of the Perfect Spoon',
      description: 'Watch how we create our signature tiramisu',
      videoId: 'dQw4w9WgXcQ',
    },
    {
      section: 'testimonials',
      title: 'Mad in Love with Every Spoon',
      description: 'Hear from our happy customers',
    },
    {
      section: 'instagram',
      title: 'mad_over_tiramisu',
      description:
        "Gold Coast's newest tiramisu obsession · Crafted by the team behind Mad over Italian · Made authentically fresh daily 🤎",
    },
    {
      section: 'map',
      title: 'Come Find Your Spoon',
      description: 'Find us at our locations',
    },
    {
      section: 'contact',
      title: 'Get in Touch',
      description: 'We love hearing from our customers',
    },
    {
      section: 'footer',
      title: 'Mad Over Tiramisu',
      subtitle: 'AUSTRALIA',
      description:
        'One recipe. Pure obsession. Hand-crafted tiramisu made fresh daily across Gold Coast, Australia.',
      email: 'hello@madovertiramisu.com.au',
      phone: '+61 400 000 001',
      address: 'Hope Island & Emerald Lakes, QLD',
    },
  ];

  for (const sectionData of sections) {
    const existing = await Content.findOne({ section: sectionData.section });

    if (!existing) {
      await Content.create({ ...sectionData, updatedBy: adminId });
      console.log(`✅ Created content section: ${sectionData.section}`);
    } else {
      console.log(`ℹ️  Content section already exists: ${sectionData.section}`);
    }
  }
};

/**
 * Create a handful of sample products (placeholder images — swap for real
 * photos via Admin > Products)
 */
const createSampleProducts = async (adminId) => {
  const existingCount = await Product.countDocuments();
  if (existingCount > 0) {
    console.log('ℹ️  Products already exist, skipping sample products');
    return;
  }

  const products = [
    {
      name: 'Classic Tiramisu Cake',
      price: 32,
      description:
        'Our iconic round tiramisu — coffee-soaked savoiardi, velvety mascarpone, dusted with premium cocoa. Feeds 4–6 people.',
      image: PLACEHOLDER_IMAGE('classic-cake'),
      category: 'classic',
      isAvailable: true,
    },
    {
      name: 'Classic Tiramisu Cup',
      price: 14,
      description:
        'The original. Espresso-soaked layers, silky mascarpone cream, and a generous cocoa dusting — in a hand-crafted cup.',
      image: PLACEHOLDER_IMAGE('classic-cup'),
      category: 'classic',
      isAvailable: true,
    },
    {
      name: 'Lotus Biscoff Tiramisu Cup',
      price: 15,
      description:
        'A caramelised Lotus Biscoff twist on the classic — with a whole biscuit on top and layers of spiced cream beneath.',
      image: PLACEHOLDER_IMAGE('lotus-cup'),
      category: 'variation',
      isAvailable: true,
    },
    {
      name: 'Pistachio Tiramisu Cup',
      price: 15,
      description:
        'Pistachio cream drizzled over crushed nuts, layered atop our classic mascarpone base. Rich, nutty, unforgettable.',
      image: PLACEHOLDER_IMAGE('pistachio-cup'),
      category: 'seasonal',
      isAvailable: true,
    },
  ];

  for (const p of products) {
    await Product.create({ ...p, createdBy: adminId });
  }
  console.log(`✅ Created ${products.length} sample products (placeholder images — replace via Admin > Products)`);
};

/**
 * Create sample testimonials
 */
const createSampleTestimonials = async (adminId) => {
  const existingCount = await Testimonial.countDocuments();
  if (existingCount > 0) {
    console.log('ℹ️  Testimonials already exist, skipping sample testimonials');
    return;
  }

  const testimonials = [
    { name: 'Sophie M.', location: 'Hope Island, QLD', text: "I've tried tiramisu all over the world and this is genuinely the best I've ever had. The mascarpone is so light, the coffee hit is perfect. Absolutely obsessed.", rating: 5, order: 0 },
    { name: 'James R.', location: 'Gold Coast, QLD', text: "Ordered the pistachio cup and it was gone within minutes. The pistachio cream drizzle on top — chef's kiss. Ordering again this weekend.", rating: 5, order: 1 },
    { name: 'Priya K.', location: 'Emerald Lakes, QLD', text: "The classic cake fed our whole family after Sunday dinner. Everyone asked where it was from. I've already placed my second order. Pure perfection.", rating: 5, order: 2 },
    { name: 'Luca B.', location: 'Brisbane, QLD', text: "As an Italian, I'm very picky about tiramisu. This is the real deal — no shortcuts, no weird substitutes. Just authentic, beautiful tiramisu.", rating: 5, order: 3 },
    { name: 'Emma W.', location: 'Surfers Paradise, QLD', text: "The Lotus Biscoff tiramisu is a game changer. I didn't think you could improve on the classic but here we are. Absolutely divine.", rating: 5, order: 4 },
    { name: 'David C.', location: 'Robina, QLD', text: 'Delivery was smooth and the packaging was beautiful. The tiramisu arrived perfectly chilled. This is our new family tradition for birthdays.', rating: 5, order: 5 },
  ];

  for (const t of testimonials) {
    await Testimonial.create({ ...t, createdBy: adminId });
  }
  console.log(`✅ Created ${testimonials.length} sample testimonials`);
};

/**
 * Create sample Instagram posts (placeholder images)
 */
const createSampleInstagramPosts = async (adminId) => {
  const existingCount = await InstagramPost.countDocuments();
  if (existingCount > 0) {
    console.log('ℹ️  Instagram posts already exist, skipping sample posts');
    return;
  }

  const posts = [
    { image: PLACEHOLDER_IMAGE('insta-1'), likes: 284, comments: 18, order: 0 },
    { image: PLACEHOLDER_IMAGE('insta-2'), likes: 412, comments: 31, order: 1 },
    { image: PLACEHOLDER_IMAGE('insta-3'), likes: 197, comments: 22, order: 2 },
    { image: PLACEHOLDER_IMAGE('insta-4'), likes: 638, comments: 54, order: 3 },
    { image: PLACEHOLDER_IMAGE('insta-5'), likes: 521, comments: 44, order: 4 },
    { image: PLACEHOLDER_IMAGE('insta-6'), likes: 309, comments: 27, order: 5 },
  ];

  for (const p of posts) {
    await InstagramPost.create({ ...p, createdBy: adminId });
  }
  console.log(`✅ Created ${posts.length} sample Instagram posts (placeholder images — replace via Admin > Instagram)`);
};

/**
 * Create sample locations
 */
const createSampleLocations = async (adminId) => {
  const existingCount = await Location.countDocuments();
  if (existingCount > 0) {
    console.log('ℹ️  Locations already exist, skipping sample locations');
    return;
  }

  const locations = [
    {
      name: 'Hope Island',
      address: 'Mariners Cove, Hope Island QLD 4212',
      phone: '+61 400 000 001',
      email: 'hello@madovertiramisu.com.au',
      hours: 'Tue–Sun: 10am–6pm',
      mapEmbedUrl:
        'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3521.0!2d153.376!3d-27.893!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjfCsDUzJzM0LjgiUyAxNTPCsDIyJzMzLjYiRQ!5e0!3m2!1sen!2sau!4v1',
      order: 0,
    },
    {
      name: 'Emerald Lakes',
      address: 'Emerald Lakes Dr, Carrara QLD 4211',
      phone: '+61 400 000 002',
      email: 'hello@madovertiramisu.com.au',
      hours: 'Tue–Sun: 10am–6pm',
      mapEmbedUrl:
        'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3524.0!2d153.344!3d-27.990!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjfCsDU5JzIzLjYiUyAxNTPCsDIwJzM4LjQiRQ!5e0!3m2!1sen!2sau!4v1',
      order: 1,
    },
  ];

  for (const l of locations) {
    await Location.create({ ...l, createdBy: adminId });
  }
  console.log(`✅ Created ${locations.length} sample locations`);
};

/**
 * Main setup function
 */
const main = async () => {
  console.log('\n🚀 Starting database initialization...\n');

  try {
    const connected = await connectDB();
    if (!connected) {
      console.error('Failed to connect to MongoDB. Check your .env file.');
      process.exit(1);
    }

    const admin = await createAdminUser();
    await createOwner();
    await createDefaultContent(admin._id);
    await createSampleProducts(admin._id);
    await createSampleTestimonials(admin._id);
    await createSampleInstagramPosts(admin._id);
    await createSampleLocations(admin._id);

    console.log('\n✅ Database initialization complete!\n');
    console.log('You can now login with:');
    console.log('  Email: admin@tiramisu.com');
    console.log('  Password: password123\n');
    console.log('Note: sample products and Instagram posts use placeholder');
    console.log('images from picsum.photos — replace them with real photos');
    console.log('from the admin panel whenever you\'re ready.\n');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Run the setup
main();
