const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const User = require('../models/UserSchema');
const Course = require('../models/course/Course');
const Payment = require('../models/Payment');
const Receipt = require('../models/Receipt');
const BillingSettings = require('../models/BillingSettings');

async function backfillPaymentReceipts() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('MONGO_URI not found in environment');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    let billingSettings = await BillingSettings.findOne({ isActive: true }).lean();
    let companyDetails = {
      name: 'Tathagat Education',
      address: '',
      phone: '',
      email: '',
      gstin: '',
    };

    if (billingSettings) {
      const addressParts = [
        billingSettings.address?.street,
        billingSettings.address?.city,
        billingSettings.address?.state,
        billingSettings.address?.pincode,
        billingSettings.address?.country
      ].filter(Boolean);

      companyDetails = {
        name: billingSettings.companyName || 'Tathagat Education',
        address: addressParts.join(', '),
        phone: billingSettings.phone || '',
        email: billingSettings.email || '',
        gstin: billingSettings.gstNumber || '',
      };
    }

    const users = await User.find({ 'enrolledCourses.0': { $exists: true } });
    console.log(`Found ${users.length} users with enrolled courses`);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of users) {
      const unlockedCourses = (user.enrolledCourses || []).filter(
        (ec) => ec.status === 'unlocked'
      );

      for (const enrollment of unlockedCourses) {
        const courseId = enrollment.courseId;

        if (!courseId) {
          console.log(`  Skipping ${user.email} - undefined courseId`);
          errors++;
          continue;
        }

        const existingPayment = await Payment.findOne({
          userId: user._id,
          courseId: courseId,
          status: 'paid',
        });

        if (existingPayment) {
          console.log(`  Skipping ${user.email} - ${courseId} (payment exists)`);
          skipped++;
          continue;
        }

        const course = await Course.findById(courseId);
        if (!course) {
          console.log(`  Course not found: ${courseId}`);
          errors++;
          continue;
        }

        try {
          const enrolledAt = enrollment.enrolledAt || new Date();
          const finalAmountRupees = course.price || 0;
          const amountInPaise = Math.round(finalAmountRupees * 100);

          const payment = new Payment({
            userId: user._id,
            courseId: courseId,
            razorpay_order_id: `backfill_${user._id}_${courseId}_${enrolledAt.getTime()}`,
            razorpay_payment_id: null,
            amount: amountInPaise,
            originalAmount: amountInPaise,
            currency: 'INR',
            status: 'paid',
            paymentMethod: 'manual',
            notes: 'Backfilled from existing enrollment',
            validityStartDate: enrolledAt,
          });
          payment.createdAt = enrolledAt;
          payment.updatedAt = enrolledAt;
          await payment.save();

          const receiptNumber = Receipt.generateReceiptNumber();
          const receipt = new Receipt({
            paymentId: payment._id,
            userId: user._id,
            courseId: courseId,
            receiptNumber,
            amount: amountInPaise,
            totalAmount: amountInPaise,
            taxAmount: 0,
            currency: 'INR',
            customerDetails: {
              name: user.name || 'Student',
              email: user.email || 'no-email@example.com',
              phone: user.phoneNumber || '',
            },
            courseDetails: {
              name: course.name || 'Course',
              description: course.description || '',
              price: amountInPaise,
            },
            companyDetails,
            receiptType: 'course_purchase',
            status: 'generated',
            generatedAt: enrolledAt,
          });
          receipt.createdAt = enrolledAt;
          receipt.updatedAt = enrolledAt;
          await receipt.save();

          console.log(`  Created payment & receipt for ${user.email} - ${course.name}`);
          created++;
        } catch (err) {
          console.error(`  Error for ${user.email} - ${courseId}:`, err.message);
          errors++;
        }
      }
    }

    console.log('\n--- Backfill Complete ---');
    console.log(`Created: ${created}`);
    console.log(`Skipped (already exist): ${skipped}`);
    console.log(`Errors: ${errors}`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (err) {
    console.error('Backfill error:', err);
    process.exit(1);
  }
}

backfillPaymentReceipts();
