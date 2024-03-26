const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define the Channel schema
const channelSchema = new Schema({
  _id: {
    type: String,
    required: true,
  },
  hostname: {
    type: String,
    required: true,
  },
  port: {
    type: Number,
    required: true,
  },
  // Add more properties as needed
});

// Create the Channel model
const Channel = mongoose.model('Channel', channelSchema);

// Function to initialize the database and create a channel
async function initializeDatabase() {
  try {
    // Connect to the MongoDB database
    await mongoose.connect('mongodb+srv://julian1234:password2005@cluster0.oyimqiz.mongodb.net/channels', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Create a channel (you can customize this based on your needs)
    const defaultChannel = {
      _id: 'default',
      hostname: 'wazobia.live',
      port: 8333,
    };

    // Insert the default channel into the channels collection
    await Channel.create(defaultChannel);

    console.log('Default channel created successfully.');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  } finally {
    // Disconnect from the MongoDB database
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Initialize the database and create a default channel
initializeDatabase();
