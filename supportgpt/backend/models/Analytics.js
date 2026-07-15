import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
    },
    questions: {
      type: Number,
      default: 0,
    },
    uploads: {
      type: Number,
      default: 0,
    },
    users: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

analyticsSchema.index({ date: -1 });

// Static method to increment a field for today
analyticsSchema.statics.increment = async function (field) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await this.findOneAndUpdate(
    { date: today },
    { $inc: { [field]: 1 } },
    { upsert: true, new: true }
  );
};

const Analytics = mongoose.model('Analytics', analyticsSchema);

export default Analytics;
